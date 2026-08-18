from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional
from backend.app.database.connection import get_db
from backend.app.models.db_models import Agent, User, Transaction, Customer, CreditAssessment, FinancingRequest, Notification, Anomaly, Forecast, TrustedSource
from backend.app.api.auth import get_current_user, RoleChecker, get_password_hash
from backend.app.schemas.schemas import AgentResponse, TrustedSourceCreate, TrustedSourceResponse

router = APIRouter(prefix="", tags=["MobiFin Core Features"])

# --- SCHEMAS ---
class BusinessLocationCreateRequest(BaseModel):
    business_name: str
    region: str
    city: str
    specific_location: str
    agent_type: str
    starting_cash: float
    starting_float: float

class AgentOnboardingRequest(BaseModel):
    username: Optional[str] = None
    password: str
    full_name: str
    business_name: str
    phone: str
    region: str
    location: str
    agent_type: str
    starting_cash: float
    starting_float: float

class AgentOnboardingResponse(BaseModel):
    agent_id: int
    username: str
    full_name: str
    business_name: str
    phone: str
    status: str

    class Config:
        from_attributes = True

class LedgerSummary(BaseModel):
    date: str
    opening_cash: float
    cash_in: float
    cash_out: float
    commission: float
    closing_cash: float
    opening_float: float
    float_in: float
    float_out: float
    closing_float: float
    reconciliation_status: str
    transactions_count: int

class FinancingRequestCreate(BaseModel):
    customer_id: int
    product_name: str
    requested_amount: float
    requested_term: int
    purpose: str

class FinancingRequestResponse(BaseModel):
    request_id: int
    customer_id: int
    customer_name: str
    product_name: str
    requested_amount: float
    requested_term: int
    purpose: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    notification_id: int
    type: str
    severity: str
    title: str
    message: str
    created_at: datetime
    read: bool
    action_url: Optional[str] = None

    class Config:
        from_attributes = True

# --- API ENDPOINTS ---

# 1. Agent Onboarding
@router.post("/onboarding", response_model=AgentOnboardingResponse)
def onboard_agent(req: AgentOnboardingRequest, db: Session = Depends(get_db)):
    # Resolve username to phone number if not supplied
    username = req.username.strip() if (req.username and req.username.strip()) else req.phone.strip()

    # Validate username uniqueness
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        if username == req.phone.strip():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account is already registered with this phone number. Please sign in or use a different number."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered. Please choose another one."
            )

    # Validate phone uniqueness
    existing_phone = db.query(Agent).filter(Agent.phone == req.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account is already registered with this phone number. Please sign in or use a different number."
        )

    # 1. Create Agent
    new_agent = Agent(
        name=req.business_name,
        location=req.location,
        business_age=1,
        operating_hours="08:00 - 18:00",
        cash_balance=req.starting_cash,
        float_balance=req.starting_float,
        commission_rate=0.015,
        full_name=req.full_name,
        business_name=req.business_name,
        phone=req.phone,
        region=req.region,
        agent_type=req.agent_type,
        status="active"
    )
    db.add(new_agent)
    db.flush()  # Populates agent_id

    # 2. Create User login credentials
    password_hash = get_password_hash(req.password)
    new_user = User(
        username=username,
        password_hash=password_hash,
        role="AGENT",
        agent_id=new_agent.agent_id,
        full_name=req.full_name,
        phone_number=req.phone
    )
    db.add(new_user)
    db.flush()  # Populates user_id

    # Link agent owner_id to user
    new_agent.owner_id = new_user.user_id
    db.commit()
    db.refresh(new_agent)

    # Seed an initial SYSTEM notification for the new agent
    welcome_alert = Notification(
        agent_id=new_agent.agent_id,
        type="SYSTEM",
        severity="Low",
        title="Account Onboarding Successful",
        message=f"Welcome {req.full_name} to MobiFin AI! Your alternative credit score, business health, and liquidity forecaster engines are ready.",
        created_at=datetime.utcnow(),
        read=False
    )
    db.add(welcome_alert)
    db.commit()

    return {
        "agent_id": new_agent.agent_id,
        "username": new_user.username,
        "full_name": new_agent.full_name,
        "business_name": new_agent.business_name,
        "phone": new_agent.phone,
        "status": new_agent.status
    }


