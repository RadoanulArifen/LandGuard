"""LandGuard deterministic detection engine (NO machine learning in this file).

Every detector takes the "context" table (one row per transaction, with the linked
parcel, registration and mutation columns) and returns a pandas Series.
Rules only create *signals*; they never claim fraud. Output wording is neutral:
"Potential Inconsistency", "Review Recommended", "Human Review Required".
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from app import config as C

SIGNALS = ["double_sale", "over_transfer", "rapid_transfer", "ownership_chain_break",
           "registration_mismatch", "mutation_mismatch", "temporal_inconsistency"]

SIGNAL_LABELS = {
    "double_sale": "Double-Sale / Overlapping Transfer",
    "over_transfer": "Over-Transfer",
    "rapid_transfer": "Rapid Transfer",
    "ownership_chain_break": "Ownership Chain Break",
    "registration_mismatch": "Registration Mismatch",
    "mutation_mismatch": "Registration–Mutation Mismatch",
    "temporal_inconsistency": "Temporal Inconsistency",
}


# ----------------------------------------------------------------------------------------
# Context table
# ----------------------------------------------------------------------------------------
def build_context(T: pd.DataFrame, R: pd.DataFrame, M: pd.DataFrame, P: pd.DataFrame) -> pd.DataFrame:
    """Join transactions with parcel, registration and mutation records (left joins)."""
    t = T.copy()
    t["transaction_date"] = pd.to_datetime(t["transaction_date"])
    t = t.merge(P[["parcel_id", "total_area_decimal", "district", "upazila", "mouza"]], on="parcel_id", how="left")
    r = R.rename(columns={
        "registration_id": "r_id", "seller_id": "r_seller", "buyer_id": "r_buyer",
        "registered_area_decimal": "r_area", "registration_date": "r_date",
        "registration_type": "r_type", "registration_status": "r_status",
        "verification_status": "r_verif", "registration_delay_days": "r_delay",
        "deed_reference": "r_deed", "registration_office_code": "r_office"})
    r = r[["transaction_id", "r_id", "r_seller", "r_buyer", "r_area", "r_date", "r_type", "r_status",
           "r_verif", "r_delay", "r_deed", "r_office"]].drop_duplicates("transaction_id")
    r["r_date"] = pd.to_datetime(r["r_date"])
    m = M.rename(columns={
        "mutation_id": "m_id", "previous_owner_id": "m_prev", "new_owner_id": "m_new",
        "mutated_area_decimal": "m_area", "previous_owner_share": "m_prev_share",
        "mutated_owner_share": "m_new_share", "mutation_date": "m_date", "mutation_type": "m_type",
        "mutation_status": "m_status", "mutation_delay_days": "m_delay",
        "verification_status": "m_verif", "mutation_reference": "m_ref", "mutation_office_code": "m_office"})
    m = m[["transaction_id", "m_id", "m_prev", "m_new", "m_area", "m_prev_share", "m_new_share", "m_date",
           "m_type", "m_status", "m_delay", "m_verif", "m_ref", "m_office"]].drop_duplicates("transaction_id")
    m["m_date"] = pd.to_datetime(m["m_date"])
    ctx = t.merge(r, on="transaction_id", how="left").merge(m, on="transaction_id", how="left")
    return ctx.sort_values(["parcel_id", "transaction_date", "ownership_sequence", "transaction_id"]).reset_index(drop=True)


def _differs(a: pd.Series, b: pd.Series, tol: float) -> pd.Series:
    return (a - b).abs() > tol


# ----------------------------------------------------------------------------------------
# Detectors
# ----------------------------------------------------------------------------------------
def detect_double_sale(ctx: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
    """A seller transfers a parcel interest AFTER an earlier transaction on the same parcel
    already transferred that seller's ENTIRE interest to someone else (overlapping rights).
    A normal chain A->B, B->C, C->D is NOT flagged because each seller sells only once.
    Returns (flag, id_of_earlier_full_transfer)."""
    d = ctx.sort_values(["parcel_id", "seller_id", "transaction_date", "ownership_sequence", "transaction_id"])
    full = d["seller_share_after"] <= C.SHARE_TOLERANCE
    marker = d["transaction_id"].where(full)
    earlier = marker.groupby([d["parcel_id"], d["seller_id"]]).ffill()
    earlier = earlier.groupby([d["parcel_id"], d["seller_id"]]).shift(1)
    # in case two rows tie on the same date/sequence ffill+shift keeps strictly earlier rows only
    ref = earlier.reindex(ctx.index)
    return ref.notna().astype(int), ref


def detect_over_transfer(ctx: pd.DataFrame) -> pd.Series:
    """Transferred share > seller's share before, OR transferred area > the area the seller controlled."""
    over_share = ctx["transferred_share"] > ctx["seller_share_before"] + C.SHARE_TOLERANCE
    available_area = ctx["total_area_decimal"] * ctx["seller_share_before"] / 100.0
    over_area = ctx["transferred_area_decimal"] > available_area + C.AREA_TOLERANCE
    return (over_share | over_area).astype(int)


