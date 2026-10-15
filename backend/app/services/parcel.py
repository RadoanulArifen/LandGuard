"""Parcel-level views: overview, ownership history, timeline and the ownership/transaction graph."""
from __future__ import annotations

import json

import networkx as nx
import pandas as pd
from sqlalchemy import bindparam, text

from app.database.db import engine
from app.detection.engine import SIGNAL_LABELS, SIGNALS, build_context
from app.services.scoring import parcel_status, txn_status

LEVEL_ORDER = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}


def _q(con, sql, **params):
    return pd.read_sql(text(sql), con, params=params)


def load_parcel(parcel_id: str) -> dict | None:
    """Everything LandGuard knows about ONE parcel (parameterized queries only)."""
    with engine.connect() as con:
        P = _q(con, "SELECT * FROM parcels WHERE parcel_id=:p", p=parcel_id)
        if P.empty:
            return None
        T = _q(con, "SELECT * FROM transactions WHERE parcel_id=:p", p=parcel_id)
        R = _q(con, "SELECT * FROM registrations WHERE parcel_id=:p", p=parcel_id)
        M = _q(con, "SELECT * FROM mutations WHERE parcel_id=:p", p=parcel_id)
        A = _q(con, "SELECT * FROM analysis_results WHERE parcel_id=:p", p=parcel_id)
        ids = (set(T.seller_id) | set(T.buyer_id) | set(T.previous_owner_id.dropna()) | {P.current_owner_id.iloc[0]}
               | set(R.seller_id) | set(R.buyer_id) | set(M.previous_owner_id) | set(M.new_owner_id))
        O = pd.read_sql(text("SELECT * FROM owners WHERE owner_id IN :ids").bindparams(bindparam("ids", expanding=True)),
                        con, params={"ids": list(ids)})
    ctx = build_context(T, R, M, P) if len(T) else pd.DataFrame()
    return {"parcel": P.iloc[0], "T": T, "R": R, "M": M, "A": A, "O": O.set_index("owner_id"), "ctx": ctx}


def _name(O, oid):
    return O["synthetic_name"].get(oid, oid) if oid is not None and oid == oid else None


def _clean(v):
    if v is None:
        return None
    if isinstance(v, float) and v != v:
        return None
    if isinstance(v, pd.Timestamp):
        return v.strftime("%Y-%m-%d")
    if hasattr(v, "item"):
        return v.item()
    return v


def _level_of(A):
    if A.empty:
        return None
    return max(A["priority_level"], key=lambda x: LEVEL_ORDER.get(x, 0))


def overview(d: dict) -> dict:
    p, A, O, ctx = d["parcel"], d["A"], d["O"], d["ctx"]
    max_level = _level_of(A)
    alerts = A[A.signal_count > 0]
    cur = p.current_owner_id
    recorded = None
    if len(ctx):
        done = ctx[(ctx.transaction_status == "Completed") & (ctx.buyer_id == cur)]
        if len(done):
            recorded = float(done.iloc[-1].buyer_share_after)
    top = None
    if len(A):
        top = A.sort_values("priority_score", ascending=False).iloc[0]
    def latest(frame: pd.DataFrame, date_column: str) -> pd.Series | None:
        if frame.empty:
            return None
        ordered = frame.sort_values(date_column, na_position="first") if date_column in frame else frame
        return ordered.iloc[-1]

    registration = latest(d["R"], "registration_date")
    mutation = latest(d["M"], "mutation_date")
    return {
        "parcel_id": p.parcel_id, "khatian_no": p.khatian_no, "dag_no": p.dag_no, "mouza": p.mouza,
        "district": p.district, "upazila": p.upazila, "land_type": p.land_type,
        "total_area_decimal": float(p.total_area_decimal), "current_owner_id": cur,
        "current_owner_name": _name(O, cur), "recorded_share": recorded,
        "recorded_area": round(float(p.total_area_decimal) * recorded / 100, 2) if recorded is not None else None,
        "ownership_status": p.ownership_status, "registration_status": p.registration_status,
        "mutation_status": p.mutation_status,
        "integrity_status": parcel_status(max_level), "max_priority_level": max_level or "Low",
        "transaction_count": int(len(d["T"])), "alert_count": int(len(alerts)),
        "top_transaction_id": None if top is None else top.transaction_id,
        "top_priority_score": None if top is None else float(top.priority_score),
        "summary": ("Multiple inconsistencies detected in linked records. Human review recommended."
                    if parcel_status(max_level) == "High Concern" else
                    "Some records need review." if parcel_status(max_level) == "Review Required" else
                    "No significant inconsistencies detected in the linked records."),
        "documents": {
            "khatian": {"id": _clean(p.khatian_no), "date": _clean(p.creation_date), "status": "Available"},
            "deed": None if registration is None else {
                "id": _clean(registration.get("deed_reference")),
                "date": _clean(registration.get("registration_date")),
                "status": _clean(registration.get("verification_status")) or _clean(registration.get("registration_status")),
            },
            "mutation": None if mutation is None else {
                "id": _clean(mutation.get("mutation_id")),
                "date": _clean(mutation.get("mutation_date")),
                "status": _clean(mutation.get("verification_status")) or _clean(mutation.get("mutation_status")),
            },
            "registration": None if registration is None else {
                "id": _clean(registration.get("registration_id")),
                "date": _clean(registration.get("registration_date")),
                "status": _clean(registration.get("verification_status")) or _clean(registration.get("registration_status")),
            },
        },
    }


