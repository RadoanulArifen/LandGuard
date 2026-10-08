# LandGuard — Explainable Land Transaction Integrity & Fraud Detection Engine

**LandTech 2026 Hackathon · Track: Digital Land Records, Verification & Digitization · Problem P3: Fraud & Double-Selling Detection**

LandGuard links parcel, owner, transaction, registration and mutation records into a time-aware ownership graph, runs
deterministic integrity rules, adds a local machine-learning model, and ranks transactions by **Investigation Priority** —
with plain-language evidence and SHAP explanations — so that **human officials** know where to look first.

> **Legal boundary.** LandGuard is decision-support only. It never states that fraud is confirmed, that a person committed fraud,
> or who legally owns land. Wording used: *Potential Inconsistency, Suspicious Pattern, Review Recommended, Human Review Required.*
> The score is an **Investigation Priority Score (0–100)**, not a fraud probability.

**No Docker is used anywhere.** Everything runs directly on Ubuntu with a Python virtual environment, SQLite and npm.
No internet or external AI API is needed after the dependencies are installed.

---
## 1. Problem
Land disputes are common in Bangladesh and often trace back to records that disagree: the same interest sold twice, transfers larger
than the recorded share, and sub-registry (registration) records that differ from AC Land (mutation) records.

## 2. Solution
Government systems maintain records. LandGuard adds an **integrity-analysis layer** that checks whether the linked records make sense together:
`Records → Graph → Rule engine → ML prioritisation → Explainable evidence → Human review`.

## 3. Architecture
```
React + Vite + Tailwind  ──REST (/api)──►  FastAPI ──► SQLite (SQLAlchemy)
                                              ├─ detection/engine.py   7 deterministic detectors + evidence text
                                              ├─ services/parcel.py    ownership history, timeline, NetworkX graph
                                              ├─ ml/                   features, training, evaluation (RF + XGBoost)
                                              ├─ services/explain.py   SHAP -> plain-language factors
                                              ├─ services/scoring.py   Investigation Priority Score
                                              └─ services/report.py    PDF report (ReportLab)
```
Project layout: `backend/app` (API), `backend/ml`, `backend/scripts`, `backend/tests`, `backend/data/raw` (CSVs), `frontend/src`, `docs/`.

## 4. Dataset structure (synthetic)
| File | Rows | Key |
|---|---|---|
| parcels.csv | 15,000 | parcel_id |
| owners.csv | 11,500 | owner_id |
| transactions.csv | 25,000 | transaction_id |
| registrations.csv | 23,370 | registration_id |
| mutations.csv | 20,632 | mutation_id |
| fraud_labels.csv | 25,000 | transaction_id (synthetic ground truth) |

Relationships: parcels → owners → transactions → registrations → mutations, plus one label row per transaction. All IDs are kept unchanged.
All data is synthetic; no real names, NIDs, phone numbers or land records are used. Column details: `docs/METHODOLOGY.md`.

## 5–7. Installation (Ubuntu, no Docker)
Requirements: Python 3.11+, Node.js LTS, npm, Git.
```bash
cd LandGuard
./setup.sh
```
`setup.sh` does everything below in order. To do it by hand:

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
**Database + data import (SQLite)**
```bash
python scripts/validate_data.py        # reports duplicate IDs, orphans, bad dates/shares/areas
python scripts/import_data.py --reset  # creates backend/data/landguard.db and imports the six CSVs
```
**ML training**
```bash
python -m ml.train                     # trains, evaluates, saves backend/ml/models/*
python scripts/run_analysis.py         # runs rules + ML + scoring, stores results in SQLite
```
**Frontend**
```bash
cd ../frontend
npm install
```

## 12. Running the application
```bash
# Terminal 1 (backend, http://localhost:8000, docs at /docs)
./run_backend.sh        # = cd backend && source venv/bin/activate && uvicorn app.main:app --reload
# Terminal 2 (frontend, http://localhost:5173)
./run_frontend.sh       # = cd frontend && npm run dev
```
Tests: `cd backend && source venv/bin/activate && pytest` · `cd frontend && npm test` (backend must be running).

