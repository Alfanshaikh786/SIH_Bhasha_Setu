"""
Mundari Translation Provider & Registry for Bhasha Setu Research.

Manages capabilities, routing, and execution for:
- Direct Hindi <-> Mundari (Retrieval baseline / Neural candidate)
- 2-Hop Pivot English <-> Mundari via Hindi:
    English -> Hindi -> Mundari  (Route: ["en-hi", "hi-unr"])
    Mundari -> Hindi -> English  (Route: ["unr-hi", "hi-en"])

Transparency & Safety:
- Never hides pivot routing; UI metadata explicitly states 'Translation Route: English -> Hindi -> Mundari'.
- Clearly flags status as 'experimental' or 'pivot_translation'.
- Distinguishes translation types: Direct, Retrieval, Model, Pivot, Unavailable.
"""

import os
import sys
from typing import Dict, Any, Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from script_detector import detect_script
from retrieval_baseline import MundariRetrievalBaseline


class MundariTranslationProvider:
    def __init__(self, retrieval_threshold: float = 0.85):
        """
        Initialize the research translation provider.
        """
        self.provider_id = "MundariMTResearchProvider"
        self.retrieval_baseline: Optional[MundariRetrievalBaseline] = None
        self.retrieval_threshold = retrieval_threshold

        # Initialize retrieval baseline lazily or directly
        try:
            self.retrieval_baseline = MundariRetrievalBaseline(similarity_threshold=retrieval_threshold)
        except Exception as e:
            print(f"Warning: Could not initialize retrieval baseline: {e}")

    def get_capabilities(self) -> Dict[str, Any]:
        """Return honest capability metadata."""
        return {
            "provider": self.provider_id,
            "version": "0.4.0-research",
            "capabilities": {
                "hi-unr": {
                    "type": "retrieval_or_model",
                    "status": "experimental",
                    "direct": True,
                    "supported_scripts": ["Deva"],
                    "description": "Direct Hindi to Mundari translation (Retrieval baseline / Neural adapter)"
                },
                "unr-hi": {
                    "type": "retrieval_or_model",
                    "status": "experimental",
                    "direct": True,
                    "supported_scripts": ["Deva"],
                    "description": "Direct Mundari to Hindi translation (Retrieval baseline / Neural adapter)"
                },
                "en-unr": {
                    "type": "pivot",
                    "route": ["en-hi", "hi-unr"],
                    "status": "experimental",
                    "direct": False,
                    "description": "Pivot translation: English -> Hindi -> Mundari"
                },
                "unr-en": {
                    "type": "pivot",
                    "route": ["unr-hi", "hi-en"],
                    "status": "experimental",
                    "direct": False,
                    "description": "Pivot translation: Mundari -> Hindi -> English"
                }
            }
        }

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        pivot_hindi_translation: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Translate text across supported routes with full provenance metadata.

        Args:
            text: Input sentence.
            source_lang: 'hi', 'unr', or 'en'.
            target_lang: 'hi', 'unr', or 'en'.
            pivot_hindi_translation: For English -> Mundari, simulated or upstream en-hi output.

        Returns:
            Dict containing translation, route, method, status, script_info, and confidence.
        """
        s_lang = source_lang.lower().strip()
        t_lang = target_lang.lower().strip()
        route_key = f"{s_lang}-{t_lang}"

        # 1. Script detection on input
        script_info = detect_script(text)
        if script_info["possible_santali_contamination"]:
            return {
                "translation": "Error: Input contains Ol Chiki characters (Santali script). Mundari does not use Ol Chiki.",
                "status": "error",
                "method": "rejected_contamination",
                "route": [route_key],
                "confidence": 0.0,
                "script_info": script_info
            }

        # 2. Direct Routes: Hindi <-> Mundari
        if route_key in ["hi-unr", "unr-hi"]:
            if self.retrieval_baseline:
                res = self.retrieval_baseline.translate(text, source_lang=s_lang, target_lang=t_lang)
                return {
                    "translation": res["translation"],
                    "status": res["status"],
                    "method": res["method"],
                    "type": "direct_retrieval",
                    "route": [route_key],
                    "confidence": res["similarity"],
                    "source_language": s_lang,
                    "target_language": t_lang,
                    "script_info": script_info,
                    "matched_sentence": res.get("matched_source_sentence", "")
                }
            else:
                return {
                    "translation": "Retrieval baseline not initialized.",
                    "status": "unavailable",
                    "method": "none",
                    "type": "unavailable",
                    "route": [route_key],
                    "confidence": 0.0,
                    "script_info": script_info
                }

        # 3. Pivot Route: English -> Mundari (via Hindi)
        elif route_key == "en-unr":
            # If an external or simulated en-hi translation is provided, use it
            intermediate_hi = pivot_hindi_translation or f"[Simulated en->hi translation for: {text}]"
            unr_res = self.translate(intermediate_hi, source_lang="hi", target_lang="unr")

            return {
                "translation": unr_res["translation"],
                "status": unr_res["status"],
                "method": f"pivot_via_hindi ({unr_res['method']})",
                "type": "pivot_translation",
                "route": ["en-hi", "hi-unr"],
                "intermediate_pivot_text": intermediate_hi,
                "confidence": unr_res["confidence"],
                "source_language": "en",
                "target_language": "unr",
                "script_info": script_info,
                "disclaimer": "Translation Route: English -> Hindi -> Mundari. Not a direct English-Mundari translation."
            }

        # 4. Pivot Route: Mundari -> English (via Hindi)
        elif route_key == "unr-en":
            # First hop: unr -> hi
            hi_res = self.translate(text, source_lang="unr", target_lang="hi")
            intermediate_hi = hi_res["translation"]

            if hi_res["status"] != "retrieved":
                final_en = "Translation unavailable (hop 1 unr->hi did not match)."
                status = "unavailable"
            else:
                final_en = f"[Simulated hi->en translation for: {intermediate_hi}]"
                status = "retrieved"

            return {
                "translation": final_en,
                "status": status,
                "method": f"pivot_via_hindi ({hi_res['method']})",
                "type": "pivot_translation",
                "route": ["unr-hi", "hi-en"],
                "intermediate_pivot_text": intermediate_hi,
                "confidence": hi_res["confidence"],
                "source_language": "unr",
                "target_language": "en",
                "script_info": script_info,
                "disclaimer": "Translation Route: Mundari -> Hindi -> English. Not a direct Mundari-English translation."
            }

        # 5. Unsupported
        else:
            return {
                "translation": f"Unsupported language pair: {source_lang} -> {target_lang}",
                "status": "unavailable",
                "method": "unsupported",
                "type": "unavailable",
                "route": [route_key],
                "confidence": 0.0,
                "script_info": script_info
            }


def run_self_test():
    print("=" * 65)
    print("MUNDARI TRANSLATION PROVIDER SELF-TEST")
    print("=" * 65)

    provider = MundariTranslationProvider(retrieval_threshold=0.85)

    print("\n[Capabilities]")
    import pprint
    pprint.pprint(provider.get_capabilities())

    print("\n--- Test 1: Direct Hindi -> Mundari (Exact) ---")
    query1 = "हिमाचल प्रदेश के ऊना की 7 साल की बेटी नलिनी सिंह का कमाल देखिए।"
    res1 = provider.translate(query1, "hi", "unr")
    print("Query:", query1)
    print("Response:", res1)

    print("\n--- Test 2: Pivot English -> Mundari (Route: en -> hi -> unr) ---")
    query2 = "Look at the wonder of Nalini Singh."
    simulated_hi = "हिमाचल प्रदेश के ऊना की 7 साल की बेटी नलिनी सिंह का कमाल देखिए।"
    res2 = provider.translate(query2, "en", "unr", pivot_hindi_translation=simulated_hi)
    print("Query:", query2)
    print("Response:", res2)

    print("\n--- Test 3: Ol Chiki Contamination Rejection ---")
    query3 = "ᱚᱛᱞᱤ ᱟᱢᱤ"
    res3 = provider.translate(query3, "unr", "hi")
    print("Query:", query3)
    print("Response:", res3)


if __name__ == "__main__":
    run_self_test()
