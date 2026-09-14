/**
 * Video Subtitle Client Service for Bhasha Setu
 * Connects to the local FastAPI backend (/api/video/...) for real video processing.
 * Includes media classification, coverage statistics, confidence gating, and TTS routing.
 */

const API_BASE = 'http://127.0.0.1:5000/api/video';

export interface SubtitleCue {
  index: number;
  id?: string;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  source_text: string;
  text: string;
  translated_text: string;
  romanized_text?: string;
  tts_text?: string;
  speaker: string;
  confidence?: number;
  recognition_confidence?: number;
  translation_source: string;
  domain?: string;
  source_language?: string;
  target_language?: string;
  target_script?: string;
  media_type?: 'speech' | 'singing' | 'instrumental' | 'silence' | 'unknown';
  review_status?: 'AUTO_GENERATED' | 'REVIEW_REQUIRED' | 'HUMAN_EDITED' | 'HUMAN_VERIFIED' | 'APPROVED';
  translation_status?: 'NOT_TRANSLATED' | 'GENERATED' | 'MACHINE_TRANSLATED' | 'STALE' | 'REVIEW_REQUIRED' | 'HUMAN_VERIFIED' | 'APPROVED';
  verification_status?: 'UNVERIFIED' | 'VERIFIED';
  provenance?: {
    recognition?: string;
    translation?: string;
    tts?: string;
  };
  is_stale?: boolean;
  cps?: number;
  line_count?: number;
  character_count?: number;
  audio_available?: boolean;
  tts_status?: 'IDLE' | 'GENERATING' | 'READY' | 'FAILED';
}

export interface MediaRegion {
  id: string;
  start: number;
  end: number;
  duration: number;
  type: 'speech' | 'singing' | 'instrumental' | 'silence' | 'unknown';
  confidence: number;
  rms: number;
  speech_probability: number;
  music_probability: number;
  notes: string;
}

export interface MediaCoverage {
  total_duration_sec: number;
  recognized_speech_sec: number;
  recognized_singing_sec: number;
  vocal_total_sec: number;
  instrumental_sec: number;
  silence_sec: number;
  unclassified_sec: number;
  subtitle_coverage_sec: number;
  subtitle_coverage_pct: number;
  timeline_coverage_pct: number;
  summary_label: string;
}

export interface ReadinessScore {
  score: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_REVIEW' | 'BLOCKED';
  cap_reason?: string | null;
  requires_review: boolean;
  pending_review_count: number;
  human_verified_count: number;
  total_cues: number;
  breakdown: {
    recognition: number;
    translation: number;
    timing: number;
    readability: number;
    unicode: number;
    coverage: number;
  };
  category_issues: {
    recognition: number;
    translation: number;
    timing: number;
    readability: number;
    unicode: number;
  };
}

export interface SubtitleValidation {
  valid: boolean;
  fatal_errors: string[];
  warnings: string[];
  segments_checked: number;
  review_required: number;
}

export interface SubtitleJobResponse {
  job_id: string;
  status:
    | 'QUEUED'
    | 'ANALYZING_VIDEO'
    | 'EXTRACTING_AUDIO'
    | 'TRANSCRIBING'
    | 'MEDIA_CLASSIFICATION'
    | 'ALIGNING'
    | 'TRANSLATING'
    | 'GENERATING_SUBTITLES'
    | 'VALIDATING'
    | 'READY_FOR_REVIEW'
    | 'COMPLETED'
    | 'FAILED';
  current_stage: string;
  progress: number;
  error?: string;
  original_filename: string;
  video_duration_sec: number;
  source_language: string;
  detected_language?: string;
  target_language: string;
  transcript_text: string;
  subtitle_count: number;
  preview_segments: SubtitleCue[];
  validation?: SubtitleValidation;
  media_regions?: MediaRegion[];
  media_coverage?: MediaCoverage;
  readiness_score?: ReadinessScore;
  content_mode?: 'song_lyrics' | 'speech_dialogue' | 'instrumental' | 'mixed';
  content_mode_label?: string;
  created_at: number;
  completed_at?: number;
}

