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
    first = data[0]
    assert "lines" in first
    assert "total_amount" in first
    assert "line_count" in first
    assert "po_number" in first
    assert "wo_numbers" in first
    assert first["line_count"] == len(first["lines"])
    assert first["total_amount"] > 0


def test_get_single_docket(client):
    resp = client.get("/api/dockets/1")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["id"] == 1
    assert "lines" in data
    assert len(data["lines"]) == 2
    assert data["lines"][0]["wo_number"] is not None
    assert data["lines"][0]["cost_code"] is not None


def test_create_docket_with_lines(client):
    resp = client.post(
        "/api/projects/1/dockets",
        data=json.dumps({
            "date": "2025-05-01",
            "supplier_name": "Test Supplier",
            "docket_number": "TST-001",
            "purchase_order_id": 1,
            "lines": [
                {
                    "work_order_id": 1,
                    "cost_code_id": 1,
                    "description": "Line A",
                    "qty": 8.0,
                    "unit": "Hr",
                    "rate": 100.00,
                },
                {
                    "work_order_id": 2,
                    "cost_code_id": 2,
                    "description": "Line B",
                    "qty": 4.0,
                    "unit": "Hr",
                    "rate": 200.00,
                },
            ],
        }),
        content_type="application/json",
    )
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data["supplier_name"] == "Test Supplier"
    assert data["purchase_order_id"] == 1
    assert data["line_count"] == 2
    assert data["total_amount"] == 1600.0
    assert data["lines"][0]["amount"] == 800.0
    assert data["lines"][1]["amount"] == 800.0


def test_update_docket_header(client):
    resp = client.put(
        "/api/dockets/1",
        data=json.dumps({"supplier_name": "Updated Supplier"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["supplier_name"] == "Updated Supplier"
    assert len(data["lines"]) == 2


def test_update_docket_lines(client):
    resp = client.put(
        "/api/dockets/1",
        data=json.dumps({
            "lines": [
                {
                    "work_order_id": 1,
                    "cost_code_id": 1,
                    "description": "Replaced line",
                    "qty": 10.0,
                    "unit": "Hr",
                    "rate": 50.00,
                },
            ],
        }),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["line_count"] == 1
    assert data["total_amount"] == 500.0
    assert data["lines"][0]["description"] == "Replaced line"


def test_delete_docket(client):
    resp = client.delete("/api/dockets/1")
    assert resp.status_code == 200
    check = client.get("/api/dockets/1")
    assert check.status_code == 404


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


def test_project_suppliers(client):
    resp = client.get("/api/projects/1/suppliers")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)
    assert len(data) > 0
    # Should be sorted case-insensitively
    assert data == sorted(data, key=str.lower)
    # Redgum Civil Pty Ltd should be in the list (from seed dockets + POs)
    assert "Redgum Civil Pty Ltd" in data


def test_docket_summary(client):
    resp = client.get("/api/projects/1/docket-summary?supplier=Redgum+Civil+Pty+Ltd")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["supplier"] == "Redgum Civil Pty Ltd"
    assert "groups" in data
    assert len(data["groups"]) > 0
    assert data["grand_total"] > 0
    # Each group has items with expected fields
    first_group = data["groups"][0]
    assert "category" in first_group
    assert "items" in first_group
    assert "category_total" in first_group
    first_item = first_group["items"][0]
    assert "resource_desc" in first_item
    assert "total_qty" in first_item
    assert "subtotal" in first_item


def test_docket_summary_date_filter(client):
    resp = client.get("/api/projects/1/docket-summary?supplier=Redgum+Civil+Pty+Ltd&date_from=2025-02-01&date_to=2025-02-28")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["date_from"] == "2025-02-01"
    assert data["date_to"] == "2025-02-28"
    # Should return a subset (or all if everything falls in range)
    assert data["grand_total"] >= 0


def test_docket_summary_requires_supplier(client):
    resp = client.get("/api/projects/1/docket-summary")
    assert resp.status_code == 400
    data = json.loads(resp.data)
    assert "supplier" in data["error"].lower()


def test_docket_summary_csv(client):
    resp = client.get("/api/projects/1/docket-summary/csv?supplier=Redgum+Civil+Pty+Ltd")
    assert resp.status_code == 200
    assert "text/csv" in resp.content_type
    text = resp.data.decode("utf-8")
    lines = text.strip().split("\n")
    assert len(lines) >= 2  # header + at least one data row
    assert "Category" in lines[0]
    assert "Subtotal" in lines[0]


def test_404_on_missing(client):
    resp = client.get("/api/projects/999")
    assert resp.status_code == 404
