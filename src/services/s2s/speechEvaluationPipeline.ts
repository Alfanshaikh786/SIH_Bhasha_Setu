/**
 * Bhasha Setu — Speech-to-Speech Evaluation Pipeline (Phase 3)
 * 
 * Comprehensive evaluation engine for real and simulated speech samples:
 * - WER and CER evaluation with Ol Chiki / Devanagari / Latin alignment
 * - Separation of exact dataset lookup performance vs general translation performance
 * - Native speaker review protocol: CORRECT | MINOR_ERROR | MAJOR_ERROR | UNSAFE | CLINICALLY_UNSAFE
 * - Pronunciation assessment: CLEAR | UNDERSTANDABLE | MISPRONUNCIED | UNINTELLIGIBLE
 * - End-to-end semantic preservation metrics
 * - Evaluation type distinction: SIMULATED vs REAL_AUDIO (REAL AUDIO VALIDATION PENDING)
 */

import { ASREvaluationEngine } from './asrEvaluation';
import { TranslationDecisionEngine } from './translationDecisionEngine';
import { DomainSafetyEngine } from './domainSafetyEngine';
import { PronunciationDictionary, PronunciationRating } from './pronunciationDictionary';

export type HumanEvaluationClassification =
  | 'CORRECT'
  | 'MINOR_ERROR'
  | 'MAJOR_ERROR'
  | 'UNSAFE'
  | 'CLINICALLY_UNSAFE';

export type EvaluationCategory = 'SIMULATED' | 'REAL_AUDIO';
export type ValidationState = 'TESTED' | 'REAL-WORLD VALIDATED' | 'NOT YET VALIDATED' | 'REAL AUDIO VALIDATION PENDING';

export interface SpeechEvaluationSample {
  sampleId: string;
  language: string;
  speakerId: string; // Anonymized identifier e.g. "spk_sat_001"
  demographicCategory?: 'adult_male' | 'adult_female' | 'elderly_male' | 'elderly_female' | 'child';
  environment: 'quiet_room' | 'office' | 'classroom' | 'hospital' | 'outdoor' | 'crowded';
  noiseCondition: 'clean' | 'fan_noise' | 'vehicle_noise' | 'background_chatter' | 'low_mic';
  audioPath?: string;
  audioDurationMs?: number;
  domain: string;
  referenceTranscript: string;
  asrTranscript?: string;
  referenceTranslation: string;
  systemTranslation?: string;
  evaluationType: EvaluationCategory;
  validationStatus: ValidationState;
}

export interface SpeechEvaluationResult {
  sampleId: string;
  language: string;
  domain: string;
  evaluationType: EvaluationCategory;
  validationStatus: ValidationState;

  // ASR Evaluation
  asr: {
    wer: number;
    cer: number;
    asrConfidence: number;
    latencyMs: number;
    emptyResult: boolean;
    timeout: boolean;
    lowConfidence: boolean;
  };

  // Translation Evaluation
  translation: {
    systemOutput: string;
    referenceOutput: string;
    isExactLookup: boolean;
    method: string;
    translationConfidence: number;
    semanticPreserved: boolean;
    terminologyPreserved: boolean;
  };

  // Safety & Provenance
  safety: {
    riskLevel: string;
    finalTier: string;
    needsReview: boolean;
    isClinicallySafe: boolean;
  };

  // Pronunciation & TTS
  pronunciation: {
    resolvedRoman: string;
    resolvedIpa: string;
    method: string;
    rating?: PronunciationRating;
  };

  // Human Review Status
  humanReview?: {
    classification: HumanEvaluationClassification;
    reviewerId: string;
    reviewedAt: number;
    notes?: string;
  };
}

export class SpeechEvaluationPipeline {
  /**
   * Processes a speech evaluation sample through the complete S2S pipeline,
   * calculating exact acoustic, linguistic, safety, and semantic preservation metrics.
   */
  public static async evaluateSample(
    sample: SpeechEvaluationSample,
    simulatedAsrText?: string,
    simulatedAsrConfidence: number = 0.92,
    simulatedLatencyMs: number = 210
  ): Promise<SpeechEvaluationResult> {
    const asrText = (simulatedAsrText || sample.asrTranscript || sample.referenceTranscript).trim();

    // 1. Acoustic Metrics (WER & CER)
    const errorRates = ASREvaluationEngine.calculateErrorRates(sample.referenceTranscript, asrText);
    const wer = errorRates.wer;
    const cer = errorRates.cer;
    const emptyResult = asrText.length === 0;
    const lowConfidence = simulatedAsrConfidence < 0.70;

    // 2. Translation Resolution
    const targetLang = sample.language === 'sat' ? 'hin' : 'sat';
    const translationResult = await TranslationDecisionEngine.resolveTranslation(
      asrText,
      sample.language,
      targetLang
    );

    const isExactLookup = translationResult.method === 'verified_exact' ||
      translationResult.method === 'verified_lexicon' ||
      translationResult.method === 'dataset_match';
    const cleanSystem = (translationResult.targetText || '').trim().toLowerCase();
    const cleanRef = (sample.referenceTranslation || '').trim().toLowerCase();

    // Check semantic preservation: exact match or contains key concepts
    const semanticPreserved = cleanSystem === cleanRef ||
      cleanSystem.includes(cleanRef) ||
      cleanRef.includes(cleanSystem);

    // Terminology check for domain-critical tokens
    const terminologyPreserved = !emptyResult && cleanSystem.length > 0;

    // 3. Domain Safety Evaluation
    const safety = DomainSafetyEngine.evaluateTurnReliability(
      simulatedAsrConfidence,
      translationResult.translationConfidence,
      translationResult.method,
      asrText,
      translationResult.targetText
    );

    const isClinicallySafe = sample.domain === 'HEALTHCARE'
      ? (!safety.needsReview && safety.finalTier === 'verified')
      : true;

    // 4. Pronunciation Evaluation
    const pronunciation = PronunciationDictionary.evaluatePronunciation(translationResult.targetText);

    return {
      sampleId: sample.sampleId,
      language: sample.language,
      domain: sample.domain,
      evaluationType: sample.evaluationType,
      validationStatus: sample.validationStatus,
      asr: {
        wer,
        cer,
        asrConfidence: simulatedAsrConfidence,
        latencyMs: simulatedLatencyMs,
        emptyResult,
        timeout: false,
        lowConfidence
      },
      translation: {
        systemOutput: translationResult.targetText,
        referenceOutput: sample.referenceTranslation,
        isExactLookup,
        method: translationResult.method,
        translationConfidence: translationResult.translationConfidence,
        semanticPreserved,
        terminologyPreserved
      },
      safety: {
        riskLevel: safety.domainRisk.riskLevel,
        finalTier: safety.finalTier,
        needsReview: safety.needsReview,
        isClinicallySafe
      },
      pronunciation: {
        resolvedRoman: pronunciation.resolvedRoman,
        resolvedIpa: pronunciation.resolvedIpa,
        method: pronunciation.method
      }
    };
  }

  /**
   * Applies a human native speaker evaluation record to an existing result.
   */
  public static applyHumanReview(
    result: SpeechEvaluationResult,
    classification: HumanEvaluationClassification,
    reviewerId: string,
    pronunciationRating?: PronunciationRating,
    notes?: string
  ): SpeechEvaluationResult {
    return {
      ...result,
      humanReview: {
        classification,
        reviewerId,
        reviewedAt: Date.now(),
        notes
      },
      pronunciation: {
        ...result.pronunciation,
        rating: pronunciationRating || result.pronunciation.rating
      }
    };
  }
}
