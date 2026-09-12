# Bhasha Setu — Santali Speech Dataset Card

**Dataset Name:** `Bhasha Setu Santali Speech Corpus (santali-tts)`  
**Dataset Version:** `v0.1.0`  
**License:** `CC-BY-NC-SA 4.0` (Community Non-Commercial ShareAlike) / Permissive Educational  
**Language:** Santali (`sat`, `sat-Olck`)  
**Script:** Ol Chiki (`U+1C50 - U+1C7F`)  
**Point of Contact:** Bhasha Setu Speech & Language Technology Team  

---

## 1. Dataset Overview & Purpose

The **Bhasha Setu Santali Speech Corpus** is a curated, ethically consented, studio-quality speech dataset purpose-built for training and evaluating open-source Text-to-Speech (TTS) models for the Santali language.

It directly addresses the acute scarcity of high-fidelity, phonetically balanced acoustic corpora for indigenous Indian tribal languages, enabling genuine neural voice synthesis for migrant teachers, tribal schoolchildren, and primary healthcare workers in tribal regions.

---

## 2. Demographic & Linguistic Characteristics

* **Total Target Speakers:** Multi-speaker corpus (balanced across female and male contributors).
* **Age Distribution:** Broad representation across adult speakers (18–60+ years).
* **Dialect Representation:**
  - Standard Southern Santali (Mayurbhanj, Odisha / East Singhbhum, Jharkhand)
  - Northern Santali (Santhal Parganas, Jharkhand)
  - Western Santali (Jhargram / Paschim Medinipur, West Bengal)
* **Script Orthography:** 100% Ol Chiki Unicode (NFC normalized).
* **Phonetic Scope:** Full coverage of all 30 base consonants and vowels, 5 modifying diacritics (*Ahad*, *Mu-Tuda*, *Gahla-Tuda*, *Mu-Gahla-Tuda*, *Relo*), and 10 numerals.

---

## 3. Recording Methodology & Acoustic Curation

* **Capture Format:** Uncompressed 24-bit / 48 kHz Linear PCM.
* **Canonical Processed Delivery:** 16-bit / 22,050 Hz and 24,000 Hz Mono PCM WAV.
* **Peak Level:** Normalized to $-1.0\text{ dBFS}$ peak.
* **Silence Boundaries:** Leading silence $\le 80\text{ ms}$; trailing silence $\le 150\text{ ms}$.
* **Hardware:** Large-diaphragm USB condenser and broadcast dynamic microphones equipped with pop filters and shock isolation mounts in treated acoustic environments ($\le -50\text{ dBFS}$ noise floor).

---

## 4. Ethical Governance, Consent & Privacy

* **Informed Consent:** 100% of samples are backed by an active, cryptographically indexed `ConsentRecord`.
* **Individual Sovereignty:** Contributors hold an unconditional cascading right of withdrawal.
* **Privacy Protections:** Zero personal identifying information (no names, phone numbers, home addresses, government IDs, or facial imagery) is stored or distributed in the dataset manifests.

---

## 5. Intended Uses & Prohibited Uses

### Intended Uses
* Training open-source acoustic speech synthesis models (VITS, Piper, FastSpeech2, Glow-TTS, F5-TTS).
* Educational screen-readers and digital textbooks for tribal schools in Jharkhand, Odisha, and West Bengal.
* Public health announcements (e.g. Sickle Cell Anemia screening, maternal healthcare advisories).
* Non-commercial academic research in Austroasiatic and Munda phonetics.

### Prohibited Uses
* ❌ Commercial voice cloning without explicit written community permission.
* ❌ Deepfake generation, impersonation, or political disinformation.
* ❌ Training surveillance or voice-biometric identification systems.
* ❌ Unauthorized resale or sub-licensing of community recordings.

---

## 6. Dataset Versioning & Hashing

| Partition | Samples | Hours (Projected Target) | Hash (SHA-256) |
| :--- | :--- | :--- | :--- |
| **`train.jsonl`** | ~70% (Speaker Disjoint) | 14.0 hrs | Tracked per manifest build |
| **`validation.jsonl`**| ~15% (Speaker Disjoint) | 3.0 hrs | Tracked per manifest build |
| **`test.jsonl`** | ~15% (Speaker Disjoint) | 3.0 hrs | Tracked per manifest build |
