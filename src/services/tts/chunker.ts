/**
 * Bhasha Setu — Production Sentence & Prosody Chunker
 *
 * Deconstructs long text documents into natural speech chunks:
 * - Paragraph -> Sentence -> Clause -> Words
 * - Eliminates browser SpeechSynthesis hangs on long utterances (> 150 characters)
 * - Assigns realistic prosody pause intervals between clauses, sentences, and paragraphs
 */

import { TTSChunk } from './types';
import { PronunciationEngine } from './pronunciation/pronunciationEngine';

export interface ChunkerOptions {
  maxChunkChars?: number;
  pauseAfterCommaMs?: number;
  pauseAfterSentenceMs?: number;
  pauseAfterParagraphMs?: number;
}

const DEFAULT_MAX_CHUNK_CHARS = 140;
const DEFAULT_PAUSE_COMMA = 180;
const DEFAULT_PAUSE_SENTENCE = 400;
const DEFAULT_PAUSE_PARAGRAPH = 650;

export class TTSChunker {
  /**
   * Splits input text into prosody-aware chunks for continuous, deadlock-free playback.
   */
  public static chunkText(
    text: string,
    langCode: string,
    options: ChunkerOptions = {}
  ): TTSChunk[] {
    if (!text || !text.trim()) return [];

    const maxChars = options.maxChunkChars || DEFAULT_MAX_CHUNK_CHARS;
    const pauseComma = options.pauseAfterCommaMs || DEFAULT_PAUSE_COMMA;
    const pauseSentence = options.pauseAfterSentenceMs || DEFAULT_PAUSE_SENTENCE;
    const pauseParagraph = options.pauseAfterParagraphMs || DEFAULT_PAUSE_PARAGRAPH;

    const rawParagraphs = text.split(/\r?\n+/).filter(p => p.trim().length > 0);
    const chunks: TTSChunk[] = [];
    let chunkIndex = 0;

    for (let pIdx = 0; pIdx < rawParagraphs.length; pIdx++) {
      const paragraph = rawParagraphs[pIdx].trim();
      const isLastParagraph = pIdx === rawParagraphs.length - 1;

      // Split paragraph into sentences by standard punctuation and Ol Chiki Mucad (᱾, ᱿)
      const sentenceRegex = /([^.!?᱾᱿;:]+[.!?᱾᱿;:]*)/g;
      const rawSentences = paragraph.match(sentenceRegex) || [paragraph];

      for (let sIdx = 0; sIdx < rawSentences.length; sIdx++) {
        const sentence = rawSentences[sIdx].trim();
        if (!sentence) continue;
        const isLastSentenceInParagraph = sIdx === rawSentences.length - 1;

        if (sentence.length <= maxChars) {
          // Sentence fits comfortably into a single utterance chunk
          const pronunciation = PronunciationEngine.resolvePronunciation(sentence, langCode);
          const pause = isLastSentenceInParagraph
            ? (isLastParagraph ? 0 : pauseParagraph)
            : pauseSentence;

          chunks.push({
            index: chunkIndex++,
            text: sentence,
            spokenText: pronunciation.spokenText,
            pauseAfterMs: pause,
            isParagraphEnd: isLastSentenceInParagraph,
            isSentenceEnd: true
          });
        } else {
          // Large sentence: split into clauses by commas, hyphens, semicolons
          const clauseParts = sentence.split(/([,;:\-–—]+)/);
          let currentClause = '';

          for (let cIdx = 0; cIdx < clauseParts.length; cIdx++) {
            const part = clauseParts[cIdx];
            if (!part) continue;

            if (currentClause.length + part.length <= maxChars) {
              currentClause += part;
            } else {
              if (currentClause.trim()) {
                const pronunciation = PronunciationEngine.resolvePronunciation(currentClause.trim(), langCode);
                chunks.push({
                  index: chunkIndex++,
                  text: currentClause.trim(),
                  spokenText: pronunciation.spokenText,
                  pauseAfterMs: pauseComma,
                  isParagraphEnd: false,
                  isSentenceEnd: false
                });
              }
              currentClause = part;
            }
          }

          if (currentClause.trim()) {
            const pronunciation = PronunciationEngine.resolvePronunciation(currentClause.trim(), langCode);
            const pause = isLastSentenceInParagraph
              ? (isLastParagraph ? 0 : pauseParagraph)
              : pauseSentence;

            chunks.push({
              index: chunkIndex++,
              text: currentClause.trim(),
              spokenText: pronunciation.spokenText,
              pauseAfterMs: pause,
              isParagraphEnd: isLastSentenceInParagraph,
              isSentenceEnd: true
            });
          }
        }
      }
    }

    return chunks;
  }
}
