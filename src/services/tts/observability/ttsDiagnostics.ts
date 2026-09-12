/**
 * Bhasha Setu — Production TTS Observability & Telemetry
 *
 * Tracks system reliability, engine routing, and latency without capturing
 * or persisting sensitive patient, student, or citizen speech content (Zero PII).
 */

import { TTSObservabilityMetrics, TTSErrorCode } from '../types';

class TTSDiagnosticsManager {
  private metrics: TTSObservabilityMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cancelledRequests: 0,
    fallbackCount: 0,
    averageLatencyMs: 0,
    errorCounts: {},
    lastPlaybackDurationMs: 0
  };

  private totalLatencyAccumulatorMs = 0;
  private latencyMeasurementCount = 0;

  public recordRequest(langCode: string, engineType: string, chunkCount: number): void {
    this.metrics.totalRequests++;
  }

  public recordSuccess(durationMs: number): void {
    this.metrics.successfulRequests++;
    this.metrics.lastPlaybackDurationMs = durationMs;

    this.totalLatencyAccumulatorMs += durationMs;
    this.latencyMeasurementCount++;
    this.metrics.averageLatencyMs = Math.round(
      this.totalLatencyAccumulatorMs / this.latencyMeasurementCount
    );
  }

  public recordFailure(code: TTSErrorCode): void {
    this.metrics.failedRequests++;
    this.metrics.errorCounts[code] = (this.metrics.errorCounts[code] || 0) + 1;
  }

  public recordCancellation(): void {
    this.metrics.cancelledRequests++;
  }

  public recordFallback(): void {
    this.metrics.fallbackCount++;
  }

  public getMetrics(): TTSObservabilityMetrics {
    return {
      ...this.metrics,
      errorCounts: { ...this.metrics.errorCounts }
    };
  }

  public reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cancelledRequests: 0,
      fallbackCount: 0,
      averageLatencyMs: 0,
      errorCounts: {},
      lastPlaybackDurationMs: 0
    };
    this.totalLatencyAccumulatorMs = 0;
    this.latencyMeasurementCount = 0;
  }
}

export const TTSDiagnostics = new TTSDiagnosticsManager();
