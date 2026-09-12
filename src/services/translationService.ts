import { SUPPORTED_LANGUAGES } from '../data/languages';
import { DICTIONARY_ENTRIES } from '../data/dictionaryData';
import { findSantaliMatch, normalizeText, lookupWord, SANTALI_DATASET, CORE_VOCABULARY, lookupExactDatasetEntry } from '../data/santaliDataset';
import { queryTranslationFromDb } from './sqliteService';
import { 
  SupportedLanguage, 
  CENTRAL_LANGUAGES, 
  LANGUAGES, 
  normalizeToSupportedLanguage, 
  getLanguageCode3, 
  getLanguageCode2,
  getLanguageCode 
} from './languageService';
import {
  getCapability,
  detectOutputScript,
  getStatusBadge,
  lookupVocabularyAssistance,
  TranslationStatus
} from './translationCapabilities';
import { TranslationEvidence } from './translationEvidence';
import {
  ITranslationProvider,
  PhraseBankProvider,
  localDbProvider,
  santaliDatasetProvider,
  onDeviceModelProvider,
  onlineProvider,
  setSimulatedOffline,
  getSimulatedOffline,
  ProviderTranslationResult
} from './translationProviders';

export { setSimulatedOffline, getSimulatedOffline };
import { VoiceIntelligenceEngine, VoiceQualityRouter, TTSQueue, TTSVoiceRouter } from './tts';

export interface TranslationResult {
  text: string;
  targetText: string;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  success: boolean;
  error?: string;
  transliteration?: string;
  /** Reliability status from the capability registry */
  reliability: TranslationStatus;
  /** Human-readable provider description */
  provider: string;
  /** Method category: 'neural' | 'dataset' | 'phrase_bank' | 'vocabulary_assistance' | 'none' */
  method: 'neural' | 'dataset' | 'phrase_bank' | 'vocabulary_assistance' | 'none';
  /** Actual script detected in the output (for Santali transparency) */
  outputScript?: string;
  /** Word-level vocabulary assistance results (only for unsupported pairs) */
  vocabularyAssistance?: { word: string; meaning: string }[];
  tokensCount: number;
  /** Full auditable translation evidence and provenance */
  evidence?: TranslationEvidence;
  /** Domain or thematic context */
  domain?: string;
}

// Ol Chiki Unicode mapping to Devanagari and Roman phonetics
export const OL_CHIKI_TO_PHONETIC: Record<string, { hi: string; en: string }> = {
  // Letters
  'ᱚ': { hi: 'ऑ', en: 'o' },
  'ᱛ': { hi: 'त', en: 't' },
  'ᱜ': { hi: 'ग', en: 'g' },
  'ᱝ': { hi: 'ं', en: 'ng' },
  'ᱞ': { hi: 'ल', en: 'l' },
  'ᱟ': { hi: 'आ', en: 'a' },
  'ᱠ': { hi: 'क', en: 'k' },
  'ᱡ': { hi: 'ज', en: 'j' },
  'ᱢ': { hi: 'म', en: 'm' },
  'ᱣ': { hi: 'व', en: 'w' },
  'ᱤ': { hi: 'इ', en: 'i' },
  'ᱥ': { hi: 'स', en: 's' },
  'ᱦ': { hi: 'ह', en: 'h' },
  'ᱧ': { hi: 'ञ', en: 'ny' },
  'ᱨ': { hi: 'र', en: 'r' },
  'ᱩ': { hi: 'उ', en: 'u' },
  'ᱪ': { hi: 'च', en: 'ch' },
  'ᱫ': { hi: 'द', en: 'd' },
  'ᱬ': { hi: 'ण', en: 'n' },
  'ᱭ': { hi: 'य', en: 'y' },
  'ᱮ': { hi: 'ए', en: 'e' },
  'ᱯ': { hi: 'प', en: 'p' },
  'ᱰ': { hi: 'ड', en: 'd' },
  'ᱱ': { hi: 'न', en: 'n' },
  'ᱲ': { hi: 'ड़', en: 'r' },
  'ᱳ': { hi: 'ओ', en: 'o' },
  'ᱴ': { hi: 'ट', en: 't' },
  'ᱵ': { hi: 'ब', en: 'b' },
  'ᱶ': { hi: 'ँ', en: 'nh' },
  'ᱷ': { hi: 'ह', en: 'h' },
  // Digits (U+1C50 - U+1C59)
  '᱐': { hi: '०', en: '0' },
  '᱑': { hi: '१', en: '1' },
  '᱒': { hi: '२', en: '2' },
  '᱓': { hi: '३', en: '3' },
  '᱔': { hi: '४', en: '4' },
  '᱕': { hi: '५', en: '5' },
  '᱖': { hi: '६', en: '6' },
  '᱗': { hi: '७', en: '7' },
  '᱘': { hi: '८', en: '8' },
  '᱙': { hi: '९', en: '9' },
  // Modifiers
  'ᱸ': { hi: 'ं', en: 'n' },
  'ᱹ': { hi: '', en: '' },
  'ᱺ': { hi: 'ं', en: 'n' },
  'ᱻ': { hi: '', en: '' },
  'ᱼ': { hi: '', en: '' },
  'ᱽ': { hi: '', en: '' },
  '᱾': { hi: '।', en: '.' },
  '᱿': { hi: '॥', en: '.' }
};

// Ol Chiki Vowel system with independent vs dependent (matra) signs
const OL_CHIKI_VOWELS: Record<string, { ind: string; dep: string; en: string }> = {
  'ᱚ': { ind: 'ऑ', dep: 'ॉ', en: 'o' },
  'ᱟ': { ind: 'आ', dep: 'ा', en: 'a' },
  'ᱤ': { ind: 'इ', dep: 'ि', en: 'i' },
  'ᱩ': { ind: 'उ', dep: 'ु', en: 'u' },
  'ᱮ': { ind: 'ए', dep: 'े', en: 'e' },
  'ᱳ': { ind: 'ओ', dep: 'ो', en: 'o' }
};

// Ol Chiki Consonants
const OL_CHIKI_CONSONANTS: Record<string, { hi: string; en: string }> = {
  'ᱛ': { hi: 'त', en: 't' },
  'ᱜ': { hi: 'ग', en: 'g' },
  'ᱝ': { hi: 'ं', en: 'ng' },
  'ᱞ': { hi: 'ल', en: 'l' },
  'ᱠ': { hi: 'क', en: 'k' },
  'ᱡ': { hi: 'ज', en: 'j' },
  'ᱢ': { hi: 'म', en: 'm' },
  'ᱣ': { hi: 'व', en: 'w' },
  'ᱥ': { hi: 'स', en: 's' },
  'ᱦ': { hi: 'ह', en: 'h' },
  'ᱧ': { hi: 'ञ', en: 'ny' },
  'ᱨ': { hi: 'र', en: 'r' },
  'ᱪ': { hi: 'च', en: 'ch' },
  'ᱫ': { hi: 'द', en: 'd' },
  'ᱬ': { hi: 'ण', en: 'n' },
  'ᱭ': { hi: 'य', en: 'y' },
  'ᱯ': { hi: 'प', en: 'p' },
  'ᱰ': { hi: 'ड', en: 'd' },
  'ᱱ': { hi: 'न', en: 'n' },
  'ᱲ': { hi: 'ड़', en: 'r' },
  'ᱴ': { hi: 'ट', en: 't' },
  'ᱵ': { hi: 'ब', en: 'b' },
  'ᱶ': { hi: 'ँ', en: 'nh' },
  'ᱷ': { hi: 'ह', en: 'h' }
};

