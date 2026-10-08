"""All REST endpoints."""
import json
import logging
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Path, Query, Response
from sqlalchemy import text

from app.config import MODEL_DIR
from app.database.db import engine
from app.detection.engine import SIGNAL_LABELS, SIGNALS
from app.schemas.common import HealthOut, LevelName, SignalName
from app.services import investigation as inv
from app.services import parcel as pc
from app.services.report import build_pdf
from app.services.scoring import parcel_status

log = logging.getLogger("landguard")
router = APIRouter(prefix="/api")

PID = Path(pattern=r"^P-\d{6}$", description="Parcel ID, e.g. P-000032")
TID = Path(pattern=r"^T-\d{6}$", description="Transaction ID, e.g. T-000123")


def q(sql, **p):
    with engine.connect() as con:
        return pd.read_sql(text(sql), con, params=p)


def one(sql, **p):
    df = q(sql, **p)
    return None if df.empty else df.iloc[0]


def records(df):
    return json.loads(df.to_json(orient="records"))


def level_of_score(s):
    from app.config import level_for
    return None if s is None or s != s else level_for(float(s))


def tx_parcel(tid):
    r = one("SELECT parcel_id FROM transactions WHERE transaction_id=:t", t=tid)
    if r is None:
        raise HTTPException(404, f"Transaction {tid} was not found.")
    return r.parcel_id


# ------------------------------------------------------------------ health / meta
@router.get("/health", response_model=HealthOut)
def health():
    ok, n_a, n_p = False, 0, 0
    try:
        n_p = int(q("SELECT COUNT(*) c FROM parcels").c[0])
        n_a = int(q("SELECT COUNT(*) c FROM analysis_results").c[0])
        ok = True
    except Exception:
        pass
    return HealthOut(status="ok" if ok else "degraded", database=ok, analysis_ready=n_a > 0,
                     model_ready=(MODEL_DIR / "landguard_model.joblib").exists(), transactions=n_a, parcels=n_p)


@router.get("/meta/locations")
def locations(district: Optional[str] = None, upazila: Optional[str] = None):
    out = {"districts": q("SELECT DISTINCT district d FROM parcels ORDER BY d").d.tolist()}
    if district:
        out["upazilas"] = q("SELECT DISTINCT upazila d FROM parcels WHERE district=:d ORDER BY d", d=district).d.tolist()
        if upazila:
            out["mouzas"] = q("SELECT DISTINCT mouza d FROM parcels WHERE district=:d AND upazila=:u ORDER BY d", d=district, u=upazila).d.tolist()
    return out


@router.get("/model/metrics")
def model_metrics():
    p = MODEL_DIR / "metrics.json"
    if not p.exists():
        raise HTTPException(404, "Model metrics are not available yet. Run the ML training step.")
    return json.loads(p.read_text())


