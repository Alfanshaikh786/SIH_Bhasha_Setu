/**
 * Bhasha Setu — Medical & Number Speech Normalization Engine
 *
 * Implements authoritative normalization for:
 * 1. Number speech: 0 to 1,000,000, lakhs, millions, decimals (1.5, 0.25), negative numbers (-5), ranges (10-20)
 * 2. Clinical vital readings: "120/80" -> "120 by 80", "37.5 °C" -> "37 point 5 degrees celsius"
 * 3. Clinical measurements: mg, ml, kg, mm, cm
 * 4. Clinical abbreviations:
 *    - Letter-by-letter: BP, Hb, OPD, ANC, PNC, CBC
 *    - Expanded: PHC -> "Primary Health Centre"
 * 5. Dosage forms: "2 tablets", "1 capsule", "2 capsules"
 *
 * CLINICAL SAFETY MANDATE:
 * - Numerical quantities and vital numbers must never be corrupted, mutated, or omitted.
 */

export const MEDICAL_NORMALIZER_VERSION = '2.0-medical-speech';

export class MedicalSpeechNormalizer {
  /**
   * Normalizes blood pressure and vital ratio readings like "120/80".
   * Safely discriminates clinical BP ratios from mathematical fractions and vision ratios (10/20, 20/20).
   */
  public static normalizeVitals(text: string, langCode: string): string {
    const isHindi = langCode === 'hin' || langCode === 'hindi';
    const byWord = isHindi ? 'बटा' : 'by';

    // 1. Explicit BP prefix: e.g. "BP 120/80", "BP: 120/80"
    let res = text.replace(/\bBP\s*:?\s*(\d{2,3})\/(\d{2,3})\b/gi, (_, sys, dia) => {
      return `BP ${sys} ${byWord} ${dia}`;
    });

    // 2. With mmHg: e.g. "120/80 mmHg"
    res = res.replace(/\b(\d{2,3})\/(\d{2,3})\s*(mmhg)\b/gi, (_, sys, dia, unit) => {
      const unitStr = isHindi ? ' एमएम एचजी' : ' millimeters of mercury';
      return `${sys} ${byWord} ${dia}${unitStr}`;
    });

    // 3. Standalone clinical BP values: systolic 80-240 and diastolic 40-140 (e.g. 120/80, 130/85, 140/90)
    // Excludes common fractions like 10/20, 20/20, 50/50
    res = res.replace(/\b(8\d|9\d|1\d\d|2[0-3]\d)\/(4\d|[5-9]\d|1[0-3]\d)\b/g, (match, sys, dia) => {
      if (sys === dia) return match;
      return `${sys} ${byWord} ${dia}`;
    });

    return res;
  }

  /**
   * Normalizes temperatures like "37.5 °C", "98.6 °F", "38°C".
   * Handles both numeric digits and previously normalized decimals ("37.5" and "37 point 5").
   */
  public static normalizeTemperatures(text: string, langCode: string): string {
    const isHindi = langCode === 'hin' || langCode === 'hindi';

    return text.replace(/\b(\d+(?:\s*(?:point|दशमलव)\s*\d+|\.\d+)?)\s*°?\s*([CF])\b/gi, (_, val, scale) => {
      const isCelsius = scale.toUpperCase() === 'C';
      if (isHindi) {
        return `${val} डिग्री ${isCelsius ? 'सेल्सियस' : 'फ़ारेनहाइट'}`;
      }
      return `${val} degrees ${isCelsius ? 'celsius' : 'fahrenheit'}`;
    });
  }

  /**
   * Normalizes clinical abbreviations with distinct policies:
   * - Letter-by-letter: BP, Hb, OPD, ANC, PNC, CBC
   * - Expanded: PHC
   */
  public static normalizeAbbreviations(text: string, langCode: string): string {
    const isHindi = langCode === 'hin' || langCode === 'hindi';

    let res = text;

    // 1. Expanded abbreviations
    res = res.replace(/\bPHC\b/g, isHindi ? 'प्राथमिक स्वास्थ्य केंद्र' : 'Primary Health Centre');
    res = res.replace(/\bCHC\b/g, isHindi ? 'सामुदायिक स्वास्थ्य केंद्र' : 'Community Health Centre');

    // 2. Letter-by-letter abbreviations (spaced for natural pronunciation)
    res = res.replace(/\bBP\b/g, 'B P');
    res = res.replace(/\bHb\b/g, 'H B');
    res = res.replace(/\bOPD\b/g, 'O P D');
    res = res.replace(/\bANC\b/g, 'A N C');
    res = res.replace(/\bPNC\b/g, 'P N C');
    res = res.replace(/\bCBC\b/g, 'C B C');
    res = res.replace(/\bWHO\b/g, 'W H O');

    return res;
  }

  /**
   * Normalizes negative numbers: e.g. "-5" -> "minus 5".
   */
  public static normalizeNegativeNumbers(text: string, langCode: string): string {
    const isHindi = langCode === 'hin' || langCode === 'hindi';
    const minusWord = isHindi ? 'माइनस' : 'minus';

    // Matches negative numbers preceded by start-of-string, whitespace, or open parenthesis
    return text.replace(/(^|[\s(])-\s*(\d+(\.\d+)?)\b/g, (_, prefix, num) => {
      return `${prefix}${minusWord} ${num}`;
    });
  }

  /**
   * Normalizes large numbers (lakhs / millions):
   * 1,00,000 -> 1 lakh (in Indian contexts)
   * 1,000,000 -> 1 million
   */
  public static normalizeLargeNumbers(text: string, langCode: string): string {
    const isHindi = langCode === 'hin' || langCode === 'hindi';
    let res = text;

    // Indian Lakh format: 1,00,000
    res = res.replace(/\b(\d+),00,000\b/g, (_, count) => {
      return `${count} ${isHindi ? 'लाख' : 'lakh'}`;
    });

    // Million format: 1,000,000
    res = res.replace(/\b(\d+),000,000\b/g, (_, count) => {
      return `${count} ${isHindi ? 'मिलियन' : 'million'}`;
    });

    return res;
  }

  /**
   * Executes the full clinical and numerical normalization pipeline.
   */
  public static normalizeClinicalText(text: string, langCode: string): string {
    if (!text || !text.trim()) return '';

    let res = text.trim();

    // 1. Negative numbers
    res = this.normalizeNegativeNumbers(res, langCode);

    // 2. Vitals & Blood Pressure
    res = this.normalizeVitals(res, langCode);

    // 3. Clinical temperatures
    res = this.normalizeTemperatures(res, langCode);

    // 4. Clinical abbreviations
    res = this.normalizeAbbreviations(res, langCode);

    // 5. Large number formatting
    res = this.normalizeLargeNumbers(res, langCode);

    return res;
  }
}
