/**
 * Bhasha Setu — Contextual Pronunciation LRU Cache
 *
 * Implements context-aware caching incorporating local token context hashes,
 * linguistic rule versions, and language codes to ensure contextually dependent
 * pronunciations are never conflated with isolated word lookups.
 */

import { PronunciationRecord } from '../types';

export class ContextualPronunciationCache {
  private static cache = new Map<string, PronunciationRecord>();
  private static readonly MAX_ENTRIES = 1200;

  /**
   * Builds a context-aware versioned cache key.
   */
  public static buildKey(
    rulesVersion: string,
    langCode: string,
    normalizedText: string,
    contextHash: string = 'standalone'
  ): string {
    return `${rulesVersion}:${langCode.toLowerCase().trim()}:${normalizedText.trim()}:${contextHash}`;
  }

  /**
   * Retrieves a cached pronunciation record.
   */
  public static get(
    rulesVersion: string,
    langCode: string,
    normalizedText: string,
    contextHash: string = 'standalone'
  ): PronunciationRecord | null {
    const key = this.buildKey(rulesVersion, langCode, normalizedText, contextHash);
    const item = this.cache.get(key);
    if (!item) return null;

    // LRU refresh
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  /**
   * Inserts or updates a contextual pronunciation record.
   */
  public static set(record: PronunciationRecord, contextHash: string = 'standalone'): void {
    const key = this.buildKey(record.rulesVersion, record.language, record.normalizedText, contextHash);

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.MAX_ENTRIES) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, record);
  }

  public static clear(): void {
    this.cache.clear();
  }

  public static size(): number {
    return this.cache.size;
  }
}
