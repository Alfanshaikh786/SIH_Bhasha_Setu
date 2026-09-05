/**
 * Image Quality Analysis Service for Bhasha Setu
 * Analyzes blur (Laplacian variance), brightness, contrast, blackboard/inversion, and tilt.
 */

import { ImageQualityReport } from './types';

/**
 * Loads an image source (URL, File, Blob, HTMLImageElement, HTMLCanvasElement)
 */
export function loadImageElement(source: string | File | Blob | HTMLImageElement | HTMLCanvasElement): Promise<HTMLImageElement> {
  if (source instanceof HTMLImageElement) {
    if (source.complete) return Promise.resolve(source);
    return new Promise((resolve, reject) => {
      source.onload = () => resolve(source);
      source.onerror = reject;
    });
  }

  if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = source.toDataURL();
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source as Blob);
    }
  });
}

/**
 * Perform comprehensive image quality analysis on an image source.
 */
export async function analyzeImageQuality(
  source: string | File | Blob | HTMLImageElement | HTMLCanvasElement
): Promise<ImageQualityReport> {
  const img = await loadImageElement(source);
  const naturalWidth = img.naturalWidth || img.width || 400;
  const naturalHeight = img.naturalHeight || img.height || 300;

  // Scale down for fast, non-blocking analysis (max 360px on longest edge)
  const maxDim = 360;
  const scale = Math.min(1, maxDim / Math.max(naturalWidth, naturalHeight));
  const w = Math.max(32, Math.round(naturalWidth * scale));
  const h = Math.max(32, Math.round(naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      blurScore: 150,
      isBlurry: false,
      brightnessScore: 128,
      lighting: 'normal',
      contrastScore: 60,
      isInverted: false,
      estimatedSkewAngle: 0,
      overallQuality: 'good',
      warnings: [],
      recommendations: []
    };
  }

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const totalPixels = w * h;

  // 1. Convert to grayscale array and compute luminance stats
  const grays = new Float32Array(totalPixels);
  let sumLum = 0;
  let sumSqLum = 0;

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    const r = d[offset];
    const g = d[offset + 1];
    const b = d[offset + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    grays[i] = lum;
    sumLum += lum;
    sumSqLum += lum * lum;
  }

  const meanLum = sumLum / totalPixels;
  const varianceLum = Math.max(0, (sumSqLum / totalPixels) - (meanLum * meanLum));
  const stdDevLum = Math.sqrt(varianceLum);

  // 2. Brightness & Lighting Condition
  const brightnessScore = Math.round(meanLum);
  let lighting: 'dark' | 'normal' | 'bright' = 'normal';
  if (meanLum < 70) {
    lighting = 'dark';
  } else if (meanLum > 200) {
    lighting = 'bright';
  }

  // 3. Contrast Score (RMS contrast normalized to 0 - 100)
  const contrastScore = Math.min(100, Math.max(5, Math.round((stdDevLum / 64) * 100)));

  // 4. Blur detection using 3x3 Laplacian kernel variance
  // Kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let laplacianCount = 0;

  for (let y = 1; y < h - 1; y++) {
    const rowOffset = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = rowOffset + x;
      const center = grays[idx];
      const up = grays[idx - w];
      const down = grays[idx + w];
      const left = grays[idx - 1];
      const right = grays[idx + 1];

      const lap = up + down + left + right - (4 * center);
      laplacianSum += lap;
      laplacianSqSum += lap * lap;
      laplacianCount++;
    }
  }

  const laplacianMean = laplacianSum / Math.max(1, laplacianCount);
  const laplacianVariance = Math.max(0, (laplacianSqSum / Math.max(1, laplacianCount)) - (laplacianMean * laplacianMean));
  const blurScore = Math.round(laplacianVariance * 10) / 10;
  const isBlurry = blurScore < 85;

  // 5. Blackboard / Dark-Background Inversion Detection
  // Sample perimeter border vs center pixels
  let borderSum = 0;
  let borderCount = 0;
  const borderStep = Math.max(1, Math.floor(w / 30));

  for (let x = 0; x < w; x += borderStep) {
    borderSum += grays[0 * w + x];
    borderSum += grays[(h - 1) * w + x];
    borderCount += 2;
  }
  for (let y = 0; y < h; y += borderStep) {
    borderSum += grays[y * w + 0];
    borderSum += grays[y * w + (w - 1)];
    borderCount += 2;
  }
  const borderMean = borderSum / Math.max(1, borderCount);

  // Center 60% luminance sample
  let centerSum = 0;
  let centerCount = 0;
  let brightPixelCount = 0;
  const startX = Math.floor(w * 0.2);
  const endX = Math.floor(w * 0.8);
  const startY = Math.floor(h * 0.2);
  const endY = Math.floor(h * 0.8);

  for (let y = startY; y < endY; y += 2) {
    const rowOffset = y * w;
    for (let x = startX; x < endX; x += 2) {
      const val = grays[rowOffset + x];
      centerSum += val;
      centerCount++;
      if (val > 140) brightPixelCount++;
    }
  }
  const centerMean = centerSum / Math.max(1, centerCount);

  // If background/border is dark (< 90) and contains noticeable brighter text/chalk strokes
  const isInverted = borderMean < 90 && (centerMean > borderMean + 15 || (brightPixelCount / Math.max(1, centerCount)) > 0.08);

  // 6. Tilt / Skew Angle Estimation (-12° to +12° via projection variance)
  let estimatedSkewAngle = 0;
  try {
    let maxProjVariance = -1;
    // Test angles in 2-degree increments
    const anglesToTest = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
    const cx = w / 2;
    const cy = h / 2;

    for (const angle of anglesToTest) {
      if (angle === 0) {
        // Horizontal projection directly on rows
        let rowSumTotal = 0;
        let rowSqSumTotal = 0;
        for (let y = 0; y < h; y++) {
          let rowLum = 0;
          const rOff = y * w;
          for (let x = 0; x < w; x += 3) {
            rowLum += grays[rOff + x];
          }
          rowSumTotal += rowLum;
          rowSqSumTotal += rowLum * rowLum;
        }
        const rowMean = rowSumTotal / h;
        const rowVariance = (rowSqSumTotal / h) - (rowMean * rowMean);
        if (rowVariance > maxProjVariance) {
          maxProjVariance = rowVariance;
          estimatedSkewAngle = 0;
        }
        continue;
      }

      // Rotated projection check
      const rad = (angle * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      const bins = new Float32Array(h);
      const binCounts = new Int32Array(h);

      for (let y = startY; y < endY; y += 4) {
        const dy = y - cy;
        for (let x = startX; x < endX; x += 4) {
          const dx = x - cx;
          // Rotate coordinates to find projected Y
          const projY = Math.round(cy + (-dx * sinA + dy * cosA));
          if (projY >= 0 && projY < h) {
            bins[projY] += grays[y * w + x];
            binCounts[projY]++;
          }
        }
      }

      let pSum = 0;
      let pSqSum = 0;
      let validBins = 0;
      for (let b = 0; b < h; b++) {
        if (binCounts[b] > 0) {
          const avg = bins[b] / binCounts[b];
          pSum += avg;
          pSqSum += avg * avg;
          validBins++;
        }
      }

      if (validBins > 10) {
        const pMean = pSum / validBins;
        const pVariance = (pSqSum / validBins) - (pMean * pMean);
        if (pVariance > maxProjVariance) {
          maxProjVariance = pVariance;
          estimatedSkewAngle = angle;
        }
      }
    }
  } catch {
    estimatedSkewAngle = 0;
  }

  // 7. Overall Quality Assessment & User Feedback
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let qualityPoints = 100;

  if (isBlurry) {
    qualityPoints -= 35;
    warnings.push('Image appears blurry or out of focus.');
    recommendations.push('Hold the camera steady and tap to focus on the text.');
  }

  if (lighting === 'dark') {
    qualityPoints -= 25;
    warnings.push('Image is dark with insufficient lighting.');
    recommendations.push('Capture the document under brighter light or enable camera flash.');
  } else if (lighting === 'bright') {
    qualityPoints -= 15;
    warnings.push('Image has intense highlights or glare.');
    recommendations.push('Avoid direct camera flash reflection or glare on glossy paper.');
  }

  if (contrastScore < 35) {
    qualityPoints -= 20;
    warnings.push('Low contrast between text and background.');
    recommendations.push('Ensure writing or print is dark enough against the background.');
  }

  if (isInverted) {
    warnings.push('Detected white text on dark background (blackboard/slate). Auto-inversion will be applied.');
  }

  if (Math.abs(estimatedSkewAngle) >= 4) {
    recommendations.push(`Document is tilted by approx ${estimatedSkewAngle}°. Auto-deskew will align the text.`);
  }

  let overallQuality: 'poor' | 'fair' | 'good' | 'excellent' = 'excellent';
  if (qualityPoints < 50) {
    overallQuality = 'poor';
  } else if (qualityPoints < 72) {
    overallQuality = 'fair';
  } else if (qualityPoints < 88) {
    overallQuality = 'good';
  } else {
    overallQuality = 'excellent';
  }

  return {
    blurScore,
    isBlurry,
    brightnessScore,
    lighting,
    contrastScore,
    isInverted,
    estimatedSkewAngle,
    overallQuality,
    warnings,
    recommendations
  };
}
