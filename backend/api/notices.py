from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from api.auth import require_admin
from core.database import get_db
from domain.models import Notice
from domain.schemas import (
    NoticeCreate,
    NoticeExpiryUpdate,
    NoticeImportantUpdate,
    NoticeRead,
    NoticeScheduleUpdate,
    NoticeUpdate,
)

router = APIRouter(prefix="/notices", tags=["notices"], dependencies=[Depends(require_admin)])


def _get_notice_or_404(db: Session, notice_id: int) -> Notice:
    record = db.get(Notice, notice_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Notice not found.")
    return record


def _save_notice(db: Session, record: Notice) -> Notice:
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(status_code=500, detail="The notice could not be saved.") from error


def _validate_window(scheduled_at: datetime | None, expires_at: datetime | None) -> None:
    if scheduled_at is not None and expires_at is not None and expires_at <= scheduled_at:
        raise HTTPException(status_code=422, detail="Expiry date must be after the scheduled publication date.")


@router.get("", response_model=list[NoticeRead])
def list_notices(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    important_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    query = db.query(Notice)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter((Notice.title.ilike(pattern)) | (Notice.content.ilike(pattern)))
    if important_only:
        query = query.filter(Notice.is_important.is_(True))
    notices = query.order_by(Notice.is_important.desc(), Notice.created_date.desc()).all()
    if status:
        notices = [notice for notice in notices if notice.status == status]
    return notices


@router.get("/{notice_id}", response_model=NoticeRead)
def get_notice(notice_id: int, db: Session = Depends(get_db)):
    return _get_notice_or_404(db, notice_id)


@router.post("", response_model=NoticeRead, status_code=201)
def create_notice(payload: NoticeCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    published_at = now if payload.is_published and payload.scheduled_at is None else None
    record = Notice(
        title=payload.title.strip(),
        content=payload.content.strip(),
        is_published=payload.is_published,
        published_at=published_at,
        scheduled_at=payload.scheduled_at,
        is_important=payload.is_important,
        expires_at=payload.expires_at,
    )
    return _save_notice(db, record)


@router.put("/{notice_id}", response_model=NoticeRead)
def replace_notice(notice_id: int, payload: NoticeCreate, db: Session = Depends(get_db)):
    record = _get_notice_or_404(db, notice_id)
    record.title = payload.title.strip()
    record.content = payload.content.strip()
    record.scheduled_at = payload.scheduled_at
    record.expires_at = payload.expires_at
    record.is_important = payload.is_important
    record.is_published = payload.is_published
    if payload.is_published and payload.scheduled_at is None and record.published_at is None:
        record.published_at = datetime.utcnow()
    elif not payload.is_published:
        record.published_at = None
    return _save_notice(db, record)


@router.patch("/{notice_id}", response_model=NoticeRead)
def update_notice(notice_id: int, payload: NoticeUpdate, db: Session = Depends(get_db)):
    record = _get_notice_or_404(db, notice_id)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Supply at least one field to update.")
    next_scheduled = updates.get("scheduled_at", record.scheduled_at)
    next_expires = updates.get("expires_at", record.expires_at)
    _validate_window(next_scheduled, next_expires)

    for field, value in updates.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(record, field, value)

    if "is_published" in updates:
        if updates["is_published"] and record.scheduled_at is None:
            record.published_at = record.published_at or datetime.utcnow()
        elif not updates["is_published"]:
            record.published_at = None

    return _save_notice(db, record)


@router.patch("/{notice_id}/publish", response_model=NoticeRead)
def publish_notice(notice_id: int, db: Session = Depends(get_db)):
    record = _get_notice_or_404(db, notice_id)
    now = datetime.utcnow()
    record.is_published = True
    if record.scheduled_at is not None and record.scheduled_at > now:
        record.scheduled_at = None
    record.published_at = now
    return _save_notice(db, record)


@router.patch("/{notice_id}/unpublish", response_model=NoticeRead)
def unpublish_notice(notice_id: int, db: Session = Depends(get_db)):
    record = _get_notice_or_404(db, notice_id)
    record.is_published = False
    record.published_at = None
    return _save_notice(db, record)


@router.patch("/{notice_id}/important", response_model=NoticeRead)
def set_important(
    notice_id: int,
    payload: NoticeImportantUpdate | None = None,
    db: Session = Depends(get_db),
):
    record = _get_notice_or_404(db, notice_id)
    record.is_important = (not record.is_important) if payload is None else payload.is_important
    return _save_notice(db, record)


@router.patch("/{notice_id}/schedule", response_model=NoticeRead)
def schedule_notice(notice_id: int, payload: NoticeScheduleUpdate, db: Session = Depends(get_db)):
    record = _get_notice_or_404(db, notice_id)
    _validate_window(payload.scheduled_at, record.expires_at)
    record.scheduled_at = payload.scheduled_at
    if payload.scheduled_at is not None:
        record.is_published = True
        record.published_at = None
    return _save_notice(db, record)


@router.patch("/{notice_id}/expiry", response_model=NoticeRead)
def set_notice_expiry(notice_id: int, payload: NoticeExpiryUpdate, db: Session = Depends(get_db)):
    record = _get_notice_or_404(db, notice_id)
    _validate_window(record.scheduled_at, payload.expires_at)
    record.expires_at = payload.expires_at
    return _save_notice(db, record)


@router.delete("/{notice_id}", status_code=204)
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    record = _get_notice_or_404(db, notice_id)
    db.delete(record)
    db.commit()
