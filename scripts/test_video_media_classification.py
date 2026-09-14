"""
Tests for Media Classification, Timeline Coverage, Confidence Gating, and Stale Translation Invalidation.
"""

import os
import sys
import numpy as np

# Ensure root directory in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.video.media_classifier import MediaClassifier, MediaType, MediaRegion
from server.video.coverage import MediaCoverageAnalyzer
from server.video.quality import SubtitleReadinessEvaluator, QualityState
from server.video.timeline import SubtitleCue
from server.video.validator import validate_subtitles


def test_media_classification_and_coverage():
    print("\n--- Test 1: Media Classifier & Full Timeline Coverage ---")
    classifier = MediaClassifier()
    sr = 16000
    total_dur = 35.8

    # Simulate 35.8s audio: 0 to 24s is singing/vocals, 24 to 35.8s is instrumental
    total_samples = int(total_dur * sr)
    audio = np.zeros(total_samples, dtype=np.float32)

    # 0 to 24s: vocals + music (RMS ~ 0.08)
    vocal_end_sample = int(24.0 * sr)
    t = np.linspace(0, 24, vocal_end_sample, endpoint=False)
    audio[:vocal_end_sample] = 0.1 * np.sin(2 * np.pi * 440 * t)

    # 24 to 35.8s: instrumental (RMS ~ 0.12)
    inst_samples = total_samples - vocal_end_sample
    t_inst = np.linspace(24, 35.8, inst_samples, endpoint=False)
    audio[vocal_end_sample:] = 0.15 * np.sin(2 * np.pi * 220 * t_inst)

    # Mock ASR vocal segments from 0 to 24s
    mock_segments = [
        {"start": 0.0, "end": 4.6, "confidence": 0.34, "text": "song lyrics 1"},
        {"start": 4.8, "end": 8.0, "confidence": 0.34, "text": "song lyrics 2"},
        {"start": 8.2, "end": 14.0, "confidence": 0.34, "text": "song lyrics 3"},
        {"start": 14.2, "end": 24.0, "confidence": 0.34, "text": "song lyrics 4"}
    ]

    regions = classifier.analyze_audio_array(
        audio,
        sr=sr,
        asr_segments=mock_segments,
        total_duration=total_dur
    )

    print(f"Detected {len(regions)} regions across {total_dur}s:")
    for r in regions:
        print(f"  [{r.start:.1f}s -> {r.end:.1f}s] Type: {r.type} | Conf: {r.confidence:.2f} | RMS: {r.rms:.3f} | {r.notes}")

    coverage = MediaCoverageAnalyzer.compute_coverage(
        total_duration_sec=total_dur,
        media_regions=regions,
        subtitle_cues=mock_segments
    )

    print("\nCoverage Summary:")
    for k, v in coverage.items():
        print(f"  {k}: {v}")

    # Invariants
    assert coverage["timeline_coverage_pct"] == 100.0, f"Expected 100% timeline coverage, got {coverage['timeline_coverage_pct']}"
    assert coverage["vocal_total_sec"] >= 23.5, f"Expected ~24s vocals, got {coverage['vocal_total_sec']}"
    assert coverage["instrumental_sec"] >= 11.5, f"Expected ~11.8s instrumental, got {coverage['instrumental_sec']}"
    print("[PASS] Test 1: Full timeline preserved and media classified into vocal and instrumental regions.")


