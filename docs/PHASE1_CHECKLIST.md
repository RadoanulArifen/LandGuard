# Phase-1 checklist — status against the review PDFs

The two "Executive Summary" review PDFs were written without access to the code (they say "assumed" / "?"). This file records the
**actual** status, with the file that proves each item. Everything marked ✅ was run and passes (`pytest`: see `backend/tests`).

## Project structure
| Item | Status | Evidence |
|---|---|---|
| backend/ , frontend/ | ✅ | `backend/app`, `backend/ml`, `frontend/src` |
| data/ with the 6 CSVs | ✅ | `backend/data/raw/*.csv`; root `data/README.md` explains the location; `tests/test_data.py::test_all_six_csv_files_present` |
| README.md (setup, data source, AI disclosure) | ✅ | `README.md` (AI tools: Claude; data: synthetic) |
| requirements.txt | ✅ | `backend/requirements.txt`, `backend/.env.example` |
| Concept Note (≤ 4-page PDF) | ✅ draft | `docs/ConceptNote.pdf` (3 pages; **fill in team/mentor names**; rebuild: `python scripts/make_concept_note.py`) |
| Demo script | ✅ | `docs/DEMO_SCRIPT.md` |
| Demo video (≤ 3 min) | ❌ yours to record | follow `docs/DEMO_SCRIPT.md` |
| No Docker | ✅ | no Docker files anywhere |

## Backend / data
| Item | Status | Evidence |
|---|---|---|
| CSV ingestion script | ✅ | `backend/scripts/import_data.py` (validates first, then loads; `--reset` to reload) |
| Validation (IDs, orphans, dates, shares, areas) | ✅ | `backend/scripts/validate_data.py` |
| SQLite schema with PKs and FKs | ✅ | `backend/app/models/tables.py`; `test_primary_keys_and_foreign_keys_declared` |
| Indexes for fast search | ✅ | `index=True` on parcel/owner/transaction keys, district, upazila, mouza, khatian, dag; `test_search_indexes_exist` |
| Foreign-key checks | ✅ | `PRAGMA foreign_keys=ON`, `PRAGMA foreign_key_check` in import and in `test_sqlite_integrity_and_foreign_keys` |
| Row counts DB vs CSV vs dataset report | ✅ | `test_csv_row_counts_match_dataset_report`, `test_db_row_counts_equal_csv_row_counts` |
| Target-leakage columns excluded from ML | ✅ | `ml/feature_engineering.py`; `tests/test_ml.py::test_no_label_leakage_in_features` |

## API endpoints (IDs are strings like `P-000032`, not integers)
| Endpoint | Status |
|---|---|
| `GET /api/parcels/search` (alias of `/api/parcels`; district, upazila, mouza, khatian, dag, parcel_id, owner) | ✅ |
| `GET /api/parcels/{id}` (details + current owner) | ✅ |
| `GET /api/parcels/{id}/history` and `GET /api/ownership/history?parcel_id=` or `?owner_id=` | ✅ |
| `GET /api/owners/{id}` and `/api/owners/{id}/history` | ✅ |
| `GET /api/transactions/{id}` , `/api/registrations/{id}` , `/api/mutations/{id}` | ✅ |
| Alerts, investigation, report, dashboard, analytics, graph, timeline, registration-mutation | ✅ (see README section 13) |
| 404 for unknown records, 422 for invalid IDs, no stack traces | ✅ (`test_not_found_and_validation`) |

## Rules, graph, ML (the review said "missing")
| Item | Status | Evidence |
|---|---|---|
| Double-sale, over-transfer, rapid transfer, chain break, registration/mutation mismatch, temporal | ✅ | `backend/app/detection/engine.py` (the review's "rules.py"); `tests/test_detection.py` |
| Ownership graph | ✅ | `backend/app/services/parcel.py` (NetworkX) → `/api/parcels/{id}/graph` |
| ML model, metrics, SHAP | ✅ | `backend/ml/`, `backend/ml/models/metrics.json` (real numbers, README section 16) |
| Evidence in API responses | ✅ | `evidence` array and `explanation` in `/api/alerts/{id}` |

## Frontend
| Item | Status | Evidence |
|---|---|---|
| React Flow graph | ✅ | `frontend/src/pages/TransactionGraph.jsx` |
| Recharts | ✅ | `Dashboard.jsx`, `Analytics.jsx` |
| Search UI, dashboard, timeline, alerts, evidence, comparison, AI analysis, reports | ✅ | `frontend/src/pages/*`; `npm test` renders all 14 routes against the live API |

## Still to do by the team (cannot be done by code)
1. Fill in the names / DIU IDs in the concept note and re-run `python scripts/make_concept_note.py`.
2. Record the ≤ 3-minute demo video.
3. Push the repository to GitHub/GitLab and **keep committing** (the rule book may review history). Add "Changes since Round 1" to the README before the Final.
4. Optional: live deployment link, CI workflow, `pyproject.toml` (not required).