export async function submitSubtitleJob(
  file: File,
  sourceLang: string,
  targetLang: string,
  contentMode: string = 'auto'
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_lang', sourceLang);
  formData.append('target_lang', targetLang);
  formData.append('content_mode', contentMode);

  const res = await fetch(`${API_BASE}/subtitle-job`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    let errorDetail = 'Failed to submit subtitle job';
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      errorDetail = `Server returned HTTP ${res.status}`;
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function setJobContentMode(jobId: string, contentMode: string): Promise<{
  job_id: string;
  content_mode: string;
  content_mode_label: string;
}> {
  const formData = new FormData();
  formData.append('job_id', jobId);
  formData.append('content_mode', contentMode);

  const res = await fetch(`${API_BASE}/set-content-mode`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Failed to update content mode: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function alignJobLyrics(
  jobId: string, 
  lyricsText: string, 
  targetLang: string = 'sat'
): Promise<{
  job_id: string;
  success: boolean;
  cues: SubtitleCue[];
  content_mode?: string;
  content_mode_label?: string;
  message: string;
}> {
  const formData = new FormData();
  formData.append('job_id', jobId);
  formData.append('lyrics_text', lyricsText);
  formData.append('target_lang', targetLang);

  const res = await fetch(`${API_BASE}/align-lyrics`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    let errorDetail = 'Failed to align lyrics';
    try {
      const data = await res.json();
      if (data.detail) errorDetail = data.detail;
    } catch {}
    throw new Error(errorDetail);
  }
  return await res.json();
}

export async function fetchJobStatus(jobId: string): Promise<SubtitleJobResponse> {
  const res = await fetch(`${API_BASE}/subtitle-job/${jobId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job status: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function updateCueSource(jobId: string, cueId: string, sourceText: string): Promise<SubtitleCue> {
  const formData = new FormData();
  formData.append('job_id', jobId);
  formData.append('cue_id', cueId);
  formData.append('source_text', sourceText);

  const res = await fetch(`${API_BASE}/cue/update-source`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Failed to update cue source: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.cue;
}

export async function regenerateCueTranslation(jobId: string, cueId: string, targetLang?: string): Promise<SubtitleCue> {
  const formData = new FormData();
  formData.append('job_id', jobId);
  formData.append('cue_id', cueId);
  if (targetLang) formData.append('target_lang', targetLang);

  const res = await fetch(`${API_BASE}/cue/regenerate-translation`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Failed to regenerate cue translation: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.cue;
}

export async function approveCue(jobId: string, cueId: string): Promise<SubtitleCue> {
  const formData = new FormData();
  formData.append('job_id', jobId);
  formData.append('cue_id', cueId);

  const res = await fetch(`${API_BASE}/cue/approve`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Failed to approve cue: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.cue;
}

export async function synthesizeTTS(text: string, language: string = 'sat', script: string = 'Ol Chiki', speed: number = 1.0): Promise<any> {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('language', language);
  formData.append('script', script);
  formData.append('speed', String(speed));

  const res = await fetch(`${API_BASE}/tts/synthesize`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Failed to synthesize TTS: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchTTSVoices(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/tts/voices`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.voices || [];
}

export async function downloadSubtitleFile(jobId: string, format: 'srt' | 'vtt'): Promise<string> {
  const res = await fetch(`${API_BASE}/subtitles/${jobId}.${format}`);
  if (!res.ok) {
    throw new Error(`Failed to download ${format.toUpperCase()} subtitles: HTTP ${res.status}`);
  }
  return await res.text();
}

export interface BurnSubtitlesRequest {
  jobId: string;
  cues: any[];
  styleOpts?: any;
  subtitleMode?: string;
}

export async function requestBurnSubtitles(req: BurnSubtitlesRequest): Promise<{ burn_job_id: string; status: string; current_stage: string }> {
  const formData = new FormData();
  formData.append('job_id', req.jobId);
  formData.append('cues_json', JSON.stringify(req.cues));
  if (req.styleOpts) {
    formData.append('style_json', JSON.stringify(req.styleOpts));
  }
  formData.append('subtitle_mode', req.subtitleMode || 'native');

  const res = await fetch(`${API_BASE}/burn-subtitles`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    let err = 'Failed to submit burn job';
    try {
      const data = await res.json();
      if (data.detail) err = data.detail;
    } catch {}
    throw new Error(err);
  }

  return await res.json();
}

export async function pollBurnJobStatus(burnJobId: string): Promise<{
  burn_job_id: string;
  status: string;
  current_stage: string;
  has_output_file?: boolean;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/burn-job/${burnJobId}`);
  if (!res.ok) {
    throw new Error(`Failed to check burn job status: HTTP ${res.status}`);
  }
  return await res.json();
}

export function getBurnedVideoDownloadUrl(burnJobId: string): string {
  return `${API_BASE}/burned-video/${burnJobId}`;
}
