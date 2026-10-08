#!/usr/bin/env bash
# One-time setup for LandGuard on Ubuntu. No Docker. Takes about 3-5 minutes.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> [1/6] Backend: Python virtual environment"
cd "$ROOT/backend"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt

echo "==> [2/6] Validate the six CSV datasets"
python scripts/validate_data.py

echo "==> [3/6] Create the SQLite database and import the data"
python scripts/import_data.py --reset

echo "==> [4/6] Train and evaluate the ML models (real metrics, ~2 minutes)"
python -m ml.train

echo "==> [5/6] Run the detection engine + scoring and store the results"
python scripts/run_analysis.py

echo "==> [6/6] Frontend: npm install"
cd "$ROOT/frontend"
npm install --no-audit --no-fund

echo
echo "Setup complete.  Start the app with:"
echo "  Terminal 1:  ./run_backend.sh"
echo "  Terminal 2:  ./run_frontend.sh"
echo "Then open http://localhost:5173"