/**
 * Transliterates Ol Chiki script text into Devanagari phonetics with proper matra and digit handling.
 * Guarantees zero leakage of Ol Chiki characters into Devanagari output.
 */
export function transliterateOlChikiToDevanagari(text: string): string {
  // Check if known Santali common phrases exist
  const knownPhrases: Record<string, string> = {
    'ᱡᱚᱦᱟᱨ': 'जोहार',
    'ᱥᱟᱱᱛᱟᱲᱤ': 'सांताड़ी',
    'ᱟᱢ ᱫᱚ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟ?': 'आम दो चेद लेका मेनाग-आ?',
    'ᱟᱞᱮᱭᱟᱜ ᱟᱹᱛᱩ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾': 'आलेयाग आतु रे आपेयाग सागुन दाराम',
    'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?': 'आमाग ञुतुम चेद?',
    'ᱤᱧ ᱫᱚ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ᱾': 'इंज दो बेस गे मेनाञा',
    'ᱦᱟᱥᱯᱟᱛᱟᱞ ᱫᱚ ᱚᱠᱟᱨᱮ ᱢᱮᱱᱟᱜ-ᱟ?': 'हासपाताल दो ओकारे मेनागा?',
    'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱢᱟᱭᱟᱢ ᱵᱤᱰᱟᱹᱣ': 'सिकिल सेल मायाम बिड़ाव',
    'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ': 'सिकिल सेल बिड़ाव',
    'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ': 'सागुन दाराम',
    'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ': 'सागुन सेताग',
    'ᱥᱟᱹᱜᱩᱱ ᱧᱤᱫᱟᱹ': 'सागुन ञिंदा',
    'ᱥᱟᱨᱦᱟᱣ': 'सारहाव',
    'ᱫᱟᱜ': 'दाग',
    'ᱵᱤᱨ': 'बीर',
    'ᱦᱮᱸ': 'हें',
    'ᱵᱟᱝ': 'बांग'
  };

  const trimmed = text.trim();
  if (knownPhrases[trimmed]) {
    return knownPhrases[trimmed];
  }

  let result = '';
  let prevWasConsonant = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (OL_CHIKI_VOWELS[ch]) {
      // Use dependent matra if following consonant; otherwise independent vowel
      result += prevWasConsonant ? OL_CHIKI_VOWELS[ch].dep : OL_CHIKI_VOWELS[ch].ind;
      prevWasConsonant = false;
    } else if (OL_CHIKI_CONSONANTS[ch]) {
      result += OL_CHIKI_CONSONANTS[ch].hi;
      prevWasConsonant = true;
    } else if (OL_CHIKI_TO_PHONETIC[ch]) {
      result += OL_CHIKI_TO_PHONETIC[ch].hi;
      // Modifiers like gahuḍlā (ᱹ) do not break consonant status
      if (ch !== 'ᱹ' && ch !== 'ᱸ' && ch !== 'ᱺ') {
        prevWasConsonant = false;
      }
    } else {
      result += ch;
      prevWasConsonant = false;
    }
  }

  // Strict Sanitization Guard: Guarantee zero Ol Chiki glyphs leak into Devanagari output
  result = result.replace(/[\u1C50-\u1C7F]/g, '');

  return result;
}

/**
 * Transliterates Ol Chiki script text into Roman / Latin characters
 */
export function transliterateOlChikiToRoman(text: string): string {
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (OL_CHIKI_TO_PHONETIC[ch]) {
      res += OL_CHIKI_TO_PHONETIC[ch].en;
    } else {
      res += ch;
    }
  }
  return res;
}

/**
 * Transliterates Romanized Santali into phonetic Devanagari representation.
 */
export function transliterateRomanSantaliToDevanagari(text: string): string {
  if (!text || !text.trim()) return '';

  const COMMON_ROMAN_SANTALI: Record<string, string> = {
    'johar': 'जोहार',
    'sarhaw': 'सारहाव',
    'iny': 'इञ',
    'ing': 'इञ',
    'asra': 'आसड़ा',
    'senog': 'सेनॉग',
    'kanany': 'कानाञ',
    'kana': 'काना',
    'nui': 'नुय',
    'do': 'दॉ',
    'gai': 'गाय',
    'kanay': 'कानाय',
    'dag': 'दाग',
    'bir': 'बीर',
    'ale': 'आले',
    'alear': 'आलेयाग',
    'atu': 'आतु',
    'disom': 'दिसम',
    'marang': 'मरांग',
    'buru': 'बुरु',
    'serma': 'सेरमा',
    'setag': 'सेताग',
    'nida': 'ञिंदा',
    'bes': 'बेस',
    'ge': 'गे',
    'menama': 'मेनामा',
    'menanya': 'मेनाञा',
    'menag-a': 'मेनागा',
    'dangra': 'डांगरा',
    'mihu': 'मिहू',
    'bitkil': 'बिटकिल',
    'kada': 'काडा',
    'hopon': 'होपोन',
    'gari': 'गाड़ी',
    'hanu': 'हानू'
  };

  const words = text.split(/(\s+|[.,!?;:()]+)/);
  const result = words.map(w => {
    const lower = w.toLowerCase().trim();
    if (COMMON_ROMAN_SANTALI[lower]) {
      return COMMON_ROMAN_SANTALI[lower];
    }
    return w;
  }).join('');

  // Strict regex sanitization
  return result.replace(/[\u1C50-\u1C7F]/g, '');
}

/**
 * Transliterates Santali output text into requested orthographic or phonetic script representation
 */
export function transliterateSantaliToScript(
  text: string,
  targetScript: 'ol_chiki' | 'latin' | 'devanagari'
): string {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();

  // Ol Chiki native representation
  if (targetScript === 'ol_chiki') {
    const parenIdx = trimmed.indexOf('(');
    if (parenIdx > 0 && /[\u1C50-\u1C7F]/.test(trimmed.slice(0, parenIdx))) {
      return trimmed.slice(0, parenIdx).trim();
    }
    return trimmed;
  }

  // Roman / Latin phonetic representation
  if (targetScript === 'latin') {
    const parenMatch = trimmed.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      return parenMatch[1].trim();
    }
    return transliterateOlChikiToRoman(trimmed);
  }

  // Devanagari phonetic representation
  if (targetScript === 'devanagari') {
    const parenIdx = trimmed.indexOf('(');
    const sourceToConvert = (parenIdx > 0 && /[\u1C50-\u1C7F]/.test(trimmed.slice(0, parenIdx)))
      ? trimmed.slice(0, parenIdx).trim()
      : trimmed;

    // If text contains Ol Chiki, use Ol Chiki to Devanagari converter
    if (/[\u1C50-\u1C7F]/.test(sourceToConvert)) {
      return transliterateOlChikiToDevanagari(sourceToConvert);
    }
    // If text is Romanized Santali, transliterate Roman to Devanagari
    return transliterateRomanSantaliToDevanagari(sourceToConvert);
  }

  return trimmed;
}

