/**
 * Bhasha Setu — Phase 6: Santali Speech Data Ethics & Provenance Contract
 * 
 * Formalizes ethical speech data requirements, validation schemas, speaker partition
 * safety, and native-speaker audit interfaces for training future neural TTS models.
 */

import { SantaliSpeechSampleContract, NativeSpeakerEvaluationRecord } from './types';
import { containsOlChiki } from '../linguistics/olChikiLinguistics';

export interface DatasetPartitionAudit {
  isSafe: boolean;
  totalSpeakers: number;
  trainSpeakers: string[];
  valSpeakers: string[];
  testSpeakers: string[];
  leakageSpeakers: string[];
  errors: string[];
}

export interface SampleValidationReport {
  isValid: boolean;
  sampleId: string;
  consentApproved: boolean;
  audioCompliant: boolean;
  textCompliant: boolean;
  dialectIdentified: boolean;
  errors: string[];
}

export class SantaliDataEthicsValidator {
  /**
   * Validates an individual speech sample contract against ethical and acoustic criteria.
   */
  public static validateSample(sample: SantaliSpeechSampleContract): SampleValidationReport {
    const errors: string[] = [];

    // 1. Consent Verification (Hard Ethical Gate)
    const consentApproved = 
      sample.consentStatus === 'INFORMED_WRITTEN_CONSENT' ||
      sample.consentStatus === 'COMMUNITY_CONSENT';

    if (!consentApproved) {
      errors.push(`Ethical Violation: Sample '${sample.sampleId}' lacks documented informed consent (Status: ${sample.consentStatus})`);
    }

    // 2. Audio Acoustic Verification
    let audioCompliant = true;
    if (sample.audio.sampleRate < 16000) {
      errors.push(`Acoustic Error: Sample rate ${sample.audio.sampleRate}Hz is below minimum 16000Hz requirement`);
      audioCompliant = false;
    }
    if (sample.audio.channels !== 1) {
      errors.push(`Acoustic Error: Channels count is ${sample.audio.channels}; single-channel mono required`);
      audioCompliant = false;
    }
    if (sample.audio.durationMs < 500 || sample.audio.durationMs > 25000) {
      errors.push(`Acoustic Error: Duration ${sample.audio.durationMs}ms outside acceptable bounds (500ms - 25000ms)`);
      audioCompliant = false;
    }

    // 3. Text & Linguistic Verification
    let textCompliant = true;
    if (!sample.text || sample.text.trim().length === 0) {
      errors.push('Text Error: Transcript text is empty');
      textCompliant = false;
    } else if (sample.script === 'ol_chiki') {
      const isClean = containsOlChiki(sample.text);
      if (!isClean) {
        errors.push(`Linguistic Error: Sample tagged as 'ol_chiki' contains non-Ol Chiki or corrupted glyphs`);
        textCompliant = false;
      }
    }

    // 4. Dialect & Regional Attribution
    const dialectIdentified = Boolean(
      sample.speakerMetadata?.nativeDialect &&
      sample.speakerMetadata?.primaryRegion
    );
    if (!dialectIdentified) {
      errors.push('Metadata Error: Speaker native dialect and primary region must be documented');
    }

    return {
      isValid: errors.length === 0,
      sampleId: sample.sampleId,
      consentApproved,
      audioCompliant,
      textCompliant,
      dialectIdentified,
      errors
    };
  }

  /**
   * Enforces strict speaker partitioning across train, validation, and test splits.
   * Prevents speaker identity leakage between sets to guarantee unbiased model evaluation.
   */
  public static auditSpeakerSplits(samples: SantaliSpeechSampleContract[]): DatasetPartitionAudit {
    const trainSpeakers = new Set<string>();
    const valSpeakers = new Set<string>();
    const testSpeakers = new Set<string>();
    const leakageSpeakers = new Set<string>();
    const errors: string[] = [];

    for (const sample of samples) {
      const spk = sample.speakerId;
      if (!spk) {
        errors.push(`Sample '${sample.sampleId}' missing speakerId`);
        continue;
      }

      if (sample.split === 'train') {
        if (valSpeakers.has(spk) || testSpeakers.has(spk)) {
          leakageSpeakers.add(spk);
        }
        trainSpeakers.add(spk);
      } else if (sample.split === 'validation') {
        if (trainSpeakers.has(spk) || testSpeakers.has(spk)) {
          leakageSpeakers.add(spk);
        }
        valSpeakers.add(spk);
      } else if (sample.split === 'test') {
        if (trainSpeakers.has(spk) || valSpeakers.has(spk)) {
          leakageSpeakers.add(spk);
        }
        testSpeakers.add(spk);
      }
    }

    if (leakageSpeakers.size > 0) {
      errors.push(
        `Speaker Leakage Detected: ${leakageSpeakers.size} speaker(s) appear across multiple splits: [${Array.from(leakageSpeakers).join(', ')}]`
      );
    }

    const allSpeakers = new Set([...trainSpeakers, ...valSpeakers, ...testSpeakers]);

    return {
      isSafe: leakageSpeakers.size === 0 && errors.length === 0,
      totalSpeakers: allSpeakers.size,
      trainSpeakers: Array.from(trainSpeakers),
      valSpeakers: Array.from(valSpeakers),
      testSpeakers: Array.from(testSpeakers),
      leakageSpeakers: Array.from(leakageSpeakers),
      errors
    };
  }

  /**
   * Validates a human native-speaker evaluation record.
   */
  public static validateHumanEvaluation(record: NativeSpeakerEvaluationRecord): boolean {
    if (!record.evalId || !record.text || !record.modelId) return false;
    if (!record.reviewer?.reviewerId) return false;

    // Check Likert scale bounds (1 to 5) when present
    const checkLikert = (val?: number) => val === undefined || (val >= 1 && val <= 5 && Number.isInteger(val));

    return (
      checkLikert(record.intelligibilityScore) &&
      checkLikert(record.naturalnessScore) &&
      checkLikert(record.pronunciationAccuracyScore) &&
      checkLikert(record.dialectAppropriatenessScore)
    );
  }
}
