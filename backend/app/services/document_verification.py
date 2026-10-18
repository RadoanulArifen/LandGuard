"""Temporary, review-first extraction for land documents. No OCR result is persisted."""
import io
import re
import shutil
import subprocess

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

# Labels commonly printed in land-record tables. Many PDFs place the value in
# a separate cell, so they cannot be read reliably with a same-line regex alone.
TABLE_LABELS = {
    "district": ("জেলা", "district"),
    "upazila": ("উপজেলা", "উপজেলা/থানা", "থানা", "upazila"),
    "mouza": ("মৌজার নাম", "মৌজা", "mouza"),
    "khatian": ("খতিয়ান নম্বর", "খতিয়ান নং", "খতিয়ান নম্বর", "খতিয়ান নং", "হাল খতিয়ান", "হাল খতিয়ান", "খতিয়ান", "খতিয়ান", "khatian no", "khatian"),
    "dag": ("হাল দাগ নং", "হাল দাগ নম্বর", "দাগ নম্বর", "দাগ নং", "দাগ", "dag no", "dag"),
    "area": ("খতিয়ানের মোট জমি", "খতিয়ানের মোট জমি", "দাগের মোট জমির পরিমাণ", "জমির পরিমাণ", "জমির পরিমান", "মোট জমি", "পরিমাণ", "area"),
    "land_class": ("জমির শ্রেণি", "জমির শ্রেণী", "জমির শ্রেনি", "জমির শ্রেণী কৃষি", "শ্রেণি", "শ্রেণী", "শ্রেনি", "land class"),
    "owner": ("মালিকের নাম", "রেকর্ডীয় মালিক", "রেকর্ডীয় মালিক", "owner name", "owner"),
    "father_spouse": ("পিতা/স্বামীর নাম", "পিতা বা স্বামীর নাম", "পিতার নাম", "স্বামীর নাম"),
    "grantor": ("দাতার নাম", "দাতা", "বিক্রেতার নাম", "বিক্রেতা", "grantor", "seller"),
    "grantee": ("গ্রহীতার নাম", "গ্রহীতা", "ক্রেতার নাম", "ক্রেতা", "grantee", "buyer"),
    "deed_no": ("দলিল নম্বর", "দলিল নং", "দলিল নং.", "deed no", "deed number"),
    "deed_date": ("রেজিস্ট্রেশনের তারিখ", "দলিলের তারিখ", "নিবন্ধনের তারিখ", "তারিখ", "deed date", "date"),
    "registration": ("সম্পর্কিত রেজিস্ট্রেশন রেফারেন্স", "রেজিস্ট্রেশন রেফারেন্স", "রেজিস্ট্রেশন তথ্য", "রেজিস্ট্রেশন", "নিবন্ধন", "registration"),
}

def _is_label(value):
    value = _normal_label(value)
    return any(_normal_label(alias) == value
               for aliases in TABLE_LABELS.values() for alias in aliases)

def _normal_label(value):
    return re.sub(r"[\s:：#|।./\-\u200b-\u200f\ufeff]+", "", value).casefold()

def _table_value(key, lines):
    aliases = sorted(TABLE_LABELS[key], key=len, reverse=True)
    # PDF layout extraction and OCR often retain table cells as tab or wide-space separated text.
    candidates = []
    for line in lines:
        cells = [c.strip(" \t:：#|।") for c in re.split(r"\t+| {2,}|\s*\|\s*", line) if c.strip(" \t:：#|।")]
        for index, cell in enumerate(cells[:-1]):
            if any(_normal_label(cell) == _normal_label(alias)
                   or (key == "owner" and _normal_label(cell).startswith(_normal_label(alias)))
                   for alias in aliases):
                value = cells[index + 1].strip(" :-,।")
                if value and not _is_label(value) and _normal_label(value) not in {"মন্তব্য", "অংশ", "ক্রমিক", "মোটঅংশ", "মালিকেরপ্রাপ্যজমি"}:
                    candidates.append(value)
    if candidates:
        # Avoid returning the next column header when the matching text is a table heading.
        if key in ("area", "khatian", "dag"):
            numeric = next((value for value in candidates if re.search(r"[0-9০-৯]", value)), None)
            if numeric:
                return numeric
        return candidates[-1] if key in ("area", "dag") else candidates[0]
    # Some text extractors flatten the table row into a label and value separated by one space.
    all_aliases = "|".join(re.escape(alias) for alias in aliases)
    known_labels = "|".join(re.escape(alias) for group in TABLE_LABELS.values() for alias in sorted(group, key=len, reverse=True))
    pattern = rf"(?im)(?:^|[|\t])\s*(?:{all_aliases})\s*[:：#-]?\s+(.+?)(?=\s{{2,}}(?:{known_labels})\b|\s+(?:{known_labels})\s*[:：#|]|$)"
    match = re.search(pattern, "\n".join(lines))
    if match:
        value = re.sub(r"\s+", " ", match.group(1)).strip(" :-,।")
        if value and not _is_label(value):
            return value
    return ""

