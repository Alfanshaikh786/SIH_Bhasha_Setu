# Bhasha Setu — Santali Dialect Documentation & Metadata Guidelines

**Document Version:** 1.0.0  
**Linguistic Domain:** Austroasiatic / Munda / Kherwarian / Santali  
**Date:** September 2026  

---

## 1. Dialect Governance Policy

Santali displays regional phonological and lexical variations across the Chota Nagpur Plateau and bordering states (Jharkhand, Odisha, West Bengal, Bihar, Assam). 

In accordance with **Absolute Rule 18**:
* **No Invented Taxonomies:** The project strictly adopts academically documented regional varieties.
* **Explicit Evidence Requirement:** If a speaker's dialect variety is known and verified, it is recorded. If uncertain or unverified, it is recorded as:
  $$\textbf{dialect} = \text{"UNKNOWN"}$$
* **No Geographic Inferences:** Never automatically infer a speaker's dialect purely based on current recording location or IP address; many tribal speakers migrate between districts.

---

## 2. Documented Regional Varieties

The following documented dialect groupings are recognized in the metadata schema:

| Dialect Label | Primary Regional Clusters | Phonological / Lexical Characteristics |
| :--- | :--- | :--- |
| **`Mayurbhanj`** (Southern Standard) | Mayurbhanj (Odisha), East Singhbhum (Jharkhand) | Widely accepted benchmark for standardized Ol Chiki literature and educational curricula. Consistent vowel rounding and checked consonant release. |
| **`Santhal_Parganas`** (Northern) | Dumka, Deoghar, Godda, Sahibganj, Pakur, Jamtara (Jharkhand) | Historically documented by P.O. Bodding. Slight phonetic variance in vowel reduction and loanword assimilation from Hindi/Maithili. |
| **`Midnapore_Manbhum`** (Western) | Jhargram, Paschim Medinipur, Purulia, Bankura (West Bengal) | Characteristic cadence with Bengali phonetic contact; distinct intonation on terminal discourse particles (*ge*, *ba*). |
| **`Assam_TeaGarden`** (Diaspora) | Kokrajhar, Udalguri, Sonitpur (Assam) | Distinct diaspora variety with Assamese/Bodo loan contact and slight loss of glottal distinctions. |
| **`UNKNOWN`** | Unverified or self-reported mixed origin | Assigned whenever demographic provenance is incomplete. |

---

## 3. Metadata Recording Standards

Dialect metadata must be collected via respectful voluntary self-reporting during onboarding:

```json
{
  "speakerId": "SAT_SPK_007",
  "selfReportedDialect": "Mayurbhanj",
  "regionalHeritage": "Rairangpur, Mayurbhanj, Odisha",
  "firstLanguageStatus": "L1_Native",
  "multilingualProfile": ["Santali", "Odia", "Hindi"],
  "notes": "Speaker learned Ol Chiki script in primary school"
}
```

---

## 4. Preservation of Regional Phonetics

* **No Forced Homogenization:** Do not force speakers from Santhal Parganas or Jhargram to artificially emulate Mayurbhanj accent during recording. Authentic neural TTS requires diverse speaker representations.
* **Corpus Balancing:** Ensure that the final multi-speaker training corpus is not monopolized by a single dialect cluster, preserving linguistic equity across the Santali-speaking belt.
