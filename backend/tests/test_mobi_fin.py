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

# --- NEW MOBIFIN PRODUCT FEATURES TESTS ---
from fastapi import HTTPException
from backend.app.api.features import (
    onboard_agent, get_daily_ledger, create_financing_request, 
    list_financing_requests, list_notifications, mark_notification_as_read,
    AgentOnboardingRequest, FinancingRequestCreate
)
from backend.app.models.db_models import FinancingRequest, Notification, CreditAssessment

def test_agent_onboarding_creation(db_session):
    """Verify onboarding flow creates Agent, User, and welcome system alert"""
    req = AgentOnboardingRequest(
        username="test_new_agent",
        password="testpassword123",
        full_name="Yaaba Mensah",
        business_name="Yaaba Express",
        phone="0241112222",
        region="Ashanti",
        location="Ashanti - Obuasi",
        agent_type="Retailer",
        starting_cash=1500.0,
        starting_float=2500.0
    )
    res = onboard_agent(req, db=db_session)
    assert res["agent_id"] > 0
    assert res["username"] == "test_new_agent"
    assert res["full_name"] == "Yaaba Mensah"
    
    # Assert welcome alert was recorded
    alerts = db_session.query(Notification).filter(Notification.agent_id == res["agent_id"]).all()
    assert len(alerts) == 1
    assert "Account Onboarding Successful" in alerts[0].title

def test_ledger_calculation_and_reconciliation(db_session):
    """Verify daily ledger cash/float calculations and Balanced reconciliation status"""
    agent = Agent(
        agent_id=10,
        name="Test Agent",
        location="Greater Accra - Central Accra",
        business_age=12,
        operating_hours="08:00 - 18:00",
        cash_balance=1000.0,
        float_balance=2000.0
    )
    db_session.add(agent)
    db_session.commit()
    
    tx_day = datetime(2026, 8, 18, 10, 0, 0)
    tx1 = Transaction(
        transaction_id=1001,
        agent_id=10,
        timestamp=tx_day,
        transaction_type="withdrawal",
        amount=500.0,
        direction="outflow",
        cash_balance=500.0,
        float_balance=2500.0,
        commission=7.5,
        location="Greater Accra"
    )
    db_session.add(tx1)
    db_session.commit()
    
    class MockUser:
        agent_id = 10
        role = "AGENT"
        
    res = get_daily_ledger(date_str="2026-08-18", agent_id=10, current_user=MockUser(), db=db_session)
    assert res["opening_cash"] == 1000.0  # 500 + 500
    assert res["opening_float"] == 2000.0 # 2500 - 500
    assert res["cash_out"] == 500.0
    assert res["closing_cash"] == 500.0
    assert res["closing_float"] == 2500.0
    assert res["reconciliation_status"] == "Balanced"

def test_financing_request_eligibility_and_capacity_limits(db_session):
    """Verify consent gating, credit eligibility requirements, and borrowing capacity limits"""
    # 1. New Customer without consent
    cust_no_consent = Customer(
        customer_id=3001,
        display_name="No Consent Cust",
        consent_status=False
    )
    db_session.add(cust_no_consent)
    db_session.commit()
    
    class MockUser:
        role = "FINANCIAL_INSTITUTION"
        agent_id = None
        
    req = FinancingRequestCreate(
        customer_id=3001,
        product_name="Working Capital Facility",
        requested_amount=1000.0,
        requested_term=30,
        purpose="Inventory replenishment"
    )
    # Must fail because consent is false
    with pytest.raises(HTTPException) as exc_info:
        create_financing_request(req, current_user=MockUser(), db=db_session)
    assert exc_info.value.status_code == 400
    assert "consent is unsigned" in exc_info.value.detail

    # 2. Customer with consent but no assessment (insufficient history)
    cust_no_history = Customer(
        customer_id=3002,
        display_name="New Opt-in Cust",
        consent_status=True
    )
    db_session.add(cust_no_history)
    db_session.commit()
    
    req_no_hist = FinancingRequestCreate(
        customer_id=3002,
        product_name="Working Capital Facility",
        requested_amount=1000.0,
        requested_term=30,
        purpose="Stocking"
    )
    # Must fail because no assessment computed
    with pytest.raises(HTTPException) as exc_info:
        create_financing_request(req_no_hist, current_user=MockUser(), db=db_session)
    assert exc_info.value.status_code == 400
    assert "insufficient history" in exc_info.value.detail

    # 3. Customer with assessment, but requested amount exceeds capacity
    cust_eligible = Customer(
        customer_id=3003,
        display_name="KWAME Customer",
        consent_status=True
    )
    db_session.add(cust_eligible)
    db_session.commit()
    
    assess = CreditAssessment(
        customer_id=3003,
        model_version="v1.0.0",
        repayment_probability=0.95,
        default_probability=0.05,
        credit_score=780,
        risk_category="Low",
        indicative_credit_capacity=4000.0,
        assessment_date=datetime.utcnow()
    )
    db_session.add(assess)
    db_session.commit()
    
    # Under limit: should pass
    req_pass = FinancingRequestCreate(
        customer_id=3003,
        product_name="Working Capital Facility",
        requested_amount=3000.0,
        requested_term=30,
        purpose="Inventory Restocking"
    )
    res_pass = create_financing_request(req_pass, current_user=MockUser(), db=db_session)
    assert res_pass["status"] == "PENDING_INSTITUTIONAL_REVIEW"
    assert res_pass["requested_amount"] == 3000.0
    
    # Over limit capacity checks: must raise 400
    req_fail = FinancingRequestCreate(
        customer_id=3003,
        product_name="Working Capital Facility",
        requested_amount=5000.0,
        requested_term=30,
        purpose="Restocking too much"
    )
    with pytest.raises(HTTPException) as exc_info:
        create_financing_request(req_fail, current_user=MockUser(), db=db_session)
    assert exc_info.value.status_code == 400
    assert "exceeds the indicative capacity" in exc_info.value.detail

