from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, event
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from core.audit import current_actor_id


class AuditMixin:
    """Common audit columns shared by every business table.

    Actor IDs are nullable because records can be created by imports or the
    initial bootstrap admin before an authenticated request exists.
    """

    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    created_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_date: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


@event.listens_for(Base, "before_insert", propagate=True)
def set_create_audit_fields(_mapper, _connection, target):
    actor_id = current_actor_id.get()
    if hasattr(target, "created_by") and actor_id is not None:
        target.created_by = actor_id
        target.updated_by = actor_id


@event.listens_for(Base, "before_update", propagate=True)
def set_update_audit_fields(_mapper, _connection, target):
    actor_id = current_actor_id.get()
    if hasattr(target, "updated_by") and actor_id is not None:
        target.updated_by = actor_id


class Book(AuditMixin, Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column("book_id", Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    isbn: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    published_year: Mapped[int | None] = mapped_column("publication_year", Integer, nullable=True)
    edition: Mapped[str | None] = mapped_column(String(100), nullable=True)
    total_copies: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    available_copies: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="available")
    author_id: Mapped[int | None] = mapped_column(
        ForeignKey("authors.author_id"), nullable=True, index=True
    )
    publisher_id: Mapped[int | None] = mapped_column(
        ForeignKey("publishers.publisher_id"), nullable=True, index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.category_id"), nullable=True, index=True
    )

    author_record: Mapped["Author | None"] = relationship(back_populates="books")
    publisher_record: Mapped["Publisher | None"] = relationship(back_populates="books")
    category_record: Mapped["Category | None"] = relationship(back_populates="books")

    @property
    def book_id(self) -> int:
        return self.id


class Author(AuditMixin, Base):
    __tablename__ = "authors"

    author_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    biography: Mapped[str | None] = mapped_column(Text, nullable=True)
    nationality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    books: Mapped[list[Book]] = relationship(back_populates="author_record")


class Publisher(AuditMixin, Base):
    __tablename__ = "publishers"

    publisher_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    books: Mapped[list[Book]] = relationship(back_populates="publisher_record")


class Category(AuditMixin, Base):
    __tablename__ = "categories"

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    books: Mapped[list[Book]] = relationship(back_populates="category_record")


class User(AuditMixin, Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="student")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Admin(AuditMixin, Base):
    __tablename__ = "admins"

    admin_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="admin")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class BookIssue(AuditMixin, Base):
    __tablename__ = "book_issues"

    issue_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.book_id"), nullable=False, index=True)
    issue_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    return_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="issued")
