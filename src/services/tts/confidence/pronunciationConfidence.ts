/**
 * Bhasha Setu — Pronunciation Confidence & Difficult Word Detection
 *
 * Implements qualitative pronunciation confidence assessment and
 * identifies complex or out-of-vocabulary words requiring syllable-aware
 * articulation and controlled pacing.
 */

import { TTSPronunciationQuality, DifficultWordInfo } from '../types';
import { segmentWordIntoSyllables, containsOlChiki } from '../linguistics/olChikiLinguistics';

export class PronunciationConfidenceEngine {
  /**
   * Returns qualitative confidence metadata for a pronunciation decision.
   * STRICT ZERO-FABRICATION: Uses qualitative tiers without claiming unmeasured numeric accuracy.
   */
  public static evaluateConfidence(quality: TTSPronunciationQuality): {
    tier: TTSPronunciationQuality;
    qualitativeDescription: string;
    internalRank: number;
  } {
    switch (quality) {
      case 'NATIVE_VERIFIED':
        return {
          tier: 'NATIVE_VERIFIED',
          qualitativeDescription: 'Audited and verified by native Santali speakers',
          internalRank: 6
        };
      case 'EXPERT_VERIFIED':
        return {
          tier: 'EXPERT_VERIFIED',
          qualitativeDescription: 'Audited by linguistic field researchers',
          internalRank: 5
        };
      case 'CURATED':
        return {
          tier: 'CURATED',
          qualitativeDescription: 'High-confidence bilingual lexicon and dictionary entry',
          internalRank: 4
        };
      case 'DATASET':
        return {
          tier: 'DATASET',
          qualitativeDescription: 'Exact parallel corpus sentence match',
          internalRank: 3
        };
      case 'RULE_BASED':
        return {
          tier: 'RULE_BASED',
          qualitativeDescription: 'Context-aware Ol Chiki linguistic and diacritic phonetics',
          internalRank: 2
        };
      case 'ALGORITHMIC':
        return {
          tier: 'ALGORITHMIC',
          qualitativeDescription: 'Systematic character-level phonetic transliteration',
          internalRank: 1
        };
      case 'FALLBACK':
      default:
        return {
          tier: 'FALLBACK',
          qualitativeDescription: 'Cross-script acoustic bridge or chime fallback',
          internalRank: 0
        };
    }
  }

  /**
   * Analyzes a word to detect whether it is phonetically complex, unfamiliar, or requires careful pacing.
   */
  public static analyzeWordDifficulty(
    word: string,
    langCode: string,
    quality: TTSPronunciationQuality
  ): DifficultWordInfo {
    const cleanWord = word.replace(/[.,!?;:()᱾᱿•]/g, '').trim();
    if (!cleanWord) {
      return {
        word,
        isDifficult: false,
        syllableCount: 0,
        requiresSlowPacing: false
      };
    }

    const syllables = segmentWordIntoSyllables(cleanWord);
    const syllableCount = syllables.length;

    // Difficulty indicators:
    // 1. Algorithmic fallback quality for unknown word
    const isAlgorithmicFallback = quality === 'ALGORITHMIC' || quality === 'FALLBACK';

    // 2. High syllable count (>= 4 syllables)
    const isPolysyllabic = syllableCount >= 4;

    // 3. Word length >= 10 characters
    const isLongWord = cleanWord.length >= 10;

    // 4. Multiple Ol Chiki diacritics in single word
    const diacriticCount = (cleanWord.match(/[ᱸᱹᱺᱻᱼᱽ]/g) || []).length;
    const hasMultipleDiacritics = diacriticCount >= 2;

    // 5. Mixed script presence
    const isMixedScript = /[A-Za-z]/.test(cleanWord) && containsOlChiki(cleanWord);

    const isDifficult = isAlgorithmicFallback || isPolysyllabic || hasMultipleDiacritics || isMixedScript;

    let reason: string | undefined;
    if (isMixedScript) reason = 'Mixed script token';
    else if (hasMultipleDiacritics) reason = 'Multiple stacked Ol Chiki diacritics';
    else if (isPolysyllabic) reason = `Polysyllabic word (${syllableCount} syllables)`;
    else if (isAlgorithmicFallback && isLongWord) reason = 'Unfamiliar vocabulary requiring phonetic care';

    return {
      word: cleanWord,
      isDifficult,
      syllableCount,
      reason,
      requiresSlowPacing: isDifficult && (isPolysyllabic || hasMultipleDiacritics)
    };
  }
}
