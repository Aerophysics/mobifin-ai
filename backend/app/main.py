import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.connection import is_sqlite_active
from backend.app.api import (
    auth, agents, customers, transactions, 
    analytics, forecasts, liquidity, credit, 
    anomalies, demo, models, features, credit_referrals
)

app = FastAPI(
    title="MobiFin API",
    description="AI-powered financial intelligence and alternative credit platform for mobile money agents",
    version="1.0.0"
)

# Set up CORS middleware for Vite frontend
frontend_url = os.getenv("FRONTEND_URL", "*")
if frontend_url and frontend_url != "*":
    origins = [x.strip() for x in frontend_url.split(",")]
    origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(forecasts.router, prefix="/api")
app.include_router(liquidity.router, prefix="/api")
app.include_router(credit.router, prefix="/api")
app.include_router(anomalies.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(features.router, prefix="/api")
app.include_router(credit_referrals.router, prefix="/api")

from datetime import datetime

@app.get("/health")
def get_health():
    """Simple production-safe health check endpoint"""
    env = os.getenv("ENVIRONMENT", "production")
    return {
        "status": "ok",
        "service": "MobiFin API",
        "environment": env
    }

@app.get("/api/status")
def get_system_status():
    """Checks overall backend health and active database type"""
    db_mode = "SQLite Fallback" if is_sqlite_active() else "PostgreSQL (Canonical)"
    return {
        "status": "healthy",
        "database": db_mode,
        "sqlite_active": is_sqlite_active(),
        "timestamp": datetime.utcnow().isoformat()
    }
