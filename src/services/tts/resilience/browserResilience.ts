/**
 * Bhasha Setu — Browser Speech Resilience & Watchdog Layer
 *
 * Solves known browser speech synthesis failure modes:
 * 1. Garbage collection bug: Retains references in window.__activeUtterances and module Set.
 * 2. Chromium 14-second freeze: Heartbeat resume keepalive.
 * 3. Cancel bug: Resumes paused synthesis before dispatch.
 * 4. Emergency watchdog: Clears hung audio threads without cutting off valid speech.
 * 5. Web Audio tone fallback: Infallible acoustic feedback when TTS engine is blocked.
 */

const activeUtterances = new Set<SpeechSynthesisUtterance>();
let chromeHeartbeatTimer: any = null;

export class BrowserResilience {
  /**
   * Registers an utterance to prevent JavaScript garbage collection from abruptly cutting off speech.
   */
  public static retainUtterance(utterance: SpeechSynthesisUtterance): void {
    activeUtterances.add(utterance);
    if (typeof window !== 'undefined') {
      if (!(window as any).__activeUtterances) {
        (window as any).__activeUtterances = [];
      }
      (window as any).__activeUtterances.push(utterance);
    }
  }

  /**
   * Releases an utterance reference when playback finishes or is cancelled.
   */
  public static releaseUtterance(utterance: SpeechSynthesisUtterance): void {
    activeUtterances.delete(utterance);
    if (typeof window !== 'undefined' && (window as any).__activeUtterances) {
      const arr = (window as any).__activeUtterances as SpeechSynthesisUtterance[];
      const idx = arr.indexOf(utterance);
      if (idx !== -1) arr.splice(idx, 1);
    }
  }

  /**
   * Clears all retained active utterances during global stop or reset.
   */
  public static releaseAllUtterances(): void {
    activeUtterances.clear();
    if (typeof window !== 'undefined' && (window as any).__activeUtterances) {
      (window as any).__activeUtterances.length = 0;
    }
  }

  /**
   * Starts a periodic heartbeat to prevent Chromium from pausing long utterances after ~14 seconds.
   */
  public static startKeepAlive(): void {
    this.stopKeepAlive();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    chromeHeartbeatTimer = setInterval(() => {
      try {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      } catch {}
    }, 10000);
  }

  /**
   * Stops the Chromium keepalive heartbeat.
   */
  public static stopKeepAlive(): void {
    if (chromeHeartbeatTimer) {
      clearInterval(chromeHeartbeatTimer);
      chromeHeartbeatTimer = null;
    }
  }

  /**
   * Safely resets the browser speech synthesis state.
   */
  public static resetBrowserSpeech(): void {
    this.stopKeepAlive();
    this.releaseAllUtterances();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {}
    }
  }

  /**
   * Plays an infallible acoustic confirmation tone via the Web Audio API.
   * Used when browser speech synthesis is unavailable or encounters a fatal OS error.
   */
  public static playAcousticChime(onEnd?: () => void): void {
    if (typeof window === 'undefined') {
      onEnd?.();
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        onEnd?.();
        return;
      }

      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 (440Hz)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.28); // A5 (880Hz)

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          ctx.close().catch(() => {});
        } catch {}
        onEnd?.();
      };

      osc.start();
      osc.stop(ctx.currentTime + 0.35);

    } catch (e) {
      console.warn('[BrowserResilience] Web Audio API tone synthesis failed:', e);
      onEnd?.();
    }
  }
}
