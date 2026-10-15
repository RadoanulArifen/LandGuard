"""Investigation report (PDF) with ReportLab. Neutral wording only - never states legal guilt."""
from __future__ import annotations

import io
from datetime import datetime
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from app.services.bn_words import WORDS as BN_WORDS

GREEN = colors.HexColor("#14532d")
LIGHT = colors.HexColor("#ecfdf5")
RED = colors.HexColor("#b91c1c")
FONT_DIR = Path(__file__).resolve().parents[1] / "assets" / "fonts"
BN_COPY = {
    "ভূমি প্রহরী Investigation Report": "ভূমি প্রহরী তদন্ত প্রতিবেদন", "Generated": "তৈরির সময়", "Synthetic hackathon data": "হ্যাকাথনের কৃত্রিম ডেটা", "Decision-support only": "শুধু সিদ্ধান্ত গ্রহণে সহায়ক",
    "This report lists potential inconsistencies found by automated checks. It does not determine legal ownership and does not state that any person or transaction is fraudulent. Final decisions rest with authorised human officials.": "এই প্রতিবেদনে স্বয়ংক্রিয় যাচাইয়ে পাওয়া সম্ভাব্য অসংগতিগুলো দেখানো হয়েছে। এটি আইনি মালিকানা নির্ধারণ করে না এবং কোনো ব্যক্তি বা লেনদেনকে জালিয়াতি বলে ঘোষণা করে না। চূড়ান্ত সিদ্ধান্ত সংশ্লিষ্ট কর্মকর্তারা নেবেন।",
    "Parcel information": "জমির তথ্য", "Parcel ID": "জমির আইডি", "Integrity status": "তথ্যের সামঞ্জস্য", "District / Upazila": "জেলা / উপজেলা", "Mouza": "মৌজা", "Khatian / Dag": "খতিয়ান / দাগ", "Total area": "মোট জমির পরিমাণ", "Current owner": "বর্তমান মালিক", "Recorded share": "নথিভুক্ত অংশ", "Ownership status": "মালিকানার অবস্থা", "Registration / Mutation": "রেজিস্ট্রেশন / নামজারি", "decimal": "শতক", "n/a": "প্রযোজ্য নয়",
    "Investigation priority": "তদন্তের অগ্রাধিকার", "Transaction": "লেনদেন", "Investigation Priority Score": "তদন্তের অগ্রাধিকার স্কোর", "This is a prioritisation score for human review, not a fraud probability.": "এটি মানুষের পর্যালোচনার জন্য অগ্রাধিকার স্কোর, জালিয়াতির সম্ভাবনা নয়।", "Recommended action": "প্রস্তাবিত পদক্ষেপ", "Human Review Required": "মানবীয় পর্যালোচনা প্রয়োজন",
    "Ownership history": "মালিকানার ইতিহাস", "Date": "তারিখ", "Owner": "মালিক", "From": "পূর্ববর্তী মালিক", "Area": "জমির পরিমাণ", "Share %": "অংশ %", "Txn": "লেনদেন", "Status": "অবস্থা", "Original": "মূল নথি",
    "Transaction timeline (transaction, registration, mutation)": "লেনদেনের সময়রেখা (লেনদেন, রেজিস্ট্রেশন, নামজারি)", "Event": "ঘটনা", "Parties": "পক্ষসমূহ", "Detail": "বিবরণ", "Flag": "চিহ্ন", "review": "পর্যালোচনা", "Registration vs mutation": "রেজিস্ট্রেশন বনাম নামজারি", "Field": "তথ্য", "Registration": "রেজিস্ট্রেশন", "Mutation": "নামজারি", "Result": "ফলাফল", "match": "মিলেছে", "MISMATCH": "অমিল",
    "Detected issues and evidence": "শনাক্ত অসংগতি ও প্রমাণ", "No integrity signals were raised for this parcel.": "এই জমিতে কোনো অসংগতি শনাক্ত হয়নি।", "AI explanation": "এআই-এর ব্যাখ্যা", "Contributing factor": "প্রভাবক বিষয়", "SHAP": "SHAP", "Plain-language note": "সহজ ভাষায় ব্যাখ্যা", "Recommendation": "সুপারিশ", "An authorised officer should verify the source documents (deed, mutation file, khatian) before any administrative decision is taken.": "প্রশাসনিক সিদ্ধান্তের আগে একজন অনুমোদিত কর্মকর্তার মূল দলিল, নামজারির নথি ও খতিয়ান যাচাই করা উচিত।",
    "No integrity signals were raised for this transaction.": "এই লেনদেনে কোনো অসংগতি শনাক্ত হয়নি।", "Potential Double-Sale / Overlapping Transfer": "সম্ভাব্য একাধিক বিক্রি / হস্তান্তরের ওভারল্যাপ", "Potential Over-Transfer": "সম্ভাব্য অতিরিক্ত হস্তান্তর", "Rapid Transfer Pattern": "দ্রুত হস্তান্তরের ধরন", "Ownership Chain Break": "মালিকানার ধারাবাহিকতা ভেঙেছে", "Registration Mismatch": "রেজিস্ট্রেশনের অমিল", "Registration–Mutation Mismatch": "রেজিস্ট্রেশন ও নামজারির অমিল", "Temporal Inconsistency": "তারিখের অসংগতি", "High": "উচ্চ", "Medium": "মাঝারি", "Critical": "গুরুতর", "Low": "নিম্ন", "High Concern": "উচ্চ উদ্বেগ", "Review Required": "পর্যালোচনা প্রয়োজন", "Consistent": "সামঞ্জস্যপূর্ণ", "Conflict Detected": "বিতর্কিত", "Disputed": "বিতর্কিত", "Registered": "নিবন্ধিত", "Completed": "সম্পন্ন", "Inactive": "নিষ্ক্রিয়", "Active": "সক্রিয়", "Pending": "অপেক্ষমাণ", "Verified": "যাচাইকৃত", "Unverified": "যাচাই হয়নি",
    "Critical Review Priority": "জরুরি পর্যালোচনা অগ্রাধিকার", "High Review Priority": "উচ্চ পর্যালোচনা অগ্রাধিকার", "Medium Review Priority": "মাঝারি পর্যালোচনা অগ্রাধিকার", "Low Review Priority": "নিম্ন পর্যালোচনা অগ্রাধিকার",
    "Double-Sale / Overlapping Transfer": "একই জমি একাধিকবার বিক্রি / হস্তান্তরের ওভারল্যাপ", "Double-Sale": "একই জমি একাধিকবার বিক্রি", "Over-Transfer": "অতিরিক্ত হস্তান্তর", "Rapid Transfer": "দ্রুত হস্তান্তর", "Registration Mismatch": "রেজিস্ট্রেশনের অমিল", "Temporal Inconsistency": "তারিখের অসংগতি",
    "appears as seller again although transaction ": "আবার বিক্রেতা হিসেবে দেখা যাচ্ছে, যদিও লেনদেন ", " had already transferred their entire recorded interest in this parcel.": " এই জমিতে তার সম্পূর্ণ নথিভুক্ত অংশ আগেই হস্তান্তর করেছিল।",
    "Transferred share (": "হস্তান্তরিত অংশ (", ") exceeds the seller's recorded share before the transfer (": ") হস্তান্তরের আগে বিক্রেতার নথিভুক্ত অংশের (", ").": ") চেয়ে বেশি।", "Transferred area (": "হস্তান্তরিত জমির পরিমাণ (", ") exceeds the area the seller controlled (": ") বিক্রেতার নিয়ন্ত্রণাধীন জমির পরিমাণ (", " decimal).": " শতক) ছাড়িয়ে গেছে।",
    "This parcel was transferred again ": "এই জমিটি আবার হস্তান্তর করা হয়েছে ", " day(s) after the previous transfer (": " দিন পর (", "strong signal). Rapid transfers are an anomaly signal only, not proof of wrongdoing.": "জোরালো সংকেত)। দ্রুত হস্তান্তর শুধু অসংগতির সংকেত, অনিয়মের প্রমাণ নয়।", "moderate signal). Rapid transfers are an anomaly signal only, not proof of wrongdoing.": "মাঝারি সংকেত)। দ্রুত হস্তান্তর শুধু অসংগতির সংকেত, অনিয়মের প্রমাণ নয়।",
    "The recorded seller ": "নথিভুক্ত বিক্রেতা ", " does not match the recorded previous owner ": " নথিভুক্ত আগের মালিক ", "No mutation record exists, so the new owner cannot be confirmed.": "নামজারির নথি নেই, তাই নতুন মালিক নিশ্চিত করা যাচ্ছে না।", "Mutation owner differs from the registered buyer.": "নামজারির মালিক রেজিস্ট্রিতে থাকা ক্রেতার সাথে মেলে না।", "Mutation owner matches the registered buyer.": "নামজারির মালিক রেজিস্ট্রিতে থাকা ক্রেতার সাথে মেলে।", "No mutation record is linked to this transaction.": "এই লেনদেনের সাথে নামজারির নথি সংযুক্ত নেই।", "A mutation record exists.": "নামজারির নথি রয়েছে।", "No registration record exists for this transaction.": "এই লেনদেনের কোনো রেজিস্ট্রেশন নথি নেই।", "No registration record is linked to this transaction.": "এই লেনদেনের সাথে রেজিস্ট্রেশন নথি সংযুক্ত নেই।", "A registration record exists.": "রেজিস্ট্রেশন নথি রয়েছে।", "Registered buyer differs from the transaction buyer.": "রেজিস্ট্রিতে থাকা ক্রেতা লেনদেনের ক্রেতার সাথে মেলে না।", "Registered seller differs from the transaction seller.": "রেজিস্ট্রিতে থাকা বিক্রেতা লেনদেনের বিক্রেতার সাথে মেলে না।", "Registered seller matches.": "রেজিস্ট্রিতে থাকা বিক্রেতার তথ্য মেলে।", "Registered buyer matches.": "রেজিস্ট্রিতে থাকা ক্রেতার তথ্য মেলে।", "Registration type differs from the transaction type.": "রেজিস্ট্রেশনের ধরন লেনদেনের ধরনের সাথে মেলে না।", "Mutation type differs from the registration type.": "নামজারির ধরন রেজিস্ট্রেশনের ধরনের সাথে মেলে না।", "Mutation type matches the registration.": "নামজারির ধরন রেজিস্ট্রেশনের সাথে মেলে।", "Mutation previous owner differs from the registered seller.": "নামজারিতে থাকা আগের মালিক রেজিস্ট্রিতে থাকা বিক্রেতার সাথে মেলে না।", "Mutation previous owner matches the registered seller.": "নামজারিতে থাকা আগের মালিক রেজিস্ট্রিতে থাকা বিক্রেতার সাথে মেলে।", "Record dates are out of the expected order.": "নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় নেই।", "Record dates are in the expected order.": "নথির তারিখগুলো প্রত্যাশিত ধারাবাহিকতায় রয়েছে।", "Expected order is transaction date ≤ registration date ≤ mutation date, but the recorded dates are out of order.": "তারিখের প্রত্যাশিত ক্রম হলো: লেনদেন ≤ রেজিস্ট্রেশন ≤ নামজারি; কিন্তু নথিভুক্ত তারিখগুলো এই ক্রমে নেই।",
    "Mutation owner vs registered buyer": "নামজারির মালিক বনাম রেজিস্ট্রির ক্রেতা", "Mutation previous owner vs registered seller": "নামজারির আগের মালিক বনাম রেজিস্ট্রির বিক্রেতা", "Mutation area vs registered area": "নামজারির জমির পরিমাণ বনাম রেজিস্ট্রির পরিমাণ", "Mutation share vs transferred share": "নামজারির অংশ বনাম হস্তান্তরিত অংশ", "Mutation type vs registration type": "নামজারির ধরন বনাম রেজিস্ট্রেশনের ধরন", "Mutation record present": "নামজারির নথি রয়েছে", "Registration buyer vs transaction buyer": "রেজিস্ট্রির ক্রেতা বনাম লেনদেনের ক্রেতা", "Registration seller vs transaction seller": "রেজিস্ট্রির বিক্রেতা বনাম লেনদেনের বিক্রেতা", "Registration area vs transaction area": "রেজিস্ট্রির জমির পরিমাণ বনাম লেনদেনের পরিমাণ", "Registration type vs transaction type": "রেজিস্ট্রেশনের ধরন বনাম লেনদেনের ধরন", "Registration record present": "রেজিস্ট্রেশনের নথি রয়েছে", "Ownership chain continuity": "মালিকানার ধারাবাহিকতা", "Transferred share": "হস্তান্তরিত অংশ", "Seller recorded share": "বিক্রেতার নথিভুক্ত অংশ", "Short transfer interval": "স্বল্প সময়ের ব্যবধানে হস্তান্তর", "Previous transfer exists": "আগের হস্তান্তর রয়েছে", "Average transfer interval": "হস্তান্তরের গড় ব্যবধান", "Registration date vs transaction date": "রেজিস্ট্রেশনের তারিখ বনাম লেনদেনের তারিখ", "Mutation date vs registration date": "নামজারির তারিখ বনাম রেজিস্ট্রেশনের তারিখ", "Registration delay": "রেজিস্ট্রেশনে বিলম্ব", "Mutation delay": "নামজারিতে বিলম্ব", "Repeated transfer history": "বারবার হস্তান্তরের ইতিহাস", "Number of ownership changes": "মালিকানা পরিবর্তনের সংখ্যা", "Ownership sequence position": "মালিকানার ধারাবাহিকতায় অবস্থান", "Transfer frequency": "হস্তান্তরের হার", "SHAP values are in log-odds units of the anomaly model. They explain the model output, not legal facts.": "SHAP মানগুলো অসংগতি মডেলের লগ-অডস এককে প্রকাশিত। এগুলো মডেলের ফল ব্যাখ্যা করে, আইনি তথ্য নয়।",
    "Record ID": "নথির আইডি", "Seller / Previous Owner": "বিক্রেতা / আগের মালিক", "Buyer / New Owner": "ক্রেতা / নতুন মালিক", "Transferred area (decimal)": "হস্তান্তরিত জমির পরিমাণ (শতক)", "Ownership share (%)": "মালিকানার অংশ (%)", "Transaction type": "লেনদেনের ধরন", "Verification": "যাচাই", "Document / reference": "নথি / সূত্র", "Missing": "অনুপস্থিত", "Under Transfer": "হস্তান্তরাধীন", "Sale": "বিক্রয়", "Transfer": "হস্তান্তর", "Gift": "দান",
    " → ": " থেকে ", "Parcel was transferred again ": "জমিটি আবার হস্তান্তর করা হয়েছে ", "The recorded seller does not match the recorded previous owner.": "নথিভুক্ত বিক্রেতা নথিভুক্ত আগের মালিকের সাথে মেলে না।", "This seller had already sold ": "এই বিক্রেতা আগেই বিক্রি করেছেন ", " earlier on this parcel.": " এই জমির অংশ।", "Share already sold earlier by this seller": "এই বিক্রেতার আগে বিক্রি করা অংশ", "No earlier sales by this seller on this parcel.": "এই জমিতে এই বিক্রেতার আগে কোনো বিক্রি নেই।", "This seller had earlier sales on the same parcel.": "এই বিক্রেতা আগে একই জমি বিক্রি করেছেন।", "Mutation type matches the registration.": "নামজারির ধরন রেজিস্ট্রেশনের সাথে মেলে।", "Registration type matches.": "রেজিস্ট্রেশনের ধরন মেলে।", "Seller matches the recorded previous owner.": "বিক্রেতা নথিভুক্ত আগের মালিকের সাথে মেলে।", "Seller had": "বিক্রেতা করেছেন", "does not match": "মেলে না", "differs from": "এর সাথে অমিল", "matches": "মেলে", "decimal": "শতক",
}

BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
BN_MONTHS = {"Jan": "জানুয়ারি", "Feb": "ফেব্রুয়ারি", "Mar": "মার্চ", "Apr": "এপ্রিল", "May": "মে", "Jun": "জুন", "Jul": "জুলাই", "Aug": "আগস্ট", "Sep": "সেপ্টেম্বর", "Oct": "অক্টোবর", "Nov": "নভেম্বর", "Dec": "ডিসেম্বর"}
BN_LETTERS = {"b": "ব", "c": "ক", "d": "ড", "f": "ফ", "g": "গ", "h": "হ", "j": "জ", "k": "ক", "l": "ল", "m": "ম", "n": "ন", "p": "প", "q": "ক", "r": "র", "s": "স", "t": "ট", "v": "ভ", "w": "ও", "x": "ক্স", "y": "য়", "z": "জ"}
BN_CHUNKS = {"sh": "শ", "ch": "চ", "kh": "খ", "gh": "ঘ", "bh": "ভ", "th": "থ", "dh": "ধ", "ph": "ফ", "ng": "ং", "ck": "ক", "zh": "ঝ", "aa": "া", "ee": "ী", "oo": "ু"}
BN_IDS = re.compile(r"\b(?:P|O|T|R|M|K|D|REG|MUT|DEED)-[A-Z0-9-]*\d[A-Z0-9-]*\b", re.I)


