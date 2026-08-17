from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.models.db_models import Agent
from backend.app.schemas.schemas import AgentResponse
from backend.app.api.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/agents", tags=["Agents"])

# Roles allowed: AGENT, ADMIN
agent_or_admin = RoleChecker(["AGENT", "ADMIN"])

@router.get("/me", response_model=AgentResponse)
def get_my_agent_profile(
    current_user = Depends(agent_or_admin), 
    db: Session = Depends(get_db)
):
    """Retrieves the profile of the currently logged-in Agent user"""
    if not current_user.agent_id:
        raise HTTPException(status_code=400, detail="User is not linked to any mobile money agent account.")
        
    agent = db.query(Agent).filter(Agent.agent_id == current_user.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found.")
    return agent

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent_profile(
    agent_id: int, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Retrieve any agent profile (accessible to all authenticated users)"""
    # Enforce privacy: Agents can only fetch their own profile, admins & institutions can fetch any
    if current_user.role == "AGENT" and current_user.agent_id != agent_id:
        raise HTTPException(status_code=403, detail="Forbidden. Agents can only retrieve their own profile.")
        
    agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent profile not found.")
    return agent
