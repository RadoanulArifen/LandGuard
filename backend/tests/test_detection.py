from app import config as C
from app.detection import engine as E
from app.services.scoring import priority_level, priority_score
from tests.conftest import make_ctx, mut, reg, tx


def test_normal_chain_is_not_double_sale():
    ctx = make_ctx([tx("T-000001", "A", "B", "2010-01-01"), tx("T-000002", "B", "C", "2015-01-01", prev="B", seq=2, days=1800),
                    tx("T-000003", "C", "D", "2020-01-01", prev="C", seq=3, days=1800)])
    flag, _ = E.detect_double_sale(ctx)
    assert flag.sum() == 0


def test_double_sale_detected():
    ctx = make_ctx([tx("T-000001", "A", "B", "2010-01-01"), tx("T-000002", "A", "C", "2012-01-01", seq=2, days=700)])
    flag, ref = E.detect_double_sale(ctx)
    assert list(flag) == [0, 1] and ref.iloc[1] == "T-000001"


def test_partial_sales_are_not_double_sale():
    ctx = make_ctx([tx("T-000001", "A", "B", "2010-01-01", share=40), tx("T-000002", "A", "C", "2012-01-01", share=60, before=60, seq=2, days=700)])
    assert E.detect_double_sale(ctx)[0].sum() == 0


def test_over_transfer_by_share_and_area():
    ctx = make_ctx([tx("T-000001", "A", "B", share=100, before=60), tx("T-000002", "B", "C", "2021-01-01", share=100, before=100, area=15.0, seq=2)])
    assert list(E.detect_over_transfer(ctx)) == [1, 1]        # 100>60 share ; 15 decimal > 10 decimal parcel
    ok = make_ctx([tx("T-000001", "A", "B", share=60, before=60, area=6.0)])
    assert E.detect_over_transfer(ok).sum() == 0


def test_rapid_transfer_thresholds():
    ctx = make_ctx([tx("T-000001", "A", "B", days=3), tx("T-000002", "B", "C", "2020-02-01", days=20, seq=2),
                    tx("T-000003", "C", "D", "2021-02-01", days=400, seq=3), tx("T-000004", "D", "E", "2022-02-01", seq=4)])
    assert list(E.detect_rapid_transfer(ctx)) == [2, 1, 0, 0]


def test_ownership_chain_break():
    ctx = make_ctx([tx("T-000001", "A", "B", prev="A"), tx("T-000002", "X", "C", "2021-01-01", prev="B", seq=2)])
    assert list(E.detect_chain_break(ctx)) == [0, 1]


def test_registration_mismatch_types():
    t = [tx("T-000001", "A", "B"), tx("T-000002", "A", "B", "2021-01-01"), tx("T-000003", "A", "B", "2022-01-01"), tx("T-000004", "A", "B", "2023-01-01")]
    r = [reg("T-000001", "A", "B"), reg("T-000002", "A", "Z", "2021-01-10"), reg("T-000003", "A", "B", "2022-01-10", area=7.0)]
    ctx = make_ctx(t, r)
    assert list(E.detect_registration_mismatch(ctx)) == [0, 1, 1, 1]       # ok, buyer, area, missing
    iss = E.registration_issues(ctx)
    assert iss["buyer_mismatch"].iloc[1] and iss["area_mismatch"].iloc[2] and iss["missing_registration"].iloc[3]


def test_mutation_mismatch_types():
    t = [tx("T-000001", "A", "B"), tx("T-000002", "A", "B", "2021-01-01"), tx("T-000003", "A", "B", "2022-01-01")]
    r = [reg(x, "A", "B", d) for x, d in [("T-000001", "2020-01-10"), ("T-000002", "2021-01-10"), ("T-000003", "2022-01-10")]]
    m = [mut("T-000001", "A", "B"), mut("T-000002", "A", "Nayeem", "2021-02-01")]
    ctx = make_ctx(t, r, m)
    assert list(E.detect_mutation_mismatch(ctx)) == [0, 1, 1]               # ok, new owner differs, missing mutation


def test_temporal_inconsistency():
    t = [tx("T-000001", "A", "B", "2020-01-01"), tx("T-000002", "A", "B", "2021-01-01")]
    r = [reg("T-000001", "A", "B", "2019-12-01"), reg("T-000002", "A", "B", "2021-01-10")]
    m = [mut("T-000001", "A", "B", "2020-02-01"), mut("T-000002", "A", "B", "2021-01-05")]
    assert list(E.detect_temporal(make_ctx(t, r, m))) == [1, 1]            # reg<txn ; mut<reg


def test_run_rules_and_evidence_wording():
    ctx = make_ctx([tx("T-000001", "A", "B", share=100, before=60)], [reg("T-000001", "A", "Z")])
    sig = E.run_rules(ctx)
    ev = E.build_evidence(ctx.iloc[0], sig.iloc[0])
    text = " ".join(e["title"] + e["message"] for e in ev).lower()
    assert sig.signal_count.iloc[0] >= 2 and "fraud" not in text and "guilty" not in text


def test_priority_score_levels():
    assert priority_level(0) == "Low" and priority_level(29.9) == "Low" and priority_level(30) == "Medium"
    assert priority_level(60) == "High" and priority_level(80) == "Critical"
    assert priority_score(70, 1.0) == 100.0 and priority_score(0, 0.0) == 0.0
    assert priority_score(500, 5) <= 100.0 and C.level_for(100) == "Critical"
