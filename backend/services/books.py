from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Book
from schemas import BookCreate, BookUpdate


def list_books(db: Session, *, skip: int = 0, limit: int = 100, search: str | None = None):
    query = select(Book)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(Book.title.ilike(term) | Book.author.ilike(term))
    return list(db.scalars(query.order_by(Book.title).offset(skip).limit(limit)))


def get_book(db: Session, book_id: int):
    return db.get(Book, book_id)


def create_book(db: Session, book: BookCreate):
    record = Book(**book.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_book(db: Session, record: Book, book: BookUpdate):
    changes = book.model_dump(exclude_unset=True)
    effective_total = changes.get("total_copies", record.total_copies)
    effective_available = changes.get("available_copies", record.available_copies)
    if effective_available is not None and effective_total is not None and effective_available > effective_total:
        raise ValueError("available_copies cannot exceed total_copies")
    for field, value in changes.items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


def delete_book(db: Session, record: Book):
    db.delete(record)
    db.commit()
