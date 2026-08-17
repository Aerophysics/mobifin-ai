from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.models.db_models import Customer, Transaction, Loan
from backend.app.schemas.schemas import CreditAssessmentResponse
from backend.app.ml.inference import MLInference
from backend.app.api.auth import get_current_user, RoleChecker

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
