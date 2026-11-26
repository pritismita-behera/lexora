from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from core.database import get_db
from domain.models import Category
from domain.schemas import CategoryCreate, CategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


def save_category(db: Session, record: Category):
    try:
        db.add(record); db.commit(); db.refresh(record); return record
    except IntegrityError as error:
        db.rollback(); raise HTTPException(409, "A category with this name already exists.") from error
    except SQLAlchemyError as error:
        db.rollback(); raise HTTPException(500, "The category could not be saved.") from error


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.category_name).all()


@router.post("", response_model=CategoryRead, status_code=201)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    return save_category(db, Category(**category.model_dump()))


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(category_id: int, db: Session = Depends(get_db)):
    record = db.get(Category, category_id)
    if record is None: raise HTTPException(404, "Category not found.")
    return record


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, category: CategoryCreate, db: Session = Depends(get_db)):
    record = db.get(Category, category_id)
    if record is None: raise HTTPException(404, "Category not found.")
    for field, value in category.model_dump().items(): setattr(record, field, value)
    return save_category(db, record)


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    record = db.get(Category, category_id)
    if record is None: raise HTTPException(404, "Category not found.")
    try: db.delete(record); db.commit()
    except IntegrityError as error:
        db.rollback(); raise HTTPException(409, "This category is used by a book and cannot be deleted.") from error