// Comprehensive Santali (Ol Chiki & Romanized) to English vocabulary & grammar mapping
export const SANTALI_WORDS_TO_EN: Record<string, string> = {
  'ᱤᱧᱟᱜ': 'My',
  'ᱤᱧ': 'I',
  'ᱟᱢᱟᱜ': 'Your',
  'ᱟᱢ': 'You',
  'ᱟᱵᱚᱣᱟᱜ': 'Our',
  'ᱟᱵᱚ': 'We',
  'ᱟᱞᱮᱭᱟᱜ': 'Our',
  'ᱟᱞᱮ': 'We',
  'ᱩᱱᱤᱭᱟᱜ': 'His / Her',
  'ᱩᱱᱤ': 'He / She',
  'ᱱᱩᱭ': 'This',
  'ᱱᱚᱣᱟ': 'This',
  'ᱧᱩᱛᱩᱢ': 'name',
  'ᱠᱟᱱᱟ': 'is',
  'ᱠᱟᱱᱟᱭ': 'is',
  'ᱠᱟᱱᱟᱹᱧ': 'am',
  'ᱠᱟᱱᱟᱧ': 'am',
  'ᱢᱮᱱᱟᱜ-ᱟ': 'is',
  'ᱢᱮᱱᱟᱜᱼᱟ': 'is',
  'ᱢᱮᱱᱟᱹᱧᱟ': 'am',
  'ᱢᱮᱱᱟᱢᱟ': 'are',
  'ᱪᱮᱫ': 'what',
  'ᱚᱠᱟ': 'which',
  'ᱚᱠᱟᱨᱮ': 'where',
  'ᱪᱮᱫ ᱞᱮᱠᱟ': 'how',
  'ᱪᱤᱞᱠᱟ': 'how',
  'ᱵᱮᱥ': 'good',
  'ᱜᱮ': '',
  'ᱫᱚ': '',
  'ᱦᱚᱲᱢᱚ': 'health',
  'ᱟᱹᱛᱩ': 'village',
  'ᱫᱤᱥᱚᱢ': 'country',
  'ᱜᱟᱹᱭ': 'cow',
  'ᱰᱟᱝᱜᱽᱨᱟ': 'bull',
  'ᱥᱮᱛᱟ': 'dog',
  'ᱯᱩᱥᱤ': 'cat',
  'ᱵᱤᱞᱟᱹᱭ': 'cat',
  'ᱦᱟᱥᱯᱟᱛᱟᱞ': 'hospital',
  'ᱨᱟᱱ': 'medicine',
  'ᱫᱟᱜ': 'water',
  'ᱥᱟᱯᱷᱟ': 'clean',
  'ᱯᱩᱛᱷᱤ': 'book',
  'ᱤᱛᱩᱱ ᱟᱥᱲᱟ': 'school',
  'ᱢᱟᱪᱮᱛ': 'teacher',
  'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ': 'student',
  'ᱚᱲᱟᱜ': 'house',
  'ᱠᱟᱹᱢᱤ': 'homework',
  'ᱦᱤᱲᱤᱧ': 'forgot',
  'ᱯᱩᱨᱟᱹᱣ': 'finished',
  'ᱮᱦᱚᱵ': 'started',
  'ᱮᱴᱠᱮᱴᱚᱬᱮ': 'problem',
  'ᱥᱚᱞᱦᱮ': 'solve',
  'ᱫᱟᱲᱮᱭᱟᱜ': 'able to',
  'ᱵᱟᱹᱧ': 'could not',
  'ᱵᱟᱝ': 'not',
  'ᱦᱮᱸ': 'yes',
  'ᱡᱚᱦᱟᱨ': 'Hello',
  // Romanized variants
  'injag': 'My',
  'inyag': 'My',
  'ingag': 'My',
  'inj': 'I',
  'ing': 'I',
  'amag': 'Your',
  'am': 'You',
  'nyutum': 'name',
  'nutum': 'name',
  'kana': 'is',
  'kanay': 'is',
  'babulal': 'Babulal',
  'seta': 'dog',
  'pusi': 'cat',
  'bilae': 'cat',
  'dare': 'tree',
  'daag': 'water',
  'puthi': 'book',
  'machet': 'teacher'
};

// Comprehensive Santali (Ol Chiki & Romanized) to Hindi vocabulary & grammar mapping
export const SANTALI_WORDS_TO_HI: Record<string, string> = {
  'ᱤᱧᱟᱜ': 'मेरा',
  'ᱤᱧ': 'मैं',
  'ᱟᱢᱟᱜ': 'आपका',
  'ᱟᱢ': 'आप',
  'ᱟᱵᱚᱣᱟᱜ': 'हमारा',
  'ᱟᱵᱚ': 'हम',
  'ᱟᱞᱮᱭᱟᱜ': 'हमारा',
  'ᱟᱞᱮ': 'हम',
  'ᱩᱱᱤᱭᱟᱜ': 'उसका',
  'ᱩᱱᱤ': 'वह',
  'ᱱᱩᱭ': 'यह',
  'ᱱᱚᱣᱟ': 'यह',
  'ᱧᱩᱛᱩᱢ': 'नाम',
  'ᱠᱟᱱᱟ': 'है',
  'ᱠᱟᱱᱟᱭ': 'है',
  'ᱠᱟᱱᱟᱹᱧ': 'हूँ',
  'ᱠᱟᱱᱟᱧ': 'हूँ',
  'ᱢᱮᱱᱟᱜ-ᱟ': 'है',
  'ᱢᱮᱱᱟᱜᱼᱟ': 'है',
  'ᱢᱮᱱᱟᱹᱧᱟ': 'हूँ',
  'ᱢᱮᱱᱟᱢᱟ': 'हैं',
  'ᱪᱮᱫ': 'क्या',
  'ᱚᱠᱟ': 'कौन सा',
  'ᱚᱠᱟᱨᱮ': 'कहाँ',
  'ᱪᱮᱫ ᱞᱮᱠᱟ': 'कैसे',
  'ᱪᱤᱞᱠᱟ': 'कैसे',
  'ᱵᱮᱥ': 'अच्छा',
  'ᱜᱮ': '',
  'ᱫᱚ': '',
  'ᱦᱚᱲᱢᱚ': 'स्वास्थ्य',
  'ᱟᱹᱛᱩ': 'गाँव',
  'ᱫᱤᱥᱚᱢ': 'देश',
  'ᱜᱟᱹᱭ': 'गाय',
  'ᱰᱟᱝᱜᱽᱨᱟ': 'बैल',
  'ᱥᱮᱛᱟ': 'कुत्ता',
  'ᱯᱩᱥᱤ': 'बिल्ली',
  'ᱵᱤᱞᱟᱹᱭ': 'बिल्ली',
  'ᱦᱟᱥᱯᱟᱛᱟᱞ': 'अस्पताल',
  'ᱨᱟᱱ': 'दवा',
  'ᱫᱟᱜ': 'पानी',
  'ᱥᱟᱯᱷᱟ': 'साफ',
  'ᱯᱩᱛᱷᱤ': 'किताब',
  'ᱤᱛᱩᱱ ᱟᱥᱲᱟ': 'स्कूल',
  'ᱢᱟᱪᱮᱛ': 'शिक्षक',
  'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ': 'छात्र',
  'ᱚᱲᱟᱜ': 'घर',
  'ᱠᱟᱹᱢᱤ': 'काम',
  'ᱦᱤᱲᱤᱧ': 'भूल गया',
  'ᱯᱩᱨᱟᱹᱣ': 'पूरा किया',
  'ᱮᱦᱚᱵ': 'शुरू किया',
  'ᱮᱴᱠᱮᱴᱚᱬᱮ': 'समस्या',
  'ᱥᱚᱞᱦᱮ': 'हल',
  'ᱫᱟᱲᱮᱭᱟᱜ': 'सका',
  'ᱵᱟᱹᱧ': 'नहीं',
  'ᱵᱟᱝ': 'नहीं',
  'ᱦᱮᱸ': 'हाँ',
  'ᱡᱚᱦᱟᱨ': 'नमस्ते',
  // Romanized variants
  'injag': 'मेरा',
  'inyag': 'मेरा',
  'ingag': 'मेरा',
  'inj': 'मैं',
  'ing': 'मैं',
  'amag': 'आपका',
  'am': 'आप',
  'nyutum': 'नाम',
  'nutum': 'नाम',
  'kana': 'है',
  'kanay': 'है',
  'babulal': 'बाबूलाल',
  'seta': 'कुत्ता',
  'pusi': 'बिल्ली',
  'bilae': 'बिल्ली',
  'dare': 'पेड़',
  'daag': 'पानी',
  'puthi': 'किताब',
  'machet': 'शिक्षक'
};

