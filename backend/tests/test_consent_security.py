"""
Regression tests for consent integrity and access control around referrals,
the simulated USSD gateway and customer opt-in management.
"""
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api.auth import create_access_token
from backend.app.api.credit_referrals import (
    create_referral, list_institutions, post_lending_decision,
    ussd_list_pending, ussd_respond, ussd_revoke,
)
from backend.app.api.customers import list_customers, update_customer_consent
from backend.app.database.connection import Base, get_db
from backend.app.models.db_models import Agent, Customer, Referral, Transaction, User
from backend.app.schemas.schemas import ConsentUpdate, ReferralCreate


def _agent(agent_id, owner_id, name):
    return Agent(
        agent_id=agent_id, owner_id=owner_id, name=name, location="Accra",
        business_age=5, operating_hours="08:00 - 18:00", phone=f"02400000{agent_id:02d}",
        cash_balance=1000.0, float_balance=1000.0, commission_rate=0.01,
    )


def _seed(db):
    """Two agents with their own branches, one lender, one admin, and two customers."""
    kwame = User(user_id=1, username="kwame", password_hash="x", role="AGENT", agent_id=1)
    yaaba = User(user_id=2, username="yaaba", password_hash="x", role="AGENT", agent_id=2)
    lender = User(user_id=3, username="forms_capital", password_hash="x", role="FINANCIAL_INSTITUTION")
    admin = User(user_id=4, username="admin", password_hash="x", role="ADMIN")
    db.add_all([kwame, yaaba, lender, admin, _agent(1, 1, "Kwame Centre"), _agent(2, 2, "Yaaba Centre")])
    db.add_all([
        Customer(customer_id=1048, display_name="Customer #1048", consent_status=True,
                 consent_timestamp=datetime.utcnow() - timedelta(days=400)),
        Customer(customer_id=2000, display_name="Customer #2000", consent_status=False),
    ])
    db.add_all([
        Transaction(transaction_id=1, agent_id=1, customer_id=1048, amount=100.0,
                    transaction_type="deposit", direction="inflow", cash_balance=1000.0,
                    float_balance=1000.0, location="Accra", timestamp=datetime.utcnow()),
        Transaction(transaction_id=2, agent_id=2, customer_id=2000, amount=100.0,
                    transaction_type="deposit", direction="inflow", cash_balance=1000.0,
                    float_balance=1000.0, location="Accra", timestamp=datetime.utcnow()),
    ])
    db.commit()
    return kwame, yaaba, lender, admin


def _refer(db, agent_user, lender, name="Customer #1048"):
    req = ReferralCreate(phone="+233 24 000 0000", name=name, requested_amount=1000.0,
                         purpose="Restock", institution_id=lender.user_id)
    return create_referral(req, current_user=agent_user, db=db)


def test_referral_must_target_a_financial_institution(db_session):
    kwame, yaaba, lender, _ = _seed(db_session)
    req = ReferralCreate(phone="+233", name="Customer #1048", requested_amount=500.0,
                         purpose=None, institution_id=yaaba.user_id)
    with pytest.raises(HTTPException) as exc:
        create_referral(req, current_user=kwame, db=db_session)
    assert exc.value.status_code == 400

    institutions = list_institutions(current_user=kwame, db=db_session)
    assert institutions == [{"user_id": lender.user_id, "name": "Forms Capital"}]


def test_referral_resolves_customer_by_id_reference(db_session):
    kwame, _, lender, _ = _seed(db_session)
    ref = _refer(db_session, kwame, lender, name="customer 1048")
    assert ref["customer_id"] == 1048


def test_ussd_consent_is_scoped_to_referring_agent(db_session):
    kwame, yaaba, lender, admin = _seed(db_session)
    ref = _refer(db_session, kwame, lender)

    # Another agent cannot see or answer Kwame's consent request
    assert ussd_list_pending(caller=yaaba, db=db_session) == []
    with pytest.raises(HTTPException) as exc:
        ussd_respond(ref["referral_id"], selection=1, caller=yaaba, db=db_session)
    assert exc.value.status_code == 404

    # The referring agent and admins can
    assert len(ussd_list_pending(caller=kwame, db=db_session)) == 1
    assert len(ussd_list_pending(caller=admin, db=db_session)) == 1
    ussd_respond(ref["referral_id"], selection=1, caller=kwame, db=db_session)
    assert db_session.get(Referral, ref["referral_id"]).consent_status == "CONSENT_ACTIVE"


def test_ussd_rejects_invalid_or_repeated_responses(db_session):
    kwame, _, lender, _ = _seed(db_session)
    ref = _refer(db_session, kwame, lender)

    with pytest.raises(HTTPException) as exc:
        ussd_respond(ref["referral_id"], selection=7, caller=kwame, db=db_session)
    assert exc.value.status_code == 400

    ussd_respond(ref["referral_id"], selection=2, caller=kwame, db=db_session)
    # A declined request cannot be flipped to granted afterwards
    with pytest.raises(HTTPException) as exc:
        ussd_respond(ref["referral_id"], selection=1, caller=kwame, db=db_session)
    assert exc.value.status_code == 409
    # Nothing active to revoke either
    with pytest.raises(HTTPException) as exc:
        ussd_revoke(ref["referral_id"], caller=kwame, db=db_session)
    assert exc.value.status_code == 409


