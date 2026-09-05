/**
 * Ground Truth Validation & OCR Accuracy Evaluation Metrics
 * Calculates Character Error Rate (CER) and Word Error Rate (WER).
 *
 * CER = EditDistance(OCR, GroundTruth) / Length(GroundTruth)
 * WER = EditDistance(OCRWords, GroundTruthWords) / NumberOfGroundTruthWords
 */

export interface AccuracyEvaluationResult {
  cer: number; // 0.0 to 1.0 (or >1 if insertions exceed length)
  wer: number; // 0.0 to 1.0
  accuracyPercent: number; // 0% to 100%
  charDistance: number;
  totalGroundTruthChars: number;
  wordDistance: number;
  totalGroundTruthWords: number;
}

/**
 * Standard Levenshtein edit distance for character or token sequences
 */
export function computeLevenshteinDistance<T>(a: T[], b: T[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP optimization
  let prevRow = new Int32Array(n + 1);
  let currRow = new Int32Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const aItem = a[i - 1];

    for (let j = 1; j <= n; j++) {
      const cost = aItem === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,      // deletion
        currRow[j - 1] + 1,  // insertion
        prevRow[j - 1] + cost // substitution
      );
    }

    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

/**
 * Normalizes text for fair OCR comparison (collapses multiple spaces and trimmed lines)
 */
export function normalizeTextForEvaluation(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('\n');
}

/**
 * Evaluates OCR output against known ground truth text
 */
export function evaluateOCRAccuracy(ocrText: string, groundTruthText: string): AccuracyEvaluationResult {
  const normOCR = normalizeTextForEvaluation(ocrText);
  const normGT = normalizeTextForEvaluation(groundTruthText);

  if (!normGT) {
    return {
      cer: 0,
      wer: 0,
      accuracyPercent: 100,
      charDistance: 0,
      totalGroundTruthChars: 0,
      wordDistance: 0,
      totalGroundTruthWords: 0
    };
  }

  // 1. Character Error Rate (CER)
  const ocrChars = Array.from(normOCR);
  const gtChars = Array.from(normGT);
  const charDistance = computeLevenshteinDistance(ocrChars, gtChars);
  const totalGroundTruthChars = Math.max(1, gtChars.length);
  const cer = Math.round((charDistance / totalGroundTruthChars) * 1000) / 1000;

  // 2. Word Error Rate (WER)
  const ocrWords = normOCR.split(/\s+/).filter(Boolean);
  const gtWords = normGT.split(/\s+/).filter(Boolean);
  const wordDistance = computeLevenshteinDistance(ocrWords, gtWords);
  const totalGroundTruthWords = Math.max(1, gtWords.length);
  const wer = Math.round((wordDistance / totalGroundTruthWords) * 1000) / 1000;

  // Accuracy (1 - CER bounded between 0% and 100%)
  const accuracyPercent = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, cer)) * 1000) / 10));

  return {
    cer,
    wer,
    accuracyPercent,
    charDistance,
    totalGroundTruthChars,
    wordDistance,
    totalGroundTruthWords
  };
}
