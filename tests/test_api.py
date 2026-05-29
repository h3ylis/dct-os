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
    assert "wo_number" in data[0]
    assert "po_number" in data[0]


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
            "work_order_id": 1,
            "cost_code_id": 1,
            "purchase_order_id": 1,
        }),
        content_type="application/json",
    )
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data["amount"] == 800.0
    assert data["supplier_name"] == "Test Supplier"
    assert data["work_order_id"] == 1
    assert data["purchase_order_id"] == 1


def test_project_summary(client):
    resp = client.get("/api/projects/1/summary")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["total_dockets"] > 0
    assert data["total_spend"] > 0
    assert data["supplier_count"] > 0


def test_work_orders(client):
    resp = client.get("/api/projects/1/work-orders")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 7
    numbers = {w["number"] for w in data}
    assert "W2500101" in numbers


def test_create_work_order(client):
    resp = client.post(
        "/api/projects/1/work-orders",
        data=json.dumps({"number": "W9999", "description": "Test WO"}),
        content_type="application/json",
    )
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data["number"] == "W9999"


def test_purchase_orders_with_drawdown(client):
    resp = client.get("/api/projects/1/purchase-orders")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 8
    redgum = next(p for p in data if p["number"] == "45201")
    assert redgum["value"] == 45000.00
    assert redgum["spent"] > 0
    assert redgum["remaining"] < redgum["value"]


def test_create_purchase_order(client):
    resp = client.post(
        "/api/projects/1/purchase-orders",
        data=json.dumps({
            "number": "99999",
            "supplier_name": "Test Supplier",
            "value": 10000.00,
        }),
        content_type="application/json",
    )
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data["number"] == "99999"
    assert data["value"] == 10000.00


def test_wo_cost_codes_matrix(client):
    resp = client.get("/api/work-orders/1/cost-codes")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) >= 1
    assert data[0]["code"] == "CC101"


def test_po_work_orders(client):
    resp = client.get("/api/purchase-orders/1/work-orders")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) >= 1


def test_cost_report(client):
    resp = client.get("/api/projects/1/cost-report")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 10
    earthworks = next(c for c in data if c["code"] == "CC102")
    assert earthworks["actual_spend"] > 0
    assert earthworks["budget_amount"] == 420000.00


def test_404_on_missing(client):
    resp = client.get("/api/projects/999")
    assert resp.status_code == 404
