/**
 * Bhasha Setu — Syllable Intelligence Engine
 *
 * Implements reliable syllable segmentation and acoustic complexity analysis
 * across Santali (Ol Chiki & Roman), Hindi, and English.
 *
 * Syllables are utilized for:
 * - Pacing calculations
 * - Difficult word detection
 * - Pronunciation fallback construction
 *
 * (Note: Never blindly inserts pauses between syllables; maintains natural prosodic flow.)
 */

export const SYLLABLE_ENGINE_VERSION = '2.0-syllable-intelligence';

export interface WordSyllableAnalysis {
  word: string;
  syllables: string[];
  syllableCount: number;
  complexityScore: number;
  hasConsonantCluster: boolean;
  hasCheckedConsonant: boolean;
}

export class SyllableEngine {
  /**
   * Segments a word into its natural phonetic syllables.
   */
  public static segment(word: string, langCode: string = 'sat'): string[] {
    if (!word || word.length <= 2) return [word];

    const clean = word.trim();

    // Ol Chiki segmentation
    if (/[\u1C50-\u1C7F]/.test(clean)) {
      return this.segmentOlChiki(clean);
    }

    // Romanized segmentation (Santali / English / Devanagari transliteration)
    return this.segmentRoman(clean);
  }

  /**
   * Segments Ol Chiki Unicode words into syllable constituents.
   * Santali syllable structure: (C)V(C)
   * Vowels: ᱚ, ᱟ, ᱤ, ᱩ, ᱮ, ᱳ
   */
  private static segmentOlChiki(word: string): string[] {
    const vowels = new Set(['ᱚ', 'ᱟ', 'ᱤ', 'ᱩ', 'ᱮ', 'ᱳ']);
    const syllables: string[] = [];
    let current = '';

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      current += ch;

      if (vowels.has(ch)) {
        const next1 = word[i + 1];
        const next2 = word[i + 2];

        // V-CV boundary
        if (next1 && !vowels.has(next1) && next2 && vowels.has(next2)) {
          syllables.push(current);
          current = '';
        }
        // VC-CV boundary
        else if (next1 && !vowels.has(next1) && next2 && !vowels.has(next2) && word[i + 3] && vowels.has(word[i + 3])) {
          current += next1;
          syllables.push(current);
          current = '';
          i++;
        }
      }
    }

    if (current) {
      const hasVowel = Array.from(current).some(ch => vowels.has(ch));
      if (syllables.length > 0 && !hasVowel) {
        syllables[syllables.length - 1] += current;
      } else {
        syllables.push(current);
      }
    }

    return syllables.length > 0 ? syllables : [word];
  }

  /**
   * Segments Romanized words into approximate syllables based on maximal onset principle.
   */
  private static segmentRoman(word: string): string[] {
    const isVowel = (c: string) => /[aeiouāīūēō]/i.test(c);
    const syllables: string[] = [];
    let current = '';

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      current += ch;

      if (isVowel(ch)) {
        const next1 = word[i + 1];
        const next2 = word[i + 2];

        if (next1 && !isVowel(next1)) {
          // Check for diphthongs/vowel sequences: continue if next is also vowel
          if (isVowel(next1)) continue;

          if (next2 && isVowel(next2)) {
            // Pattern V-CV -> split before single consonant
            syllables.push(current);
            current = '';
          } else if (next2 && !isVowel(next2) && word[i + 3] && isVowel(word[i + 3])) {
            // Pattern VC-CV -> split between consonants
            current += next1;
            syllables.push(current);
            current = '';
            i++;
          }
        }
      }
    }

    if (current) {
      if (syllables.length > 0 && !/[aeiouāīūēō]/i.test(current)) {
        syllables[syllables.length - 1] += current;
      } else {
        syllables.push(current);
      }
    }

    return syllables.length > 0 ? syllables : [word];
  }

  /**
   * Performs in-depth syllable and complexity analysis of a single word.
   */
  public static analyzeWord(word: string, langCode: string = 'sat'): WordSyllableAnalysis {
    const clean = word.replace(/[.,!?;:()᱾᱿•]/g, '').trim();
    const syllables = this.segment(clean, langCode);
    const count = syllables.length;

    // Detect complex consonant clusters (e.g. "ndr", "k-m", "s-p")
    const hasConsonantCluster = /[^aeiou\s]{3,}/i.test(clean);

    // Detect checked consonants in Ol Chiki (ᱜ, ᱡ, ᱫ, ᱵ without ahad) or Roman (k', t', c', p')
    const hasCheckedConsonant = /[ᱜᱡᱫᱵ](?!ᱽ)|[ktcp]['’]/.test(clean);

    // Bounded complexity score 0 - 100
    let complexity = Math.min(count * 15, 60);
    if (hasConsonantCluster) complexity += 20;
    if (hasCheckedConsonant) complexity += 15;
    if (clean.length > 10) complexity += 15;

    return {
      word: clean,
      syllables,
      syllableCount: count,
      complexityScore: Math.min(complexity, 100),
      hasConsonantCluster,
      hasCheckedConsonant
    };
  }
}
