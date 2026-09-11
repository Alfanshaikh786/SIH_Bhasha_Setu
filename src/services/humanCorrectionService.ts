/**
 * Human Correction Service for Bhasha Setu
 * 
 * Provides a structured human-in-the-loop feedback pipeline:
 * Raw ASR / MT -> User Edit -> Human Correction -> Local Storage -> Export for Model Fine-tuning.
 * 
 * Guarantees:
 * - Does NOT perform unsafe automatic model retraining.
 * - Keeps raw ASR and human corrections strictly distinct for auditing.
 * - Stores records locally (offline-first) with timestamp, language tags, and reviewer status.
 */

import { S2SStorage } from './s2s/s2sStorage';

export interface HumanCorrectionRecord {
  id: string;
  rawText: string;
  correctedText: string;
  sourceLang: string;
  targetLang?: string;
  rawTranslation?: string;
  correctedTranslation?: string;
  timestamp: number;
  engine: string;
  status: 'pending_review' | 'approved_correction' | 'flagged';
  verificationLevel?: 'AI_OUTPUT' | 'USER_CORRECTED' | 'HUMAN_REVIEWED' | 'EXPERT_VERIFIED';
  notes?: string;
}

const STORAGE_KEY = 'bhasha_setu_human_corrections_v1';

/**
 * Loads all saved human corrections from local storage.
 */
export function getHumanCorrections(): HumanCorrectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[HumanCorrectionService] Error reading corrections:', err);
    return [];
  }
}

/**
 * Saves a new human correction record to the local audit store.
 */
export function saveHumanCorrection(params: {
  rawText: string;
  correctedText: string;
  sourceLang: string;
  targetLang?: string;
  rawTranslation?: string;
  correctedTranslation?: string;
  engine?: string;
  verificationLevel?: 'AI_OUTPUT' | 'USER_CORRECTED' | 'HUMAN_REVIEWED' | 'EXPERT_VERIFIED';
  notes?: string;
}): HumanCorrectionRecord {
  const record: HumanCorrectionRecord = {
    id: `corr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    rawText: params.rawText.trim(),
    correctedText: params.correctedText.trim(),
    sourceLang: params.sourceLang,
    targetLang: params.targetLang,
    rawTranslation: params.rawTranslation?.trim(),
    correctedTranslation: params.correctedTranslation?.trim(),
    timestamp: Date.now(),
    engine: params.engine || 'IndicConformer / WebSpeech',
    status: 'approved_correction',
    verificationLevel: params.verificationLevel || 'USER_CORRECTED',
    notes: params.notes
  };

  const existing = getHumanCorrections();
  const updated = [record, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[HumanCorrectionService] Failed to save correction:', err);
  }

  // Enqueue into offline sync queue
  S2SStorage.enqueueSyncItem('human_correction', record, record.id).catch(() => {});

  return record;
}

/**
 * Deletes a human correction by ID.
 */
export function deleteHumanCorrection(id: string): void {
  const existing = getHumanCorrections();
  const updated = existing.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Clears all human corrections.
 */
export function clearAllHumanCorrections(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Exports all human corrections as a formatted JSON Blob for dataset contribution.
 */
export function exportCorrectionsJSON(): string {
  const records = getHumanCorrections();
  return JSON.stringify({
    application: 'Bhasha Setu (भाषा | SETU)',
    exportedAt: new Date().toISOString(),
    totalCorrections: records.length,
    datasetTuningReady: true,
    records
  }, null, 2);
}

/**
 * Triggers a browser file download of the human corrections audit trail (.json).
 */
export function downloadCorrectionsAuditFile(): void {
  const jsonStr = exportCorrectionsJSON();
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bhasha_setu_corrections_audit_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

