/**
 * Bhasha Setu — S2S Performance & Telemetry Instrumentation
 * 
 * Accurately measures:
 * - ASR Latency
 * - Translation Latency
 * - Safety & Domain Check Latency
 * - TTS Latency
 * - End-to-End Turn Latency
 * 
 * Computes reproducible statistical metrics (Average, P50, P95, Max).
 * Privacy-Preserving: Records only millisecond timings and anonymous metadata.
 */

import { S2SLatencyMetrics } from './s2sTypes';

export interface PerformanceStats {
  samples: number;
  avgEndToEndMs: number;
  p50EndToEndMs: number;
  p95EndToEndMs: number;
  maxEndToEndMs: number;
  avgAsrMs: number;
  avgTranslationMs: number;
}

export class S2SPerformanceTracker {
  private static history: S2SLatencyMetrics[] = [];
  private static readonly MAX_HISTORY = 200;

  /**
   * Records a completed turn latency breakdown.
   */
  public static recordTurn(metrics: S2SLatencyMetrics): void {
    this.history.push(metrics);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }
  }

  /**
   * Computes P50, P95, and average latency metrics across recorded turns.
   */
  public static getStats(): PerformanceStats {
    if (this.history.length === 0) {
      return {
        samples: 0,
        avgEndToEndMs: 0,
        p50EndToEndMs: 0,
        p95EndToEndMs: 0,
        maxEndToEndMs: 0,
        avgAsrMs: 0,
        avgTranslationMs: 0
      };
    }

    const n = this.history.length;
    const sortedE2E = this.history.map(h => h.endToEndMs).sort((a, b) => a - b);
    const sumE2E = sortedE2E.reduce((acc, v) => acc + v, 0);
    const sumAsr = this.history.reduce((acc, h) => acc + h.asrProcessingMs, 0);
    const sumTrans = this.history.reduce((acc, h) => acc + h.translationMs, 0);

    const p50Index = Math.floor(n * 0.5);
    const p95Index = Math.min(n - 1, Math.floor(n * 0.95));

    return {
      samples: n,
      avgEndToEndMs: Math.round(sumE2E / n),
      p50EndToEndMs: sortedE2E[p50Index],
      p95EndToEndMs: sortedE2E[p95Index],
      maxEndToEndMs: sortedE2E[n - 1],
      avgAsrMs: Math.round(sumAsr / n),
      avgTranslationMs: Math.round(sumTrans / n)
    };
  }

  /**
   * Clears benchmark records (useful for fresh tests).
   */
  public static clear(): void {
    this.history = [];
  }
}
