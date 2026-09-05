/**
 * Tesseract Worker Pool & Cache for Bhasha Setu
 * Caches and reuses Tesseract.js workers across OCR requests to eliminate repeated loading times
 * and prevent memory leaks.
 */

import { createWorker, PSM, Worker } from 'tesseract.js';

interface CachedWorkerEntry {
  worker: Worker;
  lang: string;
  isBusy: boolean;
  lastUsed: number;
}

const workerCache = new Map<string, CachedWorkerEntry>();

/**
 * Get or initialize a cached Tesseract Worker for the requested language
 */
export async function getCachedWorker(
  lang: string,
  onLoggerProgress?: (progress: number, status: string) => void
): Promise<Worker> {
  const normalizedLang = lang === 'hin' ? 'hin' : (lang === 'eng' ? 'eng' : 'eng+hin');

  const existing = workerCache.get(normalizedLang);
  if (existing) {
    existing.lastUsed = Date.now();
    return existing.worker;
  }

  // Create new worker with logger
  const worker = await createWorker(normalizedLang, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onLoggerProgress) {
        onLoggerProgress(m.progress || 0, 'Recognizing text...');
      } else if (onLoggerProgress && m.status) {
        onLoggerProgress(m.progress || 0, m.status);
      }
    }
  });

  workerCache.set(normalizedLang, {
    worker,
    lang: normalizedLang,
    isBusy: false,
    lastUsed: Date.now()
  });

  return worker;
}

/**
 * Recognize image using a cached worker with configurable PSM
 */
export async function recognizeWithWorker(
  imageSource: string | File | Blob,
  lang: string,
  psmMode: PSM = PSM.SINGLE_BLOCK,
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; confidence: number }> {
  const worker = await getCachedWorker(lang, onProgress);

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: psmMode
    });

    const ret = await worker.recognize(imageSource);
    const rawText = ret.data.text || '';
    const confidence = typeof ret.data.confidence === 'number' ? ret.data.confidence : 0;

    return {
      text: rawText,
      confidence: Math.round(confidence * 10) / 10
    };
  } catch (err) {
    console.warn(`Worker recognize error with PSM ${psmMode}:`, err);
    // If worker had an internal error, remove from cache to ensure fresh reinit next time
    const normalizedLang = lang === 'hin' ? 'hin' : (lang === 'eng' ? 'eng' : 'eng+hin');
    workerCache.delete(normalizedLang);
    throw err;
  }
}

/**
 * Terminate all cached workers to free memory (e.g. on unmount or reset)
 */
export async function terminateAllWorkers(): Promise<void> {
  const promises: Promise<any>[] = [];
  for (const entry of workerCache.values()) {
    promises.push(entry.worker.terminate().catch(() => {}));
  }
  workerCache.clear();
  await Promise.all(promises);
}
