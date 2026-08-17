from logging.config import fileConfig
import os
import sys
from sqlalchemy import engine_from_config, pool, create_engine
from alembic import context
from dotenv import load_dotenv

# Add backend and project root directories to system path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, BASE_DIR)

# Load environment variables
load_dotenv()

# Import Base and models so they are registered on target_metadata
from backend.app.database.connection import Base, is_sqlite_active
from backend.app.models.db_models import (
    User, Agent, Customer, Transaction, Loan, 
    CustomerFinancialProfile, AgentDailyMetrics, 
    CreditAssessment, CreditExplanation, Forecast, 
    Anomaly, Recommendation
)

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_url():
    """Retrieve database URL dynamically with SQLite fallback"""
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mobifin")
    sqlite_fallback = os.getenv("SQLITE_FALLBACK", "True").lower() == "true"
    sqlite_path = os.path.join(BASE_DIR, 'mobifin.db')
    sqlite_url = f"sqlite:///{sqlite_path}"

    # Try connecting to PostgreSQL to check availability
    if database_url.startswith("postgresql"):
        try:
            temp_engine = create_engine(database_url, connect_args={"connect_timeout": 3})
            with temp_engine.connect() as conn:
                return database_url
        except Exception:
            if sqlite_fallback:
                print(f"Alembic: PostgreSQL unavailable. Migrating SQLite fallback: {sqlite_url}")
                return sqlite_url
            else:
                raise
    return database_url

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = get_url()
    
    # Override URL configuration dynamically
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = url
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
