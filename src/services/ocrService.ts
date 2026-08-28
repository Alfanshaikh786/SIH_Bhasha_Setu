// High Accuracy In-Browser Multi-Script OCR Service powered by Tesseract.js WebAssembly

import { createWorker } from 'tesseract.js';
import { translateText } from './translationService';

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface RealOCRResult {
  text: string;
  detectedLanguage: string;
  confidence: number;
  lines: string[];
  wordsCount: number;
}

/**
 * Detect script / language family from extracted characters
 */
export function detectScriptFromText(text: string): { name: string; code: string } {
  if (!text || !text.trim()) {
    return { name: 'Auto-Detected', code: 'eng' };
  }

  // Devanagari Unicode range: \u0900-\u097F
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  // Ol Chiki Unicode range: \u1C50-\u1C7F
  const olChikiCount = (text.match(/[\u1C50-\u1C7F]/g) || []).length;
  // Odia Unicode range: \u0B00-\u0B7F
  const odiaCount = (text.match(/[\u0B00-\u0B7F]/g) || []).length;
  // Bengali Unicode range: \u0980-\u09FF
  const bengaliCount = (text.match(/[\u0980-\u09FF]/g) || []).length;
  // Latin / English
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;

  const total = devanagariCount + olChikiCount + odiaCount + bengaliCount + latinCount;
  if (total === 0) return { name: 'Multi-Script / Latin', code: 'eng' };

  if (olChikiCount > 0 && olChikiCount >= devanagariCount) {
    return { name: 'Santali (Ol Chiki)', code: 'sat' };
  }
  if (devanagariCount >= latinCount && devanagariCount >= odiaCount) {
    return { name: 'Devanagari (Hindi / Bhili / Gondi)', code: 'hin' };
  }
  if (odiaCount > devanagariCount) {
    return { name: 'Odia Script (Tribal Dialect)', code: 'hin' };
  }
  if (bengaliCount > devanagariCount) {
    return { name: 'Bengali Script (Santali / Munda)', code: 'hin' };
  }

  return { name: 'English / Romanized Script', code: 'eng' };
}

/**
 * Perform real OCR on any image source (Blob URL, Data URL, File, or Remote URL)
 */
export async function extractTextFromImage(
  imageSource: string | File | Blob,
  ocrLanguage: string = 'eng+hin',
  onProgress?: (p: OCRProgress) => void
): Promise<RealOCRResult> {
  try {
    onProgress?.({ status: 'Loading neural OCR engine...', progress: 0.1 });

    // Initialize worker with English + Hindi (covers Devanagari, English, and Romanized tribal text)
    const worker = await createWorker(ocrLanguage, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          onProgress?.({
            status: `Recognizing text (${Math.round((m.progress || 0) * 100)}%)...`,
            progress: 0.2 + (m.progress || 0) * 0.75
          });
        } else if (m.status) {
          onProgress?.({
            status: `${m.status}...`,
            progress: 0.15
          });
        }
      }
    });

    onProgress?.({ status: 'Analyzing document structure...', progress: 0.35 });

    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    const rawText = (ret.data.text || '').trim();
    const cleanLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const detected = detectScriptFromText(rawText);
    const confidence = Math.min(0.99, Math.max(0.65, (ret.data.confidence || 85) / 100));

    onProgress?.({ status: 'OCR Extraction Complete!', progress: 1.0 });

    if (!rawText) {
      return {
        text: 'No readable text was detected in the provided image. Please ensure the image is clear, well-lit, and contains printed or handwritten text.',
        detectedLanguage: 'None Detected',
        confidence: 0,
        lines: [],
        wordsCount: 0
      };
    }

    return {
      text: cleanLines.join('\n'),
      detectedLanguage: detected.name,
      confidence: Math.round(confidence * 100) / 100,
      lines: cleanLines,
      wordsCount: rawText.split(/\s+/).filter(Boolean).length
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    onProgress?.({ status: 'OCR fallback analysis...', progress: 0.8 });

    // Fallback: Return informative result if worker failed
    return {
      text: 'Text extraction encountered an issue reading this image format. Please try uploading a sharper JPG/PNG image.',
      detectedLanguage: 'Error',
      confidence: 0,
      lines: [],
      wordsCount: 0
    };
  }
}
