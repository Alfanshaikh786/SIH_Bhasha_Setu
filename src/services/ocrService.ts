// Intelligent Multi-Script OCR Engine for Bhasha Setu (Multi-Script Validation Upgrade)
// Features:
// - Multi-Script Support & Transparent Capability Routing
// - Preprocessing Safety Rules (preserves clean document antialiasing)
// - Configurable Confidence-Based Retry Logic (OCR_RETRY_THRESHOLD = 70)
// - PSM Mode Arbitration (PSM 3, PSM 6, PSM 11)
// - Ground Truth CER / WER Validation & Telemetry
// - Multi-Script Benchmark Suite Runner
// - Worker Caching & Memory Leak Prevention

import { PSM } from 'tesseract.js';
import {
  ImageQualityReport,
  OCRProgress,
  RealOCRResult,
  OCRDebugInfo,
  OCRBenchmarkReport,
  MultiScriptBenchmarkSuiteReport
} from './ocr/types';
import { analyzeImageQuality, loadImageElement } from './ocr/imageQualityService';
import {
  generateAdaptiveCandidates,
  chromaticDeltaPreprocessing,
  normalizeContrast,
  toGrayscale
} from './ocr/imagePreprocessor';
import { recognizeWithWorker } from './ocr/tesseractWorkerPool';
import { runFullOCRBenchmark, runMultiScriptBenchmarkSuite } from './ocr/ocrBenchmarkService';
import { evaluateOCRAccuracy } from './ocr/evaluationMetrics';

export type {
  ImageQualityReport,
  OCRProgress,
  RealOCRResult,
  OCRDebugInfo,
  OCRBenchmarkReport,
  MultiScriptBenchmarkSuiteReport
};
export { analyzeImageQuality, runFullOCRBenchmark, runMultiScriptBenchmarkSuite, evaluateOCRAccuracy };

/**
 * Configurable OCR Retry Threshold and Limits
 */
export const OCR_RETRY_THRESHOLD = 70;
export const MAX_OCR_RETRIES = 2;

/**
 * Loads an image into an HTMLImageElement
 */
function loadImage(src: string | File | Blob): Promise<HTMLImageElement> {
  return loadImageElement(src);
}

/**
 * Backwards-compatible Canvas Preprocessor
 */
