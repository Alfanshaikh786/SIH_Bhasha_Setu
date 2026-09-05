/**
 * Core Type Definitions for Bhasha Setu OCR Pipeline
 */

export type LightingCondition = 'dark' | 'normal' | 'bright';
export type OverallQuality = 'poor' | 'fair' | 'good' | 'excellent';

export interface ImageQualityReport {
  blurScore: number;
  isBlurry: boolean;
  brightnessScore: number; // 0 - 255
  lighting: LightingCondition;
  contrastScore: number; // 0 - 100
  isInverted: boolean; // true if white text on dark background (e.g. blackboard)
  estimatedSkewAngle: number; // in degrees (-15 to +15)
  overallQuality: OverallQuality;
  warnings: string[];
  recommendations: string[];
}

export interface OCRProgress {
  status: string;
  progress: number;
  stage?: string;
}

export interface StrategyBenchmarkItem {
  strategy: string;
  psmMode: string;
  confidence: number;
  charCount: number;
  timeMs: number;
  textPreview: string;
}

export interface OCRBenchmarkReport {
  imageDimensions: { width: number; height: number };
  qualityReport: ImageQualityReport;
  languageUsed: string;
  strategyResults: StrategyBenchmarkItem[];
  psmResults: StrategyBenchmarkItem[];
  bestStrategy: string;
  bestPsm: string;
  bestConfidence: number;
  summary: string;
}

export interface MultiScriptBenchmarkItem {
  testId: string;
  testName: string;
  script: string;
  engine: string;
  modelUsed: string;
  modelStatus: 'Loaded' | 'Available' | 'Not Installed';
  psmMode: string;
  strategyUsed: string;
  engineConfidence: number;
  cer: number; // Character Error Rate
  wer: number; // Word Error Rate
  accuracyPercent: number; // (1 - CER) * 100
  processingTimeMs: number;
  ocrPreview: string;
  groundTruthPreview: string;
  status: 'Supported' | 'Needs Improvement' | 'Custom Model Required';
  notes: string;
}

export interface MultiScriptBenchmarkSuiteReport {
  timestamp: number;
  totalTests: number;
  items: MultiScriptBenchmarkItem[];
  summary: string;
}

export interface OCRDebugInfo {
  originalDimensions: { width: number; height: number };
  preprocessedDimensions: { width: number; height: number };
  qualityReport: ImageQualityReport;
  selectedStrategy: string;
  inversionApplied: boolean;
  deskewApplied: boolean;
  skewAngle: number;
  ocrLanguage: string;
  psmMode: number | string;
  rawConfidence: number;
  charCount: number;
  processingTimeMs: number;
  retryCount: number;
  evaluatedCandidates: { name: string; psm: string; confidence: number; chars: number }[];
  cer?: number;
  wer?: number;
  accuracyPercent?: number;
}

export interface RealOCRResult {
  text: string;
  detectedLanguage: string;
  confidence: number; // 0 - 100 raw engine confidence
  lines: string[];
  wordsCount: number;
  qualityReport?: ImageQualityReport;
  preprocessingMethod?: string;
  warnings?: string[];
  debugInfo?: OCRDebugInfo;
  isCustomModelRequired?: boolean;
  unsupportedMessage?: string;
}

export interface PreprocessCandidate {
  name: string;
  dataUrl: string;
  description: string;
}
