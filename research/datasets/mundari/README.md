# Mundari Machine Translation Datasets

This directory holds authentic research datasets for Mundari (ISO 639-3: `unr`) Machine Translation research.

## Primary Benchmark Dataset
- **Source:** MMLoSo Language Challenge 2025 (IJCNLP-AACL 2025) / AdiBhashaa Initiative
- **Institutional Courtesy:** Ministry of Tribal Affairs, Government of India
- **Repository Mirror:** `Paulownia/MMLoSo_2025` (Hugging Face)
- **Files:**
  - `mundari-train.csv`: 20,149 parallel sentence pairs between Hindi and Mundari.
  - `test.csv`: Shared evaluation benchmark across tribal language tracks.

## Schema
- `row_id`: Unique identifier for each pair.
- `Hindi`: Source Hindi sentence (Devanagari script).
- `Mundari`: Target Mundari sentence (observed predominantly in Devanagari script).

## Integrity Rules
- Do NOT generate synthetic sentences.
- Do NOT label Santali (Ol Chiki) sentences as Mundari.
- Keep training, validation, and test splits strictly segregated.