// Comprehensive bilingual phrase bank for realistic instant translation across major tribal languages
const TRANSLATION_MAP: Record<string, Record<string, string>> = {
  // Hello & Greetings
  'hello': {
    bhi: 'खम्मा घणी / राम राम',
    sat: 'ᱡᱚᱦᱟᱨ (Johar)',
    gon: 'सेवा जोहार (Seva Johar)',
    unr: 'ᱡᱚᱦᱟᱨ ᱜᱮ (Johar ge)',
    kui: 'ଜୋହାର (Johar)',
    grt: 'Mitela / Salam',
    trp: 'Khulumkha',
    hin: 'नमस्ते'
  },
  'hi': {
    bhi: 'राम राम',
    sat: 'ᱡᱚᱦᱟᱨ (Johar)',
    hoc: 'ᱡᱚᱦᱟᱨ / जोहार (Johar)',
    gon: 'सेवा जोहार',
    unr: 'ᱡᱚᱦᱟᱨ ᱜᱮ',
    kui: 'ଜୋହାର',
    grt: 'Mitela',
    trp: 'Khulumkha',
    hin: 'नमस्ते'
  },
  'greetings': {
    bhi: 'खम्मा घणी / राम राम',
    sat: 'ᱡᱚᱦᱟᱨ (Johar)',
    hoc: 'ᱡᱚᱦᱟᱨ / जोहार (Johar)',
    gon: 'सेवा जोहार (Seva Johar)',
    unr: 'ᱡᱚᱦᱟᱨ ᱜᱮ (Johar ge)',
    kui: 'ଜୋହାର / ନମସ୍କାର',
    grt: 'Mitela / Salam',
    trp: 'Khulumkha',
    hin: 'नमस्ते / प्रणाम'
  },
  'how are you': {
    bhi: 'तमहूँ केम सो?',
    sat: 'ᱟᱢ ᱫᱚ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟ? (Am do ched leka menag-a?)',
    hoc: 'ᱟᱢ ᱫᱚ ᱪᱤᱞᱠᱟ ᱢᱮᱱᱟᱢᱟ? (Am do chilka menama?)',
    gon: 'इम बेके मंतोनी?',
    unr: 'ᱟᱢ ᱫᱚ ᱪᱤᱞᱠᱟ ᱢᱮᱱᱟᱢᱟ?',
    kui: 'ମି କେନେକି ଆତା?',
    grt: 'Nang·a maikai donga?',
    trp: 'Nwng bahai tong?',
    hin: 'आप कैसे हैं?'
  },
  'thank you': {
    bhi: 'तमारो खूब खूब आभार',
    sat: 'ᱥᱟᱨᱦᱟᱣ (Sarhaw)',
    gon: 'धन्‍यवाद (Dhanyawad)',
    unr: 'ᱥᱟᱨᱦᱟᱣ (Sarhaw)',
    kui: 'ଧନ୍ୟବାଦ',
    grt: 'Mitela',
    trp: 'Hambai',
    hin: 'धन्यवाद'
  },
  'good morning': {
    bhi: 'सुप्रभात / राम राम',
    sat: 'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ (Sagun Setag)',
    gon: 'शुभ प्रभात',
    unr: 'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ',
    kui: 'ଶୁଭ ସକାଳ',
    grt: 'Namgipa pring',
    trp: 'Kaham sal',
    hin: 'सुप्रभात'
  },
  'good night': {
    bhi: 'शुभ रात्रि',
    sat: 'ᱥᱟᱹᱜᱩᱱ ᱧᱤᱫᱟᱹ (Sagun Nyinda)',
    gon: 'शुभ रात',
    unr: 'ᱥᱟᱹᱜᱩᱱ ᱧᱤᱫᱟᱹ',
    kui: 'ଶୁଭ ରାତ୍ରି',
    grt: 'Namgipa wal',
    trp: 'Kaham hor',
    hin: 'शुभ रात्रि'
  },
  'welcome to our village': {
    bhi: 'आमारो गाम मां तमारुं स्वागत छे।',
    sat: 'ᱟᱞᱮᱭᱟᱜ ᱟᱹᱛᱩ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾ (Aleyag aatu re sagun daram)',
    gon: 'मावा नाटो ते त्वांग स्वागत मंता।',
    unr: 'ᱟᱞᱮᱭᱟᱜ ᱦᱟᱛᱩ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾',
    kui: 'ଆମୋ ଗାଁ ରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ।',
    grt: 'Chingni songona namchikbeani sokbapaha.',
    trp: 'Chini amchaino kubui bisiro.',
    hin: 'हमारे गांव में आपका हार्दिक स्वागत है।'
  },
  'what is your name': {
    bhi: 'तमारुं नाव काई से?',
    sat: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ? (Amag nyutum ched?)',
    gon: 'नीवा नांव बतंग?',
    unr: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱤᱱᱟᱹ?',
    kui: 'ମି ନାଦି ଆତା ଇନେ?',
    grt: 'Nang·ni biming maikai?',
    trp: 'Nini mung tamo?',
    hin: 'आपका नाम क्या है?'
  },
  'i am fine': {
    bhi: 'हू मझा मां सू।',
    sat: 'ᱤᱧ ᱫᱚ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ᱾ (Inj do bes ge menanya)',
    gon: 'नन्ना बेसे मंतोन।',
    unr: 'ᱟᱹᱧ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱧᱟ᱾',
    kui: 'ମୁଁ ଭଲରେ ଅଛି।',
    grt: 'Anga namenggoa.',
    trp: 'Ang kaham tong.',
    hin: 'मैं ठीक हूँ।'
  },
  'where is the hospital': {
    bhi: 'दवाखानो क्यां छे?',
    sat: 'ᱦᱟᱥᱯᱟᱛᱟᱞ ᱫᱚ ᱚᱠᱟᱨᱮ ᱢᱮᱱᱟᱜ-ᱟ? (Hospital do okare menag-a?)',
    gon: 'दावाखाना बगा मंता?',
    unr: 'ᱦᱟᱥᱯᱟᱛᱟᱞ ᱫᱚ ᱠᱟᱨᱮ ᱢᱮᱱᱟᱜ-ᱟ?',
    kui: 'ଡାକ୍ତରଖାନା କେଉଁଠି ଅଛି?',
    grt: 'Hospital bano donga?',
    trp: 'Hospital boro tong?',
    hin: 'अस्पताल कहाँ है?'
  },
  'sickle cell test': {
    bhi: 'सिकिल सेल रगत नी जांच',
    sat: 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱢᱟᱭᱟᱢ ᱵᱤᱰᱟᱹᱣ (Sikil sel mayam bidaw)',
    gon: 'सिकिल सेल नेतुर ना जांच',
    unr: 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱡᱟᱸᱪ',
    kui: 'ସିକିଲ ସେଲ ରକ୍ତ ପରୀକ୍ଷା',
    grt: 'Sickle cell an·chi porikka',
    trp: 'Sickle cell thwi porikha',
    hin: 'सिकल सेल खून की जांच'
  },
  'water': {
    bhi: 'पाणी (Pani)',
    sat: 'ᱫᱟᱜ (Daag)',
    gon: 'येर (Yer)',
    unr: 'ᱫᱟᱜ (Daag)',
    kui: 'ପାଣି (Pani)',
    grt: 'Chi',
    trp: 'Twi',
    hin: 'पानी / जल'
  },
  'forest': {
    bhi: 'जंगल / वन',
    sat: 'ᱵᱤᱨ (Bir)',
    gon: 'अडवी / जंगल',
    unr: 'ᱵᱤᱨ (Bir)',
    kui: 'ଜଙ୍ଗଲ / ବନ',
    grt: 'Buring',
    trp: 'Hachuk',
    hin: 'जंगल / वन'
  },
  'yes': {
    sat: 'ᱦᱮᱸ (Hen)',
    hin: 'हाँ',
    eng: 'Yes',
    bhi: 'हाँ',
    hoc: 'ᱦᱮᱸ (Hen)',
    unr: 'ᱦᱮᱸ (Hen)',
  },
  'no': {
    sat: 'ᱵᱟᱝ (Bang)',
    hin: 'नहीं',
    eng: 'No',
    bhi: 'नहीं',
    hoc: 'ᱵᱟᱝ (Bang)',
    unr: 'ᱵᱟᱝ (Bang)',
  },
  'please': {
    sat: 'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ (Sagun daram)',
    hin: 'कृपया',
    eng: 'Please',
    bhi: 'मेहरबानी करके',
  },
  'sorry': {
    sat: 'ᱢᱟᱯ ᱫᱟᱨᱟᱢ (Map daram)',
    hin: 'क्षमा करें',
    eng: 'Sorry',
    bhi: 'माफ करजो',
    hoc: 'माफ करें',
  },
  'help': {
    sat: 'ᱥᱟᱦᱟᱭ ᱢᱮ (Sahay me)',
    hin: 'मदद करें',
    eng: 'Help',
    bhi: 'मदद करो',
  },
  'i am hungry': {
    sat: 'ᱤᱧ ᱫᱚ ᱵᱩᱠᱟᱹ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ᱾ (Inj do buka ge menanya)',
    hin: 'मुझे भूख लगी है',
    eng: 'I am hungry',
  },
  'i am thirsty': {
    sat: 'ᱤᱧ ᱫᱚ ᱫᱟᱜ ᱟᱠᱟᱱᱟᱧ᱾ (Inj do daag akananaj)',
    hin: 'मुझे प्यास लगी है',
    eng: 'I am thirsty',
  },
  'where are you from': {
    sat: 'ᱟᱢ ᱫᱚ ᱚᱠᱟ ᱠᱷᱚᱱ ᱦᱮᱡ ᱠᱟᱱᱟ? (Am do oka khon hej kana?)',
    hin: 'आप कहाँ से आए हैं?',
    eng: 'Where are you from?',
    bhi: 'तमे क्यांथी आवो?',
  },
  'goodbye': {
    sat: 'ᱡᱚᱦᱟᱨ ᱡᱚᱦᱟᱨ (Johar johar)',
    hin: 'अलविदा',
    eng: 'Goodbye',
    bhi: 'आवजो',
    hoc: 'ᱡᱚᱦᱟᱨ (Johar)',
  },
  'i dont understand': {
    sat: 'ᱤᱧ ᱵᱩᱡᱷᱩ ᱵᱟᱝ ᱠᱟᱱᱟᱧ᱾ (Inj bujhu bang kananj)',
    hin: 'मैं समझ नहीं पाया',
    eng: "I don't understand",
    bhi: 'हू समझतो नथी',
  },
  "i don't understand": {
    sat: 'ᱤᱧ ᱵᱩᱡᱷᱩ ᱵᱟᱝ ᱠᱟᱱᱟᱧ᱾ (Inj bujhu bang kananj)',
    hin: 'मैं समझ नहीं पाया',
    eng: "I don't understand",
    bhi: 'हू समझतो नथी',
  },
  'speak slowly': {
    sat: 'ᱛᱟᱲᱟᱢ ᱛᱟᱲᱟᱢ ᱜᱟᱞ ᱢᱮ (Tanam tanam gal me)',
    hin: 'धीरे बोलिए',
    eng: 'Speak slowly',
    bhi: 'धीरे बोलो',
  },
  'call the doctor': {
    sat: 'ᱫᱚᱠᱴᱚᱨ ᱠᱚ ᱡᱚᱜᱟᱣ ᱢᱮ (Doktar ko jogao me)',
    hin: 'डॉक्टर को बुलाओ',
    eng: 'Call the doctor',
    bhi: 'ड़ॉक्टर ने बोलावो',
  },
  'what is this': {
    sat: 'ᱱᱩᱭ ᱫᱚ ᱠᱤᱧ ᱠᱟᱱᱟ? (Nui do king kana?)',
    hin: 'यह क्या है?',
    eng: 'What is this?',
    bhi: 'ये काई छे?',
  },
  'cat': {
    sat: 'ᱵᱤᱞᱟᱹᱭ (Bilae / Pusi)',
    hin: 'बिल्ली (Billi)',
    eng: 'Cat',
    bhi: 'बिलाड़ी (Biladi)',
    gon: 'वर्काल / पूसी (Varkal / Pusi)',
    hoc: 'ᱵᱤᱞᱟᱹᱭ (Biloi)',
    unr: 'ᱵᱤᱞᱟᱹᱭ (Bilae)',
    kui: 'ବିରାଡି (Biradi)',
    grt: 'Menggo',
    trp: 'Menggong'
  },
  'dog': {
    sat: 'ᱥᱮᱛᱟ (Seta)',
    hin: 'कुत्ता (Kutta)',
    eng: 'Dog',
    bhi: 'कुतरो (Kutro)',
    gon: 'नय (Nai)',
    hoc: 'ᱥᱮᱛᱟ (Seta)',
    unr: 'ᱥᱮᱛᱟ (Seta)',
    kui: 'କୁକୁର (Kukura)',
    grt: 'Achak',
    trp: 'Waisa'
  },
  'cow': {
    sat: 'ᱜᱟᱹᱭ (Gai)',
    hin: 'गाय (Gaay)',
    eng: 'Cow',
    bhi: 'गाय',
    gon: 'कोण्ड / गाय',
    hoc: 'ᱜᱟᱹᱭ (Gai)',
    unr: 'ᱜᱟᱹᱭ (Gai)'
  },
  'bird': {
    sat: 'ᱪᱮᱬᱮ (Chene)',
    hin: 'पक्षी / चिड़िया (Chidiya)',
    eng: 'Bird',
    bhi: 'पखेरू',
    gon: 'पिट्टे (Pitte)',
    hoc: 'ᱪᱮᱬᱮ (Chene)'
  },
  'tree': {
    sat: 'ᱫᱟᱨᱮ (Dare)',
    hin: 'पेड़ / वृक्ष (Ped)',
    eng: 'Tree',
    bhi: 'झाड़ (Jhad)',
    gon: 'मर्रा (Marra)',
    hoc: 'ᱫᱟᱨᱮ (Dare)'
  },
  'book': {
    sat: 'ᱯᱩᱛᱷᱤ (Puthi)',
    hin: 'किताब / पुस्तक (Kitab)',
    eng: 'Book',
    bhi: 'पोथी (Pothi)',
    gon: 'पोथी / पुस्तक',
    hoc: 'ᱯᱩᱛᱷᱤ (Puthi)'
  },
  'school': {
    sat: 'ᱤᱛᱩᱱ ᱟᱥᱲᱟ (Itun Asra)',
    hin: 'विद्यालय / स्कूल (School)',
    eng: 'School',
    bhi: 'निसड़ा (Nisda)',
    gon: 'साला / स्कूल',
    hoc: 'ᱤᱛᱩᱱ ᱟᱥᱲᱟ (Itun Asra)'
  },
  'teacher': {
    sat: 'ᱢᱟᱪᱮᱛ (Machet)',
    hin: 'शिक्षक / अध्यापक (Shikshak)',
    eng: 'Teacher',
    bhi: 'गुरुजी (Guruji)',
    gon: 'मास्टर / गुरु',
    hoc: 'ᱢᱟᱪᱮᱛ (Machet)'
  },
  'student': {
    sat: 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ (Pathuwa)',
    hin: 'छात्र / विद्यार्थी (Chhatra)',
    eng: 'Student',
    bhi: 'भणनार',
    hoc: 'ᱯᱟᱹᱴᱷᱩᱣᱟᱹ (Pathuwa)'
  },
  'house': {
    sat: 'ᱚᱲᱟᱜ (Orag)',
    hin: 'घर / मकान (Ghar)',
    eng: 'House',
    bhi: 'घेर (Ghar)',
    gon: 'रोन (Ron)',
    hoc: 'ᱚᱲᱟᱜ (Owa)'
  },
  'sun': {
    sat: 'ᱵᱮᱲᱟ / ᱥᱤᱧ (Beda / Sinj)',
    hin: 'सूर्य / सूरज (Suraj)',
    eng: 'Sun',
    bhi: 'सूरज',
    gon: 'पोद्दु (Poddu)',
    hoc: 'ᱥᱤᱝᱜᱤ (Singi)'
  },
  'moon': {
    sat: 'ᱪᱟᱸᱫᱚ (Chando)',
    hin: 'चाँद / चंद्रमा (Chand)',
    eng: 'Moon',
    bhi: 'चांदो',
    gon: 'नेला (Nela)',
    hoc: 'ᱪᱟᱸᱫᱩ (Chandu)'
  }
};