def test_notification_read_unread_flow(db_session):
    """Verify notification read state toggle and read/unread querying"""
    notif = Notification(
        agent_id=1,
        type="LIQUIDITY",
        severity="High",
        title="Liquidity warning",
        message="Reserves low",
        read=False
    )
    db_session.add(notif)
    db_session.commit()
    
    class MockUser:
        agent_id = 1
        role = "AGENT"
        
    # Check read toggles
    mark_notification_as_read(notification_id=notif.notification_id, current_user=MockUser(), db=db_session)
    assert notif.read is True


def test_agent_onboarding_name_duplication_and_phone_conflict(db_session):
    """Verify that multiple agents can have the same full name but duplicate phone is rejected with 409"""
    # 1. Create first agent (Reginald Amoah, phone: 0241111111)
    req1 = AgentOnboardingRequest(
        username="reginald_1",
        password="password123",
        full_name="Reginald Amoah",
        business_name="Reginald Mobile Money",
        phone="0241111111",
        region="Greater Accra",
        location="Greater Accra - Central Accra",
        agent_type="Retailer",
        starting_cash=2000.0,
        starting_float=4000.0
    )
    res1 = onboard_agent(req1, db=db_session)
    assert res1["agent_id"] > 0
    assert res1["full_name"] == "Reginald Amoah"
    assert res1["phone"] == "0241111111"

    # 2. Create second agent with same name but different phone/username (Reginald Amoah, phone: 0202222222)
    req2 = AgentOnboardingRequest(
        username="reginald_2",
        password="password123",
        full_name="Reginald Amoah",
        business_name="Amoah Mobile Services",
        phone="0202222222",
        region="Greater Accra",
        location="Greater Accra - Central Accra",
        agent_type="Retailer",
        starting_cash=3000.0,
        starting_float=5000.0
    )
    res2 = onboard_agent(req2, db=db_session)
    assert res2["agent_id"] > 0
    assert res2["agent_id"] != res1["agent_id"]
    assert res2["full_name"] == "Reginald Amoah"
    assert res2["phone"] == "0202222222"

    # 3. Attempt third agent with same phone as first (Kwame Mensah, phone: 0241111111)
    req3 = AgentOnboardingRequest(
        username="kwame_conflict",
        password="password123",
        full_name="Kwame Mensah",
        business_name="Kwame Mobile",
        phone="0241111111", # Duplicate phone!
        region="Greater Accra",
        location="Greater Accra - Central Accra",
        agent_type="Retailer",
        starting_cash=1000.0,
        starting_float=2000.0
    )
    with pytest.raises(HTTPException) as exc_info:
        onboard_agent(req3, db=db_session)
    assert exc_info.value.status_code == 409
    assert "registered with this phone number" in exc_info.value.detail


