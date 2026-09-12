/**
 * Bhasha Setu — Pronunciation LRU Cache
 *
 * Provides ultra-fast O(1) in-memory caching of resolved pronunciation records.
 * Incorporates linguistic rules versioning into the cache key to guarantee zero
 * stale entries across rule updates.
 */

import { PronunciationRecord } from '../types';

export class PronunciationCache {
  private static cache = new Map<string, PronunciationRecord>();
  private static readonly MAX_ENTRIES = 1000;

  /**
   * Constructs a versioned cache key.
   */
  public static buildKey(rulesVersion: string, langCode: string, normalizedText: string): string {
    return `${rulesVersion}:${langCode.toLowerCase().trim()}:${normalizedText.trim()}`;
  }

  /**
   * Retrieves a cached record.
   */
  public static get(rulesVersion: string, langCode: string, normalizedText: string): PronunciationRecord | null {
    const key = this.buildKey(rulesVersion, langCode, normalizedText);
    const item = this.cache.get(key);
    if (!item) return null;

    // LRU refresh: re-insert at end of Map
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  /**
   * Inserts a record into the cache.
   */
  public static set(record: PronunciationRecord): void {
    const key = this.buildKey(record.rulesVersion, record.language, record.normalizedText);

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.MAX_ENTRIES) {
      // Evict oldest entry (first key in map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, record);
  }

  /**
   * Clears the cache.
   */
  public static clear(): void {
    this.cache.clear();
  }

  public static size(): number {
    return this.cache.size;
  }
}
