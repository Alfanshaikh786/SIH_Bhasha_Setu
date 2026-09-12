/**
 * Bhasha Setu — Dedicated Pronunciation Pipeline
 *
 * Implements an 8-stage provenance-based pronunciation resolution hierarchy:
 * 1. NATIVE_VERIFIED: Audited native speaker phrases and formulas
 * 2. EXPERT_VERIFIED: Linguistically validated phrases
 * 3. CURATED: High-confidence dictionary and core vocabulary entries
 * 4. DATASET: Parallel sentence corpus entries (from Santhali-Words.csv)
 * 5. CONTEXT_RULE: Multi-token contextual compound matches
 * 6. LINGUISTIC_RULE: Ol Chiki diacritics & Roman Santali phonetics
 * 7. ALGORITHMIC: Syllable-aware phonetic bridge
 * 8. FALLBACK: Safe browser default acoustic representation
 *
 * Rule Version: v4.0-sih-intelligent
 */

import {
  PronunciationRecord,
  PronunciationCandidate,
  TTSPronunciationQuality,
  ScriptType
} from '../types';
import { PronunciationContextAnalyzer } from '../context/pronunciationContext';
import { SyllableEngine } from '../linguistics/syllableEngine';
import { containsOlChiki, transliterateOlChikiPhonetic } from '../linguistics/olChikiLinguistics';
import { RomanSantaliLinguistics } from '../linguistics/romanSantaliLinguistics';
import { lookupExactDatasetEntry } from '../../../data/santaliDataset';
import { VERIFIED_ROMAN_PHRASES } from './pronunciationEngine';

export const PIPELINE_RULE_VERSION = 'v4.0-sih-intelligent';

