"""Investigation Priority Score (0-100).  NOT a fraud probability.

score = min(RULE_CAP, sum of rule weights)  +  ML_MAX * ml_score

  * rule evidence (deterministic)  : up to 70 points  (each signal has a weight, see config.RULE_WEIGHTS)
  * ML anomaly score (0..1)        : up to 30 points
  * more supporting evidence items => more rule points, so evidence count is built in.

Levels: 0-29 Low, 30-59 Medium, 60-79 High, 80-100 Critical.
"""
from app import config as C


def priority_score(rule_points: float, ml_score: float) -> float:
    ml = min(max(float(ml_score), 0.0), 1.0)
    return round(min(100.0, min(C.RULE_CAP, float(rule_points)) + C.ML_MAX * ml), 1)


def priority_level(score: float) -> str:
    return C.level_for(score)


def parcel_status(max_level: str | None) -> str:
    """Parcel-level integrity wording used in the UI."""
    return {"Critical": "High Concern", "High": "High Concern", "Medium": "Review Required"}.get(max_level or "", "Consistent")


def txn_status(level: str) -> str:
    return {"Critical": "High Concern", "High": "High Concern", "Medium": "Review Required"}.get(level, "Consistent")
