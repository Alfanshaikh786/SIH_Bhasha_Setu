/**
 * Script Capability Registry & Matrix for Bhasha Setu OCR
 * Transparently defines supported vs unsupported scripts and their underlying models.
 */

export type SupportedScriptSelection =
  | 'auto'
  | 'latin'
  | 'devanagari'
  | 'mixed'
  | 'ol_chiki'
  | 'warang_chiti';

export interface ScriptCapabilityInfo {
  scriptKey: SupportedScriptSelection;
  label: string;
  scriptName: string;
  engine: 'Tesseract.js' | 'Custom Model Required';
  modelName: string;
  modelStatus: 'Loaded' | 'Available' | 'Not Installed';
  isSupported: boolean;
  tesseractLang?: string;
  description: string;
  limitations: string;
}

export const SCRIPT_CAPABILITY_MATRIX: Record<SupportedScriptSelection, ScriptCapabilityInfo> = {
  auto: {
    scriptKey: 'auto',
    label: 'Auto (Supported Scripts)',
    scriptName: 'Auto Detection (Latin & Devanagari)',
    engine: 'Tesseract.js',
    modelName: 'eng+hin.traineddata',
    modelStatus: 'Available',
    isSupported: true,
    tesseractLang: 'eng+hin',
    description: 'Automatically arbitrates between English and Hindi based on detected character sets.',
    limitations: 'Only routes between verified models (Latin & Devanagari). Does not fabricate tribal script recognition.'
  },
  latin: {
    scriptKey: 'latin',
    label: 'English / Latin Script',
    scriptName: 'Latin Alphabet',
    engine: 'Tesseract.js',
    modelName: 'eng.traineddata',
    modelStatus: 'Available',
    isSupported: true,
    tesseractLang: 'eng',
    description: 'Full printed Latin script recognition for English and Romanized tribal texts.',
    limitations: 'Specialized phonetic diacritics may require post-processing correction.'
  },
  devanagari: {
    scriptKey: 'devanagari',
    label: 'Hindi / Devanagari Script',
    scriptName: 'Devanagari Script',
    engine: 'Tesseract.js',
    modelName: 'hin.traineddata',
    modelStatus: 'Available',
    isSupported: true,
    tesseractLang: 'hin',
    description: 'Devanagari script recognition for Hindi, Bhili, Gondi, and regional tribal dialects.',
    limitations: 'Requires clean Shirorekha headline continuity; low-resolution camera images may degrade conjuncts.'
  },
  mixed: {
    scriptKey: 'mixed',
    label: 'Mixed (English + Hindi)',
    scriptName: 'Bilingual Latin & Devanagari',
    engine: 'Tesseract.js',
    modelName: 'eng+hin.traineddata',
    modelStatus: 'Available',
    isSupported: true,
    tesseractLang: 'eng+hin',
    description: 'Simultaneous bilingual parsing of administrative notices, signage, and government documents.',
    limitations: 'Slightly higher memory footprint than single-language models; may occasionally cross-substitute similar punctuation.'
  },
  ol_chiki: {
    scriptKey: 'ol_chiki',
    label: 'Santali / Ol Chiki Script',
    scriptName: 'Ol Chiki (Santali)',
    engine: 'Custom Model Required',
    modelName: 'sat.traineddata (Not in standard Tesseract repository)',
    modelStatus: 'Not Installed',
    isSupported: false,
    description: 'Santali community script created by Pandit Raghunath Murmu.',
    limitations: 'Standard Tesseract.js does NOT contain trained Ol Chiki weights (HTTP 404 on sat.traineddata). Image enhancement is supported, but character recognition requires a custom trained ONNX or LiteRT model.'
  },
  warang_chiti: {
    scriptKey: 'warang_chiti',
    label: 'Ho / Warang Chiti Script',
    scriptName: 'Warang Chiti (Ho)',
    engine: 'Custom Model Required',
    modelName: 'hoc (Not in standard Tesseract repository)',
    modelStatus: 'Not Installed',
    isSupported: false,
    description: 'Ho tribal script created by Lako Bodra.',
    limitations: 'No standard open-source OCR weights exist. Requires bespoke dataset annotation and custom model training.'
  }
};

export function getScriptCapability(key: SupportedScriptSelection): ScriptCapabilityInfo {
  return SCRIPT_CAPABILITY_MATRIX[key] || SCRIPT_CAPABILITY_MATRIX.auto;
}
