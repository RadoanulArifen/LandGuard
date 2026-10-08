# LandGuard — 3-minute demo script (Round 1 video / Final 5-minute pitch)

Start: backend and frontend running, browser at http://localhost:5173. Use **View Demo** on the home page so the 10-step bar guides you.
Both students should speak. Keep the wording neutral: "potential inconsistency", "human review required" — never "fraud confirmed".

| Time | Screen | Say |
|---|---|---|
| 0:00 | Home | "Land disputes in Bangladesh often start with records that disagree. LandGuard adds an integrity layer on top of existing registration and mutation records." |
| 0:20 | Dashboard | "25,000 synthetic transactions analysed. These numbers come live from the database, not from slides." |
| 0:35 | Investigate → search a parcel | "An officer searches by district, khatian, dag or parcel ID." |
| 0:50 | Parcel overview | "One unified profile: owner, area, registration and mutation status, and an integrity status." |
| 1:05 | Ownership history | "The chronological chain, rebuilt from transactions." |
| 1:20 | Transaction graph | "Owner to owner, one edge per transaction. Click a label to see the transaction. Red = high-priority transfer." |
| 1:40 | Alerts (parcel tab) → Evidence | "Each alert says what was found, which records are responsible, and shows the numbers." |
| 2:05 | Registration vs Mutation | "Side-by-side records. Red fields are the mismatches." |
| 2:25 | AI Analysis | "A local XGBoost model plus rule evidence gives an Investigation Priority Score — not a fraud probability. SHAP shows the factors in plain language." |
| 2:45 | Report | "One click produces a PDF report. The recommendation is always Human Review Required." |
| 2:55 | Close | "Decision-support for officials: explainable, offline, no external AI." |

## Questions to be ready for
- **Why is ML accuracy so high?** The provided labels are rule-derived, so rules recover them almost perfectly; the ML-only (pattern features) F1 is the honest number. See README section 16.
- **Does it say who committed fraud?** No. It prioritises records for human review.
- **What data?** Synthetic only — no real names, NID, phone or land records.
