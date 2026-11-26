from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BookFields(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    isbn: str | None = Field(default=None, max_length=20)
    description: str | None = None
    category: str | None = Field(default=None, max_length=120)
    published_year: int | None = Field(default=None, ge=0, le=2100)
    edition: str | None = Field(default=None, max_length=100)
    total_copies: int = Field(default=1, ge=0)
    available_copies: int = Field(default=1, ge=0)
    location: str | None = Field(default=None, max_length=255)
    status: Literal["available", "unavailable", "maintenance"] = "available"
    author_id: int | None = Field(default=None, gt=0)
    publisher_id: int | None = Field(default=None, gt=0)
    category_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_copies(self):
        if self.available_copies > self.total_copies:
            raise ValueError("available_copies cannot exceed total_copies")
        return self


class BookCreate(BookFields):
    pass


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    author: str | None = Field(default=None, min_length=1, max_length=255)
    isbn: str | None = Field(default=None, max_length=20)
    description: str | None = None
    category: str | None = Field(default=None, max_length=120)
    published_year: int | None = Field(default=None, ge=0, le=2100)
    edition: str | None = Field(default=None, max_length=100)
    total_copies: int | None = Field(default=None, ge=0)
    available_copies: int | None = Field(default=None, ge=0)
    location: str | None = Field(default=None, max_length=255)
    status: Literal["available", "unavailable", "maintenance"] | None = None
    author_id: int | None = Field(default=None, gt=0)
    publisher_id: int | None = Field(default=None, gt=0)
    category_id: int | None = Field(default=None, gt=0)


class BookRead(BookFields):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_id: int
    created_by: int | None = None
    updated_by: int | None = None
    created_date: datetime
    updated_date: datetime


class AuthorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    biography: str | None = None
    nationality: str | None = Field(default=None, max_length=100)


class AuthorRead(AuthorCreate):
    model_config = ConfigDict(from_attributes=True)
    author_id: int
    created_by: int | None = None
    updated_by: int | None = None
    created_date: datetime
    updated_date: datetime


class PublisherCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    address: str | None = None
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)


class PublisherRead(PublisherCreate):
    model_config = ConfigDict(from_attributes=True)
    publisher_id: int
    created_by: int | None = None
    updated_by: int | None = None
    created_date: datetime
    updated_date: datetime


class CategoryCreate(BaseModel):
    category_name: str = Field(min_length=1, max_length=120)
    description: str | None = None


class CategoryRead(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)
    category_id: int
    created_by: int | None = None
    updated_by: int | None = None
    created_date: datetime
    updated_date: datetime


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=3, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    role: Literal["student", "admin"] = "student"


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: str | None = Field(default=None, min_length=3, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    role: Literal["student", "admin"] | None = None
    status: Literal["active", "disabled"] | None = None


class UserRead(UserCreate):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    status: str
    created_at: datetime
    created_by: int | None = None
    updated_by: int | None = None
    created_date: datetime
    updated_date: datetime


class BookIssueCreate(BaseModel):
    user_id: int = Field(gt=0)
    book_id: int = Field(gt=0)
    due_date: date


class BookIssueRead(BookIssueCreate):
    model_config = ConfigDict(from_attributes=True)
    issue_id: int
    issue_date: date
    return_date: date | None
    status: str
    created_by: int | None = None
    updated_by: int | None = None
    created_date: datetime
    updated_date: datetime


class AdminCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["admin", "super_admin"] = "admin"


class AdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    admin_id: int
    name: str
    email: str
    role: str
    status: str
    created_by: int | None = None
    updated_by: int | None = None
    created_date: datetime
    updated_date: datetime
