import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.auth import create_access_token, decode_access_token, hash_password, verify_password
from core.database import get_db
from domain.models import Admin
from domain.schemas import AdminCreate, AdminRead
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: int
    name: str
    role: str


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == credentials.email.strip().lower()).first()
    if admin is None or admin.status != "active" or not verify_password(credentials.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    return LoginResponse(access_token=create_access_token(admin.admin_id, admin.email, admin.role), admin_id=admin.admin_id, name=admin.name, role=admin.role)


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    try:
        claims = decode_access_token(credentials.credentials)
    except Exception as error:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from error
    if claims.get("role") not in {"admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Admin access is required.")
    return claims


@router.get("/admins", response_model=list[AdminRead])
def list_admins(db: Session = Depends(get_db), claims: dict = Depends(require_admin)):
    return db.query(Admin).order_by(Admin.name).all()


@router.post("/admins", response_model=AdminRead, status_code=status.HTTP_201_CREATED)
def create_admin(
    admin: AdminCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_admin),
):
    record = Admin(
        name=admin.name.strip(),
        email=admin.email.strip().lower(),
        password_hash=hash_password(admin.password),
        role=admin.role,
        created_by=int(claims["sub"]),
        updated_by=int(claims["sub"]),
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="An admin with this email already exists.") from error


def ensure_development_admin(db: Session):
    email = os.getenv("LEXORA_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("LEXORA_ADMIN_PASSWORD")
    if not email or not password:
        return
    admin = db.query(Admin).filter(Admin.email == email).first()
    if admin is None:
        db.add(Admin(name="Lexora Admin", email=email, password_hash=hash_password(password)))
    elif os.getenv("LEXORA_SYNC_ADMIN_PASSWORD", "true").lower() == "true":
        admin.password_hash = hash_password(password)
        admin.status = "active"
    db.commit()
