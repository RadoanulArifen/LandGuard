"""Generate docs/ConceptNote.pdf (max 4 pages, Round 1 requirement). Numbers are read from real result files.

Run:  python scripts/make_concept_note.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet  # noqa: E402
from reportlab.lib.units import mm  # noqa: E402
from reportlab.graphics.shapes import Drawing, Rect, String, Line  # noqa: E402
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle  # noqa: E402

from app.config import MODEL_DIR  # noqa: E402

OUT = Path(__file__).resolve().parents[2] / "docs" / "ConceptNote.pdf"
G = colors.HexColor("#14532d")
m = json.loads((MODEL_DIR / "metrics.json").read_text())
pc = lambda x: f"{x * 100:.1f}%"

ss = getSampleStyleSheet()
H1 = ParagraphStyle("h1", parent=ss["Title"], textColor=G, fontSize=19, alignment=0, spaceAfter=2)
H2 = ParagraphStyle("h2", parent=ss["Heading2"], textColor=G, fontSize=11.5, spaceBefore=9, spaceAfter=3)
B = ParagraphStyle("b", parent=ss["BodyText"], fontSize=9.2, leading=12.4)
SM = ParagraphStyle("sm", parent=B, fontSize=8, leading=10.5, textColor=colors.HexColor("#475569"))
BL = ParagraphStyle("bl", parent=B, leftIndent=11, bulletIndent=2, spaceAfter=1.5)
P = lambda t, st=B: Paragraph(t, st)
bullets = lambda items: [Paragraph(i, BL, bulletText="•") for i in items]


CELL = ParagraphStyle("cell", parent=B, fontSize=8.3, leading=10.5)
CELLH = ParagraphStyle("cellh", parent=CELL, textColor=colors.white, fontName="Helvetica-Bold")


def table(rows, widths, head=True):
    rows = [[Paragraph(str(c), CELLH if (head and i == 0) else CELL) if isinstance(c, str) else c for c in r] for i, r in enumerate(rows)]
    t = Table(rows, colWidths=widths, repeatRows=1 if head else 0)
    st = [("FONTSIZE", (0, 0), (-1, -1), 8.3), ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
          ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]
    if head:
        st += [("BACKGROUND", (0, 0), (-1, 0), G), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold")]
    t.setStyle(TableStyle(st))
    return t


def architecture():
    d = Drawing(480, 118)
    boxes = [(0, "React + Vite\nTailwind, React Flow,\nRecharts"), (125, "FastAPI REST\n(Python)"), (250, "SQLite + SQLAlchemy\n6 linked tables"), (375, "Human officer\nreview & decision")]
    for x, label in boxes:
        d.add(Rect(x, 62, 105, 48, rx=6, ry=6, fillColor=colors.HexColor("#ecfdf5"), strokeColor=G))
        for i, line in enumerate(label.split("\n")):
            d.add(String(x + 52, 96 - i * 11, line, fontSize=7.5, textAnchor="middle", fillColor=colors.HexColor("#0f172a")))
    for x in (105, 230, 355):
        d.add(Line(x, 86, x + 20, 86, strokeColor=G))
    sub = [(95, "Rule engine\n7 detectors"), (205, "NetworkX\nownership graph"), (315, "XGBoost / RF\n+ SHAP"), (415, "Priority Score\n0-100 + PDF")]
    for x, label in sub:
        d.add(Rect(x - 48, 4, 96, 36, rx=5, ry=5, fillColor=colors.white, strokeColor=colors.HexColor("#64748b")))
        for i, line in enumerate(label.split("\n")):
            d.add(String(x, 26 - i * 11, line, fontSize=7.3, textAnchor="middle"))
    d.add(Line(180, 62, 150, 40, strokeColor=colors.HexColor("#94a3b8")))
    d.add(Line(180, 62, 205, 40, strokeColor=colors.HexColor("#94a3b8")))
    d.add(Line(190, 62, 315, 40, strokeColor=colors.HexColor("#94a3b8")))
    return d


def footer(c, doc):
    c.saveState(); c.setFont("Helvetica", 7.5); c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(16 * mm, 9 * mm, "LandGuard — LandTech 2026 Concept Note — P3 Fraud & Double-Selling Detection")
    c.drawRightString(A4[0] - 16 * mm, 9 * mm, f"Page {doc.page}"); c.restoreState()


f = []
f.append(P("LandGuard", H1))
f.append(P("<b>Explainable Land Transaction Integrity &amp; Fraud Detection Engine</b>", ParagraphStyle("s", parent=B, fontSize=11)))
f.append(P("LandTech 2026 · Track: Digital Land Records, Verification &amp; Digitization · <b>Problem statement chosen: P3 — Fraud &amp; Double-Selling Detection</b>", SM))

f.append(P("1. The problem in the Bangladesh context", H2))
f.append(P("Land disputes are among the most common civil cases in Bangladesh. Many trace back to records that disagree: a deed registered at the "
           "sub-registry office does not match the mutation recorded at the AC Land office; the same interest appears to be sold to more than one buyer; "
           "a seller transfers more than the share recorded in their name; or a parcel changes hands again within days. Each record can look valid on its own — "
           "the inconsistency only appears when the records are read <i>together</i>, which is slow and manual for an investigating officer."))

f.append(P("2. Proposed solution", H2))
f.append(P("Government systems maintain the records. <b>LandGuard adds an integrity-analysis layer</b> that checks whether linked records make sense together. "
           "It links parcel, owner, transaction, registration and mutation records into a time-aware ownership graph, runs seven deterministic checks, "
           "adds a machine-learning model to prioritise unusual cases, and shows plain-language evidence so an officer can decide where to look first."))
f.append(table([["Check", "What it looks for"],
                ["Double-sale", "A seller transfers again after an earlier transaction already transferred their entire interest in the parcel (normal chains A→B→C are not flagged)"],
                ["Over-transfer", "Transferred share or area is larger than the seller's recorded share / controlled area"],
                ["Rapid transfer", "Parcel transferred again within 7 days (strong) or 8–30 days (moderate) — an anomaly signal, not proof"],
                ["Ownership chain break", "Recorded seller differs from the recorded previous owner"],
                ["Registration / mutation mismatch", "Missing record, or buyer, seller, area, type or date disagree between transaction, registration and mutation"],
                ["Temporal inconsistency", "Dates not in the order transaction ≤ registration ≤ mutation"]], [40 * mm, 134 * mm]))
f.append(Spacer(1, 4))
f.append(P("<b>Legal boundary.</b> LandGuard is decision-support only. It never states that fraud is confirmed or who legally owns land. It outputs an "
           "<b>Investigation Priority Score (0–100)</b> — Low, Medium, High, Critical — not a fraud probability, and every alert ends in <b>Human Review Required</b>."))

f.append(P("3. System architecture and technology stack", H2))
f.append(architecture())
f.append(table([["Layer", "Technology (all open-source, runs offline on a laptop, no Docker)"],
                ["Frontend", "React, Vite, JavaScript, Tailwind CSS, React Router, Recharts, React Flow, Lucide icons"],
                ["Backend", "Python, FastAPI, Uvicorn, Pydantic, SQLAlchemy, Pandas, NumPy"],
                ["Database", "SQLite with primary keys, foreign keys and search indexes"],
                ["Graph / ML / XAI", "NetworkX; scikit-learn Random Forest and XGBoost; SHAP for explanations; joblib"],
                ["Reports", "ReportLab (PDF investigation report)"]], [32 * mm, 142 * mm]))
f.append(PageBreak())

f.append(P("4. Key features", H2))
f += bullets(["<b>Parcel search</b> by district, upazila, mouza, khatian, dag or parcel ID; parcel profile with current owner and integrity status.",
              "<b>Ownership history</b> and <b>transaction timeline</b> rebuilt from the linked records.",
              "<b>Transaction graph</b> (React Flow): owner → transaction → owner, clickable, colour-coded for multiple transfers and conflicts.",
              "<b>Integrity alerts</b> with evidence tables, e.g. recorded share vs transferred amount and the potential excess.",
              "<b>Registration vs mutation comparison</b> side by side with mismatches highlighted.",
              "<b>AI analysis</b>: Investigation Priority Score with SHAP-based top contributing factors and a plain-language explanation.",
              "<b>Investigation report</b> (PDF) and a guided <b>judge demo</b> mode. Dashboard and analytics are computed live from the database."])

f.append(P("5. Data, method and results so far", H2))
f.append(P("<b>Data.</b> Six synthetic datasets created by the team (no real personal data, no scraping): 15,000 parcels, 11,500 owners, 25,000 transactions, "
           "23,370 registrations, 20,632 mutations and 25,000 label rows. A validation script checks IDs, foreign keys, dates, shares and areas before import."))
f.append(P("<b>Method.</b> Rules give deterministic evidence (up to 70 points); an XGBoost model adds an anomaly score (up to 30 points). Labels are never used as model "
           "inputs, and stored ML scores are out-of-fold. Results on a stratified 80/20 test split (5,000 transactions):"))
rows = [["Approach", "Precision", "Recall", "F1"]]
for name, k in [("Rules only", "baseline_rules_only"), ("ML only (history/timing features)", "baseline_ml_only"), ("Hybrid (rules OR ML)", "hybrid_rules_plus_ml")]:
    v = m[k]; rows.append([name, pc(v["precision"]), pc(v["recall"]), pc(v["f1"])])
f.append(table(rows, [80 * mm, 30 * mm, 30 * mm, 30 * mm]))
f.append(Spacer(1, 3))
f.append(P("<b>Honest reading.</b> The provided labels were generated from deterministic rules over the same records, so rules recover them almost perfectly and the "
           "hybrid does not beat rules-only here. The value of ML in this prototype is prioritisation and explanation; the ML-only row (no record-comparison features) "
           "is the fairer measure of what a model learns from patterns alone. Performance on real government data is untested and must be re-evaluated."))

f.append(P("6. Plan for countrywide implementation", H2))
f.append(table([["Phase", "Scope"],
                ["1. Pilot", "One district: import registration (sub-registry) and mutation (AC Land) exports; officers review the prioritised list; collect feedback and false positives."],
                ["2. Integration", "Read-only connection to e-Mutation / land-record systems; PostgreSQL for scale; login with roles and an audit log (JWT)."],
                ["3. Scale", "Division and national rollout, a graph database for cross-district chains, GIS / cadastral maps, Bangla interface."],
                ["4. Citizens", "A 'check before you buy' view (P5) built on the same integrity checks."]], [28 * mm, 146 * mm]))
f.append(P("Privacy and safety: access is for authorised officers; the system flags records for review and never changes or approves a registration or mutation.", SM))

f.append(P("7. Team and mentors", H2))
f.append(table([["Role", "Name", "Affiliation / ID"],
                ["Student 1 (Team Leader)", "", ""], ["Student 2", "", ""], ["Faculty mentor", "", ""], ["Industry mentor", "", ""]], [50 * mm, 62 * mm, 62 * mm]))
f.append(P("<i>Fill in the names and DIU IDs before submission.</i>", SM))

f.append(P("8. Limitations and AI tool disclosure", H2))
f += bullets(["Synthetic data and rule-derived labels (see section 5); no GIS; no login in this prototype.",
              "AI tools: Claude (Anthropic) was used as a coding assistant for code, tests and documentation, as disclosed in the repository README. "
              "Both student members must be able to explain the code and design."])

OUT.parent.mkdir(parents=True, exist_ok=True)
SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=14 * mm, bottomMargin=16 * mm,
                  title="LandGuard Concept Note").build(f, onFirstPage=footer, onLaterPages=footer)
print("Wrote", OUT)
