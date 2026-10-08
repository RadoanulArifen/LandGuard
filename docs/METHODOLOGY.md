# LandGuard methodology (for explaining the project to judges)

## 1. Data flow
CSV → `validate_data.py` (checks IDs, foreign keys, dates, shares, areas) → `import_data.py` (SQLite) → `detection/engine.py` (rules)
→ `ml/feature_engineering.py` → `ml/train.py` (models, metrics) → `scripts/run_analysis.py` (score + evidence stored in `analysis_results`) → API → React.

## 2. Why rules AND ML
Rules give deterministic, explainable evidence (about 70% of the score). ML finds unusual patterns and ranks cases (about 30%). Neither makes a legal decision.

## 3. Score
`Investigation Priority Score = min(70, sum of rule weights) + 30 x ML anomaly score`. It is a priority for human review, not a probability of fraud.

## 4. Features (see `FEATURE_DOCS` in `backend/ml/feature_engineering.py` for every one)
- Pattern: parcel/seller/buyer transaction counts, transfer frequency, days since previous transfer, average interval, area ratio, shares, ownership sequence,
  earlier sales by the same seller on the parcel, registration/mutation delay, record-present flags, value per decimal, type and status.
- Records: buyer/seller/type match flags, area/share differences, ownership-chain consistency, date gaps.
- Full (leakage demo only): the seven rule signals and their count.

## 5. Data-leakage controls
Target columns (`ground_truth_label`, `*_flag`, `anomaly_*`, `evidence_*`) are never model inputs (checked by `tests/test_ml.py`).
ML scores used in the product are out-of-fold. The `full` set is reported only to show that rule-derived labels can be copied.

## 6. Questions judges may ask
- *Why is accuracy not the headline?* Classes are imbalanced in real life; we report precision, recall, F1, FPR, ROC-AUC and the confusion matrix.
- *Is 99% real?* It is real on this synthetic data, but labels come from rules, so see README section 16 for how to interpret it.
- *Does it say fraud?* No. It says "Potential ... / Human Review Required".
