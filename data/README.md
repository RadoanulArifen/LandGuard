# data/

The six synthetic CSV files used by LandGuard live in **`backend/data/raw/`**:

`parcels.csv` · `owners.csv` · `transactions.csv` · `registrations.csv` · `mutations.csv` · `fraud_labels.csv`

They are loaded into SQLite (`backend/data/landguard.db`) by `python scripts/import_data.py --reset` (run from `backend/`).
All data is synthetic — no real names, NIDs, phone numbers or land records.
To use updated CSVs, replace the files in `backend/data/raw/` and run `./setup.sh` again.
