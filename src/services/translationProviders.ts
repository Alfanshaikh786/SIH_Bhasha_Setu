/**
 * Translation Provider Layer for Bhasha Setu (भाषा | SETU)
 * 
 * Formalized provider abstraction:
 * 
 * TranslationProvider (Interface)
 * ├── PhraseBankProvider
 * ├── LocalDatabaseProvider (SQLite WASM translations.db)
 * ├── SantaliDatasetProvider (In-memory 6,780 verified entries)
 * ├── OnDeviceModelProvider (Future-ready edge model interface)
 * └── OnlineProvider (Capability-gated, timeout-protected, offline-aware)
 */

import { SupportedLanguage, CENTRAL_LANGUAGES, getLanguageCode3, getLanguageCode2 } from './languageService';
import { TranslationEvidence } from './translationEvidence';
import { getCapability, detectOutputScript } from './translationCapabilities';
import { findSantaliMatch, lookupExactDatasetEntry } from '../data/santaliDataset';
import { queryTranslationFromDb } from './sqliteService';

export interface ProviderTranslationResult {
  text: string;
  provider: string;
  method: 'neural' | 'dataset' | 'phrase_bank' | 'vocabulary_assistance' | 'none';
  transliteration?: string;
  evidence: TranslationEvidence;
}

export interface ITranslationProvider {
  id: string;
  name: string;
  isOffline: boolean;
  isAvailable(sourceLang: SupportedLanguage, targetLang: SupportedLanguage): Promise<boolean> | boolean;
  translate(
    text: string,
    sourceLang: SupportedLanguage,
    targetLang: SupportedLanguage,
    options?: { domain?: string; targetScript?: string }
  ): Promise<ProviderTranslationResult | null>;
}

// -------------------------------------------------------------
// 1. Phrase Bank Provider (In-Memory Colloquial Parallel Corpus)
// -------------------------------------------------------------
export class PhraseBankProvider implements ITranslationProvider {
  id = 'phrase_bank';
  name = 'Bilingual Phrase Bank';
  isOffline = true;

  constructor(private phraseMap: Record<string, Record<string, string>>) {}

  isAvailable(): boolean {
    return true;
  }

  translate(
    text: string,
    sourceLang: SupportedLanguage,
    targetLang: SupportedLanguage,
    options?: { domain?: string }
  ): Promise<ProviderTranslationResult | null> {
    const trimmed = text.trim();
    const tgtCode3 = getLanguageCode3(targetLang);
    const lower = trimmed.toLowerCase().replace(/[?!.,;]/g, '').trim();

    if (this.phraseMap[lower] && this.phraseMap[lower][tgtCode3]) {
      const textOut = this.phraseMap[lower][tgtCode3];
      return Promise.resolve({
        text: textOut,
        provider: this.name,
        method: 'phrase_bank',
        evidence: {
          id: `ev-pb-${Date.now()}`,
          sourceType: 'phrase_bank',
          providerName: this.name,
          verificationStatus: 'verified',
          isOffline: true,
          internetRequired: false,
          domain: options?.domain || 'General Conversation',
          matchCategory: 'exact_phrase',
          targetScript: CENTRAL_LANGUAGES[targetLang]?.scriptName || 'Default',
          timestamp: Date.now(),
          notes: 'Retrieved from verified local in-memory phrase bank.'
        }
      });
    }

    return Promise.resolve(null);
  }
}

// -------------------------------------------------------------
// 2. Local SQLite WASM Database Provider (translations.db - 6,780 entries)
// -------------------------------------------------------------
export class LocalDatabaseProvider implements ITranslationProvider {
  id = 'sqlite_wasm';
  name = 'Classroom SQLite Dataset (translations.db)';
  isOffline = true;

  isAvailable(): boolean {
    return true;
  }

  async translate(
    text: string,
    sourceLang: SupportedLanguage,
    targetLang: SupportedLanguage,
    options?: { domain?: string }
  ): Promise<ProviderTranslationResult | null> {
    const trimmed = text.trim();
    const srcCode3 = getLanguageCode3(sourceLang);
    const tgtCode3 = getLanguageCode3(targetLang);

    try {
      const dbMatch = await queryTranslationFromDb(trimmed, srcCode3, tgtCode3);
      if (dbMatch && dbMatch.targetText && dbMatch.targetText.trim() && dbMatch.targetText.toLowerCase() !== trimmed.toLowerCase()) {
        return {
          text: dbMatch.targetText,
          provider: this.name,
          method: 'dataset',
          transliteration: dbMatch.roman,
          evidence: {
            id: `ev-sql-${dbMatch.row?.id || Date.now()}`,
            sourceType: 'sqlite_wasm',
            providerName: this.name,
            verificationStatus: 'verified',
            isOffline: true,
            internetRequired: false,
            datasetRowId: dbMatch.row?.id,
            domain: dbMatch.row?.category || options?.domain || 'Classroom',
            matchCategory: dbMatch.confidence >= 0.98 ? 'exact_phrase' : 'normalized_exact',
            targetScript: targetLang === 'santali' ? 'Ol Chiki' : CENTRAL_LANGUAGES[targetLang]?.scriptName || 'Default',
            transliteration: dbMatch.roman,
            timestamp: Date.now(),
            notes: `Row #${dbMatch.row?.id || 'N/A'} from verified 6,780-entry offline database.`
          }
        };
      }
    } catch (e) {
      console.warn('[LocalDatabaseProvider] Query failed:', e);
    }

    return null;
  }
}

