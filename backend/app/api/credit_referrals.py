import os
import re
import secrets
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Set
from backend.app.database.connection import get_db
from backend.app.models.db_models import Agent, User, Transaction, Customer, Referral, Loan
from backend.app.api.auth import get_current_user, get_optional_user, RoleChecker
from backend.app.schemas.schemas import ReferralCreate, ReferralResponse, ConsentResponseRequest
from backend.app.ml.inference import MLInference

router = APIRouter(prefix="", tags=["Customer Credit Referrals"])

agent_only = RoleChecker(["AGENT", "ADMIN"])
institution_only = RoleChecker(["FINANCIAL_INSTITUTION", "ADMIN"])

LENDING_DECISIONS = {"APPROVED", "REJECTED", "UNDER_REVIEW", "MANUAL_REVIEW"}

# Matches "1048", "#1048", "Customer 1048", "Customer #1048"
_CUSTOMER_ID_PATTERN = re.compile(r"(?:customer\s*)?#?\s*(\d+)", re.IGNORECASE)


def _owned_agent_ids(user: User, db: Session) -> Set[int]:
    """All agent branch IDs the user operates (active branch plus owned locations)."""
    ids = {a.agent_id for a in db.query(Agent.agent_id).filter(Agent.owner_id == user.user_id).all()}
    if user.agent_id:
        ids.add(user.agent_id)
    return ids


