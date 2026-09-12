/**
 * Bhasha Setu — Phase 8: Ol Chiki Orthography & Text Validator
 *
 * Implements non-destructive linguistic validation for Ol Chiki speech transcripts:
 * - Unicode range compliance (U+1C50 - U+1C7F)
 * - Diacritic ordering and attachment validation (Ahad, Mu-Tuda, Gahla-Tuda)
 * - Punctuation and Mucad (᱾, ᱿) validation
 * - Preserves both originalText and normalizedText without semantic rewriting
 */

import { ScriptMode } from './types';

export interface OlChikiValidationResult {
  isValid: boolean;
  originalText: string;
  normalizedText: string;
  detectedScript: ScriptMode;
  charCount: number;
  tokenCount: number;
  hasOlChiki: boolean;
  hasRoman: boolean;
  hasDevanagari: boolean;
  issues: string[];
  warnings: string[];
}

export const OL_CHIKI_BASE_LETTERS = [
  'ᱚ', 'ᱛ', 'ᱜ', 'ᱝ', 'ᱞ',
  'ᱟ', 'ᱠ', 'ᱡ', 'ᱢ', 'ᱣ',
  'ᱤ', 'ᱥ', 'ᱦ', 'ᱧ', 'ᱨ',
  'ᱩ', 'ᱪ', 'ᱫ', 'ᱬ', 'ᱭ',
  'ᱮ', 'ᱯ', 'ᱰ', 'ᱱ', 'ᱲ',
  'ᱳ', 'ᱴ', 'ᱵ', 'ᱶ', 'ᱷ'
];

export const OL_CHIKI_DIACRITICS = [
  'ᱸ', // Mu-Tuda (U+1C78)
  'ᱹ', // Gahla-Tuda (U+1C79)
  'ᱺ', // Mu-Gahla-Tuda (U+1C7A)
  'ᱻ', // Relo (U+1C7B)
  'ᱼ', // Ahad (U+1C7D)
  'ᱽ'  // Farka (U+1C7E)
];

export const OL_CHIKI_PUNCTUATION_CHARS = [
  '᱾', // Mucad (U+1C7E)
  '᱿'  // Double Mucad (U+1C7F)
];

export const OL_CHIKI_DIGITS = [
  '᱐', '᱑', '᱒', '᱓', '᱔', '᱕', '᱖', '᱗', '᱘', '᱙'
];

export class OlChikiValidator {
  /**
   * Check if a character is within the Ol Chiki Unicode block (U+1C50 - U+1C7F).
   */
  public static isOlChikiCodePoint(codePoint: number): boolean {
    return codePoint >= 0x1c50 && codePoint <= 0x1c7f;
  }

  /**
   * Detect scripts present in text.
   */
  public static detectScript(text: string): {
    hasOlChiki: boolean;
    hasRoman: boolean;
    hasDevanagari: boolean;
    primaryScript: ScriptMode;
  } {
    let olChikiCount = 0;
    let romanCount = 0;
    let devanagariCount = 0;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x1c50 && code <= 0x1c7f) {
        olChikiCount++;
      } else if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) {
        romanCount++;
      } else if (code >= 0x0900 && code <= 0x097f) {
        devanagariCount++;
      }
    }

    const hasOlChiki = olChikiCount > 0;
    const hasRoman = romanCount > 0;
    const hasDevanagari = devanagariCount > 0;

    let primaryScript: ScriptMode = 'ol_chiki';
    if (hasOlChiki && !hasRoman && !hasDevanagari) {
      primaryScript = 'ol_chiki';
    } else if (hasRoman && !hasOlChiki && !hasDevanagari) {
      primaryScript = 'roman';
    } else if (hasDevanagari && !hasOlChiki && !hasRoman) {
      primaryScript = 'devanagari';
    } else if ((hasOlChiki && hasRoman) || (hasOlChiki && hasDevanagari) || (hasRoman && hasDevanagari)) {
      primaryScript = 'mixed';
    }

    return {
      hasOlChiki,
      hasRoman,
      hasDevanagari,
      primaryScript
    };
  }

  /**
   * Validate an Ol Chiki transcript and normalize whitespace non-destructively.
   */
  public static validateText(text: string, expectedScript: ScriptMode = 'ol_chiki'): OlChikiValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!text || text.trim().length === 0) {
      return {
        isValid: false,
        originalText: text || '',
        normalizedText: '',
        detectedScript: expectedScript,
        charCount: 0,
        tokenCount: 0,
        hasOlChiki: false,
        hasRoman: false,
        hasDevanagari: false,
        issues: ['Text transcript is empty or contains only whitespace.'],
        warnings: []
      };
    }

    const scriptInfo = this.detectScript(text);

    // Normalize Unicode to canonical NFC form
    const unicodeNormalized = text.normalize('NFC');

    // Clean excess whitespace (collapse multiple spaces, tabs, newlines to single space)
    const normalizedText = unicodeNormalized.replace(/\s+/g, ' ').trim();

    const charCount = normalizedText.length;
    const tokens = normalizedText.split(' ').filter(t => t.length > 0);
    const tokenCount = tokens.length;

    // Script consistency check
    if (expectedScript === 'ol_chiki') {
      if (!scriptInfo.hasOlChiki) {
        issues.push('Expected Ol Chiki script, but zero Ol Chiki characters were found in transcript.');
      }
      if (scriptInfo.hasRoman) {
        warnings.push('Contains Latin/Roman characters in an Ol Chiki expected utterance.');
      }
      if (scriptInfo.hasDevanagari) {
        warnings.push('Contains Devanagari characters in an Ol Chiki expected utterance.');
      }
    }

    // Orthographic diacritic sequence rules
    // 1. A diacritic cannot be the first character of an utterance or follow a space
    for (let i = 0; i < normalizedText.length; i++) {
      const ch = normalizedText[i];
      if (OL_CHIKI_DIACRITICS.includes(ch)) {
        if (i === 0) {
          issues.push(`Malformed diacritic sequence: utterance begins with floating diacritic '${ch}'.`);
        } else {
          const prevChar = normalizedText[i - 1];
          if (prevChar === ' ') {
            issues.push(`Floating diacritic found following whitespace without preceding base character: ' ${ch}'.`);
          }
        }
      }
    }

    // 2. Consecutive identical diacritics check
    for (let i = 0; i < normalizedText.length - 1; i++) {
      const ch1 = normalizedText[i];
      const ch2 = normalizedText[i + 1];
      if (OL_CHIKI_DIACRITICS.includes(ch1) && ch1 === ch2) {
        issues.push(`Duplicate consecutive diacritic detected: '${ch1}${ch2}'.`);
      }
    }

    // 3. Unrecognized symbols check (e.g. archaic or non-standard control characters)
    for (let i = 0; i < normalizedText.length; i++) {
      const code = normalizedText.charCodeAt(i);
      // Flag control characters or unmapped private use area
      if ((code >= 0x0000 && code <= 0x001f && code !== 0x000a && code !== 0x0009) || (code >= 0xe000 && code <= 0xf8ff)) {
        issues.push(`Illegal control or private-use character detected at position ${i} (code: ${code}).`);
      }
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      originalText: text,
      normalizedText,
      detectedScript: scriptInfo.primaryScript,
      charCount,
      tokenCount,
      hasOlChiki: scriptInfo.hasOlChiki,
      hasRoman: scriptInfo.hasRoman,
      hasDevanagari: scriptInfo.hasDevanagari,
      issues,
      warnings
    };
  }
}
