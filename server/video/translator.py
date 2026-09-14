"""
Bilingual and Multilingual Translation Bridge for Video Subtitling
Queries SQLite translations.db, phrase banks, and web neural bridges.
Never fabricates translations. Rejects Mundari and Ho under Phase 1 scope restriction.
"""

import os
import re
import json
import sqlite3
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional, Tuple
from pathlib import Path


# Project Root SQLite Database
DB_PATH = Path(__file__).resolve().parent.parent.parent / "translations.db"

# Verified phrase bank for high-frequency Santali <-> Hindi <-> English conversational phrases
PHRASE_BANK = {
    "hello": {"hin": "नमस्ते", "sat": "ᱡᱚᱦᱟᱨ", "eng": "Hello"},
    "greetings": {"hin": "नमस्ते", "sat": "ᱡᱚᱦᱟᱨ", "eng": "Greetings"},
    "namaste": {"hin": "नमस्ते", "sat": "ᱡᱚᱦᱟᱨ", "eng": "Hello"},
    "welcome": {"hin": "स्वागत है", "sat": "ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ", "eng": "Welcome"},
    "good morning": {"hin": "सुप्रभात", "sat": "ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ", "eng": "Good morning"},
    "thank you": {"hin": "धन्यवाद", "sat": "ᱥᱟᱨᱦᱟᱣ", "eng": "Thank you"},
    "water": {"hin": "पानी", "sat": "ᱫᱟᱜ", "eng": "Water"},
    "hospital": {"hin": "अस्पताल", "sat": "ᱦᱟᱥᱯᱟᱛᱟᱞ", "eng": "Hospital"},
    "village": {"hin": "गाँव", "sat": "ᱟᱹᱛᱩ", "eng": "Village"},
    "forest": {"hin": "जंगल", "sat": "ᱵᱤᱨ", "eng": "Forest"},
    "how are you": {"hin": "आप कैसे हैं?", "sat": "ᱟᱢ ᱫᱚ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟ?", "eng": "How are you?"},
    "what is your name": {"hin": "आपका नाम क्या है?", "sat": "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?", "eng": "What is your name?"},
    "i am fine": {"hin": "मैं ठीक हूँ।", "sat": "ᱤᱧ ᱫᱚ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ᱾", "eng": "I am fine."}
}


def normalize_lang_code(code: str) -> str:
    c = code.strip().lower()
    if c in ["en", "eng", "english"]:
        return "eng"
    if c in ["hi", "hin", "hindi"]:
        return "hin"
    if c in ["sat", "santali", "ol_chiki"]:
        return "sat"
    if c in ["hoc", "ho"]:
        return "hoc"
    if c in ["unr", "mundari"]:
        return "unr"
    return c


def query_sqlite_db(text: str, src_lang: str, tgt_lang: str) -> Optional[Tuple[str, str]]:
    """
    Searches translations.db for exact or case-insensitive sentence matches.
    Returns (translated_text, romanized_optional) or None.
    """
    if not DB_PATH.exists():
        return None

    raw_lower = text.strip().lower()
    cleaned = re.sub(r'[!?,.:;।॥]+$', '', raw_lower).strip()
    with_dot = f"{cleaned}."

    src_col = "english" if src_lang == "eng" else "hindi" if src_lang == "hin" else "santali" if src_lang == "sat" else None
    tgt_col = "english" if tgt_lang == "eng" else "hindi" if tgt_lang == "hin" else "santali" if tgt_lang == "sat" else None

    if not src_col or not tgt_col:
        return None

    try:
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        query = f"SELECT {tgt_col}, santali_roman FROM translations WHERE LOWER(TRIM({src_col})) IN (?, ?, ?) LIMIT 1"
        c.execute(query, (raw_lower, cleaned, with_dot))
        row = c.fetchone()
        conn.close()
        if row and row[0] and row[0].strip():
            return row[0].strip(), (row[1].strip() if row[1] else "")
    except Exception:
        pass

    return None


# In-memory translation cache to guarantee ultra-fast responses and prevent redundant API hits
_ONLINE_TRANSLATION_CACHE: Dict[str, Dict[str, str]] = {}


