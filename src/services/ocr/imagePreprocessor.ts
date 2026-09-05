/**
 * Smart Image Preprocessor for Bhasha Setu OCR
 * Includes:
 * - Preprocessing Safety Rules (prevents damaging clean documents)
 * - Optimal resolution scaling
 * - Skew correction (deskew)
 * - Blackboard / Inversion handling
 * - Integral Image Local Adaptive Thresholding (Bradley-Roth)
 * - Auto-levels Contrast Stretching
 * - 3x3 Median noise suppression
 * - Chromatic Delta separation for 3D/colored text
 * - Modular strategies for systematic benchmarking
 */

import { ImageQualityReport, PreprocessCandidate } from './types';
import { loadImageElement } from './imageQualityService';

/**
 * Creates a canvas with optimal dimensions for OCR (target min 950px, max 2600px)
 */
export function createScaledCanvas(
  img: HTMLImageElement,
  targetMin: number = 950,
  targetMax: number = 2600
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; scale: number } {
  const canvas = document.createElement('canvas');
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  let scale = 1;
  if (width < targetMin || height < targetMin) {
    scale = Math.max(targetMin / width, targetMin / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  } else if (width > targetMax || height > targetMax) {
    scale = Math.min(targetMax / width, targetMax / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  return { canvas, ctx, scale };
}

/**
 * Deskews canvas by rotating around its center by given angle (degrees)
 */
export function deskewCanvas(canvas: HTMLCanvasElement, angleDegrees: number): HTMLCanvasElement {
  if (Math.abs(angleDegrees) < 1.5 || Math.abs(angleDegrees) > 20) {
    return canvas;
  }

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = canvas.width;
  rotCanvas.height = canvas.height;
  const ctx = rotCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, rotCanvas.width, rotCanvas.height);

  ctx.save();
  ctx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  ctx.rotate((-angleDegrees * Math.PI) / 180);
  ctx.drawImage(canvas, -rotCanvas.width / 2, -rotCanvas.height / 2);
  ctx.restore();

  return rotCanvas;
}

/**
 * Convert ImageData to Grayscale
 */
export function toGrayscale(data: Uint8ClampedArray): Uint8Array {
  const len = data.length / 4;
  const grays = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const o = i * 4;
    grays[i] = Math.round(0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]);
  }
  return grays;
}

/**
 * Auto-Levels Contrast Normalization (Stretches 2nd to 98th percentile intensities to 0-255)
 */
export function normalizeContrast(grays: Uint8Array): Uint8Array {
  const hist = new Uint32Array(256);
  const total = grays.length;
  for (let i = 0; i < total; i++) {
    hist[grays[i]]++;
  }

  const pLowThreshold = total * 0.02;
  const pHighThreshold = total * 0.98;

  let cum = 0;
  let minVal = 0;
  let maxVal = 255;

  for (let i = 0; i < 256; i++) {
    cum += hist[i];
    if (minVal === 0 && cum >= pLowThreshold) {
      minVal = i;
    }
    if (cum >= pHighThreshold) {
      maxVal = i;
      break;
    }
  }

  if (maxVal <= minVal) return grays;

  const result = new Uint8Array(total);
  const range = maxVal - minVal;
  for (let i = 0; i < total; i++) {
    const v = grays[i];
    if (v <= minVal) {
      result[i] = 0;
    } else if (v >= maxVal) {
      result[i] = 255;
    } else {
      result[i] = Math.round(((v - minVal) / range) * 255);
    }
  }
  return result;
}

/**
 * Bradley-Roth Local Adaptive Thresholding using Integral Image
 * Runs in O(1) per pixel. Perfect for shadows, uneven room light, and camera vignettes.
 */
