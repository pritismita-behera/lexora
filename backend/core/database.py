import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker


load_dotenv()


class Base(DeclarativeBase):
    pass


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost:3306/lexora",
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


AUDIT_COLUMNS = {
    "created_by": "INTEGER NULL",
    "updated_by": "INTEGER NULL",
    "created_date": "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_date": "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
}


def ensure_audit_columns() -> None:
    """Add audit columns to existing installations without destroying data.

    ``create_all`` only creates missing tables; it does not alter tables that
    already exist. This small, idempotent upgrade keeps existing MySQL
    installations compatible while a proper migration tool is introduced.
    """
    inspector = inspect(engine)
    if engine.dialect.name == "sqlite":
        # SQLite test databases are recreated from metadata, so no ALTER is
        # needed and SQLite's timestamp defaults vary between versions.
        return
    for table in ("books", "authors", "publishers", "categories", "users", "admins", "book_issues"):
        if not inspector.has_table(table):
            continue
        existing = {column["name"] for column in inspector.get_columns(table)}
        for column, definition in AUDIT_COLUMNS.items():
            if column not in existing:
                with engine.begin() as connection:
                    connection.execute(text(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