# ------------------------------------------------------------------ dashboard / analytics
@router.get("/dashboard/stats")
def dashboard_stats():
    pm = q("SELECT parcel_id, MAX(priority_score) ms FROM analysis_results GROUP BY parcel_id")
    lv = pm.ms.map(level_of_score)
    hi = int(lv.isin(["High", "Critical"]).sum())
    med = int((lv == "Medium").sum())
    tl = q("SELECT priority_level l, COUNT(*) c FROM analysis_results GROUP BY priority_level")
    normal = int(q("SELECT COUNT(*) c FROM analysis_results WHERE signal_count=0").c[0])
    low_all = int(tl[tl.l == "Low"].c.sum())
    risk = [{"name": "Critical", "value": int(tl[tl.l == "Critical"].c.sum())}, {"name": "High", "value": int(tl[tl.l == "High"].c.sum())},
            {"name": "Medium", "value": int(tl[tl.l == "Medium"].c.sum())}, {"name": "Low", "value": low_all - normal},
            {"name": "Normal", "value": normal}]
    monthly = q("""SELECT substr(t.transaction_date,1,7) m, SUM(a.priority_level IN ('High','Critical')) high, SUM(a.signal_count>0) flagged
                   FROM analysis_results a JOIN transactions t USING(transaction_id) GROUP BY m ORDER BY m DESC LIMIT 12""").iloc[::-1]
    totals = q("SELECT COUNT(*) n, SUM(signal_count>0) f FROM analysis_results").iloc[0]
    sig_counts = {SIGNAL_LABELS[s]: int(q(f"SELECT SUM({s}>0) c FROM analysis_results").c[0] or 0) for s in SIGNALS}
    prim = q("SELECT primary_signal s, COUNT(*) c FROM analysis_results WHERE primary_signal IS NOT NULL GROUP BY primary_signal")
    trend = q("""SELECT substr(t.transaction_date,1,4) y, COUNT(*) total, SUM(a.signal_count>0) flagged,
                 SUM(a.priority_level IN ('High','Critical')) high
                 FROM analysis_results a JOIN transactions t USING(transaction_id) GROUP BY y ORDER BY y""")
    recent = q("""SELECT a.transaction_id, a.parcel_id, a.priority_score, a.priority_level, a.primary_signal, t.transaction_date,
                  p.district, p.upazila, t.transaction_status FROM analysis_results a
                  JOIN transactions t USING(transaction_id) JOIN parcels p ON p.parcel_id=a.parcel_id
                  WHERE a.priority_level IN ('High','Critical') ORDER BY t.transaction_date DESC, a.priority_score DESC LIMIT 8""")
    recent["primary_label"] = recent.primary_signal.map(SIGNAL_LABELS)
    return {
        "cards": {"parcels_analyzed": int(len(pm)), "transactions_analyzed": int(totals.n), "high_concern": hi,
                  "review_required": med, "consistent": int(len(pm) - hi - med)},
        "alert_distribution": [{"name": k, "value": v} for k, v in sig_counts.items()],
        "risk_distribution": risk,
        "anomaly_types": [{"name": SIGNAL_LABELS[r.s], "value": int(r.c)} for r in prim.itertuples()],
        "transaction_trends": records(trend),
        "monthly_suspicious": records(monthly),
        "recent_suspicious": records(recent),
        "flagged_transactions": int(totals.f or 0),
    }


@router.get("/analytics")
def analytics():
    n = int(q("SELECT COUNT(*) c FROM analysis_results").c[0])
    lv = q("SELECT priority_level l, COUNT(*) c FROM analysis_results GROUP BY l")
    g = lambda l: int(lv[lv.l == l].c.sum())
    split = {"Normal": g("Low"), "Review": g("Medium"), "High Concern": g("High") + g("Critical")}
    by_district = q("""SELECT p.district name, COUNT(*) total, SUM(a.signal_count>0) flagged,
                       SUM(a.priority_level IN ('High','Critical')) high
                       FROM analysis_results a JOIN parcels p ON p.parcel_id=a.parcel_id GROUP BY p.district
                       ORDER BY high DESC LIMIT 12""")
    by_type = q("""SELECT t.transaction_type name, COUNT(*) total, SUM(a.signal_count>0) flagged
                   FROM analysis_results a JOIN transactions t USING(transaction_id) GROUP BY t.transaction_type""")
    by_signal = [{"name": SIGNAL_LABELS[s], "key": s, "value": int(q(f"SELECT SUM({s}>0) c FROM analysis_results").c[0] or 0)} for s in SIGNALS]
    combos = q("SELECT signal_count k, COUNT(*) c FROM analysis_results GROUP BY signal_count ORDER BY k")
    metrics = json.loads((MODEL_DIR / "metrics.json").read_text()) if (MODEL_DIR / "metrics.json").exists() else None
    return {"total_transactions": n, "split": [{"name": k, "value": v, "percent": round(100 * v / n, 1)} for k, v in split.items()],
            "by_signal": by_signal, "by_district": records(by_district), "by_type": records(by_type),
            "signals_per_transaction": [{"name": str(int(r.k)), "value": int(r.c)} for r in combos.itertuples()],
            "model_metrics": metrics}


