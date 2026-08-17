from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from datetime import datetime
from backend.app.database.connection import get_db
from backend.app.models.db_models import Transaction
from backend.app.schemas.schemas import TransactionPagedResponse
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=TransactionPagedResponse)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    agent_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    direction: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List and filter transactions with paginated responses.
    Privacy enforcement: Agent role users are forced to view only their own transactions.
    """
    # Enforce AGENT constraints
    if current_user.role == "AGENT":
        if not current_user.agent_id:
            raise HTTPException(status_code=400, detail="User not linked to any agent account.")
        agent_id = current_user.agent_id

    query = db.query(Transaction)
    
    filters = []
    if agent_id:
        filters.append(Transaction.agent_id == agent_id)
    if customer_id:
        filters.append(Transaction.customer_id == customer_id)
    if transaction_type:
        filters.append(Transaction.transaction_type == transaction_type)
    if direction:
        filters.append(Transaction.direction == direction)
    if start_date:
        filters.append(Transaction.timestamp >= start_date)
    if end_date:
        filters.append(Transaction.timestamp <= end_date)
    if min_amount is not None:
        filters.append(Transaction.amount >= min_amount)
    if max_amount is not None:
        filters.append(Transaction.amount <= max_amount)
        
    if filters:
        query = query.filter(and_(*filters))
        
    total_count = query.count()
    
    # Sort by timestamp descending
    query = query.order_by(Transaction.timestamp.desc())
    
    # Paginate
    offset = (page - 1) * page_size
    transactions = query.offset(offset).limit(page_size).all()
    
    return {
        "transactions": transactions,
        "total_count": total_count,
        "page": page,
        "page_size": page_size
    }
