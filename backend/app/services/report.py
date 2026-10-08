"""Investigation report (PDF) with ReportLab. Neutral wording only - never states legal guilt."""
from __future__ import annotations

import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

GREEN = colors.HexColor("#14532d")
LIGHT = colors.HexColor("#ecfdf5")
RED = colors.HexColor("#b91c1c")


def _tbl(data, widths=None, header=True):
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    st = [("FONTSIZE", (0, 0), (-1, -1), 8), ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
          ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]
    if header:
        st += [("BACKGROUND", (0, 0), (-1, 0), GREEN), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
               ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold")]
    t.setStyle(TableStyle(st))
    return t


def build_pdf(ov: dict, history: list[dict], timeline: list[dict], focus: dict, alerts: list[dict],
              explanation: dict | None, comparison: dict | None) -> bytes:
    """ov=overview, focus=investigation summary of the selected transaction."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
                            title=f"LandGuard Investigation Report {ov['parcel_id']}")
    ss = getSampleStyleSheet()
    H1 = ParagraphStyle("h1", parent=ss["Title"], textColor=GREEN, fontSize=18, alignment=0, spaceAfter=2)
    H2 = ParagraphStyle("h2", parent=ss["Heading2"], textColor=GREEN, fontSize=11, spaceBefore=10, spaceAfter=4)
    B = ParagraphStyle("b", parent=ss["BodyText"], fontSize=8.5, leading=11)
    SM = ParagraphStyle("sm", parent=B, fontSize=7.5, textColor=colors.HexColor("#475569"))
    P = lambda t, st=B: Paragraph(str(t).replace("&", "&amp;").replace("<", "&lt;"), st)
    f = []
    f.append(Paragraph("LandGuard Investigation Report", H1))
    f.append(P(f"Generated {datetime.now():%d %b %Y %H:%M} · Synthetic hackathon data · Decision-support only", SM))
    f.append(Spacer(1, 4))
    f.append(P("This report lists potential inconsistencies found by automated checks. It does not determine legal ownership "
               "and does not state that any person or transaction is fraudulent. Final decisions rest with authorised human officials.", SM))

    f.append(Paragraph("1. Parcel information", H2))
    f.append(_tbl([["Parcel ID", ov["parcel_id"], "Integrity status", ov["integrity_status"]],
                   ["District / Upazila", f"{ov['district']} / {ov['upazila']}", "Mouza", ov["mouza"]],
                   ["Khatian / Dag", f"{ov['khatian_no']} / {ov['dag_no']}", "Total area", f"{ov['total_area_decimal']:g} decimal"],
                   ["Current owner", f"{ov['current_owner_name']} ({ov['current_owner_id']})", "Recorded share",
                    "n/a" if ov["recorded_share"] is None else f"{ov['recorded_share']:g}%"],
                   ["Ownership status", ov["ownership_status"], "Registration / Mutation", f"{ov['registration_status']} / {ov['mutation_status']}"]],
                  [30 * mm, 55 * mm, 35 * mm, 52 * mm], header=False))

    f.append(Paragraph("2. Investigation priority", H2))
    f.append(P(f"Transaction {focus['transaction_id']}: Investigation Priority Score {focus['priority_score']:.0f} / 100 "
               f"({focus['priority_level']}). This is a prioritisation score for human review, not a fraud probability."))
    f.append(P("Recommended action: Human Review Required", ParagraphStyle("r", parent=B, textColor=RED, fontName="Helvetica-Bold")))

    f.append(Paragraph("3. Ownership history", H2))
    rows = [["Date", "Owner", "From", "Area", "Share %", "Txn", "Status"]]
    for e in history:
        rows.append([e["date"], e["owner_name"], e.get("from_name", "—"), e.get("area", "—"), e.get("share", "—"),
                     e.get("transaction_id", "—"), e.get("transaction_status", "Original")])
    f.append(_tbl(rows, [22 * mm, 38 * mm, 38 * mm, 15 * mm, 15 * mm, 24 * mm, 25 * mm]))

    f.append(Paragraph("4. Transaction timeline (transaction, registration, mutation)", H2))
    rows = [["Date", "Event", "Parties", "Detail", "Flag"]]
    for e in timeline[:40]:
        rows.append([e["date"], e["kind"], Paragraph(e["label"], B), Paragraph(e["detail"], SM), "review" if e["conflict"] else ""])
    f.append(_tbl(rows, [22 * mm, 22 * mm, 50 * mm, 62 * mm, 14 * mm]))

    if comparison:
        f.append(Paragraph(f"5. Registration vs mutation — {focus['transaction_id']}", H2))
        rows = [["Field", "Registration", "Mutation", "Result"]]
        for r in comparison["rows"]:
            rows.append([r["field"], Paragraph(str(r["registration"]), SM), Paragraph(str(r["mutation"]), SM),
                         "—" if r["match"] is None else ("match" if r["match"] else "MISMATCH")])
        f.append(_tbl(rows, [38 * mm, 55 * mm, 55 * mm, 22 * mm]))

    f.append(Paragraph("6. Detected issues and evidence", H2))
    if not alerts:
        f.append(P("No integrity signals were raised for this parcel."))
    for a in alerts:
        f.append(P(f"{a['transaction_id']} · {a['priority_level']} ({a['priority_score']:.0f})", ParagraphStyle("t", parent=B, fontName="Helvetica-Bold")))
        for e in a["evidence"]:
            f.append(P(f"• {e['title']}: {e['message']}"))
        f.append(Spacer(1, 3))

    if explanation and explanation.get("increasing"):
        f.append(Paragraph(f"7. AI explanation — {focus['transaction_id']}", H2))
        rows = [["Contributing factor", "SHAP", "Plain-language note"]]
        for x in explanation["increasing"]:
            rows.append([Paragraph(x["label"], SM), f"{x['shap_value']:+.2f}", Paragraph(x["explanation"], SM)])
        f.append(_tbl(rows, [50 * mm, 15 * mm, 100 * mm]))
        f.append(P(explanation["note"], SM))

    f.append(Paragraph("8. Recommendation", H2))
    f.append(P("Human Review Required. An authorised officer should verify the source documents (deed, mutation file, khatian) "
               "before any administrative decision is taken."))
    doc.build(f)
    return buf.getvalue()
