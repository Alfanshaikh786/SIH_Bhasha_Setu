/**
 * Bhasha Setu — Prosody Intelligence & Speech Planning Engine
 *
 * Analyzes sentence structures, punctuation boundaries, and clinical context
 * to formulate adaptive speech timing plans (prosody pauses and controlled pacing)
 * without modifying user UI sliders or fabricating fake intonation.
 */

import { SentenceType, SpeechPlan, DifficultWordInfo, TTSPlaybackInfo, TTSPronunciationQuality } from '../types';
import { TTSChunker } from '../chunker';
import { PronunciationConfidenceEngine } from '../confidence/pronunciationConfidence';

export const PROSODY_POLICY = {
  version: '2.5-production',
  instructionRateMultiplier: 0.92,
  difficultWordsRateMultiplier: 0.94,
  minRate: 0.5,
  maxRate: 1.5,
  pauses: {
    listCommaMs: 260,
    standardCommaMs: 180,
    questionSentenceMs: 450,
    standardSentenceMs: 400,
    paragraphMs: 650
  }
} as const;

const SANTALI_INTERROGATIVES = [
  'ᱪᱮᱫ', 'ᱪᱮᱫ ᱞᱮᱠᱟ', 'ᱪᱤᱞᱠᱟ', 'ᱚᱠᱟ', 'ᱚᱠᱟᱨᱮ', 'ᱛᱤᱱᱟᱹᱜ', 'ᱚᱠᱚᱭ', 'ᱪᱮᱫᱟᱜ'
];

const HINDI_INTERROGATIVES = [
  'क्या', 'कहाँ', 'कैसे', 'कब', 'क्यों', 'किसका', 'कौन', 'कितना'
];

const ENGLISH_INTERROGATIVES = [
  'what', 'where', 'how', 'when', 'why', 'who', 'which', 'is', 'are', 'can', 'do', 'does'
];

const CLINICAL_INSTRUCTION_PATTERNS = [
  // Santali clinical imperative words
  'ᱵᱤᱰᱟᱹᱣ', 'ᱡᱚᱢ ᱢᱮ', 'ᱧᱩᱭ ᱢᱮ', 'ᱨᱟᱱ', 'ᱦᱟᱥᱯᱟᱛᱟᱞ', 'ᱢᱟᱭᱟᱢ',
  // Hindi clinical imperative words
  'दवा', 'गोली', 'लें', 'पिएं', 'जांच', 'अस्पताल', 'इलाज', 'रक्त',
  // English clinical imperative words
  'tablet', 'take', 'drink', 'dosage', 'hospital', 'test', 'blood', 'screening', 'doctor', 'mg', 'ml'
];

export class ProsodyEngine {
  /**
   * Classifies the structural sentence type of input text.
   */
  public static detectSentenceType(text: string, langCode: string): SentenceType {
    const trimmed = text.trim();
    if (!trimmed) return 'STATEMENT';

    // 1. Exclamation
    if (trimmed.endsWith('!') || trimmed.includes('!')) {
      return 'EXCLAMATION';
    }

    // 2. Question
    if (trimmed.endsWith('?') || trimmed.includes('?')) {
      return 'QUESTION';
    }

    const lower = trimmed.toLowerCase();
    const lang = langCode.toLowerCase().trim();

    if (lang === 'sat' || lang === 'santali') {
      if (SANTALI_INTERROGATIVES.some(q => trimmed.includes(q))) {
        return 'QUESTION';
      }
    } else if (lang === 'hin' || lang === 'hindi') {
      if (HINDI_INTERROGATIVES.some(q => trimmed.includes(q))) {
        return 'QUESTION';
      }
    } else {
      const firstWord = lower.split(/\s+/)[0];
      if (ENGLISH_INTERROGATIVES.includes(firstWord)) {
        return 'QUESTION';
      }
    }

    // 3. List
    if (/^(\d+[\.\)]|[-•*]|\([a-z0-9]\))\s+/i.test(trimmed) || (trimmed.match(/,/g) || []).length >= 4) {
      return 'LIST';
    }

    // 4. Clinical / Field Instruction
    if (CLINICAL_INSTRUCTION_PATTERNS.some(pat => lower.includes(pat.toLowerCase()))) {
      return 'INSTRUCTION';
    }

    // 5. Paragraph
    if (trimmed.includes('\n') || trimmed.length > 250) {
      return 'PARAGRAPH';
    }

    return 'STATEMENT';
  }

  /**
   * Computes an adaptive Speech Plan governing pauses, chunking, and controlled pacing.
   */
  public static planSpeech(
    text: string,
    langCode: string,
    userRate: number = 0.9,
    voiceInfo: TTSPlaybackInfo,
    pronunciationQuality?: TTSPronunciationQuality
  ): SpeechPlan {
    const sentenceType = this.detectSentenceType(text, langCode);

    // Analyze difficult words in text using candidate pronunciation quality
    const words = text.split(/\s+/).filter(Boolean);
    const difficultWords: DifficultWordInfo[] = [];
    const qualityTier = pronunciationQuality || voiceInfo.quality || 'CURATED';

    for (const w of words) {
      const diffInfo = PronunciationConfidenceEngine.analyzeWordDifficulty(w, langCode, qualityTier);
      if (diffInfo.isDifficult) {
        difficultWords.push(diffInfo);
      }
    }

    // Adaptive Pacing Calculation:
    // Respect user's chosen rate as base, but temper slightly for medical instructions or difficult words
    let plannedRate = userRate;
    let pauseStrategy = 'standard_conversational';

    if (sentenceType === 'INSTRUCTION') {
      // Moderate pacing for clinical safety: ~8% slower for absolute intelligibility
      plannedRate = Math.max(PROSODY_POLICY.minRate, Math.min(PROSODY_POLICY.maxRate, userRate * 0.92));
      pauseStrategy = 'clinical_precision_deliberate';
    } else if (difficultWords.length >= 2) {
      // Temper rate for unfamiliar polysyllabic words
      plannedRate = Math.max(PROSODY_POLICY.minRate, Math.min(PROSODY_POLICY.maxRate, userRate * 0.94));
      pauseStrategy = 'complex_vocabulary_articulation';
    } else if (sentenceType === 'LIST') {
      pauseStrategy = 'structured_enumeration_pause';
    } else if (sentenceType === 'QUESTION') {
      pauseStrategy = 'interrogative_cadence';
    }

    // Configure chunk pause durations based on speech type
    const pauseConfig = {
      pauseAfterCommaMs: sentenceType === 'LIST' ? PROSODY_POLICY.pauses.listCommaMs : PROSODY_POLICY.pauses.standardCommaMs,
      pauseAfterSentenceMs: sentenceType === 'QUESTION' ? PROSODY_POLICY.pauses.questionSentenceMs : PROSODY_POLICY.pauses.standardSentenceMs,
      pauseAfterParagraphMs: PROSODY_POLICY.pauses.paragraphMs
    };

    const chunks = TTSChunker.chunkText(text, langCode, pauseConfig);

    return {
      originalText: text,
      normalizedText: text.trim(),
      sentenceType,
      baseRate: userRate,
      plannedRate: Number(plannedRate.toFixed(2)),
      difficultWords,
      chunks,
      voiceInfo,
      pauseStrategy
    };
  }
}
