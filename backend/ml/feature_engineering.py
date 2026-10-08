"""Transaction-level feature engineering.

THREE feature sets are built so that data leakage is visible and measurable:

  pattern : raw history / timing / area / delay features only.  (honest "ML-only" baseline)
  records : pattern + raw record-comparison features (do registration & mutation agree with the
            transaction?).  DEPLOYED model uses this set.
  full    : records + the 7 rule signals.  Reported only to demonstrate leakage: the provided labels
            are rule-derived, so this set lets a model simply copy the rules.

NEVER used as inputs: ground_truth_label, any *_flag column from fraud_labels, anomaly_count,
anomaly_severity, primary_anomaly_type, ground_truth_reason, evidence_* columns, predictions, scores.
"""
import numpy as np
import pandas as pd

from app.detection.engine import SIGNALS

NO_PREV = 20000.0   # larger than any real interval, used when there is no previous transfer

PATTERN_FEATURES = [
    "parcel_transaction_count", "seller_transaction_count", "buyer_transaction_count",
    "transaction_frequency", "days_since_previous_transfer", "has_previous_transfer",
    "average_transfer_interval", "transferred_area_ratio", "transferred_area_decimal",
    "parcel_total_area", "seller_share_before", "transferred_share", "share_ratio",
    "ownership_sequence", "ownership_change_count", "seller_prior_txns_on_parcel",
    "seller_prior_share_sold", "registration_delay_days", "mutation_delay_days",
    "has_registration", "has_mutation", "log_value_per_decimal",
    "type_Sale", "type_Gift", "type_Inheritance", "type_Transfer", "type_Partition",
    "status_Completed", "status_Pending", "status_Cancelled", "status_Under Review",
]
RECORD_FEATURES = [
    "registration_buyer_match", "registration_seller_match", "registration_area_diff",
    "registration_type_match", "mutation_owner_match", "mutation_previous_match",
    "mutation_area_diff", "mutation_share_diff", "mutation_type_match",
    "ownership_chain_consistent", "reg_minus_txn_days", "mut_minus_reg_days",
]
SIGNAL_FEATURES = [f"{s}_signal" for s in SIGNALS] + ["signal_count"]

FEATURE_SETS = {
    "pattern": PATTERN_FEATURES,
    "records": PATTERN_FEATURES + RECORD_FEATURES,
    "full": PATTERN_FEATURES + RECORD_FEATURES + SIGNAL_FEATURES,
}

FEATURE_DOCS = {
    "parcel_transaction_count": "How many transactions the parcel has in total.",
    "seller_transaction_count": "How many transactions this seller appears in (as seller).",
    "buyer_transaction_count": "How many transactions this buyer appears in (as buyer).",
    "transaction_frequency": "Parcel transactions per year of its recorded history.",
    "days_since_previous_transfer": "Days since the previous transfer of the parcel (20000 if first).",
    "has_previous_transfer": "1 if the parcel had an earlier transfer.",
    "average_transfer_interval": "Average days between transfers of this parcel.",
    "transferred_area_ratio": "Transferred area / parcel total area.",
    "transferred_area_decimal": "Transferred area in decimal.",
    "parcel_total_area": "Parcel total area in decimal.",
    "seller_share_before": "Seller's recorded share (%) before the transfer.",
    "transferred_share": "Share (%) transferred.",
    "share_ratio": "Transferred share / seller share before (capped at 5).",
    "ownership_sequence": "Position of the transaction in the parcel's ownership sequence.",
    "ownership_change_count": "Number of ownership changes on the parcel up to and including this one.",
    "seller_prior_txns_on_parcel": "Earlier transactions by the same seller on the same parcel.",
    "seller_prior_share_sold": "Cumulative share (%) the seller already sold on this parcel earlier.",
    "registration_delay_days": "Days between transaction and registration (negative = registered before).",
    "mutation_delay_days": "Days between registration and mutation.",
    "has_registration": "1 if a registration record exists.",
    "has_mutation": "1 if a mutation record exists.",
    "log_value_per_decimal": "log(1 + transaction value per decimal).",
    "registration_buyer_match": "1 buyer in registration equals transaction buyer, 0 differs, -1 no registration.",
    "registration_seller_match": "1 seller in registration equals transaction seller, 0 differs, -1 no registration.",
    "registration_area_diff": "Absolute area difference registration vs transaction (-1 if missing).",
    "registration_type_match": "1 registration type equals transaction type, 0 differs, -1 missing.",
    "mutation_owner_match": "1 mutation owner equals registered buyer, 0 differs, -1 no mutation.",
    "mutation_previous_match": "1 mutation previous owner equals registered seller, 0 differs, -1 no mutation.",
    "mutation_area_diff": "Absolute area difference mutation vs registration (-1 if missing).",
    "mutation_share_diff": "Absolute share difference mutation vs transaction (-1 if missing).",
    "mutation_type_match": "1 mutation type equals registration type, 0 differs, -1 missing.",
    "ownership_chain_consistent": "1 recorded seller equals recorded previous owner, else 0.",
    "reg_minus_txn_days": "Registration date minus transaction date in days (0 if missing).",
    "mut_minus_reg_days": "Mutation date minus registration date in days (0 if missing).",
}
for _s in SIGNALS:
    FEATURE_DOCS[f"{_s}_signal"] = f"Rule-engine signal '{_s}' (only used in the 'full' leakage-demo set)."
