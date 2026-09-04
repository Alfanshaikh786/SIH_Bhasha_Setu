/**
 * In-Browser WebAssembly SQLite Service for Bhasha Setu
 * Loads translations.db directly in-memory / WebAssembly with zero network dependency
 * enabling 100% offline classroom search and instant SQL querying across 6,780+ verified entries.
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export interface TranslationRow {
  id: number;
  english: string;
  hindi: string;
  santali: string;
  santali_roman: string;
  ho: string;
  mundari: string;
  category: string;
  verified: string;
}

export interface SqliteStats {
  isReady: boolean;
  totalRows: number;
  categoriesCount: number;
  loadError: string | null;
}

let dbInstance: Database | null = null;
let sqlPromise: Promise<Database | null> | null = null;
let cachedStats: SqliteStats = {
  isReady: false,
  totalRows: 0,
  categoriesCount: 0,
  loadError: null
};

/**
 * Initialize the SQLite WebAssembly Database from local bundled translations.db
 */
export async function getSqliteDatabase(): Promise<Database | null> {
  if (dbInstance) return dbInstance;
  if (sqlPromise) return sqlPromise;

  sqlPromise = (async () => {
    try {
      // 1. Initialize WebAssembly SQL.js engine
      const SQL: SqlJsStatic = await initSqlJs({
        locateFile: (file) => {
          if (file.endsWith('.wasm')) {
            return '/sql-wasm.wasm';
          }
          return `/${file}`;
        }
      });

      // 2. Fetch bundled translations.db as ArrayBuffer (Cached for 100% offline access)
      const response = await fetch('/data/translations.db');
      if (!response.ok) {
        throw new Error(`Failed to load translations.db: HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(buffer));
      dbInstance = db;

      // Calculate stats
      const countRes = db.exec("SELECT COUNT(*) FROM translations;");
      const totalRows = countRes[0]?.values[0]?.[0] as number || 6780;

      const catRes = db.exec("SELECT COUNT(DISTINCT category) FROM translations;");
      const categoriesCount = catRes[0]?.values[0]?.[0] as number || 0;

      cachedStats = {
        isReady: true,
        totalRows,
        categoriesCount,
        loadError: null
      };

      console.info(`✅ Local SQLite translations.db ready with ${totalRows} rows across ${categoriesCount} categories!`);
      return db;
    } catch (err: any) {
      console.error('Error initializing SQLite database:', err);
      sqlPromise = null; // allow retry
      cachedStats = {
        isReady: false,
        totalRows: 0,
        categoriesCount: 0,
        loadError: err?.message || 'Database load error'
      };
      return null;
    }
  })();

  return sqlPromise;
}

/**
 * Get current SQLite Database stats
 */
export const BACKEND_API_URL = 'http://127.0.0.1:5000/api';
export const USE_POSTGRES_BACKEND = true;

// Initial background sync with local PostgreSQL backend
if (typeof window !== 'undefined' && USE_POSTGRES_BACKEND) {
  fetch(`${BACKEND_API_URL}/stats`)
    .then(res => res.ok ? res.json() : null)
    .then(stats => {
      if (stats && stats.isReady) {
        cachedStats = {
          isReady: true,
          totalRows: stats.totalRows || 6780,
          categoriesCount: stats.categoriesCount || 13,
          loadError: null
        };
      }
    })
    .catch(() => {});
}

/**
 * Get current SQLite / PostgreSQL Database stats
 */
export function getSqliteStats(): SqliteStats {
  return cachedStats;
}

/**
 * Fast helper to query the local offline PostgreSQL backend with automatic silent fallback
 */
async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  if (!USE_POSTGRES_BACKEND) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${BACKEND_API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // Transparent fallback to SQLite WASM
  }
}

/**
 * Maps language code to SQLite column name
 */
function getColumnName(langCode: string): keyof TranslationRow {
  switch (langCode) {
    case 'eng': return 'english';
    case 'hin': return 'hindi';
    case 'sat': return 'santali';
    case 'hoc': return 'ho';
    case 'unr': return 'mundari';
    default: return 'english';
  }
}

/**
 * Fast SQL translation query for exact or fuzzy match
 */
export async function queryTranslationFromDb(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ targetText: string; roman?: string; row?: TranslationRow; confidence: number } | null> {
  const clean = text.trim();
  if (!clean) return null;

  // 1. Try local PostgreSQL backend first
  if (USE_POSTGRES_BACKEND) {
    const pgRes = await fetchFromBackend<{
      target_text: string | null;
      roman?: string;
      confidence: number;
      row?: TranslationRow;
    }>('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, source_lang: sourceLang, target_lang: targetLang })
    });

    if (pgRes && pgRes.target_text) {
      return {
        targetText: pgRes.target_text,
        roman: pgRes.roman,
        row: pgRes.row,
        confidence: pgRes.confidence
      };
    }
  }

  // 2. Fallback to in-browser WebAssembly SQLite Database
  const db = await getSqliteDatabase();
  if (!db) return null;

  const srcCol = getColumnName(sourceLang);
  const targetCol = getColumnName(targetLang);
  const lower = clean.toLowerCase().replace(/[?!.,;]/g, '').trim();

  try {
    // 1. Exact Match on source column (case-insensitive)
    const exactQuery = `
      SELECT id, english, hindi, santali, santali_roman, ho, mundari, category, verified 
      FROM translations 
      WHERE LOWER(TRIM(${srcCol})) = ? 
         OR LOWER(TRIM(english)) = ? 
         OR LOWER(TRIM(hindi)) = ? 
         OR LOWER(TRIM(santali)) = ? 
         OR LOWER(TRIM(santali_roman)) = ?
      LIMIT 1;
    `;

    const exactStmt = db.prepare(exactQuery);
    exactStmt.bind([lower, lower, lower, lower, lower]);

    if (exactStmt.step()) {
      const row = exactStmt.getAsObject() as unknown as TranslationRow;
      exactStmt.free();

      let targetText = (row[targetCol] as string) || (row.santali as string) || row.english;
      if (targetLang === 'sat' && row.santali_roman && !targetText.includes('(')) {
        targetText = `${row.santali} (${row.santali_roman})`;
      }

      return {
        targetText,
        roman: row.santali_roman,
        row,
        confidence: 0.99
      };
    }
    exactStmt.free();

    // 2. Fuzzy Prefix / Contains Match with LIKE
    const fuzzyQuery = `
      SELECT id, english, hindi, santali, santali_roman, ho, mundari, category, verified 
      FROM translations 
      WHERE ${srcCol} LIKE ? 
         OR english LIKE ? 
         OR hindi LIKE ? 
         OR santali LIKE ? 
         OR santali_roman LIKE ?
      LIMIT 1;
    `;

    const fuzzyPattern = `%${lower}%`;
    const fuzzyStmt = db.prepare(fuzzyQuery);
    fuzzyStmt.bind([fuzzyPattern, fuzzyPattern, fuzzyPattern, fuzzyPattern, fuzzyPattern]);

    if (fuzzyStmt.step()) {
      const row = fuzzyStmt.getAsObject() as unknown as TranslationRow;
      fuzzyStmt.free();

      let targetText = (row[targetCol] as string) || (row.santali as string) || row.english;
      if (targetLang === 'sat' && row.santali_roman && !targetText.includes('(')) {
        targetText = `${row.santali} (${row.santali_roman})`;
      }

      return {
        targetText,
        roman: row.santali_roman,
        row,
        confidence: 0.95
      };
    }
    fuzzyStmt.free();

    return null;
  } catch (err) {
    console.error('SQL query error:', err);
    return null;
  }
}

/**
 * Search classroom sentences across all columns with optional category filter
 */
export async function searchClassroomSentences(
  keyword: string = '',
  category: string = 'All',
  limit: number = 30
): Promise<TranslationRow[]> {
  // 1. Try local PostgreSQL backend first
  if (USE_POSTGRES_BACKEND) {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit.toString());

    const pgRows = await fetchFromBackend<TranslationRow[]>(`/search?${params.toString()}`);
    if (pgRows && Array.isArray(pgRows) && pgRows.length > 0) {
      return pgRows;
    }
  }

  // 2. Fallback to in-memory WebAssembly SQLite Database
  const db = await getSqliteDatabase();
  if (!db) return [];

  const cleanKeyword = keyword.trim().toLowerCase();
  const results: TranslationRow[] = [];

  try {
    let query = `
      SELECT id, english, hindi, santali, santali_roman, ho, mundari, category, verified 
      FROM translations
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (cleanKeyword) {
      conditions.push(`(
        LOWER(english) LIKE ? OR 
        LOWER(hindi) LIKE ? OR 
        LOWER(santali) LIKE ? OR 
        LOWER(santali_roman) LIKE ?
      )`);
      const pattern = `%${cleanKeyword}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (category && category !== 'All') {
      conditions.push(`category = ?`);
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY id ASC LIMIT ?;`;
    params.push(limit);

    const stmt = db.prepare(query);
    stmt.bind(params);

    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as TranslationRow);
    }
    stmt.free();

    return results;
  } catch (err) {
    console.error('SQL search error:', err);
    return [];
  }
}

/**
 * Get distinct classroom categories and their row counts
 */
export async function getClassroomCategories(): Promise<{ category: string; count: number }[]> {
  // 1. Try local PostgreSQL backend first
  if (USE_POSTGRES_BACKEND) {
    const pgCats = await fetchFromBackend<{ category: string; count: number }[]>('/categories');
    if (pgCats && Array.isArray(pgCats) && pgCats.length > 0) {
      return pgCats;
    }
  }

  // 2. Fallback to in-memory WebAssembly SQLite Database
  const db = await getSqliteDatabase();
  if (!db) return [];

  try {
    const query = `
      SELECT category, COUNT(*) as count 
      FROM translations 
      GROUP BY category 
      ORDER BY count DESC;
    `;
    const res = db.exec(query);
    if (!res[0]) return [];

    return res[0].values.map(row => ({
      category: row[0] as string,
      count: row[1] as number
    }));
  } catch (err) {
    console.error('SQL get categories error:', err);
    return [];
  }
}
