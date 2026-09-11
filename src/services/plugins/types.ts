/**
 * Language Plugin Architecture for Bhasha Setu
 *
 * Allows languages (Santali, Mundari, Ho, Hindi, English, and future additions)
 * to be registered as self-contained plugins defining their scripts,
 * lexicon providers, phonetic transliterators, and capabilities.
 */

import { SupportedLanguage } from '../languageService';

export interface LanguagePlugin {
  languageId: SupportedLanguage;
  name: string;
  nativeName: string;
  primaryScript: string;
  supportedScripts: string[];
  isFullSentenceSupported: boolean;
  isOfflineReady: boolean;
  hasOnDeviceModel: boolean;
  datasetEntryCount: number;

  /**
   * Look up word-level gloss/definition
   */
  lookupTerm?(term: string): { meaning: string; script?: string } | null;

  /**
   * Transliterate text across supported scripts for this language
   */
  transliterate?(text: string, targetScript: string): string;
}

export const LANGUAGE_PLUGIN_REGISTRY = new Map<SupportedLanguage, LanguagePlugin>();

export function registerLanguagePlugin(plugin: LanguagePlugin): void {
  LANGUAGE_PLUGIN_REGISTRY.set(plugin.languageId, plugin);
}

export function getLanguagePlugin(lang: SupportedLanguage): LanguagePlugin | undefined {
  return LANGUAGE_PLUGIN_REGISTRY.get(lang);
}