def detect_rapid_transfer(ctx: pd.DataFrame) -> pd.Series:
    """0 = none, 1 = moderate (8-30 days), 2 = strong (<=7 days). Anomaly signal only."""
    d = ctx["days_since_previous_transfer"]
    out = pd.Series(0, index=ctx.index)
    out[(d >= 0) & (d <= C.RAPID_MODERATE_DAYS)] = 1
    out[(d >= 0) & (d <= C.RAPID_STRONG_DAYS)] = 2
    return out


def detect_chain_break(ctx: pd.DataFrame) -> pd.Series:
    """Recorded seller differs from the recorded previous owner of the parcel."""
    prev = ctx["previous_owner_id"]
    return (prev.notna() & (ctx["seller_id"] != prev)).astype(int)


def registration_issues(ctx: pd.DataFrame) -> dict[str, pd.Series]:
    has = ctx["r_id"].notna()
    return {
        "missing_registration": ~has,
        "buyer_mismatch": has & (ctx["r_buyer"] != ctx["buyer_id"]),
        "seller_mismatch": has & (ctx["r_seller"] != ctx["seller_id"]),
        "area_mismatch": has & _differs(ctx["r_area"], ctx["transferred_area_decimal"], C.AREA_TOLERANCE),
        "type_mismatch": has & (ctx["r_type"] != ctx["transaction_type"]),
        "invalid_registration_date": has & (ctx["r_date"] < ctx["transaction_date"]),
    }


def mutation_issues(ctx: pd.DataFrame) -> dict[str, pd.Series]:
    has = ctx["m_id"].notna()
    return {
        "missing_mutation": ~has,
        "new_owner_mismatch": has & (ctx["m_new"] != ctx["r_buyer"]),
        "previous_owner_mismatch": has & (ctx["m_prev"] != ctx["r_seller"]),
        "area_mismatch": has & _differs(ctx["m_area"], ctx["r_area"], C.AREA_TOLERANCE),
        "share_mismatch": has & _differs(ctx["m_new_share"], ctx["transferred_share"], C.SHARE_TOLERANCE),
        "type_mismatch": has & (ctx["m_type"] != ctx["r_type"]),
        "invalid_mutation_date": has & ((ctx["m_date"] < ctx["r_date"]) | (ctx["m_date"] < ctx["transaction_date"])),
    }


def detect_registration_mismatch(ctx: pd.DataFrame) -> pd.Series:
    return pd.concat(registration_issues(ctx).values(), axis=1).any(axis=1).astype(int)


def detect_mutation_mismatch(ctx: pd.DataFrame) -> pd.Series:
    return pd.concat(mutation_issues(ctx).values(), axis=1).any(axis=1).astype(int)


def detect_temporal(ctx: pd.DataFrame) -> pd.Series:
    """Expected: transaction_date <= registration_date <= mutation_date."""
    bad_reg = ctx["r_date"].notna() & (ctx["r_date"] < ctx["transaction_date"])
    bad_mut_reg = ctx["m_date"].notna() & ctx["r_date"].notna() & (ctx["m_date"] < ctx["r_date"])
    bad_mut_tx = ctx["m_date"].notna() & (ctx["m_date"] < ctx["transaction_date"])
    return (bad_reg | bad_mut_reg | bad_mut_tx).astype(int)


