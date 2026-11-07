from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Book(Base):
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


class Author(Base):
    __tablename__ = "authors"

    author_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    biography: Mapped[str | None] = mapped_column(Text, nullable=True)
    nationality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    books: Mapped[list[Book]] = relationship(back_populates="author_record")


class Publisher(Base):
    __tablename__ = "publishers"

    publisher_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    books: Mapped[list[Book]] = relationship(back_populates="publisher_record")


class Category(Base):
    __tablename__ = "categories"

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    books: Mapped[list[Book]] = relationship(back_populates="category_record")