# ------------------------------------------------------------------ parcels
@router.get("/parcels")
def parcels(district: Optional[str] = Query(None, max_length=60), upazila: Optional[str] = Query(None, max_length=60),
            mouza: Optional[str] = Query(None, max_length=60), khatian: Optional[str] = Query(None, max_length=20),
            dag: Optional[str] = Query(None, max_length=20), parcel_id: Optional[str] = Query(None, max_length=20),
            owner: Optional[str] = Query(None, max_length=60), limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    where, p = [], {"limit": limit, "offset": offset}
    for col, val, op in [("p.district", district, "="), ("p.upazila", upazila, "="), ("p.mouza", mouza, "="),
                         ("p.khatian_no", khatian, "="), ("p.dag_no", dag, "=")]:
        if val:
            k = col.split(".")[1]
            where.append(f"{col} {op} :{k}")
            p[k] = val.strip()
    if parcel_id:
        where.append("UPPER(p.parcel_id) LIKE :pid")
        p["pid"] = f"%{parcel_id.strip().upper()}%"
    if owner:
        where.append("p.parcel_id IN (SELECT t.parcel_id FROM transactions t JOIN owners o ON o.owner_id IN (t.seller_id,t.buyer_id) "
                     "WHERE o.synthetic_name LIKE :own) OR o2.synthetic_name LIKE :own")
        p["own"] = f"%{owner.strip()}%"
    w = ("WHERE " + " AND ".join(f"({x})" for x in where)) if where else ""
    base = f"""FROM parcels p JOIN owners o2 ON o2.owner_id=p.current_owner_id
               LEFT JOIN (SELECT parcel_id, MAX(priority_score) ms, SUM(signal_count>0) alerts, COUNT(*) txns
                          FROM analysis_results GROUP BY parcel_id) m ON m.parcel_id=p.parcel_id {w}"""
    total = int(q(f"SELECT COUNT(*) c {base}", **{k: v for k, v in p.items() if k not in ("limit", "offset")}).c[0])
    df = q(f"""SELECT p.parcel_id, p.district, p.upazila, p.mouza, p.khatian_no, p.dag_no, p.total_area_decimal,
               o2.synthetic_name current_owner_name, m.ms max_priority, m.alerts, m.txns {base}
               ORDER BY (m.ms IS NULL), m.ms DESC, p.parcel_id LIMIT :limit OFFSET :offset""", **p)
    items = records(df)
    for it in items:
        lv = level_of_score(it["max_priority"])
        it["integrity_status"] = parcel_status(lv) if lv else "No transactions"
    return {"total": total, "items": items, "limit": limit, "offset": offset}


router.add_api_route("/parcels/search", parcels, methods=["GET"], summary="Parcel search (alias of GET /api/parcels)")

OID = Path(pattern=r"^O-\d{6}$", description="Owner ID, e.g. O-000239")
RID = Path(pattern=r"^R-\d{6}$", description="Registration ID, e.g. R-000123")
MID = Path(pattern=r"^M-\d{6}$", description="Mutation ID, e.g. M-000123")


def _parcel(pid):
    d = pc.load_parcel(pid)
    if d is None:
        raise HTTPException(404, f"Parcel {pid} was not found.")
    return d


@router.get("/parcels/{parcel_id}")
def parcel_detail(parcel_id: str = PID):
    d = _parcel(parcel_id)
    return pc.overview(d)


@router.get("/parcels/{parcel_id}/history")
def parcel_history(parcel_id: str = PID):
    return {"parcel_id": parcel_id, "events": pc.history(_parcel(parcel_id))}


@router.get("/parcels/{parcel_id}/timeline")
def parcel_timeline(parcel_id: str = PID):
    return {"parcel_id": parcel_id, **pc.timeline(_parcel(parcel_id))}


@router.get("/parcels/{parcel_id}/graph")
def parcel_graph(parcel_id: str = PID):
    return {"parcel_id": parcel_id, **pc.graph_payload(_parcel(parcel_id))}


@router.get("/parcels/{parcel_id}/alerts")
def parcel_alerts(parcel_id: str = PID):
    d = _parcel(parcel_id)
    A = d["A"][d["A"].signal_count > 0].sort_values("priority_score", ascending=False)
    out = []
    for _, a in A.iterrows():
        s = inv.alert_summary(a)
        s["evidence"] = pc.parse_evidence(a.evidence_json)
        out.append(s)
    return {"parcel_id": parcel_id, "alerts": out}


# ------------------------------------------------------------------ transactions
@router.get("/transactions")
def transactions(parcel_id: Optional[str] = Query(None, max_length=20), transaction_id: Optional[str] = Query(None, max_length=20),
                 owner: Optional[str] = Query(None, max_length=60), level: Optional[LevelName] = None,
                 transaction_type: Optional[str] = Query(None, max_length=20), limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0)):
    where, p = [], {"limit": limit, "offset": offset}
    if parcel_id:
        where.append("t.parcel_id=:pid"); p["pid"] = parcel_id.strip()
    if transaction_id:
        where.append("t.transaction_id LIKE :tid"); p["tid"] = f"%{transaction_id.strip().upper()}%"
    if owner:
        where.append("(so.synthetic_name LIKE :own OR bo.synthetic_name LIKE :own)"); p["own"] = f"%{owner.strip()}%"
    if level:
        where.append("a.priority_level=:lv"); p["lv"] = level
    if transaction_type:
        where.append("t.transaction_type=:tt"); p["tt"] = transaction_type
    w = ("WHERE " + " AND ".join(where)) if where else ""
    base = f"""FROM transactions t JOIN owners so ON so.owner_id=t.seller_id JOIN owners bo ON bo.owner_id=t.buyer_id
               JOIN analysis_results a ON a.transaction_id=t.transaction_id {w}"""
    total = int(q(f"SELECT COUNT(*) c {base}", **{k: v for k, v in p.items() if k not in ("limit", "offset")}).c[0])
    df = q(f"""SELECT t.transaction_id, t.parcel_id, t.transaction_date, t.transaction_type, t.transaction_status,
               t.transferred_area_decimal, t.transferred_share, so.synthetic_name seller, bo.synthetic_name buyer,
               a.priority_score, a.priority_level {base} ORDER BY t.transaction_date DESC, t.transaction_id LIMIT :limit OFFSET :offset""", **p)
    return {"total": total, "items": records(df)}


