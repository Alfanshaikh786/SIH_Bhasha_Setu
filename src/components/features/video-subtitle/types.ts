/**
 * AI Subtitle Studio Data Contracts & Types
 * Bhasha Setu Video Subtitling Module
 */

import { SubtitleCue, MediaRegion, MediaCoverage, ReadinessScore } from '../../../services/videoSubtitleService';

export type { MediaRegion, MediaCoverage, ReadinessScore };

export type AddCueType = 'dialogue' | 'lyrics' | 'instrumental' | 'sfx' | 'custom';
export type WorkspaceViewMode = 'ol_chiki' | 'latin_voice';

export type ReviewSeverity = 'critical' | 'error' | 'warning' | 'info';

export type HumanReviewStatus = 'not_reviewed' | 'review_required' | 'reviewed' | 'edited';

export type ReviewIssueType = 
  | 'timing' 
  | 'overlap' 
  | 'duration' 
  | 'readability' 
  | 'confidence' 
  | 'translation' 
  | 'repetition' 
  | 'empty';

export type SafeCorrectionType = 
  | 'timing_order' 
  | 'boundary_clamp' 
  | 'overlap_fix' 
  | 'line_wrap' 
  | 'split_long' 
  | 'reindex';

export interface SafeCorrection {
  id: string;
  cueId: string;
  cueIndex: number;
  type: SafeCorrectionType;
  title: string;
  description: string;
  beforeValue?: string;
  afterValue?: string;
}

export interface ReviewIssue {
  id: string;
  cueId: string;
  cueIndex: number;
  timeSec: number;
  type: ReviewIssueType;
  title: string;
  description: string;
  severity: ReviewSeverity;
  isFixable: boolean;
  suggestedFix?: {
    type: SafeCorrectionType;
    label: string;
    description: string;
  };
}

export type ContentMode = 'song_lyrics' | 'speech_dialogue' | 'instrumental' | 'mixed';

export interface StudioCue extends SubtitleCue {
  /** Unique stable ID for React rendering and history diffing */
  id: string;
  /** Visual & validation status */
  status: 'valid' | 'warning' | 'error';
  /** Human review status lifecycle */
  humanReviewStatus: HumanReviewStatus;
  /** Specific validation warning descriptions */
  warnings: string[];
  /** Issues mapped directly to this cue */
  issues: ReviewIssue[];
  /** Inline readability feedback (e.g., exceeds 42 chars/line or 2 lines) */
  readabilityWarning?: string;
  /** Content classification mode */
  content_mode?: ContentMode;
  content_mode_label?: string;
}

export interface ValidationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface StudioValidationReport {
  valid: boolean;
  checks: ValidationCheck[];
  issues: ReviewIssue[];
  criticalErrors: ReviewIssue[];
  errors: ReviewIssue[];
  warnings: ReviewIssue[];
  infos: ReviewIssue[];
  fatalErrors: string[];
  segmentsChecked: number;
  reviewRequiredCount: number;
  safeFixesAvailableCount: number;
}

export interface StudioQualityScore {
  score: number; // 0 - 100
  rating: 'Excellent' | 'Good' | 'Needs Review' | 'Critical Issues';
  description: string;
  breakdown: {
    recognition: number; // 0 - 100
    timing: number;      // 0 - 100
    readability: number; // 0 - 100
    translation: number; // 0 - 100
    unicode: number;     // 0 - 100
  };
}

export interface ReviewSummaryStats {
  totalCues: number;
  reviewedCount: number;
  reviewRequiredCount: number;
  editedCount: number;
  criticalCount: number;
  warningCount: number;
  qualityScore: number;
  translationCoveragePct: number;
}

export type SubtitleFilterOption = 
  | 'all' 
  | 'review_required' 
  | 'critical' 
  | 'low_confidence' 
  | 'neural' 
  | 'untranslated' 
  | 'timing' 
  | 'readability' 
  | 'repetition' 
  | 'reviewed' 
  | 'edited';