def _pdf_table_values(data):
    """Read label/value cells from digitally generated PDF tables when available."""
    result = {}
    party_index = 0
    try:
        import fitz
        document = fitz.open(stream=data, filetype="pdf")
        for page in document:
            finder = getattr(page, "find_tables", None)
            if not finder:
                continue
            for table in finder().tables:
                for row in table.extract():
                    cells = [re.sub(r"\s+", " ", str(cell or "")).strip(" :-,।") for cell in row]
                    for index, cell in enumerate(cells[:-1]):
                        normalized = _normal_label(cell)
                        key = next((field for field, aliases in TABLE_LABELS.items()
                                    if any(normalized == _normal_label(alias)
                                           or normalized.startswith(_normal_label(alias))
                                           for alias in aliases)), None)
                        value = next((candidate for candidate in cells[index + 1:] if candidate and not _is_label(candidate)), "")
                        if normalized == _normal_label("নাম") and value:
                            party_key = "grantor" if party_index == 0 else "grantee" if party_index == 1 else None
                            if party_key and party_key not in result:
                                result[party_key] = value
                                party_index += 1
                        if key and value and key not in result:
                            result[key] = value
    except Exception:
        # Keep standard PDF text extraction available when table detection cannot parse a file.
        pass
    return result

def _layout_table_values(text):
    """Recover row-aligned values from fixed-layout khatian tables."""
    values = {}
    lines = text.splitlines()
    in_detail = False
    for line in lines:
        compact = _normal_label(line)
        if "খতিয়ানেরমালিকানা" in compact or "খতিয়ানেরমালিকানা" in compact:
            in_detail = True
            continue
        if in_detail and ("খতিয়ানেরমোটজমি" in compact or "খতিয়ানেরমোটজমি" in compact):
            in_detail = False
        if in_detail:
            cells = [cell.strip() for cell in re.split(r"\t+| {2,}", line) if cell.strip()]
            # Detail rows use: serial, share, previous dag, current dag, class, class-kind, area, owner's area.
            if len(cells) >= 7 and re.fullmatch(r"\d+", cells[0]) and re.search(r"[০-৯0-9]", cells[3]):
                values.setdefault("dag", cells[3])
                values.setdefault("land_class", cells[4])
                values.setdefault("area", f"{cells[6]} একর")
    for index, line in enumerate(lines):
        cells = [cell.strip() for cell in re.split(r"\t+| {2,}", line) if cell.strip()]
        if len(cells) >= 5 and _normal_label(cells[0]) == _normal_label("সাবেক খতিয়ান"):
            data_cells = next(([cell.strip() for cell in re.split(r"\t+| {2,}", candidate) if cell.strip()]
                               for candidate in lines[index + 1:] if len([cell for cell in re.split(r"\t+| {2,}", candidate) if cell.strip()]) >= 5
                               and re.fullmatch(r"[০-৯0-9]+", re.split(r"\t+| {2,}", candidate.strip())[0])), [])
            if len(data_cells) >= 5:
                values.setdefault("khatian", data_cells[1])
                values.setdefault("dag", data_cells[3])
                values.setdefault("area", data_cells[4])
                break
    return values

def _clean_value(value):
    value = re.sub(r"[\u200b-\u200f\ufeff]", "", re.sub(r"\s+", " ", value)).strip(" :-,।")
    repairs = {
        "গাজীপু র": "গাজীপুর", "শ্রীপু র": "শ্রীপুর", "চট্ট ্রগাম": "চট্টগ্রাম",
        "পটি য় া": "পটিয়া", "পূ র্ব": "পূর্ব", "খতিয় ান": "খতিয়ান",
        "শ্রে ণি": "শ্রেণি", "মোঃ আব্দু ল": "মোঃ আব্দুল", "মোঃ নু রুল": "মোঃ নুরুল",
        "রেজিস্ট্রে শনের": "রেজিস্ট্রেশনের", "সেপ্টে ম": "সেপ্টেম্বর",
    }
    for broken, fixed in repairs.items():
        value = value.replace(broken, fixed)
    return value