// Formalized Translation Provider Pipeline
export const phraseBankProvider = new PhraseBankProvider(TRANSLATION_MAP);

export const translationProviders: ITranslationProvider[] = [
  phraseBankProvider,
  localDbProvider,
  santaliDatasetProvider,
  onDeviceModelProvider,
  onlineProvider
];

// Memory cache for instant repeated translations
const translationCache = new Map<string, TranslationResult>();

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function logTranslationDebug(
  src: SupportedLanguage,
  tgt: SupportedLanguage,
  input: string,
  provider: string,
  response: string,
  success: boolean
) {
  console.log(
    `[TRANSLATION DEBUG]\n` +
    `Source Language: ${src}\n` +
    `Target Language: ${tgt}\n\n` +
    `Input Text:\n${input}\n\n` +
    `Translation Provider:\n${provider}\n\n` +
    `Provider Response:\n${response}\n\n` +
    `Translation Success:\n${success}`
  );
}

/**
 * Single segment / clause translation across verified provider pipeline:
 * 1. Bilingual Phrase Bank (instant colloquial match)
 * 2. Classroom SQLite Database (6,780 verified rows)
 * 3. Santali Linguistic Dataset (In-Memory 6,780 verified entries, O(1) hash maps)
 * 4. On-Device Edge Model (future-ready architecture)
 * 5. Online Neural Bridge (capability-gated, timeout-protected, offline-aware)
 */
