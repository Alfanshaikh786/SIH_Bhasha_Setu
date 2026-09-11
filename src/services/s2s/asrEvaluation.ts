/**
 * Bhasha Setu — S2S ASR Accuracy & Error Rate Evaluation Infrastructure
 * 
 * Computes:
 * - Word Error Rate (WER): (Substitutions + Deletions + Insertions) / Total Reference Words
 * - Character Error Rate (CER): (Substitutions + Deletions + Insertions) / Total Reference Characters
 * - Empty Result Rate: Percentage of audio frames producing empty transcripts
 * - Timeout Rate: Percentage of queries exceeding watchdog timeout
 * - Low-Confidence Rate: Percentage of utterances triggering Never-Guess review
 * 
 * Supports:
 * - Santali Ol Chiki Unicode (U+1C50–U+1C7F)
 * - Hindi Devanagari Unicode (U+0900–U+097F)
 * - English Latin
 */

export interface ErrorRateMetrics {
  wer: number; // 0.0 to 1.0 (or > 1.0 on extreme insertions)
  cer: number; // 0.0 to 1.0
  wordSubstitutions: number;
  wordDeletions: number;
  wordInsertions: number;
  totalRefWords: number;
  totalRefChars: number;
}

export interface ASREvaluationSummary {
  language: string;
  samplesEvaluated: number;
  avgWer: number;
  avgCer: number;
  emptyResultRate: number;
  lowConfidenceRate: number;
  timeoutRate: number;
  validationStatus: 'VALIDATED_SYNTHETIC' | 'REAL_AUDIO_VALIDATION_PENDING';
}

export class ASREvaluationEngine {
  /**
   * Calculates Levenshtein-based Word Error Rate (WER) and Character Error Rate (CER).
   */
  public static calculateErrorRates(reference: string, hypothesis: string): ErrorRateMetrics {
    const refWords = this.tokenize(reference);
    const hypWords = this.tokenize(hypothesis);

    const wordLev = this.computeLevenshtein(refWords, hypWords);
    const wer = refWords.length > 0 ? wordLev.distance / refWords.length : (hypWords.length > 0 ? 1.0 : 0.0);

    const refChars = Array.from(reference.replace(/\s+/g, ''));
    const hypChars = Array.from(hypothesis.replace(/\s+/g, ''));
    const charLev = this.computeLevenshtein(refChars, hypChars);
    const cer = refChars.length > 0 ? charLev.distance / refChars.length : (hypChars.length > 0 ? 1.0 : 0.0);

    return {
      wer: Math.round(wer * 1000) / 1000,
      cer: Math.round(cer * 1000) / 1000,
      wordSubstitutions: wordLev.substitutions,
      wordDeletions: wordLev.deletions,
      wordInsertions: wordLev.insertions,
      totalRefWords: refWords.length,
      totalRefChars: refChars.length
    };
  }

  /**
   * Tokenizes text into word units, handling Ol Chiki punctuation (᱾, ᱿).
   */
  private static tokenize(text: string): string[] {
    return text
      .replace(/[᱾᱿।,?.!]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  /**
   * Levenshtein Dynamic Programming algorithm tracking S, D, and I counts.
   */
  private static computeLevenshtein(ref: string[], hyp: string[]): {
    distance: number;
    substitutions: number;
    deletions: number;
    insertions: number;
  } {
    const m = ref.length;
    const n = hyp.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (ref[i - 1] === hyp[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j - 1], // Substitution
            dp[i - 1][j],     // Deletion
            dp[i][j - 1]      // Insertion
          );
        }
      }
    }

    // Backtrack to count operations
    let i = m;
    let j = n;
    let substitutions = 0;
    let deletions = 0;
    let insertions = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && ref[i - 1] === hyp[j - 1]) {
        i--;
        j--;
      } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
        substitutions++;
        i--;
        j--;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        deletions++;
        i--;
      } else {
        insertions++;
        j--;
      }
    }

    return {
      distance: dp[m][n],
      substitutions,
      deletions,
      insertions
    };
  }
}