export type SubtitleViewMode = 'translation' | 'source_translation';

export interface EditorHistoryState {
  cues: StudioCue[];
  selectedCueId: string | null;
}

// -------------------------------------------------------------
// PHASE 3: Subtitle Styling, Modes & Publishing Types
// -------------------------------------------------------------

export type SubtitleFontFamily = 'default' | 'sans' | 'serif' | 'ol_chiki';
export type SubtitleFontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type SubtitleFontWeight = 'regular' | 'medium' | 'bold';
export type SubtitleAlignment = 'left' | 'center' | 'right';
export type SubtitlePosition = 'bottom' | 'center' | 'top';
export type SubtitleBackground = 'none' | 'semi_transparent' | 'solid';
export type SubtitleTextEffect = 'none' | 'shadow' | 'outline';

export interface SubtitleStyleConfig {
  fontFamily: SubtitleFontFamily;
  fontSize: SubtitleFontSize;
  fontWeight: SubtitleFontWeight;
  alignment: SubtitleAlignment;
  position: SubtitlePosition;
  background: SubtitleBackground;
  textEffect: SubtitleTextEffect;
  presetId?: string;
}

export type SubtitleDisplayMode = 
  | 'native'             // Target language only (e.g. Santali Ol Chiki)
  | 'original'           // Source language only
  | 'original_native'    // Source on top, Target below
  | 'native_original'    // Target on top, Source below
  | 'native_romanized'   // Target on top, Romanized pronunciation below
  | 'romanized';         // Romanized pronunciation only

export interface SubtitleStylePreset {
  id: string;
  name: string;
  description: string;
  config: SubtitleStyleConfig;
}

export type ExportPresetId = 
  | 'standard_subtitles' // SRT + VTT
  | 'web_video'          // Web-optimized SRT + VTT
  | 'social_video'       // Burned-in MP4 (High contrast bottom center)
  | 'educational'        // Bilingual Burned-in MP4 (Original + Native)
  | 'accessibility';     // Large High-Contrast Burned-in MP4

export interface ExportPreset {
  id: ExportPresetId;
  name: string;
  description: string;
  defaultMode: SubtitleDisplayMode;
  defaultStyleId: string;
  outputFormats: string[];
}

export interface SessionExportItem {
  id: string;
  format: 'srt' | 'vtt' | 'mp4';
  presetName: string;
  timestamp: string;
  filename: string;
  url?: string;
  blobUrl?: string;
  sizeBytes?: number;
}

export interface AccessibilityAuditCheck {
  id: string;
  label: string;
  passed: boolean;
  severity: 'pass' | 'warning' | 'fail';
  detail: string;
}

export interface AccessibilityAudit {
  overallCompliant: boolean;
  score: number; // 0 - 100
  checks: AccessibilityAuditCheck[];
  safeAreaNotice: string;
  contrastRatio: number;
}

export type BurnJobStatus = 
  | 'QUEUED'
  | 'PREPARING'
  | 'GENERATING_SUBTITLES'
  | 'ENCODING'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'FAILED';

export interface BurnJobResponse {
  burn_job_id: string;
  status: BurnJobStatus;
  current_stage: string;
  original_filename?: string;
  subtitle_count?: number;
  subtitle_mode?: string;
  has_output_file?: boolean;
  error?: string;
}

// ============================================================================
// Phase 4D: Precision Subtitle Synchronization & Speech-Aware Snapping
// ============================================================================

export type SnapPointType = 'speech_start' | 'speech_end' | 'pause' | 'speaker_change';

export interface SnapPoint {
  timestamp: number;
  type: SnapPointType;
  confidence?: number;
  speaker?: string;
  label?: string;
}

export interface SnapResult {
  snappedTime: number;
  didSnap: boolean;
  snapPoint?: SnapPoint;
}