async function translateSegment(
  segment: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage,
  domain?: string
): Promise<ProviderTranslationResult | null> {
  const trimmed = segment.trim();
  if (!trimmed) return null;

  // 1. Bilingual Phrase Bank
  const pbRes = await phraseBankProvider.translate(trimmed, sourceLang, targetLang, { domain });
  if (pbRes) return pbRes;

  // 2. Classroom SQLite Database Query (translations.db - 6,780 verified rows)
  const dbRes = await localDbProvider.translate(trimmed, sourceLang, targetLang, { domain });
  if (dbRes) return dbRes;

  // 3. Santali Linguistic Dataset (In-Memory 6,780 entries with O(1) hash maps)
  if (santaliDatasetProvider.isAvailable(sourceLang, targetLang)) {
    const dsRes = await santaliDatasetProvider.translate(trimmed, sourceLang, targetLang, { domain });
    if (dsRes) return dsRes;
  }

  // 4. On-Device Edge Neural Engine (future-ready interface)
  if (onDeviceModelProvider.isAvailable(sourceLang, targetLang)) {
    const modelRes = await onDeviceModelProvider.translate(trimmed, sourceLang, targetLang, { domain });
    if (modelRes) return modelRes;
  }

  // 5. Online Neural Translation Bridge (capability-gated, offline-aware)
  if (onlineProvider.isAvailable(sourceLang, targetLang)) {
    const onlineRes = await onlineProvider.translate(trimmed, sourceLang, targetLang);
    if (onlineRes) return onlineRes;
  }

  // No translation available through any tier
  return null;
}

/**
 * Intelligent translation engine for Bhasha Setu.
 *
 * Supported Languages: English, Hindi, Santali, Mundari, Ho.
 *
 * Guarantees:
 * - Consults the TRANSLATION_CAPABILITIES registry to determine support level per pair.
 * - Never silently returns source text as a translation.
 * - For unsupported pairs (Mundari, Ho), returns success=false + vocabularyAssistance[].
 * - Attaches full TranslationEvidence provenance to every output.
 * - Detects actual Unicode script in Santali output (Ol Chiki vs Romanized).
 * - Provider labels are honest: "Google Translate Web Bridge (Unofficial)" not "Neural API".
 * - reliability field reflects actual capability, never a fake percentage.
 */
