from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.models.db_models import Customer, Transaction, Loan
from backend.app.schemas.schemas import CreditAssessmentResponse
from backend.app.ml.inference import MLInference
from backend.app.api.auth import get_current_user, RoleChecker
import datetime

router = APIRouter(prefix="/credit", tags=["Credit Assessments"])

institution_or_admin = RoleChecker(["FINANCIAL_INSTITUTION", "ADMIN"])

@router.get("/assessment/{customer_id}", response_model=CreditAssessmentResponse)
def get_customer_credit_assessment(
    customer_id: int,
    current_user = Depends(institution_or_admin),
    db: Session = Depends(get_db)
):
    """
    Get customer alternative credit score (300-850), risk category, and SHAP explanations.
    Only accessible to Financial Institutions and Admins. Requires customer consent.
    """
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    # Get all customer transactions and loans
    txs = db.query(Transaction).filter(Transaction.customer_id == customer_id).all()
    loans = db.query(Loan).filter(Loan.customer_id == customer_id).all()
    
    # Format to dict list for ML features
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
    
    # Calculate assessment
    assessment = MLInference.assess_customer_credit(
        transactions=txs_list,
        consent_status=customer.consent_status,
        loans=loans_list,
        customer_id=customer_id
    )
    
    return assessment

@router.get("/readiness/{customer_id}")
def get_customer_readiness_score(
    customer_id: int,
    current_user = Depends(get_current_user), # Accessible to Agents so they can help customers prepare
    db: Session = Depends(get_db)
):
    """
    Get customer Financial Readiness Score (0-100) and data sufficiency progress.
    Accessible to all authenticated roles (including Agents) to guide underbanked clients.
    """
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    # Get transactions
    txs = db.query(Transaction).filter(Transaction.customer_id == customer_id).all()
    txs_list = [{
        "timestamp": t.timestamp,
        "amount": t.amount,
        "direction": t.direction,
        "transaction_type": t.transaction_type
    } for t in txs]
    
    assessment = MLInference.assess_customer_credit(
        transactions=txs_list,
        consent_status=customer.consent_status,
        loans=[],
        customer_id=customer_id
    )
    
    return {
        "customer_id": customer_id,
        "display_name": customer.display_name,
        "consent_status": customer.consent_status,
        "financial_readiness_score": assessment["financial_readiness_score"],
        "history_days": assessment["history_days"],
        "transaction_count": assessment["transaction_count"],
        "target_days": 90,
        "target_transactions": 30,
        "is_ready_for_credit": assessment["eligible"]
    }

@router.get("/portfolio-summary")
def get_portfolio_summary(
    current_user = Depends(institution_or_admin),
    db: Session = Depends(get_db)
):
    """
    Generate portfolio credit insights and risk distribution for Financial Institutions.
    Grounded in actual database records.
    """
    customers = db.query(Customer).all()
    
    total_customers = len(customers)
    consented_count = 0
    eligible_count = 0
    assessed_count = 0
    
    total_score = 0.0
    total_capacity = 0.0
    
    risk_counts = {
        "Low": 0,
        "Moderate-Low": 0,
        "Moderate-High": 0,
        "High": 0
    }
    
    pipeline = {
        "building_history": 0,  # under 90 days or 30 transactions, but has consent
        "consent_required": 0,  # has sufficient transactions/days, but no consent
        "credit_ready": 0,      # meets both, consenting, but not fully assessed
        "assessed": 0           # assessed with credit score
    }
    
    recent_events = []
    
    for c in customers:
        txs = db.query(Transaction).filter(Transaction.customer_id == c.customer_id).all()
        txs_list = [{
            "timestamp": t.timestamp,
            "amount": t.amount,
            "direction": t.direction,
            "transaction_type": t.transaction_type
        } for t in txs]
        
        loans = db.query(Loan).filter(Loan.customer_id == c.customer_id).all()
        loans_list = [{
            "start_date": l.start_date,
            "amount": l.amount,
            "term": l.term,
            "days_late": l.days_late,
            "default_flag": l.default_flag
        } for l in loans]
        
        # Calculate readiness/eligibility parameters
        assessment = MLInference.assess_customer_credit(
            transactions=txs_list,
            consent_status=c.consent_status,
            loans=loans_list,
            customer_id=c.customer_id
        )
        
        is_consented = c.consent_status
        is_eligible = assessment.get("eligible", False)
        
        if is_consented:
            consented_count += 1
            
        # Pipeline staging
        if not is_consented:
            pipeline["consent_required"] += 1
        elif not is_eligible:
            pipeline["building_history"] += 1
        else:
            pipeline["credit_ready"] += 1
            
        if is_eligible and is_consented:
            eligible_count += 1
            assessed_count += 1
            pipeline["assessed"] += 1
            
            score = assessment.get("credit_score", 300)
            risk = assessment.get("risk_category", "High")
            capacity = assessment.get("indicative_credit_capacity", 0.0)
            
            total_score += score
            total_capacity += capacity
            risk_counts[risk] = risk_counts.get(risk, 0) + 1
            
            recent_events.append({
                "customer_id": c.customer_id,
                "display_name": c.display_name,
                "event_type": "Credit Assessment Completed",
                "score": score,
                "risk": risk,
                "capacity": capacity,
                "timestamp": datetime.datetime.utcnow().isoformat()
            })
        else:
            event_detail = "Consent activated" if is_consented else "Awaiting consent"
            recent_events.append({
                "customer_id": c.customer_id,
                "display_name": c.display_name,
                "event_type": f"Financial readiness updated ({event_detail})",
                "score": None,
                "risk": None,
                "capacity": None,
                "timestamp": c.created_at.isoformat() if c.created_at else datetime.datetime.utcnow().isoformat()
            })
            
    avg_score = round(total_score / eligible_count) if eligible_count > 0 else 0
    
    # Calculate Risk Distribution in percentages for chart
    risk_distribution = []
    for cat, count in risk_counts.items():
        pct = round((count / assessed_count) * 100) if assessed_count > 0 else 0
        risk_distribution.append({
            "category": cat,
            "count": count,
            "percentage": pct
        })
        
    return {
        "consented_customers": consented_count,
        "credit_ready_customers": eligible_count,
        "average_credit_score": avg_score,
        "indicative_credit_capacity": total_capacity,
        "risk_distribution": risk_distribution,
        "pipeline": pipeline,
        "recent_events": recent_events[:6]
    }