def test_referral_consent_does_not_touch_global_opt_in(db_session):
    kwame, _, lender, _ = _seed(db_session)
    ref = _refer(db_session, kwame, lender)
    ussd_respond(ref["referral_id"], selection=1, caller=kwame, db=db_session)
    ussd_revoke(ref["referral_id"], caller=kwame, db=db_session)
    # Revoking a single lender's referral leaves the customer's own profiling opt-in intact
    assert db_session.get(Customer, 1048).consent_status is True

    ref2 = _refer(db_session, kwame, lender, name="Brand New Customer")
    ussd_respond(ref2["referral_id"], selection=1, caller=kwame, db=db_session)
    # Granting one lender access does not opt the customer in for every lender
    assert db_session.get(Customer, ref2["customer_id"]).consent_status is False


def test_lending_decision_is_validated(db_session):
    kwame, _, lender, _ = _seed(db_session)
    ref = _refer(db_session, kwame, lender)
    with pytest.raises(HTTPException) as exc:
        post_lending_decision(ref["referral_id"], decision="WHATEVER", current_user=lender, db=db_session)
    assert exc.value.status_code == 400
    post_lending_decision(ref["referral_id"], decision="manual_review", current_user=lender, db=db_session)
    assert db_session.get(Referral, ref["referral_id"]).application_status == "MANUAL_REVIEW"


def test_agents_only_manage_consent_for_their_own_customers(db_session):
    kwame, _, _, admin = _seed(db_session)

    visible = [c.customer_id for c in list_customers(current_user=kwame, db=db_session)]
    assert visible == [1048]

    with pytest.raises(HTTPException) as exc:
        update_customer_consent(2000, ConsentUpdate(consent_status=True), current_user=kwame, db=db_session)
    assert exc.value.status_code == 404

    update_customer_consent(1048, ConsentUpdate(consent_status=False), current_user=kwame, db=db_session)
    assert db_session.get(Customer, 1048).consent_status is False

    update_customer_consent(2000, ConsentUpdate(consent_status=True), current_user=admin, db=db_session)
    assert db_session.get(Customer, 2000).consent_status is True


# --- HTTP-level checks (dependency wiring) ---

@pytest.fixture
def client():
    from backend.app.main import app

    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with Session() as db:
        _seed(db)

    def _override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=engine)


def _auth(username, role):
    return {"Authorization": f"Bearer {create_access_token({'sub': username, 'role': role})}"}


def test_ussd_endpoints_require_authentication(client):
    assert client.get("/api/ussd/pending-requests").status_code == 401
    assert client.post("/api/ussd/consent-respond?referral_id=1&selection=1").status_code == 401
    assert client.post("/api/ussd/consent-revoke?referral_id=1").status_code == 401


def test_lenders_cannot_grant_consent(client):
    headers = _auth("forms_capital", "FINANCIAL_INSTITUTION")
    assert client.get("/api/ussd/pending-requests", headers=headers).status_code == 403
    resp = client.post("/api/customers/2000/consent", json={"consent_status": True}, headers=headers)
    assert resp.status_code == 403


def test_gateway_key_authorises_ussd_gateway(client, monkeypatch):
    monkeypatch.setenv("USSD_GATEWAY_KEY", "test-gateway-key")
    assert client.get("/api/ussd/pending-requests", headers={"X-USSD-Gateway-Key": "wrong"}).status_code == 401
    resp = client.get("/api/ussd/pending-requests", headers={"X-USSD-Gateway-Key": "test-gateway-key"})
    assert resp.status_code == 200


def test_volume_by_month_groups_categories_and_scopes_agent(db_session):
    from backend.app.api.analytics import get_volume_by_month
    kwame, yaaba, _, _ = _seed(db_session)
    db_session.add(Transaction(transaction_id=3, agent_id=1, customer_id=1048, amount=50.0,
                               transaction_type="airtime", direction="outflow", cash_balance=1000.0,
                               float_balance=1000.0, location="Accra", timestamp=datetime.utcnow()))
    db_session.commit()
    res = get_volume_by_month(agent_id=2, months=6, current_user=kwame, db=db_session)
    assert res["agent_id"] == 1  # agents are pinned to their own branch
    month = res["months"][-1]
    assert month["deposits"] == 100.0 and month["payments"] == 50.0 and month["total"] == 150.0
    assert res["projection"]["total"] == 150.0


def test_volume_by_month_type_mix_and_platform_scope(db_session):
    from backend.app.api.analytics import get_volume_by_month
    kwame, _, lender, _ = _seed(db_session)
    platform = get_volume_by_month(agent_id=None, months=6, current_user=lender, db=db_session)
    assert platform["agent_id"] is None
    assert {t["type"] for t in platform["by_type"]} == {"deposit"}
    assert platform["by_type"][0]["share"] == 100.0
    assert platform["months"][-1]["deposits"] == 200.0  # both agents' deposits
    mine = get_volume_by_month(agent_id=None, months=6, current_user=kwame, db=db_session)
    assert mine["months"][-1]["deposits"] == 100.0


def test_regional_activity_aggregates_by_branch_location(db_session):
    from backend.app.api.analytics import get_regional_activity
    kwame, _, _, _ = _seed(db_session)
    res = get_regional_activity(current_user=kwame, db=db_session)
    assert len(res["regions"]) == 1  # both seeded branches are in "Accra"
    assert res["regions"][0]["volume"] == 200.0
    assert res["regions"][0]["agent_count"] == 2
    assert res["regions"][0]["share"] == 100.0
