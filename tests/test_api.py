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


def _create_test_dockets(client):
    """Create a small set of dockets for tests that need transaction data.

    Creates 3 docket headers under project 1 (Warrawong Road):
      - RGC-0001 (2025-02-03): 2 lines, total $2,640
      - RGC-0003 (2025-02-04): 1 line,  total $1,125
      - RGC-0005 (2025-02-05): 1 line,  total $1,880

    All assigned to PO 1 (Redgum Civil 45201).
    Grand total: $5,645

    Returns a list of created docket IDs.
    """
    dockets = [
        {
            "date": "2025-02-03",
            "supplier_name": "Redgum Civil Pty Ltd",
            "docket_number": "RGC-0001",
            "purchase_order_id": 1,
            "lines": [
                {"work_order_id": 2, "cost_code_id": 2, "resource_id": 1,
                 "description": "Earthworks - 20T Exc", "qty": 8, "unit": "Hr", "rate": 220},
                {"work_order_id": 2, "cost_code_id": 2, "resource_id": 9,
                 "description": "Earthworks - Super", "qty": 8, "unit": "Hr", "rate": 110},
            ],
        },
        {
            "date": "2025-02-04",
            "supplier_name": "Redgum Civil Pty Ltd",
            "docket_number": "RGC-0003",
            "purchase_order_id": 1,
            "lines": [
                {"work_order_id": 2, "cost_code_id": 2, "resource_id": 2,
                 "description": "Earthworks - 10T Tip", "qty": 9, "unit": "Hr", "rate": 125},
            ],
        },
        {
            "date": "2025-02-05",
            "supplier_name": "Redgum Civil Pty Ltd",
            "docket_number": "RGC-0005",
            "purchase_order_id": 1,
            "lines": [
                {"work_order_id": 3, "cost_code_id": 3, "resource_id": 3,
                 "description": "Pavement - Grader", "qty": 8, "unit": "Hr", "rate": 235},
            ],
        },
    ]
    ids = []
    for d in dockets:
        resp = client.post("/api/projects/1/dockets", json=d,
                           content_type="application/json")
        ids.append(json.loads(resp.data)["id"])
    return ids


# ---------------------------------------------------------------------------
# Static data tests (projects, cost codes, resources, work orders, POs)
# These rely only on seed.sql reference data — no dockets needed.
# ---------------------------------------------------------------------------

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


def test_404_on_missing(client):
    resp = client.get("/api/projects/999")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Docket CRUD tests — create test dockets via API, then exercise endpoints.
# ---------------------------------------------------------------------------

def test_dockets_for_project(client):
    ids = _create_test_dockets(client)
    resp = client.get("/api/projects/1/dockets")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 3
    first = data[0]
    assert "lines" in first
    assert "total_amount" in first
    assert "line_count" in first
    assert "po_number" in first
    assert "wo_numbers" in first
    assert first["line_count"] == len(first["lines"])
    assert first["total_amount"] > 0


def test_dockets_empty_project(client):
    """A project with no dockets returns an empty list, not an error."""
    resp = client.get("/api/projects/1/dockets")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data == []


