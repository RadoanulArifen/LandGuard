"""Data-integrity tests: CSVs present, row counts, keys, foreign keys, indexes, validation."""
import pandas as pd
import pytest
from sqlalchemy import text

from app.config import CSV_FILES, RAW_DIR
from app.database.db import engine
from scripts.validate_data import load, validate

EXPECTED_ROWS = {"parcels": 15000, "owners": 11500, "transactions": 25000, "registrations": 23370,
                 "mutations": 20632, "fraud_labels": 25000}


def _db_ready():
    try:
        with engine.connect() as c:
            return c.execute(text("SELECT COUNT(*) FROM parcels")).scalar() > 0
    except Exception:
        return False


needs_db = pytest.mark.skipif(not _db_ready(), reason="run scripts/import_data.py first")


def test_all_six_csv_files_present():
    for n in CSV_FILES:
        assert (RAW_DIR / f"{n}.csv").exists(), f"{n}.csv missing in {RAW_DIR}"


def test_csv_row_counts_match_dataset_report():
    for n, expected in EXPECTED_ROWS.items():
        assert len(pd.read_csv(RAW_DIR / f"{n}.csv")) == expected, n


def test_validation_script_finds_no_serious_errors():
    errors, _, _ = validate(load(), verbose=False)
    assert errors == []


@needs_db
def test_db_row_counts_equal_csv_row_counts():
    with engine.connect() as c:
        for n, expected in EXPECTED_ROWS.items():
            assert c.execute(text(f"SELECT COUNT(*) FROM {n}")).scalar() == expected, n


@needs_db
def test_sqlite_integrity_and_foreign_keys():
    with engine.connect() as c:
        assert c.execute(text("PRAGMA integrity_check")).scalar() == "ok"
        assert c.execute(text("PRAGMA foreign_key_check")).fetchall() == []


@needs_db
def test_primary_keys_and_foreign_keys_declared():
    with engine.connect() as c:
        for table, fks in {"transactions": {"parcels", "owners"}, "registrations": {"transactions", "parcels", "owners"},
                           "mutations": {"registrations", "transactions", "parcels", "owners"},
                           "fraud_labels": {"transactions", "parcels"}, "parcels": {"owners"}}.items():
            got = {r[2] for r in c.execute(text(f"PRAGMA foreign_key_list({table})")).fetchall()}
            assert fks <= got, (table, got)
        pk = {r[1] for r in c.execute(text("PRAGMA table_info(parcels)")).fetchall() if r[5]}
        assert pk == {"parcel_id"}


@needs_db
def test_search_indexes_exist():
    with engine.connect() as c:
        idx = {(r[0], r[1]) for r in c.execute(text("SELECT tbl_name, name FROM sqlite_master WHERE type='index'")).fetchall()}
        names = " ".join(n for _, n in idx)
        for must in ["ix_parcels_district", "ix_parcels_khatian_no", "ix_parcels_dag_no", "ix_transactions_parcel_id",
                     "ix_transactions_seller_id", "ix_transactions_buyer_id", "ix_registrations_transaction_id",
                     "ix_mutations_transaction_id", "ix_analysis_results_priority_score", "ix_tx_parcel_date"]:
            assert must in names, must