for _t in ["Sale", "Gift", "Inheritance", "Transfer", "Partition"]:
    FEATURE_DOCS[f"type_{_t}"] = f"1 if the transaction type is {_t}."
for _t in ["Completed", "Pending", "Cancelled", "Under Review"]:
    FEATURE_DOCS[f"status_{_t}"] = f"1 if the transaction status is {_t}."
FEATURE_DOCS["signal_count"] = "Number of rule signals raised (leakage-demo set only)."


def _match(a, b, present):
    return np.where(present, (a == b).astype(float), -1.0)


def build_features(ctx: pd.DataFrame, sig: pd.DataFrame | None = None) -> pd.DataFrame:
    """Return a DataFrame indexed like ctx with every feature column (all three sets)."""
    f = pd.DataFrame(index=ctx.index)
    gp = ctx.groupby("parcel_id")
    cnt = gp["transaction_id"].transform("count")
    span_years = ((gp["transaction_date"].transform("max") - gp["transaction_date"].transform("min")).dt.days / 365.25).clip(lower=1)
    days = ctx["days_since_previous_transfer"]
    f["parcel_transaction_count"] = cnt
    f["seller_transaction_count"] = ctx.groupby("seller_id")["transaction_id"].transform("count")
    f["buyer_transaction_count"] = ctx.groupby("buyer_id")["transaction_id"].transform("count")
    f["transaction_frequency"] = cnt / span_years
    f["days_since_previous_transfer"] = days.fillna(NO_PREV)
    f["has_previous_transfer"] = days.notna().astype(int)
    f["average_transfer_interval"] = days.groupby(ctx["parcel_id"]).transform("mean").fillna(NO_PREV)
    f["transferred_area_ratio"] = ctx["transferred_area_decimal"] / ctx["total_area_decimal"]
    f["transferred_area_decimal"] = ctx["transferred_area_decimal"]
    f["parcel_total_area"] = ctx["total_area_decimal"]
    f["seller_share_before"] = ctx["seller_share_before"]
    f["transferred_share"] = ctx["transferred_share"]
    f["share_ratio"] = (ctx["transferred_share"] / ctx["seller_share_before"].replace(0, np.nan)).fillna(5).clip(upper=5)
    f["ownership_sequence"] = ctx["ownership_sequence"]
    f["ownership_change_count"] = gp.cumcount() + 1
    gs = ctx.groupby(["parcel_id", "seller_id"])
    f["seller_prior_txns_on_parcel"] = gs.cumcount()
    f["seller_prior_share_sold"] = gs["transferred_share"].cumsum() - ctx["transferred_share"]
    f["registration_delay_days"] = ctx["r_delay"].fillna(0)
    f["mutation_delay_days"] = ctx["m_delay"].fillna(0)
    has_r, has_m = ctx["r_id"].notna(), ctx["m_id"].notna()
    f["has_registration"] = has_r.astype(int)
    f["has_mutation"] = has_m.astype(int)
    f["log_value_per_decimal"] = np.log1p(ctx["transaction_value_bdt"].fillna(0) / ctx["transferred_area_decimal"].clip(lower=0.01))
    for t in ["Sale", "Gift", "Inheritance", "Transfer", "Partition"]:
        f[f"type_{t}"] = (ctx["transaction_type"] == t).astype(int)
    for s in ["Completed", "Pending", "Cancelled", "Under Review"]:
        f[f"status_{s}"] = (ctx["transaction_status"] == s).astype(int)
    # ---- record-comparison features ----
    f["registration_buyer_match"] = _match(ctx["r_buyer"], ctx["buyer_id"], has_r)
    f["registration_seller_match"] = _match(ctx["r_seller"], ctx["seller_id"], has_r)
    f["registration_area_diff"] = np.where(has_r, (ctx["r_area"] - ctx["transferred_area_decimal"]).abs(), -1.0)
    f["registration_type_match"] = _match(ctx["r_type"], ctx["transaction_type"], has_r)
    f["mutation_owner_match"] = _match(ctx["m_new"], ctx["r_buyer"], has_m)
    f["mutation_previous_match"] = _match(ctx["m_prev"], ctx["r_seller"], has_m)
    f["mutation_area_diff"] = np.where(has_m, (ctx["m_area"] - ctx["r_area"]).abs(), -1.0)
    f["mutation_share_diff"] = np.where(has_m, (ctx["m_new_share"] - ctx["transferred_share"]).abs(), -1.0)
    f["mutation_type_match"] = _match(ctx["m_type"], ctx["r_type"], has_m)
    f["ownership_chain_consistent"] = (ctx["previous_owner_id"].isna() | (ctx["seller_id"] == ctx["previous_owner_id"])).astype(int)
    f["reg_minus_txn_days"] = (ctx["r_date"] - ctx["transaction_date"]).dt.days.fillna(0)
    f["mut_minus_reg_days"] = (ctx["m_date"] - ctx["r_date"]).dt.days.fillna(0)
    # ---- rule signals (leakage-demo set only) ----
    if sig is not None:
        s = sig.set_index(ctx.index) if len(sig) == len(ctx) else sig
        for name in SIGNALS:
            f[f"{name}_signal"] = (s[name].values > 0).astype(int)
        f["signal_count"] = s["signal_count"].values
    return f.replace([np.inf, -np.inf], 0).fillna(0)