def test_get_single_docket(client):
    ids = _create_test_dockets(client)
    resp = client.get(f"/api/dockets/{ids[0]}")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["id"] == ids[0]
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
    ids = _create_test_dockets(client)
    resp = client.put(
        f"/api/dockets/{ids[0]}",
        data=json.dumps({"supplier_name": "Updated Supplier"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["supplier_name"] == "Updated Supplier"
    assert len(data["lines"]) == 2


def test_update_docket_lines(client):
    ids = _create_test_dockets(client)
    resp = client.put(
        f"/api/dockets/{ids[0]}",
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
    ids = _create_test_dockets(client)
    resp = client.delete(f"/api/dockets/{ids[0]}")
    assert resp.status_code == 200
    check = client.get(f"/api/dockets/{ids[0]}")
    assert check.status_code == 404


# ---------------------------------------------------------------------------
# Summary / reporting tests — need docket data to produce meaningful output.
# ---------------------------------------------------------------------------

def test_project_summary(client):
    _create_test_dockets(client)
    resp = client.get("/api/projects/1/summary")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["total_dockets"] == 3
    assert data["total_spend"] == 5645.0  # 2640 + 1125 + 1880
    assert data["supplier_count"] == 1


def test_project_summary_empty(client):
    """Summary with no dockets returns zeroes, not an error."""
    resp = client.get("/api/projects/1/summary")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["total_dockets"] == 0
    assert data["total_spend"] == 0


def test_purchase_orders_with_drawdown(client):
    _create_test_dockets(client)
    resp = client.get("/api/projects/1/purchase-orders")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 8
    redgum = next(p for p in data if p["number"] == "45201")
    assert redgum["value"] == 45000.00
    assert redgum["spent"] == 5645.0
    assert redgum["remaining"] == 45000.00 - 5645.0


def test_cost_report(client):
    _create_test_dockets(client)
    resp = client.get("/api/projects/1/cost-report")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 10
    earthworks = next(c for c in data if c["code"] == "CC102")
    assert earthworks["actual_spend"] == 3765.0  # 2640 + 1125
    assert earthworks["budget_amount"] == 420000.00
    pavement = next(c for c in data if c["code"] == "CC103")
    assert pavement["actual_spend"] == 1880.0


def test_cost_report_empty(client):
    """Cost report with no dockets shows zero actuals."""
    resp = client.get("/api/projects/1/cost-report")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert len(data) == 10
    for cc in data:
        assert cc["actual_spend"] == 0


def test_project_suppliers(client):
    _create_test_dockets(client)
    resp = client.get("/api/projects/1/suppliers")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)
    assert len(data) > 0
    # Should be sorted case-insensitively
    assert data == sorted(data, key=str.lower)
    # Redgum Civil Pty Ltd should be in the list (from dockets + POs)
    assert "Redgum Civil Pty Ltd" in data


# ---------------------------------------------------------------------------
# Docket summary report tests
# ---------------------------------------------------------------------------

def test_docket_summary(client):
    _create_test_dockets(client)
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
    _create_test_dockets(client)
    resp = client.get(
        "/api/projects/1/docket-summary?"
        "supplier=Redgum+Civil+Pty+Ltd&date_from=2025-02-01&date_to=2025-02-28"
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["date_from"] == "2025-02-01"
    assert data["date_to"] == "2025-02-28"
    # All 3 test dockets fall within this range
    assert data["grand_total"] == 5645.0


def test_docket_summary_requires_supplier(client):
    resp = client.get("/api/projects/1/docket-summary")
    assert resp.status_code == 400
    data = json.loads(resp.data)
    assert "supplier" in data["error"].lower()


def test_docket_summary_csv(client):
    _create_test_dockets(client)
    resp = client.get(
        "/api/projects/1/docket-summary/csv?supplier=Redgum+Civil+Pty+Ltd"
    )
    assert resp.status_code == 200
    assert "text/csv" in resp.content_type
    text = resp.data.decode("utf-8")
    lines = text.strip().split("\n")
    assert len(lines) >= 2  # header + at least one data row
    assert "Category" in lines[0]
    assert "Subtotal" in lines[0]


def test_docket_summary_by_ids(client):
    """Summary filtered by specific docket IDs instead of date range."""
    ids = _create_test_dockets(client)
    # Only include first two dockets
    id_str = f"{ids[0]},{ids[1]}"
    resp = client.get(
        f"/api/projects/1/docket-summary?"
        f"supplier=Redgum+Civil+Pty+Ltd&docket_ids={id_str}"
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["docket_ids"] == id_str
    assert data["grand_total"] == 3765.0  # 2640 + 1125 (first two dockets)

    # Unfiltered should include all three
    all_resp = client.get(
        "/api/projects/1/docket-summary?supplier=Redgum+Civil+Pty+Ltd"
    )
    all_data = json.loads(all_resp.data)
    assert all_data["grand_total"] == 5645.0
    assert data["grand_total"] < all_data["grand_total"]


# ---------------------------------------------------------------------------
# By-supplier and duplicate detection
# ---------------------------------------------------------------------------

def test_dockets_by_supplier(client):
    """List docket headers for a specific supplier."""
    _create_test_dockets(client)
    resp = client.get(
        "/api/projects/1/dockets/by-supplier?supplier=Redgum+Civil+Pty+Ltd"
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert isinstance(data, list)
    assert len(data) == 3
    first = data[0]
    assert "id" in first
    assert "date" in first
    assert "docket_number" in first
    assert "total_amount" in first


def test_dockets_by_supplier_requires_supplier(client):
    resp = client.get("/api/projects/1/dockets/by-supplier")
    assert resp.status_code == 400


def test_check_hashes(client):
    """Create a docket with source_hash, then verify check-hashes finds it."""
    # Create a docket with a source hash
    docket = {
        "date": "2025-06-01",
        "supplier_name": "Test Supplier",
        "docket_number": "HASH-001",
        "source_hash": "abc123def456",
        "source_filename": "test_docket.pdf",
        "lines": [{"description": "Test", "qty": 1, "rate": 100}],
    }
    resp = client.post("/api/projects/1/dockets",
                       json=docket, content_type="application/json")
    assert resp.status_code == 201
    created = json.loads(resp.data)
    assert created["source_hash"] == "abc123def456"
    assert created["source_filename"] == "test_docket.pdf"

    # Check that the hash is found
    check = client.post("/api/projects/1/check-hashes",
                        json={"hashes": ["abc123def456", "unknown_hash"]},
                        content_type="application/json")
    assert check.status_code == 200
    check_data = json.loads(check.data)
    existing_hashes = [e["source_hash"] for e in check_data["existing"]]
    assert "abc123def456" in existing_hashes
    assert "unknown_hash" not in existing_hashes


def test_check_duplicate(client):
    """Check duplicate detection by supplier+number+date."""
    _create_test_dockets(client)
    resp = client.get(
        "/api/projects/1/check-duplicate?"
        "supplier=Redgum+Civil+Pty+Ltd&docket_number=RGC-0001&date=2025-02-03"
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["duplicate"] is True
    assert data["existing_id"] is not None

    # Non-existing combo
    resp2 = client.get(
        "/api/projects/1/check-duplicate?"
        "supplier=Nobody&docket_number=NOPE-999&date=2099-01-01"
    )
    data2 = json.loads(resp2.data)
    assert data2["duplicate"] is False


# ---------------------------------------------------------------------------
# Claim / unclaim tests
# ---------------------------------------------------------------------------

def test_claim_dockets(client):
    """Claim dockets with a reference string."""
    ids = _create_test_dockets(client)
    resp = client.post(
        "/api/projects/1/dockets/claim",
        json={"docket_ids": [ids[0], ids[1]], "reference": "INV-TEST-001"},
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["claimed"] == 2
    assert data["reference"] == "INV-TEST-001"

    # Verify the docket is now claimed
    docket = client.get(f"/api/dockets/{ids[0]}")
    d = json.loads(docket.data)
    assert d["claimed_reference"] == "INV-TEST-001"
    assert d["claimed_at"] is not None


def test_unclaim_dockets(client):
    """Unclaim previously claimed dockets."""
    ids = _create_test_dockets(client)
    # First claim
    client.post(
        "/api/projects/1/dockets/claim",
        json={"docket_ids": [ids[0]], "reference": "INV-X"},
    )
    # Then unclaim
    resp = client.post(
        "/api/projects/1/dockets/unclaim",
        json={"docket_ids": [ids[0]]},
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["unclaimed"] == 1

    # Verify cleared
    docket = client.get(f"/api/dockets/{ids[0]}")
    d = json.loads(docket.data)
    assert d["claimed_reference"] is None
    assert d["claimed_at"] is None


def test_claim_requires_reference(client):
    ids = _create_test_dockets(client)
    resp = client.post(
        "/api/projects/1/dockets/claim",
        json={"docket_ids": [ids[0]], "reference": ""},
    )
    assert resp.status_code == 400


def test_claim_requires_docket_ids(client):
    resp = client.post(
        "/api/projects/1/dockets/claim",
        json={"docket_ids": [], "reference": "INV-001"},
    )
    assert resp.status_code == 400


def test_dockets_by_supplier_unclaimed_filter(client):
    """Unclaimed filter hides claimed dockets."""
    ids = _create_test_dockets(client)

    # Baseline: 3 Redgum dockets
    all_resp = client.get(
        "/api/projects/1/dockets/by-supplier?supplier=Redgum+Civil+Pty+Ltd"
    )
    all_data = json.loads(all_resp.data)
    assert len(all_data) == 3

    # Claim first docket
    client.post(
        "/api/projects/1/dockets/claim",
        json={"docket_ids": [ids[0]], "reference": "TEST-FILTER"},
    )

    # Unclaimed filter should return 2
    filtered_resp = client.get(
        "/api/projects/1/dockets/by-supplier?"
        "supplier=Redgum+Civil+Pty+Ltd&unclaimed=1"
    )
    filtered_data = json.loads(filtered_resp.data)
    assert len(filtered_data) == 2

    # Without filter, all 3 still returned
    unfiltered_resp = client.get(
        "/api/projects/1/dockets/by-supplier?supplier=Redgum+Civil+Pty+Ltd"
    )
    unfiltered_data = json.loads(unfiltered_resp.data)
    assert len(unfiltered_data) == 3


def test_dockets_by_supplier_returns_claim_fields(client):
    """By-supplier endpoint returns claimed_reference and claimed_at."""
    _create_test_dockets(client)
    resp = client.get(
        "/api/projects/1/dockets/by-supplier?supplier=Redgum+Civil+Pty+Ltd"
    )
    data = json.loads(resp.data)
    first = data[0]
    assert "claimed_reference" in first
    assert "claimed_at" in first
