from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, date

# --- AUTHENTICATION & USERS ---
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    agent_id: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class AgentResponse(BaseModel):
    agent_id: int
    name: str
    location: str
    business_age: int
    operating_hours: str
    cash_balance: float
    float_balance: float
    commission_rate: float
    created_at: datetime
    
    full_name: Optional[str] = None
    business_name: Optional[str] = None
    phone: Optional[str] = None
    region: Optional[str] = None
    agent_type: Optional[str] = None
    status: Optional[str] = None
    
    city: Optional[str] = None
    specific_location: Optional[str] = None
    owner_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# --- CUSTOMER ---
class CustomerResponse(BaseModel):
    customer_id: int
    display_name: str
    consent_status: bool
    consent_timestamp: Optional[datetime] = None
    profile_created_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConsentUpdate(BaseModel):
    consent_status: bool

# --- TRANSACTION ---
class TransactionResponse(BaseModel):
    transaction_id: int
    agent_id: int
    customer_id: Optional[int] = None
    timestamp: datetime
    transaction_type: str
    amount: float
    direction: str
    cash_balance: float
    float_balance: float
    commission: float
    location: str
    
    class Config:
        from_attributes = True

class TransactionPagedResponse(BaseModel):
    transactions: List[TransactionResponse]
    total_count: int
    page: int
    page_size: int

# --- CREDIT & READINESS ---
class CreditExplanationResponse(BaseModel):
    feature: str
    value: float

class CreditAssessmentResponse(BaseModel):
    eligible: bool
    consent_active: bool
    history_days: int
    transaction_count: int
    financial_readiness_score: float
    credit_score: Optional[int] = None
    repayment_probability: Optional[float] = None
    default_probability: Optional[float] = None
    risk_category: Optional[str] = None
    indicative_credit_capacity: Optional[float] = None
    factors: Optional[List[CreditExplanationResponse]] = None
    model_version: Optional[str] = None
    reason: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None

# --- FORECAST & LIQUIDITY ---
class ForecastResponse(BaseModel):
    forecast_id: Optional[int] = None
    agent_id: int
    forecast_date: date
    predicted_transaction_volume: float
    predicted_float_demand: float
    predicted_cash_demand: float
    confidence: float
    model_version: str
    baseline_float_demand: float

class RecommendationResponse(BaseModel):
    recommendation_id: int
    agent_id: int
    type: str
    severity: str
    title: str
    description: str
    recommended_amount: Optional[float] = None
    recommended_time: Optional[str] = None
    created_at: datetime
    status: str
    
    class Config:
        from_attributes = True

class LiquidityRecommendationEngineResponse(BaseModel):
    expected_float_demand: float
    current_float: float
    predicted_shortfall: float
    recommendation: Optional[RecommendationResponse] = None
    warning_level: str  # Low, Medium, High

class LiquidityStressTestResponse(BaseModel):
    stress_level: str  # +10%, +20%, +30%
    multiplier: float
    original_demand: float
    stressed_demand: float
    current_holdings: float
    projected_shortfall: float
    risk_status: str  # Critical, Elevated, Stable

# --- BUSINESS HEALTH ---
class BusinessHealthResponse(BaseModel):
    agent_id: int
    business_health_score: float  # 0 - 100
    metrics: Dict[str, Any]
    insights: List[str]

# --- ANOMALY ---
class AnomalyResponse(BaseModel):
    anomaly_id: int
    agent_id: int
    transaction_id: Optional[int] = None
    severity: str
    reason: str
    score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- ADMIN METRICS ---
class DataExplorerResponse(BaseModel):
    agent_count: int
    customer_count: int
    transaction_count: int
    consented_customer_count: int
    sufficient_history_count: int
    db_type: str  # PostgreSQL or SQLite Fallback

class ModelPerformanceResponse(BaseModel):
    credit_model: Optional[Dict[str, Any]] = None
    demand_model: Optional[Dict[str, Any]] = None
    anomaly_model: Optional[Dict[str, Any]] = None
