"""Validate the six LandGuard CSV files.

Run:  python scripts/validate_data.py
Exit code 0 = no serious problems, 1 = serious problems found.
Serious problems are never ignored silently.
"""
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import CSV_FILES, RAW_DIR  # noqa: E402

PKS = {"parcels": "parcel_id", "owners": "owner_id", "transactions": "transaction_id",
       "registrations": "registration_id", "mutations": "mutation_id", "fraud_labels": "transaction_id"}
DATE_COLS = {"parcels": ["creation_date"], "owners": ["first_recorded_ownership_date", "last_verified_date"],
             "transactions": ["transaction_date"], "registrations": ["registration_date"],
             "mutations": ["mutation_date"]}


def load(raw_dir=RAW_DIR):
    return {n: pd.read_csv(Path(raw_dir) / f"{n}.csv") for n in CSV_FILES}


def validate(d, verbose=True):
    errors, warnings = [], []
    P, O, T, R, M, F = (d[k] for k in CSV_FILES)

    def say(msg):
        if verbose:
            print(msg)

    say("== Basic profile ==")
    for n, df in d.items():
        say(f"  {n:14s} rows={len(df):6d} cols={df.shape[1]:2d} missing_cells={int(df.isna().sum().sum())}")

    # 1. missing / duplicate primary keys
    for n, pk in PKS.items():
        df = d[n]
        if df[pk].isna().any():
            errors.append(f"{n}: {int(df[pk].isna().sum())} missing {pk}")
        dup = int(df[pk].duplicated().sum())
        if dup:
            errors.append(f"{n}: {dup} duplicate {pk}")
    for n in ("registrations", "mutations"):
        if d[n].transaction_id.duplicated().any():
            warnings.append(f"{n}: more than one record per transaction_id")

    # 2. foreign keys / orphans
    def fk(child, col, parent, pcol, allow_null=False):
        s = d[child][col]
        if allow_null:
            s = s.dropna()
        bad = int((~s.isin(d[parent][pcol])).sum())
        if bad:
            errors.append(f"{child}.{col} -> {parent}.{pcol}: {bad} orphan/invalid values")
    fk("parcels", "current_owner_id", "owners", "owner_id")
    for c in ("seller_id", "buyer_id"):
        fk("transactions", c, "owners", "owner_id")
    fk("transactions", "parcel_id", "parcels", "parcel_id")
    fk("transactions", "previous_owner_id", "owners", "owner_id", True)
    fk("registrations", "transaction_id", "transactions", "transaction_id")
    fk("registrations", "parcel_id", "parcels", "parcel_id")
    for c in ("seller_id", "buyer_id"):
        fk("registrations", c, "owners", "owner_id")
    fk("mutations", "registration_id", "registrations", "registration_id")
    fk("mutations", "transaction_id", "transactions", "transaction_id")
    fk("mutations", "parcel_id", "parcels", "parcel_id")
    for c in ("previous_owner_id", "new_owner_id"):
        fk("mutations", c, "owners", "owner_id")
    fk("fraud_labels", "transaction_id", "transactions", "transaction_id")
    fk("fraud_labels", "parcel_id", "parcels", "parcel_id")
    miss = int((~T.transaction_id.isin(F.transaction_id)).sum())
    if miss:
        errors.append(f"transactions without a fraud_labels row: {miss}")

    # 3. invalid relationships (child agrees with parent about the parcel / transaction)
    x = R.merge(T[["transaction_id", "parcel_id"]], on="transaction_id", suffixes=("", "_t"))
    n = int((x.parcel_id != x.parcel_id_t).sum())
    if n:
        errors.append(f"registrations: {n} rows whose parcel_id differs from their transaction's parcel_id")
    x = M.merge(R[["registration_id", "transaction_id"]], on="registration_id", suffixes=("", "_r"))
    n = int((x.transaction_id != x.transaction_id_r).sum())
    if n:
        errors.append(f"mutations: {n} rows whose transaction_id differs from their registration's transaction_id")
    n = int((T.seller_id == T.buyer_id).sum())
    if n:
        warnings.append(f"transactions: {n} rows where seller == buyer")

    # 4. dates
    for n, cols in DATE_COLS.items():
        for c in cols:
            bad = int(pd.to_datetime(d[n][c], errors="coerce").isna().sum())
            if bad:
                errors.append(f"{n}.{c}: {bad} invalid dates")
    td = pd.to_datetime(T.transaction_date, errors="coerce")
    if (td > pd.Timestamp.today()).any():
        warnings.append("transactions: some dates are in the future")

    # 5. shares and areas
    for c in ("seller_share_before", "transferred_share", "buyer_share_after", "seller_share_after"):
        bad = int(((T[c] < 0) | (T[c] > 100)).sum())
        if bad:
            errors.append(f"transactions.{c}: {bad} values outside 0-100")
    for n, c in (("parcels", "total_area_decimal"), ("transactions", "transferred_area_decimal"),
                 ("registrations", "registered_area_decimal"), ("mutations", "mutated_area_decimal")):
        bad = int((d[n][c] <= 0).sum())
        if bad:
            errors.append(f"{n}.{c}: {bad} non-positive areas")

    # 6. informational (these are what LandGuard is designed to detect, so they are NOT load errors)
    info = {
        "transactions with transferred_share > seller_share_before": int((T.transferred_share > T.seller_share_before + 0.01).sum()),
        "transactions without registration": int((~T.transaction_id.isin(R.transaction_id)).sum()),
        "completed transactions without mutation": int(((T.transaction_status == "Completed") & ~T.transaction_id.isin(M.transaction_id)).sum()),
        "ground_truth_label = 1": int(F.ground_truth_label.sum()),
    }
    say("== Anomalies present in the data (expected; detected later, not load errors) ==")
    for k, v in info.items():
        say(f"  {k}: {v}")
    say("== Result ==")
    for w in warnings:
        say(f"  WARNING: {w}")
    for e in errors:
        say(f"  ERROR:   {e}")
    if not errors:
        say("  OK - no serious data problems found.")
    return errors, warnings, info


if __name__ == "__main__":
    errs, _, _ = validate(load())
    sys.exit(1 if errs else 0)
