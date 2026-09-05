/**
 * Central Language Definitions & Normalization for Bhasha Setu
 *
 * Supported Languages:
 * - English
 * - Hindi
 * - Santali
 * - Mundari
 * - Ho
 *
 * Note: Latin, Devanagari, Ol Chiki, Warang Chiti are SCRIPTS, not languages.
 */

export type SupportedLanguage = 'english' | 'hindi' | 'santali' | 'mundari' | 'ho';

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  nativeName: string;
  code: string;       // 3-letter ISO code: 'eng', 'hin', 'sat', 'unr', 'hoc'
  iso2Code: string;   // 2-letter ISO code: 'en', 'hi', 'sat', 'unr', 'hoc'
  flag: string;
  badge: string;
  isTribal: boolean;
  scriptName: string;
}

export const LANGUAGES = {
  english: {
    name: "English",
    code: "en"
  },
  hindi: {
    name: "Hindi",
    code: "hi"
  },
  santali: {
    name: "Santali",
    code: "sat"
  },
  mundari: {
    name: "Mundari",
    code: "unr"
  },
  ho: {
    name: "Ho",
    code: "hoc"
  }
};

export function getLanguageCode(language: SupportedLanguage): string {
  return LANGUAGES[language]?.code || 'en';
}

export const CENTRAL_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  english: {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    code: 'eng',
    iso2Code: 'en',
    flag: '🇬🇧',
    badge: 'EN',
    isTribal: false,
    scriptName: 'Latin'
  },
  hindi: {
    id: 'hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    code: 'hin',
    iso2Code: 'hi',
    flag: '🇮🇳',
    badge: 'HI',
    isTribal: false,
    scriptName: 'Devanagari'
  },
  santali: {
    id: 'santali',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    code: 'sat',
    iso2Code: 'sat',
    flag: '🌿',
    badge: 'ᱥᱟ',
    isTribal: true,
    scriptName: 'Ol Chiki'
  },
  mundari: {
    id: 'mundari',
    name: 'Mundari',
    nativeName: 'ᱢᱩᱱᱰᱟᱨᱤ',
    code: 'unr',
    iso2Code: 'unr',
    flag: '🌿',
    badge: 'मु',
    isTribal: true,
    scriptName: 'Mundari Bani / Devanagari'
  },
  ho: {
    id: 'ho',
    name: 'Ho',
    nativeName: '𑢹𑣉𑣉 / हो',
    code: 'hoc',
    iso2Code: 'hoc',
    flag: '🌿',
    badge: 'हो',
    isTribal: true,
    scriptName: 'Warang Chiti / Devanagari'
  }
};

export const SUPPORTED_LANGUAGE_LIST: LanguageInfo[] = [
  CENTRAL_LANGUAGES.english,
  CENTRAL_LANGUAGES.hindi,
  CENTRAL_LANGUAGES.santali,
  CENTRAL_LANGUAGES.mundari,
  CENTRAL_LANGUAGES.ho
];

/**
 * Normalizes any language code, ID, or script name to a verified SupportedLanguage
 */
export function normalizeToSupportedLanguage(input: string): SupportedLanguage {
  if (!input) return 'english';
  const clean = input.trim().toLowerCase();

  switch (clean) {
    case 'en':
    case 'eng':
    case 'english':
    case 'latin':
    case 'roman':
    case 'romanized':
      return 'english';

    case 'hi':
    case 'hin':
    case 'hindi':
    case 'devanagari':
    case 'bhi':
    case 'bhili':
    case 'gon':
    case 'gondi':
      return 'hindi';

    case 'sat':
    case 'santali':
    case 'santhali':
    case 'ol_chiki':
    case 'ol chiki':
      return 'santali';

    case 'unr':
    case 'mundari':
    case 'munda':
      return 'mundari';

    case 'hoc':
    case 'ho':
    case 'warang_chiti':
    case 'warang chiti':
      return 'ho';

    default:
      return 'english';
  }
}

/**
 * Map detected OCR script to primary expected Language
 */
export function mapScriptToLanguage(scriptNameOrCode: string): SupportedLanguage {
  const clean = (scriptNameOrCode || '').toLowerCase();
  if (clean.includes('ol_chiki') || clean.includes('chiki') || clean.includes('sat')) {
    return 'santali';
  }
  if (clean.includes('devanagari') || clean.includes('hin') || clean.includes('hindi')) {
    return 'hindi';
  }
  if (clean.includes('warang') || clean.includes('hoc') || clean.includes('ho')) {
    return 'ho';
  }
  if (clean.includes('mundari') || clean.includes('unr')) {
    return 'mundari';
  }
  return 'english';
}

/**
 * Get standard 3-letter code used in SQLite and datasets ('eng', 'hin', 'sat', 'unr', 'hoc')
 */
export function getLanguageCode3(lang: SupportedLanguage): string {
  return CENTRAL_LANGUAGES[lang]?.code || 'eng';
}

/**
 * Get 2-letter ISO code for external translation APIs ('en', 'hi', 'sat', 'unr', 'hoc')
 */
export function getLanguageCode2(lang: SupportedLanguage): string {
  return CENTRAL_LANGUAGES[lang]?.iso2Code || 'en';
}
