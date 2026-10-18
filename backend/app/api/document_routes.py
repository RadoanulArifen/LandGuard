"""Isolated document verification endpoints. Uploads are processed in memory only."""
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import text
from app.database.db import engine
from app.services.document_verification import MAX_BYTES, extract_document

router = APIRouter(prefix="/api/document", tags=["document verification"])

@router.post("/extract")
async def extract(request: Request):
    auth = request.headers.get("authorization", "")
    from app.api.routes import _current_user
    _current_user(auth)
    try:
        form = await request.form()
        upload = form.get("file")
        if upload is None or not hasattr(upload, "read"):
            raise ValueError("দয়া করে একটি দলিল নির্বাচন করুন।")
        data = await upload.read(MAX_BYTES + 1)
        return extract_document(upload.filename or "document", upload.content_type or "", data)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    except Exception as exc:
        if "multipart" in str(exc).lower():
            raise HTTPException(503, "ফাইল আপলোড সেবা প্রস্তুত নয়। সার্ভারের নির্ভরতা ইনস্টল করুন।")
        raise HTTPException(422, "দলিলটি প্রক্রিয়া করা যায়নি। পরিষ্কার ফাইল দিয়ে আবার চেষ্টা করুন।")

@router.post("/verify")
def verify(body: dict, request: Request):
    from app.api.routes import _current_user
    _current_user(request.headers.get("authorization"))
    fields = body.get("fields") or {}
    clauses, params = [], {}
    for key, column in (("district", "district"), ("upazila", "upazila"), ("mouza", "mouza"), ("khatian", "khatian_no"), ("dag", "dag_no")):
        value = str((fields.get(key) or "").strip())
        if value:
            clauses.append(f"p.{column}=:v_{key}")
            params[f"v_{key}"] = value
    if not clauses:
        return {"matches": [], "message": "মিল খোঁজার জন্য অন্তত খতিয়ান, দাগ বা অবস্থানের তথ্য দিন।"}
    # Prioritize strong parcel identifiers. Location-only matches are useful candidates, not confirmation.
    order = "CASE WHEN p.khatian_no=:v_khatian THEN 0 ELSE 1 END, CASE WHEN p.dag_no=:v_dag THEN 0 ELSE 1 END" if "v_khatian" in params and "v_dag" in params else "p.parcel_id"
    with engine.connect() as con:
        rows = con.execute(text(f"""SELECT p.parcel_id,p.district,p.upazila,p.mouza,p.khatian_no,p.dag_no,p.total_area_decimal,
            o.synthetic_name current_owner_name,p.land_type FROM parcels p LEFT JOIN owners o ON o.owner_id=p.current_owner_id
            WHERE {' AND '.join(clauses)} ORDER BY {order} LIMIT 10"""), params).mappings().all()
    return {"matches": [dict(row) for row in rows], "multiple": len(rows) > 1}