def history(d: dict) -> list[dict]:
    ctx, O, p, A = d["ctx"], d["O"], d["parcel"], d["A"].set_index("transaction_id")
    if ctx.empty:
        return [{"kind": "original", "date": p.creation_date, "year": str(p.creation_date)[:4], "owner_id": p.current_owner_id,
                 "owner_name": _name(O, p.current_owner_id), "title": "Current recorded owner (no transfers on record)"}]
    first = ctx.iloc[0]
    d0 = min(pd.Timestamp(p.creation_date), first.transaction_date) if p.creation_date else first.transaction_date
    ev = [{"kind": "original", "date": d0.strftime("%Y-%m-%d"), "year": str(d0.year), "owner_id": first.seller_id,
           "owner_name": _name(O, first.seller_id), "title": "Original recorded owner",
           "area": round(float(p.total_area_decimal), 2), "share": float(first.seller_share_before)}]
    for _, r in ctx.iterrows():
        a = A.loc[r.transaction_id]
        ev.append({"kind": "transfer", "date": r.transaction_date.strftime("%Y-%m-%d"), "year": str(r.transaction_date.year),
                   "owner_id": r.buyer_id, "owner_name": _name(O, r.buyer_id), "from_id": r.seller_id,
                   "from_name": _name(O, r.seller_id), "title": f"{r.transaction_type} from {_name(O, r.seller_id)}",
                   "area": _clean(r.transferred_area_decimal), "share": _clean(r.transferred_share),
                   "transaction_id": r.transaction_id, "transaction_type": r.transaction_type,
                   "transaction_status": r.transaction_status,
                   "registration_status": _clean(r.r_status) or "Missing", "mutation_status": _clean(r.m_status) or "Missing",
                   "priority_level": a.priority_level, "priority_score": float(a.priority_score),
                   "signal_count": int(a.signal_count),
                   "issues": [SIGNAL_LABELS[s] for s in SIGNALS if a[s]]})
    return ev


def timeline(d: dict) -> dict:
    ctx, O, A = d["ctx"], d["O"], d["A"].set_index("transaction_id")
    events = []
    for _, r in ctx.iterrows():
        a = A.loc[r.transaction_id]
        bad = a.priority_level in ("High", "Critical")
        events.append({"date": r.transaction_date, "kind": "Transaction", "transaction_id": r.transaction_id,
                       "label": f"{_name(O, r.seller_id)} → {_name(O, r.buyer_id)}",
                       "detail": f"{r.transaction_type}, {r.transferred_area_decimal:g} decimal ({r.transferred_share:g}%) — {r.transaction_status}",
                       "level": a.priority_level, "conflict": bool(bad)})
        if pd.notna(r.r_date):
            events.append({"date": r.r_date, "kind": "Registration", "transaction_id": r.transaction_id,
                           "label": f"{_name(O, r.r_seller)} → {_name(O, r.r_buyer)}",
                           "detail": f"Deed {r.r_deed}, {r.r_area:g} decimal — {r.r_status}", "level": a.priority_level,
                           "conflict": bool(a.registration_mismatch)})
        if pd.notna(r.m_date):
            events.append({"date": r.m_date, "kind": "Mutation", "transaction_id": r.transaction_id,
                           "label": f"{_name(O, r.m_prev)} → {_name(O, r.m_new)}",
                           "detail": f"{r.m_ref}, {r.m_area:g} decimal — {r.m_status}", "level": a.priority_level,
                           "conflict": bool(a.mutation_mismatch)})
    events.sort(key=lambda e: (e["date"], {"Transaction": 0, "Registration": 1, "Mutation": 2}[e["kind"]]))
    for e in events:
        e["date"] = e["date"].strftime("%Y-%m-%d")
    max_level = _level_of(d["A"])
    return {"events": events, "status": parcel_status(max_level)}


