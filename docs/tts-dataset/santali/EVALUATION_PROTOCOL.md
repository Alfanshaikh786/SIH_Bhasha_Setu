# Bhasha Setu — Native-Speaker Human Evaluation Protocol

**Document Version:** 1.0.0  
**Methodology:** Double-Blind ABX & MUSHRA-Style Listening Tests  
**Date:** September 2026  

---

## 1. Ethical Principle: Zero Synthetic Scores

In strict adherence to project governance:
* **No Fabricated MOS Ratings:** Developers and automated benchmark scripts must **NEVER** fabricate or simulate native-speaker ratings.
* **Accredited Evaluators Only:** Evaluation scores may only be recorded when collected from genuine native speakers of Santali.

---

## 2. Evaluation Dimensions & Likert Scales

Evaluators rate randomized audio samples on a **1 to 5 Likert Scale** across four standardized dimensions:

### 1. Intelligibility (ᱵᱩᱡᱷᱟᱹᱣ ᱫᱟᱲᱮ - Bujhaw Daṛe)
* *Question:* Can the spoken words and sentences be clearly understood without reading the text?
  - `5`: Completely intelligible; every syllable and word is immediately clear.
  - `4`: Mostly intelligible; one minor word requires brief concentration.
  - `3`: Fairly intelligible; multiple words are muffled or unclear.
  - `2`: Difficult to understand; majority of words are obscured or distorted.
  - `1`: Unintelligible; sounds like gibberish or acoustic noise.

### 2. Naturalness (ᱠᱩᱥᱤᱭᱟᱜ ᱨᱟᱦᱟ - Kusiyag Raha)
* *Question:* Does the voice sound like a natural human speaking, or does it sound robotic, stiff, and mechanical?
  - `5`: Completely natural; sounds like an authentic human speaker.
  - `4`: Mostly natural; slight synthetic inflection or minor breath artifact.
  - `3`: Fairly natural; noticeable robotic pitch jumps or rigid cadence.
  - `2`: Very unnatural; constant monotone, metallic timbre, or awkward pauses.
  - `1`: Extremely unnatural; completely synthetic and jarring.

### 3. Pronunciation Accuracy (ᱥᱟᱹᱨᱤ ᱩᱪᱟᱹᱨᱚᱱ - Sari Ucharan)
* *Question:* Are checked consonants (*ot*, *og*, *och*, *op*), glottal catches, and diacritics (*ahad*, *mu-tuda*) correctly pronounced?
  - `5`: Flawless native pronunciation.
  - `4`: Minor accent variance; glottal stops slightly weak but recognizable.
  - `3`: Noticeable pronunciation errors; some checked consonants released incorrectly.
  - `2`: Frequent pronunciation errors; sounds like a non-Santali native mispronouncing.
  - `1`: Completely incorrect phonetics; mangled consonants and missing vowels.

### 4. Dialect Appropriateness (ᱴᱚᱴᱷᱟᱠᱤᱭᱟᱹ ᱢᱮᱲ - Tothakiya Meṛ)
* *Question:* Is the rhythm, lexical stress, and intonation appropriate for the intended regional community?
  - `5`: Perfectly appropriate for the regional speaker community.
  - `4`: Generally acceptable with slight regional variance.
  - `3`: Ambiguous dialect; mixed regional markers.
  - `2`: Inappropriate prosody; sounds foreign to the dialect region.
  - `1`: Culturally jarring or offensive acoustic presentation.

---

## 3. Double-Blind Test Administration

1. **Randomized Playback:** Audio samples from candidate neural models, the baseline Phonetic Speech Bridge, and authentic human ground truth are presented in randomized order.
2. **Blinded Identity:** The evaluator interface displays only `Sample A`, `Sample B`, `Sample C`. Evaluators are never informed which sample is neural, human, or phonetic bridge.
3. **Listening Environment:** Evaluators must wear closed-back studio monitor headphones (e.g. Audio-Technica ATH-M50x or Sony MDR-7506) in a quiet room ($\le 40\text{ dBA}$).
4. **Inter-Annotator Reliability:** Fleiss’ Kappa ($\kappa$) and Krippendorff’s Alpha ($\alpha$) are calculated across evaluators to verify statistical agreement.
