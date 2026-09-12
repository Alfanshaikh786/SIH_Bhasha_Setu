/**
 * Bhasha Setu — AI Voice Intelligence Orchestrator
 *
 * Coordinates the full end-to-end intelligent voice pipeline:
 * 1. Script & Language Consistency Analysis
 * 2. Tri-Token Context Window Analysis
 * 3. Intelligent Normalization & Clinical Safety Preservation
 * 4. Pronunciation Resolution & Qualitative Confidence Tracking
 * 5. Prosody & Sentence Structure Planning (Questions, Lists, Instructions)
 * 6. Voice Quality Scoring & Health Monitoring
 * 7. Dispatch through Chunked Queue to Best Available TTS Engine
 */

import {
  TTSPlaybackOptions,
  TTSPlaybackInfo,
  SpeechPlan,
  PronunciationRecord
} from '../types';
import { IntelligentNormalizer } from '../normalization/intelligentNormalizer';
import { PronunciationContextAnalyzer } from '../context/pronunciationContext';
import { PronunciationEngine, PRONUNCIATION_ENGINE_VERSION } from '../pronunciation/pronunciationEngine';
import { PronunciationConfidenceEngine } from '../confidence/pronunciationConfidence';
import { ProsodyEngine } from '../prosody/prosodyEngine';
import { VoiceQualityRouter } from '../voice/voiceQualityRouter';
import { ContextualPronunciationCache } from '../cache/contextualCache';
import { TTSQueue } from '../queue';
import { containsOlChiki, transliterateOlChikiPhonetic } from '../linguistics/olChikiLinguistics';

export class VoiceIntelligenceEngine {
  /**
   * Prepares and executes an intelligent, context-aware speech synthesis request.
   */
  public static synthesizeSpeech(
    text: string,
    langCode: string,
    options: TTSPlaybackOptions = {}
  ): SpeechPlan | null {
    if (!text || !text.trim()) {
      options.onEnd?.();
      return null;
    }

    const lang = langCode.toLowerCase().trim();

    // 1. Script & Language Consistency Analysis
    const detectedScript = PronunciationContextAnalyzer.detectScript(text);

    // 2. Intelligent Normalization with Clinical Safety
    const normalizedText = IntelligentNormalizer.normalize(text, lang);

    // 3. Tri-Token Context Analysis
    const contexts = PronunciationContextAnalyzer.buildContexts(normalizedText, lang);
    const contextHash = contexts.length > 0
      ? PronunciationContextAnalyzer.computeContextHash(contexts[0])
      : 'standalone';

    // 4. Pronunciation Resolution & Contextual Caching
    let pronunciation: PronunciationRecord | null = ContextualPronunciationCache.get(
      PRONUNCIATION_ENGINE_VERSION,
      lang,
      normalizedText,
      contextHash
    );

    if (!pronunciation) {
      pronunciation = PronunciationEngine.resolvePronunciation(normalizedText, lang);

      // In-place contextual compound resolution for Santali sentences:
      // Preserves all surrounding words without truncating sentence context.
      if (lang === 'sat' || lang === 'santali') {
        if (pronunciation.quality !== 'NATIVE_VERIFIED' && pronunciation.quality !== 'DATASET') {
          const compResult = PronunciationContextAnalyzer.resolveContextualCompoundsInSentence(
            normalizedText,
            lang
          );
          if (compResult.matchedCompounds.length > 0) {
            // Re-transliterate any remaining Ol Chiki words while preserving resolved compound tokens
            const finalSpoken = compResult.resolvedText
              .split(/\s+/)
              .map(tok => {
                if (containsOlChiki(tok)) {
                  return transliterateOlChikiPhonetic(tok);
                }
                return tok;
              })
              .join(' ');

            pronunciation.spokenText = finalSpoken;
            pronunciation.phoneticRepresentation = finalSpoken;
            pronunciation.quality = compResult.bestQuality || 'CURATED';
            pronunciation.notes = `Contextual compound resolution (${compResult.matchedCompounds.join(', ')})`;
          }
        }
      }

      ContextualPronunciationCache.set(pronunciation, contextHash);
    }

    // 5. Qualitative Confidence Evaluation
    const confidenceMeta = PronunciationConfidenceEngine.evaluateConfidence(pronunciation.quality);

    // 6. Voice Quality Selection with Health Monitoring
    const { voice, voiceLang, playbackInfo } = VoiceQualityRouter.selectBestScoredVoice(lang);
    playbackInfo.quality = pronunciation.quality;
    playbackInfo.rulesVersion = PRONUNCIATION_ENGINE_VERSION;

    // 7. Prosody & Speech Planning
    const speechPlan = ProsodyEngine.planSpeech(
      pronunciation.spokenText || normalizedText,
      lang,
      options.rate ?? 0.9,
      playbackInfo,
      pronunciation.quality
    );

    // 8. Execute via Queue
    const wrappedOptions: TTSPlaybackOptions = {
      ...options,
      rate: speechPlan.plannedRate,
      onStart: () => {
        options.onStart?.();
      },
      onEnd: () => {
        if (voice) {
          VoiceQualityRouter.recordVoiceSuccess(voice.name);
        }
        options.onEnd?.();
      },
      onError: (err) => {
        if (voice) {
          VoiceQualityRouter.recordVoiceFailure(voice.name);
        }
        options.onError?.(err);
      }
    };

    TTSQueue.play(pronunciation.spokenText || normalizedText, lang, wrappedOptions);

    return speechPlan;
  }

  /**
   * Immediately stops active speech across the entire platform.
   */
  public static stopSpeech(): void {
    TTSQueue.stop();
  }

  /**
   * Returns current playback info for the requested language.
   */
  public static getPlaybackInfo(langCode: string): TTSPlaybackInfo {
    const { playbackInfo } = VoiceQualityRouter.selectBestScoredVoice(langCode);
    return playbackInfo;
  }
}
