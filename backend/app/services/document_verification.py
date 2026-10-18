"""Temporary, review-first extraction for land documents. No OCR result is persisted."""
import io
import re

MAX_BYTES = 15 * 1024 * 1024
ALLOWED = {"application/pdf", "image/jpeg", "image/png"}

FIELDS = {
    "district": ("জেলা", r"(?:জেলা|District)\s*[:：-]?\s*([^\n,;]{2,50})"),
    "upazila": ("উপজেলা", r"(?:উপজেলা|থানা|Upazila)\s*[:：-]?\s*([^\n,;]{2,50})"),
    "mouza": ("মৌজা", r"(?:মৌজা|Mouza)\s*[:：-]?\s*([^\n,;]{2,60})"),
    "khatian": ("খতিয়ান নম্বর", r"(?:খতিয়ান(?:\s*(?:নং|নম্বর))?|Khatian(?:\s*(?:No\.?|Number))?)\s*[:：#-]?\s*([\w০-৯/-]{1,30})"),
    "dag": ("দাগ নম্বর", r"(?:দাগ(?:\s*(?:নং|নম্বর))?|Dag(?:\s*(?:No\.?|Number))?)\s*[:：#-]?\s*([\w০-৯/-]{1,30})"),
    "area": ("জমির পরিমাণ", r"(?:জমির\s*পরিমাণ|মোট\s*জমি|Area|Land\s*area)\s*[:：-]?\s*([\d০-৯.,]+\s*(?:একর|শতক|ডেসিমেল|decimal|acre)?)"),
    "land_class": ("জমির শ্রেণি", r"(?:জমির\s*শ্রেণি|শ্রেণি|Land\s*class)\s*[:：-]?\s*([^\n,;]{2,50})"),
    "owner": ("মালিকের নাম", r"(?:মালিক(?:ের)?\s*নাম|Owner(?:\s*name)?)\s*[:：-]?\s*([^\n,;]{2,80})"),
    "father_spouse": ("পিতা/স্বামীর নাম", r"(?:পিতা|স্বামী)(?:র)?\s*(?:ও\s*স্বামী)?\s*নাম\s*[:：-]?\s*([^\n,;]{2,80})"),
    "grantor": ("দাতা", r"(?:দাতা|বিক্রেতা|Grantor|Seller)\s*[:：-]?\s*([^\n,;]{2,80})"),
    "grantee": ("গ্রহীতা", r"(?:গ্রহীতা|ক্রেতা|Grantee|Buyer)\s*[:：-]?\s*([^\n,;]{2,80})"),
    "deed_no": ("দলিল নম্বর", r"(?:দলিল\s*(?:নং|নম্বর)|Deed\s*(?:No\.?|Number))\s*[:：#-]?\s*([\w০-৯/-]{1,40})"),
    "deed_date": ("দলিলের তারিখ", r"(?:দলিলের\s*তারিখ|তারিখ|Deed\s*date|Date)\s*[:：-]?\s*([\d০-৯./-]{4,20})"),
    "registration": ("রেজিস্ট্রেশন তথ্য", r"(?:রেজিস্ট্রেশন|নিবন্ধন|Registration)\s*[:：-]?\s*([^\n,;]{2,100})"),
}

def _ocr(image):
    try:
        import pytesseract
        return pytesseract.image_to_string(image, lang="ben+eng")
    except Exception as exc:
        raise ValueError("OCR চালু করা যায়নি। সার্ভারে Tesseract এবং বাংলা ভাষার ডেটা প্রয়োজন।") from exc

def _extract_pdf(data):
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data), strict=True)
        if reader.is_encrypted:
            raise ValueError("পাসওয়ার্ড-সুরক্ষিত PDF পড়া যাচ্ছে না।")
        direct = "\n".join(page.extract_text() or "" for page in reader.pages)
        if len(direct.strip()) >= 30:
            return direct, "digital/typed", len(reader.pages), False
        try:
            import fitz
            from PIL import Image
            doc = fitz.open(stream=data, filetype="pdf")
            text = "\n".join(_ocr(Image.open(io.BytesIO(page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7)).tobytes("png")))) for page in doc)
            return text, "scanned typed or handwritten", len(doc), True
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError("স্ক্যান করা PDF-এর OCR করা যায়নি।") from exc
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("PDF ফাইলটি পড়া যাচ্ছে না বা ক্ষতিগ্রস্ত।") from exc

def extract_document(filename, content_type, data):
    if content_type not in ALLOWED:
        raise ValueError("শুধু PDF, JPG, JPEG অথবা PNG ফাইল আপলোড করুন।")
    if not data or len(data) > MAX_BYTES:
        raise ValueError("ফাইলটি খালি অথবা ১৫ MB-এর বেশি।")
    if content_type == "application/pdf":
        text, doc_type, pages, used_ocr = _extract_pdf(data)
    else:
        try:
            from PIL import Image, ImageOps, ImageEnhance, ImageFilter
            image = Image.open(io.BytesIO(data))
            image.verify()
            image = Image.open(io.BytesIO(data)).convert("L")
            image = ImageOps.autocontrast(image).filter(ImageFilter.SHARPEN)
            image = ImageEnhance.Contrast(image).enhance(1.4)
            text, doc_type, pages, used_ocr = _ocr(image), "scanned typed or handwritten", 1, True
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError("ছবিটি পড়া যাচ্ছে না বা ক্ষতিগ্রস্ত।") from exc
    fields = {}
    for key, (label, pattern) in FIELDS.items():
        match = re.search(pattern, text, flags=re.IGNORECASE)
        value = re.sub(r"\s+", " ", match.group(1)).strip(" :-,।") if match else ""
        fields[key] = {"label": label, "value": value, "confidence": "Medium" if value else "Not found"}
    # OCR content is always presented as tentative; handwriting capability depends on installed OCR data.
    return {"filename": filename, "document_type": doc_type, "page_count": pages, "used_ocr": used_ocr,
            "fields": fields, "readable_text": bool(text.strip()), "warning": "হাতে লেখা দলিলের তথ্য শনাক্তকরণে ভুল হতে পারে। যাচাইয়ের আগে তথ্যগুলো পর্যালোচনা করুন।" if used_ocr else None}
