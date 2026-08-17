from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.app.database.connection import get_db
from backend.app.schemas.schemas import LiquidityRecommendationEngineResponse, LiquidityStressTestResponse
from backend.app.services.recommender import RecommenderService
from backend.app.ml.inference import MLInference
from backend.app.models.db_models import AgentDailyMetrics, Agent
from backend.app.api.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/liquidity", tags=["Liquidity"])

agent_or_admin = RoleChecker(["AGENT", "ADMIN"])

@router.get("/recommendations", response_model=LiquidityRecommendationEngineResponse)
def get_liquidity_recommendations(
    agent_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate deterministic rebalancing recommendations based on tomorrow's demand forecast.
    Privacy: Agent role users are forced to retrieve recommendations for their own accounts.
    """
    if current_user.role == "AGENT":
        if not current_user.agent_id:
            raise HTTPException(status_code=400, detail="User is not linked to an agent account.")
        agent_id = current_user.agent_id
    elif not agent_id:
        agent_id = 1
        
    # Get historical metrics to calculate tomorrow's forecast
    metrics = db.query(AgentDailyMetrics).filter(
        AgentDailyMetrics.agent_id == agent_id
    ).order_by(AgentDailyMetrics.date.desc()).limit(30).all()
    
    metrics_list = []
    for m in reversed(metrics):
        metrics_list.append({
            "date": m.date,
            "total_transactions": m.total_transactions,
            "total_volume": m.total_volume,
            "total_commission": m.total_commission,
            "float_demand": m.total_volume * 0.8,
            "cash_demand": m.total_volume * 0.2,
        })
        
    # Get tomorrow's forecast
    forecast_data = MLInference.forecast_agent_demand(metrics_list, agent_id)
    
    # Generate rebalancing recommendations
    rec_data = RecommenderService.generate_recommendation(db, agent_id, forecast_data)
    return rec_data

@router.get("/stress-test", response_model=List[LiquidityStressTestResponse])
def run_liquidity_stress_test(
    agent_id: Optional[int] = None,
    current_user = Depends(agent_or_admin),
    db: Session = Depends(get_db)
):
    """
    Stress-test simulator (P2).
    Evaluates liquidity position against sudden increases of +10%, +20%, and +30% in forecasted demand.
    """
    if current_user.role == "AGENT":
        if not current_user.agent_id:
            raise HTTPException(status_code=400, detail="User is not linked to an agent account.")
        agent_id = current_user.agent_id
    elif not agent_id:
        agent_id = 1
        
    agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")
        
    # Fetch forecast
    metrics = db.query(AgentDailyMetrics).filter(AgentDailyMetrics.agent_id == agent_id).order_by(AgentDailyMetrics.date.desc()).limit(30).all()
    metrics_list = [{
        "date": m.date,
        "total_transactions": m.total_transactions,
        "total_volume": m.total_volume,
        "total_commission": m.total_commission,
        "float_demand": m.total_volume * 0.8,
        "cash_demand": m.total_volume * 0.2,
    } for m in reversed(metrics)]
    
    forecast_data = MLInference.forecast_agent_demand(metrics_list, agent_id)
    base_demand = forecast_data["predicted_float_demand"]
    current_float = agent.float_balance
    
    stress_scenarios = [
        {"level": "+10% Demand Surge", "multiplier": 1.1},
        {"level": "+20% Demand Surge", "multiplier": 1.2},
        {"level": "+30% High Peak Surge", "multiplier": 1.3}
    ]
    
    results = []
    for sc in stress_scenarios:
        stressed_demand = base_demand * sc["multiplier"]
        shortfall = max(0.0, stressed_demand - current_float)
        
        # Risk level determination
        if shortfall == 0.0:
            risk = "Stable"
        elif shortfall / current_float > 0.35:
            risk = "Critical"
        else:
            risk = "Elevated"
            
        results.append({
            "stress_level": sc["level"],
            "multiplier": sc["multiplier"],
            "original_demand": float(base_demand),
            "stressed_demand": float(round(stressed_demand, 2)),
            "current_holdings": float(current_float),
            "projected_shortfall": float(round(shortfall, 2)),
            "risk_status": risk
        })
        
    return results
