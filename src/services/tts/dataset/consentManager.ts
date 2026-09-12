/**
 * Bhasha Setu — Phase 8: Ethical Consent & Speaker Withdrawal Manager
 *
 * Enforces strict informed consent governance and cascading withdrawal support.
 * Distinguishes:
 * - Model training permission
 * - Research permission
 * - Commercial use permission
 * - Open redistribution permission
 */

import { ConsentRecord, SpeechSampleRecord } from './types';

export interface WithdrawalAuditReport {
  speakerId: string;
  consentId: string;
  timestamp: string;
  reason: string;
  revokedSampleCount: number;
  revokedSampleIds: string[];
}

export class ConsentManager {
  private static consentLedger: Map<string, ConsentRecord> = new Map();
  private static speakerToConsents: Map<string, string[]> = new Map();

  /**
   * Register or update a verified consent record.
   */
  public static registerConsent(record: ConsentRecord): void {
    if (!record.consentId || !record.speakerId) {
      throw new Error('Malformed ConsentRecord: consentId and speakerId are required.');
    }

    this.consentLedger.set(record.consentId, { ...record });

    const existing = this.speakerToConsents.get(record.speakerId) || [];
    if (!existing.includes(record.consentId)) {
      existing.push(record.consentId);
      this.speakerToConsents.set(record.speakerId, existing);
    }
  }

  /**
   * Retrieve a consent record by consentId.
   */
  public static getConsent(consentId: string): ConsentRecord | undefined {
    return this.consentLedger.get(consentId);
  }

  /**
   * Retrieve all consent records associated with a speaker.
   */
  public static getConsentsForSpeaker(speakerId: string): ConsentRecord[] {
    const ids = this.speakerToConsents.get(speakerId) || [];
    return ids.map(id => this.consentLedger.get(id)!).filter(Boolean);
  }

  /**
   * Verify if a consent record satisfies the required permission scope.
   */
  public static verifyPermission(
    consentId: string,
    permission: 'model_training' | 'commercial_use' | 'redistribution'
  ): { allowed: boolean; reason?: string } {
    const consent = this.consentLedger.get(consentId);
    if (!consent) {
      return { allowed: false, reason: `Consent record '${consentId}' not found in registry.` };
    }

    if (consent.status !== 'ACTIVE') {
      return { allowed: false, reason: `Consent '${consentId}' is inactive (status: ${consent.status}).` };
    }

    if (permission === 'model_training' && !consent.modelTrainingPermission) {
      return { allowed: false, reason: `Consent '${consentId}' does not permit model training.` };
    }

    if (permission === 'commercial_use' && !consent.commercialUsePermission) {
      return { allowed: false, reason: `Consent '${consentId}' does not permit commercial use.` };
    }

    if (permission === 'redistribution' && !consent.redistributionPermission) {
      return { allowed: false, reason: `Consent '${consentId}' does not permit redistribution.` };
    }

    return { allowed: true };
  }

  /**
   * Execute speaker withdrawal and cascade revocation through all associated samples.
   * Ensures zero lingering training samples for withdrawn speakers.
   */
  public static withdrawSpeakerConsent(
    speakerId: string,
    samples: SpeechSampleRecord[],
    reason: string = 'Speaker requested complete withdrawal of voice data.'
  ): {
    auditReport: WithdrawalAuditReport;
    updatedSamples: SpeechSampleRecord[];
  } {
    const now = new Date().toISOString();
    const consentIds = this.speakerToConsents.get(speakerId) || [];

    // 1. Mark all consents for speaker as WITHDRAWN
    consentIds.forEach(id => {
      const c = this.consentLedger.get(id);
      if (c) {
        c.status = 'WITHDRAWN';
        c.withdrawnAt = now;
        c.withdrawalReason = reason;
      }
    });

    const revokedSampleIds: string[] = [];

    // 2. Cascade revocation into samples
    const updatedSamples = samples.map(sample => {
      if (sample.speakerId === speakerId) {
        revokedSampleIds.push(sample.sampleId);
        return {
          ...sample,
          consentStatus: 'WITHDRAWN' as const,
          reviewStatus: 'REJECTED' as const,
          notes: `[CONSENT REVOKED ${now}] Reason: ${reason}`
        };
      }
      return sample;
    });

    const auditReport: WithdrawalAuditReport = {
      speakerId,
      consentId: consentIds[0] || 'NONE',
      timestamp: now,
      reason,
      revokedSampleCount: revokedSampleIds.length,
      revokedSampleIds
    };

    return {
      auditReport,
      updatedSamples
    };
  }

  /**
   * Reset internal ledger state (for testing isolation).
   */
  public static reset(): void {
    this.consentLedger.clear();
    this.speakerToConsents.clear();
  }
}
