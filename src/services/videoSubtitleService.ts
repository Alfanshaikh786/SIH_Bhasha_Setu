/**
 * Video Subtitle Client Service for Bhasha Setu
 * Connects to the local FastAPI backend (/api/video/...) for real video processing.
 */

const API_BASE = 'http://127.0.0.1:5000/api/video';

export interface SubtitleCue {
  index: number;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  source_text: string;
  text: string;
  translated_text: string;
  speaker: string;
  confidence?: number;
  translation_source: string;
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
    | 'ALIGNING'
    | 'TRANSLATING'
    | 'GENERATING_SUBTITLES'
    | 'VALIDATING'
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
  created_at: number;
  completed_at?: number;
}

export async function submitSubtitleJob(
  file: File,
  sourceLang: string,
  targetLang: string
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_lang', sourceLang);
  formData.append('target_lang', targetLang);

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

export async function fetchJobStatus(jobId: string): Promise<SubtitleJobResponse> {
  const res = await fetch(`${API_BASE}/subtitle-job/${jobId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job status: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function downloadSubtitleFile(jobId: string, format: 'srt' | 'vtt'): Promise<string> {
  const res = await fetch(`${API_BASE}/subtitles/${jobId}.${format}`);
  if (!res.ok) {
    throw new Error(`Failed to download ${format.toUpperCase()} subtitles: HTTP ${res.status}`);
  }
  return await res.text();
}
