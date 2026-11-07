from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from models import Publisher
from schemas import PublisherCreate, PublisherRead

router = APIRouter(prefix="/publishers", tags=["publishers"])


def save_publisher(db: Session, record: Publisher):
    try:
        db.add(record); db.commit(); db.refresh(record); return record
    except IntegrityError as error:
        db.rollback(); raise HTTPException(409, "A publisher with these values already exists.") from error
    except SQLAlchemyError as error:
        db.rollback(); raise HTTPException(500, "The publisher could not be saved.") from error


@router.get("", response_model=list[PublisherRead])
def list_publishers(db: Session = Depends(get_db)):
    return db.query(Publisher).order_by(Publisher.name).all()


@router.post("", response_model=PublisherRead, status_code=201)
def create_publisher(publisher: PublisherCreate, db: Session = Depends(get_db)):
    return save_publisher(db, Publisher(**publisher.model_dump()))


@router.get("/{publisher_id}", response_model=PublisherRead)
def get_publisher(publisher_id: int, db: Session = Depends(get_db)):
    record = db.get(Publisher, publisher_id)
    if record is None: raise HTTPException(404, "Publisher not found.")
    return record


@router.put("/{publisher_id}", response_model=PublisherRead)
def update_publisher(publisher_id: int, publisher: PublisherCreate, db: Session = Depends(get_db)):
    record = db.get(Publisher, publisher_id)
    if record is None: raise HTTPException(404, "Publisher not found.")
    for field, value in publisher.model_dump().items(): setattr(record, field, value)
    return save_publisher(db, record)


@router.delete("/{publisher_id}", status_code=204)
def delete_publisher(publisher_id: int, db: Session = Depends(get_db)):
    record = db.get(Publisher, publisher_id)
    if record is None: raise HTTPException(404, "Publisher not found.")
    try: db.delete(record); db.commit()
    except IntegrityError as error:
        db.rollback(); raise HTTPException(409, "This publisher is used by a book and cannot be deleted.") from error
