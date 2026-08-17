from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.database.connection import get_db
from backend.app.services.analytics import AnalyticsService
from backend.app.schemas.schemas import BusinessHealthResponse
from backend.app.api.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Roles allowed: AGENT, ADMIN
agent_or_admin = RoleChecker(["AGENT", "ADMIN"])

@router.get("/health", response_model=BusinessHealthResponse)
def get_agent_health_score(
    agent_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate and return the Agent Business Health Score (0-100) and operational insights.
    If logged in as AGENT, forces the query to their own agent_id.
    """
    if current_user.role == "AGENT":
        if not current_user.agent_id:
            raise HTTPException(status_code=400, detail="User is not linked to an agent account.")
        agent_id = current_user.agent_id
    elif not agent_id:
        # Defaults to Kwame's Centre for admin/institutions if no agent_id provided
        agent_id = 1
        
    health_data = AnalyticsService.calculate_business_health(db, agent_id)
    return health_data