export function adaptiveThreshold(
  grays: Uint8Array,
  width: number,
  height: number,
  windowSizeFraction: number = 0.12,
  percentT: number = 0.15
): Uint8Array {
  const total = width * height;
  const S = Math.max(8, Math.floor(width * windowSizeFraction));
  const s2 = Math.floor(S / 2);

  // Compute 2D Integral Image
  const integral = new Float64Array((width + 1) * (height + 1));
  const intW = width + 1;

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const gRow = y * width;
    const intRow = (y + 1) * intW;
    const prevIntRow = y * intW;

    for (let x = 0; x < width; x++) {
      rowSum += grays[gRow + x];
      integral[intRow + (x + 1)] = integral[prevIntRow + (x + 1)] + rowSum;
    }
  }

  const output = new Uint8Array(total);

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - s2);
    const y2 = Math.min(height - 1, y + s2);
    const rowOffset = y * width;

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - s2);
      const x2 = Math.min(width - 1, x + s2);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      const sum =
        integral[(y2 + 1) * intW + (x2 + 1)] -
        integral[y1 * intW + (x2 + 1)] -
        integral[(y2 + 1) * intW + x1] +
        integral[y1 * intW + x1];

      const val = grays[rowOffset + x];
      if (val * count <= sum * (1.0 - percentT)) {
        output[rowOffset + x] = 0; // Black text
      } else {
        output[rowOffset + x] = 255; // White background
      }
    }
  }

  return output;
}

/**
 * 3x3 Fast Median Filter for Noise Reduction
 */
export function denoiseMedian3x3(grays: Uint8Array, width: number, height: number): Uint8Array {
  const output = new Uint8Array(grays.length);
  output.set(grays);

  const window = new Uint8Array(9);

  for (let y = 1; y < height - 1; y++) {
    const r = y * width;
    for (let x = 1; x < width - 1; x++) {
      window[0] = grays[r - width + x - 1];
      window[1] = grays[r - width + x];
      window[2] = grays[r - width + x + 1];
      window[3] = grays[r + x - 1];
      window[4] = grays[r + x];
      window[5] = grays[r + x + 1];
      window[6] = grays[r + width + x - 1];
      window[7] = grays[r + width + x];
      window[8] = grays[r + width + x + 1];

      for (let i = 1; i < 9; i++) {
        const key = window[i];
        let j = i - 1;
        while (j >= 0 && window[j] > key) {
          window[j + 1] = window[j];
          j--;
        }
        window[j + 1] = key;
      }

      output[r + x] = window[4];
    }
  }

  return output;
}

/**
 * Chromatic Delta Preprocessing (for colored letters, signs, cards)
 */