def test_confidence_safety_and_readiness_cap():
    print("\n--- Test 2: Low ASR Confidence Caps Status to NEEDS_REVIEW ---")
    cues = [
        {
            "index": 1,
            "id": "cue_1",
            "start_sec": 0.0,
            "end_sec": 4.6,
            "confidence": 0.34,
            "recognition_confidence": 0.34,
            "source_text": "sample lyrics",
            "translated_text": "ᱵᱷᱤᱥ ᱟᱜ ᱜᱚᱡ",
            "translation_status": "MACHINE_TRANSLATED",
            "review_status": "REVIEW_REQUIRED",
            "is_stale": False
        }
    ]

    val_res = {"valid": True, "fatal_errors": [], "warnings": ["ASR confidence low"]}
    coverage = {"timeline_coverage_pct": 100.0, "vocal_total_sec": 4.6, "instrumental_sec": 0.0}

    readiness = SubtitleReadinessEvaluator.evaluate(cues, val_res, coverage)
    print("Readiness result for 34% ASR confidence:")
    print(f"  Score: {readiness['score']}")
    print(f"  Status: {readiness['status']}")
    print(f"  Cap Reason: {readiness['cap_reason']}")
    print(f"  Requires Review: {readiness['requires_review']}")

    assert readiness["status"] == QualityState.NEEDS_REVIEW, f"Expected NEEDS_REVIEW, got {readiness['status']}"
    assert readiness["score"] <= 68, f"Score should be capped at <= 68, got {readiness['score']}"
    assert readiness["requires_review"] is True
    print("[PASS] Test 2: Low ASR confidence properly capped to NEEDS_REVIEW with review requirement.")


def test_pure_instrumental_handling():
    print("\n--- Test 3: Pure Instrumental Media Handling ---")
    classifier = MediaClassifier()
    sr = 16000
    total_dur = 20.0
    total_samples = int(total_dur * sr)
    t = np.linspace(0, total_dur, total_samples, endpoint=False)
    audio = 0.12 * np.sin(2 * np.pi * 330 * t)  # Pure music

    regions = classifier.analyze_audio_array(audio, sr=sr, asr_segments=[], total_duration=total_dur)
    coverage = MediaCoverageAnalyzer.compute_coverage(total_dur, regions, [])

    print(f"Pure music regions: {len(regions)}")
    for r in regions:
        print(f"  [{r.start} -> {r.end}] {r.type} | Conf: {r.confidence}")

    assert coverage["timeline_coverage_pct"] == 100.0
    assert coverage["instrumental_sec"] >= 19.5
    assert coverage["vocal_total_sec"] == 0.0

    val_res = validate_subtitles([], total_duration_sec=total_dur, allow_empty_if_instrumental=True)
    assert val_res["valid"] is True

    readiness = SubtitleReadinessEvaluator.evaluate([], val_res, coverage)
    assert readiness["status"] == QualityState.GOOD
    print("[PASS] Test 3: Pure instrumental media has 100% timeline coverage and zero fake dialogue.")


def test_stale_translation_invalidation():
    print("\n--- Test 4: Source Editing Marks Translation STALE ---")
    cue = SubtitleCue(
        index=1,
        start_sec=0.0,
        end_sec=4.0,
        source_text="Hello world",
        translated_text="ᱡᱚᱦᱟᱨ ᱫᱷᱟᱹᱨᱛᱤ",
        translation_status="MACHINE_TRANSLATED",
        is_stale=False
    )
    cue_dict = cue.to_dict()
    assert cue_dict["is_stale"] is False
    assert cue_dict["translation_status"] == "MACHINE_TRANSLATED"

    # User modifies source transcript
    cue_dict["source_text"] = "Hello world everyone"
    cue_dict["is_stale"] = True
    cue_dict["translation_status"] = "STALE"

    val_res = {"valid": True, "fatal_errors": [], "warnings": []}
    coverage = {"timeline_coverage_pct": 100.0, "vocal_total_sec": 4.0, "instrumental_sec": 0.0}
    readiness = SubtitleReadinessEvaluator.evaluate([cue_dict], val_res, coverage)

    print(f"Readiness with stale translation: status={readiness['status']}, reason={readiness['cap_reason']}")
    assert readiness["status"] == QualityState.NEEDS_REVIEW
    assert "outdated" in readiness["cap_reason"].lower()
    print("[PASS] Test 4: Stale translation invalidation verified.")


if __name__ == "__main__":
    test_media_classification_and_coverage()
    test_confidence_safety_and_readiness_cap()
    test_pure_instrumental_handling()
    test_stale_translation_invalidation()
    print("\n==================================================")
    print("ALL 4 ADVANCED PIPELINE TESTS PASSED!")
    print("==================================================")
