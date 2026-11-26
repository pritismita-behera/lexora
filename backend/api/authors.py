from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from core.database import get_db
from domain.models import Author
from domain.schemas import AuthorCreate, AuthorRead

router = APIRouter(prefix="/authors", tags=["authors"])


def save_author(db: Session, record: Author):
    try:
        db.add(record); db.commit(); db.refresh(record); return record
    except IntegrityError as error:
        db.rollback(); raise HTTPException(409, "An author with these values already exists.") from error
    except SQLAlchemyError as error:
        db.rollback(); raise HTTPException(500, "The author could not be saved.") from error


@router.get("", response_model=list[AuthorRead])
def list_authors(db: Session = Depends(get_db)):
    return db.query(Author).order_by(Author.name).all()


@router.post("", response_model=AuthorRead, status_code=201)
def create_author(author: AuthorCreate, db: Session = Depends(get_db)):
    return save_author(db, Author(**author.model_dump()))


@router.get("/{author_id}", response_model=AuthorRead)
def get_author(author_id: int, db: Session = Depends(get_db)):
    record = db.get(Author, author_id)
    if record is None: raise HTTPException(404, "Author not found.")
    return record


@router.put("/{author_id}", response_model=AuthorRead)
def update_author(author_id: int, author: AuthorCreate, db: Session = Depends(get_db)):
    record = db.get(Author, author_id)
    if record is None: raise HTTPException(404, "Author not found.")
    for field, value in author.model_dump().items(): setattr(record, field, value)
    return save_author(db, record)


@router.delete("/{author_id}", status_code=204)
def delete_author(author_id: int, db: Session = Depends(get_db)):
    record = db.get(Author, author_id)
    if record is None: raise HTTPException(404, "Author not found.")
    try: db.delete(record); db.commit()
    except IntegrityError as error:
        db.rollback(); raise HTTPException(409, "This author is used by a book and cannot be deleted.") from error
