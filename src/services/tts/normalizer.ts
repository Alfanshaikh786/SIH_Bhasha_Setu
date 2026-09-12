/**
 * Bhasha Setu — Production TTS Text Normalization Layer
 *
 * Normalizes numbers, currencies, units, abbreviations, and punctuation
 * before phonetic expansion and synthesis.
 *
 * Medical & Field Safety Mandate:
 * - Never omit or alter numeric values or dosage units.
 * - Maintain exact semantic numbers and relationships.
 */

const SANTALI_DIGITS: Record<string, string> = {
  '᱐': '0', '᱑': '1', '᱒': '2', '᱓': '3', '᱔': '4',
  '᱕': '5', '᱖': '6', '᱗': '7', '᱘': '8', '᱙': '9'
};

const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

const SANTALI_NUM_WORDS: Record<number, string> = {
  0: 'sunya',
  1: 'mit',
  2: 'bar',
  3: 'pe',
  4: 'pon',
  5: 'more',
  6: 'turui',
  7: 'eae',
  8: 'iral',
  9: 'are',
  10: 'gel',
  20: 'bar gel',
  30: 'pe gel',
  40: 'pon gel',
  50: 'more gel',
  100: 'mit sae',
  1000: 'mit hajar'
};

const HINDI_NUM_WORDS: Record<number, string> = {
  0: 'शून्य', 1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पाँच',
  6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ', 10: 'दस',
  11: 'ग्यारह', 12: 'बारह', 13: 'तेरह', 14: 'चौदह', 15: 'पंद्रह',
  16: 'सोलह', 17: 'सत्रह', 18: 'अठारह', 19: 'उन्नीस', 20: 'बीस',
  30: 'तीस', 40: 'चालीस', 50: 'पचास', 60: 'साठ', 70: 'सत्तर',
  80: 'अस्सी', 90: 'नब्बे', 100: 'सौ', 1000: 'हज़ार'
};

const ENGLISH_NUM_WORDS: Record<number, string> = {
  0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
  6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
  11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
  16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
  30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy',
  80: 'eighty', 90: 'ninety', 100: 'hundred', 1000: 'thousand'
};

/**
 * Normalizes all native script numerals (Ol Chiki, Devanagari) to ASCII digits.
 */
export function normalizeNumeralsToAscii(text: string): string {
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (SANTALI_DIGITS[ch] !== undefined) {
      res += SANTALI_DIGITS[ch];
    } else if (DEVANAGARI_DIGITS[ch] !== undefined) {
      res += DEVANAGARI_DIGITS[ch];
    } else {
      res += ch;
    }
  }
  return res;
}

/**
 * Expands small integers (0-100) into spoken words if appropriate,
 * preserving exact clinical precision.
 */
export function numberToSpokenWords(num: number, langCode: string): string {
  if (num < 0 || num > 99999) return String(num);

  const lang = langCode.toLowerCase().trim();
  if (lang === 'sat' || lang === 'santali') {
    if (SANTALI_NUM_WORDS[num]) return SANTALI_NUM_WORDS[num];
    if (num < 20) return `${SANTALI_NUM_WORDS[10]} ${SANTALI_NUM_WORDS[num - 10]}`;
    if (num < 100) {
      const tens = Math.floor(num / 10) * 10;
      const rem = num % 10;
      return rem === 0 ? SANTALI_NUM_WORDS[tens] : `${SANTALI_NUM_WORDS[tens]} ${SANTALI_NUM_WORDS[rem]}`;
    }
  } else if (lang === 'hin' || lang === 'hindi') {
    if (HINDI_NUM_WORDS[num]) return HINDI_NUM_WORDS[num];
    if (num < 100) {
      const tens = Math.floor(num / 10) * 10;
      const rem = num % 10;
      return `${HINDI_NUM_WORDS[tens] || tens} ${HINDI_NUM_WORDS[rem] || rem}`;
    }
  } else {
    if (ENGLISH_NUM_WORDS[num]) return ENGLISH_NUM_WORDS[num];
    if (num < 100) {
      const tens = Math.floor(num / 10) * 10;
      const rem = num % 10;
      return `${ENGLISH_NUM_WORDS[tens] || tens}-${ENGLISH_NUM_WORDS[rem] || rem}`;
    }
  }
  return String(num);
}

/**
 * Expands units of measurement to avoid unnatural TTS pronunciation.
 */