// -------------------------------------------------------------
// 3. Santali Dataset Provider (In-Memory 6,780 Entries with O(1) Lookup)
// -------------------------------------------------------------
export class SantaliDatasetProvider implements ITranslationProvider {
  id = 'santali_dataset';
  name = 'Santali Linguistic Dataset (6,780 entries)';
  isOffline = true;

  isAvailable(sourceLang: SupportedLanguage, targetLang: SupportedLanguage): boolean {
    return sourceLang === 'santali' || targetLang === 'santali' || sourceLang === 'english' || sourceLang === 'hindi';
  }

  translate(
    text: string,
    sourceLang: SupportedLanguage,
    targetLang: SupportedLanguage,
    options?: { domain?: string }
  ): Promise<ProviderTranslationResult | null> {
    const trimmed = text.trim();
    const srcCode3 = getLanguageCode3(sourceLang);
    const tgtCode3 = getLanguageCode3(targetLang);

    // Try O(1) exact hash map lookup first
    const exact = lookupExactDatasetEntry(trimmed);
    if (exact) {
      let resultText = '';
      if (tgtCode3 === 'sat') {
        resultText = exact.sat; // Pure Ol Chiki canonical output (never inject Roman in parentheses)
      } else if (tgtCode3 === 'hin') {
        resultText = exact.hi;
      } else if (tgtCode3 === 'eng') {
        resultText = exact.en;
      }

      if (resultText && resultText.toLowerCase() !== trimmed.toLowerCase()) {
        return Promise.resolve({
          text: resultText,
          provider: this.name,
          method: 'dataset',
          transliteration: exact.roman,
          evidence: {
            id: `ev-ds-${exact.id}`,
            sourceType: 'local_dataset',
            providerName: this.name,
            verificationStatus: 'verified',
            isOffline: true,
            internetRequired: false,
            datasetRowId: exact.id,
            domain: exact.cat || options?.domain || 'General',
            matchCategory: 'exact_phrase',
            targetScript: targetLang === 'santali' ? 'Ol Chiki' : CENTRAL_LANGUAGES[targetLang]?.scriptName || 'Default',
            transliteration: exact.roman,
            timestamp: Date.now(),
            notes: `Entry #${exact.id} from curated 6,780-entry parallel corpus.`
          }
        });
      }
    }

    // Try normalized match with domain weighting (strict confidence >= 0.95 required to prevent loose fuzzy match)
    const lookupLang = (srcCode3 === 'hin' ? 'hin' : srcCode3 === 'sat' ? 'sat' : 'eng') as 'eng' | 'hin' | 'sat';
    const matchResult = findSantaliMatch(trimmed, lookupLang, { domain: options?.domain });
    if (matchResult && matchResult.match && matchResult.confidence >= 0.95) {
      const santaliMatch = matchResult.match;
      let resultText = '';
      if (tgtCode3 === 'sat') {
        resultText = santaliMatch.sat; // Pure Ol Chiki canonical output
      } else if (tgtCode3 === 'hin') {
        resultText = santaliMatch.hi;
      } else if (tgtCode3 === 'eng') {
        resultText = santaliMatch.en;
      }

      if (resultText && resultText.toLowerCase() !== trimmed.toLowerCase()) {
        return Promise.resolve({
          text: resultText,
          provider: this.name,
          method: 'dataset',
          transliteration: santaliMatch.roman,
          evidence: {
            id: `ev-ds-${santaliMatch.id}`,
            sourceType: 'local_dataset',
            providerName: this.name,
            verificationStatus: 'verified',
            isOffline: true,
            internetRequired: false,
            datasetRowId: santaliMatch.id,
            domain: santaliMatch.cat || options?.domain || 'General',
            matchCategory: matchResult.confidence >= 0.98 ? 'exact_phrase' : 'normalized_exact',
            targetScript: targetLang === 'santali' ? 'Ol Chiki' : CENTRAL_LANGUAGES[targetLang]?.scriptName || 'Default',
            transliteration: santaliMatch.roman,
            timestamp: Date.now(),
            notes: `Entry #${santaliMatch.id} from curated parallel corpus.`
          }
        });
      }
    }

    return Promise.resolve(null);
  }
}

// -------------------------------------------------------------
// 4. On-Device Model Provider (Future-Ready Interface for ONNX / Edge Models)
// -------------------------------------------------------------
export class OnDeviceModelProvider implements ITranslationProvider {
  id = 'on_device_model';
  name = 'On-Device Edge Neural Engine (ONNX / LiteRT)';
  isOffline = true;

  // Currently waiting for custom edge quantized weights
  isAvailable(_sourceLang?: SupportedLanguage, _targetLang?: SupportedLanguage): boolean {
    return false;
  }

