/**
 * Bhasha Setu — S2S Turn Lifecycle Logger
 * 
 * Standardized logging for every conversational S2S turn.
 * Emits the 19 required pipeline events:
 * 
 * 1.  TURN_ID
 * 2.  MIC_REQUEST
 * 3.  MIC_GRANTED
 * 4.  AUDIO_CONTEXT_STATE
 * 5.  STREAM_CREATED
 * 6.  FIRST_AUDIO_FRAME
 * 7.  VAD_SPEECH_START
 * 8.  ASR_START
 * 9.  ASR_INTERIM
 * 10. VAD_SILENCE_START
 * 11. VAD_ENDPOINT
 * 12. ASR_FLUSH
 * 13. ASR_FINAL
 * 14. FINALIZE_START
 * 15. TRANSLATION_START
 * 16. TRANSLATION_END
 * 17. TTS_START
 * 18. TTS_PLAYBACK_START
 * 19. TTS_PLAYBACK_END
 * 20. IDLE
 */

export type TurnLifecycleEvent =
  | 'TURN_ID'
  | 'MIC_REQUEST'
  | 'MIC_GRANTED'
  | 'AUDIO_CONTEXT_STATE'
  | 'STREAM_CREATED'
  | 'FIRST_AUDIO_FRAME'
  | 'VAD_SPEECH_START'
  | 'ASR_START'
  | 'ASR_INTERIM'
  | 'VAD_SILENCE_START'
  | 'VAD_ENDPOINT'
  | 'ASR_FLUSH'
  | 'ASR_FINAL'
  | 'FINALIZE_START'
  | 'TRANSLATION_START'
  | 'TRANSLATION_END'
  | 'TTS_START'
  | 'TTS_PLAYBACK_START'
  | 'TTS_PLAYBACK_END'
  | 'IDLE';

export interface TurnLogEntry {
  turnId: string;
  event: TurnLifecycleEvent;
  timestamp: number;
  relativeMs: number;
  details?: Record<string, any>;
}

export class S2STurnLogger {
  private static turnLogs: Map<string, TurnLogEntry[]> = new Map();
  private static turnStartTimes: Map<string, number> = new Map();

  /**
   * Logs a turn lifecycle event with timestamp, relative time, and optional metadata.
   */
  public static log(turnId: string, event: TurnLifecycleEvent, details?: Record<string, any>): void {
    const now = performance.now();
    if (!this.turnStartTimes.has(turnId)) {
      this.turnStartTimes.set(turnId, now);
      this.turnLogs.set(turnId, []);
    }

    const start = this.turnStartTimes.get(turnId) || now;
    const relativeMs = Math.round(now - start);

    const entry: TurnLogEntry = {
      turnId,
      event,
      timestamp: Date.now(),
      relativeMs,
      details
    };

    const list = this.turnLogs.get(turnId) || [];
    list.push(entry);
    this.turnLogs.set(turnId, list);

    // Formatted console logging for browser devtools & real-time monitoring
    const detailsStr = details ? ` | ${JSON.stringify(details)}` : '';
    console.log(`[S2S_TURN] [${relativeMs.toString().padStart(5, ' ')}ms] [${turnId}] ${event}${detailsStr}`);
  }

  /**
   * Retrieves all logged events for a given turn.
   */
  public static getTurnLogs(turnId: string): TurnLogEntry[] {
    return this.turnLogs.get(turnId) || [];
  }

  /**
   * Checks if an expected event was logged for a given turn.
   */
  public static hasEvent(turnId: string, event: TurnLifecycleEvent): boolean {
    const list = this.turnLogs.get(turnId) || [];
    return list.some(e => e.event === event);
  }

  /**
   * Cleans up history older than 50 turns to prevent memory growth.
   */
  public static pruneOldTurns(keepLatest: number = 50): void {
    if (this.turnLogs.size > keepLatest) {
      const keys = Array.from(this.turnLogs.keys());
      const toRemove = keys.slice(0, keys.length - keepLatest);
      for (const k of toRemove) {
        this.turnLogs.delete(k);
        this.turnStartTimes.delete(k);
      }
    }
  }
}
