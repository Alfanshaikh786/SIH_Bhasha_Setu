/**
 * Modular Translation Provider Interface for Bhasha Setu
 *
 * Provides a unified abstraction for all resolution tiers:
 *  - MemoryPhraseBankProvider (Tier 1)
 *  - LocalSQLiteProvider (Tier 2)
 *  - OnDeviceModelProvider (Tier 3 - future ONNX Runtime Web / LiteRT)
 *  - OnlineWebBridgeProvider (Tier 4 - Google Translate / MyMemory)
 */

import { SupportedLanguage } from '../languageService';
import { TranslationEvidence } from '../translationEvidence';

export interface ProviderTranslationOptions {
  domain?: string;
  targetScript?: string;
  allowFuzzy?: boolean;
}

export interface ProviderResult {
  text: string;
  transliteration?: string;
  targetScript?: string;
  evidence: TranslationEvidence;
  success: boolean;
  error?: string;
}

export interface TranslationProvider {
  id: string;
  name: string;
  tier: number;
  isOfflineOnly: boolean;
  requiresInternet: boolean;

  /**
   * Evaluates whether this provider supports the requested language pair
   */
  canTranslate(
    sourceLang: SupportedLanguage,
    targetLang: SupportedLanguage,
    options?: ProviderTranslationOptions
  ): boolean;

  /**
   * Executes the translation query through this provider
   */
  translate(
    text: string,
    sourceLang: SupportedLanguage,
    targetLang: SupportedLanguage,
    options?: ProviderTranslationOptions
  ): Promise<ProviderResult | null>;

  /**
   * Health check / readiness query
   */
  isReady(): Promise<boolean> | boolean;
}
