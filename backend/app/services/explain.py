"""Explainable AI: SHAP contributions from the saved model, turned into plain-language factors."""
from __future__ import annotations

import threading

import joblib
import numpy as np
import pandas as pd
import shap

from app.config import MODEL_DIR
from app.detection.engine import build_context, run_rules
from app.services.data import load_frames
from ml.feature_engineering import FEATURE_DOCS, build_features

_lock = threading.Lock()
_state: dict = {}

FRIENDLY = {
    "mutation_owner_match": "Mutation owner vs registered buyer",
    "mutation_previous_match": "Mutation previous owner vs registered seller",
    "mutation_area_diff": "Mutation area vs registered area",
    "mutation_share_diff": "Mutation share vs transferred share",
    "mutation_type_match": "Mutation type vs registration type",
    "has_mutation": "Mutation record present",
    "registration_buyer_match": "Registration buyer vs transaction buyer",
    "registration_seller_match": "Registration seller vs transaction seller",
    "registration_area_diff": "Registration area vs transaction area",
    "registration_type_match": "Registration type vs transaction type",
    "has_registration": "Registration record present",
    "ownership_chain_consistent": "Ownership chain continuity",
    "seller_prior_share_sold": "Share already sold earlier by this seller",
    "seller_prior_txns_on_parcel": "Earlier sales by this seller on this parcel",
    "share_ratio": "Transferred share vs seller share",
    "transferred_share": "Transferred share",
    "seller_share_before": "Seller recorded share",
    "transferred_area_ratio": "Transferred area vs parcel area",
    "days_since_previous_transfer": "Short transfer interval",
    "has_previous_transfer": "Previous transfer exists",
    "average_transfer_interval": "Average transfer interval",
    "reg_minus_txn_days": "Registration date vs transaction date",
    "mut_minus_reg_days": "Mutation date vs registration date",
    "registration_delay_days": "Registration delay",
    "mutation_delay_days": "Mutation delay",
    "parcel_transaction_count": "Repeated transfer history",
    "ownership_change_count": "Number of ownership changes",
    "ownership_sequence": "Ownership sequence position",
    "transaction_frequency": "Transfer frequency",
}


def _sentence(f: str, v: float, r: pd.Series) -> str:
    """Plain-language sentence for a feature value (r = context row of the transaction)."""
    if f == "mutation_owner_match":
        return "No mutation record exists, so the new owner cannot be confirmed." if v < 0 else \
            "Mutation owner differs from the registered buyer." if v == 0 else "Mutation owner matches the registered buyer."
    if f == "mutation_previous_match":
        return "Mutation previous owner differs from the registered seller." if v == 0 else "Mutation previous owner matches the registered seller."
    if f == "mutation_area_diff":
        return "No mutation record to compare the area with." if v < 0 else f"Mutated area differs from the registered area by {v:.2f} decimal." if v > 0.01 else "Mutated area matches the registered area."
    if f == "mutation_share_diff":
        return f"Mutation share differs from the transferred share by {v:.1f} percentage points." if v > 0.01 else "Mutation share matches."
    if f == "mutation_type_match":
        return "Mutation type differs from the registration type." if v == 0 else "Mutation type matches the registration."
    if f == "has_mutation":
        return "No mutation record is linked to this transaction." if v == 0 else "A mutation record exists."
    if f == "registration_buyer_match":
        return "No registration record exists for this transaction." if v < 0 else "Registered buyer differs from the transaction buyer." if v == 0 else "Registered buyer matches."
    if f == "registration_seller_match":
        return "Registered seller differs from the transaction seller." if v == 0 else "Registered seller matches."
    if f == "registration_area_diff":
        return "No registration record to compare the area with." if v < 0 else f"Registered area differs from the transaction area by {v:.2f} decimal." if v > 0.01 else "Registered area matches."
    if f == "registration_type_match":
        return "Registration type differs from the transaction type." if v == 0 else "Registration type matches."
    if f == "has_registration":
        return "No registration record is linked to this transaction." if v == 0 else "A registration record exists."
    if f == "ownership_chain_consistent":
        return "The recorded seller does not match the recorded previous owner." if v == 0 else "Seller matches the recorded previous owner."
    if f in ("seller_prior_share_sold", "seller_prior_txns_on_parcel"):
        return f"This seller had already sold {r.get('seller_prior_share_sold_val', v):g}% earlier on this parcel." if f == "seller_prior_share_sold" and v > 0 else \
            "This seller had earlier sales on the same parcel." if v > 0 else "No earlier sales by this seller on this parcel."
    if f in ("share_ratio", "transferred_share", "seller_share_before", "transferred_area_ratio"):
        return (f"Transferred share ({r.transferred_share:g}%) is compared with the seller's recorded share ({r.seller_share_before:g}%).")
    if f in ("days_since_previous_transfer", "has_previous_transfer", "average_transfer_interval"):
        d = r.days_since_previous_transfer
        return (f"Parcel was transferred again {int(d)} day(s) after the previous transfer." if pd.notna(d) and d <= 30
                else "Transfer interval looks typical." if pd.notna(d) else "No earlier transfer to compare with.")
    if f in ("reg_minus_txn_days", "mut_minus_reg_days"):
        return "Record dates are out of the expected order." if v < 0 else "Record dates are in the expected order."
    if f in ("parcel_transaction_count", "ownership_change_count", "ownership_sequence", "transaction_frequency"):
        return f"The parcel has {int(r.get('parcel_transaction_count_val', 0)) or 'several'} recorded transfers (repeated transfer history)."
    return FEATURE_DOCS.get(f, f)


