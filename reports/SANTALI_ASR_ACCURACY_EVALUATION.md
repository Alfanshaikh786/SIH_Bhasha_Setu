# Santali ASR Accuracy Evaluation Report

**Status:** `Accuracy measurement pending human-annotated Santali corpus.`

> [!IMPORTANT]
> **Empirical Rigor Policy:** Recognition accuracy (WER/CER) is strictly not
> reported until measured against a human-annotated ground-truth corpus.
> Zero synthetic or fabricated test data was used.

```

=============================================================================
           BHASHA SETU — SANTALI ASR GROUND-TRUTH DATASET SPECIFICATION
=============================================================================

To measure genuine empirical accuracy (CER/WER) without fabrication, provide
a human-annotated Santali speech corpus meeting the following specifications:

1. DIRECTORY STRUCTURE:
   data/
     └── santali_eval/
         ├── manifest.csv          <- Annotation metadata file
         └── audio/                <- Directory containing raw recordings
             ├── sample_001.wav
             ├── sample_002.wav
             └── ...

2. MANIFEST SCHEMA (manifest.csv):
   Required columns (CSV header):
   sample_id,audio_file,ground_truth,environment,speaker_id

   Example rows:
   sample_001,sample_001.wav,ᱡᱚᱦᱟᱨ ᱜᱟᱛᱮ,clean,SPK_01
   sample_002,sample_002.wav,ᱟᱢ ᱫᱚ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?,noisy,SPK_02
   sample_003,sample_003.wav,ᱤᱧ ᱫᱚ ᱱᱟᱯᱟᱭ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ,clean,SPK_01

3. FIELD SPECIFICATIONS:
   - sample_id: Unique alphanumeric identifier.
   - audio_file: Filename in audio/ folder (WAV, FLAC, or OGG).
   - ground_truth: Verified native Ol Chiki script (Unicode U+1C50–U+1C7F).
     * Must be verified by native Santali speakers.
     * No Latin transliteration or Devanagari in ground_truth column.
   - environment: 'clean' (studio/quiet room) or 'noisy' (classroom/street).
     (If left empty, evaluator automatically computes acoustic SNR).
   - speaker_id: Optional identifier for gender/age/dialect coverage.

4. AUDIO RECORDING STANDARDS:
   - Format: PCM WAV 16-bit mono.
   - Sample Rate: 16,000 Hz (auto-resampled if 44.1kHz / 48kHz).
   - Length: 1.0s to 15.0s per utterance.
   - Diversity: Both short classroom commands and continuous conversational speech.

5. RUNNING THE EVALUATION ONCE ANNOTATED DATA IS PLACED:
   python scripts/evaluate_santali_asr.py --manifest data/santali_eval/manifest.csv --audio-dir data/santali_eval/audio/
=============================================================================

```
