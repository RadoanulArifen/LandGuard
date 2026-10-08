"""Create the SQLite database and import the six CSV files.

Run:  python scripts/import_data.py            (skips if already imported)
      python scripts/import_data.py --reset    (drops everything and re-imports)
"""
import argparse
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sqlalchemy import func, select, text  # noqa: E402

from app.config import DATABASE_URL  # noqa: E402
from app.database.db import Base, SessionLocal, engine  # noqa: E402
from app.models import tables as t  # noqa: E402
from scripts.validate_data import load, validate  # noqa: E402

ORDER = [("parcels", t.Parcel), ("owners", t.Owner), ("transactions", t.Transaction),
         ("registrations", t.Registration), ("mutations", t.Mutation), ("fraud_labels", t.FraudLabel)]


def import_all(reset=False, raw_dir=None, verbose=True):
    data = load(raw_dir) if raw_dir else load()
    errors, _, _ = validate(data, verbose=verbose)
    if errors:
        raise SystemExit("Import stopped: fix the serious data errors listed above first.")
    if reset:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        # parcels<->owners reference each other only logically, so insert owners first
        for name, model in [ORDER[1], ORDER[0]] + ORDER[2:]:
            existing = db.scalar(select(func.count()).select_from(model))
            if existing:
                if verbose:
                    print(f"  {name}: already has {existing} rows - skipped (use --reset to reload)")
                continue
            df = data[name].astype(object).where(data[name].notna(), None)
            rows = df.to_dict("records")
            for i in range(0, len(rows), 5000):
                db.bulk_insert_mappings(model, rows[i:i + 5000])
            db.commit()
            if verbose:
                print(f"  {name}: imported {len(rows)} rows")
        if db.execute(text("PRAGMA foreign_key_check")).fetchall():
            raise SystemExit("Foreign-key check failed after import.")
    if verbose:
        print(f"Database ready: {DATABASE_URL}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset", action="store_true")
    import_all(ap.parse_args().reset)