def _party_names(text):
    # Transfer deeds commonly use repeated two-column rows labelled only "নাম".
    return [re.sub(r"\s+", " ", value).strip(" :-,।")
            for value in re.findall(r"(?m)^\s*নাম\s{2,}([^\n]+)", text)
            if value.strip()]

def _layout_deed_date(text):
    lines = text.splitlines()
    for index, line in enumerate(lines):
        compact = _normal_label(line)
        if "তারিখ" not in compact or not any(token in compact for token in ("রেজিস্ট্রেশন", "নিবন্ধন", "দলিল")):
            continue
        # Bangla glyphs from some embedded fonts place the last part of a word on the preceding line.
        region = "".join((line + (lines[index - 1] if index else "") + (lines[index + 1] if index + 1 < len(lines) else "")).split())
        match = re.search(r"([০-৯]{1,2})([\u0980-\u09ff]{4,20}?)([০-৯]{4})", region)
        if match:
            return f"{match.group(1)} {match.group(2)} {match.group(3)}"
    return ""

def _khatian_owners(text):
    match = re.search(r"(?s)খতিয়ানের মালিকানা.*?(?=খতিয়ানের মোট জমি)", text)
    if not match:
        match = re.search(r"(?s)খতিয়ানের মালিকানা.*?(?=খতিয়ানের মোট জমি)", text)
    if not match:
        return "", ""
    lines = [re.sub(r"[\u200b-\u200f\ufeff]", "", line).strip() for line in match.group(0).splitlines() if line.strip()]
    names = []
    parents = []
    for index, line in enumerate(lines):
        if re.match(r"(?:মোঃ|মোসাঃ|মোছাঃ)\s*", line):
            name = line
            if index + 1 < len(lines) and not re.match(r"(?:পিতা|স্বামী|গ্রাম|ক্রমিক)\s*[:：]?", lines[index + 1]):
                if re.fullmatch(r"[\u0980-\u09ff\s।.]+", lines[index + 1]):
                    name += " " + lines[index + 1]
            names.append(re.sub(r"\s+", " ", name))
        left_cell = re.split(r"\s{2,}", line, maxsplit=1)[0]
        parent = re.search(r"(পিতা|স্বামী)\s*[:：]\s*(.+)", left_cell)
        if parent:
            role, value = parent.group(1), parent.group(2).strip()
            for candidate in lines[index + 1:index + 5]:
                candidate = re.split(r"\s{2,}", candidate, maxsplit=1)[0].strip()
                if re.fullmatch(r"[\u0980-\u09ff\s।.]+", candidate) and not re.match(r"(?:গ্রাম|পিতা|স্বামী|নামজারি|রেকর্ড)", candidate):
                    value += " " + candidate
                    break
            parents.append(f"{role}: {_clean_value(value)}")
    return "; ".join(names), "; ".join(parents)

def _party_parent_names(text):
    values = [re.sub(r"\s+", " ", value).strip(" :-,।")
              for value in re.findall(r"(?m)^\s*পিতার নাম\s{2,}([^\n]+)", text)
              if value.strip()]
    if len(values) >= 2:
        return f"দাতা: {_clean_value(values[0])}; গ্রহীতা: {_clean_value(values[1])}"
    return ""

def _ocr(image):
    try:
        import pytesseract
        return pytesseract.image_to_string(image, lang="ben+eng")
    except Exception as exc:
        raise ValueError("OCR চালু করা যায়নি। সার্ভারে Tesseract এবং বাংলা ভাষার ডেটা প্রয়োজন।") from exc

