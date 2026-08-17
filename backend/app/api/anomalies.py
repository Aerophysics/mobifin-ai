from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database.connection import get_db
from backend.app.models.db_models import Anomaly
from backend.app.schemas.schemas import AnomalyResponse
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])

@router.get("", response_model=List[AnomalyResponse])
def list_anomalies(
    agent_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve list of unusual/anomalous activities flagged by the Isolation Forest service"""
    query = db.query(Anomaly)
    
    # Restrict to agent's own anomalies if the role is AGENT
    if current_user.role == "AGENT":
        if not current_user.agent_id:
            raise HTTPException(status_code=400, detail="User not linked to an agent account.")
        agent_id = current_user.agent_id
        
    if agent_id:
        query = query.filter(Anomaly.agent_id == agent_id)
        
    return query.order_by(Anomaly.created_at.desc()).all()
