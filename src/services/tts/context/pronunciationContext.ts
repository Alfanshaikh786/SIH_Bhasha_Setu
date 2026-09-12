/**
 * Bhasha Setu — Context-Aware Pronunciation Engine
 *
 * Implements tri-token sliding window context analysis (prevToken + token + nextToken)
 * to resolve contextual compounds, postposition liaisons, and collocations in
 * Santali, Hindi, English, and Bengali speech synthesis.
 */

import { ScriptType, TokenContext, PronunciationCandidate, TTSPronunciationQuality } from '../types';
import { containsOlChiki } from '../linguistics/olChikiLinguistics';

// Contextual Compounds & Collocations in Santali
// LINGUISTIC HONESTY: Downgraded to DATASET (parallel corpus entries) or CURATED (lexicon).
// Never labeled NATIVE_VERIFIED without an audited native recording session in the repository.
export const SANTALI_CONTEXTUAL_COMPOUNDS: Record<string, { spoken: string; quality: TTSPronunciationQuality }> = {
  'ᱪᱮᱫ_ᱞᱮᱠᱟ': { spoken: 'ched leka', quality: 'CURATED' },
  'ᱥᱟᱹᱜᱩᱱ_ᱫᱟᱨᱟᱢ': { spoken: 'sagun daram', quality: 'DATASET' },
  'ᱥᱟᱹᱜᱩᱱ_ᱥᱮᱛᱟᱜ': { spoken: 'sagun setag', quality: 'DATASET' },
  'ᱥᱟᱹᱜᱩᱱ_ᱧᱤᱫᱟᱹ': { spoken: 'sagun nyinda', quality: 'DATASET' },
  'ᱤᱛᱩᱱ_ᱟᱥᱲᱟ': { spoken: 'itun asra', quality: 'CURATED' },
  'ᱥᱤᱠᱤᱞ_ᱥᱮᱞ': { spoken: 'sikil sel', quality: 'CURATED' },
  'ᱢᱟᱭᱟᱢ_ᱵᱤᱰᱟᱹᱣ': { spoken: 'mayam bidaw', quality: 'CURATED' },
  'ᱥᱤᱠᱤᱞ_ᱥᱮᱞ_ᱵᱤᱰᱟᱹᱣ': { spoken: 'sikil sel bidaw', quality: 'CURATED' },
  'ᱥᱤᱠᱤᱞ_ᱥᱮᱞ_ᱢᱟᱭᱟᱢ_ᱵᱤᱰᱟᱹᱣ': { spoken: 'sikil sel mayam bidaw', quality: 'CURATED' },
  'ᱟᱞᱮᱭᱟᱜ_ᱟᱹᱛᱩ': { spoken: 'aleyag aatu', quality: 'DATASET' },
  'ᱟᱵᱚᱣᱟᱜ_ᱫᱤᱥᱚᱢ': { spoken: 'abowag disom', quality: 'CURATED' },
  'ᱦᱟᱥᱯᱟᱛᱟᱞ_ᱨᱮ': { spoken: 'haspatal re', quality: 'CURATED' },
  'ᱵᱮᱥ_ᱜᱮ': { spoken: 'bes ge', quality: 'CURATED' },
  'ᱢᱮᱱᱟᱜ_ᱟ': { spoken: 'menag-a', quality: 'CURATED' },
  'ᱢᱮᱱᱟᱹᱧ_ᱟ': { spoken: 'menanya', quality: 'CURATED' }
};

// Santali Grammatical Particles & Postpositions
const SANTALI_POSTPOSITIONS = new Set([
  'ᱫᱚ', 'ᱜᱮ', 'ᱨᱮ', 'ᱠᱷᱚᱱ', 'ᱠᱟᱱᱟ', 'ᱠᱟᱱᱟᱭ', 'ᱠᱟᱱᱟᱹᱧ', 'ᱠᱟᱱᱟᱧ',
  'ᱢᱮᱱᱟᱜ-ᱟ', 'ᱢᱮᱱᱟᱜᱼᱟ', 'ᱢᱮᱱᱟᱹᱧᱟ', 'ᱢᱮᱱᱟᱢᱟ', 'ᱛᱮ', 'ᱥᱟᱶᱛᱮ'
]);

export class PronunciationContextAnalyzer {
  /**
   * Detects the predominant script of an input text string.
   */
  public static detectScript(text: string): ScriptType {
    if (!text || !text.trim()) return 'unknown';

    const hasOlChiki = containsOlChiki(text);
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const hasLatin = /[A-Za-z]/.test(text);

    const scriptCount = [hasOlChiki, hasDevanagari, hasBengali, hasLatin].filter(Boolean).length;
    if (scriptCount > 1) return 'mixed';

    if (hasOlChiki) return 'ol_chiki';
    if (hasDevanagari) return 'devanagari';
    if (hasBengali) return 'bengali';
    if (hasLatin) return 'latin';

    return 'unknown';
  }

  /**
   * Builds tri-token sliding window contexts for each significant word in a sentence.
   */
  public static buildContexts(text: string, langCode: string): TokenContext[] {
    const rawTokens = text.trim().split(/\s+/).filter(Boolean);
    const script = this.detectScript(text);

    return rawTokens.map((tok, idx) => {
      const cleanToken = tok.replace(/[.,!?;:()᱾᱿•]/g, '').trim();
      const prev = idx > 0 ? rawTokens[idx - 1].replace(/[.,!?;:()᱾᱿•]/g, '').trim() : null;
      const next = idx < rawTokens.length - 1 ? rawTokens[idx + 1].replace(/[.,!?;:()᱾᱿•]/g, '').trim() : null;

      return {
        prevToken: prev || null,
        token: cleanToken,
        nextToken: next || null,
        lang: langCode.toLowerCase().trim(),
        script,
        index: idx,
        totalTokens: rawTokens.length
      };
    });
  }

