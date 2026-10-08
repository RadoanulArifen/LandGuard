"""Run the full LandGuard analysis and store it in the analysis_results table.

Run:  python scripts/run_analysis.py       (needs: import_data.py and ml.train done first)
"""
import json
import sys
import time
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import MODEL_DIR  # noqa: E402
from app.database.db import Base, SessionLocal, engine  # noqa: E402
from app.detection.engine import SIGNALS, build_context, build_evidence, primary_signal, run_rules  # noqa: E402
from app.models.tables import Analysis  # noqa: E402
from app.services.data import load_frames  # noqa: E402
from app.services.scoring import priority_level, priority_score  # noqa: E402


def main():
    t0 = time.time()
    oof_path = MODEL_DIR / "oof_scores.csv"
    if not oof_path.exists():
        raise SystemExit("ML scores not found. Run:  python -m ml.train   first.")
    fr = load_frames()
    ctx = build_context(fr["transactions"], fr["registrations"], fr["mutations"], fr["parcels"])
    sig = run_rules(ctx)
    ml = pd.read_csv(oof_path).set_index("transaction_id")["ml_score"]
    sig["ml_score"] = sig["transaction_id"].map(ml).fillna(0.0)
    sig["priority_score"] = [priority_score(r, m) for r, m in zip(sig["rule_points"], sig["ml_score"])]
    sig["priority_level"] = sig["priority_score"].map(priority_level)
    sig["primary_signal"] = sig.apply(primary_signal, axis=1)
    names = fr["owners"].set_index("owner_id")["synthetic_name"].to_dict()

    lookup = ctx.set_index('transaction_id')
    ev = {}
    flagged = sig.index[sig["signal_count"] > 0]
    print(f"Building evidence for {len(flagged)} flagged transactions ...")
    for i in flagged:
        ev[i] = json.dumps(build_evidence(ctx.loc[i], sig.loc[i], names, lookup))

    Base.metadata.create_all(engine)
    rows = []
    for i, r in sig.iterrows():
        rows.append({"transaction_id": r.transaction_id, "parcel_id": r.parcel_id,
                     **{s: int(r[s]) for s in SIGNALS}, "signal_count": int(r.signal_count),
                     "rule_points": float(r.rule_points), "ml_score": float(r.ml_score),
                     "priority_score": float(r.priority_score), "priority_level": r.priority_level,
                     "primary_signal": r.primary_signal, "evidence_json": ev.get(i, "[]")})
    with SessionLocal() as db:
        db.query(Analysis).delete()
        for k in range(0, len(rows), 5000):
            db.bulk_insert_mappings(Analysis, rows[k:k + 5000])
        db.commit()
    print(sig["priority_level"].value_counts().to_dict())
    print(f"Stored {len(rows)} analysis rows in {time.time()-t0:.0f}s")


if __name__ == "__main__":
    main()
