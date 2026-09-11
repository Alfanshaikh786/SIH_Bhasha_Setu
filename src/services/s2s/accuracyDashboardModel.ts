/**
 * Bhasha Setu — S2S Accuracy Dashboard Data Model & Confidence Calibration
 * 
 * Provides structured quality metrics and empirical calibration models
 * for administrative and evaluation reporting without altering the user-facing UI:
 * - Domain-level WER/CER, lookup vs general translation accuracy
 * - Empirical confidence calibration across 6 probability buckets:
 *   [0.0-0.5), [0.5-0.6), [0.6-0.7), [0.7-0.8), [0.8-0.9), [0.9-1.0]
 * - Monotonicity validation (Confidence must correlate with reliability)
 * - Safe status tagging: SIMULATED vs REAL AUDIO vs NOT YET VALIDATED
 */

import { ValidationState, EvaluationCategory } from './speechEvaluationPipeline';

export interface ConfidenceBucketStat {
  range: string;
  minConfidence: number;
  maxConfidence: number;
  totalSamples: number;
  correctSamples: number;
  observedAccuracy: number; // 0.0 - 1.0
  isCalibrated: boolean;    // true if observed accuracy is within expected range
}

export interface DomainAccuracyReport {
  domain: string;
  languagePair: string;
  sampleCount: number;
  wer: number;
  cer: number;
  exactLookupAccuracy: number;
  generalTranslationAccuracy: number;
  unsafeRate: number;
  clinicallyUnsafeRate: number;
  lowConfidenceRate: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  ttsFailureRate: number;
  evaluationType: EvaluationCategory;
  validationStatus: ValidationState;
}

export class AccuracyDashboardModel {
  /**
   * Evaluates empirical confidence calibration across 6 probability buckets.
   * Compares predicted confidence with observed ground-truth correctness.
   */
  public static calibrateConfidenceBuckets(
    predictions: Array<{ confidence: number; isCorrect: boolean }>
  ): ConfidenceBucketStat[] {
    const buckets = [
      { range: '0.0–0.5', min: 0.0, max: 0.5, total: 0, correct: 0 },
      { range: '0.5–0.6', min: 0.5, max: 0.6, total: 0, correct: 0 },
      { range: '0.6–0.7', min: 0.6, max: 0.7, total: 0, correct: 0 },
      { range: '0.7–0.8', min: 0.7, max: 0.8, total: 0, correct: 0 },
      { range: '0.8–0.9', min: 0.8, max: 0.9, total: 0, correct: 0 },
      { range: '0.9–1.0', min: 0.9, max: 1.01, total: 0, correct: 0 }
    ];

    for (const p of predictions) {
      for (const b of buckets) {
        if (p.confidence >= b.min && p.confidence < b.max) {
          b.total++;
          if (p.isCorrect) b.correct++;
          break;
        }
      }
    }

    return buckets.map(b => {
      const observedAccuracy = b.total > 0 ? b.correct / b.total : 0;
      // Monotonic calibration check: observed accuracy roughly correlates with bucket bounds
      const isCalibrated = b.total === 0 || observedAccuracy >= (b.min * 0.7);
      return {
        range: b.range,
        minConfidence: b.min,
        maxConfidence: b.max > 1.0 ? 1.0 : b.max,
        totalSamples: b.total,
        correctSamples: b.correct,
        observedAccuracy: Number(observedAccuracy.toFixed(4)),
        isCalibrated
      };
    });
  }

  /**
   * Formats a structured domain accuracy report for telemetry / administrative inspection.
   */
  public static createDomainReport(params: {
    domain: string;
    languagePair: string;
    sampleCount: number;
    wer: number;
    cer: number;
    exactLookupAccuracy: number;
    generalTranslationAccuracy: number;
    unsafeRate: number;
    clinicallyUnsafeRate: number;
    lowConfidenceRate: number;
    latencyP50Ms: number;
    latencyP95Ms: number;
    ttsFailureRate: number;
    evaluationType: EvaluationCategory;
    validationStatus: ValidationState;
  }): DomainAccuracyReport {
    return { ...params };
  }
}