# ----------------------------------------------------------------------------------------
# Run everything
# ----------------------------------------------------------------------------------------
def run_rules(ctx: pd.DataFrame) -> pd.DataFrame:
    """Return one row per transaction with the 7 signals and the rule points."""
    ds, ds_ref = detect_double_sale(ctx)
    out = pd.DataFrame({"transaction_id": ctx["transaction_id"], "parcel_id": ctx["parcel_id"]})
    out["double_sale"] = ds.values
    out["double_sale_ref"] = ds_ref.values
    out["over_transfer"] = detect_over_transfer(ctx).values
    out["rapid_transfer"] = detect_rapid_transfer(ctx).values
    out["ownership_chain_break"] = detect_chain_break(ctx).values
    out["registration_mismatch"] = detect_registration_mismatch(ctx).values
    out["mutation_mismatch"] = detect_mutation_mismatch(ctx).values
    out["temporal_inconsistency"] = detect_temporal(ctx).values
    out["signal_count"] = (out[SIGNALS] > 0).sum(axis=1)
    out["rule_points"] = rule_points(out)
    return out


def rule_points(sig: pd.DataFrame) -> pd.Series:
    W = C.RULE_WEIGHTS
    pts = (sig["double_sale"] * W["double_sale"] + sig["over_transfer"] * W["over_transfer"]
           + sig["ownership_chain_break"] * W["ownership_chain_break"]
           + sig["registration_mismatch"] * W["registration_mismatch"]
           + sig["mutation_mismatch"] * W["mutation_mismatch"]
           + sig["temporal_inconsistency"] * W["temporal_inconsistency"]
           + (sig["rapid_transfer"] == 2) * W["rapid_transfer_strong"]
           + (sig["rapid_transfer"] == 1) * W["rapid_transfer_moderate"])
    return pts.clip(upper=C.RULE_CAP).astype(float)


def primary_signal(row) -> str | None:
    """Most severe signal present (ties broken by the order below)."""
    for s in ["double_sale", "over_transfer", "ownership_chain_break", "registration_mismatch",
              "mutation_mismatch", "temporal_inconsistency", "rapid_transfer"]:
        if row[s]:
            return s
    return None


# ----------------------------------------------------------------------------------------
# Evidence (plain-language, neutral)
# ----------------------------------------------------------------------------------------
def _f(x, nd=2):
    return "n/a" if x is None or (isinstance(x, float) and np.isnan(x)) else f"{x:.{nd}f}".rstrip("0").rstrip(".")


def _d(x):
    return "n/a" if x is None or pd.isna(x) else pd.Timestamp(x).strftime("%d %b %Y")


def _one(row: pd.Series) -> pd.DataFrame:
    """One-row DataFrame with proper dtypes so the vector detectors can be reused for evidence."""
    df = pd.DataFrame([row.to_dict()])
    for c in ("transaction_date", "r_date", "m_date"):
        df[c] = pd.to_datetime(df[c])
    for c in ("transferred_area_decimal", "r_area", "m_area", "m_new_share", "transferred_share"):
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def _over_transfer_table(row, short, avail_area, excess_share, excess_area) -> dict:
    """Evidence table in the style: recorded share / transfer / total / potential excess."""
    by_area = excess_area > C.AREA_TOLERANCE
    unit = "Decimal" if by_area else "%"
    recorded = avail_area if by_area else float(row["seller_share_before"])
    moved = float(row["transferred_area_decimal"]) if by_area else float(row["transferred_share"])
    excess = excess_area if by_area else excess_share
    return {"unit": unit, "rows": [
        {"label": f"Recorded Share ({short(row['seller_id'])})", "value": round(recorded, 2), "kind": "base"},
        {"label": f"Transfer to {short(row['buyer_id'])} ({row['transaction_id']})", "value": round(moved, 2), "kind": "row"},
        {"label": "Total Transferred", "value": round(moved, 2), "kind": "total"},
        {"label": "Potential Excess", "value": round(excess, 2), "kind": "excess"}],
        "note": (f"Total transferred ({moved:.2f} {unit.lower() if by_area else '%'}) exceeds the recorded share "
                 f"({recorded:.2f} {unit.lower() if by_area else '%'}) by {excess:.2f}.")}


