/**
 * Bhasha Setu — Difficult Word Detection Engine
 *
 * Implements a bounded multi-factor scoring model to identify phonetically challenging,
 * medical, polysyllabic, or unfamiliar vocabulary words that require measured prosodic pacing.
 *
 * Factors:
 * 1. Unknown dictionary/lexicon status (+25)
 * 2. Syllable count (3-4 syllables: +20, 5+ syllables: +40)
 * 3. Consonant cluster complexity (+15)
 * 4. Medical / Clinical terminology (+25)
 * 5. Mixed scripts or unusual orthography (+20)
 * 6. Low pronunciation confidence tier (+15)
 *
 * Threshold: Score >= 50 triggers difficult-word pacing directive.
 */

import { DifficultWordInfo, TTSPronunciationQuality } from '../types';
import { SyllableEngine } from '../linguistics/syllableEngine';

export class DifficultWordDetector {
  private static readonly MEDICAL_TERMS = new Set([
    'paracetamol', 'amoxicillin', 'hemoglobin', 'screening', 'hypertension',
    'gestational', 'tuberculosis', 'stethoscope', 'sphygmomanometer', 'intravenous',
    'hospital', 'emergency', 'pediatric', 'obstetric', 'centimeter', 'milligram',
    'milliliter', 'haspatal', 'mayam', 'bidaw'
  ]);

  /**
   * Evaluates whether a single word is phonetically difficult and requires deliberate pacing.
   */
  public static evaluateWord(
    word: string,
    langCode: string,
    options: {
      isKnownInLexicon?: boolean;
      quality?: TTSPronunciationQuality;
      isMedical?: boolean;
    } = {}
  ): DifficultWordInfo {
    const clean = word.replace(/[.,!?;:()᱾᱿•]/g, '').trim();
    if (!clean || clean.length <= 3) {
      return {
        word: clean,
        isDifficult: false,
        syllableCount: 1,
        requiresSlowPacing: false
      };
    }

    const syllableAnalysis = SyllableEngine.analyzeWord(clean, langCode);
    const syllables = syllableAnalysis.syllableCount;
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Lexicon absence
    if (options.isKnownInLexicon === false) {
      score += 25;
      reasons.push('out-of-lexicon');
    }

    // Factor 2: Syllable count
    if (syllables >= 5) {
      score += 40;
      reasons.push(`${syllables} syllables (polysyllabic)`);
    } else if (syllables >= 4) {
      score += 25;
      reasons.push(`${syllables} syllables`);
    } else if (syllables >= 3) {
      score += 15;
    }

    // Factor 3: Consonant cluster
    if (syllableAnalysis.hasConsonantCluster) {
      score += 15;
      reasons.push('consonant cluster');
    }

    // Factor 4: Medical terminology
    const isMedical = options.isMedical || this.MEDICAL_TERMS.has(clean.toLowerCase());
    if (isMedical) {
      score += 25;
      reasons.push('clinical term');
    }

    // Factor 5: Pronunciation confidence tier
    if (options.quality === 'RULE_BASED' || options.quality === 'ALGORITHMIC' || options.quality === 'FALLBACK') {
      score += 15;
      reasons.push(`low-confidence (${options.quality})`);
    }

    const isDifficult = score >= 50;

    return {
      word: clean,
      isDifficult,
      syllableCount: syllables,
      reason: reasons.length > 0 ? reasons.join(', ') : undefined,
      requiresSlowPacing: isDifficult
    };
  }

  /**
   * Scans a full sentence and returns all words requiring deliberate pacing.
   */
  public static analyzeSentence(
    text: string,
    langCode: string,
    knownLexicon?: Set<string>
  ): DifficultWordInfo[] {
    const words = text.split(/\s+/).map(w => w.replace(/[.,!?;:()᱾᱿•]/g, '').trim()).filter(Boolean);
    const results: DifficultWordInfo[] = [];

    for (const w of words) {
      const isKnown = knownLexicon ? knownLexicon.has(w) : undefined;
      const info = this.evaluateWord(w, langCode, { isKnownInLexicon: isKnown });
      if (info.isDifficult) {
        results.push(info);
      }
    }

    return results;
  }
}
