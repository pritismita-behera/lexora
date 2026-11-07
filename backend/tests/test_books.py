def test_book_crud_and_search(client):
    response = client.post(
        "/api/v1/books",
        json={
            "title": "The Left Hand of Darkness",
            "author": "Ursula K. Le Guin",
            "isbn": "9780441478125",
            "published_year": 1969,
        },
    )
    assert response.status_code == 201
    book = response.json()
    book_id = book["id"]
    assert book["book_id"] == book_id
    assert book["total_copies"] == book["available_copies"] == 1

    assert client.get("/api/v1/books", params={"search": "Le Guin"}).json() == [book]
    assert client.get(f"/api/v1/books/{book_id}").status_code == 200

    updated = client.patch(f"/api/v1/books/{book_id}", json={"category": "Sci-Fi"})
    assert updated.status_code == 200
    assert updated.json()["category"] == "Sci-Fi"

    inventory = client.patch(
        f"/api/v1/books/{book_id}",
        json={
            "edition": "Second Edition",
            "total_copies": 5,
            "available_copies": 3,
            "location": "Shelf A-2",
            "status": "available",
            "author_id": 12,
            "publisher_id": 8,
        },
    )
    assert inventory.status_code == 200
    assert inventory.json()["edition"] == "Second Edition"
    assert inventory.json()["available_copies"] == 3
    assert inventory.json()["author_id"] == 12
    assert inventory.json()["publisher_id"] == 8

    assert client.delete(f"/api/v1/books/{book_id}").status_code == 204
    assert client.get(f"/api/v1/books/{book_id}").status_code == 404


def test_validation_and_duplicate_isbn(client):
    invalid = client.post("/api/v1/books", json={"title": "", "author": "Author"})
    assert invalid.status_code == 422

    payload = {"title": "Book", "author": "Author", "isbn": "same-isbn"}
    assert client.post("/api/v1/books", json=payload).status_code == 201
    duplicate = client.post("/api/v1/books", json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "A book with this ISBN already exists."


def test_empty_patch_is_rejected(client):
    book = client.post("/api/v1/books", json={"title": "Book", "author": "Author"}).json()
    response = client.patch(f"/api/v1/books/{book['id']}", json={})
    assert response.status_code == 400


def test_copy_counts_and_status_are_validated(client):
    invalid_counts = client.post(
        "/api/v1/books",
        json={"title": "Book", "author": "Author", "total_copies": 2, "available_copies": 3},
    )
    assert invalid_counts.status_code == 422

    book = client.post("/api/v1/books", json={"title": "Book", "author": "Author"}).json()
    invalid_update = client.patch(
        f"/api/v1/books/{book['id']}", json={"total_copies": 0}
    )
    assert invalid_update.status_code == 422
    invalid_status = client.patch(
        f"/api/v1/books/{book['id']}", json={"status": "lost"}
    )
    assert invalid_status.status_code == 422


def test_author_publisher_and_category_references(client):
    from models import Author, Category, Publisher
    from database import get_db

    session_override = client.app.dependency_overrides[get_db]
    db_generator = session_override()
    db = next(db_generator)
    db.add_all([
        Author(author_id=12, name="Test Author"),
        Publisher(publisher_id=8, name="Test Publisher"),
        Category(category_id=4, category_name="Fiction"),
    ])
    db.commit()
    db_generator.close()

    response = client.post(
        "/api/v1/books",
        json={
            "title": "Referenced Book",
            "author": "Test Author",
            "author_id": 12,
            "publisher_id": 8,
            "category_id": 4,
            "total_copies": 4,
            "available_copies": 4,
        },
    )
    assert response.status_code == 201
    assert response.json()["author_id"] == 12
    assert response.json()["publisher_id"] == 8
    assert response.json()["category_id"] == 4
