/**
 * Human-in-the-Loop Feedback & Linguistic Evaluation Service for Bhasha Setu
 * 
 * Captures:
 * 1. User-submitted translation corrections locally (pending_review)
 * 2. Native-speaker and field-linguist evaluation reviews
 * 
 * Enforces verification states: evaluations and feedback are NEVER automatically
 * promoted to production ground truth; they are stored as 'pending_review'
 * until verified by authorized linguists.
 */

export interface UserCorrection {
  id: string;
  sourceText: string;
  sourceLang: string;
  systemTranslation: string;
  targetLang: string;
  correctedText: string;
  targetScript: string;
  isNativeSpeaker: boolean;
  domain?: string;
  dialectRegion?: string;
  notes?: string;
  status: 'pending_review' | 'linguist_verified' | 'rejected';
  timestamp: number;
}

export type ReviewClassification = 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'UNSURE';
export type ReviewNuance = 'DIALECT_DIFFERENCE' | 'ALTERNATIVE_VALID' | 'CONTEXT_DIFFERENCE' | 'STANDARD';

export interface HumanEvaluationReview {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  category: string;
  classification: ReviewClassification;
  nuance?: ReviewNuance;
  status: 'pending_review' | 'approved' | 'rejected';
  reviewer: string;
  notes?: string;
  timestamp: number;
}

const CORRECTIONS_STORAGE_KEY = 'bhasha_setu_user_corrections';
const EVALUATION_STORAGE_KEY = 'bhasha_setu_human_evaluations';

// -------------------------------------------------------------
// 1. User Corrections
// -------------------------------------------------------------

export function getStoredCorrections(): UserCorrection[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(CORRECTIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored corrections:', e);
    return [];
  }
}

export function saveCorrection(params: {
  sourceText: string;
  sourceLang: string;
  systemTranslation: string;
  targetLang: string;
  correctedText: string;
  targetScript?: string;
  isNativeSpeaker?: boolean;
  domain?: string;
  dialectRegion?: string;
  notes?: string;
}): UserCorrection {
  const existing = getStoredCorrections();
  const newCorrection: UserCorrection = {
    id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    sourceText: params.sourceText.trim(),
    sourceLang: params.sourceLang,
    systemTranslation: params.systemTranslation.trim(),
    targetLang: params.targetLang,
    correctedText: params.correctedText.trim(),
    targetScript: params.targetScript || 'Default',
    isNativeSpeaker: !!params.isNativeSpeaker,
    domain: params.domain || 'General',
    dialectRegion: params.dialectRegion || 'General',
    notes: params.notes || '',
    status: 'pending_review',
    timestamp: Date.now()
  };

  const updated = [newCorrection, ...existing];
  try {
    localStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage quota exceeded saving correction:', e);
  }

  return newCorrection;
}

export function deleteCorrection(id: string): void {
  const existing = getStoredCorrections();
  const filtered = existing.filter(c => c.id !== id);
  try {
    localStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Error updating corrections after delete:', e);
  }
}

export function clearAllCorrections(): void {
  try {
    localStorage.removeItem(CORRECTIONS_STORAGE_KEY);
  } catch {}
}

export function exportCorrectionsJson(): string {
  const corrections = getStoredCorrections();
  return JSON.stringify({
    application: 'Bhasha Setu (भाषा | SETU)',
    exportDate: new Date().toISOString(),
    totalEntries: corrections.length,
    corrections
  }, null, 2);
}

// -------------------------------------------------------------
// 2. Native Speaker & Field Linguist Evaluation Reviews
// -------------------------------------------------------------

export function getStoredHumanEvaluations(): HumanEvaluationReview[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(EVALUATION_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored evaluations:', e);
    return [];
  }
}

export function saveHumanEvaluation(params: {
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  category: string;
  classification: ReviewClassification;
  nuance?: ReviewNuance;
  reviewer: string;
  notes?: string;
}): HumanEvaluationReview {
  const existing = getStoredHumanEvaluations();
  const newEval: HumanEvaluationReview = {
    id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    sourceText: params.sourceText.trim(),
    targetText: params.targetText.trim(),
    sourceLang: params.sourceLang,
    targetLang: params.targetLang,
    category: params.category || 'General',
    classification: params.classification,
    nuance: params.nuance || 'STANDARD',
    status: 'pending_review',
    reviewer: params.reviewer || 'Field Linguist Reviewer',
    notes: params.notes || '',
    timestamp: Date.now()
  };

  const updated = [newEval, ...existing];
  try {
    localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage quota exceeded saving evaluation:', e);
  }

  return newEval;
}

export function updateHumanEvaluationStatus(id: string, newStatus: 'approved' | 'rejected' | 'pending_review'): void {
  const existing = getStoredHumanEvaluations();
  const updated = existing.map(e => e.id === id ? { ...e, status: newStatus } : e);
  try {
    localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error updating evaluation status:', e);
  }
}

export function deleteHumanEvaluation(id: string): void {
  const existing = getStoredHumanEvaluations();
  const filtered = existing.filter(e => e.id !== id);
  try {
    localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Error updating evaluations after delete:', e);
  }
}

export function exportHumanEvaluationsJson(): string {
  const evals = getStoredHumanEvaluations();
  return JSON.stringify({
    application: 'Bhasha Setu (भाषा | SETU) — Human Evaluation Workflow',
    exportDate: new Date().toISOString(),
    totalEvaluations: evals.length,
    summary: {
      correct: evals.filter(e => e.classification === 'CORRECT').length,
      partiallyCorrect: evals.filter(e => e.classification === 'PARTIALLY_CORRECT').length,
      incorrect: evals.filter(e => e.classification === 'INCORRECT').length,
      unsure: evals.filter(e => e.classification === 'UNSURE').length,
      approved: evals.filter(e => e.status === 'approved').length,
      pending: evals.filter(e => e.status === 'pending_review').length
    },
    evaluations: evals
  }, null, 2);
}
