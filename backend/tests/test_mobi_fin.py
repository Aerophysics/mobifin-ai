import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.connection import Base
from backend.app.models.db_models import Agent, Customer, Transaction, Loan, User
from backend.app.ml.feature_engineering import FeatureEngineer
from backend.app.ml.inference import MLInference
from backend.app.services.analytics import AnalyticsService
from backend.app.services.recommender import RecommenderService

# Use an in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(name="db_session")
def fixture_db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_feature_exclusion_location():
    """ML test verifying location is excluded from credit features"""
    txs = [
        {"timestamp": datetime.utcnow() - timedelta(days=5), "amount": 100.0, "direction": "inflow", "transaction_type": "deposit", "location": "Greater Accra"},
        {"timestamp": datetime.utcnow() - timedelta(days=4), "amount": 50.0, "direction": "outflow", "transaction_type": "transfer", "location": "Kumasi"}
    ]
    cutoff = datetime.utcnow()
    features = FeatureEngineer.calculate_features(txs, cutoff)
    
    # Assert that no keys contain 'location' or regional terms
    for key in features.keys():
        assert "location" not in key.lower()
        assert "accra" not in key.lower()
        assert "kumasi" not in key.lower()

def test_credit_thresholds():
    """Verify customer credit eligibility rules (consent, 90 days, 30 transactions)"""
    # 1. No consent
    txs_no_consent = [{"timestamp": datetime.utcnow() - timedelta(days=idx), "amount": 100.0, "direction": "inflow", "transaction_type": "deposit"} for idx in range(100)]
    res = MLInference.assess_customer_credit(txs_no_consent, consent_status=False)
    assert res["eligible"] is False
    assert "Insufficient financial history" in res["reason"]
    
    # 2. Short history (< 90 days)
    txs_short = [{"timestamp": datetime.utcnow() - timedelta(days=idx), "amount": 100.0, "direction": "inflow", "transaction_type": "deposit"} for idx in range(10)]
    res = MLInference.assess_customer_credit(txs_short, consent_status=True)
    assert res["eligible"] is False
    
    # 3. Too few transactions (< 30)
    txs_few = [{"timestamp": datetime.utcnow() - timedelta(days=idx*4), "amount": 100.0, "direction": "inflow", "transaction_type": "deposit"} for idx in range(15)]
    res = MLInference.assess_customer_credit(txs_few, consent_status=True)
    assert res["eligible"] is False

def test_credit_eligibility_success():
    """Verify that a customer meeting all conditions is eligible for a credit assessment"""
    txs_success = [{"timestamp": datetime.utcnow() - timedelta(days=idx*2), "amount": 150.0, "direction": "inflow", "transaction_type": "deposit"} for idx in range(50)]
    res = MLInference.assess_customer_credit(txs_success, consent_status=True)
    assert res["eligible"] is True
    assert "credit_score" in res
    assert 300 <= res["credit_score"] <= 850
    assert "repayment_probability" in res
    assert "default_probability" in res
    assert "risk_category" in res

def test_agent_business_health(db_session):
    """Verify Agent Business Health Score calculation defaults or aggregates"""
    agent = Agent(
        agent_id=1,
        name="Test Kwame Agent",
        location="Greater Accra",
        business_age=12,
        operating_hours="08:00 - 18:00",
        cash_balance=1000.0,
        float_balance=2000.0
    )
    db_session.add(agent)
    db_session.commit()
    
    # Call analytics service
    health_data = AnalyticsService.calculate_business_health(db_session, 1)
    assert health_data["business_health_score"] > 0
    assert "insights" in health_data
    assert len(health_data["insights"]) > 0

def test_liquidity_recommendations(db_session):
    """Verify that a low e-float warning correctly triggers a recommendation"""
    agent = Agent(
        agent_id=2,
        name="Kwame Mobile Money",
        location="Greater Accra",
        business_age=24,
        operating_hours="08:00 - 20:00",
        cash_balance=8000.0,
        float_balance=100.0, # extremely low float
        commission_rate=0.015
    )
    db_session.add(agent)
    db_session.commit()
    
    # Mock high demand prediction (e.g. 5000 GHS)
    forecast_data = {
        "predicted_float_demand": 5000.0,
        "predicted_cash_demand": 1000.0,
        "predicted_transaction_volume": 6000.0,
        "confidence": 0.90,
        "model_version": "v1.0.0"
    }
    
    # Check recommendation
    rec_data = RecommenderService.generate_recommendation(db_session, 2, forecast_data)
    assert rec_data["predicted_shortfall"] == 4900.0 # 5000 - 100
    assert rec_data["warning_level"] == "High"
    assert rec_data["recommendation"] is not None
    assert rec_data["recommendation"]["recommended_amount"] > 0

def test_anomaly_detection():
    """Verify Isolation Forest / deterministic rules for anomaly checks"""
    # 1. Standard transaction
    tx_normal = {"amount": 200.0, "direction": "inflow", "transaction_type": "deposit", "timestamp": datetime(2026, 8, 17, 14, 0, 0), "customer_id": 1}
    is_anom, score, reason = MLInference.inspect_transaction_anomaly(tx_normal, [])
    assert is_anom is False
    
    # 2. Extreme amount rule check
    tx_huge = {"amount": 10000.0, "direction": "outflow", "transaction_type": "withdrawal", "timestamp": datetime(2026, 8, 17, 14, 0, 0), "customer_id": 2}
    is_anom, score, reason = MLInference.inspect_transaction_anomaly(tx_huge, [])
    assert is_anom is True
    assert "exceeds the normal single transaction threshold" in reason
