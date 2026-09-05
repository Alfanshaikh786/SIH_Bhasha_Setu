/**
 * Translation Capability Registry for Bhasha Setu
 *
 * Central source of truth for ALL translation language pairs.
 * The UI MUST read from this registry — never scatter capability logic across components.
 *
 * Definitions:
 *  - provider: Which provider (if any) handles full-sentence translation.
 *  - fullSentence: true only when a genuine full-sentence neural or dataset translation is available.
 *  - vocabularyAssistance: Whether word/term-level offline vocabulary lookup is available.
 *  - status: 'verified' | 'dataset' | 'experimental' | 'vocabulary_only' | 'unavailable'
 *  - offlineMode: Whether offline support exists. 'phrase_bank' = curated phrases only, 'dataset' = full DB, 'none' = no offline.
 *
 * GOOGLE TRANSLATE WEB BRIDGE — IMPORTANT DISCLAIMER:
 *   The online translation uses `translate.googleapis.com/translate_a/single?client=gtx`
 *   This is an UNOFFICIAL, UNAUTHENTICATED public web bridge used by the Google Translate browser extension.
 *   - It is NOT the official Google Cloud Translation API (cloud.google.com/translate).
 *   - It requires NO API key and has NO official rate limit or SLA guarantee.
 *   - It may break, be rate-limited, or change without notice.
 *   - It is suitable for prototype/SIH demo use but must be replaced with
 *     an authenticated API before any production deployment.
 *   - Label in UI as: "Google Translate Web Bridge (Unofficial)"
 */

import { SupportedLanguage } from './languageService';

export type TranslationStatus =
  | 'verified'         // Verified online neural provider (full sentence)
  | 'dataset'          // Offline exact/fuzzy match from curated database (full sentence)
  | 'experimental'     // Online but quality unverified (e.g. MyMemory sparse corpus)
  | 'vocabulary_only'  // Only word/term lookups available; no full sentence translation
  | 'unavailable';     // No translation support exists for this language pair

export type OfflineMode =
  | 'dataset'       // Full offline dataset/DB available (6,780+ rows)
  | 'phrase_bank'   // Curated phrase bank only (limited conversational phrases)
  | 'none';         // No offline translation available

export interface LanguagePairCapability {
  src: SupportedLanguage;
  tgt: SupportedLanguage;
  /** Human-readable label for this pair */
  label: string;
  /** Whether genuine full-sentence translation is available */
  fullSentence: boolean;
  /** Provider name used for full-sentence translation (null if not available) */
  provider: string | null;
  /** Translation status badge */
  status: TranslationStatus;
  /** Offline support level */
  offlineMode: OfflineMode;
  /** Whether word/term-level vocabulary assistance is available offline */
  vocabularyAssistance: boolean;
  /** Human-readable notes about this pair for display in UI */
  notes: string;
}

/**
 * Complete Translation Capability Matrix for all 20 language pairs (5×4 directed).
 * Generated from empirical live probe testing on 2026-09-05.
 */
