from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.connection import is_sqlite_active
from backend.app.api import (
    auth, agents, customers, transactions, 
    analytics, forecasts, liquidity, credit, 
    anomalies, demo, models
)

app = FastAPI(
    title="MobiFin AI API",
    description="AI-powered financial intelligence and alternative credit platform for mobile money agents",
    version="1.0.0"
)

# Set up CORS middleware for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon portability; restrict in production
    allow_credentials=True,
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

@app.get("/api/status")
def get_system_status():
    """Checks overall backend health and active database type"""
    db_mode = "SQLite Fallback" if is_sqlite_active() else "PostgreSQL (Canonical)"
    return {
        "status": "healthy",
        "database": db_mode,
        "sqlite_active": is_sqlite_active(),
        "timestamp": datetime.utcnow().isoformat() if 'datetime' in globals() else None
    }

# Quick import fix for status timestamp
from datetime import datetime
@app.get("/api/status")
def get_system_status():
    db_mode = "SQLite Fallback" if is_sqlite_active() else "PostgreSQL (Canonical)"
    return {
        "status": "healthy",
        "database": db_mode,
        "sqlite_active": is_sqlite_active(),
        "timestamp": datetime.utcnow().isoformat()
    }
