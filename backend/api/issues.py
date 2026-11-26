from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from api.auth import require_admin
from domain.models import Book, BookIssue, User
from domain.schemas import BookIssueCreate, BookIssueRead

router = APIRouter(prefix="/book-issues", tags=["book issues"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[BookIssueRead])
def list_issues(db: Session = Depends(get_db)):
    return db.query(BookIssue).order_by(BookIssue.issue_date.desc()).all()


@router.post("", response_model=BookIssueRead, status_code=201)
def issue_book(issue: BookIssueCreate, db: Session = Depends(get_db)):
    user = db.get(User, issue.user_id); book = db.get(Book, issue.book_id)
    if user is None: raise HTTPException(404, "User not found.")
    if user.status != "active": raise HTTPException(409, "This user is disabled and cannot borrow books.")
    if book is None: raise HTTPException(404, "Book not found.")
    if book.available_copies < 1: raise HTTPException(409, "No available copies for this book.")
    if issue.due_date < date.today(): raise HTTPException(422, "Due date cannot be in the past.")
    book.available_copies -= 1
    db_issue = BookIssue(**issue.model_dump())
    db.add(db_issue); db.commit(); db.refresh(db_issue)
    return db_issue


@router.patch("/{issue_id}/return", response_model=BookIssueRead)
def return_book(issue_id: int, db: Session = Depends(get_db)):
    issue = db.get(BookIssue, issue_id)
    if issue is None: raise HTTPException(404, "Book issue not found.")
    if issue.status == "returned": raise HTTPException(409, "This book has already been returned.")
    book = db.get(Book, issue.book_id)
    issue.return_date = date.today(); issue.status = "returned"
    if book is not None: book.available_copies = min(book.total_copies, book.available_copies + 1)
    db.commit(); db.refresh(issue)
    return issue