def fetch_google_bilingual_santali(text: str, src_lang: str) -> Optional[Tuple[str, str]]:
    """
    Queries Google Translate API with resilient multi-client rotation for BOTH:
      1. Santali Ol Chiki (tl=sat) -> authentic native Ol Chiki script
      2. Santali Latin (tl=sat-Latn) -> authentic Romanized phonetic pronunciation
    Returns (ol_chiki_text, romanized_text) or None.
    """
    code_map = {"eng": "en", "en": "en", "hin": "hi", "hi": "hi", "sat": "sat", "auto": "auto"}
    s_code = code_map.get(src_lang, src_lang)

    cache_key = f"{s_code}->sat::{text.strip().lower()}"
    if cache_key in _ONLINE_TRANSLATION_CACHE:
        c = _ONLINE_TRANSLATION_CACHE[cache_key]
        return c["ol_chiki"], c["romanized"]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.co.in/"
    }

    ol_chiki = None
    romanized = ""

    # Resilient client rotation
    clients = ["dict-chrome-ex", "tw-ob", "gtx"]

    # 1. Query Ol Chiki (tl=sat)
    for client in clients:
        try:
            url_sat = f"https://translate.googleapis.com/translate_a/single?client={client}&sl={s_code}&tl=sat&dt=t&q={urllib.parse.quote(text)}"
            req_sat = urllib.request.Request(url_sat, headers=headers)
            with urllib.request.urlopen(req_sat, timeout=5.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                        ol_chiki = "".join(part[0] for part in data[0] if isinstance(part, list) and len(part) > 0 and part[0]).strip()
                        if ol_chiki:
                            break
        except Exception:
            continue

    # 2. Query Latin Romanized (tl=sat-Latn)
    for client in clients:
        try:
            url_latn = f"https://translate.googleapis.com/translate_a/single?client={client}&sl={s_code}&tl=sat-Latn&dt=t&q={urllib.parse.quote(text)}"
            req_latn = urllib.request.Request(url_latn, headers=headers)
            with urllib.request.urlopen(req_latn, timeout=5.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                        romanized = "".join(part[0] for part in data[0] if isinstance(part, list) and len(part) > 0 and part[0]).strip()
                        if romanized:
                            break
        except Exception:
            continue

    if ol_chiki:
        _ONLINE_TRANSLATION_CACHE[cache_key] = {"ol_chiki": ol_chiki, "romanized": romanized}
        return ol_chiki, romanized

    return None


def fetch_online_neural_bridge(text: str, src_lang: str, tgt_lang: str) -> Optional[str]:
    """
    Queries Google Translate web bridge for mainstream language pairs (hin <-> eng, eng -> sat, etc.)
    with a strict timeout to prevent hangs and multi-client rotation.
    """
    code_map = {"eng": "en", "en": "en", "hin": "hi", "hi": "hi", "sat": "sat"}
    s_code = code_map.get(src_lang, src_lang)
    t_code = code_map.get(tgt_lang, tgt_lang)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.co.in/"
    }

    for client in ["dict-chrome-ex", "tw-ob", "gtx"]:
        try:
            url = f"https://translate.googleapis.com/translate_a/single?client={client}&sl={s_code}&tl={t_code}&dt=t&q={urllib.parse.quote(text)}"
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                        translated = "".join(part[0] for part in data[0] if isinstance(part, list) and len(part) > 0 and part[0])
                        translated = translated.strip()
                        if translated and translated.lower() != text.lower():
                            return translated
        except Exception:
            continue

    return None


from server.video.domain_glossary import (
    match_domain_term,
    detect_domain_context,
    preserve_numbers_and_measures,
    handle_proper_nouns
)


def translate_subtitle_text(
    text: str,
    source_lang: str,
    target_lang: str,
    domain: Optional[str] = None
) -> Dict[str, Any]:
    """
    Translates a single subtitle sentence across verified tiers:
      1. Online Google Translate Bilingual (Santali Ol Chiki + Latin phonetic pronunciation)
      2. phrase_bank: Verified high-frequency greeting / conversational anchors
      3. domain_glossary: Curated domain terminology (Education, Agriculture, Health, Government, Community)
      4. dictionary: Curated 6,780-row SQLite repository
      5. untranslated: Original text preserved safely (flagged for review)

    Invariants:
    - Never fabricates sentences or words.
    - Numbers, percentages, dates, and medical dosages are strictly preserved.
    - Rejects Mundari and Ho under Phase 1 scope restriction.
    """
    src = normalize_lang_code(source_lang)
    tgt = normalize_lang_code(target_lang)
    trimmed = text.strip()

    if not trimmed:
        return {"text": "", "translated_text": "", "romanized_text": "", "source": "none", "success": True}

    if src == tgt:
        return {"text": trimmed, "translated_text": trimmed, "romanized_text": "", "source": "identity", "success": True}

    # Scope Restriction (Mundari & Ho remain disabled)
    if tgt in ["unr", "mundari"]:
        return {
            "text": trimmed,
            "translated_text": trimmed,
            "romanized_text": "",
            "source": "unsupported",
            "success": False,
            "error": "Mundari translation is scheduled for Phase 2. This phase supports Santali (sat)."
        }

    if tgt in ["hoc", "ho"]:
        return {
            "text": trimmed,
            "translated_text": trimmed,
            "romanized_text": "",
            "source": "unsupported",
            "success": False,
            "error": "Ho translation is scheduled for Phase 3. This phase supports Santali (sat)."
        }

    inferred_domain = domain or detect_domain_context(trimmed) or "GENERAL"

    # Tier 1 (Online Primary): Google Translate API for Santali (Ol Chiki + Latin Pronunciation)
    if tgt == "sat":
        sat_pair = fetch_google_bilingual_santali(trimmed, src)
        if sat_pair and sat_pair[0]:
            out_text = preserve_numbers_and_measures(trimmed, sat_pair[0])
            roman_text = sat_pair[1] or ""
            return {
                "text": out_text,
                "translated_text": out_text,
                "romanized_text": roman_text,
                "source": "google_translate_online",
                "domain": inferred_domain,
                "success": True
            }
    else:
        # Non-Santali target languages (e.g. Hindi, English)
        online = fetch_online_neural_bridge(trimmed, src, tgt)
        if online:
            out_text = preserve_numbers_and_measures(trimmed, online)
            return {
                "text": out_text,
                "translated_text": out_text,
                "romanized_text": "",
                "source": "google_translate_online",
                "domain": inferred_domain,
                "success": True
            }

    # Tier 2 (Fallback / Offline): Exact Phrase Bank Match
    key = trimmed.lower().strip(".!?|।")
    if key in PHRASE_BANK and tgt in PHRASE_BANK[key]:
        out_text = preserve_numbers_and_measures(trimmed, PHRASE_BANK[key][tgt])
        return {
            "text": out_text,
            "translated_text": out_text,
            "romanized_text": "",
            "source": "phrase_bank",
            "domain": "COMMUNITY" if key in ["hello", "namaste", "greetings", "welcome"] else "GENERAL",
            "success": True
        }

    # Tier 3: Verified Domain Glossary Match (Education, Agriculture, Health, Government, Community)
    domain_match = match_domain_term(trimmed, src, tgt, domain_hint=domain)
    if domain_match:
        out_text = preserve_numbers_and_measures(trimmed, domain_match["text"])
        return {
            "text": out_text,
            "translated_text": out_text,
            "romanized_text": "",
            "source": "domain_glossary",
            "domain": domain_match.get("domain", "GENERAL"),
            "verification_status": domain_match.get("verification_status", "verified"),
            "success": True
        }

    # Proper Noun Handling (people, villages, districts, government schemes)
    pn = handle_proper_nouns(trimmed)
    if pn.get("is_proper_noun") and pn.get("target_text") and tgt == "sat":
        out_text = preserve_numbers_and_measures(trimmed, pn["target_text"])
        return {
            "text": out_text,
            "translated_text": out_text,
            "romanized_text": pn.get("latin_phonetic", ""),
            "source": "proper_noun",
            "domain": "COMMUNITY" if pn.get("type") in ["person", "place"] else "GOVERNMENT",
            "review_required": True,
            "success": True
        }

    # Tier 4: Classroom SQLite Database (translations.db - 6,780 rows)
    db_match = query_sqlite_db(trimmed, src, tgt)
    if db_match and db_match[0]:
        out_text = preserve_numbers_and_measures(trimmed, db_match[0])
        return {
            "text": out_text,
            "translated_text": out_text,
            "romanized_text": db_match[1] or "",
            "roman": db_match[1] or "",
            "source": "dictionary",
            "domain": inferred_domain,
            "success": True
        }

    # Tier 5: If all tiers fail, preserve original text and mark untranslated
    return {
        "text": trimmed,
        "translated_text": trimmed,
        "romanized_text": "",
        "source": "untranslated",
        "domain": inferred_domain,
        "review_required": True,
        "success": False,
        "error": f"No verified translation entry found for '{trimmed}' from {src} to {tgt}."
    }


