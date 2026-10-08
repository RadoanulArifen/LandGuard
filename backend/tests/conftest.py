import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.detection.engine import build_context  # noqa: E402

T_COLS = ["transaction_id", "parcel_id", "seller_id", "buyer_id", "transaction_type", "transaction_date",
          "transferred_area_decimal", "seller_share_before", "transferred_share", "buyer_share_after",
          "seller_share_after", "transaction_value_bdt", "transaction_status", "previous_owner_id",
          "ownership_sequence", "days_since_previous_transfer"]


def tx(tid, seller, buyer, date="2020-01-01", share=100.0, before=100.0, area=10.0, prev=None, days=None, seq=1, status="Completed"):
    return dict(transaction_id=tid, parcel_id="P-000001", seller_id=seller, buyer_id=buyer, transaction_type="Sale",
                transaction_date=date, transferred_area_decimal=area, seller_share_before=before, transferred_share=share,
                buyer_share_after=share, seller_share_after=max(before - share, 0), transaction_value_bdt=100000,
                transaction_status=status, previous_owner_id=prev or seller, ownership_sequence=seq,
                days_since_previous_transfer=days)


def reg(tid, seller, buyer, date="2020-01-10", area=10.0, typ="Sale"):
    return dict(registration_id="R-" + tid[2:], transaction_id=tid, parcel_id="P-000001", seller_id=seller, buyer_id=buyer,
                registered_area_decimal=area, registration_date=date, registration_status="Registered",
                registration_office_code="REG-001", deed_reference="DEED-2020-000001", registration_type=typ,
                registration_fee_bdt=1, verification_status="Verified", registration_delay_days=9)


def mut(tid, prev, new, date="2020-02-01", area=10.0, share=100.0, typ="Sale"):
    return dict(mutation_id="M-" + tid[2:], registration_id="R-" + tid[2:], transaction_id=tid, parcel_id="P-000001",
                previous_owner_id=prev, new_owner_id=new, mutated_area_decimal=area, previous_owner_share=0.0,
                mutated_owner_share=share, mutation_date=date, mutation_status="Completed", mutation_type=typ,
                mutation_office_code="MUT-001", mutation_reference="MUTREF-2020-000001", mutation_delay_days=22,
                verification_status="Verified")


def make_ctx(txs, regs=None, muts=None, total_area=10.0):
    T = pd.DataFrame(txs)
    R = pd.DataFrame(regs or [], columns=list(reg("T-000001", "a", "b").keys()))
    M = pd.DataFrame(muts or [], columns=list(mut("T-000001", "a", "b").keys()))
    P = pd.DataFrame([dict(parcel_id="P-000001", total_area_decimal=total_area, district="D", upazila="U", mouza="M")])
    return build_context(T, R, M, P)


@pytest.fixture
def helpers():
    return dict(tx=tx, reg=reg, mut=mut, make_ctx=make_ctx)
