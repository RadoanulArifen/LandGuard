"""Load the five source tables (and labels) from SQLite into pandas."""
import pandas as pd

from app.database.db import engine


def load_frames() -> dict[str, pd.DataFrame]:
    names = ["parcels", "owners", "transactions", "registrations", "mutations", "fraud_labels"]
    with engine.connect() as con:
        return {n: pd.read_sql_table(n, con) for n in names}
