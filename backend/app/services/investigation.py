"""Builds the full investigation bundle for one transaction (alert detail + comparison + AI analysis)."""
from __future__ import annotations

import pandas as pd

from app import config as C
from app.detection.engine import SIGNAL_LABELS, SIGNALS, build_evidence, run_rules
from app.services import parcel as pc
from app.services.explain import explain_transaction
from app.services.scoring import priority_level, priority_score, txn_status

RECOMMENDED = "Human Review Required"


def to_py(o):
    """Recursively turn numpy / pandas scalars into plain Python so FastAPI can serialise them."""
    import numpy as np
    if isinstance(o, dict):
        return {k: to_py(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [to_py(v) for v in o]
    if isinstance(o, np.generic):
        return o.item()
    if isinstance(o, pd.Timestamp):
        return o.strftime("%Y-%m-%d")
    return o


def _v(x):
    return pc._clean(x)


def comparison(row: pd.Series, O) -> dict:
    nm = lambda i: f"{pc._name(O, i)} ({i})" if isinstance(i, str) else "—"
    has_r, has_m = pd.notna(row.r_id), pd.notna(row.m_id)
    d = lambda x: x.strftime("%d %b %Y") if pd.notna(x) else "—"
    n = lambda x: "—" if pd.isna(x) else f"{x:g}"
    tol = C.AREA_TOLERANCE

    def mk(field, t, r, m, reg_ok, mut_ok):
        flags = [x for x in (reg_ok, mut_ok) if x is not None]
        return {"field": field, "transaction": t, "registration": r, "mutation": m,
                "registration_match": reg_ok, "mutation_match": mut_ok,
                "match": None if not flags else all(flags)}
    rows = [
        mk("Record ID", row.transaction_id, row.r_id if has_r else "Missing", row.m_id if has_m else "Missing", None, None),
        mk("Seller / Previous owner", nm(row.seller_id), nm(row.r_seller) if has_r else "Missing", nm(row.m_prev) if has_m else "Missing",
           (row.r_seller == row.seller_id) if has_r else False, (row.m_prev == row.r_seller) if has_m and has_r else (False if not has_m else None)),
        mk("Buyer / New owner", nm(row.buyer_id), nm(row.r_buyer) if has_r else "Missing", nm(row.m_new) if has_m else "Missing",
           (row.r_buyer == row.buyer_id) if has_r else False, (row.m_new == row.r_buyer) if has_m and has_r else (False if not has_m else None)),
        mk("Area (decimal)", n(row.transferred_area_decimal), n(row.r_area) if has_r else "Missing", n(row.m_area) if has_m else "Missing",
           (abs(row.r_area - row.transferred_area_decimal) <= tol) if has_r else False,
           (abs(row.m_area - row.r_area) <= tol) if has_m and has_r else (False if not has_m else None)),
        mk("Ownership share (%)", n(row.transferred_share), "—", n(row.m_new_share) if has_m else "Missing", None,
           (abs(row.m_new_share - row.transferred_share) <= C.SHARE_TOLERANCE) if has_m else False),
        mk("Transaction type", row.transaction_type, row.r_type if has_r else "Missing", row.m_type if has_m else "Missing",
           (row.r_type == row.transaction_type) if has_r else False, (row.m_type == row.r_type) if has_m and has_r else (False if not has_m else None)),
        mk("Date", d(row.transaction_date), d(row.r_date), d(row.m_date),
           (row.r_date >= row.transaction_date) if has_r else False,
           (row.m_date >= row.r_date and row.m_date >= row.transaction_date) if has_m and has_r else (False if not has_m else None)),
        mk("Status", row.transaction_status, row.r_status if has_r else "Missing", row.m_status if has_m else "Missing", None, None),
        mk("Verification", "—", row.r_verif if has_r else "Missing", row.m_verif if has_m else "Missing", None, None),
        mk("Document / reference", "—", row.r_deed if has_r else "Missing", row.m_ref if has_m else "Missing", None, None),
    ]
    mism = [r for r in rows if r["match"] is False]
    return to_py({"transaction_id": row.transaction_id, "rows": rows, "inconsistency_count": len(mism),
            "inconsistent_fields": [r["field"] for r in mism], "has_registration": bool(has_r), "has_mutation": bool(has_m)})


def alert_summary(a: pd.Series, parcel_row=None) -> dict:
    out = {"transaction_id": a.transaction_id, "parcel_id": a.parcel_id, "priority_score": float(a.priority_score),
           "priority_level": a.priority_level, "status": txn_status(a.priority_level),
           "primary_signal": a.primary_signal, "primary_label": SIGNAL_LABELS.get(a.primary_signal, "No signal"),
           "issues": [SIGNAL_LABELS[s] for s in SIGNALS if a[s]], "signals": {s: int(a[s]) for s in SIGNALS},
           "signal_count": int(a.signal_count), "recommended_action": RECOMMENDED}
    return out


def investigation(transaction_id: str, parcel_id: str, live: bool = False) -> dict | None:
    d = pc.load_parcel(parcel_id)
    if d is None:
        return None
    ctx = d["ctx"]
    hit = ctx[ctx.transaction_id == transaction_id]
    if hit.empty:
        return None
    row = hit.iloc[0]
    A = d["A"].set_index("transaction_id")
    a = A.loc[transaction_id].copy()
    a["transaction_id"] = transaction_id
    if live:   # re-run the deterministic rules on the freshly loaded records, keep stored ML score
        sig = run_rules(ctx).set_index("transaction_id").loc[transaction_id]
        for s in SIGNALS:
            a[s] = sig[s]
        a["signal_count"] = int(sig.signal_count)
        a["priority_score"] = priority_score(float(sig.rule_points), float(a.ml_score))
        a["priority_level"] = priority_level(a.priority_score)
        evidence = build_evidence(row, sig.reset_index().iloc[0] if False else sig.rename(transaction_id), d["O"]["synthetic_name"].to_dict(), ctx.set_index("transaction_id"))
    else:
        evidence = pc.parse_evidence(a.evidence_json)
    a["primary_signal"] = next((s for s in ["double_sale", "over_transfer", "ownership_chain_break", "registration_mismatch",
                                            "mutation_mismatch", "temporal_inconsistency", "rapid_transfer"] if a[s]), None)
    summary = alert_summary(a)
    ov = pc.overview(d)
    related = {
        "transaction": {k: _v(row[k]) for k in ["transaction_id", "transaction_date", "transaction_type", "transaction_status",
                                                "transferred_area_decimal", "seller_share_before", "transferred_share",
                                                "seller_share_after", "buyer_share_after", "ownership_sequence",
                                                "days_since_previous_transfer"]} | {
            "seller": f"{pc._name(d['O'], row.seller_id)} ({row.seller_id})", "buyer": f"{pc._name(d['O'], row.buyer_id)} ({row.buyer_id})"},
        "registration": None if pd.isna(row.r_id) else {k: _v(row[k]) for k in ["r_id", "r_date", "r_area", "r_status", "r_deed", "r_type", "r_verif"]},
        "mutation": None if pd.isna(row.m_id) else {k: _v(row[k]) for k in ["m_id", "m_date", "m_area", "m_status", "m_ref", "m_type", "m_verif"]},
    }
    score = float(a.priority_score)
    ml = float(a.ml_score)
    breakdown = {"rule_points": float(min(C.RULE_CAP, a.rule_points)) if not live else float(sig.rule_points),
                 "ml_points": round(C.ML_MAX * ml, 1), "ml_score": round(ml, 4), "rule_cap": C.RULE_CAP, "ml_max": C.ML_MAX}
    problem = evidence[0]["message"] if evidence else "No integrity signals were raised for this transaction."
    return to_py({**summary, "live": live, "parcel": ov, "problem": problem, "evidence": evidence, "related": related,
            "comparison": comparison(row, d["O"]), "score_breakdown": breakdown, "explanation": explain_transaction(transaction_id),
            "disclaimer": "Decision-support only. This is an investigation priority, not a fraud probability or a legal finding."})