def _extract_pdf(data):
    direct, page_count, reader_error = "", 0, None
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data), strict=True)
        if reader.is_encrypted:
            raise ValueError("পাসওয়ার্ড-সুরক্ষিত PDF পড়া যাচ্ছে না।")
        page_count = len(reader.pages)
        try:
            direct = "\n".join(page.extract_text(extraction_mode="layout") or "" for page in reader.pages)
        except TypeError:  # older pypdf versions
            direct = "\n".join(page.extract_text() or "" for page in reader.pages)
    except ValueError:
        raise
    except Exception as exc:
        reader_error = exc
    if not shutil.which("pdftotext"):
        try:
            import fitz
            document = fitz.open(stream=data, filetype="pdf")
            fitz_text = "\n".join(page.get_text("text", sort=True) for page in document)
            if len(fitz_text.strip()) >= 30:
                direct = f"{direct}\n{fitz_text}" if direct.strip() else fitz_text
            page_count = page_count or len(document)
        except Exception:
            pass
    # Poppler handles some embedded Bangla font maps better than Python PDF readers.
    if shutil.which("pdftotext"):
        try:
            result = subprocess.run(["pdftotext", "-layout", "-", "-"], input=data,
                                    capture_output=True, timeout=20, check=True)
            popped = result.stdout.decode("utf-8", "replace")
            if len(popped.strip()) >= 30:
                direct = popped
            if not page_count and shutil.which("pdfinfo"):
                info = subprocess.run(["pdfinfo", "-"], input=data, capture_output=True, timeout=10, check=True).stdout.decode("utf-8", "replace")
                page_count = int(re.search(r"(?m)^Pages:\s*(\d+)", info).group(1))
        except Exception:
            pass
    if len(direct.strip()) >= 30:
        return direct, "digital/typed", page_count or 1, False
    if reader_error and not direct.strip():
        raise ValueError("PDF ফাইলটি পড়া যাচ্ছে না বা ক্ষতিগ্রস্ত।") from reader_error
    try:
        import fitz
        from PIL import Image
        doc = fitz.open(stream=data, filetype="pdf")
        text = "\n".join(_ocr(Image.open(io.BytesIO(page.get_pixmap(matrix=fitz.Matrix(2.5, 2.5)).tobytes("png")))) for page in doc)
        return text, "scanned typed or handwritten", len(doc), True
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("স্ক্যান করা PDF-এর OCR করা যায়নি।") from exc

def extract_document(filename, content_type, data):
    if content_type not in ALLOWED:
        raise ValueError("শুধু PDF, JPG, JPEG অথবা PNG ফাইল আপলোড করুন।")
    if not data or len(data) > MAX_BYTES:
        raise ValueError("ফাইলটি খালি অথবা ১৫ MB-এর বেশি।")
    if content_type == "application/pdf":
        text, doc_type, pages, used_ocr = _extract_pdf(data)
        table_values = {**_layout_table_values(text), **_pdf_table_values(data)}
    else:
        try:
            from PIL import Image, ImageOps, ImageEnhance, ImageFilter
            image = Image.open(io.BytesIO(data))
            image.verify()
            image = Image.open(io.BytesIO(data)).convert("L")
            image = ImageOps.autocontrast(image).filter(ImageFilter.SHARPEN)
            image = ImageEnhance.Contrast(image).enhance(1.4)
            text, doc_type, pages, used_ocr = _ocr(image), "scanned typed or handwritten", 1, True
            table_values = {}
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError("ছবিটি পড়া যাচ্ছে না বা ক্ষতিগ্রস্ত।") from exc
    fields = {}
    for key, (label, pattern) in FIELDS.items():
        value = table_values.get(key, "") or _table_value(key, text.splitlines())
        confidence = "Medium" if value else "Not found"
        if not value:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            value = re.sub(r"\s+", " ", match.group(1)).strip(" :-,।") if match else ""
            # If a broad fallback consumed later table labels, keep only its first cell-like phrase.
            value = re.split(r"\s{2,}", value, maxsplit=1)[0].strip()
            if any(re.search(rf"\b{re.escape(alias)}\b", value, re.IGNORECASE) for aliases in TABLE_LABELS.values() for alias in aliases):
                value = ""
            confidence = "Low" if value else "Not found"
        fields[key] = {"label": label, "value": _clean_value(value), "confidence": confidence}
    parties = _party_names(text)
    if parties:
        if len(parties) >= 1:
            fields["grantor"].update(value=parties[0], confidence="Medium")
        if len(parties) >= 2:
            fields["grantee"].update(value=parties[1], confidence="Medium")
    parents = _party_parent_names(text)
    if parents:
        fields["father_spouse"].update(value=parents, confidence="Medium")
    if not fields["deed_date"]["value"]:
        date_value = _layout_deed_date(text)
        if date_value:
            fields["deed_date"].update(value=date_value, confidence="Medium")
    if not fields["owner"]["value"] or _normal_label(fields["owner"]["value"]) in {"দাগেরমোট", "ক্রমিক", "মন্তব্য"}:
        owners, parent = _khatian_owners(text)
        if owners:
            fields["owner"].update(value=owners, confidence="Low")
        if parent:
            fields["father_spouse"].update(value=parent, confidence="Low")
    # OCR content is always presented as tentative; handwriting capability depends on installed OCR data.
    return {"filename": filename, "document_type": doc_type, "page_count": pages, "used_ocr": used_ocr,
            "fields": fields, "readable_text": bool(text.strip()), "warning": "হাতে লেখা দলিলের তথ্য শনাক্তকরণে ভুল হতে পারে। যাচাইয়ের আগে তথ্যগুলো পর্যালোচনা করুন।" if used_ocr else None}
