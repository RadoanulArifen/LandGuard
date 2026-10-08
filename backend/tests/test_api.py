import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(scope="module")
def demo():
    r = client.get("/api/health")
    if not r.json().get("analysis_ready"):
        pytest.skip("Run import_data.py, ml.train and run_analysis.py first")
    return client.get("/api/demo").json()


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["database"] is True


def test_parcel_search_and_retrieval(demo):
    r = client.get("/api/parcels", params={"district": "Dhaka", "limit": 5})
    assert r.status_code == 200 and r.json()["total"] > 0
    pid = demo["parcel_id"]
    assert client.get("/api/parcels", params={"parcel_id": pid}).json()["items"][0]["parcel_id"] == pid
    p = client.get(f"/api/parcels/{pid}").json()
    assert p["parcel_id"] == pid and p["integrity_status"] in ("High Concern", "Review Required", "Consistent")
    assert client.get(f"/api/parcels/{pid}/history").json()["events"]
    g = client.get(f"/api/parcels/{pid}/graph").json()
    assert g["nodes"] and g["edges"]


def test_transaction_retrieval(demo):
    t = client.get(f"/api/transactions/{demo['transaction_id']}").json()
    assert t["parcel_id"] == demo["parcel_id"] and 0 <= t["priority_score"] <= 100
    assert client.get("/api/transactions", params={"parcel_id": demo["parcel_id"]}).json()["total"] >= 1


def test_not_found_and_validation():
    assert client.get("/api/parcels/P-999999").status_code == 404
    assert client.get("/api/parcels/not-an-id").status_code == 422
    assert client.get("/api/alerts", params={"type": "drop table"}).status_code == 422


def test_alerts_and_investigation(demo):
    a = client.get("/api/alerts", params={"limit": 3}).json()
    assert a["items"] and a["items"][0]["recommended_action"] == "Human Review Required"
    d = client.get(f"/api/alerts/{demo['transaction_id']}").json()
    assert d["evidence"] and "fraud confirmed" not in str(d).lower()
    live = client.post(f"/api/investigate/{demo['transaction_id']}").json()
    assert live["live"] is True and live["priority_score"] == d["priority_score"]
    assert client.get(f"/api/investigations/{demo['transaction_id']}").status_code == 200


def test_registration_mutation_and_dashboard(demo):
    c = client.get(f"/api/registration-mutation/{demo['transaction_id']}").json()
    assert c["rows"] and "inconsistency_count" in c
    s = client.get("/api/dashboard/stats").json()["cards"]
    assert s["high_concern"] + s["review_required"] + s["consistent"] == s["parcels_analyzed"]
    assert client.get("/api/analytics").status_code == 200


def test_report_generation(demo):
    r = client.get(f"/api/reports/{demo['transaction_id']}")
    assert r.status_code == 200 and r.headers["content-type"] == "application/pdf" and r.content[:4] == b"%PDF"


def test_search_alias_owner_registration_mutation_history(demo):
    assert client.get("/api/parcels/search", params={"district": "Dhaka", "limit": 3}).json()["total"] > 0
    pid = demo["parcel_id"]
    h = client.get("/api/ownership/history", params={"parcel_id": pid}).json()
    assert h["transactions"]
    assert client.get("/api/ownership/history").status_code == 422
    owner = h["transactions"][0]["seller_id"]
    o = client.get(f"/api/owners/{owner}").json()
    assert o["owner_id"] == owner and "transactions_as_seller" in o
    assert client.get(f"/api/owners/{owner}/history").json()["transactions"]
    comp = client.get(f"/api/transactions/{demo['transaction_id']}").json()
    if comp["registration_id"]:
        assert client.get(f"/api/registrations/{comp['registration_id']}").status_code == 200
    if comp["mutation_id"]:
        assert client.get(f"/api/mutations/{comp['mutation_id']}").status_code == 200
    assert client.get("/api/owners/O-999999").status_code == 404
