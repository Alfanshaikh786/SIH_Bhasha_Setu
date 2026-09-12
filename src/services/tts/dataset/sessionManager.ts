/**
 * Bhasha Setu — Phase 9: Recording Session & Take Management Engine
 *
 * Implements:
 * - Deterministic, seeded prompt ordering to eliminate presentation bias and fatigue.
 * - Session batching with consent cross-referencing.
 * - Speaker contribution caps (min 25, recommended 150, max cap 500) to prevent dataset skew.
 * - Multi-take tracking with deterministic quality-driven take selection (avoiding pure loudness bias).
 */

import {
  RecordingSession,
  RecordingTake,
  SpeakerContributionPolicy,
  DEFAULT_CONTRIBUTION_POLICY
} from './corpusTypes';

/**
 * Deterministic pseudo-random number generator using Mulberry32 algorithm.
 * Guarantees identical shuffle permutations across platforms given the same seed.
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array of items using Fisher-Yates with a seeded PRNG.
 */
export function seededShuffle<T>(array: readonly T[], seed: number): T[] {
  const result = [...array];
  const rng = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export class SessionManager {
  private sessions: Map<string, RecordingSession> = new Map();
  private takes: Map<string, RecordingTake[]> = new Map(); // promptId -> takes
  private policy: SpeakerContributionPolicy;

  constructor(policy: SpeakerContributionPolicy = DEFAULT_CONTRIBUTION_POLICY) {
    this.policy = policy;
  }

  /**
   * Creates a structured recording session with deterministically randomized prompt order.
   */
  public createSession(params: {
    sessionId: string;
    speakerId: string;
    promptIds: string[];
    randomizationSeed: number;
    consentReference: string;
    sessionDate?: string;
    recordingEnvironment?: string;
    equipment?: string;
  }): RecordingSession {
    if (!params.consentReference || params.consentReference.trim() === '') {
      throw new Error(`Cannot initiate session ${params.sessionId}: valid consentReference is strictly required.`);
    }

    if (!params.promptIds || params.promptIds.length === 0) {
      throw new Error(`Cannot initiate session ${params.sessionId}: promptIds must not be empty.`);
    }

    // Generate deterministic ordering indices
    const indices = params.promptIds.map((_, idx) => idx);
    const randomizedOrder = seededShuffle(indices, params.randomizationSeed);

    const session: RecordingSession = {
      sessionId: params.sessionId,
      speakerId: params.speakerId,
      promptIds: params.promptIds,
      recordingOrder: randomizedOrder,
      randomizationSeed: params.randomizationSeed,
      sessionDate: params.sessionDate || new Date().toISOString(),
      recordingEnvironment: params.recordingEnvironment || 'Acoustically treated studio booth',
      equipment: params.equipment || 'Studio condenser microphone (Cardioid, 48kHz/24bit)',
      consentReference: params.consentReference,
      maxDurationMinutes: this.policy.maxSessionMinutes,
      completedTakesCount: 0,
      status: 'SCHEDULED'
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  /**
   * Get prompts in the deterministically shuffled order for the session.
   */
  public getOrderedPromptIds(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found.`);
    }
    return session.recordingOrder.map((idx) => session.promptIds[idx]);
  }

  /**
   * Adds an audio recording take for a prompt.
   */
  public recordTake(take: RecordingTake): void {
    const existing = this.takes.get(take.promptId) || [];
    existing.push(take);
    this.takes.set(take.promptId, existing);

    const session = this.sessions.get(take.sessionId);
    if (session) {
      session.completedTakesCount += 1;
      if (session.status === 'SCHEDULED') {
        session.status = 'IN_PROGRESS';
      }
    }
  }

  /**
   * Evaluates speaker contribution limits and flags skew or fatigue.
   */
  public checkSpeakerContribution(
    speakerId: string,
    completedTakes: RecordingTake[]
  ): {
    allowed: boolean;
    reason?: string;
    currentPromptCount: number;
    totalDurationMinutes: number;
    isFatigued: boolean;
  } {
    const speakerTakes = completedTakes.filter((t) => t.speakerId === speakerId && t.selectedTake);
    const distinctPrompts = new Set(speakerTakes.map((t) => t.promptId));
    const currentCount = distinctPrompts.size;

    const totalSeconds = speakerTakes.reduce((acc, t) => acc + t.durationSeconds, 0);
    const totalMinutes = Math.round((totalSeconds / 60) * 10) / 10;

    // Skew prevention cap
    if (currentCount >= this.policy.maxCapPrompts) {
      return {
        allowed: false,
        reason: `Speaker ${speakerId} has reached the dataset skew cap of ${this.policy.maxCapPrompts} prompts.`,
        currentPromptCount: currentCount,
        totalDurationMinutes: totalMinutes,
        isFatigued: false
      };
    }

    // Continuous duration fatigue indicator
    const isFatigued = totalMinutes > this.policy.maxSessionMinutes;

    return {
      allowed: true,
      currentPromptCount: currentCount,
      totalDurationMinutes: totalMinutes,
      isFatigued
    };
  }

  /**
   * Deterministically selects the best take for a given prompt.
   * Multi-factor scoring prioritizing low clipping, safe RMS (-24 to -14 dB), and clean silence.
   * Explicitly DOES NOT pick a take purely because it is the loudest.
   */
  public selectBestTake(promptId: string): RecordingTake | null {
    const takes = this.takes.get(promptId) || [];
    if (takes.length === 0) return null;

    // Filter out rejected takes first
    const eligible = takes.filter((t) => t.qualityStatus !== 'REJECT' && t.clippingPercentage === 0);
    const pool = eligible.length > 0 ? eligible : takes.filter((t) => t.qualityStatus !== 'REJECT');

    if (pool.length === 0) {
      // All takes were rejected
      return null;
    }

    // Score takes: lower score is better (distance from ideal targets)
    // Ideal: clipping = 0, rms in [-22, -16] dB, silence between [150, 400] ms
    const scored = pool.map((t) => {
      let penalty = 0;
      // Clipping penalty
      penalty += t.clippingPercentage * 100;

      // Target RMS: -18 dB
      const rmsDiff = Math.abs(t.rmsDb - (-18));
      penalty += rmsDiff * 2;

      // Silence penalty (ideal trailing silence ~250ms)
      const silenceDiff = Math.abs(t.trailingSilenceMs - 250);
      penalty += silenceDiff * 0.05;

      // Status penalty
      if (t.qualityStatus === 'WARNING') penalty += 20;

      return { take: t, score: penalty };
    });

    scored.sort((a, b) => a.score - b.score);
    const best = scored[0].take;

    // Mark best as selected, others as unselected
    for (const t of takes) {
      t.selectedTake = t.takeId === best.takeId;
    }

    return best;
  }

  /**
   * Retrieves all takes recorded for a prompt.
   */
  public getTakesForPrompt(promptId: string): RecordingTake[] {
    return this.takes.get(promptId) || [];
  }

  public getSession(sessionId: string): RecordingSession | undefined {
    return this.sessions.get(sessionId);
  }
}
