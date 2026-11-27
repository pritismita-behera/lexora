from datetime import datetime, timedelta


def _admin_headers(client):
    from core.auth import create_access_token, hash_password
    from core.database import get_db
    from domain.models import Admin

    session_override = client.app.dependency_overrides[get_db]
    db_gen = session_override()
    db = next(db_gen)
    admin = Admin(
        name="Test Admin",
        email="notice-admin@lexora.local",
        password_hash=hash_password("TestAdmin@123"),
        role="admin",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    token = create_access_token(admin.admin_id, admin.email, admin.role)
    db_gen.close()
    return {"Authorization": f"Bearer {token}"}


def test_notices_require_authentication(client):
    assert client.get("/api/v1/notices").status_code == 401
    assert client.post("/api/v1/notices", json={"title": "Hello", "content": "World"}).status_code == 401


def test_notice_lifecycle_and_actions(client):
    headers = _admin_headers(client)

    # Create draft notice
    create_res = client.post(
        "/api/v1/notices",
        headers=headers,
        json={"title": "Holiday Hours", "content": "Library closes at 5 PM on Friday."},
    )
    assert create_res.status_code == 201
    notice = create_res.json()
    notice_id = notice["notice_id"]
    assert notice["status"] == "draft"
    assert notice["is_published"] is False
    assert notice["is_important"] is False

    # Edit notice
    edit_res = client.patch(
        f"/api/v1/notices/{notice_id}",
        headers=headers,
        json={"title": "Updated Holiday Hours", "content": "Library closes at 4 PM on Friday."},
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["title"] == "Updated Holiday Hours"

    # Mark as important
    imp_res = client.patch(
        f"/api/v1/notices/{notice_id}/important",
        headers=headers,
        json={"is_important": True},
    )
    assert imp_res.status_code == 200
    assert imp_res.json()["is_important"] is True

    # Schedule publication in the future
    future_pub = (datetime.utcnow() + timedelta(days=2)).isoformat()
    sched_res = client.patch(
        f"/api/v1/notices/{notice_id}/schedule",
        headers=headers,
        json={"scheduled_at": future_pub},
    )
    assert sched_res.status_code == 200
    assert sched_res.json()["status"] == "scheduled"

    # Invalid expiry before scheduled_at is rejected
    bad_expiry = (datetime.utcnow() + timedelta(days=1)).isoformat()
    bad_exp_res = client.patch(
        f"/api/v1/notices/{notice_id}/expiry",
        headers=headers,
        json={"expires_at": bad_expiry},
    )
    assert bad_exp_res.status_code == 422

    # Valid expiry after scheduled_at
    good_expiry = (datetime.utcnow() + timedelta(days=5)).isoformat()
    exp_res = client.patch(
        f"/api/v1/notices/{notice_id}/expiry",
        headers=headers,
        json={"expires_at": good_expiry},
    )
    assert exp_res.status_code == 200
    assert exp_res.json()["expires_at"] is not None

    # Publish immediately
    pub_res = client.patch(f"/api/v1/notices/{notice_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["is_published"] is True
    assert pub_res.json()["status"] == "published"
    assert pub_res.json()["published_at"] is not None

    # Unpublish
    unpub_res = client.patch(f"/api/v1/notices/{notice_id}/unpublish", headers=headers)
    assert unpub_res.status_code == 200
    assert unpub_res.json()["is_published"] is False
    assert unpub_res.json()["status"] == "draft"

    # Set past expiry -> status becomes expired
    past_expiry = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    expired_res = client.patch(
        f"/api/v1/notices/{notice_id}/expiry",
        headers=headers,
        json={"expires_at": past_expiry},
    )
    assert expired_res.status_code == 200
    assert expired_res.json()["status"] == "expired"

    # List & filter
    listed = client.get("/api/v1/notices", headers=headers, params={"important_only": True})
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    # Delete notice
    del_res = client.delete(f"/api/v1/notices/{notice_id}", headers=headers)
    assert del_res.status_code == 204
    assert client.get(f"/api/v1/notices/{notice_id}", headers=headers).status_code == 404
