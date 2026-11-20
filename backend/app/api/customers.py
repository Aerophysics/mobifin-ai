from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.database.connection import get_db
from backend.app.models.db_models import Agent, Customer, Transaction
from backend.app.schemas.schemas import CustomerResponse, ConsentUpdate
from backend.app.api.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/customers", tags=["Customers"])

# Only financial institutions and admins can view arbitrary customer profiles
institution_or_admin = RoleChecker(["FINANCIAL_INSTITUTION", "ADMIN"])
# Agents may list customers they serve; FIs may browse; admins see everything
customer_directory_roles = RoleChecker(["AGENT", "FINANCIAL_INSTITUTION", "ADMIN"])
# Consent is recorded by the customer's agent (assisted opt-in) or an admin.
# Lenders must never be able to grant themselves access to a customer's data.
consent_managers = RoleChecker(["AGENT", "ADMIN"])


def _agent_customer_ids_query(user, db: Session):
    """Subquery of customer IDs who have transacted at any branch operated by this agent user."""
    branch_ids = {a.agent_id for a in db.query(Agent.agent_id).filter(Agent.owner_id == user.user_id).all()}
    if user.agent_id:
        branch_ids.add(user.agent_id)
    return db.query(Transaction.customer_id).filter(Transaction.agent_id.in_(branch_ids or {-1})).distinct()

@router.get("", response_model=List[CustomerResponse])
def list_customers(
    search: Optional[str] = None,
    consent_only: Optional[bool] = None,
    current_user = Depends(customer_directory_roles),
    db: Session = Depends(get_db)
):
    """Search and list customer profiles. Agents only see customers served by their branches."""
    query = db.query(Customer)
    if current_user.role == "AGENT":
        query = query.filter(Customer.customer_id.in_(_agent_customer_ids_query(current_user, db)))
    
    if search:
        # Search by display_name or ID
        if search.isdigit():
            query = query.filter(Customer.customer_id == int(search))
        else:
            query = query.filter(Customer.display_name.ilike(f"%{search}%"))
            
    if consent_only is not None:
        query = query.filter(Customer.consent_status == consent_only)
        
    return query.all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer_details(
    customer_id: int,
    current_user = Depends(institution_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve details for a specific customer profile"""
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return customer

@router.post("/{customer_id}/consent", response_model=CustomerResponse)
def update_customer_consent(
    customer_id: int,
    consent_data: ConsentUpdate,
    current_user = Depends(consent_managers),  # Agent-assisted opt-in, or admin
    db: Session = Depends(get_db)
):
    """Updates a customer's credit profiling opt-in consent state"""
    query = db.query(Customer).filter(Customer.customer_id == customer_id)
    if current_user.role == "AGENT":
        query = query.filter(Customer.customer_id.in_(_agent_customer_ids_query(current_user, db)))
    customer = query.first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    customer.consent_status = consent_data.consent_status
    if consent_data.consent_status:
        customer.consent_timestamp = datetime.utcnow()
        if not customer.profile_created_at:
            customer.profile_created_at = datetime.utcnow()
    else:
        customer.consent_timestamp = None
        
    db.commit()
    db.refresh(customer)
    return customer