@router.get("/transactions/{transaction_id}")
def transaction_detail(transaction_id: str = TID):
    pid = tx_parcel(transaction_id)
    d = _parcel(pid)
    r = d["ctx"][d["ctx"].transaction_id == transaction_id].iloc[0]
    a = d["A"].set_index("transaction_id").loc[transaction_id]
    return {"transaction_id": transaction_id, "parcel_id": pid, "date": r.transaction_date.strftime("%Y-%m-%d"),
            "type": r.transaction_type, "status": r.transaction_status,
            "seller": {"id": r.seller_id, "name": pc._name(d["O"], r.seller_id)}, "buyer": {"id": r.buyer_id, "name": pc._name(d["O"], r.buyer_id)},
            "transferred_area_decimal": float(r.transferred_area_decimal), "transferred_share": float(r.transferred_share),
            "seller_share_before": float(r.seller_share_before), "seller_share_after": float(r.seller_share_after),
            "ownership_sequence": int(r.ownership_sequence), "priority_score": float(a.priority_score),
            "priority_level": a.priority_level, "registration_id": pc._clean(r.r_id), "mutation_id": pc._clean(r.m_id)}


# ------------------------------------------------------------------ alerts / investigations
@router.get("/alerts")
def alerts(type: Optional[SignalName] = None, level: Optional[LevelName] = None, district: Optional[str] = Query(None, max_length=60),
           upazila: Optional[str] = Query(None, max_length=60), parcel_id: Optional[str] = Query(None, max_length=20),
           q_text: Optional[str] = Query(None, alias="q", max_length=40), limit: int = Query(20, ge=1, le=200), offset: int = Query(0, ge=0)):
    where, p = ["a.signal_count>0"], {"limit": limit, "offset": offset}
    if type:
        where.append(f"a.{type}>0")                       # `type` is validated against a fixed list of column names
    if level:
        where.append("a.priority_level=:lv"); p["lv"] = level
    if district:
        where.append("p.district=:dist"); p["dist"] = district
    if upazila:
        where.append("p.upazila=:upz"); p["upz"] = upazila
    if parcel_id:
        where.append("a.parcel_id LIKE :pid"); p["pid"] = f"%{parcel_id.strip().upper()}%"
    if q_text:
        where.append("(a.transaction_id LIKE :qt OR a.parcel_id LIKE :qt)"); p["qt"] = f"%{q_text.strip().upper()}%"
    w = " AND ".join(where)
    base = f"FROM analysis_results a JOIN transactions t USING(transaction_id) JOIN parcels p ON p.parcel_id=a.parcel_id WHERE {w}"
    total = int(q(f"SELECT COUNT(*) c {base}", **{k: v for k, v in p.items() if k not in ("limit", "offset")}).c[0])
    counts = q(f"SELECT a.priority_level l, COUNT(*) c {base} GROUP BY a.priority_level", **{k: v for k, v in p.items() if k not in ("limit", "offset")})
    df = q(f"""SELECT a.*, t.transaction_date, p.district, p.upazila, p.mouza {base}
               ORDER BY a.priority_score DESC, a.transaction_id LIMIT :limit OFFSET :offset""", **p)
    items = []
    for _, a in df.iterrows():
        s = inv.alert_summary(a)
        ev = pc.parse_evidence(a.evidence_json)
        s.update({"date": a.transaction_date, "district": a.district, "upazila": a.upazila, "mouza": a.mouza,
                  "headline": ev[0]["message"] if ev else "", "evidence_count": len(ev)})
        items.append(s)
    return {"total": total, "items": items, "level_counts": {r.l: int(r.c) for r in counts.itertuples()}}


