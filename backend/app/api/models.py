from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db, is_sqlite_active
from backend.app.models.db_models import Agent, Customer, Transaction
from backend.app.schemas.schemas import DataExplorerResponse, ModelPerformanceResponse
from backend.app.ml.model_registry import ModelRegistry
from backend.app.api.auth import RoleChecker
import datetime

router = APIRouter(prefix="/models", tags=["Model Administration"])

# Restricted to ADMIN role
admin_only = RoleChecker(["ADMIN"])

@router.get("/performance", response_model=ModelPerformanceResponse)
def get_model_performance(current_user = Depends(admin_only)):
    """Retrieve actual ML model registration and evaluation metrics (no hardcoding)"""
    metrics = ModelRegistry.get_all_metrics()
    return {
        "credit_model": metrics.get("credit"),
        "demand_model": metrics.get("demand"),
        "anomaly_model": metrics.get("anomaly")
    }

@router.get("/explorer", response_model=DataExplorerResponse)
def get_data_explorer_metrics(
    current_user = Depends(admin_only), 
    db: Session = Depends(get_db)
):
    """Retrieve raw database records summary and consent analytics for the Data Explorer"""
    agent_count = db.query(Agent).count()
    customer_count = db.query(Customer).count()
    transaction_count = db.query(Transaction).count()
    
    consented_count = db.query(Customer).filter(Customer.consent_status == True).count()
    
    # Calculate customers with sufficient history (>= 90 days, >= 30 transactions)
    now = datetime.datetime.utcnow()
    consented_customers = db.query(Customer).filter(Customer.consent_status == True).all()
    
    sufficient_history = 0
    for c in consented_customers:
        tx_count = db.query(Transaction).filter(
            Transaction.customer_id == c.customer_id,
            Transaction.timestamp <= now
        ).count()
        
        # history length
        first_tx = db.query(Transaction).filter(
            Transaction.customer_id == c.customer_id
        ).order_by(Transaction.timestamp.asc()).first()
        
        if first_tx:
            history_days = (now - first_tx.timestamp).days
            if history_days >= 90 and tx_count >= 30:
                sufficient_history += 1
                
    db_type = "SQLite Fallback" if is_sqlite_active() else "PostgreSQL (Canonical)"
    
    return {
        "agent_count": agent_count,
        "customer_count": customer_count,
        "transaction_count": transaction_count,
        "consented_customer_count": consented_count,
        "sufficient_history_count": sufficient_history,
        "db_type": db_type
    }
