import json

import joblib
import pytest

from app.config import MODEL_DIR

pytestmark = pytest.mark.skipif(not (MODEL_DIR / "landguard_model.joblib").exists(), reason="run python -m ml.train first")


def test_metrics_are_real_and_consistent():
    m = json.loads((MODEL_DIR / "metrics.json").read_text())
    cm = m["models"][m["deployed_model"]]["test"]["confusion_matrix"]
    assert sum(cm.values()) == m["test_rows"]
    assert 0 <= m["models"][m["deployed_model"]]["test"]["f1"] <= 1


def test_no_label_leakage_in_features():
    b = joblib.load(MODEL_DIR / "landguard_model.joblib")
    banned = ("label", "flag", "anomaly", "severity", "reason", "evidence_", "score", "_signal")
    assert not [f for f in b["features"] if any(x in f for x in banned)]


def test_prediction_and_shap():
    from app.services.explain import _load, explain_transaction
    s = _load()
    p = s["bundle"]["model"].predict_proba(s["X"].iloc[:5])[:, 1]
    assert ((p >= 0) & (p <= 1)).all()
    e = explain_transaction(s["ctx"].transaction_id.iloc[0])
    assert "increasing" in e and e["model"]