export const TRANSLATION_CAPABILITIES: LanguagePairCapability[] = [
  // ── English → * ──────────────────────────────────────────────────────────
  {
    src: 'english', tgt: 'hindi',
    label: 'English → Hindi',
    fullSentence: true,
    provider: 'Google Translate Web Bridge (Unofficial)',
    status: 'verified',
    offlineMode: 'dataset',
    vocabularyAssistance: true,
    notes: 'High-quality neural translation. Offline: 6,780-row Classroom DB (English ↔ Hindi).'
  },
  {
    src: 'english', tgt: 'santali',
    label: 'English → Santali',
    fullSentence: true,
    provider: 'Google Translate Web Bridge (Unofficial)',
    status: 'verified',
    offlineMode: 'dataset',
    vocabularyAssistance: true,
    notes: 'Google neural outputs genuine Ol Chiki script. Offline: 6,780-row Santali Dataset.'
  },
  {
    src: 'english', tgt: 'mundari',
    label: 'English → Mundari',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'phrase_bank',
    vocabularyAssistance: true,
    notes: 'No public neural MT model supports Mundari (ISO 639-3: unr). Vocabulary assistance only. Future: custom ONNX/LiteRT model required.'
  },
  {
    src: 'english', tgt: 'ho',
    label: 'English → Ho',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'phrase_bank',
    vocabularyAssistance: true,
    notes: 'No public neural MT model supports Ho (ISO 639-3: hoc). Vocabulary assistance only. Future: custom ONNX/LiteRT model required.'
  },

  // ── Hindi → * ──────────────────────────────────────────────────────────
  {
    src: 'hindi', tgt: 'english',
    label: 'Hindi → English',
    fullSentence: true,
    provider: 'Google Translate Web Bridge (Unofficial)',
    status: 'verified',
    offlineMode: 'dataset',
    vocabularyAssistance: true,
    notes: 'High-quality neural translation. Offline: 6,780-row Classroom DB.'
  },
  {
    src: 'hindi', tgt: 'santali',
    label: 'Hindi → Santali',
    fullSentence: true,
    provider: 'Google Translate Web Bridge (Unofficial)',
    status: 'verified',
    offlineMode: 'dataset',
    vocabularyAssistance: true,
    notes: 'Google neural outputs genuine Ol Chiki script. Offline: Santali Dataset.'
  },
  {
    src: 'hindi', tgt: 'mundari',
    label: 'Hindi → Mundari',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'phrase_bank',
    vocabularyAssistance: true,
    notes: 'No public neural MT model supports Mundari. Vocabulary assistance only.'
  },
  {
    src: 'hindi', tgt: 'ho',
    label: 'Hindi → Ho',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'phrase_bank',
    vocabularyAssistance: true,
    notes: 'No public neural MT model supports Ho. Vocabulary assistance only.'
  },

  // ── Santali → * ──────────────────────────────────────────────────────────
  {
    src: 'santali', tgt: 'english',
    label: 'Santali → English',
    fullSentence: true,
    provider: 'Google Translate Web Bridge (Unofficial)',
    status: 'verified',
    offlineMode: 'dataset',
    vocabularyAssistance: true,
    notes: 'Google neural reads Ol Chiki and outputs English. Offline: Santali Dataset.'
  },
  {
    src: 'santali', tgt: 'hindi',
    label: 'Santali → Hindi',
    fullSentence: true,
    provider: 'Google Translate Web Bridge (Unofficial)',
    status: 'verified',
    offlineMode: 'dataset',
    vocabularyAssistance: true,
    notes: 'Google neural reads Ol Chiki and outputs Hindi. Offline: Santali Dataset.'
  },
  {
    src: 'santali', tgt: 'mundari',
    label: 'Santali → Mundari',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'none',
    vocabularyAssistance: false,
    notes: 'No model supports Santali↔Mundari direct translation. Both are distinct languages.'
  },
  {
    src: 'santali', tgt: 'ho',
    label: 'Santali → Ho',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'none',
    vocabularyAssistance: false,
    notes: 'No model supports Santali↔Ho direct translation. Both are distinct languages.'
  },

  // ── Mundari → * ──────────────────────────────────────────────────────────
  {
    src: 'mundari', tgt: 'english',
    label: 'Mundari → English',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'phrase_bank',
    vocabularyAssistance: true,
    notes: 'No public neural MT model supports Mundari. Vocabulary assistance only.'
  },
  {
    src: 'mundari', tgt: 'hindi',
    label: 'Mundari → Hindi',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'phrase_bank',
    vocabularyAssistance: true,
    notes: 'No public neural MT model supports Mundari. Vocabulary assistance only.'
  },
  {
    src: 'mundari', tgt: 'santali',
    label: 'Mundari → Santali',
    fullSentence: false,
    provider: null,
    status: 'unavailable',
    offlineMode: 'none',
    vocabularyAssistance: false,
    notes: 'No model supports Mundari↔Santali direct translation.'
  },
  {
    src: 'mundari', tgt: 'ho',
    label: 'Mundari → Ho',
    fullSentence: false,
    provider: null,
    status: 'unavailable',
    offlineMode: 'none',
    vocabularyAssistance: false,
    notes: 'No model supports Mundari↔Ho direct translation.'
  },

  // ── Ho → * ──────────────────────────────────────────────────────────
  {
    src: 'ho', tgt: 'english',
    label: 'Ho → English',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'phrase_bank',
    vocabularyAssistance: true,
    notes: 'No public neural MT model supports Ho. Vocabulary assistance only.'
  },
  {
    src: 'ho', tgt: 'hindi',
    label: 'Ho → Hindi',
    fullSentence: false,
    provider: null,
    status: 'vocabulary_only',
    offlineMode: 'phrase_bank',
    vocabularyAssistance: true,
    notes: 'No public neural MT model supports Ho. Vocabulary assistance only.'
  },
  {
    src: 'ho', tgt: 'santali',
    label: 'Ho → Santali',
    fullSentence: false,
    provider: null,
    status: 'unavailable',
    offlineMode: 'none',
    vocabularyAssistance: false,
    notes: 'No model supports Ho↔Santali direct translation.'
  },
  {
    src: 'ho', tgt: 'mundari',
    label: 'Ho → Mundari',
    fullSentence: false,
    provider: null,
    status: 'unavailable',
    offlineMode: 'none',
    vocabularyAssistance: false,
    notes: 'No model supports Ho↔Mundari direct translation.'
  },
];

