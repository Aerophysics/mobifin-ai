from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from collections import defaultdict
from sqlalchemy import func
from backend.app.models.db_models import Transaction
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


# Transaction types grouped into the categories shown on the monthly volume chart
VOLUME_CATEGORIES = {
    "deposit": "deposits",
    "withdrawal": "withdrawals",
    "transfer": "transfers",
    "bill_payment": "payments",
    "merchant_payment": "payments",
    "airtime": "payments",
}


@router.get("/volume-by-month")
def get_volume_by_month(
    agent_id: Optional[int] = None,
    months: int = 6,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Monthly transaction value for a branch (or the whole platform for lenders/admins
    when no agent_id is given), split into deposits, withdrawals, transfers
    and payments, for the most recent `months` months that have activity.
    Also returns a trend projection for the next month (trailing 3-month average).
    """
    if current_user.role == "AGENT":
        if not current_user.agent_id:
            raise HTTPException(status_code=400, detail="User is not linked to an agent account.")
        agent_id = current_user.agent_id

    months = max(1, min(months, 12))
    month_col = func.strftime("%Y-%m", Transaction.timestamp) if db.bind.dialect.name == "sqlite" \
        else func.to_char(Transaction.timestamp, "YYYY-MM")

    rows = db.query(
        month_col.label("month"),
        Transaction.transaction_type,
        func.sum(Transaction.amount),
        func.count(Transaction.transaction_id),
    )
    if agent_id:
        rows = rows.filter(Transaction.agent_id == agent_id)
    rows = rows.group_by("month", Transaction.transaction_type).all()

    by_month = defaultdict(lambda: {"deposits": 0.0, "withdrawals": 0.0, "transfers": 0.0, "payments": 0.0, "count": 0})
    type_by_month = defaultdict(lambda: defaultdict(lambda: [0.0, 0]))
    for month, tx_type, total, count in rows:
        type_by_month[month][tx_type][0] += float(total or 0)
        type_by_month[month][tx_type][1] += int(count or 0)
        bucket = by_month[month]
        bucket[VOLUME_CATEGORIES.get(tx_type, "payments")] += float(total or 0)
        bucket["count"] += int(count or 0)

    recent = sorted(by_month.keys())[-months:]
    series = []
    for m in recent:
        b = by_month[m]
        total = b["deposits"] + b["withdrawals"] + b["transfers"] + b["payments"]
        series.append({
            "month": m,
            "deposits": round(b["deposits"], 2),
            "withdrawals": round(b["withdrawals"], 2),
            "transfers": round(b["transfers"], 2),
            "payments": round(b["payments"], 2),
            "total": round(total, 2),
            "transaction_count": b["count"],
        })

    projection = None
    if series:
        window = series[-3:]
        projection = {
            "basis": f"Trailing {len(window)}-month average",
            "total": round(sum(x["total"] for x in window) / len(window), 2),
        }

    # Per-transaction-type totals across the same window (for the mix/donut chart)
    type_totals = defaultdict(lambda: [0.0, 0])
    for m in recent:
        for tx_type, (total, count) in type_by_month[m].items():
            type_totals[tx_type][0] += total
            type_totals[tx_type][1] += count
    grand = sum(v[0] for v in type_totals.values()) or 1.0
    by_type = sorted(
        [{"type": t, "value": round(v[0], 2), "count": v[1], "share": round(v[0] / grand * 100, 1)} for t, v in type_totals.items()],
        key=lambda x: -x["value"],
    )

    return {"agent_id": agent_id, "months": series, "projection": projection, "by_type": by_type}
