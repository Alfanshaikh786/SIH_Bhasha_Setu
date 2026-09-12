/**
 * Bhasha Setu — Phase 9: Rare-Sequence & Linguistic Distribution Analyzer
 *
 * Provides deep orthographic, phonetic, and phonotactic analysis:
 * - Health classification (WELL_COVERED, UNDERREPRESENTED, MISSING) for all 30 base letters, 5 diacritics, 10 numerals.
 * - Positional phonotactic coverage (word-initial and word-final letters).
 * - Sentence-length and sentence-type distributions.
 * - Collection readiness evaluation against linguistic quality gates.
 */

import {
  OL_CHIKI_BASE_LETTERS,
  OL_CHIKI_DIACRITICS,
  OL_CHIKI_DIGITS
} from './olChikiValidator';
import {
  CorpusPromptItem,
  RareSequenceAnalysisReport,
  SequenceCoverageHealth,
  CorpusSentenceType,
  SentenceLengthCategory,
  CorpusCategory
} from './corpusTypes';

export interface ReadinessGateResult {
  passed: boolean;
  score: number; // 0 to 100
  gates: {
    minimumPrompts: { passed: boolean; count: number; required: number };
    categoryBalance: { passed: boolean; categoriesCovered: number; totalCategories: number; missingCategories: string[] };
    sentenceLengthBalance: { passed: boolean; lengthsCovered: number; missingLengths: string[] };
    sentenceTypeBalance: { passed: boolean; typesCovered: number; missingTypes: string[] };
    baseLetterCoverage: { passed: boolean; coveredCount: number; missingLetters: string[] };
    diacriticCoverage: { passed: boolean; coveredCount: number; missingDiacritics: string[] };
    numeralCoverage: { passed: boolean; coveredCount: number; missingNumerals: string[] };
    provenanceIntegrity: { passed: boolean; invalidPrompts: string[] };
    dialectMetadataIntegrity: { passed: boolean; invalidPrompts: string[] };
    reviewStatusIntegrity: { passed: boolean; violatingPrompts: string[] };
  };
  errors: string[];
}