/**
 * Quick lookup: get capability for a specific language pair.
 * Returns null if same-language (no translation needed).
 */
export function getCapability(
  src: SupportedLanguage,
  tgt: SupportedLanguage
): LanguagePairCapability | null {
  if (src === tgt) return null;
  return TRANSLATION_CAPABILITIES.find(c => c.src === src && c.tgt === tgt) ?? {
    src, tgt,
    label: `${src} → ${tgt}`,
    fullSentence: false,
    provider: null,
    status: 'unavailable',
    offlineMode: 'none',
    vocabularyAssistance: false,
    notes: 'This language pair is not registered in the capability registry.'
  };
}

/**
 * Detects the actual Unicode script present in a translation output string.
 * Used to truthfully label what script Santali translation was returned in.
 */
export function detectOutputScript(text: string): {
  scriptName: string;
  hasOlChiki: boolean;
  hasDevanagari: boolean;
  hasLatin: boolean;
  dominantScript: 'ol_chiki' | 'devanagari' | 'latin' | 'mixed' | 'empty';
} {
  if (!text || !text.trim()) {
    return { scriptName: 'Empty', hasOlChiki: false, hasDevanagari: false, hasLatin: false, dominantScript: 'empty' };
  }
  // Ol Chiki Unicode block: U+1C50–U+1C7F
  const olChikiCount = (text.match(/[\u1C50-\u1C7F]/g) || []).length;
  // Devanagari Unicode block: U+0900–U+097F
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  // Latin/ASCII letters
  const latinCount = (text.match(/[a-zA-Z]/g) || []).length;

  const hasOlChiki = olChikiCount > 0;
  const hasDevanagari = devanagariCount > 0;
  const hasLatin = latinCount > 0;

  const total = olChikiCount + devanagariCount + latinCount;
  if (total === 0) {
    return { scriptName: 'Unknown/Punctuation', hasOlChiki, hasDevanagari, hasLatin, dominantScript: 'empty' };
  }

  const olChikiRatio = olChikiCount / total;
  const devRatio = devanagariCount / total;
  const latinRatio = latinCount / total;

  let dominantScript: 'ol_chiki' | 'devanagari' | 'latin' | 'mixed';
  let scriptName: string;

  if (olChikiRatio >= 0.6) {
    dominantScript = 'ol_chiki';
    scriptName = 'Ol Chiki';
  } else if (devRatio >= 0.6) {
    dominantScript = 'devanagari';
    scriptName = 'Devanagari';
  } else if (latinRatio >= 0.6) {
    dominantScript = 'latin';
    scriptName = hasOlChiki || hasDevanagari ? 'Romanized Santali' : 'Latin';
  } else {
    dominantScript = 'mixed';
    const parts: string[] = [];
    if (hasOlChiki) parts.push('Ol Chiki');
    if (hasDevanagari) parts.push('Devanagari');
    if (hasLatin) parts.push('Latin');
    scriptName = `Mixed (${parts.join(' + ')})`;
  }

  return { scriptName, hasOlChiki, hasDevanagari, hasLatin, dominantScript };
}

