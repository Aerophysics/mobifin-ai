from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base
import datetime

# --- AUTHENTICATION & USERS ---
class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # AGENT, FINANCIAL_INSTITUTION, ADMIN
    agent_id = Column(Integer, ForeignKey("agents.agent_id", use_alter=True, name="fk_user_active_agent"), nullable=True)
    
    # Account level fields
    full_name = Column(String, nullable=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active")
    
    # Selected/Active location relationship
    active_location = relationship("Agent", foreign_keys=[agent_id], post_update=True)
    
    # All business locations owned by this user
    business_locations = relationship("Agent", foreign_keys="[Agent.owner_id]", back_populates="owner")

# --- RAW DATA TABLES ---
class Agent(Base):
    __tablename__ = "agents"
    
    agent_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)  # Ghanaian region/locale for analytics
    business_age = Column(Integer, nullable=False)  # in months
    operating_hours = Column(String, nullable=False)  # e.g., "08:00 - 18:00"
    cash_balance = Column(Float, default=0.0)
    float_balance = Column(Float, default=0.0)
    commission_rate = Column(Float, default=0.015)  # e.g., 1.5%
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Onboarding extensions
    full_name = Column(String, nullable=True)
    business_name = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    region = Column(String, nullable=True)
    agent_type = Column(String, nullable=True)
    status = Column(String, default="active")
    
    # Multi-Location fields
    city = Column(String, nullable=True)
    specific_location = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.user_id", name="fk_agent_owner"), nullable=True)
    
    owner = relationship("User", foreign_keys=[owner_id], back_populates="business_locations")
    
    transactions = relationship("Transaction", back_populates="agent")
    daily_metrics = relationship("AgentDailyMetrics", back_populates="agent")
    forecasts = relationship("Forecast", back_populates="agent")
    recommendations = relationship("Recommendation", back_populates="agent")
    anomalies = relationship("Anomaly", back_populates="agent")

class Customer(Base):
    __tablename__ = "customers"
    
    customer_id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String, nullable=False)  # Anonymized identifier for privacy
    consent_status = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime, nullable=True)
    profile_created_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    transactions = relationship("Transaction", back_populates="customer")
    financial_profile = relationship("CustomerFinancialProfile", back_populates="customer", uselist=False)
    credit_assessments = relationship("CreditAssessment", back_populates="customer")
    loans = relationship("Loan", back_populates="customer")

class Transaction(Base):
    __tablename__ = "transactions"
    
    transaction_id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.agent_id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    transaction_type = Column(String, nullable=False)  # deposit, withdrawal, transfer, airtime, bill_payment, merchant_payment
    amount = Column(Float, nullable=False)
    direction = Column(String, nullable=False)  # inflow, outflow
    cash_balance = Column(Float, nullable=False)  # Agent's balance post-tx
    float_balance = Column(Float, nullable=False)  # Agent's balance post-tx
    commission = Column(Float, default=0.0)
    location = Column(String, nullable=False)  # Ghanaian location
    
    agent = relationship("Agent", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    anomalies = relationship("Anomaly", back_populates="transaction")

class Loan(Base):
    __tablename__ = "loans"
    
    loan_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    amount = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    term = Column(Integer, nullable=False)  # in days
    status = Column(String, default="active")  # active, paid, defaulted
    repayment_status = Column(String, default="current")  # current, late, defaulted
    days_late = Column(Integer, default=0)
    default_flag = Column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="loans")

# --- DERIVED TABLES ---
class CustomerFinancialProfile(Base):
    __tablename__ = "customer_financial_profiles"
    
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), primary_key=True)
    activity_days = Column(Integer, default=0)
    transaction_count = Column(Integer, default=0)
    transaction_volume = Column(Float, default=0.0)
    average_transaction_value = Column(Float, default=0.0)
    median_transaction_value = Column(Float, default=0.0)
    monthly_inflows = Column(Float, default=0.0)    # Observed inflows
    monthly_outflows = Column(Float, default=0.0)
    inflow_outflow_ratio = Column(Float, default=0.0)
    cashflow_volatility = Column(Float, default=0.0)
    transaction_consistency = Column(Float, default=0.0)  # active days/total history days
    savings_behavior_score = Column(Float, default=0.0)    # e.g., ratio of savings/deposits or consistency
    activity_growth_rate = Column(Float, default=0.0)
    financial_history_months = Column(Float, default=0.0)
    repayment_history_score = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    customer = relationship("Customer", back_populates="financial_profile")