## 13. API endpoints
`GET /api/health` · `/api/dashboard/stats` · `/api/parcels` (filters) · `/api/parcels/{id}` · `/history` · `/graph` · `/timeline` · `/alerts` ·
`/api/transactions` · `/api/transactions/{id}` · `/api/alerts` · `/api/alerts/{id}` · `/api/investigations/{id}` ·
`POST /api/investigate/{id}` · `/api/parcels/search` · `/api/owners/{id}` · `/api/owners/{id}/history` · `/api/ownership/history?parcel_id=|owner_id=` · `/api/registrations/{id}` · `/api/mutations/{id}` · `/api/analytics` · `/api/registration-mutation/{id}` · `/api/reports/{id}` (PDF) · `/api/demo` · `/api/model/metrics` · `/api/meta/locations`.

## 14. Detection logic (rule engine, `backend/app/detection/engine.py`)
| Signal | Rule |
|---|---|
| Double-sale | A seller appears again on the same parcel after an earlier transaction already transferred that seller's entire interest. A normal chain A→B→C→D is not flagged. |
| Over-transfer | Transferred share > seller's share before, **or** transferred area > area the seller controlled. |
| Rapid transfer | Days since previous transfer ≤ 7 (strong) or 8–30 (moderate). Configurable in `app/config.py`. Anomaly signal only. |
| Ownership chain break | Recorded seller ≠ recorded previous owner. |
| Registration mismatch | Missing registration, buyer/seller/area/type differs from the transaction, or registration date before transaction date. |
| Mutation mismatch | Missing mutation, new/previous owner, area, share or type differs from the registration, or mutation dated before registration/transaction. |
| Temporal inconsistency | Not transaction ≤ registration ≤ mutation. |

I compared each detector with the provided `fraud_labels.csv` flags: six of seven reproduce the provided flags exactly (0 false positives, 0 false negatives).
Mutation mismatch raises 614 extra hits, caused by my additional share-difference and type-difference checks (which the SRS asks for) that the provided labels do not count.

## 15. ML methodology
Pipeline: raw data → feature engineering → stratified 80/20 split (random_state 42) → Random Forest and XGBoost → evaluation → persistence → prediction → SHAP.
Features are documented in `backend/ml/feature_engineering.py` and `docs/METHODOLOGY.md`. **Never used as inputs:** `ground_truth_label`, any `*_flag`, `anomaly_*`, `evidence_*`, scores or predictions.
Three feature sets make leakage visible: `pattern` (history/timing/area), `records` (+ record-comparison features, **deployed**), `full` (+ rule signals, leakage demo only).
Stored ML scores are 5-fold **out-of-fold** predictions, so no transaction is scored by a model that saw its own label.

## 16. Evaluation (real results, 5,000-row held-out test split; label positive rate 41.4%)
| Approach | Precision | Recall | F1 | False-positive rate | TN / FP / FN / TP |
|---|---|---|---|---|---|
| Rules only | 95.3% | 100.0% | 97.6% | 3.4% | 2829 / 101 / 0 / 2070 |
| ML only (XGBoost, `pattern` features) | 94.2% | 72.5% | 81.9% | 3.1% | 2838 / 92 / 570 / 1500 |
| Hybrid: rules OR ML (XGBoost, `records`) | 94.6% | 100.0% | 97.2% | 4.0% | 2812 / 118 / 0 / 2070 |

