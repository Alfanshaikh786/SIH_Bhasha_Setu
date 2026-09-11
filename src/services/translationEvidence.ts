/**
 * Translation Evidence and Provenance Model for Bhasha Setu
 * 
 * Provides verifiable audit trail and linguistic provenance for every translation.
 * Enforces zero-fabrication and transparency: the user always knows whether
 * a result originated from the verified local dataset, an exact phrase bank,
 * an in-browser SQLite database, or an unofficial online web bridge.
 */

export type EvidenceSourceType =
  | 'local_dataset'     // In-memory verified Santali dataset (santaliDataset.ts)
  | 'phrase_bank'       // Pre-compiled colloquial phrase bank (TRANSLATION_MAP)
  | 'sqlite_wasm'       // Local SQLite WASM database (translations.db)
  | 'local_postgres'    // Local LAN edge server (FastAPI / PostgreSQL)
  | 'on_device_model'   // Browser-embedded ONNX / LiteRT neural model
  | 'online_bridge'     // Google Translate / MyMemory web bridge
  | 'vocabulary_bank';  // Word-level lexicon assistance (Mundari / Ho)

export type VerificationState =
  | 'verified'          // Verified by native linguists / curated parallel corpus
  | 'dataset_backed'    // Found in curated dictionary / dataset
  | 'experimental'      // Web bridge output, unverified by linguist
  | 'vocabulary_only'   // Term-level lookup only, not a grammatical sentence
  | 'unverified';       // Community contribution or uncertain origin

export type MatchCategory =
  | 'exact_phrase'      // 100% exact phrase match
  | 'normalized_exact'  // Exact match after punctuation/case normalization
  | 'fuzzy_lexicon'     // High-confidence token intersection match
  | 'neural_bridge'     // Machine translation inference
  | 'vocabulary_lookup' // Isolated dictionary word lookup
  | 'identity';         // Same-language passthrough

export interface TranslationEvidence {
  /** Identifier of the evidence package */
  id: string;
  /** Primary source category */
  sourceType: EvidenceSourceType;
  /** Human-readable provider title */
  providerName: string;
  /** Verification grade */
  verificationStatus: VerificationState;
  /** Whether the translation was computed 100% offline without network */
  isOffline: boolean;
  /** Whether active internet access was required */
  internetRequired: boolean;
  /** Original dataset row ID if matched from dataset / database */
  datasetRowId?: string | number;
  /** Semantic domain / category (e.g., Classroom, Healthcare, Animal) */
  domain?: string;
  /** Method of match resolution */
  matchCategory: MatchCategory;
  /** Detected or generated script in target text */
  targetScript: string;
  /** Phonetic transliteration string if available */
  transliteration?: string;
  /** Timestamp when the translation was resolved */
  timestamp: number;
  /** Transparent disclaimer or notes */
  notes?: string;
}

/**
 * Generates human-friendly badge properties for displaying evidence in UI
 */
export function getEvidenceBadge(evidence: TranslationEvidence): {
  label: string;
  colorClass: string;
  icon: string;
  description: string;
} {
  switch (evidence.verificationStatus) {
    case 'verified':
      return {
        label: 'Verified Dataset',
        colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        icon: '✓',
        description: 'Human-verified parallel sentence from curated tribal corpus.'
      };
    case 'dataset_backed':
      return {
        label: 'Local Database',
        colorClass: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: '📚',
        description: 'Retrieved from offline SQLite classroom database.'
      };
    case 'vocabulary_only':
      return {
        label: 'Vocabulary Assistance Only',
        colorClass: 'bg-amber-50 border-amber-200 text-amber-800',
        icon: '📖',
        description: 'Single-term vocabulary reference — NOT a sentence translation.'
      };
    case 'experimental':
      return {
        label: 'Online Web Bridge',
        colorClass: 'bg-purple-50 border-purple-200 text-purple-800',
        icon: '🌐',
        description: 'Generated via online translation bridge (requires internet).'
      };
    default:
      return {
        label: 'Unverified',
        colorClass: 'bg-slate-100 border-slate-200 text-slate-700',
        icon: 'ℹ️',
        description: 'Linguistic verification state unconfirmed.'
      };
  }
}