# 2. Ledger Bookkeeping
@router.get("/ledger/daily", response_model=LedgerSummary)
def get_daily_ledger(
    date_str: Optional[str] = None,
    agent_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Resolve target agent
    target_agent_id = current_user.agent_id
    if current_user.role in ["ADMIN", "FINANCIAL_INSTITUTION"]:
        if agent_id:
            target_agent_id = agent_id
        else:
            target_agent_id = 1  # Default to Kwame for demo

    if not target_agent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any agent profile."
        )

    # Resolve date
    query_date = date.today()
    if date_str:
        try:
            query_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Please use YYYY-MM-DD."
            )

    agent = db.query(Agent).filter(Agent.agent_id == target_agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found.")

    # Fetch transactions of the target agent on the specified day
    start_dt = datetime.combine(query_date, datetime.min.time())
    end_dt = datetime.combine(query_date, datetime.max.time())
    
    txs = db.query(Transaction).filter(
        Transaction.agent_id == target_agent_id,
        Transaction.timestamp >= start_dt,
        Transaction.timestamp <= end_dt
    ).order_index = Transaction.timestamp.asc()
    
    tx_list = db.query(Transaction).filter(
        Transaction.agent_id == target_agent_id,
        Transaction.timestamp >= start_dt,
        Transaction.timestamp <= end_dt
    ).order_by(Transaction.timestamp.asc()).all()

    # If no transactions, Opening and Closing balances are identical to the agent's current state
    if not tx_list:
        return {
            "date": query_date.isoformat(),
            "opening_cash": agent.cash_balance,
            "cash_in": 0.0,
            "cash_out": 0.0,
            "commission": 0.0,
            "closing_cash": agent.cash_balance,
            "opening_float": agent.float_balance,
            "float_in": 0.0,
            "float_out": 0.0,
            "closing_float": agent.float_balance,
            "reconciliation_status": "Balanced",
            "transactions_count": 0
        }

    # First transaction defines the pre-transaction Opening balances
    first_tx = tx_list[0]
    # Reconstruct pre-tx cash and float based on the first transaction details
    if first_tx.transaction_type == "withdrawal":
        opening_cash = first_tx.cash_balance + first_tx.amount
        opening_float = first_tx.float_balance - first_tx.amount
    else:
        # deposits, transfers, payments decrease float and increase cash
        opening_cash = first_tx.cash_balance - first_tx.amount
        opening_float = first_tx.float_balance + first_tx.amount

    # Last transaction defines the post-transaction Closing balances
    last_tx = tx_list[-1]
    closing_cash = last_tx.cash_balance
    closing_float = last_tx.float_balance

    # Accumulate transaction flows
    cash_in = 0.0
    cash_out = 0.0
    float_in = 0.0
    float_out = 0.0
    total_commission = 0.0

    for tx in tx_list:
        total_commission += tx.commission
        if tx.transaction_type == "withdrawal":
            cash_out += tx.amount
            float_in += tx.amount
        else:
            cash_in += tx.amount
            float_out += tx.amount

    # Check reconciliation status
    expected_closing_cash = opening_cash + cash_in - cash_out
    expected_closing_float = opening_float + float_in - float_out
    
    is_reconciled = (
        abs(expected_closing_cash - closing_cash) < 0.01 and
        abs(expected_closing_float - closing_float) < 0.01
    )
    
    reconciliation_status = "Balanced" if is_reconciled else "Reconciliation Required"

    return {
        "date": query_date.isoformat(),
        "opening_cash": round(opening_cash, 2),
        "cash_in": round(cash_in, 2),
        "cash_out": round(cash_out, 2),
        "commission": round(total_commission, 2),
        "closing_cash": round(closing_cash, 2),
        "opening_float": round(opening_float, 2),
        "float_in": round(float_in, 2),
        "float_out": round(float_out, 2),
        "closing_float": round(closing_float, 2),
        "reconciliation_status": reconciliation_status,
        "transactions_count": len(tx_list)
    }


# 3. Product Catalog
@router.get("/financial-services/products")
def get_products():
    return [
        {
            "product_name": "Working Capital Facility",
            "description": "Flexible credit line to replenish e-float or support short-term business operations.",
            "range": "GH₵1,000 - GH₵10,000",
            "eligibility": "Consented, score 650+"
        },
        {
            "product_name": "Agent Liquidity Facility",
            "description": "Specialized cash/float matching advance to cover peak demand stockouts.",
            "range": "GH₵2,000 - GH₵15,000",
            "eligibility": "Consented, score 700+"
        },
        {
            "product_name": "Micro Business Loan",
            "description": "Term loan for small business expansion and equipment financing.",
            "range": "GH₵5,000 - GH₵25,000",
            "eligibility": "Consented, score 600+"
        }
    ]


# 4. Request Financing
@router.post("/financing/request", response_model=FinancingRequestResponse)
def create_financing_request(
    req: FinancingRequestCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce RBAC: Only Financial Institutions or Admins or Agents
    # Validate customer existence and consent status
    customer = db.query(Customer).filter(Customer.customer_id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    if not customer.consent_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Financing request blocked: Customer consent is unsigned."
        )

    # Fetch credit assessment details
    assessment = db.query(CreditAssessment).filter(
        CreditAssessment.customer_id == req.customer_id
    ).order_by(CreditAssessment.assessment_date.desc()).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Financing request blocked: No credit assessment computed due to insufficient history."
        )

    # Validate if requested amount exceeds credit capacity
    if req.requested_amount > assessment.indicative_credit_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested amount exceeds the indicative capacity generated by the alternative assessment."
        )

    # Create request
    new_request = FinancingRequest(
        customer_id=req.customer_id,
        product_name=req.product_name,
        requested_amount=req.requested_amount,
        requested_term=req.requested_term,
        purpose=req.purpose,
        status="PENDING_INSTITUTIONAL_REVIEW",
        created_at=datetime.utcnow()
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # Add a CREDIT alert notification to agent 1
    new_alert = Notification(
        agent_id=1,
        type="CREDIT",
        severity="High",
        title="Financing Request Submitted",
        message=f"Customer #{req.customer_id} financing request for GH₵{req.requested_amount:,.0f} has been submitted for institutional underwriting.",
        created_at=datetime.utcnow(),
        read=False
    )
    db.add(new_alert)
    db.commit()

    return {
        "request_id": new_request.request_id,
        "customer_id": new_request.customer_id,
        "customer_name": customer.display_name,
        "product_name": new_request.product_name,
        "requested_amount": new_request.requested_amount,
        "requested_term": new_request.requested_term,
        "purpose": new_request.purpose,
        "status": new_request.status,
        "created_at": new_request.created_at
    }


# 5. List Financing Requests
@router.get("/financing/requests", response_model=List[FinancingRequestResponse])
def list_financing_requests(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(FinancingRequest).order_by(FinancingRequest.created_at.desc()).all()
    resp = []
    for r in requests:
        cust = db.query(Customer).filter(Customer.customer_id == r.customer_id).first()
        cust_name = cust.display_name if cust else f"Customer #{r.customer_id}"
        resp.append({
            "request_id": r.request_id,
            "customer_id": r.customer_id,
            "customer_name": cust_name,
            "product_name": r.product_name,
            "requested_amount": r.requested_amount,
            "requested_term": r.requested_term,
            "purpose": r.purpose,
            "status": r.status,
            "created_at": r.created_at
        })
    return resp


# 6. Notifications List & Read
@router.get("/notifications", response_model=List[NotificationResponse])
def list_notifications(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_agent_id = current_user.agent_id or 1  # Kwame for demo users without linked agents
    
    # Generate dynamic notifications for demo if they are missing
    check_and_generate_demo_alerts(target_agent_id, db)
    
    notifs = db.query(Notification).filter(
        Notification.agent_id == target_agent_id
    ).order_by(Notification.created_at.desc()).all()
    
    return notifs

@router.put("/notifications/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_agent_id = current_user.agent_id or 1
    notif = db.query(Notification).filter(
        Notification.notification_id == notification_id,
        Notification.agent_id == target_agent_id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
        
    notif.read = True
    db.commit()
    return {"status": "success"}


# Helper to generate alerts dynamically based on actual database events
def check_and_generate_demo_alerts(agent_id: int, db: Session):
    existing_count = db.query(Notification).filter(Notification.agent_id == agent_id).count()
    if existing_count > 1:
        return
        
    alerts = []
    
    # 1. Check liquidity forecast shortfall
    forecast = db.query(Forecast).filter(Forecast.agent_id == agent_id).order_by(Forecast.forecast_date.desc()).first()
    if forecast and forecast.predicted_float_demand > 7200:
        alerts.append(Notification(
            agent_id=agent_id,
            type="LIQUIDITY",
            severity="High",
            title="Liquidity Shortfall Forecasted",
            message=f"Tomorrow's predicted e-float demand ({forecast.predicted_float_demand:,.0f} GH₵) exceeds your current holdings. Recommended: Rebalance 4,000 GH₵ before 10:30 AM.",
            created_at=datetime.utcnow() - timedelta(minutes=5),
            read=False,
            action_url="/liquidity"
        ))
        
    # 2. Check recent anomalies
    anomaly = db.query(Anomaly).filter(Anomaly.agent_id == agent_id).order_by(Anomaly.created_at.desc()).first()
    if anomaly:
        alerts.append(Notification(
            agent_id=agent_id,
            type="UNUSUAL_ACTIVITY",
            severity="Medium",
            title="Unusual Transaction Activity Flagged",
            message=f"Transaction velocity is higher than the normal operating pattern. Anomaly Score: {anomaly.score:.4f}.",
            created_at=datetime.utcnow() - timedelta(minutes=25),
            read=False,
            action_url="/dashboard"
        ))
        
    # 3. Add a general business insight
    alerts.append(Notification(
        agent_id=agent_id,
        type="BUSINESS",
        severity="Low",
        title="Transaction Volume baseline Shift",
        message="Daily transaction volume has increased by 14% compared with your recent operating baseline.",
        created_at=datetime.utcnow() - timedelta(hours=2),
        read=False,
        action_url="/analytics"
    ))

    # 4. Add credit readiness updates for Customer 1048
    customer = db.query(Customer).filter(Customer.customer_id == 1048).first()
    if customer:
        alerts.append(Notification(
            agent_id=agent_id,
            type="CREDIT",
            severity="Medium",
            title="Alternative Credit Assessment Available",
            message=f"Customer #1048 has reached the minimum activity threshold and has verified consent. Alternative Score: 764/850.",
            created_at=datetime.utcnow() - timedelta(hours=5),
            read=False,
            action_url="/credit"
        ))

    # Save to db
    for a in alerts:
        db.add(a)
    db.commit()

@router.post("/onboarding/business", response_model=AgentResponse)
def create_business_location(
    req: BusinessLocationCreateRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["AGENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only Agents or Admins can register business locations.")
    
    import time
    unique_phone = f"LOC-PH-{int(time.time() * 1000)}"
    
    new_loc = Agent(
        name=req.business_name,
        location=f"{req.region} - {req.city}",
        business_age=1,
        operating_hours="08:00 - 18:00",
        cash_balance=req.starting_cash,
        float_balance=req.starting_float,
        commission_rate=0.015,
        full_name=current_user.full_name,
        business_name=req.business_name,
        phone=unique_phone,
        region=req.region,
        agent_type=req.agent_type,
        city=req.city,
        specific_location=req.specific_location,
        owner_id=current_user.user_id,
        status="active"
    )
    db.add(new_loc)
    db.flush()
    
    welcome_alert = Notification(
        agent_id=new_loc.agent_id,
        type="SYSTEM",
        severity="Low",
        title="Business Location Added Successfully",
        message=f"Your new location '{req.business_name}' in {req.city} has been added to your MobiFin workspace.",
        created_at=datetime.utcnow(),
        read=False
    )
    db.add(welcome_alert)
    
    # Switch active location to the new one
    current_user.agent_id = new_loc.agent_id
    db.commit()
    db.refresh(new_loc)
    return new_loc

@router.get("/onboarding/businesses", response_model=List[AgentResponse])
def list_my_business_locations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["AGENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden. Only Agents or Admins can list business locations.")
        
    locations = db.query(Agent).filter(Agent.owner_id == current_user.user_id).all()
    
    # Fallback to auto-associate Kwame's Centre or active location if not owned yet
    if not locations and current_user.agent_id:
        active = db.query(Agent).filter(Agent.agent_id == current_user.agent_id).first()
        if active:
            active.owner_id = current_user.user_id
            db.commit()
            locations = [active]
            
    return locations

@router.post("/onboarding/active-location/{agent_id}", response_model=AgentResponse)
def set_active_location(
    agent_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["AGENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
        
    loc = db.query(Agent).filter(Agent.agent_id == agent_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Business location not found.")
        
    if loc.owner_id != current_user.user_id and current_user.role != "ADMIN":
        if current_user.agent_id == agent_id:
            loc.owner_id = current_user.user_id
        else:
            raise HTTPException(status_code=403, detail="Forbidden. You do not own this business location.")
            
    current_user.agent_id = agent_id
    db.commit()
    return loc

@router.post("/onboarding/business-status/{agent_id}", response_model=AgentResponse)
def set_business_location_status(
    agent_id: int,
    status: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["AGENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
        
    loc = db.query(Agent).filter(Agent.agent_id == agent_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Business location not found.")
        
    if loc.owner_id != current_user.user_id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden.")
        
    loc.status = status
    db.commit()
    return loc

# --- TRUSTED LIQUIDITY SOURCES API ---

@router.post("/trusted-sources", response_model=TrustedSourceResponse)
def create_trusted_source(
    req: TrustedSourceCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["AGENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
        
    new_src = TrustedSource(
        user_id=current_user.user_id,
        agent_id=req.agent_id,
        name=req.name,
        phone=req.phone,
        location=req.location,
        type=req.type,
        notes=req.notes,
        status="active"
    )
    db.add(new_src)
    db.commit()
    db.refresh(new_src)
    return new_src

@router.get("/trusted-sources", response_model=List[TrustedSourceResponse])
def list_trusted_sources(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["AGENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
        
    # Return all sources saved by the user
    return db.query(TrustedSource).filter(TrustedSource.user_id == current_user.user_id).all()

@router.put("/trusted-sources/{source_id}", response_model=TrustedSourceResponse)
def edit_trusted_source(
    source_id: int,
    req: TrustedSourceCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["AGENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
        
    src = db.query(TrustedSource).filter(
        TrustedSource.source_id == source_id,
        TrustedSource.user_id == current_user.user_id
    ).first()
    if not src:
        raise HTTPException(status_code=404, detail="Trusted source not found.")
        
    src.name = req.name
    src.phone = req.phone
    src.location = req.location
    src.type = req.type
    src.notes = req.notes
    src.agent_id = req.agent_id
    db.commit()
    db.refresh(src)
    return src

@router.post("/trusted-sources/{source_id}/status", response_model=TrustedSourceResponse)
def toggle_trusted_source_status(
    source_id: int,
    status: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["AGENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
        
    src = db.query(TrustedSource).filter(
        TrustedSource.source_id == source_id,
        TrustedSource.user_id == current_user.user_id
    ).first()
    if not src:
        raise HTTPException(status_code=404, detail="Trusted source not found.")
        
    src.status = status
    db.commit()
    db.refresh(src)
    return src

from datetime import timedelta
