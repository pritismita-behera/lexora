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


class AuthorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    biography: str | None = None
    nationality: str | None = Field(default=None, max_length=100)


class AuthorRead(AuthorCreate):
    model_config = ConfigDict(from_attributes=True)
    author_id: int


class PublisherCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    address: str | None = None
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)


class PublisherRead(PublisherCreate):
    model_config = ConfigDict(from_attributes=True)
    publisher_id: int


class CategoryCreate(BaseModel):
    category_name: str = Field(min_length=1, max_length=120)
    description: str | None = None


class CategoryRead(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)
    category_id: int
