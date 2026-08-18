from datetime import datetime, timedelta
import pytest
from fastapi import HTTPException
from backend.app.models.db_models import Agent, User, Customer, Transaction, Referral, Loan
from backend.app.api.credit_referrals import (
    create_referral, get_agent_referrals, get_institution_referrals,
    get_referred_customer_profile, post_lending_decision,
    ussd_list_pending, ussd_respond, ussd_revoke
)
from backend.app.schemas.schemas import ReferralCreate

def test_complete_credit_referrals_workflow(db_session):
    # 1. Setup mock agent, institution, and customer
    agent_user = User(user_id=50, username="agent_kwame", password_hash="...", role="AGENT")
    agent = Agent(agent_id=5, owner_id=50, name="Kwame Centre", location="Accra Central", business_age=12, operating_hours="08:00 - 18:00", phone="0241112222", cash_balance=1000.0, float_balance=1000.0, commission_rate=0.01)
    inst_user = User(user_id=60, username="forms_capital", password_hash="...", role="FINANCIAL_INSTITUTION")
    
    db_session.add(agent_user)
    db_session.add(agent)
    db_session.add(inst_user)
    db_session.commit()

    agent_user.agent_id = 5

    # 2. Agent refers customer - Consent request is created
    req = ReferralCreate(
        phone="+233 24 555 6666",
        name="Customer #1048",
        requested_amount=5000.0,
        purpose="Shop restock",
        institution_id=60
    )
    ref = create_referral(req, current_user=agent_user, db=db_session)
    assert ref["referral_id"] > 0
    assert ref["status"] == "CONSENT_REQUESTED"
    assert ref["consent_status"] == "AWAITING_CONSENT"
    assert ref["application_status"] == "PENDING"
    assert ref["customer_name"] == "Customer #1048"

    # Agent cannot view SHAP or alternative credit score in standard listing response
    assert "score" not in ref
    assert "explanations" not in ref

    # Forms Capital cannot access profile before consent
    with pytest.raises(HTTPException) as exc_info:
        get_referred_customer_profile(ref["referral_id"], current_user=inst_user, db=db_session)
    assert exc_info.value.status_code == 403
    assert "consent is required" in exc_info.value.detail

    # 3. Simulate Customer declining consent
    ussd_respond(ref["referral_id"], selection=2, db=db_session)
    ref_db = db_session.query(Referral).filter(Referral.referral_id == ref["referral_id"]).first()
    assert ref_db.consent_status == "CONSENT_DECLINED"
    assert ref_db.status == "CONSENT_DECLINED"

    # Forms Capital access is still blocked
    with pytest.raises(HTTPException) as exc_info:
        get_referred_customer_profile(ref["referral_id"], current_user=inst_user, db=db_session)
    assert exc_info.value.status_code == 403

    # Reset referral status for next step in test
    ref_db.consent_status = "AWAITING_CONSENT"
    ref_db.status = "CONSENT_REQUESTED"
    db_session.commit()

    # 4. Simulate Customer granting consent via USSD
    ussd_respond(ref["referral_id"], selection=1, db=db_session)
    db_session.refresh(ref_db)
    assert ref_db.consent_status == "CONSENT_ACTIVE"
    assert ref_db.status == "CONSENT_GRANTED"
    assert ref_db.consent_expiry is not None

    # Forms Capital can now access profile but is NOT ready for credit (no transactions seeded yet)
    profile = get_referred_customer_profile(ref["referral_id"], current_user=inst_user, db=db_session)
    assert profile["is_ready_for_credit"] is False
    assert profile["assessment"] is None
    assert profile["financial_readiness_score"] >= 0

    # Seed transaction history (95 days of history, 35 transactions)
    for i in range(35):
        t = Transaction(
            transaction_id=2000 + i,
            agent_id=5,
            customer_id=ref_db.customer_id,
            amount=150.0,
            transaction_type="deposit",
            direction="inflow",
            cash_balance=1000.0,
            float_balance=1000.0,
            location="Accra",
            timestamp=datetime.utcnow() - timedelta(days=i*3)
        )
        db_session.add(t)
    db_session.commit()

    # Now customer satisfies the credit eligibility gate!
    profile_ready = get_referred_customer_profile(ref["referral_id"], current_user=inst_user, db=db_session)
    assert profile_ready["is_ready_for_credit"] is True
    assert profile_ready["assessment"] is not None
    assert profile_ready["assessment"]["credit_score"] >= 300
    assert len(profile_ready["assessment"]["factors"]) > 0

    # 5. Financial Institution registers loan underwriting decision
    post_lending_decision(ref["referral_id"], decision="APPROVED", current_user=inst_user, db=db_session)
    db_session.refresh(ref_db)
    assert ref_db.application_status == "APPROVED"
    assert ref_db.status == "APPROVED"

    # Verify decision did not change the ML alternative credit score output
    profile_check = get_referred_customer_profile(ref["referral_id"], current_user=inst_user, db=db_session)
    assert profile_check["assessment"]["credit_score"] == profile_ready["assessment"]["credit_score"]

    # 6. Customer revokes consent via USSD
    ussd_revoke(ref["referral_id"], db=db_session)
    db_session.refresh(ref_db)
    assert ref_db.consent_status == "CONSENT_REVOKED"
    assert ref_db.status == "CANCELLED"

    # Access is now immediately blocked again
    with pytest.raises(HTTPException) as exc_info:
        get_referred_customer_profile(ref["referral_id"], current_user=inst_user, db=db_session)
    assert exc_info.value.status_code == 403
