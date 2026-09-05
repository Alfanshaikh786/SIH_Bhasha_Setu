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

    cleaned = text.strip().lower()
    cleaned = re.sub(r'[!?,.:;।॥]+$', '', cleaned).strip()

    src_col = "english" if src_lang == "eng" else "hindi" if src_lang == "hin" else "santali" if src_lang == "sat" else None
    tgt_col = "english" if tgt_lang == "eng" else "hindi" if tgt_lang == "hin" else "santali" if tgt_lang == "sat" else None

    if not src_col or not tgt_col:
        return None

    try:
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        query = f"SELECT {tgt_col}, santali_roman FROM translations WHERE LOWER(TRIM({src_col})) = ? LIMIT 1"
        c.execute(query, (cleaned,))
        row = c.fetchone()
        conn.close()
        if row and row[0] and row[0].strip():
            return row[0].strip(), (row[1].strip() if row[1] else "")
    except Exception:
        pass

    return None


def fetch_online_neural_bridge(text: str, src_lang: str, tgt_lang: str) -> Optional[str]:
    """
    Queries Google Translate web bridge for mainstream language pairs (hin <-> eng, eng -> sat, etc.)
    with a strict timeout to prevent hangs.
    """
    code_map = {"eng": "en", "hin": "hi", "sat": "sat"}
    s_code = code_map.get(src_lang, src_lang)
    t_code = code_map.get(tgt_lang, tgt_lang)

    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={s_code}&tl={t_code}&dt=t&q={urllib.parse.quote(text)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                    translated = "".join(part[0] for part in data[0] if isinstance(part, list) and len(part) > 0 and part[0])
                    translated = translated.strip()
                    if translated and translated.lower() != text.lower():
                        return translated
    except Exception:
        pass

    return None


def translate_subtitle_text(
    text: str,
    source_lang: str,
    target_lang: str
) -> Dict[str, Any]:
    """
    Translates a single subtitle sentence across verified tiers.
    Strictly forbids fabricating sentences.
    Rejects Mundari and Ho under Phase 1 scope.
    """
    src = normalize_lang_code(source_lang)
    tgt = normalize_lang_code(target_lang)
    trimmed = text.strip()

    if not trimmed:
        return {"text": "", "source": "none", "success": True}

    if src == tgt:
        return {"text": trimmed, "source": "identity", "success": True}

    # Scope Restriction for Phase 1
    if tgt in ["unr", "mundari"]:
        return {
            "text": trimmed,
            "source": "unsupported",
            "success": False,
            "error": "Mundari translation is scheduled for Phase 2. This phase supports Santali (sat)."
        }

    if tgt in ["hoc", "ho"]:
        return {
            "text": trimmed,
            "source": "unsupported",
            "success": False,
            "error": "Ho translation is scheduled for Phase 3. This phase supports Santali (sat)."
        }

    # Tier 1: Exact Phrase Bank Match
    key = trimmed.lower().strip(".!?|।")
    if key in PHRASE_BANK and tgt in PHRASE_BANK[key]:
        return {
            "text": PHRASE_BANK[key][tgt],
            "source": "phrase_bank",
            "success": True
        }

    # Tier 2: Classroom SQLite Database (translations.db - 6,780 rows)
    db_match = query_sqlite_db(trimmed, src, tgt)
    if db_match and db_match[0]:
        return {
            "text": db_match[0],
            "roman": db_match[1],
            "source": "database",
            "success": True
        }

    # Tier 3: Online Neural Bridge (Google Translate / Web bridge)
    online = fetch_online_neural_bridge(trimmed, src, tgt)
    if online:
        return {
            "text": online,
            "source": "neural_bridge",
            "success": True
        }

    # If all tiers fail, preserve original text and mark untranslated
    return {
        "text": trimmed,
        "source": "untranslated",
        "success": False,
        "error": f"No verified translation entry found for '{trimmed}' from {src} to {tgt}."
    }
