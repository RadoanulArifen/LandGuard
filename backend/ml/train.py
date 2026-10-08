"""Train, evaluate and save the LandGuard ML models.

Run from backend/:   python -m ml.train

Pipeline: load data -> rules -> features -> stratified 80/20 split -> train RF + XGBoost on three
feature sets -> evaluate (precision, recall, F1, ROC-AUC, confusion matrix, FPR) -> 5-fold CV ->
pick the best 'records' model -> out-of-fold scores for every transaction -> save model + metrics.
"""
import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sklearn.base import clone  # noqa: E402
from sklearn.ensemble import RandomForestClassifier  # noqa: E402
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split  # noqa: E402
from xgboost import XGBClassifier  # noqa: E402

from app.config import MODEL_DIR  # noqa: E402
from app.detection.engine import SIGNALS, build_context, run_rules  # noqa: E402
from app.services.data import load_frames  # noqa: E402
from ml.evaluate import compute_metrics  # noqa: E402
from ml.feature_engineering import FEATURE_DOCS, FEATURE_SETS, build_features  # noqa: E402

SEED = 42
DEPLOY_SET = "records"


def make_models():
    return {
        "RandomForest": RandomForestClassifier(n_estimators=250, min_samples_leaf=2, class_weight="balanced_subsample",
                                               n_jobs=-1, random_state=SEED),
        "XGBoost": XGBClassifier(n_estimators=300, max_depth=5, learning_rate=0.08, subsample=0.9, colsample_bytree=0.9,
                                 eval_metric="logloss", n_jobs=4, random_state=SEED, tree_method="hist"),
    }


def main():
    t0 = time.time()
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    fr = load_frames()
    ctx = build_context(fr["transactions"], fr["registrations"], fr["mutations"], fr["parcels"])
    sig = run_rules(ctx)
    X_all = build_features(ctx, sig)
    labels = fr["fraud_labels"].set_index("transaction_id")["ground_truth_label"]
    y = ctx["transaction_id"].map(labels).astype(int).values
    ids = ctx["transaction_id"].values
    print(f"Rows: {len(y)}  anomalous labels: {int(y.sum())} ({y.mean():.1%})")

    idx_tr, idx_te = train_test_split(np.arange(len(y)), test_size=0.2, stratify=y, random_state=SEED)
    report = {"n_rows": int(len(y)), "positive_rate": float(y.mean()), "train_rows": int(len(idx_tr)),
              "test_rows": int(len(idx_te)), "split": "stratified 80/20, random_state=42", "models": {}, "cv": {}}
    cv = StratifiedKFold(5, shuffle=True, random_state=SEED)
    fitted = {}
    for fs, cols in FEATURE_SETS.items():
        X = X_all[cols]
        for name, mdl in make_models().items():
            key = f"{name}/{fs}"
            m = clone(mdl).fit(X.iloc[idx_tr], y[idx_tr])
            prob = m.predict_proba(X.iloc[idx_te])[:, 1]
            met = compute_metrics(y[idx_te], (prob >= 0.5).astype(int), prob)
            oof = cross_val_predict(clone(mdl), X, y, cv=cv, method="predict_proba")[:, 1]
            cvm = compute_metrics(y, (oof >= 0.5).astype(int), oof)
            report["models"][key] = {"feature_set": fs, "n_features": len(cols), "test": met}
            report["cv"][key] = {k: cvm[k] for k in ("precision", "recall", "f1", "roc_auc", "false_positive_rate")}
            fitted[key] = (m, oof)
            print(f"{key:24s} test F1={met['f1']:.3f} P={met['precision']:.3f} R={met['recall']:.3f} AUC={met['roc_auc']:.3f} | 5-fold F1={cvm['f1']:.3f}")

    # ---- baselines on the SAME test split ----
    rule_any = (sig["signal_count"].values > 0).astype(int)
    report["baseline_rules_only"] = compute_metrics(y[idx_te], rule_any[idx_te], sig["rule_points"].values[idx_te])
    ml_only = max([k for k in report["models"] if k.endswith("/pattern")], key=lambda k: report["models"][k]["test"]["f1"])
    report["baseline_ml_only"] = {"model": ml_only, **report["models"][ml_only]["test"]}

    # ---- choose the deployed model (best F1 on the 'records' set) ----
    cand = [k for k in report["models"] if k.endswith(f"/{DEPLOY_SET}")]
    best = max(cand, key=lambda k: report["models"][k]["test"]["f1"])
    m_best, oof_best = fitted[best]
    hybrid_pred = ((rule_any[idx_te] == 1) | (m_best.predict_proba(X_all[FEATURE_SETS[DEPLOY_SET]].iloc[idx_te])[:, 1] >= 0.5)).astype(int)
    report["hybrid_rules_plus_ml"] = {"model": best, **compute_metrics(y[idx_te], hybrid_pred)}
    report["deployed_model"] = best
    report["deployed_feature_set"] = DEPLOY_SET

    # ---- final model on all data + out-of-fold scores for the stored analysis ----
    cols = FEATURE_SETS[DEPLOY_SET]
    final = clone(make_models()[best.split("/")[0]]).fit(X_all[cols], y)
    imp = pd.Series(final.feature_importances_, index=cols).sort_values(ascending=False)
    report["feature_importance_top15"] = {k: float(v) for k, v in imp.head(15).items()}
    report["feature_docs"] = {k: FEATURE_DOCS[k] for k in cols}
    report["notes"] = [
        "fraud_labels.csv is synthetic ground truth derived from deterministic rules over the same records.",
        "'pattern' = raw history/timing features only; 'records' adds record-comparison features; "
        "'full' adds the rule signals and is shown only to demonstrate label leakage.",
        "Stored ML scores are 5-fold out-of-fold predictions, so no transaction is scored by a model that saw its label.",
        "The Investigation Priority Score is NOT a fraud probability.",
    ]
    joblib.dump({"model": final, "features": cols, "name": best, "feature_set": DEPLOY_SET}, MODEL_DIR / "landguard_model.joblib")
    pd.DataFrame({"transaction_id": ids, "ml_score": oof_best}).to_csv(MODEL_DIR / "oof_scores.csv", index=False)
    (MODEL_DIR / "metrics.json").write_text(json.dumps(report, indent=2))
    print(f"\nDeployed model: {best}\nSaved to {MODEL_DIR}  ({time.time()-t0:.0f}s)")


if __name__ == "__main__":
    main()
