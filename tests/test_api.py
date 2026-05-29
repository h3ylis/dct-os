import json
import os
import tempfile

import pytest

from dct_os.app import create_app


@pytest.fixture
def client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        app = create_app({"TESTING": True, "DATABASE": path})
        with app.test_client() as client:
            yield client
    finally:
        os.unlink(path)


def test_index(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"DCT-OS" in resp.data


def test_list_projects(client):
    resp = client.get("/api/projects?status=All")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 4
    names = {p["name"] for p in data}
    assert "Warrawong Road Rehabilitation" in names


def test_create_project(client):
    resp = client.post(
        "/api/projects",
        data=json.dumps({"name": "Test Project", "code": "TST-001"}),
        content_type="application/json",
    )
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data["name"] == "Test Project"
    assert data["code"] == "TST-001"
    assert data["id"] is not None


def test_update_project(client):
    resp = client.put(
        "/api/projects/1",
        data=json.dumps({"status": "Complete"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["status"] == "Complete"


def test_delete_project(client):
    resp = client.delete("/api/projects/4")
    assert resp.status_code == 200


def test_cost_codes(client):
    resp = client.get("/api/projects/1/cost-codes")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 10


def test_resources(client):
    resp = client.get("/api/resources")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 25


def test_dockets_for_project(client):
    resp = client.get("/api/projects/1/dockets")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) > 0


def test_create_docket(client):
    resp = client.post(
        "/api/projects/1/dockets",
        data=json.dumps({
            "date": "2025-05-01",
            "supplier_name": "Test Supplier",
            "description": "Test docket",
            "qty": 8.0,
            "unit": "Hr",
            "rate": 100.00,
        }),
        content_type="application/json",
    )
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data["amount"] == 800.0
    assert data["supplier_name"] == "Test Supplier"


def test_project_summary(client):
    resp = client.get("/api/projects/1/summary")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["total_dockets"] > 0
    assert data["total_spend"] > 0
    assert data["supplier_count"] > 0


def test_404_on_missing(client):
    resp = client.get("/api/projects/999")
    assert resp.status_code == 404