export async function preprocessImageForOCR(
  source: string | File | Blob,
  mode: 'chromatic' | 'threshold' | 'contrast' | 'original' = 'chromatic'
): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      return typeof source === 'string' ? source : '';
    }

    const img = await loadImage(source);
    const canvas = document.createElement('canvas');
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    const targetMin = 950;
    if (width < targetMin || height < targetMin) {
      const scale = Math.max(targetMin / width, targetMin / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return typeof source === 'string' ? source : URL.createObjectURL(source);

    ctx.drawImage(img, 0, 0, width, height);

    if (mode === 'original') {
      return canvas.toDataURL('image/png');
    }

    if (mode === 'chromatic') {
      return chromaticDeltaPreprocessing(canvas);
    }

    const imgData = ctx.getImageData(0, 0, width, height);
    const grays = toGrayscale(imgData.data);
    const normalized = normalizeContrast(grays);

    for (let i = 0; i < normalized.length; i++) {
      const val = mode === 'threshold' ? (normalized[i] < 128 ? 0 : 255) : normalized[i];
      const o = i * 4;
      imgData.data[o] = val;
      imgData.data[o + 1] = val;
      imgData.data[o + 2] = val;
      imgData.data[o + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Canvas preprocessing fallback:', err);
    return typeof source === 'string' ? source : URL.createObjectURL(source);
  }
}

/**
 * Detect script / language family from extracted characters
 */
export function detectScriptFromText(text: string): { name: string; code: string } {
  if (!text || !text.trim()) {
    return { name: 'English / Romanized Script', code: 'eng' };
  }

  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const olChikiCount = (text.match(/[\u1C50-\u1C7F]/g) || []).length;
  const odiaCount = (text.match(/[\u0B00-\u0B7F]/g) || []).length;
  const bengaliCount = (text.match(/[\u0980-\u09FF]/g) || []).length;
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;

  const total = devanagariCount + olChikiCount + odiaCount + bengaliCount + latinCount;
  if (total === 0) return { name: 'English / Romanized Script', code: 'eng' };

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
 * Clean OCR output from spurious watermark & noise artifacts
 */
export function cleanOcrText(raw: string): string {
  if (!raw) return '';
  return raw
    .split('\n')
    .map(line => {
      let l = line.trim();
      l = l.replace(/\b(alamy|alamystock|stock\s*photo|shutterstock|istock|getty\s*images|gmy|ple\s*io|io\s*a)\b/gi, '').trim();
      l = l.replace(/[©®™~|^_`]{1,}/g, '').trim();
      return l;
    })
    .filter(l => l.length > 0 && !/^[.\-_\\/|:;,\s]+$/.test(l))
    .join('\n')
    .trim();
}

interface CandidateEvaluation {
  candidateName: string;
  psmMode: PSM;
  psmName: string;
  cleanedText: string;
  rawConfidence: number;
  charCount: number;
}

/**
 * Perform Intelligent Multi-Stage OCR with Confidence-Based Retries & Diagnostics
 */
export async function extractTextFromImage(
  imageSource: string | File | Blob,
  ocrLanguage: string = 'eng+hin',
  onProgress?: (p: OCRProgress) => void,
  enableDebug: boolean = true,
  groundTruthText?: string
): Promise<RealOCRResult> {
  const startTime = Date.now();

  try {
    // STAGE 1: Image Quality Analysis
    onProgress?.({ status: 'Analyzing image quality (blur, lighting, contrast)...', progress: 0.12 });
    const qualityReport = await analyzeImageQuality(imageSource);
    const imgElem = await loadImageElement(imageSource);
    const originalWidth = imgElem.naturalWidth || imgElem.width || 800;
    const originalHeight = imgElem.naturalHeight || imgElem.height || 600;

    // STAGE 2: Smart Preprocessing Candidates (Safety rules applied)
    onProgress?.({ status: 'Applying smart image enhancement & deskewing...', progress: 0.25 });
    const candidates = await generateAdaptiveCandidates(imageSource, qualityReport);

    // INTERCEPT: Unsupported Tribal Scripts without native Tesseract.js models
    const isOlChiki = ocrLanguage === 'sat' || ocrLanguage === 'ol_chiki';
    const isWarangChiti = ocrLanguage === 'hoc' || ocrLanguage === 'warang_chiti';

    if (isOlChiki || isWarangChiti) {
      const scriptName = isOlChiki ? 'Santali (Ol Chiki)' : 'Ho (Warang Chiti)';
      onProgress?.({ status: `Preprocessing completed. Custom model required for ${scriptName}.`, progress: 1.0 });

      return {
        text: `[${scriptName} OCR Notice]\n\nImage preprocessing and enhancement completed successfully.\n\nHowever, a trained ${scriptName} neural OCR model is not yet installed in the client engine.\nStandard Tesseract.js does not contain open-source weights for this tribal script.\n\nTo recognize this document, please select English or Hindi if Latin/Devanagari text is present, or integrate a custom trained ONNX / LiteRT model.`,
        detectedLanguage: scriptName,
        confidence: 0,
        lines: [],
        wordsCount: 0,
        qualityReport,
        preprocessingMethod: candidates[0]?.description || 'Adaptive Threshold',
        warnings: [
          `${scriptName} recognition model is not yet installed.`,
          'Standard Tesseract.js does not include trained weights for this tribal script.'
        ],
        isCustomModelRequired: true,
        unsupportedMessage: `${scriptName} recognition model is not yet installed. Image enhancement is available, but a trained ${scriptName} OCR model is required for text recognition.`
      };
    }

    // STAGE 3: Run Initial OCR with Cached Worker Pool
    onProgress?.({ status: 'Running OCR engine...', progress: 0.40 });
    const lang = ocrLanguage === 'hin' ? 'hin' : (ocrLanguage === 'eng' ? 'eng' : 'eng+hin');

    const evaluations: CandidateEvaluation[] = [];
    let retriesPerformed = 0;

    const primaryCandidate = candidates[0];
    const initialPsm = PSM.AUTO;

    try {
      const r1 = await recognizeWithWorker(
        primaryCandidate.dataUrl,
        lang,
        initialPsm,
        (p) => onProgress?.({ status: `Recognizing text (${Math.round(p * 100)}%)...`, progress: 0.40 + p * 0.35 })
      );
      const c1 = cleanOcrText(r1.text);
      evaluations.push({
        candidateName: primaryCandidate.description,
        psmMode: initialPsm,
        psmName: 'PSM 3 (AUTO)',
        cleanedText: c1,
        rawConfidence: r1.confidence,
        charCount: c1.replace(/\s+/g, '').length
      });
    } catch (err) {
      console.warn('Initial OCR candidate failed:', err);
    }

    const primaryResult = evaluations[0];
    const needsRetry = !primaryResult || primaryResult.charCount < 4 || primaryResult.rawConfidence < OCR_RETRY_THRESHOLD;

    // STAGE 4: Confidence-Based Retries
    if (needsRetry && retriesPerformed < MAX_OCR_RETRIES) {
      retriesPerformed++;
      onProgress?.({ status: 'Low confidence detected. Testing PSM 6 (Single Block)...', progress: 0.78 });

      try {
        const rBlock = await recognizeWithWorker(primaryCandidate.dataUrl, lang, PSM.SINGLE_BLOCK);
        const cBlock = cleanOcrText(rBlock.text);
        evaluations.push({
          candidateName: `${primaryCandidate.description} (Block Mode)`,
          psmMode: PSM.SINGLE_BLOCK,
          psmName: 'PSM 6 (SINGLE_BLOCK)',
          cleanedText: cBlock,
          rawConfidence: rBlock.confidence,
          charCount: cBlock.replace(/\s+/g, '').length
        });
      } catch (err) {
        console.warn('PSM 6 retry failed:', err);
      }

      if (candidates.length > 1) {
        retriesPerformed++;
        const altCandidate = candidates[1];
        onProgress?.({ status: `Testing alternative strategy: ${altCandidate.name}...`, progress: 0.88 });

        try {
          const rAlt = await recognizeWithWorker(altCandidate.dataUrl, lang, PSM.AUTO);
          const cAlt = cleanOcrText(rAlt.text);
          evaluations.push({
            candidateName: altCandidate.description,
            psmMode: PSM.AUTO,
            psmName: 'PSM 3 (AUTO)',
            cleanedText: cAlt,
            rawConfidence: rAlt.confidence,
            charCount: cAlt.replace(/\s+/g, '').length
          });
        } catch (err) {
          console.warn('Alternative candidate retry failed:', err);
        }
      }
    }

    // STAGE 5: Best Candidate Selection
    let best = evaluations[0];
    for (const ev of evaluations) {
      if (!best) {
        best = ev;
        continue;
      }
      if (ev.charCount > 2 && (ev.rawConfidence > best.rawConfidence || best.charCount < 2)) {
        best = ev;
      }
    }

    const finalText = best ? best.cleanedText : '';
    const rawEngineConfidence = best ? Math.round(best.rawConfidence) : 0;
    const cleanLines = finalText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const detected = detectScriptFromText(finalText);
    const totalDurationMs = Date.now() - startTime;

    // Ground Truth Evaluation (if ground truth is supplied)
    let groundTruthAccuracy: { cer: number; wer: number; accuracyPercent: number } | undefined;
    if (groundTruthText) {
      groundTruthAccuracy = evaluateOCRAccuracy(finalText, groundTruthText);
    }

    // Debug Report Construction
    let debugInfo: OCRDebugInfo | undefined;
    if (enableDebug) {
      debugInfo = {
        originalDimensions: { width: originalWidth, height: originalHeight },
        preprocessedDimensions: { width: originalWidth, height: originalHeight },
        qualityReport,
        selectedStrategy: best?.candidateName || primaryCandidate.description,
        inversionApplied: qualityReport.isInverted,
        deskewApplied: Math.abs(qualityReport.estimatedSkewAngle) >= 2,
        skewAngle: qualityReport.estimatedSkewAngle,
        ocrLanguage: lang,
        psmMode: best?.psmName || 'PSM 3 (AUTO)',
        rawConfidence: rawEngineConfidence,
        charCount: finalText.replace(/\s+/g, '').length,
        processingTimeMs: totalDurationMs,
        retryCount: retriesPerformed,
        evaluatedCandidates: evaluations.map(e => ({
          name: e.candidateName,
          psm: e.psmName,
          confidence: e.rawConfidence,
          chars: e.charCount
        })),
        cer: groundTruthAccuracy?.cer,
        wer: groundTruthAccuracy?.wer,
        accuracyPercent: groundTruthAccuracy?.accuracyPercent
      };
    }

    onProgress?.({ status: 'OCR Extraction Complete!', progress: 1.0 });

    if (!finalText) {
      return {
        text: 'No clear text was detected in the image. Please ensure the document is clear, well-lit, and in focus.',
        detectedLanguage: 'None Detected',
        confidence: 0,
        lines: [],
        wordsCount: 0,
        qualityReport,
        preprocessingMethod: best?.candidateName || 'None',
        warnings: qualityReport.warnings,
        debugInfo
      };
    }

    return {
      text: cleanLines.join('\n'),
      detectedLanguage: detected.name,
      confidence: rawEngineConfidence,
      lines: cleanLines,
      wordsCount: finalText.split(/\s+/).filter(Boolean).length,
      qualityReport,
      preprocessingMethod: best ? best.candidateName : 'High-Contrast Grayscale',
      warnings: qualityReport.warnings,
      debugInfo
    };
  } catch (error) {
    console.error('OCR Processing Error:', error);
    onProgress?.({ status: 'Error reading image', progress: 1.0 });

    return {
      text: 'Text extraction encountered an issue reading this image. Please try uploading a sharp PNG/JPG image.',
      detectedLanguage: 'Error',
      confidence: 0,
      lines: [],
      wordsCount: 0,
      warnings: ['An unexpected error occurred during OCR recognition.']
    };
  }
}