export function chromaticDeltaPreprocessing(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas.toDataURL('image/png');

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  let bgR = 0, bgG = 0, bgB = 0;
  let bgCount = 0;
  const step = Math.max(1, Math.floor(width / 40));

  for (let x = 0; x < width; x += step) {
    const topIdx = (0 * width + x) * 4;
    const botIdx = ((height - 1) * width + x) * 4;
    bgR += d[topIdx] + d[botIdx];
    bgG += d[topIdx + 1] + d[botIdx + 1];
    bgB += d[topIdx + 2] + d[botIdx + 2];
    bgCount += 2;
  }
  for (let y = 0; y < height; y += step) {
    const leftIdx = (y * width + 0) * 4;
    const rightIdx = (y * width + (width - 1)) * 4;
    bgR += d[leftIdx] + d[rightIdx];
    bgG += d[leftIdx + 1] + d[rightIdx + 1];
    bgB += d[leftIdx + 2] + d[rightIdx + 2];
    bgCount += 2;
  }

  bgR = Math.round(bgR / Math.max(1, bgCount));
  bgG = Math.round(bgG / Math.max(1, bgCount));
  bgB = Math.round(bgB / Math.max(1, bgCount));

  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
  const outputMask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const rOff = y * width;
    for (let x = 0; x < width; x++) {
      const i = (rOff + x) * 4;
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      const colorDist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const lumDist = Math.abs(lum - bgLum);

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;

      const isForeground = colorDist > 40 || lumDist > 42 || (saturation > 0.25 && lumDist > 20);
      outputMask[rOff + x] = isForeground ? 0 : 255;
    }
  }

  for (let idx = 0; idx < width * height; idx++) {
    const val = outputMask[idx];
    const i = idx * 4;
    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Creates image data URL from 1-channel grayscale byte array
 */
function createDataUrlFromGrays(grays: Uint8Array, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const outData = ctx.createImageData(width, height);
  for (let i = 0; i < grays.length; i++) {
    const val = grays[i];
    const o = i * 4;
    outData.data[o] = val;
    outData.data[o + 1] = val;
    outData.data[o + 2] = val;
    outData.data[o + 3] = 255;
  }
  ctx.putImageData(outData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Generate ALL individual preprocessing strategies for systematic benchmarking
 */
export async function generateAllBenchmarkStrategies(
  source: string | File | Blob | HTMLImageElement | HTMLCanvasElement
): Promise<PreprocessCandidate[]> {
  const img = await loadImageElement(source);
  const { canvas: baseCanvas, ctx } = createScaledCanvas(img);
  ctx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);

  const width = baseCanvas.width;
  const height = baseCanvas.height;
  const rawData = ctx.getImageData(0, 0, width, height).data;
  const grays = toGrayscale(rawData);

  // Strategy A: Original Scaled
  const originalUrl = baseCanvas.toDataURL('image/png');

  // Strategy B: Grayscale Only
  const grayscaleUrl = createDataUrlFromGrays(grays, width, height);

  // Strategy C: Contrast Enhanced (Auto-Levels Grayscale)
  const normalizedGrays = normalizeContrast(grays);
  const contrastUrl = createDataUrlFromGrays(normalizedGrays, width, height);

  // Strategy D: Adaptive Threshold (Integral Binarization)
  const adaptiveBinary = adaptiveThreshold(normalizedGrays, width, height, 0.12, 0.14);
  const adaptiveUrl = createDataUrlFromGrays(adaptiveBinary, width, height);

  // Strategy E: Auto Levels + Denoise
  const denoised = denoiseMedian3x3(normalizedGrays, width, height);
  const denoiseUrl = createDataUrlFromGrays(denoised, width, height);

  // Strategy F: Chromatic Delta
  const canvasChromatic = document.createElement('canvas');
  canvasChromatic.width = width;
  canvasChromatic.height = height;
  const chromCtx = canvasChromatic.getContext('2d', { willReadFrequently: true })!;
  chromCtx.drawImage(baseCanvas, 0, 0);
  const chromaticUrl = chromaticDeltaPreprocessing(canvasChromatic);

  return [
    { name: 'Original', dataUrl: originalUrl, description: 'Original Scaled (No Binarization)' },
    { name: 'Grayscale', dataUrl: grayscaleUrl, description: 'Standard Grayscale' },
    { name: 'Contrast Enhanced', dataUrl: contrastUrl, description: 'Auto-Levels Contrast Grayscale' },
    { name: 'Adaptive Threshold', dataUrl: adaptiveUrl, description: 'Integral Image Adaptive Threshold' },
    { name: 'Auto Levels + Denoise', dataUrl: denoiseUrl, description: 'Auto-Levels with 3x3 Median Filter' },
    { name: 'Chromatic Delta', dataUrl: chromaticUrl, description: 'Chromatic Delta Color Separation' }
  ];
}

/**
 * Generate Adaptive Preprocessing Candidates based on Image Quality & Preprocessing Safety Rules
 *
 * SAFETY RULES:
 * 1. Clean, high-contrast documents (quality 'excellent' / 'good' & contrast >= 55%):
 *    -> Use 'Contrast Enhanced (Grayscale)' or 'Original' as PRIMARY candidate!
 *    -> DO NOT apply harsh 1-bit binarization that destroys antialiasing needed by Leptonica.
 * 2. Inverted / Blackboard documents:
 *    -> Invert pixel intensities first.
 * 3. Uneven lighting / Shadows / Low Contrast (< 50%):
 *    -> Use Adaptive Threshold as primary.
 * 4. Tilted documents:
 *    -> Apply deskew before thresholding.
 */
export async function generateAdaptiveCandidates(
  source: string | File | Blob | HTMLImageElement | HTMLCanvasElement,
  quality: ImageQualityReport
): Promise<PreprocessCandidate[]> {
  const img = await loadImageElement(source);
  const candidates: PreprocessCandidate[] = [];

  const { canvas: baseCanvas, ctx } = createScaledCanvas(img);
  ctx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);

  let workingCanvas = baseCanvas;
  if (Math.abs(quality.estimatedSkewAngle) >= 2) {
    workingCanvas = deskewCanvas(baseCanvas, quality.estimatedSkewAngle);
  }

  const width = workingCanvas.width;
  const height = workingCanvas.height;
  const wCtx = workingCanvas.getContext('2d', { willReadFrequently: true })!;
  const rawData = wCtx.getImageData(0, 0, width, height).data;

  let grays = toGrayscale(rawData);

  // Invert if blackboard or white text on dark background
  if (quality.isInverted) {
    for (let i = 0; i < grays.length; i++) {
      grays[i] = 255 - grays[i];
    }
  }

  // Denoise if blurry or poor quality
  if (quality.isBlurry || quality.overallQuality === 'poor') {
    grays = denoiseMedian3x3(grays, width, height);
  }

  const normalizedGrays = normalizeContrast(grays);

  // SAFETY RULE 1: Clean, high-contrast, well-lit document
  const isCleanDocument =
    (quality.overallQuality === 'excellent' || quality.overallQuality === 'good') &&
    quality.contrastScore >= 55 &&
    quality.lighting === 'normal' &&
    !quality.isBlurry;

  if (isCleanDocument && !quality.isInverted) {
    // Primary: Auto-levels Grayscale (preserves smooth character stroke antialiasing)
    candidates.push({
      name: 'contrast_grayscale',
      dataUrl: createDataUrlFromGrays(normalizedGrays, width, height),
      description: 'High-Contrast Grayscale (Antialiasing Preserved)'
    });

    // Secondary: Original Scaled
    candidates.push({
      name: 'original_scaled',
      dataUrl: workingCanvas.toDataURL('image/png'),
      description: 'Scaled Original Document'
    });

    // Tertiary: Adaptive Threshold (in case of subtle gradient)
    const adaptiveBinary = adaptiveThreshold(normalizedGrays, width, height, 0.12, 0.14);
    candidates.push({
      name: 'adaptive_threshold',
      dataUrl: createDataUrlFromGrays(adaptiveBinary, width, height),
      description: 'Local Adaptive Threshold (Shadow Fallback)'
    });

    return candidates;
  }

  // SAFETY RULE 2: Inverted blackboard / dark document
  if (quality.isInverted) {
    candidates.push({
      name: 'inverted_contrast',
      dataUrl: createDataUrlFromGrays(normalizedGrays, width, height),
      description: 'Inverted Blackboard Grayscale'
    });

    const adaptiveBinary = adaptiveThreshold(normalizedGrays, width, height, 0.12, 0.14);
    candidates.push({
      name: 'inverted_adaptive',
      dataUrl: createDataUrlFromGrays(adaptiveBinary, width, height),
      description: 'Inverted Adaptive Binarization'
    });

    return candidates;
  }

  // SAFETY RULE 3: Challenging document (shadows, low contrast, uneven light, blurry)
  const adaptiveBinary = adaptiveThreshold(normalizedGrays, width, height, 0.12, 0.14);
  candidates.push({
    name: 'adaptive_threshold',
    dataUrl: createDataUrlFromGrays(adaptiveBinary, width, height),
    description: 'Local Adaptive Threshold (Handles shadows & uneven lighting)'
  });

  candidates.push({
    name: 'contrast_grayscale',
    dataUrl: createDataUrlFromGrays(normalizedGrays, width, height),
    description: 'Normalized High-Contrast Grayscale'
  });

  // Chromatic Delta for colored text / signage
  const canvasChromatic = document.createElement('canvas');
  canvasChromatic.width = width;
  canvasChromatic.height = height;
  const cChromaticCtx = canvasChromatic.getContext('2d', { willReadFrequently: true })!;
  cChromaticCtx.drawImage(workingCanvas, 0, 0);
  candidates.push({
    name: 'chromatic_delta',
    dataUrl: chromaticDeltaPreprocessing(canvasChromatic),
    description: 'Chromatic Delta Separation'
  });

  candidates.push({
    name: 'original_scaled',
    dataUrl: workingCanvas.toDataURL('image/png'),
    description: 'Scaled Original Document'
  });

  return candidates;
}