def _load():
    with _lock:
        if _state:
            return _state
        bundle = joblib.load(MODEL_DIR / "landguard_model.joblib")
        fr = load_frames()
        ctx = build_context(fr["transactions"], fr["registrations"], fr["mutations"], fr["parcels"])
        sig = run_rules(ctx)
        X = build_features(ctx, sig)[bundle["features"]]
        _state.update(bundle=bundle, ctx=ctx, X=X, idx={t: i for i, t in enumerate(ctx.transaction_id)},
                      explainer=shap.TreeExplainer(bundle["model"]), sig=sig)
        return _state


def explain_transaction(transaction_id: str, top_n: int = 6) -> dict | None:
    s = _load()
    i = s["idx"].get(transaction_id)
    if i is None:
        return None
    x = s["X"].iloc[[i]]
    vals = s["explainer"].shap_values(x)
    vals = np.asarray(vals[1] if isinstance(vals, list) else vals)
    vals = vals[0, :, 1] if vals.ndim == 3 else vals[0]
    row = s["ctx"].iloc[i].copy()
    row["seller_prior_share_sold_val"] = float(x["seller_prior_share_sold"].iloc[0])
    row["parcel_transaction_count_val"] = float(x["parcel_transaction_count"].iloc[0])
    contrib = pd.Series(vals, index=x.columns)
    contrib = contrib[[c for c in contrib.index if c in FRIENDLY]]   # only features we can explain in plain words
    up = contrib[contrib > 0.02].sort_values(ascending=False).head(top_n)
    down = contrib[contrib < -0.02].sort_values().head(3)
    total_up = float(up.sum()) or 1.0
    mk = lambda f, c: {"feature": f, "label": FRIENDLY.get(f, f.replace("_", " ").capitalize()), "shap_value": round(float(c), 4),
                       "share": round(float(c) / total_up, 3) if c > 0 else None,
                       "value": float(x[f].iloc[0]), "explanation": _sentence(f, float(x[f].iloc[0]), row)}
    base = s["explainer"].expected_value
    base = float(np.ravel(base)[-1])
    return {"increasing": [mk(f, c) for f, c in up.items()], "decreasing": [mk(f, c) for f, c in down.items()],
            "base_value": round(base, 4), "model": s["bundle"]["name"], "feature_set": s["bundle"]["feature_set"],
            "note": "SHAP values are in log-odds units of the anomaly model. They explain the model output, not legal facts."}