def build_graph(d: dict) -> nx.DiGraph:
    """Time-aware ownership graph: Parcel -> Owner (original) and Owner -> Transaction -> Owner."""
    ctx, O, A = d["ctx"], d["O"], d["A"].set_index("transaction_id")
    G = nx.DiGraph()
    p = d["parcel"]
    G.add_node(p.parcel_id, kind="parcel", label=f"Parcel {p.parcel_id}", area=float(p.total_area_decimal))
    for _, r in ctx.iterrows():
        for oid in (r.seller_id, r.buyer_id):
            if oid not in G:
                G.add_node(oid, kind="owner", label=_name(O, oid))
        a = A.loc[r.transaction_id]
        G.add_node(r.transaction_id, kind="transaction", label=r.transaction_id, level=a.priority_level,
                   flagged=bool(a.signal_count > 0), data={
                       "transaction_id": r.transaction_id, "date": r.transaction_date.strftime("%Y-%m-%d"),
                       "type": r.transaction_type, "status": r.transaction_status, "seller": _name(O, r.seller_id),
                       "buyer": _name(O, r.buyer_id), "area": _clean(r.transferred_area_decimal),
                       "share": _clean(r.transferred_share), "seller_share_before": _clean(r.seller_share_before),
                       "priority_score": float(a.priority_score),
                       "priority_level": a.priority_level, "issues": [SIGNAL_LABELS[s] for s in SIGNALS if a[s]]})
        G.add_edge(r.seller_id, r.transaction_id, role="seller")
        G.add_edge(r.transaction_id, r.buyer_id, role="buyer")
    if len(ctx):
        first_seller = ctx.iloc[0].seller_id
        G.add_edge(p.parcel_id, first_seller, role="origin")
    return G


def graph_payload(d: dict) -> dict:
    """React-Flow friendly nodes/edges with a simple top-to-bottom layout."""
    G = build_graph(d)
    ctx, O, A = d["ctx"], d["O"], d["A"].set_index("transaction_id")
    p = d["parcel"]
    cur = p.current_owner_id
    # level of every owner: BFS by date order
    level = {}
    if len(ctx):
        level[ctx.iloc[0].seller_id] = 1
        for _ in range(3):
            for _, r in ctx.iterrows():
                level.setdefault(r.seller_id, 1)
                level[r.buyer_id] = max(level.get(r.buyer_id, 0), level[r.seller_id] + 1)
        cap = len(ctx) + 1
        level = {k: min(v, cap) for k, v in level.items()}
    pos_by_level: dict[int, list] = {}
    for oid, lv in level.items():
        pos_by_level.setdefault(lv * 2 - 1, []).append(oid)
    txn_level = {r.transaction_id: level[r.seller_id] * 2 for _, r in ctx.iterrows()}
    for t, lv in txn_level.items():
        pos_by_level.setdefault(lv, []).append(t)
    pos_by_level.setdefault(0, []).append(p.parcel_id)
    pos = {}
    for lv, items in pos_by_level.items():
        for i, n in enumerate(items):
            pos[n] = {"x": (i - (len(items) - 1) / 2) * 260, "y": lv * 95}
    involved_conflict = set()
    for _, r in ctx.iterrows():
        a = A.loc[r.transaction_id]
        if a.double_sale or a.over_transfer:
            involved_conflict.add(r.seller_id)
    nodes = []
    for n, a in G.nodes(data=True):
        if a["kind"] == "owner":
            status = "conflict" if n in involved_conflict else ("current" if n == cur else "normal")
            nodes.append({"id": n, "type": "owner", "position": pos[n], "data": {
                "label": a["label"], "owner_id": n, "status": status, "is_current": n == cur,
                "owner_type": O["owner_type"].get(n), "owner_status": O["owner_status"].get(n),
                "occupation": O["occupation_category"].get(n), "district": O["district"].get(n),
                "ownership_count": _clean(O["ownership_count"].get(n))}})
        elif a["kind"] == "transaction":
            nodes.append({"id": n, "type": "txn", "position": pos[n], "data": {**a["data"], "label": n, "flagged": a["flagged"]}})
        else:
            nodes.append({"id": n, "type": "parcel", "position": pos[n], "data": {"label": a["label"], "area": a["area"]}})
    edges = []
    for u, v, a in G.edges(data=True):
        tx = u if G.nodes[u]["kind"] == "transaction" else v if G.nodes[v]["kind"] == "transaction" else None
        flagged = bool(tx and G.nodes[tx]["flagged"])
        hi = bool(tx and G.nodes[tx]["level"] in ("High", "Critical"))
        edges.append({"id": f"{u}->{v}", "source": u, "target": v, "data": {"role": a["role"], "transaction_id": tx,
                      "flagged": flagged, "high": hi}})
    status = parcel_status(_level_of(d["A"]))
    graph_status = {"High Concern": "Conflict Detected", "Review Required": "Review Required"}.get(status, "Consistent")
    return {"nodes": nodes, "edges": edges, "status": graph_status, "transaction_count": int(len(ctx)),
            "owner_count": sum(1 for n in nodes if n["type"] == "owner")}


def transaction_status_label(level: str) -> str:
    return txn_status(level)


def parse_evidence(s: str | None) -> list[dict]:
    return json.loads(s) if s else []
