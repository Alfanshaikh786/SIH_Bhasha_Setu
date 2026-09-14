"""
Quality & Subtitle Readiness Scoring Engine
Calculates honest, weighted readiness scores for low-resource tribal language subtitling.
Enforces safety invariants: Low ASR confidence (< 40%) strictly caps status to NEEDS_REVIEW
and never permits an unverified pipeline to display 'EXCELLENT' or '98% Fidelity'.
"""

from typing import List, Dict, Any, Optional


class QualityState:
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    BLOCKED = "BLOCKED"


class SubtitleReadinessEvaluator:
    """
    Evaluates subtitle readiness across 6 distinct dimensions:
      1. Recognition Confidence (Weight: 30)
      2. Translation Verification (Weight: 25)
      3. Timing Synchronization (Weight: 15)
      4. Subtitle Readability & CPS (Weight: 10)
      5. Script & Unicode Integrity (Weight: 10)
      6. Timeline Coverage (Weight: 10)
    """

    @staticmethod
    def evaluate(
        cues: List[Dict[str, Any]],
        validation_res: Dict[str, Any],
        media_coverage: Dict[str, Any]
    ) -> Dict[str, Any]:
        total_cues = len(cues)
        if total_cues == 0:
            # If 0 cues and media is purely instrumental, timeline is valid and clean
            is_instrumental = media_coverage.get("instrumental_sec", 0.0) > 0 and media_coverage.get("vocal_total_sec", 0.0) == 0
            if is_instrumental:
                return {
                    "score": 100,
                    "status": QualityState.GOOD,
                    "cap_reason": None,
                    "requires_review": False,
                    "pending_review_count": 0,
                    "breakdown": {
                        "recognition": 100,
                        "translation": 100,
                        "timing": 100,
                        "readability": 100,
                        "unicode": 100,
                        "coverage": 100
                    },
                    "category_issues": {
                        "recognition": 0,
                        "translation": 0,
                        "timing": 0,
                        "readability": 0,
                        "unicode": 0
                    },
                    "human_verified_count": 0,
                    "total_cues": 0
                }
            else:
                return {
                    "score": 50,
                    "status": QualityState.NEEDS_REVIEW,
                    "cap_reason": "No subtitles present for media",
                    "requires_review": True,
                    "pending_review_count": 0,
                    "breakdown": {
                        "recognition": 0,
                        "translation": 0,
                        "timing": 100,
                        "readability": 100,
                        "unicode": 100,
                        "coverage": 0
                    },
                    "category_issues": {
                        "recognition": 0,
                        "translation": 0,
                        "timing": 0,
                        "readability": 0,
                        "unicode": 0
                    },
                    "human_verified_count": 0,
                    "total_cues": 0
                }

        # 1. Dimension 1: Recognition Confidence (30 pts)
        asr_confidences = []
        low_conf_count = 0
        for c in cues:
            conf = c.get("confidence")
            if conf is None:
                conf = c.get("recognition_confidence")
            if conf is None:
                conf = 0.85
            asr_confidences.append(float(conf))
            if float(conf) < 0.65:
                low_conf_count += 1

        avg_asr_conf = sum(asr_confidences) / total_cues if asr_confidences else 0.7
        # Scale to 0-100
        recognition_pct = max(0, min(100, int(avg_asr_conf * 100)))

        # 2. Dimension 2: Translation Verification (25 pts)
        human_verified_count = 0
        stale_count = 0
        machine_only_count = 0
        for c in cues:
            t_status = str(c.get("translation_status", "")).upper()
            r_status = str(c.get("review_status", "")).upper()
            is_stale = bool(c.get("is_stale", False)) or t_status == "STALE"

            if is_stale:
                stale_count += 1
            elif r_status in ("HUMAN_VERIFIED", "APPROVED") or t_status == "HUMAN_VERIFIED":
                human_verified_count += 1
            else:
                machine_only_count += 1

        if total_cues > 0:
            translation_pct = int(((human_verified_count * 1.0) + (machine_only_count * 0.7) - (stale_count * 0.5)) / total_cues * 100)
            translation_pct = max(0, min(100, translation_pct))
        else:
            translation_pct = 100

        # 3. Dimension 3: Timing Synchronization (15 pts)
        timing_errors = len(validation_res.get("fatal_errors", []))
        timing_warnings = len([w for w in validation_res.get("warnings", []) if "overlap" in w.lower() or "duration" in w.lower()])
        timing_pct = max(0, 100 - (timing_errors * 35) - (timing_warnings * 10))

        # 4. Dimension 4: Readability & CPS (10 pts)
        readability_warnings = len([w for w in validation_res.get("warnings", []) if "line" in w.lower() or "cps" in w.lower() or "character" in w.lower()])
        readability_pct = max(0, 100 - (readability_warnings * 10))

        # 5. Dimension 5: Script & Unicode Integrity (10 pts)
        unicode_valid = validation_res.get("valid", True) and not any("unicode" in err.lower() for err in validation_res.get("fatal_errors", []))
        unicode_pct = 100 if unicode_valid else 20

        # 6. Dimension 6: Timeline Coverage (10 pts)
        timeline_cov = media_coverage.get("timeline_coverage_pct", 100.0)
        coverage_pct = min(100, int(timeline_cov))

        # Calculate weighted composite score
        raw_score = (
            (recognition_pct * 0.30) +
            (translation_pct * 0.25) +
            (timing_pct * 0.15) +
            (readability_pct * 0.10) +
            (unicode_pct * 0.10) +
            (coverage_pct * 0.10)
        )
        final_score = int(round(raw_score))

        # Category issue grouping
        category_issues = {
            "recognition": low_conf_count,
            "translation": machine_only_count + (stale_count * 2),
            "timing": timing_errors + timing_warnings,
            "readability": readability_warnings,
            "unicode": 0 if unicode_valid else 1
        }
        pending_review_count = low_conf_count + stale_count

        # Safety rules & Status Determination
        cap_reason = None
        if timing_errors > 0 or not unicode_valid:
            status = QualityState.BLOCKED
            cap_reason = "Fatal timing or Unicode invariants violated"
        elif stale_count > 0:
            status = QualityState.NEEDS_REVIEW
            cap_reason = f"{stale_count} cues have outdated translations requiring regeneration"
        elif avg_asr_conf < 0.40:
            # Low acoustic confidence (< 40%) MUST cap to NEEDS_REVIEW
            status = QualityState.NEEDS_REVIEW
            cap_reason = f"Low acoustic ASR confidence ({int(avg_asr_conf * 100)}%) requires human verification before publishing"
            final_score = min(final_score, 68)  # Cap score as specified in Section 34
        elif low_conf_count > 0 or machine_only_count > 0 or timing_warnings > 0:
            status = QualityState.NEEDS_REVIEW
            cap_reason = "Human review pending for machine-generated / low-confidence cues"
        elif final_score >= 88 and human_verified_count == total_cues:
            status = QualityState.EXCELLENT
        else:
            status = QualityState.GOOD

        return {
            "score": final_score,
            "status": status,
            "cap_reason": cap_reason,
            "requires_review": status in (QualityState.NEEDS_REVIEW, QualityState.BLOCKED),
            "pending_review_count": pending_review_count,
            "human_verified_count": human_verified_count,
            "total_cues": total_cues,
            "breakdown": {
                "recognition": recognition_pct,
                "translation": translation_pct,
                "timing": timing_pct,
                "readability": readability_pct,
                "unicode": unicode_pct,
                "coverage": coverage_pct
            },
            "category_issues": category_issues
        }
