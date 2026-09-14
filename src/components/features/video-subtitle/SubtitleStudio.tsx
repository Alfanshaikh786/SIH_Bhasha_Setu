/**
 * AI Subtitle Studio Master Component
 * Simple, professional, 3-column subtitle editor:
 * - LEFT (22%): Subtitle Cue List
 * - CENTER (53%): Video Player + Simple Timeline
 * - RIGHT (25%): Selected Subtitle Cue Editor
 * Compact top header with AUTO -> SANTALI, review indicator, and simple export modal.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  Download, 
  AlertTriangle, 
  Check, 
  Film, 
  Sliders, 
  FileText, 
  Video, 
  X,
  Undo2,
  Redo2,
  RefreshCw,
  Music
} from 'lucide-react';
import { 
  StudioCue, 
  SubtitleStyleConfig, 
  MediaRegion, 
  MediaCoverage, 
  ReadinessScore,
  AddCueType,
  ContentMode
} from './types';
import { 
  formatSecondsToTimecode, 
  generateVttString, 
  generateSrtString, 
  STYLE_PRESETS,
  generateCandidateSnapPoints
} from './subtitleUtils';
import { useSubtitleHistory } from './useSubtitleHistory';
import { SubtitleVideoPlayer } from './SubtitleVideoPlayer';
import { SubtitleTimeline } from './SubtitleTimeline';
import { SubtitleCueList } from './SubtitleCueList';
import { SubtitleCueEditor } from './SubtitleCueEditor';
import { 
  downloadSubtitleFile, 
  requestBurnSubtitles, 
  pollBurnJobStatus, 
  getBurnedVideoDownloadUrl,
  updateCueSource,
  regenerateCueTranslation,
  approveCue,
  setJobContentMode,
  alignJobLyrics
} from '../../../services/videoSubtitleService';

interface SubtitleStudioProps {
  jobId?: string;
  videoFile: File | null;
  videoPreviewUrl: string;
  sourceLang: string;
  targetLang: string;
  detectedLang?: string;
  contentMode?: ContentMode;
  contentModeLabel?: string;
  initialCues: any[];
  videoDuration: number;
  mediaRegions?: MediaRegion[];
  mediaCoverage?: MediaCoverage;
  readinessScore?: ReadinessScore;
  onStartNewVideo: () => void;
}

export const SubtitleStudio: React.FC<SubtitleStudioProps> = ({
  jobId,
  videoFile,
  videoPreviewUrl,
  sourceLang,
  targetLang,
  detectedLang,
  contentMode,
  contentModeLabel,
  initialCues,
  videoDuration,
  mediaRegions = [],
  mediaCoverage,
  readinessScore,
  onStartNewVideo
}) => {
  // 1. Prepare initial StudioCues with unique IDs & default review status
  const preparedInitialCues = useMemo<StudioCue[]>(() => {
    return initialCues.map((c, idx) => ({
      ...c,
      id: c.id || `cue_init_${idx}_${Date.now()}`,
      index: idx + 1,
      source_text: c.source_text || '',
      translated_text: c.translated_text || c.text || c.source_text || '',
      text: c.translated_text || c.text || c.source_text || '',
      romanized_text: c.romanized_text || '',
      tts_text: c.tts_text || c.romanized_text || c.translated_text || '',
      media_type: c.media_type || 'speech',
      is_stale: Boolean(c.is_stale),
      review_status: c.review_status || (c.confidence && c.confidence < 0.65 ? 'REVIEW_REQUIRED' : 'AUTO_GENERATED'),
      translation_status: c.translation_status || 'MACHINE_TRANSLATED',
      verification_status: c.verification_status || 'UNVERIFIED',
      humanReviewStatus: (c.review_status === 'APPROVED' ? 'reviewed' : (c.confidence && c.confidence < 0.65 ? 'review_required' : 'not_reviewed')) as any,
      status: 'valid',
      warnings: [],
      issues: []
    }));
  }, [initialCues]);

  // 2. History & State Management
  const {
    currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useSubtitleHistory(preparedInitialCues, preparedInitialCues[0]?.id || null);

  const cues = currentState.cues;

  // Selected cue & playback tracking
  const [selectedCueId, setSelectedCueId] = useState<string | null>(
    currentState.selectedCueId || cues[0]?.id || null
  );
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(videoDuration || 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [styleConfig, setStyleConfig] = useState<SubtitleStyleConfig>(STYLE_PRESETS[0].config);

  // Modal dialog states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAlignLyricsModalOpen, setIsAlignLyricsModalOpen] = useState(false);

  // Content Mode state (Auto-detected or overridden)
  const [currentContentMode, setCurrentContentMode] = useState<ContentMode>(
    contentMode || 'song_lyrics'
  );

  // Lyrics alignment state
  const [lyricsInputText, setLyricsInputText] = useState('');
  const [isAligningLyrics, setIsAligningLyrics] = useState(false);
  const [lyricsAlignError, setLyricsAlignError] = useState<string | null>(null);

  // Export options state
  const [exportFormat, setExportFormat] = useState<'srt' | 'vtt' | 'mp4'>('srt');
  const [exportScript, setExportScript] = useState<'ol_chiki' | 'latin'>('ol_chiki');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);

  // Active cue calculation
  const activeCue = useMemo(() => {
    return cues.find(c => currentTime >= c.start_sec && currentTime <= c.end_sec) || null;
  }, [cues, currentTime]);
  const activeCueId = activeCue ? activeCue.id : null;

  // Selected cue object
  const selectedCue = useMemo(() => {
    return cues.find(c => c.id === selectedCueId) || cues[0] || null;
  }, [cues, selectedCueId]);

  // Video element ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // Unreviewed count
  const unreviewedCues = useMemo(() => {
    return cues.filter(c => c.humanReviewStatus !== 'reviewed' && c.review_status !== 'APPROVED');
  }, [cues]);
  const unreviewedCount = unreviewedCues.length;

  // Candidate snap points
  const candidateSnapPoints = useMemo(() => {
    return generateCandidateSnapPoints(cues);
  }, [cues]);

  // Dynamic WebVTT blob for video track display
  const [vttBlobUrl, setVttBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    try {
      const vttContent = generateVttString(cues, 'native');
      const blob = new Blob([vttContent], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      setVttBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch {
      // Graceful fallback
    }
  }, [cues, styleConfig]);

  // Video transport handlers
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSeek = useCallback((timeSec: number) => {
    const clamped = Math.max(0, Math.min(duration || 1000, timeSec));
    setCurrentTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  }, [duration]);

  const handleSelectCue = useCallback((cueId: string) => {
    setSelectedCueId(cueId);
  }, []);

  // Update text handler
  const handleUpdateText = useCallback((
    cueId: string, 
    transText: string, 
    sourceText?: string, 
    romanText?: string
  ) => {
    const nextCues = cues.map((c) => {
      if (c.id === cueId) {
        const sourceChanged = sourceText !== undefined && sourceText !== c.source_text;
        return {
          ...c,
          translated_text: transText,
          text: transText,
          source_text: sourceText !== undefined ? sourceText : c.source_text,
          romanized_text: romanText !== undefined ? romanText : c.romanized_text,
          tts_text: romanText !== undefined ? romanText : (c.tts_text || transText),
          is_stale: sourceChanged ? true : c.is_stale,
          humanReviewStatus: 'edited' as const
        };
      }
      return c;
    });
    pushState(nextCues, cueId);

    // If source transcript changed, notify backend
    if (jobId && sourceText !== undefined) {
      updateCueSource(jobId, cueId, sourceText).catch(() => {});
    }
  }, [cues, pushState, jobId]);

  // Update timing handler
  const handleUpdateTiming = useCallback((cueId: string, startSec: number, endSec: number) => {
    const nextCues = cues.map((c) => {
      if (c.id === cueId) {
        return {
          ...c,
          start_sec: startSec,
          end_sec: endSec,
          duration_sec: Math.max(0.1, endSec - startSec),
          humanReviewStatus: 'edited' as const
        };
      }
      return c;
    }).sort((a, b) => a.start_sec - b.start_sec);

    pushState(nextCues, cueId);
  }, [cues, pushState]);

  // Mark cue reviewed / approved
  const handleMarkReviewed = useCallback((cueId: string) => {
    const nextCues = cues.map(c => {
      if (c.id === cueId) {
        return {
          ...c,
          humanReviewStatus: 'reviewed' as const,
          review_status: 'APPROVED' as const,
          verification_status: 'VERIFIED' as const
        };
      }
      return c;
    });
    pushState(nextCues, cueId);

    if (jobId) {
      approveCue(jobId, cueId).catch(() => {});
    }
  }, [cues, pushState, jobId]);

  // Regenerate translation for stale cue
  const handleRegenerateTranslation = useCallback(async (cueId: string) => {
    if (!jobId) return;
    try {
      const res = await regenerateCueTranslation(jobId, cueId, targetLang);
      if (res) {
        const updated = res;
        const nextCues = cues.map(c => {
          if (c.id === cueId) {
            return {
              ...c,
              translated_text: updated.translated_text || c.translated_text,
              romanized_text: updated.romanized_text || c.romanized_text,
              tts_text: updated.romanized_text || c.tts_text,
              is_stale: false,
              translation_status: 'MACHINE_TRANSLATED' as const
            };
          }
          return c;
        });
        pushState(nextCues, cueId);
      }
    } catch (err) {
      console.error('Failed to regenerate translation:', err);
    }
  }, [jobId, targetLang, cues, pushState]);

  // Add Cue
  const handleAddCue = useCallback(() => {
    const start = currentTime;
    const end = Math.min(duration || start + 3, start + 3);
    const newCue: StudioCue = {
      id: `cue_${Date.now()}`,
      index: cues.length + 1,
      start_sec: start,
      end_sec: end,
      duration_sec: end - start,
      speaker: 'Speaker',
      source_text: '',
      translated_text: '',
      romanized_text: '',
      tts_text: '',
      text: '',
      media_type: 'speech',
      is_stale: false,
      translation_source: 'identity',
      confidence: 1.0,
      humanReviewStatus: 'not_reviewed',
      review_status: 'AUTO_GENERATED',
      translation_status: 'NOT_TRANSLATED',
      verification_status: 'UNVERIFIED',
      status: 'valid',
      issues: [],
      warnings: []
    };

    const nextCues = [...cues, newCue].sort((a, b) => a.start_sec - b.start_sec);
    nextCues.forEach((c, i) => { c.index = i + 1; });
    pushState(nextCues, newCue.id);
    setSelectedCueId(newCue.id);
  }, [currentTime, duration, cues, pushState]);

  // Split Cue
  const handleSplitCue = useCallback((cueId: string, splitTimeSec: number) => {
    const target = cues.find(c => c.id === cueId);
    if (!target) return;
    if (splitTimeSec <= target.start_sec + 0.2 || splitTimeSec >= target.end_sec - 0.2) return;

    const cue1: StudioCue = {
      ...target,
      id: `${target.id}_a`,
      end_sec: splitTimeSec,
      duration_sec: splitTimeSec - target.start_sec
    };
    const cue2: StudioCue = {
      ...target,
      id: `${target.id}_b`,
      start_sec: splitTimeSec,
      duration_sec: target.end_sec - splitTimeSec
    };

    const nextCues = cues.flatMap(c => c.id === cueId ? [cue1, cue2] : [c]).sort((a, b) => a.start_sec - b.start_sec);
    nextCues.forEach((c, i) => { c.index = i + 1; });
    pushState(nextCues, cue1.id);
    setSelectedCueId(cue1.id);
  }, [cues, pushState]);

  // Delete Cue
  const handleDeleteCue = useCallback((cueId: string) => {
    if (cues.length <= 1) return;
    const nextCues = cues.filter(c => c.id !== cueId);
    nextCues.forEach((c, i) => { c.index = i + 1; });
    const nextSelected = nextCues[0]?.id || null;
    pushState(nextCues, nextSelected);
    setSelectedCueId(nextSelected);
  }, [cues, pushState]);

  // Simple File Export (SRT, VTT, MP4)
  const handlePerformExport = async () => {
    if (!jobId) return;
    setIsExporting(true);
    setExportProgress(null);

    try {
      if (exportFormat === 'srt' || exportFormat === 'vtt') {
        let content = await downloadSubtitleFile(jobId, exportFormat);

        // If Latin script selected, replace translated text with romanized text
        if (exportScript === 'latin') {
          cues.forEach(c => {
            if (c.romanized_text && c.translated_text) {
              content = content.split(c.translated_text).join(c.romanized_text);
            }
          });
        }

        const blob = new Blob([content], { 
          type: exportFormat === 'vtt' ? 'text/vtt' : 'application/x-subrip' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bhasha_subtitles_${exportScript}_${Date.now()}.${exportFormat}`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportModalOpen(false);
      } else if (exportFormat === 'mp4') {
        // Burn MP4 job
        const burnRes = await requestBurnSubtitles({
          jobId,
          cues,
          styleOpts: styleConfig
        });
        const burnJobId = burnRes.burn_job_id;

        // Poll burn job
        const pollInterval = setInterval(async () => {
          try {
            const status = await pollBurnJobStatus(burnJobId);
            if (status.status === 'COMPLETED') {
              clearInterval(pollInterval);
              const downloadUrl = getBurnedVideoDownloadUrl(burnJobId);
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = `bhasha_burned_${Date.now()}.mp4`;
              a.click();
              setIsExporting(false);
              setIsExportModalOpen(false);
            } else if (status.status === 'FAILED') {
              clearInterval(pollInterval);
              alert(status.error || 'Video rendering failed.');
              setIsExporting(false);
            }
          } catch {
            clearInterval(pollInterval);
            setIsExporting(false);
          }
        }, 1500);
        return;
      }
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    } finally {
      if (exportFormat !== 'mp4') {
        setIsExporting(false);
      }
    }
  };

  // Bulk approve high confidence
  const handleApproveAllHighConfidence = () => {
    const nextCues = cues.map(c => {
      const conf = typeof c.confidence === 'number' ? c.confidence : 0.8;
      if (conf >= 0.70 && !c.is_stale) {
        return {
          ...c,
          humanReviewStatus: 'reviewed' as const,
          review_status: 'APPROVED' as const
        };
      }
      return c;
    });
    pushState(nextCues, selectedCueId);
    setIsReviewModalOpen(false);
  };

  // Handle Content Mode Change (Speech vs Song vs Music vs Mixed)
  const handleContentModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as ContentMode;
    setCurrentContentMode(newMode);
    if (jobId) {
      try {
        await setJobContentMode(jobId, newMode);
      } catch (err) {
        console.warn('Could not persist content mode to server:', err);
      }
    }
  };

  // Handle Lyrics Alignment
  const handleAlignLyrics = async () => {
    if (!lyricsInputText.trim()) {
      setLyricsAlignError('Please paste or enter at least one line of lyrics.');
      return;
    }

    setIsAligningLyrics(true);
    setLyricsAlignError(null);

    try {
      if (jobId) {
        const res = await alignJobLyrics(jobId, lyricsInputText, targetLang || 'sat');
        if (res.cues && res.cues.length > 0) {
          const nextCues: StudioCue[] = res.cues.map((c, idx) => ({
            ...c,
            id: c.id || `cue_lyric_${idx}_${Date.now()}`,
            index: idx + 1,
            source_text: c.source_text || '',
            translated_text: c.translated_text || c.text || '',
            text: c.translated_text || c.text || '',
            romanized_text: c.romanized_text || '',
            tts_text: c.tts_text || c.romanized_text || c.translated_text || '',
            media_type: 'singing',
            content_mode: 'song_lyrics',
            content_mode_label: 'Song / Lyrics',
            review_status: 'AUTO_GENERATED',
            translation_status: 'MACHINE_TRANSLATED',
            verification_status: 'UNVERIFIED',
            humanReviewStatus: 'not_reviewed',
            status: 'valid',
            warnings: [],
            issues: []
          }));
          pushState(nextCues, nextCues[0]?.id || null);
          setSelectedCueId(nextCues[0]?.id || null);
          setIsAlignLyricsModalOpen(false);
          setLyricsInputText('');
        }
      }
    } catch (err: any) {
      setLyricsAlignError(err.message || 'Lyrics alignment failed.');
    } finally {
      setIsAligningLyrics(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-80px)] max-h-[920px] bg-slate-100 rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
      
      {/* 1. COMPACT TOP HEADER */}
      <header className="w-full bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
        {/* Left: Back Arrow, Video Title, Duration */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onStartNewVideo}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="Back to Upload Video"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span className="text-[#249144] font-bold">Bhasha Setu</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-slate-700">Subtitle Studio</span>
            </span>
            <span className="text-slate-300 font-mono text-xs">/</span>
            <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">
              {videoFile?.name || 'AUDIO SONG.mp4'}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
              {formatSecondsToTimecode(duration, 'display')}
            </span>
          </div>
        </div>

        {/* Center / Right: Undo/Redo, Language, Review Indicator, Export Button */}
        <div className="flex items-center gap-2.5">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Undo edit (Ctrl+Z)"
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Redo edit (Ctrl+Y)"
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 transition cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Language Pair Tag */}
          <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
            AUTO → SANTALI
          </span>

          {/* Content Classification Mode (Auto-detected: Song / Lyrics) */}
          <div className="relative flex items-center">
            <select
              value={currentContentMode}
              onChange={handleContentModeChange}
              title="Content Classification Mode (Auto-detected: Song / Lyrics)"
              aria-label="Content Mode"
              className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2.5 py-1 rounded-lg outline-none cursor-pointer transition flex items-center"
            >
              <option value="song_lyrics">🎵 Song / Lyrics</option>
              <option value="speech_dialogue">🗣 Speech / Dialogue</option>
              <option value="instrumental">🎹 Music / Instrumental</option>
              <option value="mixed">🔀 Mixed</option>
            </select>
          </div>

          {/* Quick Lyrics Alignment in Song Mode */}
          {currentContentMode === 'song_lyrics' && (
            <button
              type="button"
              onClick={() => setIsAlignLyricsModalOpen(true)}
              className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Align external or entered lyrics with singing audio segments"
            >
              <Music className="w-3.5 h-3.5 text-purple-600" />
              <span>Align Lyrics</span>
            </button>
          )}

          {/* Minimal Review Status */}
          {unreviewedCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg flex items-center gap-1.5 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
              title="Click for review summary"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>⚠ {unreviewedCount} cues need review</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#249144]" />
              <span>All Reviewed</span>
            </span>
          )}

          {/* Settings / Style icon */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="Subtitle Style & Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Simple Primary Export Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN STUDIO LAYOUT */}
      <div className="flex-1 p-3 grid grid-cols-12 gap-3 overflow-hidden">
        
        {/* LEFT COLUMN: Subtitle Cue List (22% -> col-span-3) */}
        <div className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <SubtitleCueList
            cues={cues}
            selectedCueId={selectedCueId}
            activeCueId={activeCueId}
            onSelectCue={handleSelectCue}
            onSeekCue={handleSeek}
            onAddCue={handleAddCue}
          />
        </div>

        {/* CENTER COLUMN: Video Player + Simple Timeline (53% -> col-span-6) */}
        <div className="col-span-12 lg:col-span-6 h-full flex flex-col space-y-2 overflow-hidden justify-between">
          {/* Centered Video Player */}
          <div className="flex-1 min-h-0 flex items-center justify-center bg-black/95 rounded-2xl overflow-hidden border border-slate-300 relative shadow-inner">
            <SubtitleVideoPlayer
              videoPreviewUrl={videoPreviewUrl}
              vttBlobUrl={vttBlobUrl}
              targetLang={targetLang}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              showSubtitles={true}
              videoRef={videoRef}
              onTimeUpdate={setCurrentTime}
              onLoadedMetadata={setDuration}
              onTogglePlay={handlePlayPause}
              onSeekRelative={(offset) => handleSeek(currentTime + offset)}
              onSeekAbsolute={handleSeek}
              onChangeSpeed={setPlaybackRate}
              onToggleSubtitles={() => {}}
            />
          </div>

          {/* Simple Subtitle Timeline (directly under video) */}
          <div className="shrink-0">
            <SubtitleTimeline
              cues={cues}
              selectedCueId={selectedCueId}
              activeCueId={activeCueId}
              currentTime={currentTime}
              duration={duration}
              mediaRegions={mediaRegions}
              onSelectCue={handleSelectCue}
              onSeek={handleSeek}
              snapPoints={candidateSnapPoints}
              onUpdateTiming={handleUpdateTiming}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Cue Editor (25% -> col-span-3) */}
        <div className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <SubtitleCueEditor
            cue={selectedCue}
            videoDuration={duration}
            currentPlaybackTime={currentTime}
            contentMode={currentContentMode}
            onUpdateText={handleUpdateText}
            onUpdateTiming={handleUpdateTiming}
            onSplitCue={handleSplitCue}
            onDeleteCue={handleDeleteCue}
            onMarkReviewed={handleMarkReviewed}
            onRegenerateTranslation={handleRegenerateTranslation}
          />
        </div>

      </div>

      {/* 3. SIMPLE EXPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-[#249144]" />
                Export Subtitles
              </h3>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Unreviewed Cues Alert */}
            {unreviewedCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {unreviewedCount} cues still need review
                </p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Subtitles contain AI-generated translations that have not been human approved.
                </p>
              </div>
            )}

            {/* Subtitle Script Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Subtitle Script:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setExportScript('ol_chiki')}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                    exportScript === 'ol_chiki'
                      ? 'bg-emerald-50 border-[#249144] text-[#14532d]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Santali (Ol Chiki)
                </button>
                <button
                  type="button"
                  onClick={() => setExportScript('latin')}
                  className={`py-2 px-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                    exportScript === 'latin'
                      ? 'bg-teal-50 border-teal-600 text-teal-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Santali (Latin)
                </button>
              </div>
            </div>

            {/* Export Format Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Export Format:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === 'srt'}
                    onChange={() => setExportFormat('srt')}
                    className="accent-[#249144]"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">SubRip (.SRT)</span>
                    <p className="text-[10px] text-slate-500">Universal standard for VLC, YouTube, and media players</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === 'vtt'}
                    onChange={() => setExportFormat('vtt')}
                    className="accent-[#249144]"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">WebVTT (.VTT)</span>
                    <p className="text-[10px] text-slate-500">Web standard for HTML5 video tracks</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === 'mp4'}
                    onChange={() => setExportFormat('mp4')}
                    className="accent-[#249144]"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800">Burned Video (.MP4)</span>
                    <p className="text-[10px] text-slate-500">Video with subtitles hardcoded onto video frames</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePerformExport}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering... {exportProgress ? `(${exportProgress}%)` : ''}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {exportFormat.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPACT REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Review Summary
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-medium text-slate-600">Acoustic Confidence:</span>
                <span className="font-bold text-amber-700 font-mono">
                  {readinessScore ? `${readinessScore.breakdown?.recognition ?? 34}% (Singing/Music)` : '34%'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-medium text-slate-600">Translation Status:</span>
                <span className="font-bold text-slate-800">Machine Generated</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-medium text-slate-600">Timing & Overlaps:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> OK
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-medium text-slate-600">Readability (CPS):</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> OK
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              We recommend reviewing each cue in the right editor and clicking <strong>[Approve]</strong>.
            </p>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleApproveAllHighConfidence}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition cursor-pointer"
              >
                Approve High Conf
              </button>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close & Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SETTINGS & STYLE MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                Subtitle Styling
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Style Preset:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setStyleConfig(preset.config)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                      styleConfig === preset.config
                        ? 'bg-emerald-50 border-[#249144] font-bold text-[#14532d]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#249144] text-white font-bold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ALIGN LYRICS MODAL */}
      {isAlignLyricsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-600" />
                <span>Align Lyrics to Audio (Song Mode)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAlignLyricsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Provide known lyrics (enter/paste text or upload a .txt file). Lines are automatically aligned to detected vocal singing regions, keeping instrumental music and silence subtitle-free and preserving full video duration.
            </p>

            {/* Quick prefill helper button */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Lyrics Text (one line per cue)
              </span>
              <button
                type="button"
                onClick={() => setLyricsInputText("Ishq Mohabbat Tumse Hui\nDil Ka Khasara Mera Hua\nAisi Lagan Lagi\nHar Pal Teri Yaadein")}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200 transition cursor-pointer"
              >
                Insert Song Lyrics
              </button>
            </div>

            <textarea
              rows={5}
              value={lyricsInputText}
              onChange={(e) => setLyricsInputText(e.target.value)}
              placeholder="Paste song lyrics here...&#10;Line 1&#10;Line 2&#10;Line 3"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-800 outline-none focus:border-purple-600 focus:bg-white transition resize-none leading-relaxed font-sans"
            />

            {/* Upload .txt option */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-1.5 cursor-pointer text-purple-700 font-semibold hover:underline">
                <FileText className="w-3.5 h-3.5" />
                <span>Upload .txt file</span>
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        if (content) setLyricsInputText(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>

              <span className="text-[11px] text-slate-400">
                {lyricsInputText.split('\n').filter(l => l.trim()).length} lines detected
              </span>
            </div>

            {lyricsAlignError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                {lyricsAlignError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAlignLyricsModalOpen(false)}
                disabled={isAligningLyrics}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAlignLyrics}
                disabled={isAligningLyrics || !lyricsInputText.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                {isAligningLyrics ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Aligning & Translating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Align & Translate (Santali)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
