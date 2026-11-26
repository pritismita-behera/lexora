from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.database import get_db
from api.auth import require_admin
from domain.models import User
from domain.schemas import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.name).all()


@router.post("", response_model=UserRead, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    record = User(**user.model_dump())
    try:
        db.add(record); db.commit(); db.refresh(record); return record
    except IntegrityError as error:
        db.rollback(); raise HTTPException(409, "A user with this email already exists.") from error


@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    record = db.get(User, user_id)
    if record is None: raise HTTPException(404, "User not found.")
    for field, value in user.model_dump(exclude_unset=True).items(): setattr(record, field, value)
    try:
        db.commit(); db.refresh(record); return record
    except IntegrityError as error:
        db.rollback(); raise HTTPException(409, "A user with this email already exists.") from error


@router.patch("/{user_id}/disable", response_model=UserRead)
def disable_user(user_id: int, db: Session = Depends(get_db)):
    record = db.get(User, user_id)
    if record is None:
        raise HTTPException(404, "User not found.")
    record.status = "disabled"
    db.commit(); db.refresh(record)
    return record


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    record = db.get(User, user_id)
    if record is None: raise HTTPException(404, "User not found.")
    db.delete(record); db.commit()