def test_agent_multi_location_creation_and_switching(db_session):
    """Verify multi-location creation, listings, switching active context, and distinct parameters"""
    from backend.app.models.db_models import User, Agent
    from backend.app.api.features import (
        create_business_location, list_my_business_locations, 
        set_active_location, BusinessLocationCreateRequest
    )

    # 1. Create a user
    user = User(
        username="reginald_multi",
        password_hash="pwdhash",
        role="AGENT",
        full_name="Reginald Amoah",
        phone_number="0241113333",
        status="active"
    )
    db_session.add(user)
    db_session.flush()

    # 2. Create Accra Location
    req1 = BusinessLocationCreateRequest(
        business_name="Reginald Mobile Money",
        region="Greater Accra",
        city="Accra",
        specific_location="Accra Central",
        agent_type="Retailer",
        starting_cash=4850.0,
        starting_float=7200.0
    )
    loc1 = create_business_location(req1, current_user=user, db=db_session)
    assert loc1.agent_id > 0
    assert loc1.name == "Reginald Mobile Money"
    assert loc1.location == "Greater Accra - Accra"
    assert loc1.cash_balance == 4850.0
    assert loc1.float_balance == 7200.0
    assert loc1.owner_id == user.user_id
    assert user.agent_id == loc1.agent_id  # Should auto-set active

    # 3. Create Kumasi Location (same name, different region/city/starting balances)
    req2 = BusinessLocationCreateRequest(
        business_name="Reginald Mobile Money",
        region="Ashanti",
        city="Kumasi",
        specific_location="Adum Market",
        agent_type="Retailer",
        starting_cash=8100.0,
        starting_float=5600.0
    )
    loc2 = create_business_location(req2, current_user=user, db=db_session)
    assert loc2.agent_id > 0
    assert loc2.agent_id != loc1.agent_id
    assert loc2.name == "Reginald Mobile Money"
    assert loc2.location == "Ashanti - Kumasi"
    assert loc2.cash_balance == 8100.0
    assert loc2.float_balance == 5600.0
    assert loc2.owner_id == user.user_id
    assert user.agent_id == loc2.agent_id  # Should switch active to Kumasi

    # 4. List owned business locations
    my_locations = list_my_business_locations(current_user=user, db=db_session)
    assert len(my_locations) == 2

    # 5. Switch active location back to Accra
    switched_loc = set_active_location(agent_id=loc1.agent_id, current_user=user, db=db_session)
    assert switched_loc.agent_id == loc1.agent_id
    assert user.agent_id == loc1.agent_id


def test_agent_onboarding_no_username(db_session):
    """Verify onboarding creates user with phone number as username when no username is supplied"""
    req = AgentOnboardingRequest(
        username=None,
        password="securepassword123",
        full_name="Reginald Amoah",
        business_name="Reginald Mobile Money",
        phone="0554444444",
        region="Greater Accra",
        location="Greater Accra - Accra Central",
        agent_type="Retailer",
        starting_cash=2000.0,
        starting_float=4000.0
    )
    res = onboard_agent(req, db=db_session)
    assert res["agent_id"] > 0
    assert res["username"] == "0554444444"


def test_liquidity_intelligence_deep_audit(db_session):
    """Verify deep liquidity intelligence audit: cash/float gaps, operational reserve, timing, insufficient history"""
    # 1. Test Agent with sufficient cash but low e-float
    agent = Agent(
        agent_id=10,
        name="Reginald Mobile Money",
        location="Accra",
        business_age=12,
        operating_hours="08:00 - 18:00",
        cash_balance=3000.0,
        float_balance=500.0,
        commission_rate=0.015
    )
    db_session.add(agent)
    db_session.commit()

    # Forecast prediction tomorrow:
    # float demand: 4000.0 (shortfall = 3500.0)
    # cash demand: 1500.0 (shortfall = 0.0)
    forecast_data = {
        "predicted_float_demand": 4000.0,
        "predicted_cash_demand": 1500.0,
        "predicted_transaction_volume": 5500.0,
        "confidence": 0.88,
        "model_version": "v1.0.0"
    }

    # Available cash above reserve = 3000 - 1000 = 2000 GHS.
    # Recommended transfer should be limited to 2000 GHS to protect reserve.
    rec_data = RecommenderService.generate_recommendation(db_session, 10, forecast_data)
    
    # Assertions
    assert rec_data["expected_float_demand"] == 4000.0
    assert rec_data["current_float"] == 500.0
    assert rec_data["predicted_shortfall"] == 3500.0
    assert rec_data["current_cash"] == 3000.0
    assert rec_data["expected_cash_demand"] == 1500.0
    assert rec_data["predicted_cash_shortfall"] == 0.0
    assert rec_data["reserve_violated"] is True
    assert rec_data["forecast_confidence"] == "Strong historical pattern"
    
    rec_details = rec_data["recommendation"]
    assert rec_details is not None
    assert rec_details["recommended_amount"] == 2000.0 # capped by reserve!
    assert rec_details["recommended_time"] == "10:30 AM"

    # 2. Test new location with insufficient history (insufficient_history: True)
    insufficient_forecast = {
        "predicted_float_demand": 9000.0,
        "predicted_cash_demand": 3000.0,
        "predicted_transaction_volume": 12000.0,
        "confidence": 0.50,
        "model_version": "v1.0.0",
        "insufficient_history": True
    }
    
    rec_new = RecommenderService.generate_recommendation(db_session, 10, insufficient_forecast)
    assert rec_new["forecast_confidence"] == "Building forecast history"
    assert rec_new["expected_float_demand"] == 0.0
    assert rec_new["predicted_shortfall"] == 0.0
    assert rec_new["recommendation"] is None