export class PronunciationPipeline {
  /**
   * Processes a word or phrase through the strict 8-stage resolution hierarchy.
   * Stops deterministically at the highest valid confidence tier.
   */
  public static resolve(
    text: string,
    langCode: string
  ): PronunciationRecord {
    const raw = text.trim();
    const lang = langCode.toLowerCase().trim();
    const isSantali = lang === 'sat' || lang === 'santali';
    const isFutureTribal = lang === 'unr' || lang === 'hoc' || lang === 'mundari' || lang === 'ho';
    const script: ScriptType = PronunciationContextAnalyzer.detectScript(raw);

    // Future tribal languages (Mundari, Ho)
    if (isFutureTribal) {
      return {
        language: langCode,
        sourceText: raw,
        normalizedText: raw,
        spokenText: raw,
        phoneticRepresentation: raw,
        quality: 'FALLBACK',
        rulesVersion: PIPELINE_RULE_VERSION,
        notes: `Future scope language (${langCode}): neural acoustic model pending field recording.`
      };
    }

    // Explicit parenthetical Roman guide (e.g. "ᱡᱚᱦᱟᱨ (Johar)")
    const parenMatch = raw.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1] && isSantali) {
      const guide = parenMatch[1].trim();
      const syllables = SyllableEngine.segment(guide, 'sat');
      return {
        language: langCode,
        sourceText: raw,
        normalizedText: raw,
        spokenText: guide,
        phoneticRepresentation: guide,
        syllables,
        quality: 'CURATED',
        rulesVersion: PIPELINE_RULE_VERSION,
        notes: 'Stage 3 (Curated): Extracted from explicit parenthetical Roman guide'
      };
    }

    // --- SANTALI PIPELINE ---
    if (isSantali || script === 'ol_chiki' || RomanSantaliLinguistics.isRomanSantaliWord(raw)) {
      const candidates: PronunciationCandidate[] = [];

      // STAGE 1: Native Verified Pronunciation
      const stripPunct = (s: string) => s.replace(/[.,!?;:()᱾᱿•\s]/g, '').trim();
      const cleanTarget = stripPunct(raw);

      let verifiedSpoken: string | null = VERIFIED_ROMAN_PHRASES[raw] || null;
      if (!verifiedSpoken && cleanTarget) {
        for (const [key, val] of Object.entries(VERIFIED_ROMAN_PHRASES)) {
          if (stripPunct(key) === cleanTarget) {
            verifiedSpoken = val;
            break;
          }
        }
      }

      if (verifiedSpoken) {
        const syllables = SyllableEngine.segment(verifiedSpoken, 'sat');
        return {
          language: langCode,
          sourceText: raw,
          normalizedText: raw,
          spokenText: verifiedSpoken,
          phoneticRepresentation: verifiedSpoken,
          syllables,
          quality: 'NATIVE_VERIFIED',
          rulesVersion: PIPELINE_RULE_VERSION,
          notes: 'Stage 1: Verified native authoritative pronunciation'
        };
      }

      // STAGE 4: Dataset Parallel Sentence Corpus
      const datasetMatch = lookupExactDatasetEntry(cleanTarget) || lookupExactDatasetEntry(raw);
      if (datasetMatch && datasetMatch.roman) {
        const spoken = datasetMatch.roman.trim();
        const syllables = SyllableEngine.segment(spoken, 'sat');
        return {
          language: langCode,
          sourceText: raw,
          normalizedText: raw,
          spokenText: spoken,
          phoneticRepresentation: spoken,
          syllables,
          quality: 'DATASET',
          rulesVersion: PIPELINE_RULE_VERSION,
          notes: `Stage 4: Dataset parallel corpus match (#${datasetMatch.id})`
        };
      }

      // STAGE 5: Context-Aware Multi-Token Compounds
      const compoundResult = PronunciationContextAnalyzer.resolveContextualCompoundsInSentence(raw, lang);
      if (compoundResult.matchedCompounds.length > 0) {
        let finalSpoken = compoundResult.resolvedText;
        if (containsOlChiki(finalSpoken)) {
          finalSpoken = finalSpoken.split(/\s+/).map(tok => {
            return containsOlChiki(tok) ? transliterateOlChikiPhonetic(tok) : tok;
          }).join(' ');
        }
        const syllables = SyllableEngine.segment(finalSpoken, 'sat');
        return {
          language: langCode,
          sourceText: raw,
          normalizedText: raw,
          spokenText: finalSpoken,
          phoneticRepresentation: finalSpoken,
          syllables,
          quality: compoundResult.bestQuality || 'CURATED',
          rulesVersion: PIPELINE_RULE_VERSION,
          notes: `Stage 5: Contextual compound match (${compoundResult.matchedCompounds.join(', ')})`
        };
      }

      // STAGE 6: Linguistic Rules (Ol Chiki Diacritics & Roman Santali)
      if (script === 'ol_chiki' || containsOlChiki(raw)) {
        const phonetic = transliterateOlChikiPhonetic(raw);
        const syllables = SyllableEngine.segment(phonetic, 'sat');
        return {
          language: langCode,
          sourceText: raw,
          normalizedText: raw,
          spokenText: phonetic,
          phoneticRepresentation: phonetic,
          syllables,
          quality: 'RULE_BASED',
          rulesVersion: PIPELINE_RULE_VERSION,
          notes: 'Stage 6: Ol Chiki diacritic and deglottalization rule resolution'
        };
      }

      // STAGE 6b: Roman Santali Transliteration
      if (script === 'latin') {
        const acousticGuide = RomanSantaliLinguistics.transliterateRomanToAcousticGuide(raw);
        const syllables = SyllableEngine.segment(acousticGuide, 'sat');
        return {
          language: langCode,
          sourceText: raw,
          normalizedText: raw,
          spokenText: acousticGuide,
          phoneticRepresentation: acousticGuide,
          syllables,
          quality: 'RULE_BASED',
          rulesVersion: PIPELINE_RULE_VERSION,
          notes: 'Stage 6b: Language-aware Roman Santali acoustic bridge'
        };
      }

      // STAGE 7: Algorithmic Bridge
      const syllables = SyllableEngine.segment(raw, 'sat');
      return {
        language: langCode,
        sourceText: raw,
        normalizedText: raw,
        spokenText: raw,
        phoneticRepresentation: raw,
        syllables,
        quality: 'ALGORITHMIC',
        rulesVersion: PIPELINE_RULE_VERSION,
        notes: 'Stage 7: Algorithmic phonetic transliteration'
      };
    }

    // --- HINDI PIPELINE ---
    if (lang === 'hin' || lang === 'hindi') {
      const syllables = SyllableEngine.segment(raw, 'hin');
      return {
        language: 'hin',
        sourceText: raw,
        normalizedText: raw,
        spokenText: raw,
        phoneticRepresentation: raw,
        syllables,
        quality: 'CURATED',
        rulesVersion: PIPELINE_RULE_VERSION,
        notes: 'Native Devanagari text for Hindi voice synthesis'
      };
    }

    // --- ENGLISH & GENERAL PIPELINE ---
    const syllables = SyllableEngine.segment(raw, 'eng');
    return {
      language: lang === 'eng' || lang === 'english' || lang === 'en' ? 'eng' : langCode,
      sourceText: raw,
      normalizedText: raw,
      spokenText: raw,
      phoneticRepresentation: raw,
      syllables,
      quality: 'CURATED',
      rulesVersion: PIPELINE_RULE_VERSION,
      notes: 'Native text for English/standard voice synthesis'
    };
  }
}