@router.get("/alerts/{transaction_id}")
def alert_detail(transaction_id: str = TID):
    pid = tx_parcel(transaction_id)
    b = inv.investigation(transaction_id, pid)
    if b is None:
        raise HTTPException(404, "Alert not found.")
    return b


@router.get("/investigations/{transaction_id}")
def investigation_get(transaction_id: str = TID):
    return alert_detail(transaction_id)


@router.post("/investigate/{transaction_id}")
def investigate(transaction_id: str = TID):
    """Re-run the rule engine on the stored records and return a fresh investigation bundle."""
    pid = tx_parcel(transaction_id)
    log.info("investigate %s (%s)", transaction_id, pid)
    b = inv.investigation(transaction_id, pid, live=True)
    if b is None:
        raise HTTPException(404, "Transaction not found.")
    return b


@router.get("/registration-mutation/{transaction_id}")
def registration_mutation(transaction_id: str = TID):
    pid = tx_parcel(transaction_id)
    d = _parcel(pid)
    row = d["ctx"][d["ctx"].transaction_id == transaction_id].iloc[0]
    out = inv.comparison(row, d["O"])
    ev = pc.parse_evidence(d["A"].set_index("transaction_id").loc[transaction_id].evidence_json)
    out["messages"] = [e["message"] for e in ev if e["type"] in ("registration_mismatch", "mutation_mismatch", "temporal_inconsistency")]
    return out


