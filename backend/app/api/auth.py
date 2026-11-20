import os
import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.models.db_models import User
from backend.app.schemas.schemas import Token, UserLogin

router = APIRouter(prefix="/auth", tags=["Authentication"])

logger = logging.getLogger("mobifin.auth")

_SECRET_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".jwt_secret")


def _load_jwt_secret() -> str:
    """
    Resolve the JWT signing secret.
    Prefers the JWT_SECRET env var. Without it, a random per-install secret is generated
    once and persisted to backend/.jwt_secret (gitignored), so no well-known default key
    can ever be used to forge tokens, while tokens still survive dev reloads/restarts.
    """
    env_secret = os.getenv("JWT_SECRET")
    if env_secret:
        return env_secret
    try:
        fd = os.open(_SECRET_FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as f:
            f.write(secrets.token_urlsafe(48))
        logger.warning("JWT_SECRET not set; generated a local signing secret at %s. Set JWT_SECRET in production.", _SECRET_FILE)
    except FileExistsError:
        pass
    with open(_SECRET_FILE) as f:
        return f.read().strip()


# JWT Configuration
JWT_SECRET = _load_jwt_secret()
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login-oauth")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login-oauth", auto_error=False)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

# Current user helper
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_optional_user(token: Optional[str] = Depends(optional_oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    """Returns the authenticated user, or None when no bearer token was supplied."""
    if not token:
        return None
    return get_current_user(token=token, db=db)

# Helper to enforce roles
class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation forbidden for role: {current_user.role}. Requires one of: {self.allowed_roles}"
            )
        return current_user

# Endpoints
@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Standard login endpoint returning JWT token"""
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "username": user.username,
        "agent_id": user.agent_id
    }

@router.post("/login-oauth")
def login_oauth(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 password handler for Swagger Docs integration"""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "username": user.username,
        "agent_id": user.agent_id
    }

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    """Get details of the currently logged in session"""
    return {
        "username": current_user.username,
        "role": current_user.role,
        "agent_id": current_user.agent_id
    }