@router.get("/institutions")
def list_institutions(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists partner financial institutions that can receive customer referrals."""
    institutions = db.query(User).filter(User.role == "FINANCIAL_INSTITUTION").order_by(User.user_id).all()
    return [
        {
            "user_id": u.user_id,
            "name": u.full_name or u.username.replace("_", " ").title()
        }
        for u in institutions
    ]


@router.post("/referrals", response_model=ReferralResponse)
def create_referral(
    req: ReferralCreate,
    current_user = Depends(agent_only),
    db: Session = Depends(get_db)
):
    """
    Agent creates a new customer loan referral and triggers a simulated USSD consent request.
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=400, detail="User is not associated with any agent branch.")
        
    institution = db.query(User).filter(
        User.user_id == req.institution_id,
        User.role == "FINANCIAL_INSTITUTION"
    ).first()
    if not institution:
        raise HTTPException(status_code=400, detail="Selected lending institution does not exist.")

    # Resolve an existing customer by ID reference ("Customer #1048") or exact display name,
    # otherwise create a guest customer profile.
    customer = None
    id_match = _CUSTOMER_ID_PATTERN.fullmatch(req.name.strip())
    if id_match:
        customer = db.query(Customer).filter(Customer.customer_id == int(id_match.group(1))).first()
    if not customer:
        customer = db.query(Customer).filter(Customer.display_name == req.name).first()
    if not customer:
        customer = Customer(
            display_name=req.name,
            consent_status=False
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
    # Check if there is already an active pending request
    pending = db.query(Referral).filter(
        Referral.customer_id == customer.customer_id,
        Referral.consent_status == "AWAITING_CONSENT"
    ).first()
    if pending:
        raise HTTPException(
            status_code=400, 
            detail="A referral for this customer is already awaiting consent."
        )
        
    new_ref = Referral(
        agent_id=current_user.agent_id,
        customer_id=customer.customer_id,
        institution_id=req.institution_id,
        requested_amount=req.requested_amount,
        purpose=req.purpose,
        status="CONSENT_REQUESTED",
        consent_status="AWAITING_CONSENT",
        created_at=datetime.utcnow(),
        consent_requested_at=datetime.utcnow(),
        application_status="PENDING"
    )
    
    db.add(new_ref)
    db.commit()
    db.refresh(new_ref)
    
    # Return formatted response
    res = new_ref.__dict__.copy()
    res["customer_name"] = customer.display_name
    agent_obj = db.query(Agent).filter(Agent.agent_id == new_ref.agent_id).first()
    res["agent_name"] = agent_obj.name if agent_obj else "Unknown"
    return res

@router.get("/referrals", response_model=List[ReferralResponse])
def get_agent_referrals(
    current_user = Depends(agent_only),
    db: Session = Depends(get_db)
):
    """
    Agent lists all referrals they have created.
    """
    if not current_user.agent_id:
        return []
        
    refs = db.query(Referral).filter(Referral.agent_id == current_user.agent_id).all()
    results = []
    for r in refs:
        d = r.__dict__.copy()
        cust = db.query(Customer).filter(Customer.customer_id == r.customer_id).first()
        d["customer_name"] = cust.display_name if cust else "Unknown"
        agent_obj = db.query(Agent).filter(Agent.agent_id == r.agent_id).first()
        d["agent_name"] = agent_obj.name if agent_obj else "Unknown"
        results.append(d)
    return results

@router.get("/institution/referrals", response_model=List[ReferralResponse])
def get_institution_referrals(
    current_user = Depends(institution_only),
    db: Session = Depends(get_db)
):
    """
    Financial Institution lists all incoming referrals routed to them.
    """
    refs = db.query(Referral).filter(Referral.institution_id == current_user.user_id).all()
    results = []
    for r in refs:
        d = r.__dict__.copy()
        cust = db.query(Customer).filter(Customer.customer_id == r.customer_id).first()
        d["customer_name"] = cust.display_name if cust else "Unknown"
        agent_obj = db.query(Agent).filter(Agent.agent_id == r.agent_id).first()
        d["agent_name"] = agent_obj.name if agent_obj else "Unknown"
        results.append(d)
    return results

@router.get("/institution/referral/{referral_id}/profile")
def get_referred_customer_profile(
    referral_id: int,
    current_user = Depends(institution_only),
    db: Session = Depends(get_db)
):
    """
    Financial Institution accesses the customer financial profile ONLY if active consent is granted.
    """
    ref = db.query(Referral).filter(Referral.referral_id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral request not found.")
        
    if ref.institution_id != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden. Referral is assigned to another institution.")
        
    # Verify active consent boundary
    if ref.consent_status != "CONSENT_ACTIVE":
        raise HTTPException(
            status_code=403,
            detail="Customer consent is required before financial information can be accessed."
        )
        
    if ref.consent_expiry and ref.consent_expiry < datetime.utcnow():
        ref.consent_status = "CONSENT_EXPIRED"
        ref.status = "CONSENT_EXPIRED"
        db.commit()
        raise HTTPException(
            status_code=403,
            detail="Customer consent has expired. Access blocked."
        )
        
    # Fetch customer and profile
    customer = db.query(Customer).filter(Customer.customer_id == ref.customer_id).first()
    txs = db.query(Transaction).filter(Transaction.customer_id == ref.customer_id).all()
    loans = db.query(Loan).filter(Loan.customer_id == ref.customer_id).all()
    
    txs_list = [{
        "timestamp": t.timestamp,
        "amount": t.amount,
        "direction": t.direction,
        "transaction_type": t.transaction_type
    } for t in txs]
    
    loans_list = [{
        "start_date": l.start_date,
        "amount": l.amount,
        "term": l.term,
        "days_late": l.days_late,
        "default_flag": l.default_flag
    } for l in loans]
    
    # Run the eligibility and credit assessment gate
    assessment = MLInference.assess_customer_credit(
        transactions=txs_list,
        consent_status=True,  # Forced true because consent is verified active
        loans=loans_list,
        customer_id=ref.customer_id
    )
    
    return {
        "referral_id": referral_id,
        "customer_id": customer.customer_id,
        "display_name": customer.display_name,
        "consent_status": ref.consent_status,
        "consent_expiry": ref.consent_expiry,
        "is_ready_for_credit": assessment.get("eligible", False),
        "history_days": assessment.get("history_days", 0),
        "transaction_count": assessment.get("transaction_count", 0),
        "assessment": assessment if assessment.get("eligible", False) else None,
        "financial_readiness_score": assessment.get("financial_readiness_score", 0),
        "transactions": txs_list
    }

@router.post("/institution/referral/{referral_id}/decision")
def post_lending_decision(
    referral_id: int,
    decision: str,  # APPROVED, REJECTED, UNDER_REVIEW, MANUAL_REVIEW
    current_user = Depends(institution_only),
    db: Session = Depends(get_db)
):
    """
    Financial Institution registers the final loan underwriting decision.
    """
    decision = (decision or "").upper()
    if decision not in LENDING_DECISIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid decision. Must be one of: {', '.join(sorted(LENDING_DECISIONS))}."
        )

    ref = db.query(Referral).filter(Referral.referral_id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral request not found.")
        
    if ref.institution_id != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden.")
        
    ref.application_status = decision
    if decision == "APPROVED":
        ref.status = "APPROVED"
    elif decision == "REJECTED":
        ref.status = "REJECTED"
    else:
        ref.status = "UNDER_REVIEW"
        
    db.commit()
    return ref

# --- DEMO USSD SIMULATION ENDPOINTS ---
#
# These simulate the customer's handset responding to a USSD consent prompt.
# Access rules:
#   * A real USSD/SMS gateway authenticates with the X-USSD-Gateway-Key header
#     (matched against the USSD_GATEWAY_KEY env var) and may act on any referral.
#   * Otherwise a logged-in AGENT may drive the on-screen simulator only for referrals
#     raised by their own branches; ADMIN may act on any referral.
#   * Financial institutions can never grant consent on a customer's behalf.
#
# Referral consent is scoped to that single referral/institution. It deliberately does
# not modify the customer's global profiling opt-in (Customer.consent_status).

USSD_GATEWAY = "USSD_GATEWAY"


def ussd_caller(
    x_ussd_gateway_key: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_optional_user)
):
    gateway_key = os.getenv("USSD_GATEWAY_KEY")
    if gateway_key and x_ussd_gateway_key and secrets.compare_digest(x_ussd_gateway_key, gateway_key):
        return USSD_GATEWAY
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if current_user.role not in ("AGENT", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only the customer's USSD session can respond to consent requests.")
    return current_user


def _ussd_agent_scope(caller, db: Session) -> Optional[Set[int]]:
    """None means unrestricted (gateway / admin); otherwise the caller's agent branch IDs."""
    if caller == USSD_GATEWAY or caller.role == "ADMIN":
        return None
    return _owned_agent_ids(caller, db)


def _get_ussd_referral(referral_id: int, caller, db: Session) -> Referral:
    ref = db.query(Referral).filter(Referral.referral_id == referral_id).first()
    scope = _ussd_agent_scope(caller, db)
    if not ref or (scope is not None and ref.agent_id not in scope):
        raise HTTPException(status_code=404, detail="Referral not found.")
    return ref


@router.get("/ussd/pending-requests")
def ussd_list_pending(
    caller = Depends(ussd_caller),
    db: Session = Depends(get_db)
):
    """
    Simulated USSD Gateway listing active pending consent requests.
    """
    query = db.query(Referral).filter(Referral.consent_status == "AWAITING_CONSENT")
    scope = _ussd_agent_scope(caller, db)
    if scope is not None:
        if not scope:
            return []
        query = query.filter(Referral.agent_id.in_(scope))
    results = []
    for r in query.all():
        cust = db.query(Customer).filter(Customer.customer_id == r.customer_id).first()
        results.append({
            "referral_id": r.referral_id,
            "requested_amount": r.requested_amount,
            "customer_name": cust.display_name if cust else "Unknown"
        })
    return results

@router.post("/ussd/consent-respond")
def ussd_respond(
    referral_id: int,
    selection: int,  # 1 = Approve, 2 = Decline
    caller = Depends(ussd_caller),
    db: Session = Depends(get_db)
):
    """
    Simulated customer response via USSD.
    """
    if selection not in (1, 2):
        raise HTTPException(status_code=400, detail="Invalid selection. Reply 1 to approve or 2 to decline.")

    ref = _get_ussd_referral(referral_id, caller, db)
    if ref.consent_status != "AWAITING_CONSENT":
        raise HTTPException(status_code=409, detail="This consent request is no longer awaiting a response.")
    
    now = datetime.utcnow()
    ref.consent_responded_at = now
    if selection == 1:
        ref.consent_status = "CONSENT_ACTIVE"
        ref.status = "CONSENT_GRANTED"
        ref.consent_expiry = now + timedelta(days=90)
        db.commit()
        return {"message": "Consent granted successfully.", "status": "active"}

    ref.consent_status = "CONSENT_DECLINED"
    ref.status = "CONSENT_DECLINED"
    db.commit()
    return {"message": "Consent declined.", "status": "declined"}

@router.post("/ussd/consent-revoke")
def ussd_revoke(
    referral_id: int,
    caller = Depends(ussd_caller),
    db: Session = Depends(get_db)
):
    """
    Simulated customer revoking consent via USSD interface.
    """
    ref = _get_ussd_referral(referral_id, caller, db)
    if ref.consent_status not in ("CONSENT_ACTIVE", "AWAITING_CONSENT"):
        raise HTTPException(status_code=409, detail="There is no active consent to revoke for this referral.")
    
    ref.consent_status = "CONSENT_REVOKED"
    ref.status = "CANCELLED"
    db.commit()
    return {"message": "Consent revoked successfully.", "status": "revoked"}