def _double_sale_table(row, sig, short, lookup) -> dict:
    ref = sig["double_sale_ref"]
    prev_area, prev_buyer = None, None
    if lookup is not None and ref in lookup.index:
        prev_area = float(lookup.loc[ref, "transferred_area_decimal"])
        prev_buyer = lookup.loc[ref, "buyer_id"]
    this_area = float(row["transferred_area_decimal"])
    rows = []
    if prev_area is not None:
        rows.append({"label": f"Earlier full transfer to {short(prev_buyer)} ({ref})", "value": round(prev_area, 2), "kind": "row"})
    rows.append({"label": f"This transfer to {short(row['buyer_id'])} ({row['transaction_id']})", "value": round(this_area, 2), "kind": "row"})
    total = this_area + (prev_area or 0)
    rows.append({"label": "Total Transferred", "value": round(total, 2), "kind": "total"})
    rows.append({"label": "Potential Overlap (sold after full transfer)", "value": round(this_area, 2), "kind": "excess"})
    return {"unit": "Decimal", "rows": rows,
            "note": f"{short(row['seller_id'])} had already transferred their entire interest in {ref}; this later transfer overlaps it."}


def build_evidence(row: pd.Series, sig: pd.Series, names: dict[str, str] | None = None,
                   lookup: pd.DataFrame | None = None) -> list[dict]:
    """Evidence items for ONE transaction. `row` = context row, `sig` = rule row,
    `lookup` = context indexed by transaction_id (used to show the earlier transfer in double-sale evidence)."""
    nm = (lambda i: f"{names.get(i, i)} ({i})" if names and isinstance(i, str) else str(i))
    short = (lambda i: names.get(i, i) if names and isinstance(i, str) else str(i))
    ev: list[dict] = []
    tid = row["transaction_id"]

    if sig["double_sale"]:
        ev.append({"type": "double_sale", "severity": "High",
                   "title": "Potential Double-Sale / Overlapping Transfer",
                   "message": (f"{nm(row['seller_id'])} appears as seller again although transaction "
                               f"{sig['double_sale_ref']} had already transferred their entire recorded interest in this parcel."),
                   "details": {"This transaction": tid, "Earlier full transfer": sig["double_sale_ref"],
                               "Seller": nm(row["seller_id"]), "Buyer (this transaction)": nm(row["buyer_id"]),
                               "Date": _d(row["transaction_date"])},
                   "table": _double_sale_table(row, sig, short, lookup)})
    if sig["over_transfer"]:
        avail_area = row["total_area_decimal"] * row["seller_share_before"] / 100.0
        excess_share = max(row["transferred_share"] - row["seller_share_before"], 0)
        excess_area = max(row["transferred_area_decimal"] - avail_area, 0)
        ev.append({"type": "over_transfer", "severity": "High", "title": "Potential Over-Transfer",
                   "message": (f"Transferred share ({_f(row['transferred_share'])}%) exceeds the seller's recorded share "
                               f"before the transfer ({_f(row['seller_share_before'])}%)." if excess_share > C.SHARE_TOLERANCE else
                               f"Transferred area ({_f(row['transferred_area_decimal'])} decimal) exceeds the area the seller "
                               f"controlled ({_f(avail_area)} decimal)."),
                   "details": {"Seller recorded share before (%)": _f(row["seller_share_before"]),
                               "Transferred share (%)": _f(row["transferred_share"]),
                               "Excess share (%)": _f(excess_share),
                               "Seller-controlled area (decimal)": _f(avail_area),
                               "Transferred area (decimal)": _f(row["transferred_area_decimal"]),
                               "Potential excess area (decimal)": _f(excess_area)},
                   "table": _over_transfer_table(row, short, avail_area, excess_share, excess_area)})
    if sig["rapid_transfer"]:
        strong = sig["rapid_transfer"] == 2
        ev.append({"type": "rapid_transfer", "severity": "High" if strong else "Medium", "title": "Rapid Transfer Pattern",
                   "message": (f"This parcel was transferred again {int(row['days_since_previous_transfer'])} day(s) after the "
                               f"previous transfer ({'strong' if strong else 'moderate'} signal). Rapid transfers are an anomaly "
                               f"signal only, not proof of wrongdoing."),
                   "details": {"Days since previous transfer": int(row["days_since_previous_transfer"]),
                               "Strong threshold (days)": C.RAPID_STRONG_DAYS, "Moderate threshold (days)": C.RAPID_MODERATE_DAYS}})
    if sig["ownership_chain_break"]:
        ev.append({"type": "ownership_chain_break", "severity": "Medium", "title": "Ownership Chain Break",
                   "message": (f"The recorded seller {nm(row['seller_id'])} does not match the recorded previous owner "
                               f"{nm(row['previous_owner_id'])}."),
                   "details": {"Recorded seller": nm(row["seller_id"]), "Recorded previous owner": nm(row["previous_owner_id"]),
                               "Ownership sequence": int(row["ownership_sequence"])}})
    if sig["registration_mismatch"]:
        msgs, det = [], {}
        iss = {k: bool(v.iloc[0]) for k, v in registration_issues(_one(row)).items()}
        if iss["missing_registration"]:
            msgs.append("no registration record is linked to this transaction")
        if iss["buyer_mismatch"]:
            msgs.append(f"registered buyer {nm(row['r_buyer'])} differs from transaction buyer {nm(row['buyer_id'])}")
        if iss["seller_mismatch"]:
            msgs.append(f"registered seller {nm(row['r_seller'])} differs from transaction seller {nm(row['seller_id'])}")
        if iss["area_mismatch"]:
            msgs.append(f"registered area {_f(row['r_area'])} differs from transaction area {_f(row['transferred_area_decimal'])} decimal")
        if iss["type_mismatch"]:
            msgs.append(f"registration type '{row['r_type']}' differs from transaction type '{row['transaction_type']}'")
        if iss["invalid_registration_date"]:
            msgs.append(f"registration date {_d(row['r_date'])} is before the transaction date {_d(row['transaction_date'])}")
        ev.append({"type": "registration_mismatch", "severity": "High" if not iss["missing_registration"] else "Medium",
                   "title": "Registration Mismatch", "message": "; ".join(msgs).capitalize() + ".",
                   "details": {"Issues": ", ".join(k.replace("_", " ") for k, v in iss.items() if v)}})
    if sig["mutation_mismatch"]:
        iss = {k: bool(v.iloc[0]) for k, v in mutation_issues(_one(row)).items()}
        msgs = []
        if iss["missing_mutation"]:
            msgs.append("no mutation record is linked to this transaction")
        if iss["new_owner_mismatch"]:
            msgs.append(f"mutation owner {nm(row['m_new'])} differs from registered buyer {nm(row['r_buyer'])}")
        if iss["previous_owner_mismatch"]:
            msgs.append(f"mutation previous owner {nm(row['m_prev'])} differs from registered seller {nm(row['r_seller'])}")
        if iss["area_mismatch"]:
            msgs.append(f"mutated area {_f(row['m_area'])} differs from registered area {_f(row['r_area'])} decimal")
        if iss["share_mismatch"]:
            msgs.append(f"mutation share {_f(row['m_new_share'])}% differs from transferred share {_f(row['transferred_share'])}%")
        if iss["type_mismatch"]:
            msgs.append(f"mutation type '{row['m_type']}' differs from registration type '{row['r_type']}'")
        if iss["invalid_mutation_date"]:
            msgs.append(f"mutation date {_d(row['m_date'])} is earlier than the registration/transaction date")
        ev.append({"type": "mutation_mismatch", "severity": "High" if not iss["missing_mutation"] else "Medium",
                   "title": "Registration–Mutation Mismatch", "message": "; ".join(msgs).capitalize() + ".",
                   "details": {"Issues": ", ".join(k.replace("_", " ") for k, v in iss.items() if v)}})
    if sig["temporal_inconsistency"]:
        ev.append({"type": "temporal_inconsistency", "severity": "Medium", "title": "Temporal Inconsistency",
                   "message": "Expected order is transaction date ≤ registration date ≤ mutation date, but the recorded dates are out of order.",
                   "details": {"Transaction date": _d(row["transaction_date"]), "Registration date": _d(row["r_date"]),
                               "Mutation date": _d(row["m_date"])}})
    return ev
