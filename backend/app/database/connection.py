import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mobifin.database")

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mobifin")
SQLITE_FALLBACK = os.getenv("SQLITE_FALLBACK", "True").lower() == "true"

# Define base directory for SQLite fallback database
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'mobifin.db')}"

# State tracker for fallback mode
sqlite_fallback_active = False
engine = None

# Attempt connecting to PostgreSQL
try:
    if not DATABASE_URL.startswith("postgresql"):
        raise ValueError("Provided DATABASE_URL is not a PostgreSQL URI")
        
    logger.info(f"Attempting to connect to canonical database: {DATABASE_URL.split('@')[-1]}")
    engine = create_engine(
        DATABASE_URL, 
        pool_pre_ping=True,
        connect_args={"connect_timeout": 5} # Fast timeout to trigger fallback if Postgres container is down
    )
    # Quick test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to canonical PostgreSQL database.")
except Exception as e:
    logger.warning(f"Could not connect to PostgreSQL: {e}")
    if SQLITE_FALLBACK:
        logger.info(f"Falling back to SQLite local database at: {SQLITE_URL}")
        engine = create_engine(
            SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
        sqlite_fallback_active = True
    else:
        logger.error("PostgreSQL connection failed and SQLite fallback is disabled.")
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def is_sqlite_active() -> bool:
    """Returns True if the active database is SQLite fallback"""
    return sqlite_fallback_active