export async function translateText(
  text: string,
  sourceLangCode: string,
  targetLangCode: string,
  options?: { domain?: string; targetScript?: string }
): Promise<TranslationResult> {
  const trimmed = (text || '').trim();
  const sourceLanguage = normalizeToSupportedLanguage(sourceLangCode);
  const targetLanguage = normalizeToSupportedLanguage(targetLangCode);
  const sourceLangCode3 = getLanguageCode3(sourceLanguage);
  const targetLangCode3 = getLanguageCode3(targetLanguage);
  const domain = options?.domain;

  // Helper to build a clean empty result
  const emptyResult = (success: boolean, rel: TranslationStatus, err?: string): TranslationResult => ({
    text: '',
    targetText: '',
    sourceText: trimmed,
    sourceLang: sourceLangCode3,
    targetLang: targetLangCode3,
    sourceLanguage,
    targetLanguage,
    tokensCount: trimmed.split(/\s+/).length,
    success,
    error: err,
    reliability: rel,
    provider: 'None',
    method: 'none',
    domain
  });

  // 1. Empty Check
  if (!trimmed) {
    return {
      text: '',
      targetText: '',
      sourceText: '',
      sourceLang: sourceLangCode3,
      targetLang: targetLangCode3,
      sourceLanguage,
      targetLanguage,
      tokensCount: 0,
      success: true,
      reliability: 'verified',
      provider: 'None',
      method: 'none',
      domain
    };
  }

  // 2. Identity Check (same-language)
  if (sourceLanguage === targetLanguage) {
    const idEvidence: TranslationEvidence = {
      id: `ev-id-${Date.now()}`,
      sourceType: 'phrase_bank',
      providerName: 'Identity (Same Language)',
      verificationStatus: 'verified',
      isOffline: true,
      internetRequired: false,
      matchCategory: 'identity',
      targetScript: CENTRAL_LANGUAGES[targetLanguage]?.scriptName || 'Default',
      timestamp: Date.now(),
      notes: 'No translation required (source and target languages are identical).'
    };

    return {
      text: 'No translation required.',
      targetText: 'No translation required.',
      sourceText: trimmed,
      sourceLang: sourceLangCode3,
      targetLang: targetLangCode3,
      sourceLanguage,
      targetLanguage,
      tokensCount: trimmed.split(/\s+/).length,
      success: true,
      reliability: 'verified',
      provider: 'Identity (Same Language)',
      method: 'none',
      evidence: idEvidence,
      domain
    };
  }

  // 3. Consult capability registry FIRST
  const cap = getCapability(sourceLanguage, targetLanguage);

  // 4. Cache Check
  const cacheKey = `${sourceLanguage}_${targetLanguage}_${trimmed}_${domain || ''}_${options?.targetScript || ''}`;
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey)!;
    if (import.meta.env.DEV) {
      logTranslationDebug(sourceLanguage, targetLanguage, trimmed, `${cached.provider} (Cached)`, cached.text, cached.success);
    }
    return cached;
  }

  // 5. Handle unsupported pairs: return clear failure + separate vocabulary assistance
  //    Never fabricate sentences; never copy Santali into Mundari/Ho.
  if (!cap || !cap.fullSentence) {
    const targetName = CENTRAL_LANGUAGES[targetLanguage]?.name || targetLanguage;
    const errorMsg = `Full sentence translation from ${CENTRAL_LANGUAGES[sourceLanguage]?.name || sourceLanguage} to ${targetName} is not currently available. No public neural MT model supports this language pair.`;

    // Build vocabulary assistance if available for this pair
    let vocabAssist: { word: string; meaning: string }[] | undefined;
    const vocabTargetLang = (targetLanguage === 'mundari' || targetLanguage === 'ho') ? targetLanguage : null;
    const vocabScriptTarget = (sourceLanguage === 'hindi') ? 'hindi' : 'english';

    if (vocabTargetLang && cap?.vocabularyAssistance) {
      const words = trimmed.split(/\s+/).map(w => w.replace(/[?!.,;:()"']/g, '').trim()).filter(Boolean);
      vocabAssist = lookupVocabularyAssistance(words, vocabTargetLang, vocabScriptTarget);
    }

    const vocabEvidence: TranslationEvidence = {
      id: `ev-unsupp-${Date.now()}`,
      sourceType: 'vocabulary_bank',
      providerName: 'Vocabulary Glossary Assistance',
      verificationStatus: 'vocabulary_only',
      isOffline: true,
      internetRequired: false,
      matchCategory: 'vocabulary_lookup',
      targetScript: CENTRAL_LANGUAGES[targetLanguage]?.scriptName || 'Default',
      timestamp: Date.now(),
      notes: 'Full sentence translation is not available yet. Word-level assistance provided.'
    };

    const result = emptyResult(false, cap?.status || 'unavailable', errorMsg);
    result.vocabularyAssistance = vocabAssist?.length ? vocabAssist : undefined;
    result.evidence = vocabEvidence;
    return result;
  }

  // 6. Try sentence translation for supported pairs
  let finalOutput = '';
  let finalProvider = 'None';
  let finalMethod: 'neural' | 'dataset' | 'phrase_bank' | 'vocabulary_assistance' | 'none' = 'none';
  let finalTransliteration: string | undefined;
  let finalEvidence: TranslationEvidence | undefined;
  let isSuccess = false;

  // Step A: Translate complete block (preserves document context)
  const unifiedResult = await translateSegment(trimmed, sourceLanguage, targetLanguage, domain);
  if (unifiedResult && unifiedResult.text && unifiedResult.text.toLowerCase() !== trimmed.toLowerCase()) {
    finalOutput = unifiedResult.text.trim();
    finalProvider = unifiedResult.provider;
    finalMethod = unifiedResult.method;
    finalTransliteration = unifiedResult.transliteration;
    finalEvidence = unifiedResult.evidence;
    isSuccess = true;
  } else {
    // Step B: If unified translation failed (e.g. multi-line document), split by lines
    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    if (lines.length > 1) {
      const lineResults = await Promise.all(
        lines.map(line => translateSegment(line, sourceLanguage, targetLanguage, domain))
      );

      const successfulLines: string[] = [];
      const providerList: string[] = [];
      let successCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const res = lineResults[i];
        if (res && res.text && res.text.toLowerCase() !== lines[i].toLowerCase()) {
          successfulLines.push(res.text.trim());
          providerList.push(res.provider);
          if (!finalMethod || finalMethod === 'none') finalMethod = res.method;
          if (!finalEvidence && res.evidence) finalEvidence = res.evidence;
          successCount++;
        } else {
          successfulLines.push('');
        }
      }

      if (successCount > 0 && successCount >= Math.ceil(lines.length * 0.5)) {
        finalOutput = successfulLines.filter(Boolean).join('\n');
        finalProvider = Array.from(new Set(providerList)).join(', ');
        isSuccess = true;
      }
    }
  }

  let result: TranslationResult;

  if (isSuccess && finalOutput) {
    // Script adaptation if requested
    if (targetLanguage === 'santali' && options?.targetScript) {
      finalOutput = transliterateSantaliToScript(finalOutput, options.targetScript as any);
    }

    // Detect actual output script after script adaptation
    const scriptInfo = detectOutputScript(finalOutput);

    // C4: Determine reliability from the actual provider used (never fake verified for online)
    let reliability: TranslationStatus;
    if (finalMethod === 'neural') {
      reliability = 'experimental'; // Online neural bridge is experimental, NEVER verified dataset
    } else if (finalMethod === 'dataset' || finalMethod === 'phrase_bank') {
      reliability = 'dataset';
    } else {
      reliability = 'experimental';
    }

    result = {
      text: finalOutput,
      targetText: finalOutput,
      sourceText: trimmed,
      sourceLang: sourceLangCode3,
      targetLang: targetLangCode3,
      sourceLanguage,
      targetLanguage,
      tokensCount: trimmed.split(/\s+/).length,
      transliteration: finalTransliteration,
      success: true,
      reliability,
      provider: finalProvider,
      method: finalMethod,
      outputScript: scriptInfo.scriptName,
      evidence: finalEvidence,
      domain
    };
    translationCache.set(cacheKey, result);
  } else {
    const targetName = CENTRAL_LANGUAGES[targetLanguage]?.name || targetLanguage;
    const errorMsg = `No verified offline sentence translation available for this text.`;
    result = emptyResult(false, 'unavailable', errorMsg);

    // Word-level vocabulary assistance fallback
    const words = trimmed.split(/\s+/).map(w => w.replace(/[?!.,;:()"']/g, '').trim()).filter(Boolean);
    const vocabScriptTarget = (sourceLanguage === 'hindi') ? 'hindi' : 'english';
    let vocabAssist: { word: string; meaning: string }[] | undefined;

    if (targetLanguage === 'mundari' || targetLanguage === 'ho') {
      vocabAssist = lookupVocabularyAssistance(words, targetLanguage, vocabScriptTarget);
    } else if (targetLanguage === 'santali') {
      const satVocab: { word: string; meaning: string }[] = [];
      for (const w of words) {
        const item = lookupWord(w, sourceLanguage === 'hindi' ? 'hin' : 'eng');
        if (item) {
          satVocab.push({ word: w, meaning: item.sat });
        }
      }
      if (satVocab.length > 0) vocabAssist = satVocab;
    }

    if (vocabAssist && vocabAssist.length > 0) {
      result.vocabularyAssistance = vocabAssist;
      result.evidence = {
        id: `ev-vocab-${Date.now()}`,
        sourceType: 'vocabulary_bank',
        providerName: 'Local Vocabulary Assistance',
        verificationStatus: 'vocabulary_only',
        isOffline: true,
        internetRequired: false,
        matchCategory: 'vocabulary_lookup',
        targetScript: CENTRAL_LANGUAGES[targetLanguage]?.scriptName || 'Default',
        timestamp: Date.now(),
        notes: 'Sentence-level translation unavailable. Word-level vocabulary assistance provided.'
      };
    }
  }

  // Development debug log
  if (import.meta.env.DEV) {
    logTranslationDebug(
      sourceLanguage,
      targetLanguage,
      trimmed,
      result.provider,
      result.text || `(Error: ${result.error})`,
      result.success
    );
  }

  return result;
}


// Cached voice registry for cross-browser reliability
let cachedVoicesList: SpeechSynthesisVoice[] = [];

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const v = window.speechSynthesis.getVoices();
  if (v && v.length > 0) {
    cachedVoicesList = v;
  }
  return cachedVoicesList;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  getAvailableVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    getAvailableVoices();
  };
}

// Known common Santali Roman phrases
const KNOWN_ROMAN_PHRASES: Record<string, string> = {
  'ᱡᱚᱦᱟᱨ': 'Johar',
  'ᱥᱟᱱᱛᱟᱲᱤ': 'Santali',
  'ᱟᱢ ᱫᱚ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟ?': 'Am do ched leka menag-a?',
  'ᱟᱞᱮᱭᱟᱜ ᱟᱹᱛᱩ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾': 'Aleyag aatu re apeyag sagun daram',
  'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?': 'Amag nyutum ched?',
  'ᱤᱧ ᱫᱚ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ᱾': 'Inj do bes ge menanya',
  'ᱦᱟᱥᱯᱟᱛᱟᱞ ᱫᱚ ᱚᱠᱟᱨᱮ ᱢᱮᱱᱟᱜ-ᱟ?': 'Hospital do okare menag-a?',
  'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱢᱟᱭᱟᱢ ᱵᱤᱰᱟᱹᱣ': 'Sikil sel mayam bidaw',
  'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ': 'Sikil sel bidaw',
  'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ': 'Sagun daram',
  'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ': 'Sagun setag',
  'ᱥᱟᱹᱜᱩᱱ ᱧᱤᱫᱟᱹ': 'Sagun nyinda',
  'ᱥᱟᱨᱦᱟᱣ': 'Sarhaw',
  'ᱫᱟᱜ': 'Daag',
  'ᱵᱤᱨ': 'Bir',
  'ᱦᱮᱸ': 'Hen',
  'ᱵᱟᱝ': 'Bang'
};

/**
 * Transliterates Devanagari to Roman phonetics for systems lacking Hindi TTS
 */
function transliterateDevanagariToRoman(text: string): string {
  const devToRoman: Record<string, string> = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'sha', 'ष': 'sha', 'स': 'sa', 'ह': 'ha',
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
    'ं': 'n', 'ँ': 'n', '्': '', '।': '.', '॥': '.'
  };
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    result += devToRoman[ch] !== undefined ? devToRoman[ch] : ch;
  }
  return result;
}