/**
 * Returns the human-readable status badge for a translation result.
 */
export function getStatusBadge(status: TranslationStatus): {
  icon: string;
  label: string;
  colorClass: string;
} {
  switch (status) {
    case 'verified':
      return { icon: '✓', label: 'Verified Translation', colorClass: 'badge-verified' };
    case 'dataset':
      return { icon: '✓', label: 'Dataset Translation', colorClass: 'badge-dataset' };
    case 'experimental':
      return { icon: '⚠', label: 'Experimental Translation', colorClass: 'badge-experimental' };
    case 'vocabulary_only':
      return { icon: '⚠', label: 'Vocabulary Assistance Only', colorClass: 'badge-vocab' };
    case 'unavailable':
      return { icon: '✗', label: 'Translation Unavailable', colorClass: 'badge-unavailable' };
  }
}

/**
 * Returns the human-readable offline mode label.
 */
export function getOfflineModeLabel(mode: OfflineMode): string {
  switch (mode) {
    case 'dataset': return 'Offline Dataset Support';
    case 'phrase_bank': return 'Offline Phrase Support';
    case 'none': return 'Online Only';
  }
}

/**
 * Lightweight vocabulary phrase bank for Mundari and Ho (word/term level only).
 * This is NOT a sentence translator. These are single-word or short-term equivalents.
 * Source: Curated tribal vocabulary reference (to be expanded with community input).
 */
export const MUNDARI_VOCABULARY: Record<string, { hi: string; en: string }> = {
  'johar': { hi: 'नमस्ते', en: 'Hello/Greetings' },
  'ᱡᱚᱦᱟᱨ': { hi: 'नमस्ते', en: 'Hello/Greetings' },
  'bir': { hi: 'जंगल', en: 'Forest' },
  'hatu': { hi: 'गाँव', en: 'Village' },
  'daru': { hi: 'पेड़', en: 'Tree' },
  'dai': { hi: 'पानी', en: 'Water' },
  'seta': { hi: 'कुत्ता', en: 'Dog' },
  'puthi': { hi: 'किताब', en: 'Book' },
  'machet': { hi: 'शिक्षक', en: 'Teacher' },
  'school': { hi: 'स्कूल', en: 'School' },
  'hospital': { hi: 'अस्पताल', en: 'Hospital' },
  'aama': { hi: 'माँ', en: 'Mother' },
  'aba': { hi: 'पिता', en: 'Father' },
};

export const HO_VOCABULARY: Record<string, { hi: string; en: string }> = {
  'johar': { hi: 'नमस्ते', en: 'Hello/Greetings' },
  'bir': { hi: 'जंगल', en: 'Forest' },
  'atu': { hi: 'गाँव', en: 'Village' },
  'dare': { hi: 'पेड़', en: 'Tree' },
  'dah': { hi: 'पानी', en: 'Water' },
  'seta': { hi: 'कुत्ता', en: 'Dog' },
  'puthi': { hi: 'किताब', en: 'Book' },
  'guruji': { hi: 'शिक्षक', en: 'Teacher' },
  'iskul': { hi: 'स्कूल', en: 'School' },
  'aspathal': { hi: 'अस्पताल', en: 'Hospital' },
  'ea': { hi: 'माँ', en: 'Mother' },
  'baba': { hi: 'पिता', en: 'Father' },
};

/**
 * Lookup vocabulary assistance for Mundari or Ho.
 * Returns word-level translations — never sentences.
 */
export function lookupVocabularyAssistance(
  words: string[],
  targetLang: 'mundari' | 'ho',
  targetScript: 'hindi' | 'english'
): { word: string; meaning: string }[] {
  const vocab = targetLang === 'mundari' ? MUNDARI_VOCABULARY : HO_VOCABULARY;
  const results: { word: string; meaning: string }[] = [];

  for (const word of words) {
    const clean = word.toLowerCase().replace(/[?!.,;:'"()]/g, '').trim();
    if (clean && vocab[clean]) {
      results.push({
        word: clean,
        meaning: targetScript === 'hindi' ? vocab[clean].hi : vocab[clean].en
      });
    }
  }

  return results;
}