def _transliterate_word(word: str) -> str:
    lower = word.lower()
    if lower in BN_WORDS:
        return BN_WORDS[lower]
    chunks = re.findall(r"sh|ch|kh|gh|bh|th|dh|ph|ng|ck|zh|aa|ee|oo|[a-z]|[^a-z]", lower)
    out = ""
    vowels = "aeiou"
    for i, chunk in enumerate(chunks):
        prev = chunks[i - 1] if i else ""
        if chunk in BN_CHUNKS:
            out += BN_CHUNKS[chunk]
        elif chunk in vowels:
            out += "আ" if chunk == "a" and i == 0 else ("া" if chunk == "a" else {"e": "ে", "i": "ি", "o": "ো", "u": "ু"}[chunk])
        elif re.fullmatch(r"[a-z]", chunk):
            out += BN_LETTERS.get(chunk, chunk)
        else:
            out += chunk.translate(BN_DIGITS)
        if (prev and re.fullmatch(r"[a-z]", prev) and prev in vowels and re.fullmatch(r"[a-z]", chunk)
                and chunk not in vowels and i + 1 < len(chunks) and re.fullmatch(r"[a-z]", chunks[i + 1])
                and chunks[i + 1] not in vowels):
            out += "্"
    return out


def _bn_text(value) -> str:
    """Render any untranslated record text in Bengali script while preserving record IDs."""
    text = str(value)
    text = re.sub(r"\bCox['’]s Bazar\b", "কক্সবাজার", text, flags=re.I)
    text = re.sub(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b", lambda m: BN_MONTHS[m[1]], text)
    ids = []
    text = BN_IDS.sub(lambda m: (ids.append(m.group(0)) or f"\ue000{len(ids)-1}\ue001"), text)
    text = re.sub(r"[A-Za-z]+(?:['’][A-Za-z]+)?|\d+|&", lambda m: ("ও" if m.group(0) == "&" else _transliterate_word(m.group(0))), text)
    text = text.translate(BN_DIGITS)
    for i, identifier in enumerate(ids):
        text = text.replace(f"\ue000{i}\ue001", identifier)
    return text


def _translate(value):
    text = str(value)
    for source, target in sorted(BN_COPY.items(), key=lambda item: len(item[0]), reverse=True):
        pattern = re.escape(source)
        if re.fullmatch(r"[A-Za-z]+", source):
            pattern = rf"\b{pattern}\b"
        text = re.sub(pattern, lambda _: target, text, flags=re.IGNORECASE)
    return text


def _translate_evidence(evidence):
    message = str(evidence.get("message", ""))
    kind = evidence.get("type")
    patterns = [
        (r"(.+?) appears as seller again although transaction (T-\d+) had already transferred their entire recorded interest in this parcel\.",
         lambda m: f"{m[1]} একই জমির বিক্রেতা হিসেবে আবার দেখা যাচ্ছে, যদিও {m[2]} লেনদেনে তার সম্পূর্ণ নথিভুক্ত অংশ আগেই হস্তান্তর করা হয়েছিল।"),
        (r"Transferred share \((.+?)%\) exceeds the seller's recorded share before the transfer \((.+?)%\)\.",
         lambda m: f"হস্তান্তরিত অংশ ({m[1]}%) হস্তান্তরের আগে বিক্রেতার নথিভুক্ত অংশ ({m[2]}%) ছাড়িয়ে গেছে।"),
        (r"Transferred area \((.+?) decimal\) exceeds the area the seller controlled \((.+?) decimal\)\.",
         lambda m: f"হস্তান্তরিত জমির পরিমাণ ({m[1]} শতক) বিক্রেতার নিয়ন্ত্রণাধীন জমির পরিমাণ ({m[2]} শতক) ছাড়িয়ে গেছে।"),
        (r"This parcel was transferred again (\d+) day\(s\) after the previous transfer \((strong|moderate) signal\)\. Rapid transfers are an anomaly signal only, not proof of wrongdoing\.",
         lambda m: f"আগের হস্তান্তরের {m[1]} দিন পর জমিটি আবার হস্তান্তর করা হয়েছে ({'জোরালো' if m[2] == 'strong' else 'মাঝারি'} সংকেত)। দ্রুত হস্তান্তর শুধু অসংগতির সংকেত, অনিয়মের প্রমাণ নয়।"),
        (r"The recorded seller (.+?) does not match the recorded previous owner (.+?)\.",
         lambda m: f"নথিভুক্ত বিক্রেতা {m[1]} নথিভুক্ত আগের মালিক {m[2]}-এর সাথে মেলে না।"),
    ]
    for pattern, render in patterns:
        match = re.fullmatch(pattern, message)
        if match:
            return render(match)
    if kind in {"registration_mismatch", "mutation_mismatch"}:
        fragments = []
        for part in message.rstrip(".").split("; "):
            exact = {
                "no registration record is linked to this transaction": "এই লেনদেনের সাথে রেজিস্ট্রেশনের নথি সংযুক্ত নেই",
                "no mutation record is linked to this transaction": "এই লেনদেনের সাথে নামজারির নথি সংযুক্ত নেই",
            }
            translated = exact.get(part)
            dynamic = [
                (r"registered buyer (.+?) differs from transaction buyer (.+)", lambda m: f"রেজিস্ট্রিতে থাকা ক্রেতা {m[1]} লেনদেনের ক্রেতা {m[2]}-এর সাথে মেলে না"),
                (r"registered seller (.+?) differs from transaction seller (.+)", lambda m: f"রেজিস্ট্রিতে থাকা বিক্রেতা {m[1]} লেনদেনের বিক্রেতা {m[2]}-এর সাথে মেলে না"),
                (r"registered area (.+?) differs from transaction area (.+?) decimal", lambda m: f"রেজিস্ট্রির জমির পরিমাণ {m[1]} শতক লেনদেনের জমির পরিমাণ {m[2]} শতকের সাথে মেলে না"),
                (r"registration type '(.+?)' differs from transaction type '(.+?)'", lambda m: f"রেজিস্ট্রেশনের ধরন {m[1]} লেনদেনের ধরন {m[2]}-এর সাথে মেলে না"),
                (r"registration date (.+?) is before the transaction date (.+)", lambda m: f"রেজিস্ট্রেশনের তারিখ {m[1]} লেনদেনের তারিখ {m[2]}-এর আগে"),
                (r"mutation owner (.+?) differs from registered buyer (.+)", lambda m: f"নামজারির মালিক {m[1]} রেজিস্ট্রিতে থাকা ক্রেতা {m[2]}-এর সাথে মেলে না"),
                (r"mutation previous owner (.+?) differs from registered seller (.+)", lambda m: f"নামজারিতে থাকা আগের মালিক {m[1]} রেজিস্ট্রিতে থাকা বিক্রেতা {m[2]}-এর সাথে মেলে না"),
                (r"mutated area (.+?) differs from registered area (.+?) decimal", lambda m: f"নামজারিতে থাকা জমির পরিমাণ {m[1]} শতক রেজিস্ট্রির {m[2]} শতকের সাথে মেলে না"),
                (r"mutation share (.+?)% differs from transferred share (.+?)%", lambda m: f"নামজারিতে থাকা অংশ {m[1]}% হস্তান্তরিত অংশ {m[2]}%-এর সাথে মেলে না"),
                (r"mutation type '(.+?)' differs from registration type '(.+?)'", lambda m: f"নামজারির ধরন {m[1]} রেজিস্ট্রেশনের ধরন {m[2]}-এর সাথে মেলে না"),
                (r"mutation date (.+?) is earlier than the registration/transaction date", lambda m: f"নামজারির তারিখ {m[1]} রেজিস্ট্রেশন/লেনদেনের তারিখের আগে"),
            ]
            for pattern, render in dynamic:
                match = re.fullmatch(pattern, part, flags=re.IGNORECASE)
                if match:
                    translated = render(match)
                    break
            fragments.append(translated or "নথির তথ্যের মধ্যে অমিল পাওয়া গেছে")
        return "; ".join(fragments) + ("।" if fragments else "নথির তথ্যের মধ্যে অমিল পাওয়া গেছে।")
    return _translate(message)


def _font_markup(value, font_name):
    escaped = str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f'<font name="{font_name}">{escaped}</font>'


def _tbl(data, widths=None, header=True, font_name="Helvetica", bold_font="Helvetica-Bold", shaping=False,
         paragraph=lambda x: Paragraph(str(x), getSampleStyleSheet()["BodyText"])):
    data = [[cell if isinstance(cell, Paragraph) else paragraph(cell, header and i == 0) for cell in row]
            for i, row in enumerate(data)]
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    st = [("FONTSIZE", (0, 0), (-1, -1), 8), ("FONTNAME", (0, 0), (-1, -1), font_name), ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
          ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]
    if shaping:
        st.append(("SHAPING", (0, 0), (-1, -1), 1))
    if header:
        st += [("BACKGROUND", (0, 0), (-1, 0), GREEN), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
               ("FONTNAME", (0, 0), (-1, 0), bold_font)]
    t.setStyle(TableStyle(st))
    return t


def build_pdf(ov: dict, history: list[dict], timeline: list[dict], focus: dict, alerts: list[dict],
              explanation: dict | None, comparison: dict | None, language: str = "en") -> bytes:
    """ov=overview, focus=investigation summary of the selected transaction."""
    bengali = language == "bn"
    font_name, bold_font = "Helvetica", "Helvetica-Bold"
    if bengali:
        from reportlab.pdfbase.pdfmetrics import registerFontFamily
        from reportlab.pdfbase.ttfonts import TTFont as ReportLabTTFont

        font_name, bold_font = "LandGuardBengali", "LandGuardBengali-Bold"
        registered = set(pdfmetrics.getRegisteredFontNames())
        if font_name not in registered:
            pdfmetrics.registerFont(ReportLabTTFont(font_name, str(FONT_DIR / "LandGuardBangla-Regular.ttf")))
            pdfmetrics.registerFont(ReportLabTTFont(bold_font, str(FONT_DIR / "LandGuardBangla-Bold.ttf")))
            registerFontFamily(font_name, normal=font_name, bold=bold_font, italic=font_name, boldItalic=bold_font)
        if not pdfmetrics.getFont(font_name).shapable:
            raise RuntimeError("Bengali PDF text shaping is unavailable. Install the reportlab shaping extra.")

    tr = _translate if bengali else str
    shaping = 1 if bengali else 0
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
                            title=f"{tr('ভূমি প্রহরী Investigation Report')} {ov['parcel_id']}")
    ss = getSampleStyleSheet()
    H1 = ParagraphStyle("h1", parent=ss["Title"], fontName=bold_font, textColor=GREEN, fontSize=18, alignment=0, spaceAfter=2, shaping=shaping)
    H2 = ParagraphStyle("h2", parent=ss["Heading2"], fontName=bold_font, textColor=GREEN, fontSize=11, spaceBefore=10, spaceAfter=4, shaping=shaping)
    B = ParagraphStyle("b", parent=ss["BodyText"], fontName=font_name, fontSize=8.5, leading=11, shaping=shaping)
    SM = ParagraphStyle("sm", parent=B, fontSize=7.5, textColor=colors.HexColor("#475569"))
    def P(text, st=B, bold=False, translate=True):
        translated = tr(text) if translate else str(text)
        if not bengali:
            return Paragraph(translated.replace("&", "&amp;").replace("<", "&lt;"), st)
        translated = _bn_text(translated)
        bn_font = bold_font if bold or st.fontName == bold_font else font_name
        return Paragraph(_font_markup(translated, bn_font), st)
    def cell_paragraph(text, bold=False):
        style = ParagraphStyle("cell", parent=B, fontSize=8, leading=10, fontName=bold_font if bold else font_name)
        return P(text, style, bold)
    tbl = lambda data, widths=None, header=True: _tbl(data, widths, header, font_name, bold_font, shaping, cell_paragraph)
    f = []
    f.append(P("ভূমি প্রহরী Investigation Report", H1, True))
    f.append(P(f"Generated {datetime.now():%d %b %Y %H:%M} · Synthetic hackathon data · Decision-support only", SM))
    f.append(Spacer(1, 4))
    f.append(P("This report lists potential inconsistencies found by automated checks. It does not determine legal ownership "
               "and does not state that any person or transaction is fraudulent. Final decisions rest with authorised human officials.", SM))

    f.append(P("1. Parcel information", H2, True))
    f.append(tbl([["Parcel ID", ov["parcel_id"], "Integrity status", ov["integrity_status"]],
                   ["District / Upazila", f"{ov['district']} / {ov['upazila']}", "Mouza", ov["mouza"]],
                   ["Khatian / Dag", f"{ov['khatian_no']} / {ov['dag_no']}", "Total area", f"{ov['total_area_decimal']:g} decimal"],
                   ["Current owner", f"{ov['current_owner_name']} ({ov['current_owner_id']})", "Recorded share",
                    "n/a" if ov["recorded_share"] is None else f"{ov['recorded_share']:g}%"],
                   ["Ownership status", ov["ownership_status"], "Registration / Mutation", f"{ov['registration_status']} / {ov['mutation_status']}"]],
                  [30 * mm, 55 * mm, 35 * mm, 52 * mm], header=False))

    f.append(P("2. Investigation priority", H2, True))
    f.append(P(f"Transaction {focus['transaction_id']}: Investigation Priority Score {focus['priority_score']:.0f} / 100 "
               f"({focus['priority_level']}). This is a prioritisation score for human review, not a fraud probability."))
    f.append(P("Recommended action: Human Review Required", ParagraphStyle("r", parent=B, textColor=RED, fontName=bold_font, shaping=shaping), True))

    f.append(P("3. Ownership history", H2, True))
    rows = [["Date", "Owner", "From", "Area", "Share %", "Txn", "Status"]]
    for e in history:
        rows.append([e["date"], e["owner_name"], e.get("from_name", "—"), e.get("area", "—"), e.get("share", "—"),
                     e.get("transaction_id", "—"), e.get("transaction_status", "Original")])
    f.append(tbl(rows, [22 * mm, 38 * mm, 38 * mm, 15 * mm, 15 * mm, 24 * mm, 25 * mm]))

    f.append(P("4. Transaction timeline (transaction, registration, mutation)", H2, True))
    rows = [["Date", "Event", "Parties", "Detail", "Flag"]]
    for e in timeline[:40]:
        rows.append([e["date"], e["kind"], P(e["label"], B), P(e["detail"], SM), "review" if e["conflict"] else ""])
    f.append(tbl(rows, [22 * mm, 22 * mm, 50 * mm, 62 * mm, 14 * mm]))

    if comparison:
        f.append(P(f"5. Registration vs mutation — {focus['transaction_id']}", H2, True))
        rows = [["Field", "Registration", "Mutation", "Result"]]
        for r in comparison["rows"]:
            rows.append([r["field"], P(r["registration"], SM), P(r["mutation"], SM),
                         "—" if r["match"] is None else ("match" if r["match"] else "MISMATCH")])
        f.append(tbl(rows, [38 * mm, 55 * mm, 55 * mm, 22 * mm]))

    f.append(P("6. Detected issues and evidence", H2, True))
    if not alerts:
        f.append(P("No integrity signals were raised for this parcel."))
    for a in alerts:
        f.append(P(f"{a['transaction_id']} · {a['priority_level']} ({a['priority_score']:.0f})", ParagraphStyle("t", parent=B, fontName=bold_font, shaping=shaping), True))
        for e in a["evidence"]:
            msg = _translate_evidence(e) if bengali else e["message"]
            title = tr(e["title"])
            f.append(P(f"• {title}: {msg}", translate=False))
        f.append(Spacer(1, 3))

    if explanation and explanation.get("increasing"):
        f.append(P(f"7. AI explanation — {focus['transaction_id']}", H2, True))
        rows = [["Contributing factor", "SHAP", "Plain-language note"]]
        for x in explanation["increasing"]:
            rows.append([P(x["label"], SM), f"{x['shap_value']:+.2f}", P(x["explanation"], SM)])
        f.append(tbl(rows, [50 * mm, 15 * mm, 100 * mm]))
        f.append(P(explanation["note"], SM))

    f.append(P("8. Recommendation", H2, True))
    f.append(P("Human Review Required. An authorised officer should verify the source documents (deed, mutation file, khatian) "
               "before any administrative decision is taken."))
    doc.build(f)
    return buf.getvalue()
