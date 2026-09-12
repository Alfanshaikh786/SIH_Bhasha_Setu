/**
 * Bhasha Setu — Phase 8: Ol Chiki & Phonetic Coverage Analyzer
 *
 * Tracks script coverage, orthographic balance, and phonotactic diversity:
 * - 30 Ol Chiki base letters
 * - 5 modifying diacritics (Ahad, Mu-Tuda, Gahla-Tuda, Mu-Gahla-Tuda, Relo)
 * - 10 Ol Chiki numerals (᱐-᱙)
 * - Character unigram and bigram frequency distributions
 * - Word-position coverage (Initial, Medial, Final)
 */

import {
  OL_CHIKI_BASE_LETTERS,
  OL_CHIKI_DIACRITICS,
  OL_CHIKI_DIGITS,
  OL_CHIKI_PUNCTUATION_CHARS
} from './olChikiValidator';
import { ScriptCoverageReport } from './types';

export interface DetailedCoverageStatistics extends ScriptCoverageReport {
  unigramFrequencies: Record<string, number>;
  bigramFrequencies: Record<string, number>;
  wordCountDistribution: {
    minWords: number;
    maxWords: number;
    meanWords: number;
  };
  wordPositionDistribution: {
    initialLetters: Record<string, number>;
    finalLetters: Record<string, number>;
  };
}

export class CoverageAnalyzer {
  /**
   * Analyze a collection of Ol Chiki text utterances.
   */
  public static analyzeCorpus(utterances: string[]): DetailedCoverageStatistics {
    const unigramCounts: Record<string, number> = {};
    const bigramCounts: Record<string, number> = {};
    const initialCounts: Record<string, number> = {};
    const finalCounts: Record<string, number> = {};

    const baseLettersFound = new Set<string>();
    const diacriticsFound = new Set<string>();
    const digitsFound = new Set<string>();

    let totalChars = 0;
    let totalTokens = 0;
    const uniqueTokens = new Set<string>();
    const sentenceLengths: number[] = [];

    utterances.forEach(rawText => {
      const text = rawText.trim();
      if (!text) return;

      const words = text.split(/\s+/).filter(w => w.length > 0);
      sentenceLengths.push(words.length);
      totalTokens += words.length;

      words.forEach(word => {
        uniqueTokens.add(word);

        // Clean punctuation for position checks
        const cleanWord = word.replace(/[᱾᱿.,!?-]/g, '');
        if (cleanWord.length > 0) {
          const firstChar = cleanWord[0];
          const lastChar = cleanWord[cleanWord.length - 1];
          initialCounts[firstChar] = (initialCounts[firstChar] || 0) + 1;
          finalCounts[lastChar] = (finalCounts[lastChar] || 0) + 1;
        }
      });

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ') continue;

        totalChars++;
        unigramCounts[ch] = (unigramCounts[ch] || 0) + 1;

        if (OL_CHIKI_BASE_LETTERS.includes(ch)) {
          baseLettersFound.add(ch);
        } else if (OL_CHIKI_DIACRITICS.includes(ch)) {
          diacriticsFound.add(ch);
        } else if (OL_CHIKI_DIGITS.includes(ch)) {
          digitsFound.add(ch);
        }

        if (i < text.length - 1) {
          const nextCh = text[i + 1];
          if (nextCh !== ' ') {
            const bigram = `${ch}${nextCh}`;
            bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
          }
        }
      }
    });

    const missingBaseLetters = OL_CHIKI_BASE_LETTERS.filter(l => !baseLettersFound.has(l));
    const missingDiacritics = OL_CHIKI_DIACRITICS.filter(d => !diacriticsFound.has(d));
    const missingNumerals = OL_CHIKI_DIGITS.filter(n => !digitsFound.has(n));

    const baseLetterCoveragePercent = Math.round((baseLettersFound.size / OL_CHIKI_BASE_LETTERS.length) * 100);
    const diacriticCoveragePercent = Math.round((diacriticsFound.size / OL_CHIKI_DIACRITICS.length) * 100);
    const numeralCoveragePercent = Math.round((digitsFound.size / OL_CHIKI_DIGITS.length) * 100);

    const minWords = sentenceLengths.length > 0 ? Math.min(...sentenceLengths) : 0;
    const maxWords = sentenceLengths.length > 0 ? Math.max(...sentenceLengths) : 0;
    const meanWords =
      sentenceLengths.length > 0
        ? Math.round((sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length) * 10) / 10
        : 0;

    const vocabularyDiversity =
      totalTokens > 0 ? Math.round((uniqueTokens.size / totalTokens) * 100) / 100 : 0;

    return {
      totalCharacters: totalChars,
      uniqueBaseLettersFound: baseLettersFound.size,
      uniqueDiacriticsFound: diacriticsFound.size,
      uniqueNumeralsFound: digitsFound.size,
      baseLetterCoveragePercent,
      diacriticCoveragePercent,
      numeralCoveragePercent,
      missingBaseLetters,
      missingDiacritics,
      missingNumerals,
      tokenCount: totalTokens,
      vocabularyDiversity,
      unigramFrequencies: unigramCounts,
      bigramFrequencies: bigramCounts,
      wordCountDistribution: {
        minWords,
        maxWords,
        meanWords
      },
      wordPositionDistribution: {
        initialLetters: initialCounts,
        finalLetters: finalCounts
      }
    };
  }
}