  getModelStatus(sourceLang: SupportedLanguage, targetLang: SupportedLanguage): {
    status: 'not_installed' | 'training' | 'ready';
    description: string;
  } {
    if (targetLang === 'mundari' || targetLang === 'ho') {
      return {
        status: 'training',
        description: `Custom edge ONNX model for ${CENTRAL_LANGUAGES[targetLang]?.name} is currently in architecture preparation. Full sentence translation will be enabled when weights are deployed.`
      };
    }
    return {
      status: 'not_installed',
      description: 'On-device edge neural weights not downloaded yet.'
    };
  }

  translate(
    _text?: string,
    _sourceLang?: SupportedLanguage,
    _targetLang?: SupportedLanguage,
    _options?: { domain?: string; targetScript?: string }
  ): Promise<ProviderTranslationResult | null> {
    // Zero-hallucination: returns null rather than fabricating output
    return Promise.resolve(null);
  }
}

// -------------------------------------------------------------
// 5. Online Provider (Capability-gated, Timeout-protected, Offline-aware)
// -------------------------------------------------------------
export class OnlineProvider implements ITranslationProvider {
  id = 'online_bridge';
  name = 'Online Web Bridge';
  isOffline = false;

  private isOfflineSimulated = false;

  setSimulatedOffline(val: boolean): void {
    this.isOfflineSimulated = val;
  }

  getSimulatedOffline(): boolean {
    return this.isOfflineSimulated;
  }

  isAvailable(sourceLang: SupportedLanguage, targetLang: SupportedLanguage): boolean {
    // If browser is physically offline or simulation is active, online provider is unavailable
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
    if (this.isOfflineSimulated) return false;

    // Check capability registry
    const cap = getCapability(sourceLang, targetLang);
    return !!(cap && cap.fullSentence && cap.provider !== null);
  }

  async translate(
    text: string,
    sourceLang: SupportedLanguage,
    targetLang: SupportedLanguage
  ): Promise<ProviderTranslationResult | null> {
    if (!this.isAvailable(sourceLang, targetLang)) {
      return null;
    }

    const srcCode2 = getLanguageCode2(sourceLang);
    const tgtCode2 = getLanguageCode2(targetLang);

    // Primary: Google Translate Web Bridge (Unofficial)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcCode2}&tl=${tgtCode2}&dt=t&q=${encodeURIComponent(text)}`;
      const gRes = await fetch(googleUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (gRes.ok) {
        const gData = await gRes.json();
        if (Array.isArray(gData) && Array.isArray(gData[0])) {
          const translated = gData[0]
            .map((part: any) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
            .join('')
            .trim();

          if (translated && translated.toLowerCase() !== text.toLowerCase()) {
            const scriptInfo = detectOutputScript(translated);
            return {
              text: translated,
              provider: 'Google Translate Web Bridge (Unofficial)',
              method: 'neural',
              evidence: {
                id: `ev-on-${Date.now()}`,
                sourceType: 'online_bridge',
                providerName: 'Google Translate Web Bridge (Unofficial)',
                verificationStatus: 'experimental',
                isOffline: false,
                internetRequired: true,
                matchCategory: 'neural_bridge',
                targetScript: scriptInfo.scriptName,
                timestamp: Date.now(),
                notes: 'Translated via online web bridge. Internet connection required.'
              }
            };
          }
        }
      }
    } catch (gErr) {
      console.warn('[OnlineProvider] Google Translate bridge unavailable, checking secondary:', gErr);
    }

    // Secondary: MyMemory Web Bridge
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const memoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcCode2}|${tgtCode2}`;
      const mRes = await fetch(memoryUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData?.responseStatus === 200 && mData?.responseData?.translatedText) {
          const translated = mData.responseData.translatedText.trim();
          if (
            translated &&
            !translated.includes('INVALID TARGET LANGUAGE') &&
            !translated.includes('MYMEMORY WARNING') &&
            translated.toLowerCase() !== text.toLowerCase()
          ) {
            const scriptInfo = detectOutputScript(translated);
            return {
              text: translated,
              provider: 'MyMemory Web Bridge',
              method: 'neural',
              evidence: {
                id: `ev-on-${Date.now()}`,
                sourceType: 'online_bridge',
                providerName: 'MyMemory Web Bridge',
                verificationStatus: 'experimental',
                isOffline: false,
                internetRequired: true,
                matchCategory: 'neural_bridge',
                targetScript: scriptInfo.scriptName,
                timestamp: Date.now(),
                notes: 'Translated via MyMemory online bridge. Internet connection required.'
              }
            };
          }
        }
      }
    } catch (mErr) {
      console.warn('[OnlineProvider] MyMemory bridge unavailable:', mErr);
    }

    return null;
  }
}

// Singleton instances
export const localDbProvider = new LocalDatabaseProvider();
export const santaliDatasetProvider = new SantaliDatasetProvider();
export const onDeviceModelProvider = new OnDeviceModelProvider();
export const onlineProvider = new OnlineProvider();

export function setSimulatedOffline(val: boolean): void {
  onlineProvider.setSimulatedOffline(val);
}

export function getSimulatedOffline(): boolean {
  return onlineProvider.getSimulatedOffline();
}