  /**
   * Evaluates whether a token represents a known contextual compound with adjacent tokens.
   */
  public static checkContextualCompound(ctx: TokenContext): { compound: string; spoken: string; quality: TTSPronunciationQuality } | null {
    // 1. Two-token forward compound (token + nextToken)
    if (ctx.nextToken) {
      const key2 = `${ctx.token}_${ctx.nextToken}`;
      if (SANTALI_CONTEXTUAL_COMPOUNDS[key2]) {
        return {
          compound: key2,
          spoken: SANTALI_CONTEXTUAL_COMPOUNDS[key2].spoken,
          quality: SANTALI_CONTEXTUAL_COMPOUNDS[key2].quality
        };
      }
    }

    // 2. Two-token backward compound (prevToken + token)
    if (ctx.prevToken) {
      const keyPrev = `${ctx.prevToken}_${ctx.token}`;
      if (SANTALI_CONTEXTUAL_COMPOUNDS[keyPrev]) {
        return {
          compound: keyPrev,
          spoken: SANTALI_CONTEXTUAL_COMPOUNDS[keyPrev].spoken,
          quality: SANTALI_CONTEXTUAL_COMPOUNDS[keyPrev].quality
        };
      }
    }

    return null;
  }

  /**
   * Resolves contextual compound phrases in a full sentence in-place.
   * Scans for multi-word compounds (4, 3, 2 tokens) and replaces matched
   * spans with their spoken representation while strictly preserving all surrounding words.
   */
  public static resolveContextualCompoundsInSentence(
    text: string,
    langCode: string
  ): { resolvedText: string; matchedCompounds: string[]; bestQuality: TTSPronunciationQuality | null } {
    const lang = langCode.toLowerCase().trim();
    if (lang !== 'sat' && lang !== 'santali') {
      return { resolvedText: text, matchedCompounds: [], bestQuality: null };
    }

    const rawTokens = text.trim().split(/\s+/).filter(Boolean);
    if (rawTokens.length === 0) {
      return { resolvedText: text, matchedCompounds: [], bestQuality: null };
    }

    const matchedCompounds: string[] = [];
    let bestQuality: TTSPronunciationQuality | null = null;
    const outTokens: string[] = [];

    let i = 0;
    while (i < rawTokens.length) {
      let matched = false;

      // Check n-gram windows: 4-token, 3-token, 2-token
      for (let n = Math.min(4, rawTokens.length - i); n >= 2; n--) {
        const slice = rawTokens.slice(i, i + n);
        const cleanWords = slice.map(t => t.replace(/[.,!?;:()᱾᱿•]/g, '').trim());
        const compoundKey = cleanWords.join('_');

        if (SANTALI_CONTEXTUAL_COMPOUNDS[compoundKey]) {
          const comp = SANTALI_CONTEXTUAL_COMPOUNDS[compoundKey];
          // Preserve any trailing punctuation from the last token in the match
          const lastToken = slice[slice.length - 1];
          const punctMatch = lastToken.match(/([.,!?;:()᱾᱿•]+)$/);
          const trailingPunct = punctMatch ? punctMatch[1] : '';

          outTokens.push(comp.spoken + (trailingPunct ? ' ' + trailingPunct : ''));
          matchedCompounds.push(compoundKey);
          if (!bestQuality || comp.quality === 'DATASET') {
            bestQuality = comp.quality;
          }

          i += n;
          matched = true;
          break;
        }
      }

      if (!matched) {
        outTokens.push(rawTokens[i]);
        i++;
      }
    }

    return {
      resolvedText: outTokens.join(' ').replace(/\s+/g, ' ').trim(),
      matchedCompounds,
      bestQuality
    };
  }

  /**
   * Detects postposition liaisons for natural pacing and pause suppression between a noun and its particle.
   */
  public static isPostpositionLiaison(ctx: TokenContext): boolean {
    if (ctx.lang !== 'sat' && ctx.lang !== 'santali') return false;
    return SANTALI_POSTPOSITIONS.has(ctx.token);
  }

  /**
   * Generates a deterministic hash for a token context for caching purposes.
   */
  public static computeContextHash(ctx: TokenContext): string {
    const p = ctx.prevToken || '^';
    const t = ctx.token;
    const n = ctx.nextToken || '$';
    return `${p}_${t}_${n}`;
  }

  /**
   * Selects the highest-confidence candidate from a list of pronunciation options.
   */
  public static selectBestCandidate(candidates: PronunciationCandidate[]): PronunciationCandidate {
    if (!candidates || candidates.length === 0) {
      return {
        word: '',
        text: '',
        spoken: '',
        pronunciation: '',
        phoneticRepresentation: '',
        language: 'unknown',
        script: 'unknown',
        quality: 'UNKNOWN',
        confidenceScore: 0.1,
        source: 'default_empty',
        ruleVersion: 'v2.0'
      };
    }

    // Preference hierarchy
    const qualityWeights: Record<TTSPronunciationQuality, number> = {
      'NATIVE_VERIFIED': 100,
      'EXPERT_VERIFIED': 95,
      'CURATED': 85,
      'DATASET': 80,
      'RULE_BASED': 70,
      'ALGORITHMIC': 50,
      'FALLBACK': 30,
      'UNKNOWN': 10
    };

    return [...candidates].sort((a, b) => {
      const weightA = (qualityWeights[a.quality] || 0) + (a.contextMatches ? 10 : 0);
      const weightB = (qualityWeights[b.quality] || 0) + (b.contextMatches ? 10 : 0);
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return b.confidenceScore - a.confidenceScore;
    })[0];
  }
}
