from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date, timedelta
from backend.app.database.connection import get_db
from backend.app.models.db_models import AgentDailyMetrics, Forecast
from backend.app.schemas.schemas import ForecastResponse
from backend.app.ml.inference import MLInference
from backend.app.api.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/forecasts", tags=["Forecasts"])

agent_or_admin = RoleChecker(["AGENT", "ADMIN"])

@router.get("", response_model=ForecastResponse)
def get_demand_forecast(
    agent_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get tomorrow's e-float and cash demand forecast.
    Privacy: Agent role users are forced to view only their own forecasts.
    """
    if current_user.role == "AGENT":
        if not current_user.agent_id:
            raise HTTPException(status_code=400, detail="User is not linked to an agent account.")
        agent_id = current_user.agent_id
    elif not agent_id:
        agent_id = 1
        
    # Retrieve historical daily metrics to feed lag features to the forecast model
    metrics = db.query(AgentDailyMetrics).filter(
        AgentDailyMetrics.agent_id == agent_id
    ).order_by(AgentDailyMetrics.date.desc()).limit(30).all()
    
    # Format into list of dicts for MLInference
    metrics_list = []
    for m in reversed(metrics): # Order chronological for time lags
        metrics_list.append({
            "date": m.date,
            "total_transactions": m.total_transactions,
            "total_volume": m.total_volume,
            "total_commission": m.total_commission,
            "float_demand": m.total_volume * 0.8, # proxy if not recorded
            "cash_demand": m.total_volume * 0.2,  # proxy if not recorded
        })
        
    # Execute inference
    forecast_data = MLInference.forecast_agent_demand(metrics_list, agent_id)
    
    # Save the forecast to the database for historical tracking
    tomorrow = datetime.utcnow().date() + timedelta(days=1)
    
    # Check if a forecast already exists for tomorrow, if so update it, else insert
    db_forecast = db.query(Forecast).filter(
        Forecast.agent_id == agent_id,
        Forecast.forecast_date == tomorrow
    ).first()
    
    if not db_forecast:
        db_forecast = Forecast(
            agent_id=agent_id,
            forecast_date=tomorrow,
            predicted_transaction_volume=forecast_data["predicted_transaction_volume"],
            predicted_float_demand=forecast_data["predicted_float_demand"],
            predicted_cash_demand=forecast_data["predicted_cash_demand"],
            confidence=forecast_data["confidence"],
            model_version=forecast_data["model_version"]
        )
        db.add(db_forecast)
    else:
        db_forecast.predicted_transaction_volume = forecast_data["predicted_transaction_volume"]
        db_forecast.predicted_float_demand = forecast_data["predicted_float_demand"]
        db_forecast.predicted_cash_demand = forecast_data["predicted_cash_demand"]
        db_forecast.confidence = forecast_data["confidence"]
        db_forecast.model_version = forecast_data["model_version"]
        
    db.commit()
    
    return {
        "agent_id": agent_id,
        "forecast_date": tomorrow,
        "predicted_transaction_volume": forecast_data["predicted_transaction_volume"],
        "predicted_float_demand": forecast_data["predicted_float_demand"],
        "predicted_cash_demand": forecast_data["predicted_cash_demand"],
        "confidence": forecast_data["confidence"],
        "model_version": forecast_data["model_version"],
        "baseline_float_demand": forecast_data["baseline_float_demand"]
    }