| Model / feature set | Precision | Recall | F1 | ROC-AUC | 5-fold CV F1 |
|---|---|---|---|---|---|
| RandomForest/pattern | 94.6% | 72.0% | 81.8% | 0.8850 | 82.3% |
| XGBoost/pattern | 94.2% | 72.5% | 81.9% | 0.8863 | 82.3% |
| RandomForest/records | 98.3% | 99.4% | 98.8% | 0.9996 | 98.9% |
| XGBoost/records | 99.1% | 99.3% | 99.2% | 0.9998 | 99.1% |
| RandomForest/full | 100.0% | 100.0% | 100.0% | 1.0000 | 99.9% |
| XGBoost/full | 100.0% | 100.0% | 100.0% | 1.0000 | 100.0% |

**How to read this honestly**
- `fraud_labels.csv` is synthetic ground truth **derived from deterministic rules** over the same records. So rules recover it almost perfectly, the `full` set (which contains the rule signals) is 100% only because it copies the rules, and the near-perfect `records` score mostly reflects that record-comparison features encode the same checks.
- The meaningful ML-only number is the `pattern` set (F1 ≈ 82%): from history/timing/area patterns alone the model finds about 72% of labelled cases with 94% precision.
- On these labels the hybrid does **not** beat rules-only (its extra false positives come from the ML half). The value of ML here is prioritisation and explanation, not a better yes/no than the rules. On real data without rule-derived labels this comparison would need to be repeated.
- Metrics are saved to `backend/ml/models/metrics.json` and shown on the Analytics page.

## 17. Investigation Priority Score and Explainable AI
`score = min(70, Σ rule weights) + 30 × ML score` — weights in `app/config.py` (double-sale 30, over-transfer 25, chain break 20, registration 15, mutation 15, temporal 10, rapid 12/6).
Levels: 0–29 Low · 30–59 Medium · 60–79 High · 80–100 Critical. Current distribution over the 25,000 transactions: Low 14,726 · Medium 6,863 · High 2,701 · Critical 710.
SHAP (TreeExplainer on the deployed XGBoost model) gives per-transaction factors, shown with plain-language sentences such as "The recorded seller does not match the recorded previous owner."

## Phase-1 checklist
Status of every Phase-1 item with the file that proves it: `docs/PHASE1_CHECKLIST.md`. Concept note draft: `docs/ConceptNote.pdf`.

## 18. Demo workflow (judge demo)
A 3-minute narration script is in `docs/DEMO_SCRIPT.md`.

Home → **View Demo** picks a showcase parcel from the real data and shows a 10-step bar:
search parcel → overview → ownership history → transaction graph → detect suspicious transaction → integrity alert → registration vs mutation → AI analysis → evidence → generate report.

## 19. Limitations
- Labels are rule-derived (see above); ML metrics do not prove real-world fraud detection ability.
- Rapid-transfer, over-transfer etc. are anomaly signals only; synthetic data may contain patterns real data does not.
- Ownership continuity uses the recorded `previous_owner_id`; the synthetic data does not form a perfectly continuous buyer→seller chain, so chain-by-previous-buyer was not used as an alert.
- Missing registration/mutation is flagged for every transaction status (matches the provided labels), including cancelled ones.
- Basic parcel diagram only (no GIS). No login/roles (the SRS lists JWT auth; deferred, see Future scope).

## 20. Legal boundary
See the top of this file. Reports and UI never state legal guilt; every alert ends in **Human Review Required**.

## 21. Future scope
JWT login with roles and audit log, PostgreSQL/Neo4j for scale, GIS/cadastral map integration, real government API integration, citizen pre-purchase check, Bangla UI.

---
## Rule-book items
**Data sources:** synthetic datasets created by the team for LandTech 2026 (no real personal data, no scraping).
**Open-source libraries:** FastAPI, SQLAlchemy, pandas, NumPy, scikit-learn, XGBoost, SHAP, NetworkX, ReportLab, joblib, React, Vite, Tailwind CSS, React Router, Recharts, React Flow, Lucide.
**AI tool disclosure:** Claude (Anthropic) was used as an AI coding assistant to design and write the code, tests and documentation in this repository. Both student members must be able to explain the code (see `docs/METHODOLOGY.md`).
**Changes since Round 1:** _(fill in before the Final Round)_
