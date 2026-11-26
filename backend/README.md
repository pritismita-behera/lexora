# Lexora backend

FastAPI book catalogue API. Controllers live in `api/books.py`,
`api/authors.py`, `api/publishers.py`, and `api/categories.py`; request and
response validation is in `schemas.py`, business logic in `services/books.py`,
and SQLAlchemy persistence in `models.py` and `database.py`.

## Run locally

Python 3.14 or newer is declared by this project. From this directory:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
export DATABASE_URL='mysql+pymysql://USER:PASSWORD@localhost:3306/lexora'
uvicorn main:app --reload
```

Create the `lexora` MySQL database before starting the API. `DATABASE_URL` can
also target another SQLAlchemy-supported MySQL URL. The default local URL is
`mysql+pymysql://root:password@localhost:3306/lexora`.

Interactive OpenAPI documentation is available at `/docs` and `/redoc`. CORS
allows the default React development origins `localhost:5173` and
`127.0.0.1:5173`.

On startup, the development server safely creates any missing SQLAlchemy tables
with `Base.metadata.create_all()`. It does not delete or overwrite existing
rows. Set `LEXORA_AUTO_CREATE_TABLES=false` when using migrations in production.

## Book endpoints

All endpoints are prefixed with `/api/v1`. Book objects have `id`, `title`,
`author`, optional `isbn`, `description`, `category`, `published_year`,
`edition`, `total_copies`, `available_copies`, `location`, `status`, `author_id`,
and `publisher_id`, plus `category_id`. The database column is named
`publication_year` to match the reference; the existing API field remains
`published_year`. Responses expose the primary key as both `id` (for existing
clients) and `book_id`. Titles and authors are required; years must be between 0
and 2100. ISBN values are unique when provided. Copy counts default to 1,
available copies cannot exceed total copies, and status must be `available`,
`unavailable`, or `maintenance`. Author and publisher IDs are optional numeric
references to the `authors`, `publishers`, and `categories` tables. Add those
records before assigning their IDs to a book. The database model follows the
project reference ER diagram; descriptive `author` and `category` text fields
remain available for compatibility with the current API.

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/books` | List books; optional `search`, `skip` (default 0), `limit` (default 100, max 100) | `200` |
| `GET` | `/books/{book_id}` | Retrieve one book | `200` |
| `POST` | `/books` | Create a book with a JSON book object | `201` |
| `PUT` | `/books/{book_id}` | Replace all editable fields | `200` |
| `PATCH` | `/books/{book_id}` | Update one or more supplied fields | `200` |
| `DELETE` | `/books/{book_id}` | Delete a book | `204` |

Reference data for book IDs is managed through the same `/api/v1` prefix:

| Resource | Endpoints |
| --- | --- |
| Authors | `GET/POST /authors`, `GET/PUT/DELETE /authors/{author_id}` |
| Publishers | `GET/POST /publishers`, `GET/PUT/DELETE /publishers/{publisher_id}` |
| Categories | `GET/POST /categories`, `GET/PUT/DELETE /categories/{category_id}` |

Create an author, publisher, and category first, then use the returned IDs when
creating a book. A referenced record cannot be deleted while a book uses it.

Missing books return `404`; invalid request data returns FastAPI's `422`;
duplicate ISBN values return `409`; unexpected database errors return `500`.
Errors use FastAPI's standard `{"detail": "..."}` response.

Example create request:

```http
POST /api/v1/books
Content-Type: application/json

{
  "title": "The Left Hand of Darkness",
  "author": "Ursula K. Le Guin",
  "isbn": "9780441478125",
  "category": "Science Fiction",
  "published_year": 1969
}
```

## Run endpoint tests

```bash
pytest
```

The tests use an in-memory SQLite database and do not need MySQL.
