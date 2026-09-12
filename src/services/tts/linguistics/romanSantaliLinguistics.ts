/**
 * Bhasha Setu — Roman Santali Linguistic & Normalization Engine
 *
 * Implements language-aware normalization and speech guide generation for Romanized Santali.
 * Prevents English phonetic distortion of Santali phonemes (e.g. "aatu", "sagun", "daram", "sarhaw").
 *
 * Rules Version: 2.0-roman-santali
 */

export const ROMAN_SANTALI_RULES_VERSION = '2.0-roman-santali';

// High-frequency authentic Roman Santali lexical items for fast recognition
export const ROMAN_SANTALI_CORE_LEXICON: Record<string, string> = {
  'johar': 'Johar',
  'sarhaw': 'Sarhaw',
  'sarhao': 'Sarhaw',
  'sagun': 'Sagun',
  'daram': 'Daram',
  'setag': 'Setag',
  'tikil': 'Tikil',
  'ayub': 'Ayub',
  'ninda': 'Ninda',
  'nyinda': 'Nyinda',
  'disom': 'Disom',
  'aatu': 'Aatu',
  'atu': 'Aatu',
  'aleyag': 'Aleyag',
  'abowag': 'Abowag',
  'apeyag': 'Apeyag',
  'amag': 'Amag',
  'inj': 'Inj',
  'injag': 'Injag',
  'menag-a': 'Menag-a',
  'menaga': 'Menag-a',
  'menag\'a': 'Menag-a',
  'menag’a': 'Menag-a',
  'menanya': 'Menanya',
  'menama': 'Menama',
  'kana': 'Kana',
  'kanay': 'Kanay',
  'kanale': 'Kanale',
  'kanape': 'Kanape',
  'kanako': 'Kanako',
  'kowa': 'Kowa',
  'kole': 'Kole',
  'ched': 'Ched',
  'leka': 'Leka',
  'bes': 'Bes',
  'ge': 'Ge',
  'do': 'Do',
  're': 'Re',
  'khon': 'Khon',
  'te': 'Te',
  'sawtin': 'Sawtin',
  'sawte': 'Sawte',
  'gai': 'Gai',
  'hati': 'Hati',
  'dangra': 'Dangra',
  'mihu': 'Mihu',
  'bitkil': 'Bitkil',
  'merom': 'Merom',
  'sim': 'Sim',
  'seta': 'Seta',
  'chanach': 'Chanach',
  'asra': 'Asra',
  'asla': 'Asra',
  'itun': 'Itun',
  'machet': 'Machet',
  'pathua': 'Pathua',
  'pathuyako': 'Pathuyako',
  'raska': 'Raska',
  'daag': 'Daag',
  'dag': 'Daag',
  'bir': 'Bir',
  'haspatal': 'Haspatal',
  'sikil': 'Sikil',
  'sel': 'Sel',
  'mayam': 'Mayam',
  'bidaw': 'Bidaw',
  'bidao': 'Bidaw',
  'ran': 'Ran',
  'ruwa': 'Ruwa',
  'hasu': 'Hasu',
  'khet': 'Khet',
  'bad': 'Bad',
  'chasa': 'Chasa',
  'dhorom': 'Dhorom',
  'bonga': 'Bonga',
  'hawa': 'Hawa',
  'dakiya': 'Dakiya'
};

// Common English words to protect against false Roman Santali classification
const ENGLISH_ISOLATION_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on',
  'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we',
  'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
  'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'us', 'hospital', 'patient', 'doctor', 'medicine', 'tablet',
  'tablets', 'capsule', 'capsules', 'mg', 'ml', 'school', 'welcome', 'please', 'test', 'blood'
]);

export class RomanSantaliLinguistics {
  /**
   * Determines if a word is classified as Roman Santali.
   */
  public static isRomanSantaliWord(word: string): boolean {
    if (!word || word.length < 2) return false;
    const clean = word.toLowerCase().replace(/[^a-z'-]/g, '');

    if (ENGLISH_ISOLATION_WORDS.has(clean)) {
      return false;
    }

    if (ROMAN_SANTALI_CORE_LEXICON[clean]) {
      return true;
    }

    // Morphological patterns typical of Santali in Roman script:
    // Suffixes: -ag, -ko, -kowa, -kanay, -kana, -leka, -re, -khon
    if (/-(a|e|i|o|u)$/.test(clean)) return true; // e.g. menag-a
    if (/(kanay|kana|kanale|kanako|kowa|leyag|gowag|kowag)$/.test(clean)) return true;
    if (/(sarhaw|johar|sagun|disom|aatu|machet|chanach|pathua)$/.test(clean)) return true;

    return false;
  }

  /**
   * Normalizes a Roman Santali word into its canonical speech representation.
   * Resolves common orthographic variations (e.g. apostrophes, glottal hyphens).
   */
  public static normalizeRomanWord(word: string): string {
    if (!word) return '';

    const trimmed = word.trim();
    const clean = trimmed.toLowerCase().replace(/[^a-z'-]/g, '');

    // Canonical dictionary hit
    if (ROMAN_SANTALI_CORE_LEXICON[clean]) {
      return ROMAN_SANTALI_CORE_LEXICON[clean];
    }

    // Normalize hyphenated/apostrophe glottal markers (menag'a -> menag-a)
    let normalized = trimmed.replace(/['’]/g, '-');

    // Normalize double hyphens
    normalized = normalized.replace(/-+/g, '-');

    return normalized;
  }

  /**
   * Generates a phonetic acoustic guide for Roman Santali tokens
   * designed for natural rendering through Indian English / Hindi acoustic voices.
   */
  public static transliterateRomanToAcousticGuide(text: string): string {
    if (!text || !text.trim()) return '';

    const tokens = text.split(/(\s+|[.,!?;:()]+)/);

    return tokens.map(tok => {
      if (!tok.trim() || /^[.,!?;:()]+$/.test(tok)) {
        return tok;
      }

      const clean = tok.toLowerCase().replace(/[^a-z'-]/g, '');

      if (ENGLISH_ISOLATION_WORDS.has(clean)) {
        // Protect standard English word
        return tok;
      }

      if (this.isRomanSantaliWord(clean)) {
        return this.normalizeRomanWord(clean);
      }

      return tok;
    }).join('');
  }
}
