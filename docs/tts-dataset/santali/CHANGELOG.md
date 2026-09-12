# Santali Speech Corpus Changelog

All notable changes, expansions, and native-speaker reviews for the Bhasha Setu Santali Speech Dataset Prompt Corpus are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning for speech corpora.

---

## [v0.2.0] - 2026-09-12 (Phase 9: Multi-Domain Corpus Expansion & Validation Architecture)

### Status
- **Corpus Lifecycle State**: `CORPUS_DESIGN_READY`
- **Linguistic Review Status**: `LINGUISTIC_REVIEW_REQUIRED` (pending qualified native-speaker review)
- **Active Recording Status**: Halted pending native linguistic sign-off and signed informed consent.

### Added
- **23 New Prompts** expanding the corpus from 13 to 36 prompts:
  - `PROMPT_GEN_001`: Very short standard greeting (`VERY_SHORT`)
  - `PROMPT_EDU_001`: Classroom instruction (`VERY_SHORT`, `COMMAND`)
  - `PROMPT_EDU_003`: Science explanation (`MEDIUM`, `EXPLANATION`)
  - `PROMPT_HLT_003`: Medication dosage timing covering epenthetic glide `ᱶ` (`MEDIUM`, `COMMAND`)
  - `PROMPT_COM_001`: Village governance meeting (`MEDIUM`, `STATEMENT`)
  - `PROMPT_COM_002`: Cultural festival with folk instruments (`LONG`, `STATEMENT`)
  - `PROMPT_DAY_001`: Domestic morning routine (`SHORT`, `COMMAND`)
  - `PROMPT_DIR_001`: Spatial navigation right-turn (`VERY_SHORT`, `COMMAND`)
  - `PROMPT_DIR_002`: Wayfinding with mu-tuda diacritic (`MEDIUM`, `EXPLANATION`)
  - `PROMPT_SAF_001`: Exclamatory hazard warning (`SHORT`, `WARNING`)
  - `PROMPT_NUM_002`: Spoken cardinal Santali number words 1–10 (`MEDIUM`, `LIST`)
  - `PROMPT_TIM_001`: Days of week and clock time (`MEDIUM`, `STATEMENT`)
  - `PROMPT_TIM_002`: Year and calendar month (`SHORT`, `STATEMENT`)
  - `PROMPT_MEA_001`: Agricultural weight measurements in kg (`SHORT`, `COMMAND`)
  - `PROMPT_MEA_002`: Textile dimensions in meters (`MEDIUM`, `EXPLANATION`)
  - `PROMPT_QST_002`: Community development inquiry (`SHORT`, `QUESTION`)
  - `PROMPT_CMD_001`: Household directive (`VERY_SHORT`, `COMMAND`)
  - `PROMPT_DES_001`: Natural landscape description (`MEDIUM`, `STATEMENT`)
  - `PROMPT_NAR_001`: Extended heritage narrative with double mucaad `᱿` (`VERY_LONG`, 26 words)
  - `PROMPT_MIX_001`: Clinical consultation with recognized loan vocabulary (`MEDIUM`, `EXPLANATION`)
  - `PROMPT_PROS_001`: Prosodic test with colon, quote marks, and exclamation (`MEDIUM`, `EXCLAMATION`)
  - `PROMPT_RARE_001`: Phonetic stress test for rare diacritic Relo `ᱻ` (`LONG`, `STATEMENT`)
  - `PROMPT_REQ_001`: Courteous request with polite marker (`SHORT`, `REQUEST`)
  - `PROMPT_EDU_004`: Teacher directive with in-context numeral (`MEDIUM`, `COMMAND`)
  - `PROMPT_NAR_002`: Multi-clause Baha festival narrative (`LONG`, `STATEMENT`)
  - `PROMPT_NUM_003`: Centum currency and school supply transaction (`MEDIUM`, `STATEMENT`)

### Changed
- Migrated schema from ad-hoc strings to strict `CorpusPromptItem`:
  - Formalized `category` across 16 canonical domains (`GENERAL_CONVERSATION`, `EDUCATION`, `HEALTHCARE`, `AGRICULTURE`, `COMMUNITY`, `DAILY_LIFE`, `DIRECTIONS`, `SAFETY`, `NUMERALS`, `DATES_AND_TIME`, `MEASUREMENTS`, `QUESTIONS`, `COMMANDS`, `DESCRIPTIONS`, `NARRATIVE`, `MIXED_LANGUAGE`).
  - Added `lengthCategory`: `VERY_SHORT`, `SHORT`, `MEDIUM`, `LONG`, `VERY_LONG`.
  - Added `sentenceType`: 9 pragmatic types including statements, commands, requests, warnings, and conversational exchanges.
  - Added explicit dialect attribution (`Mayurbhanj`, confidence `HIGH`, review status `REVIEWED`).
  - Added provenance tracking (`sourceType`, `license`, `createdBy`).
  - Preserved original 13 seed prompts with enhanced metadata (zero deleted).

### Validation & Quality Gates
- 10/10 Readiness Gates passed via `scripts/validate_santali_corpus_readiness.cjs`.
- 100% Ol Chiki base letter coverage (30/30).
- 100% Modifying diacritic coverage (5/5).
- 100% Numeral coverage (10/10).
- Generated machine-readable audit reports in `docs/tts-dataset/santali/reports/`.

---

## [v0.1.0] - 2026-09-12 (Phase 8: Initial Seed Corpus)

### Added
- Initial 13 recording prompts in `docs/tts-dataset/santali/recording_prompt_corpus.json`.
- Covered basic greetings, education, healthcare, agriculture, and numerals.
- Defined initial speech dataset architecture, audio validator, Ol Chiki validator, and consent manager.