export class RareSequenceAnalyzer {
  /**
   * Analyzes an array of corpus prompts for sequence coverage health.
   */
  public static analyzeCorpus(prompts: CorpusPromptItem[]): RareSequenceAnalysisReport {
    const baseCounts: Record<string, number> = {};
    const diacriticCounts: Record<string, number> = {};
    const digitCounts: Record<string, number> = {};
    const bigramCounts: Record<string, number> = {};
    const initialCounts: Record<string, number> = {};
    const finalCounts: Record<string, number> = {};

    // Initialize all known symbols to 0
    OL_CHIKI_BASE_LETTERS.forEach((l) => (baseCounts[l] = 0));
    OL_CHIKI_DIACRITICS.forEach((d) => (diacriticCounts[d] = 0));
    OL_CHIKI_DIGITS.forEach((n) => (digitCounts[n] = 0));

    const sentenceTypeDist: Record<CorpusSentenceType, number> = {
      STATEMENT: 0,
      QUESTION: 0,
      COMMAND: 0,
      REQUEST: 0,
      WARNING: 0,
      EXCLAMATION: 0,
      LIST: 0,
      EXPLANATION: 0,
      CONVERSATIONAL_EXCHANGE: 0
    };

    const lengthDist: Record<SentenceLengthCategory, number> = {
      VERY_SHORT: 0,
      SHORT: 0,
      MEDIUM: 0,
      LONG: 0,
      VERY_LONG: 0
    };

    prompts.forEach((item) => {
      // Tally distributions
      if (item.sentenceType in sentenceTypeDist) {
        sentenceTypeDist[item.sentenceType]++;
      }
      if (item.lengthCategory in lengthDist) {
        lengthDist[item.lengthCategory]++;
      }

      const text = item.text.trim();
      const words = text.split(/\s+/).filter(Boolean);

      words.forEach((word) => {
        const clean = word.replace(/[᱾᱿.,!?:;"'()-]/g, '');
        if (clean.length > 0) {
          const first = clean[0];
          const last = clean[clean.length - 1];
          initialCounts[first] = (initialCounts[first] || 0) + 1;
          finalCounts[last] = (finalCounts[last] || 0) + 1;
        }
      });

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ') continue;

        if (ch in baseCounts) baseCounts[ch]++;
        if (ch in diacriticCounts) diacriticCounts[ch]++;
        if (ch in digitCounts) digitCounts[ch]++;

        if (i < text.length - 1) {
          const next = text[i + 1];
          if (next !== ' ') {
            const pair = `${ch}${next}`;
            bigramCounts[pair] = (bigramCounts[pair] || 0) + 1;
          }
        }
      }
    });

    const classifyHealth = (count: number, wellThreshold: number): SequenceCoverageHealth => {
      if (count >= wellThreshold) return 'WELL_COVERED';
      if (count > 0) return 'UNDERREPRESENTED';
      return 'MISSING';
    };

    const baseLettersHealth: Record<string, { count: number; status: SequenceCoverageHealth }> = {};
    OL_CHIKI_BASE_LETTERS.forEach((l) => {
      baseLettersHealth[l] = {
        count: baseCounts[l] || 0,
        status: classifyHealth(baseCounts[l] || 0, 5)
      };
    });

    const diacriticsHealth: Record<string, { count: number; status: SequenceCoverageHealth }> = {};
    OL_CHIKI_DIACRITICS.forEach((d) => {
      diacriticsHealth[d] = {
        count: diacriticCounts[d] || 0,
        status: classifyHealth(diacriticCounts[d] || 0, 3)
      };
    });

    const numeralsHealth: Record<string, { count: number; status: SequenceCoverageHealth }> = {};
    OL_CHIKI_DIGITS.forEach((n) => {
      numeralsHealth[n] = {
        count: digitCounts[n] || 0,
        status: classifyHealth(digitCounts[n] || 0, 2)
      };
    });

    // Identify rare bigrams (count between 1 and 3)
    const rareBigrams: Array<{ bigram: string; count: number; status: SequenceCoverageHealth }> = [];
    Object.entries(bigramCounts).forEach(([bigram, count]) => {
      if (count < 3) {
        rareBigrams.push({ bigram, count, status: 'UNDERREPRESENTED' });
      }
    });

    const initialCovered = OL_CHIKI_BASE_LETTERS.filter((l) => (initialCounts[l] || 0) > 0).length;
    const finalCovered = OL_CHIKI_BASE_LETTERS.filter((l) => (finalCounts[l] || 0) > 0).length;

    return {
      timestamp: new Date().toISOString(),
      totalPrompts: prompts.length,
      baseLettersHealth,
      diacriticsHealth,
      numeralsHealth,
      rareBigrams: rareBigrams.slice(0, 50),
      positionHealth: {
        initialCoveragePercent: Math.round((initialCovered / OL_CHIKI_BASE_LETTERS.length) * 100),
        finalCoveragePercent: Math.round((finalCovered / OL_CHIKI_BASE_LETTERS.length) * 100)
      },
      sentenceTypeDistribution: sentenceTypeDist,
      lengthCategoryDistribution: lengthDist
    };
  }

  /**
   * Evaluates if a candidate corpus satisfies the formal Collection Readiness Gate.
   */
  public static evaluateReadinessGate(
    prompts: CorpusPromptItem[],
    options: { minPrompts?: number } = {}
  ): ReadinessGateResult {
    const minPrompts = options.minPrompts ?? 20;
    const errors: string[] = [];

    const ALL_CATEGORIES: CorpusCategory[] = [
      'GENERAL_CONVERSATION',
      'EDUCATION',
      'HEALTHCARE',
      'AGRICULTURE',
      'COMMUNITY',
      'DAILY_LIFE',
      'DIRECTIONS',
      'SAFETY',
      'NUMERALS',
      'DATES_AND_TIME',
      'MEASUREMENTS',
      'QUESTIONS',
      'COMMANDS',
      'DESCRIPTIONS',
      'NARRATIVE',
      'MIXED_LANGUAGE'
    ];

    const ALL_LENGTHS: SentenceLengthCategory[] = [
      'VERY_SHORT',
      'SHORT',
      'MEDIUM',
      'LONG',
      'VERY_LONG'
    ];

    const ALL_TYPES: CorpusSentenceType[] = [
      'STATEMENT',
      'QUESTION',
      'COMMAND',
      'REQUEST',
      'WARNING',
      'EXCLAMATION',
      'LIST',
      'EXPLANATION',
      'CONVERSATIONAL_EXCHANGE'
    ];

    // 1. Min prompts
    const minPromptsPassed = prompts.length >= minPrompts;
    if (!minPromptsPassed) {
      errors.push(`Corpus has ${prompts.length} prompts, minimum required is ${minPrompts}.`);
    }

    // 2. Category balance
    const coveredCategories = new Set(prompts.map((p) => p.category));
    const missingCategories = ALL_CATEGORIES.filter((c) => !coveredCategories.has(c));
    const categoryPassed = missingCategories.length === 0;
    if (!categoryPassed) {
      errors.push(`Missing categories: ${missingCategories.join(', ')}.`);
    }

    // 3. Length balance
    const coveredLengths = new Set(prompts.map((p) => p.lengthCategory));
    const missingLengths = ALL_LENGTHS.filter((l) => !coveredLengths.has(l));
    const lengthPassed = missingLengths.length === 0;
    if (!lengthPassed) {
      errors.push(`Missing sentence length categories: ${missingLengths.join(', ')}.`);
    }

    // 4. Sentence type balance
    const coveredTypes = new Set(prompts.map((p) => p.sentenceType));
    const missingTypes = ALL_TYPES.filter((t) => !coveredTypes.has(t));
    const typePassed = missingTypes.length === 0;
    if (!typePassed) {
      errors.push(`Missing sentence types: ${missingTypes.join(', ')}.`);
    }

    // Run sequence coverage
    const report = this.analyzeCorpus(prompts);

    // 5. Base letter coverage
    const missingLetters = Object.entries(report.baseLettersHealth)
      .filter(([, h]) => h.status === 'MISSING')
      .map(([l]) => l);
    const baseLetterPassed = missingLetters.length === 0;
    if (!baseLetterPassed) {
      errors.push(`Missing Ol Chiki base letters: ${missingLetters.join(' ')}.`);
    }

    // 6. Diacritic coverage (at least 4/5 required)
    const missingDiacritics = Object.entries(report.diacriticsHealth)
      .filter(([, h]) => h.status === 'MISSING')
      .map(([d]) => d);
    const diacriticPassed = missingDiacritics.length <= 1;
    if (!diacriticPassed) {
      errors.push(`Missing modifying diacritics: ${missingDiacritics.join(' ')}.`);
    }

    // 7. Numeral coverage (at least 8/10 required)
    const missingNumerals = Object.entries(report.numeralsHealth)
      .filter(([, h]) => h.status === 'MISSING')
      .map(([n]) => n);
    const numeralPassed = missingNumerals.length <= 2;
    if (!numeralPassed) {
      errors.push(`Missing Ol Chiki numerals: ${missingNumerals.join(' ')}.`);
    }

    // 8. Provenance integrity
    const invalidProvenance = prompts
      .filter((p) => !p.sourceType || !p.license || !p.sourceReference)
      .map((p) => p.promptId);
    const provenancePassed = invalidProvenance.length === 0;
    if (!provenancePassed) {
      errors.push(`Prompts missing provenance metadata: ${invalidProvenance.join(', ')}.`);
    }

    // 9. Dialect metadata integrity
    const invalidDialect = prompts
      .filter((p) => !p.dialect || !p.dialectConfidence || !p.dialectReviewStatus)
      .map((p) => p.promptId);
    const dialectPassed = invalidDialect.length === 0;
    if (!dialectPassed) {
      errors.push(`Prompts missing dialect metadata: ${invalidDialect.join(', ')}.`);
    }

    // 10. Review status integrity: AI_DRAFT or unreviewed cannot be RECORDING_READY
    const violatingPrompts = prompts
      .filter(
        (p) =>
          p.reviewStatus === 'RECORDING_READY' &&
          (p.sourceType === 'AI_DRAFT' || p.dialectReviewStatus === 'PENDING')
      )
      .map((p) => p.promptId);
    const reviewIntegrityPassed = violatingPrompts.length === 0;
    if (!reviewIntegrityPassed) {
      errors.push(
        `Prompts violating review integrity (AI_DRAFT marked RECORDING_READY): ${violatingPrompts.join(', ')}.`
      );
    }

    const gateList = [
      minPromptsPassed,
      categoryPassed,
      lengthPassed,
      typePassed,
      baseLetterPassed,
      diacriticPassed,
      numeralPassed,
      provenancePassed,
      dialectPassed,
      reviewIntegrityPassed
    ];

    const passedCount = gateList.filter(Boolean).length;
    const score = Math.round((passedCount / gateList.length) * 100);
    const passed = passedCount === gateList.length;

    return {
      passed,
      score,
      gates: {
        minimumPrompts: { passed: minPromptsPassed, count: prompts.length, required: minPrompts },
        categoryBalance: {
          passed: categoryPassed,
          categoriesCovered: coveredCategories.size,
          totalCategories: ALL_CATEGORIES.length,
          missingCategories
        },
        sentenceLengthBalance: {
          passed: lengthPassed,
          lengthsCovered: coveredLengths.size,
          missingLengths
        },
        sentenceTypeBalance: {
          passed: typePassed,
          typesCovered: coveredTypes.size,
          missingTypes
        },
        baseLetterCoverage: {
          passed: baseLetterPassed,
          coveredCount: OL_CHIKI_BASE_LETTERS.length - missingLetters.length,
          missingLetters
        },
        diacriticCoverage: {
          passed: diacriticPassed,
          coveredCount: OL_CHIKI_DIACRITICS.length - missingDiacritics.length,
          missingDiacritics
        },
        numeralCoverage: {
          passed: numeralPassed,
          coveredCount: OL_CHIKI_DIGITS.length - missingNumerals.length,
          missingNumerals
        },
        provenanceIntegrity: {
          passed: provenancePassed,
          invalidPrompts: invalidProvenance
        },
        dialectMetadataIntegrity: {
          passed: dialectPassed,
          invalidPrompts: invalidDialect
        },
        reviewStatusIntegrity: {
          passed: reviewIntegrityPassed,
          violatingPrompts
        }
      },
      errors
    };
  }
}
