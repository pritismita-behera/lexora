import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from schemas import BookCreate, BookRead, BookUpdate
from services import books as book_service

router = APIRouter(prefix="/books", tags=["books"])
logger = logging.getLogger("lexora.books")


def _database_error(db: Session, error: SQLAlchemyError):
    db.rollback()
    logger.exception("Database error while processing books request: %s", error)
    if isinstance(error, IntegrityError):
        logger.error("Integrity error details: %s", error.orig)
        error_code = getattr(error.orig, "args", (None,))[0]
        error_text = str(error.orig).lower()
        if error_code == 1062 or "unique constraint failed: books.isbn" in error_text:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A book with this ISBN already exists.",
            ) from error
        if error_code == 1452:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="author_id, publisher_id, or category_id does not reference an existing record.",
            ) from error
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The book violates a database constraint.",
        ) from error
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="The book could not be saved. Please try again.",
    ) from error


@router.get("", response_model=list[BookRead])
def read_books(
    search: str | None = Query(default=None, max_length=255),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        return book_service.list_books(db, skip=skip, limit=limit, search=search)
    except SQLAlchemyError as error:
        _database_error(db, error)


@router.get("/{book_id}", response_model=BookRead)
def read_book(book_id: int, db: Session = Depends(get_db)):
    try:
        book = book_service.get_book(db, book_id)
    except SQLAlchemyError as error:
        _database_error(db, error)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found.")
    return book


@router.post("", response_model=BookRead, status_code=status.HTTP_201_CREATED)
def add_book(book: BookCreate, db: Session = Depends(get_db)):
    logger.info(
        "Creating book title=%r author_id=%s publisher_id=%s category_id=%s isbn=%s",
        book.title,
        book.author_id,
        book.publisher_id,
        book.category_id,
        book.isbn,
    )
    try:
        created = book_service.create_book(db, book)
        logger.info("Book created successfully book_id=%s", created.id)
        return created
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except SQLAlchemyError as error:
        _database_error(db, error)


@router.put("/{book_id}", response_model=BookRead)
def replace_book(book_id: int, book: BookCreate, db: Session = Depends(get_db)):
    try:
        record = book_service.get_book(db, book_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Book not found.")
        return book_service.update_book(db, record, BookUpdate(**book.model_dump()))
    except HTTPException:
        raise
    except ValueError as error:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(error)) from error
    except SQLAlchemyError as error:
        _database_error(db, error)


@router.patch("/{book_id}", response_model=BookRead)
def edit_book(book_id: int, book: BookUpdate, db: Session = Depends(get_db)):
    try:
        record = book_service.get_book(db, book_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Book not found.")
        if not book.model_fields_set:
            raise HTTPException(status_code=400, detail="Provide at least one field to update.")
        return book_service.update_book(db, record, book)
    except HTTPException:
        raise
    except ValueError as error:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(error)) from error
    except SQLAlchemyError as error:
        _database_error(db, error)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_book(book_id: int, db: Session = Depends(get_db)):
    try:
        record = book_service.get_book(db, book_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Book not found.")
        book_service.delete_book(db, record)
    except HTTPException:
        raise
    except SQLAlchemyError as error:
        _database_error(db, error)