export interface SpeechPlaybackInfo {
  engineType: 'native' | 'phonetic_indian' | 'browser_default' | 'audio_chime';
  label: string;
  isNative: boolean;
  notes: string;
  voiceName?: string;
}

/**
 * Returns honest linguistic and engine capabilities for speech playback.
 * Enforces zero-fabrication: Never misleads user that phonetic Indian TTS is a native tribal model.
 */
export function getSpeechEngineInfo(langCode: string): SpeechPlaybackInfo {
  const norm = normalizeToSupportedLanguage(langCode);
  if (norm === 'santali' || norm === 'mundari' || norm === 'ho') {
    return {
      engineType: 'phonetic_indian',
      label: 'Phonetic Pronunciation',
      isNative: false,
      notes: 'Native tribal voice model unavailable in browser speech engines — playing verified phonetic pronunciation via Indian English/Hindi voice.'
    };
  }
  if (norm === 'hindi') {
    return {
      engineType: 'native',
      label: 'Native Hindi Voice',
      isNative: true,
      notes: 'Synthesized using native Hindi speech synthesis.'
    };
  }
  return {
    engineType: 'native',
    label: 'Native English Voice',
    isNative: true,
    notes: 'Synthesized using native English speech synthesis.'
  };
}

/**
 * Text to Speech Synthesizer with verified Santali Roman pronunciations and multi-engine voice support.
 * Optimized for Mobile (iOS Safari & Android Chrome) + Desktop with universal phonetic fallback.
 * Uses robust 7-tier pronunciation hierarchy, sentence chunking, and speech queue.
 * 
 * Enforces TTS Honesty:
 * - When native tribal voice is absent, reports phonetic pronunciation via Indian voice.
 * - Infallible audio confirmation chime is NEVER falsely labeled as TTS.
 */
export function playTextSpeech(
  text: string,
  langCode: string,
  customRate: number = 0.9,
  onEnd?: () => void,
  onStatusChange?: (info: SpeechPlaybackInfo) => void
) {
  if (!text || !text.trim()) {
    onEnd?.();
    return;
  }

  // Report honest engine status to caller
  const engineInfo = getSpeechEngineInfo(langCode);
  const { voice } = VoiceQualityRouter.selectBestScoredVoice(langCode);
  if (voice) {
    engineInfo.voiceName = voice.name;
  }
  onStatusChange?.(engineInfo);

  // Dispatch through AI Voice Intelligence Orchestrator with context analysis & prosody planning
  VoiceIntelligenceEngine.synthesizeSpeech(text, langCode, {
    rate: customRate,
    onEnd: () => {
      onEnd?.();
    },
    onError: () => {
      onEnd?.();
    }
  });
}

/**
 * Global TTS Cancellation Facade
 */
export function stopTextSpeech(): void {
  VoiceIntelligenceEngine.stopSpeech();
}


/**
 * Web Audio API Acoustic Chime as infallible acoustic feedback
 */
function playChimeTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio context errors
  }
}

/**
 * OCR extraction for sample manuscripts & uploaded images
 */
import { ImageQualityReport, OCRDebugInfo } from './ocr/types';

export interface OCRResult {
  text: string;
  detectedLanguage: string;
  confidence: number;
  boundingBoxes: { x: number; y: number; w: number; h: number; text: string }[];
  qualityReport?: ImageQualityReport;
  preprocessingMethod?: string;
  warnings?: string[];
  debugInfo?: OCRDebugInfo;
  isCustomModelRequired?: boolean;
  unsupportedMessage?: string;
}

export async function processImageOCR(
  imageSrc: string,
  targetLangCode: string,
  onProgress?: (p: { status: string; progress: number }) => void,
  enableDebug: boolean = true,
  groundTruthText?: string
): Promise<OCRResult> {
  const { extractTextFromImage } = await import('./ocrService');
  const realRes = await extractTextFromImage(imageSrc, targetLangCode, onProgress, enableDebug, groundTruthText);

  return {
    text: realRes.text,
    detectedLanguage: realRes.detectedLanguage,
    confidence: realRes.confidence,
    boundingBoxes: realRes.lines.map((l, i) => ({
      x: 10,
      y: 20 + i * 30,
      w: 200,
      h: 24,
      text: l
    })),
    qualityReport: realRes.qualityReport,
    preprocessingMethod: realRes.preprocessingMethod,
    warnings: realRes.warnings,
    debugInfo: realRes.debugInfo,
    isCustomModelRequired: realRes.isCustomModelRequired,
    unsupportedMessage: realRes.unsupportedMessage
  };
}

