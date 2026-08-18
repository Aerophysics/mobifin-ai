from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from backend.app.database.connection import get_db
from backend.app.models.db_models import Agent, User, Transaction, Customer, Referral, Loan
from backend.app.api.auth import get_current_user, RoleChecker
from backend.app.schemas.schemas import ReferralCreate, ReferralResponse, ConsentResponseRequest
from backend.app.ml.inference import MLInference

router = APIRouter(prefix="", tags=["Customer Credit Referrals"])

agent_only = RoleChecker(["AGENT", "ADMIN"])
institution_only = RoleChecker(["FINANCIAL_INSTITUTION", "ADMIN"])

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
        
    # Find or create guest Customer by phone
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

@router.get("/ussd/pending-requests")
def ussd_list_pending(
    db: Session = Depends(get_db)
):
    """
    Simulated USSD Gateway listing active pending consent requests.
    """
    refs = db.query(Referral).filter(Referral.consent_status == "AWAITING_CONSENT").all()
    results = []
    for r in refs:
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
    db: Session = Depends(get_db)
):
    """
    Simulated customer response via USSD.
    """
    ref = db.query(Referral).filter(Referral.referral_id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found.")
        
    cust = db.query(Customer).filter(Customer.customer_id == ref.customer_id).first()
    
    if selection == 1:
        ref.consent_status = "CONSENT_ACTIVE"
        ref.status = "CONSENT_GRANTED"
        ref.consent_responded_at = datetime.utcnow()
        ref.consent_expiry = datetime.utcnow() + timedelta(days=90)
        if cust:
            cust.consent_status = True
            cust.consent_timestamp = datetime.utcnow()
        db.commit()
        return {"message": "Consent granted successfully.", "status": "active"}
    else:
        ref.consent_status = "CONSENT_DECLINED"
        ref.status = "CONSENT_DECLINED"
        ref.consent_responded_at = datetime.utcnow()
        if cust:
            cust.consent_status = False
        db.commit()
        return {"message": "Consent declined.", "status": "declined"}

@router.post("/ussd/consent-revoke")
def ussd_revoke(
    referral_id: int,
    db: Session = Depends(get_db)
):
    """
    Simulated customer revoking consent via USSD interface.
    """
    ref = db.query(Referral).filter(Referral.referral_id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found.")
        
    cust = db.query(Customer).filter(Customer.customer_id == ref.customer_id).first()
    
    ref.consent_status = "CONSENT_REVOKED"
    ref.status = "CANCELLED"
    if cust:
        cust.consent_status = False
        
    db.commit()
    return {"message": "Consent revoked successfully.", "status": "revoked"}
