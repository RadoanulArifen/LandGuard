"""Central configuration. Everything has a sensible default, so no .env is required."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:  # dotenv is optional
    pass

BASE_DIR = Path(__file__).resolve().parent.parent          # .../backend
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
MODEL_DIR = BASE_DIR / "ml" / "models"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'landguard.db'}")
if DATABASE_URL.startswith("sqlite:///") and not DATABASE_URL.startswith("sqlite:////"):
    # make a relative sqlite path relative to backend/
    DATABASE_URL = "sqlite:///" + str((BASE_DIR / DATABASE_URL.replace("sqlite:///", "")).resolve())
CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
).split(",") if o.strip()]

CSV_FILES = ["parcels", "owners", "transactions", "registrations", "mutations", "fraud_labels"]

# ---- Detection thresholds (configurable) ----
AREA_TOLERANCE = 0.01          # decimals; differences up to this are treated as equal
SHARE_TOLERANCE = 0.01         # percent points
RAPID_STRONG_DAYS = 7          # 1-7 days  => strong signal
RAPID_MODERATE_DAYS = 30       # 8-30 days => moderate signal

# ---- Investigation Priority Score (0-100) ----
# rule evidence contributes up to RULE_CAP points, ML adds up to ML_MAX points.
RULE_CAP = 70.0
ML_MAX = 30.0
RULE_WEIGHTS = {
    "double_sale": 30.0,
    "over_transfer": 25.0,
    "ownership_chain_break": 20.0,
    "registration_mismatch": 15.0,
    "mutation_mismatch": 15.0,
    "temporal_inconsistency": 10.0,
    "rapid_transfer_strong": 12.0,
    "rapid_transfer_moderate": 6.0,
}
LEVELS = [(80, "Critical"), (60, "High"), (30, "Medium"), (0, "Low")]


def level_for(score: float) -> str:
    for low, name in LEVELS:
        if score >= low:
            return name
    return "Low"