@router.get("/reports/{transaction_id}")
def report(transaction_id: str = TID):
    pid = tx_parcel(transaction_id)
    d = _parcel(pid)
    b = inv.investigation(transaction_id, pid)
    A = d["A"][d["A"].signal_count > 0].sort_values("priority_score", ascending=False).head(8)
    alerts_ = [{**inv.alert_summary(a), "evidence": pc.parse_evidence(a.evidence_json)} for _, a in A.iterrows()]
    pdf = build_pdf(b["parcel"], pc.history(d), pc.timeline(d)["events"], b, alerts_, b["explanation"], b["comparison"])
    return Response(pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="LandGuard_{pid}_{transaction_id}.pdf"'})


@router.get("/demo")
def demo():
    """Pick a showcase parcel (several distinct signals, 3+ transactions, includes over-transfer or double-sale)."""
    r = one("""SELECT parcel_id, COUNT(*) txns, MAX(priority_score) ms,
               (MAX(double_sale)+MAX(over_transfer)+MAX(ownership_chain_break)+MAX(registration_mismatch)+MAX(mutation_mismatch)
                +MAX(temporal_inconsistency)+(MAX(rapid_transfer)>0)) distinct_signals
               FROM analysis_results GROUP BY parcel_id HAVING txns>=3 AND (MAX(over_transfer)=1 OR MAX(double_sale)=1)
               ORDER BY distinct_signals DESC, ms DESC, txns DESC LIMIT 1""")
    if r is None:
        raise HTTPException(404, "No demo parcel is available.")
    top = one("SELECT transaction_id FROM analysis_results WHERE parcel_id=:p ORDER BY priority_score DESC LIMIT 1", p=r.parcel_id)
    return {"parcel_id": r.parcel_id, "transaction_id": top.transaction_id, "distinct_signals": int(r.distinct_signals)}


# ------------------------------------------------------------------ owners / registrations / mutations / ownership history
@router.get("/owners/{owner_id}")
def owner_profile(owner_id: str = OID):
    o = one("SELECT * FROM owners WHERE owner_id=:o", o=owner_id)
    if o is None:
        raise HTTPException(404, f"Owner {owner_id} was not found.")
    parcels_ = q("SELECT parcel_id, district, upazila, total_area_decimal FROM parcels WHERE current_owner_id=:o LIMIT 50", o=owner_id)
    stats = q("""SELECT SUM(t.seller_id=:o) sold, SUM(t.buyer_id=:o) bought, SUM(a.signal_count>0) flagged
                 FROM transactions t JOIN analysis_results a USING(transaction_id) WHERE t.seller_id=:o OR t.buyer_id=:o""", o=owner_id).iloc[0]
    return {**json.loads(o.to_json()), "current_parcels": records(parcels_), "transactions_as_seller": int(stats.sold or 0),
            "transactions_as_buyer": int(stats.bought or 0), "transactions_with_signals": int(stats.flagged or 0)}


def _history_rows(where: str, **p):
    df = q(f"""SELECT t.transaction_id, t.parcel_id, t.transaction_date date, t.transaction_type, t.transaction_status,
               t.seller_id, so.synthetic_name seller_name, t.buyer_id, bo.synthetic_name buyer_name,
               t.transferred_area_decimal area, t.transferred_share share, a.priority_score, a.priority_level
               FROM transactions t JOIN owners so ON so.owner_id=t.seller_id JOIN owners bo ON bo.owner_id=t.buyer_id
               JOIN analysis_results a USING(transaction_id) WHERE {where} ORDER BY t.transaction_date, t.transaction_id LIMIT 500""", **p)
    return records(df)


@router.get("/owners/{owner_id}/history")
def owner_history(owner_id: str = OID):
    if one("SELECT 1 x FROM owners WHERE owner_id=:o", o=owner_id) is None:
        raise HTTPException(404, f"Owner {owner_id} was not found.")
    return {"owner_id": owner_id, "transactions": _history_rows("t.seller_id=:o OR t.buyer_id=:o", o=owner_id)}


@router.get("/ownership/history")
def ownership_history(parcel_id: Optional[str] = Query(None, pattern=r"^P-\d{6}$"), owner_id: Optional[str] = Query(None, pattern=r"^O-\d{6}$")):
    """Transaction chain for a parcel OR an owner (exactly one of the two)."""
    if bool(parcel_id) == bool(owner_id):
        raise HTTPException(422, "Give exactly one of parcel_id or owner_id.")
    if parcel_id:
        _parcel(parcel_id)
        return {"parcel_id": parcel_id, "transactions": _history_rows("t.parcel_id=:p", p=parcel_id)}
    return owner_history(owner_id)


@router.get("/registrations/{registration_id}")
def registration_detail(registration_id: str = RID):
    r = one("SELECT * FROM registrations WHERE registration_id=:r", r=registration_id)
    if r is None:
        raise HTTPException(404, f"Registration {registration_id} was not found.")
    return json.loads(r.to_json())


@router.get("/mutations/{mutation_id}")
def mutation_detail(mutation_id: str = MID):
    m = one("SELECT * FROM mutations WHERE mutation_id=:m", m=mutation_id)
    if m is None:
        raise HTTPException(404, f"Mutation {mutation_id} was not found.")
    return json.loads(m.to_json())
