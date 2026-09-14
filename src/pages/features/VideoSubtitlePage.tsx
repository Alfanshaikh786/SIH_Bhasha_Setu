import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Video, 
  ArrowRight,
  AlertCircle,
  Mic,
  Languages,
  Clock,
  CheckCircle2,
  Loader2,
  Check,
  CloudDownload,
  Copy,
  Maximize
} from 'lucide-react';
import { 
  submitSubtitleJob, 
  fetchJobStatus, 
  SubtitleJobResponse 
} from '../../services/videoSubtitleService';

// Time formatting helpers
function formatSrtTime(sec: number): string {
  const s = Math.max(0, sec || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatVttTime(sec: number): string {
  const s = Math.max(0, sec || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function formatAssTime(sec: number): string {
  const s = Math.max(0, sec || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export const VideoSubtitlePage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('sat');
  const [contentMode, setContentMode] = useState('auto');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const [activeJob, setActiveJob] = useState<SubtitleJobResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Playback & subtitle sync state
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [videoPreviewUrl]);

  // Elapsed time counter during processing
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isProcessing) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing]);

  // WebVTT track generation for native video player subtitles
  const vttBlobUrl = useMemo(() => {
    if (!activeJob?.preview_segments?.length) return null;
    let vtt = 'WEBVTT\n\n';
    activeJob.preview_segments.forEach((cue, i) => {
      const start = formatVttTime(cue.start_sec);
      const end = formatVttTime(cue.end_sec);
      const text = cue.translated_text || cue.text || cue.source_text;
      vtt += `${i + 1}\n${start} --> ${end}\n${text}\n\n`;
    });
    const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, [activeJob?.preview_segments]);

  // Clean up WebVTT blob URL
  useEffect(() => {
    return () => {
      if (vttBlobUrl) URL.revokeObjectURL(vttBlobUrl);
    };
  }, [vttBlobUrl]);

  // Active subtitle cue calculated from currentTime
  const activeCue = useMemo(() => {
    if (!activeJob?.preview_segments?.length) return null;
    return activeJob.preview_segments.find(
      (cue) => currentTime >= (cue.start_sec ?? 0) && currentTime <= (cue.end_sec ?? 0)
    ) || null;
  }, [activeJob?.preview_segments, currentTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);

      setSelectedFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setActiveJob(null);
      setElapsedSeconds(0);
      setErrorMessage(null);

      // Intelligent detection: If filename indicates song or music, select song mode
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('song') || lowerName.includes('music') || lowerName.includes('lyric')) {
        setContentMode('song_lyrics');
      }
    }
  };

  const handleClearFile = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setActiveJob(null);
    setIsProcessing(false);
    setElapsedSeconds(0);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartSubtitling = async () => {
    if (!selectedFile) {
      setErrorMessage('Please choose a video file first.');
      return;
    }

    if (targetLang === 'unr' || targetLang === 'hoc') {
      setErrorMessage(
        `${targetLang === 'unr' ? 'Mundari' : 'Ho'} subtitling is scheduled for Phase 2/3. This phase actively supports Santali (sat).`
      );
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setElapsedSeconds(0);

    try {
      const initRes = await submitSubtitleJob(selectedFile, sourceLang, targetLang, contentMode);
      const jobId = initRes.job_id;
      
      const poll = async () => {
        try {
          const statusRes = await fetchJobStatus(jobId);
          setActiveJob(statusRes);

          if (statusRes.status === 'COMPLETED') {
            setIsProcessing(false);
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          } else if (statusRes.status === 'FAILED') {
            setIsProcessing(false);
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            setErrorMessage(statusRes.error || 'Video subtitling failed during processing.');
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
        }
      };

      // Immediate first poll, then every 1000ms
      await poll();
      pollingTimerRef.current = setInterval(poll, 1000);

    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Failed to submit video subtitle job.');
    }
  };

  // Download Handlers
  const handleDownloadSrt = () => {
    if (!activeJob?.preview_segments?.length) return;
    let srt = '';
    activeJob.preview_segments.forEach((cue, i) => {
      const start = formatSrtTime(cue.start_sec);
      const end = formatSrtTime(cue.end_sec);
      const targetText = cue.translated_text || cue.text || cue.source_text;
      const romanText = cue.romanized_text ? `\n${cue.romanized_text}` : '';
      srt += `${i + 1}\n${start} --> ${end}\n${targetText}${romanText}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'video_subtitles';
    a.download = `${baseName}_${targetLang}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAss = () => {
    if (!activeJob?.preview_segments?.length) return;
    let ass = `[Script Info]
Title: Bhasha Setu Tribal Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,22,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    activeJob.preview_segments.forEach((cue) => {
      const start = formatAssTime(cue.start_sec);
      const end = formatAssTime(cue.end_sec);
      const targetText = cue.translated_text || cue.text || cue.source_text;
      const romanText = cue.romanized_text ? `\\N{\\fs14\\c&H00D7FF&}${cue.romanized_text}` : '';
      ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${targetText}${romanText}\n`;
    });
    const blob = new Blob([ass], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'video_subtitles';
    a.download = `${baseName}_${targetLang}.ass`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyText = () => {
    if (!activeJob?.preview_segments?.length) return;
    const lines = activeJob.preview_segments.map((cue, i) => {
      const start = formatSrtTime(cue.start_sec);
      const end = formatSrtTime(cue.end_sec);
      const target = cue.translated_text || cue.text || '';
      const roman = cue.romanized_text ? ` (${cue.romanized_text})` : '';
      const orig = cue.source_text ? ` [Source: ${cue.source_text}]` : '';
      return `${i + 1}. [${start} --> ${end}] ${target}${roman}${orig}`;
    }).join('\n');
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Target language friendly label
  const targetLanguageLabel = 
    targetLang === 'sat' ? 'Santali' :
    targetLang === 'hin' ? 'Hindi' :
    targetLang === 'eng' ? 'English' : 'Santali';

  // Step Status Calculations
  const progress = activeJob?.progress ?? 0;
  const jobStatus = activeJob?.status ?? '';
  const isJobComplete = jobStatus === 'COMPLETED';

  // Step 1: Audio Extraction
  const isStep1Done = progress >= 25 || ['TRANSCRIBING', 'TRANSLATING', 'RENDERING', 'COMPLETED'].includes(jobStatus);
  const isStep1Active = isProcessing && !isStep1Done && progress < 25;

  // Step 2: Transcribing
  const isStep2Done = progress >= 60 || ['TRANSLATING', 'RENDERING', 'COMPLETED'].includes(jobStatus);
  const isStep2Active = isProcessing && !isStep2Done && progress >= 25;

  // Step 3: Tribal Translation
  const isStep3Done = progress >= 85 || ['RENDERING', 'COMPLETED'].includes(jobStatus);
  const isStep3Active = isProcessing && !isStep3Done && progress >= 60;

  // Step 4: Subtitle Rendering
  const isStep4Done = jobStatus === 'COMPLETED';
  const isStep4Active = isProcessing && !isStep4Done && progress >= 85;

  return (
    <section className="min-h-screen bg-slate-50/60 pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Simple, dignified section header matching recording */}
        <div className="w-full flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f0fdf4] border border-[#dcfce7] text-xs font-bold text-[#14532d] mb-3 shadow-xs">
            <Video className="w-3.5 h-3.5 text-[#249144]" /> Neural Tribal Subtitling Pipeline
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl font-bold leading-tight text-slate-900">
            AI Subtitle Studio
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-500 font-sans leading-relaxed">
            Translate any video broadcast into Indian Tribal languages— <span className="font-semibold text-slate-700">Santali</span>, <span className="font-semibold text-slate-700">Bhili</span>, <span className="font-semibold text-slate-700">Gondi</span>, and <span className="font-semibold text-slate-700">Mundari</span> —with burned subtitles, audio sync, and transcript explorer.
          </p>
        </div>

        {/* Upload & Configuration Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          
          {/* Header row: Upload Local Video */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Video className="w-4 h-4 text-slate-400" />
            <span>Upload Local Video</span>
          </div>

          {/* Clean File Input Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-2 sm:p-2.5 px-3 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="video/mp4,video/webm,video/mkv,video/quicktime,video/x-msvideo" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="shrink-0 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition disabled:opacity-50"
              >
                Choose File
              </button>
              <span className="truncate text-sm text-slate-700 font-medium">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>

            {selectedFile && !isProcessing && (
              <button
                type="button"
                onClick={handleClearFile}
                className="shrink-0 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 text-xs font-medium rounded-md transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* Source Audio & Target Language Connector Box */}
          <div className="relative border border-slate-200 rounded-xl p-4 sm:p-5 bg-white">
            {/* Center connector arrow on desktop */}
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 z-10 shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              {/* SOURCE AUDIO */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Mic className="w-3.5 h-3.5 text-slate-400" />
                  <span>SOURCE AUDIO</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 w-2 h-2 rounded-full bg-slate-400 pointer-events-none" />
                  <select
                    value={contentMode === 'song_lyrics' ? 'song_lyrics' : sourceLang}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'song_lyrics') {
                        setContentMode('song_lyrics');
                        setSourceLang('auto');
                      } else if (val === 'instrumental') {
                        setContentMode('instrumental');
                        setSourceLang('auto');
                      } else {
                        setContentMode('auto');
                        setSourceLang(val);
                      }
                    }}
                    disabled={isProcessing}
                    aria-label="Source audio mode"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-[#249144] focus:ring-1 focus:ring-[#249144]/20 transition cursor-pointer appearance-none"
                  >
                    <option value="auto">Auto Detect</option>
                    <option value="song_lyrics">🎵 Song / Lyrics (Singing-Aware)</option>
                    <option value="instrumental">🎹 Instrumental / Music</option>
                    <option value="hin">Hindi (हिन्दी)</option>
                    <option value="eng">English</option>
                    <option value="sat">Santali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
                  </select>
                  <div className="absolute right-3.5 text-slate-400 pointer-events-none text-xs">▼</div>
                </div>
              </div>

              {/* TARGET LANGUAGE */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Languages className="w-3.5 h-3.5 text-slate-400" />
                  <span>TARGET LANGUAGE</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 w-2 h-2 rounded-full bg-emerald-500 pointer-events-none" />
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    disabled={isProcessing}
                    aria-label="Target tribal language"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-xs sm:text-sm font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-[#249144] focus:ring-1 focus:ring-[#249144]/20 transition cursor-pointer appearance-none"
                  >
                    <option value="sat">Santali</option>
                    <option value="hin">Hindi</option>
                    <option value="eng">English</option>
                    <option value="unr" disabled>Mundari (Phase 2)</option>
                    <option value="hoc" disabled>Ho (Phase 3)</option>
                  </select>
                  <div className="absolute right-3.5 text-slate-400 pointer-events-none text-xs">▼</div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Subtitling Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* CTA Row */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleStartSubtitling}
              disabled={isProcessing || !selectedFile}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                isProcessing
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : selectedFile
                    ? 'bg-[#249144] hover:bg-[#1e7e39] text-white shadow-xs hover:shadow-md cursor-pointer active:scale-98'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <span>Translating Video ({elapsedSeconds}s)...</span>
              ) : (
                <>
                  <span>Start Video Translation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* 4-Step Processing Card (matching Recording 2026-09-14 115354.mp4) */}
        {(isProcessing || activeJob) && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 animate-in fade-in duration-300">
            {/* Header: Loader + Title + Subtitle + Elapsed Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  {isJobComplete ? (
                    <CheckCircle2 className="w-6 h-6 text-[#249144]" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Processing Video for <span className="font-normal text-slate-600">{targetLanguageLabel}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pipeline is downloading, transcribing, and neural translating.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-mono flex items-center gap-1.5 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Elapsed: {elapsedSeconds}s
                </span>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* STEP 01: Audio Extraction */}
              <div 
                className={`rounded-xl p-4 transition-all duration-300 ${
                  isStep1Active 
                    ? 'bg-white border-2 border-slate-300 shadow-sm' 
                    : isStep1Done 
                      ? 'bg-slate-50/70 border border-slate-200' 
                      : 'bg-white/40 border border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    STEP 01
                  </span>
                  {isStep1Done ? (
                    <CheckCircle2 className="w-4 h-4 text-slate-700" />
                  ) : isStep1Active ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mt-2">
                  Audio Extraction
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fetching audio track
                </p>
              </div>

              {/* STEP 02: Transcribing */}
              <div 
                className={`rounded-xl p-4 transition-all duration-300 ${
                  isStep2Active 
                    ? 'bg-white border-2 border-slate-300 shadow-sm' 
                    : isStep2Done 
                      ? 'bg-slate-50/70 border border-slate-200' 
                      : 'bg-white/40 border border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    STEP 02
                  </span>
                  {isStep2Done ? (
                    <CheckCircle2 className="w-4 h-4 text-slate-700" />
                  ) : isStep2Active ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mt-2">
                  Transcribing
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Speech recognition & timestamps
                </p>
              </div>

              {/* STEP 03: Tribal Translation */}
              <div 
                className={`rounded-xl p-4 transition-all duration-300 ${
                  isStep3Active 
                    ? 'bg-white border-2 border-slate-300 shadow-sm' 
                    : isStep3Done 
                      ? 'bg-slate-50/70 border border-slate-200' 
                      : 'bg-white/40 border border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    STEP 03
                  </span>
                  {isStep3Done ? (
                    <CheckCircle2 className="w-4 h-4 text-slate-700" />
                  ) : isStep3Active ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mt-2">
                  Tribal Translation
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Translating into {targetLanguageLabel}
                </p>
              </div>

              {/* STEP 04: Subtitle Rendering */}
              <div 
                className={`rounded-xl p-4 transition-all duration-300 ${
                  isStep4Active 
                    ? 'bg-white border-2 border-slate-300 shadow-sm' 
                    : isStep4Done 
                      ? 'bg-slate-50/70 border border-slate-200' 
                      : 'bg-white/40 border border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    STEP 04
                  </span>
                  {isStep4Done ? (
                    <CheckCircle2 className="w-4 h-4 text-slate-700" />
                  ) : isStep4Active ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mt-2">
                  Subtitle Rendering
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generating SRT & video overlay
                </p>
              </div>

            </div>
          </div>
        )}

        {/* 1. TRANSLATION COMPLETE & DOWNLOAD CARD */}
        {isJobComplete && activeJob && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-600 tracking-wider mb-2.5">
                  <Check className="w-3.5 h-3.5 text-slate-500" />
                  <span>TRANSLATION COMPLETE</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Subtitles in <span className="font-normal text-slate-500">{targetLanguageLabel}</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 font-sans">
                  {activeJob.subtitle_count || activeJob.preview_segments?.length || 0} bilingual subtitle segments successfully generated and ready to stream or download.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadSrt}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs transition cursor-pointer active:scale-98"
                >
                  <CloudDownload className="w-4 h-4 text-slate-400" />
                  <span>Download .SRT</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAss}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs transition cursor-pointer active:scale-98"
                >
                  <CloudDownload className="w-4 h-4 text-slate-400" />
                  <span>.ASS</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs transition cursor-pointer active:scale-98"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. SUBTITLED VIDEO PLAYBACK CARD */}
        {isJobComplete && videoPreviewUrl && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Video className="w-4 h-4 text-slate-500" />
                <span>Subtitled Video Playback</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-600 tracking-wider">
                  {targetLanguageLabel.toUpperCase()} SUBTITLES
                </span>
                <button
                  onClick={handleToggleFullscreen}
                  aria-label="Toggle Fullscreen"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video container with aspect framing and overlay subtitles */}
            <div 
              ref={playerContainerRef} 
              className="bg-black relative aspect-video flex items-center justify-center overflow-hidden"
            >
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                controls
                onTimeUpdate={handleTimeUpdate}
                className="max-h-[600px] w-auto h-full object-contain mx-auto"
              >
                {vttBlobUrl && (
                  <track
                    kind="subtitles"
                    label={`${targetLanguageLabel} Subtitles`}
                    src={vttBlobUrl}
                    srcLang={targetLang}
                    default
                  />
                )}
                Your browser does not support the video tag.
              </video>

              {/* Synchronized High-Contrast Subtitle Overlay */}
              {activeCue && (
                <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4 pointer-events-none z-20">
                  <div className="bg-black/85 backdrop-blur-xs text-white px-5 py-2.5 rounded-xl text-center shadow-2xl max-w-xl border border-white/10 animate-in fade-in duration-100">
                    <p className="text-base sm:text-xl font-bold font-sans tracking-wide text-white">
                      {activeCue.translated_text || activeCue.text || activeCue.source_text}
                    </p>
                    {activeCue.romanized_text && (
                      <p className="text-xs sm:text-sm text-emerald-300 font-mono mt-0.5">
                        {activeCue.romanized_text}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