function expandUnits(text: string, langCode: string): string {
  const isHindi = langCode === 'hin' || langCode === 'hindi';
  const isSantali = langCode === 'sat' || langCode === 'santali';

  return text
    .replace(/(\d+)\s*mg\b/gi, (_, n) => `${n} ${isHindi ? 'मिलीग्राम' : 'milligram'}`)
    .replace(/(\d+)\s*ml\b/gi, (_, n) => `${n} ${isHindi ? 'मिलीलीटर' : 'milliliter'}`)
    .replace(/(\d+)\s*kg\b/gi, (_, n) => `${n} ${isHindi ? 'किलोग्राम' : isSantali ? 'kilogram' : 'kilogram'}`)
    .replace(/(\d+)\s*g\b/gi, (_, n) => `${n} ${isHindi ? 'ग्राम' : 'gram'}`)
    .replace(/(\d+)\s*km\b/gi, (_, n) => `${n} ${isHindi ? 'किलोमीटर' : 'kilometer'}`)
    .replace(/(\d+)\s*cm\b/gi, (_, n) => `${n} ${isHindi ? 'सेंटीमीटर' : 'centimeter'}`)
    .replace(/(\d+)\s*mm\b/gi, (_, n) => `${n} ${isHindi ? 'मिलीमीटर' : 'millimeter'}`)
    .replace(/(\d+)\s*m\b/gi, (_, n) => `${n} ${isHindi ? 'मीटर' : 'meter'}`)
    .replace(/(\d+)\s*l\b/gi, (_, n) => `${n} ${isHindi ? 'लीटर' : 'liter'}`)
    .replace(/(\d+)\s*°\s*c\b/gi, (_, n) => `${n} ${isHindi ? 'डिग्री सेल्सियस' : 'degrees celsius'}`)
    .replace(/(\d+)\s*tab(s)?\b/gi, (_, n) => `${n} ${isHindi ? 'गोली' : 'tablet'}`);
}

/**
 * Normalizes Indian and international currency expressions.
 */
function expandCurrency(text: string, langCode: string): string {
  const isHindi = langCode === 'hin' || langCode === 'hindi';
  const isSantali = langCode === 'sat' || langCode === 'santali';

  return text
    .replace(/₹\s*(\d+(\.\d+)?)/g, (_, n) => `${n} ${isHindi ? 'रुपये' : isSantali ? 'taka' : 'rupees'}`)
    .replace(/\bRs\.?\s*(\d+(\.\d+)?)/gi, (_, n) => `${n} ${isHindi ? 'रुपये' : isSantali ? 'taka' : 'rupees'}`)
    .replace(/\bINR\s*(\d+(\.\d+)?)/gi, (_, n) => `${n} ${isHindi ? 'रुपये' : isSantali ? 'taka' : 'rupees'}`);
}

/**
 * Normalizes common healthcare, government, and field acronyms.
 */
function expandAbbreviations(text: string, langCode: string): string {
  const isHindi = langCode === 'hin' || langCode === 'hindi';

  return text
    .replace(/\bDr\.\s*/gi, isHindi ? 'डॉक्टर ' : 'Doctor ')
    .replace(/\bDr\b/g, isHindi ? 'डॉक्टर' : 'Doctor')
    .replace(/\bASHA\b/g, 'Asha')
    .replace(/\bWHO\b/g, isHindi ? 'डब्ल्यू एच ओ' : 'W H O')
    .replace(/\bOPD\b/g, 'O P D')
    .replace(/\bPHC\b/g, 'P H C')
    .replace(/\bCHC\b/g, 'C H C')
    .replace(/\bANM\b/g, 'A N M')
    .replace(/\bANC\b/g, isHindi ? 'ए एन सी' : 'A N C')
    .replace(/\bPNC\b/g, isHindi ? 'पी एन सी' : 'P N C')
    .replace(/\bHb\b/g, isHindi ? 'हीमोग्लोबिन' : 'Hemoglobin');
}

/**
 * Cleans excessive and repeated punctuation while maintaining prosody boundaries.
 */
function normalizePunctuation(text: string): string {
  return text
    .replace(/\.{2,}/g, '.')
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    .replace(/-{2,}/g, ' ')
    .replace(/_{2,}/g, ' ')
    .replace(/[•*#~^]+/g, ' ')
    .replace(/᱿+/g, ' ᱿ ')
    .replace(/᱾+/g, ' ᱾ ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main Normalization Pipeline Entry Point
 *
 * Safe for medical, educational, and field operation.
 */
export function normalizeTextForSpeech(text: string, langCode: string = 'sat'): string {
  if (!text || !text.trim()) return '';

  let normalized = text.trim();

  // 1. Remove number grouping commas (e.g. 1,000 -> 1000, 10,000 -> 10000)
  normalized = normalized.replace(/\b(\d{1,3}(?:,\d{2,3})+)\b/g, m => m.replace(/,/g, ''));

  // 2. Convert native numerals to standard ASCII
  normalized = normalizeNumeralsToAscii(normalized);

  // 3. Expand Currency
  normalized = expandCurrency(normalized, langCode);

  // 4. Expand Clinical & Field Units
  normalized = expandUnits(normalized, langCode);

  // 5. Expand Field Abbreviations
  normalized = expandAbbreviations(normalized, langCode);

  // 6. Clean Punctuation
  normalized = normalizePunctuation(normalized);

  return normalized;
}
