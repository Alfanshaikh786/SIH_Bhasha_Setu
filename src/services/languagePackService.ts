/**
 * School and Field Language Pack Service for Bhasha Setu
 *
 * Models downloadable and bundled offline language packages for rural deployment.
 * Provides clear visibility into pack sizes, offline readiness, and entry counts.
 */

import { SupportedLanguage } from './languageService';

export interface LanguagePack {
  id: string;
  name: string;
  language: SupportedLanguage;
  version: string;
  sizeBytes: number;
  sizeFormatted: string;
  entryCount: number;
  status: 'installed' | 'available' | 'vocabulary_only' | 'model_pending';
  offlineReady: boolean;
  supportedScripts: string[];
  description: string;
  includedDomains: string[];
}

export const INSTALLED_LANGUAGE_PACKS: LanguagePack[] = [
  {
    id: 'pack-sat-core',
    name: 'Santali Core Accessibility Pack',
    language: 'santali',
    version: '1.2.0',
    sizeBytes: 4225000,
    sizeFormatted: '4.03 MB',
    entryCount: 6780,
    status: 'installed',
    offlineReady: true,
    supportedScripts: ['Ol Chiki', 'Roman / Latin', 'Devanagari'],
    description: 'Complete parallel sentence corpus, SQLite database, and phonetic transliteration engine.',
    includedDomains: ['Classroom', 'Education', 'Healthcare', 'Agriculture', 'Family', 'Emergency']
  },
  {
    id: 'pack-unr-vocab',
    name: 'Mundari Lexicon Reference Pack',
    language: 'mundari',
    version: '0.4.0',
    sizeBytes: 46000,
    sizeFormatted: '45 KB',
    entryCount: 120,
    status: 'vocabulary_only',
    offlineReady: true,
    supportedScripts: ['Devanagari', 'Roman'],
    description: 'Word-level classroom glossary assistance. Full-sentence neural translation awaiting custom model.',
    includedDomains: ['Classroom', 'Greetings', 'Daily Conversation']
  },
  {
    id: 'pack-hoc-vocab',
    name: 'Ho Lexicon Reference Pack',
    language: 'ho',
    version: '0.4.0',
    sizeBytes: 42000,
    sizeFormatted: '41 KB',
    entryCount: 110,
    status: 'vocabulary_only',
    offlineReady: true,
    supportedScripts: ['Warang Chiti', 'Devanagari', 'Roman'],
    description: 'Word-level classroom glossary assistance. Full-sentence neural translation awaiting custom model.',
    includedDomains: ['Classroom', 'Greetings', 'Daily Conversation']
  }
];

export function getLanguagePacks(): LanguagePack[] {
  return INSTALLED_LANGUAGE_PACKS;
}

export function getLanguagePack(language: SupportedLanguage): LanguagePack | undefined {
  return INSTALLED_LANGUAGE_PACKS.find(p => p.language === language);
}
