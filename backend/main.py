import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from core.audit import current_actor_id
from core.auth import decode_access_token

from api.books import router as books_router
from api.authors import router as authors_router
from api.publishers import router as publishers_router
from api.categories import router as categories_router
from api.users import router as users_router
from api.issues import router as issues_router
from api.auth import router as auth_router, ensure_development_admin
from core.database import SessionLocal
from core.database import Base, engine, ensure_audit_columns
import domain.models as models  # noqa: F401 - register all models before table creation

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("lexora")

@asynccontextmanager
async def lifespan(app: FastAPI):
    auto_create_tables = os.getenv("LEXORA_AUTO_CREATE_TABLES", "true").lower() == "true"
    if auto_create_tables:
        logger.info("Checking Lexora database tables")
        Base.metadata.create_all(bind=engine)
        ensure_audit_columns()
        with SessionLocal() as db:
            ensure_development_admin(db)
        logger.info("Lexora database tables are ready")
        with engine.connect() as connection:
            database, host, port, user = connection.execute(
                text("SELECT DATABASE(), @@hostname, @@port, USER()")
            ).one()
            logger.info(
                "Database connection: database=%s host=%s port=%s user=%s",
                database,
                host,
                port,
                user,
            )
    yield


app = FastAPI(
    title="Lexora E-Library API",
    description="REST API for browsing and managing the Lexora book catalogue.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books_router, prefix="/api/v1")
app.include_router(authors_router, prefix="/api/v1")
app.include_router(publishers_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(issues_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")


@app.middleware("http")
async def log_requests(request, call_next):
    logger.info("Request started: %s %s", request.method, request.url.path)
    actor_token = current_actor_id.set(None)
    authorization = request.headers.get("Authorization", "")
    if authorization.lower().startswith("bearer "):
        try:
            claims = decode_access_token(authorization[7:].strip())
            current_actor_id.set(int(claims["sub"]))
        except Exception:
            current_actor_id.set(None)
    try:
        response = await call_next(request)
    finally:
        current_actor_id.reset(actor_token)
    logger.info(
        "Request completed: %s %s -> %s",
        request.method,
        request.url.path,
        response.status_code,
    )
    return response



@app.get("/", tags=["health"])
def health_check():
    return {"message": "Lexora E-Library API is running"}