class AgentDailyMetrics(Base):
    __tablename__ = "agent_daily_metrics"
    
    metric_id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.agent_id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    total_transactions = Column(Integer, default=0)
    total_volume = Column(Float, default=0.0)
    total_commission = Column(Float, default=0.0)
    avg_cash_balance = Column(Float, default=0.0)
    avg_float_balance = Column(Float, default=0.0)
    anomaly_count = Column(Integer, default=0)
    
    agent = relationship("Agent", back_populates="daily_metrics")

# --- ML OUTPUT TABLES ---
class CreditAssessment(Base):
    __tablename__ = "credit_assessments"
    
    assessment_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    model_version = Column(String, nullable=False)
    repayment_probability = Column(Float, nullable=False)
    default_probability = Column(Float, nullable=False)
    credit_score = Column(Integer, nullable=False)  # 300 - 850
    risk_category = Column(String, nullable=False)  # High, Moderate-High, Moderate-Low, Low
    indicative_credit_capacity = Column(Float, nullable=False)  # GH₵ Capacity estimate
    assessment_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    customer = relationship("Customer", back_populates="credit_assessments")
    explanations = relationship("CreditExplanation", back_populates="assessment", cascade="all, delete-orphan")

class CreditExplanation(Base):
    __tablename__ = "credit_explanations"
    
    explanation_id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("credit_assessments.assessment_id"), nullable=False)
    feature_name = Column(String, nullable=False)
    importance_value = Column(Float, nullable=False)  # positive or negative SHAP contribution
    
    assessment = relationship("CreditAssessment", back_populates="explanations")

class Forecast(Base):
    __tablename__ = "forecasts"
    
    forecast_id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.agent_id"), nullable=False)
    forecast_date = Column(Date, nullable=False, index=True)
    predicted_transaction_volume = Column(Float, nullable=False)
    predicted_float_demand = Column(Float, nullable=False)
    predicted_cash_demand = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)  # Uncertainty score/bounds width
    model_version = Column(String, nullable=False)
    
    agent = relationship("Agent", back_populates="forecasts")

class Anomaly(Base):
    __tablename__ = "anomalies"
    
    anomaly_id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.agent_id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.transaction_id"), nullable=True)
    severity = Column(String, nullable=False)  # Low, Medium, High
    reason = Column(String, nullable=False)  # e.g., "Unusual transaction activity detected."
    score = Column(Float, nullable=False)  # Isolation forest score
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    agent = relationship("Agent", back_populates="anomalies")
    transaction = relationship("Transaction", back_populates="anomalies")

# --- RECOMMENDATION TABLES ---
class Recommendation(Base):
    __tablename__ = "recommendations"
    
    recommendation_id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.agent_id"), nullable=False)
    type = Column(String, nullable=False)  # e.g., "rebalance", "cash_deposit"
    severity = Column(String, nullable=False)  # Low, Medium, High
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    recommended_amount = Column(Float, nullable=True)
    recommended_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active")  # active, snoozed, applied
    
    agent = relationship("Agent", back_populates="recommendations")

# --- HACKATHON CORE FEATURES ---
class FinancingRequest(Base):
    __tablename__ = "financing_requests"
    
    request_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    product_name = Column(String, nullable=False)
    requested_amount = Column(Float, nullable=False)
    requested_term = Column(Integer, nullable=False)  # in days
    purpose = Column(Text, nullable=False)
    status = Column(String, default="PENDING_INSTITUTIONAL_REVIEW")  # PENDING_INSTITUTIONAL_REVIEW, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    customer = relationship("Customer", backref="financing_requests")

class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.agent_id"), nullable=True)
    type = Column(String, nullable=False)  # LIQUIDITY, BUSINESS, UNUSUAL_ACTIVITY, CREDIT, SYSTEM
    severity = Column(String, nullable=False)  # Low, Medium, High, Critical
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    
    agent = relationship("Agent", backref="notifications")
