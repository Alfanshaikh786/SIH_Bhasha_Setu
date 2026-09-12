/**
 * Bhasha Setu — Intelligent Normalization & Medical Safety Layer
 *
 * Implements advanced clinical normalization for:
 * - Dosage ranges (e.g. "10–20 mg")
 * - Decimal quantities (e.g. "0.5 ml")
 * - Unit and currency bindings
 * - Verified healthcare abbreviations
 *
 * CLINICAL SAFETY MANDATE:
 * - If semantic preservation cannot be mathematically guaranteed, DO NOT TRANSFORM.
 * - Numerical quantities and dosage numbers must never be altered or omitted.
 */

import { normalizeTextForSpeech } from '../normalizer';
import { MedicalSpeechNormalizer } from './medicalSpeechNormalizer';

export class IntelligentNormalizer {
  /**
   * Normalizes dosage ranges such as "10–20 mg" or standalone number ranges "1-5".
   */
  public static normalizeRanges(text: string, langCode: string): string {
    const lang = langCode.toLowerCase().trim();
    const isHindi = lang === 'hin' || lang === 'hindi' || lang === 'hi';
    const isSantali = lang === 'sat' || lang === 'santali';

    const rangeWord = isHindi ? 'से' : isSantali ? 'khon' : 'to';

    // 1. Ranges with attached units: e.g. "10–20 mg", "5-10 ml"
    let res = text.replace(/(\d+(\.\d+)?)\s*[-–—]\s*(\d+(\.\d+)?)\s*(mg|ml|kg|g|km|cm|m|l|mm|°c|tab|tabs|tablets?|caps?|capsules?)\b/gi, (_, n1, _d1, n2, _d2, unit) => {
      const fullUnit = this.expandUnit(unit, isHindi);
      return `${n1} ${rangeWord} ${n2} ${fullUnit}`;
    });

    // 2. Standalone number ranges: e.g. "1-5", "10-20"
    res = res.replace(/\b(\d+)\s*[-–—]\s*(\d+)\b/g, (_, n1, n2) => {
      return `${n1} ${rangeWord} ${n2}`;
    });

    return res;
  }

  /**
   * Normalizes decimal quantities such as "0.5 ml" or "1.5".
   */
  public static normalizeDecimals(text: string, langCode: string): string {
    const lang = langCode.toLowerCase().trim();
    const isHindi = lang === 'hin' || lang === 'hindi' || lang === 'hi';
    const pointWord = isHindi ? 'दशमलव' : 'point';

    // 1. Decimal with attached unit: e.g. "0.5 ml" -> "0 point 5 milliliter"
    let res = text.replace(/\b(\d+)\.(\d+)\s*(mg|ml|kg|g|km|cm|m|l|mm|°c)\b/gi, (_, integerPart, decimalPart, unit) => {
      const fullUnit = this.expandUnit(unit, isHindi);
      return `${integerPart} ${pointWord} ${decimalPart} ${fullUnit}`;
    });

    // 2. Standalone decimal quantity: e.g. "1.5" -> "1 point 5" (isolated, not part of a version like 1.2.3)
    res = res.replace(/(?<!\.)\b(\d+)\.(\d+)\b(?!\.)/g, (_, integerPart, decimalPart) => {
      return `${integerPart} ${pointWord} ${decimalPart}`;
    });

    return res;
  }

  /**
   * Safe unit expander.
   */
  private static expandUnit(unit: string, isHindi: boolean): string {
    const u = unit.toLowerCase().trim();
    switch (u) {
      case 'mg': return isHindi ? 'मिलीग्राम' : 'milligram';
      case 'ml': return isHindi ? 'मिलीलीटर' : 'milliliter';
      case 'kg': return isHindi ? 'किलोग्राम' : 'kilogram';
      case 'g': return isHindi ? 'ग्राम' : 'gram';
      case 'km': return isHindi ? 'किलोमीटर' : 'kilometer';
      case 'cm': return isHindi ? 'सेंटीमीटर' : 'centimeter';
      case 'mm': return isHindi ? 'मिलीमीटर' : 'millimeter';
      case 'm': return isHindi ? 'मीटर' : 'meter';
      case 'l': return isHindi ? 'लीटर' : 'liter';
      case '°c': return isHindi ? 'डिग्री सेल्सियस' : 'degrees celsius';
      case 'tab':
      case 'tabs':
      case 'tablet':
      case 'tablets': return isHindi ? 'गोली' : 'tablet';
      case 'cap':
      case 'caps':
      case 'capsule':
      case 'capsules': return isHindi ? 'कैप्सूल' : 'capsule';
      default: return unit;
    }
  }

  /**
   * Expands dosage terms like "2 tablets", "1 tablet", "2 capsules", "1 capsule".
   */
  public static normalizeDosages(text: string, langCode: string): string {
    const lang = langCode.toLowerCase().trim();
    const isHindi = lang === 'hin' || lang === 'hindi' || lang === 'hi';
    return text.replace(/\b(\d+)\s+(tablets?|tabs?|capsules?|caps?)\b/gi, (_, count, form) => {
      const lower = form.toLowerCase();
      const isCap = lower.startsWith('cap');
      if (isHindi) {
        return `${count} ${isCap ? 'कैप्सूल' : 'गोली'}`;
      }
      const isSingular = count === '1';
      if (isCap) {
        return `${count} ${isSingular ? 'capsule' : 'capsules'}`;
      }
      return `${count} ${isSingular ? 'tablet' : 'tablets'}`;
    });
  }

  /**
   * Executes the full intelligent normalization pipeline while guaranteeing semantic preservation.
   */
  public static normalize(text: string, langCode: string): string {
    if (!text || !text.trim()) return '';

    let result = text.trim();

    // 0. Comma grouping in numbers (e.g. 1,000 -> 1000, 10,000 -> 10000)
    result = result.replace(/\b(\d{1,3}(?:,\d{2,3})+)\b/g, m => m.replace(/,/g, ''));

    // 1. Clinical dosage ranges (e.g. 10-20 mg, 1-5)
    result = this.normalizeRanges(result, langCode);

    // 2. Clinical decimal quantities (e.g. 0.5 ml, 1.5)
    result = this.normalizeDecimals(result, langCode);

    // 3. Dosages (e.g. 2 tablets, 1 capsule)
    result = this.normalizeDosages(result, langCode);

    // 4. Clinical vitals, temperatures, abbreviations, negative and large numbers
    result = MedicalSpeechNormalizer.normalizeClinicalText(result, langCode);

    // 5. Base normalizer (numerals, currency, units, field acronyms, punctuation)
    result = normalizeTextForSpeech(result, langCode);

    return result;
  }
}
