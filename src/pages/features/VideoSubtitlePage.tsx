import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Download, 
  FileVideo, 
  Check, 
  Copy, 
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  Play,
  Languages,
  RotateCcw
} from 'lucide-react';
import { 
  submitSubtitleJob, 
  fetchJobStatus, 
  downloadSubtitleFile,
  SubtitleJobResponse, 
  SubtitleCue 
} from '../../services/videoSubtitleService';

export const VideoSubtitlePage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('sat');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [vttBlobUrl, setVttBlobUrl] = useState<string | null>(null);

  const [activeJob, setActiveJob] = useState<SubtitleJobResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (vttBlobUrl) URL.revokeObjectURL(vttBlobUrl);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [videoPreviewUrl, vttBlobUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (vttBlobUrl) URL.revokeObjectURL(vttBlobUrl);

      setSelectedFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setVttBlobUrl(null);
      setActiveJob(null);
      setErrorMessage(null);
    }
  };

  const handleStartSubtitling = async () => {
    if (!selectedFile) {
      setErrorMessage('Please upload a video file first.');
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

    try {
      const initRes = await submitSubtitleJob(selectedFile, sourceLang, targetLang);
      
      // Start real-time polling
      const jobId = initRes.job_id;
      
      const poll = async () => {
        try {
          const statusRes = await fetchJobStatus(jobId);
          setActiveJob(statusRes);

          if (statusRes.status === 'COMPLETED') {
            setIsProcessing(false);
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

            // Fetch VTT content to attach as a native <track>
            try {
              const vttText = await downloadSubtitleFile(jobId, 'vtt');
              const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              setVttBlobUrl(url);
            } catch (vttErr) {
              console.warn('Could not attach VTT track to video preview:', vttErr);
            }
          } else if (statusRes.status === 'FAILED') {
            setIsProcessing(false);
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            setErrorMessage(statusRes.error || 'Video subtitling failed during processing.');
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
        }
      };

      // Immediate first check, then interval
      await poll();
      pollingTimerRef.current = setInterval(poll, 1200);

    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Failed to submit video subtitle job.');
    }
  };

  const handleSeekToCue = (startSec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, startSec);
      videoRef.current.play();
    }
  };

  const handleDownloadFile = async (fmt: 'srt' | 'vtt') => {
    if (!activeJob) return;
    try {
      const content = await downloadSubtitleFile(activeJob.job_id, fmt);
      const mime = fmt === 'srt' ? 'application/x-subrip' : 'text/vtt';
      const blob = new Blob([content], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'subtitles'}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleCopySubtitles = () => {
    if (!activeJob || !activeJob.preview_segments) return;
    const textLines = activeJob.preview_segments.map(
      c => `[${c.start_sec.toFixed(2)}s - ${c.end_sec.toFixed(2)}s] ${c.translated_text}\n(Original: ${c.source_text})`
    );
    navigator.clipboard.writeText(textLines.join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="w-full flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f0fdf4] border border-[#dcfce7] text-xs font-bold text-[#14532d] mb-3 shadow-xs">
            <Video className="w-3.5 h-3.5 text-[#249144]" /> Neural Tribal Subtitling Pipeline
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            Video Subtitle Engine
          </h1>
          <div className="relative mt-3.5 w-36 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
          </div>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            Real end-to-end video subtitling: 16kHz audio extraction, neural ASR transcription, timeline preservation, and Ol Chiki / Hindi / English subtitle generation.
          </p>
        </div>

        {/* Video Upload & Language Configuration Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6">
          
          {/* Drag & Drop Dropzone */}
          <div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Upload Video File:
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="video/mp4,video/webm,video/mkv,video/quicktime,video/x-msvideo" 
              className="hidden" 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#249144] hover:bg-green-50/30 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-green-50 group-hover:bg-[#249144] text-[#249144] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                <FileVideo className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 group-hover:text-[#249144] transition-colors">
                  {selectedFile ? `Loaded: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'Choose a video file or drag and drop here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports MP4, WEBM, MKV, AVI, and MOV files
                </p>
              </div>
              {selectedFile ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-green-100 text-[#14532d] text-xs font-semibold rounded-full mt-1">
                  <Check className="w-3.5 h-3.5 text-[#249144]" /> Video Ready for Processing
                </span>
              ) : (
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Browse Video File
                </button>
              )}
            </div>
          </div>

          {/* Video Preview Player (When File is Selected) */}
          {videoPreviewUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-[360px] mx-auto shadow-inner relative">
              <video 
                ref={videoRef}
                src={videoPreviewUrl} 
                controls 
                className="w-full h-full object-contain"
              >
                {vttBlobUrl && (
                  <track 
                    label="Subtitles" 
                    kind="subtitles" 
                    srcLang={targetLang} 
                    src={vttBlobUrl} 
                    default 
                  />
                )}
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Language Selectors Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Source Audio Language:
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                aria-label="Select source language"
                disabled={isProcessing}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] focus:ring-2 focus:ring-[#249144]/20 transition"
              >
                <option value="auto">Auto-Detect (Hindi / English)</option>
                <option value="sat">Santali (ᱥᱟᱱᱛᱟᱲᱤ) — IndicConformer</option>
                <option value="hin">Hindi (हिन्दी) — Neural Whisper</option>
                <option value="eng">English — Neural Whisper</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Target Subtitle Language:
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                aria-label="Select target tribal language"
                disabled={isProcessing}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] focus:ring-2 focus:ring-[#249144]/20 transition"
              >
                <option value="sat">Santali (ᱥᱟᱱᱛᱟᱲᱤ / Ol Chiki)</option>
                <option value="hin">Hindi (हिन्दी / Devanagari)</option>
                <option value="eng">English (Latin)</option>
                <option value="original">Original Audio Transcript</option>
                <option value="unr" disabled>Mundari (Phase 2 Scheduled)</option>
                <option value="hoc" disabled>Ho (Phase 3 Scheduled)</option>
              </select>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Subtitling Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Real Backend Job Status / Progress Card */}
          {activeJob && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 flex items-center gap-2">
                  {isProcessing && <RefreshCw className="w-3.5 h-3.5 text-[#249144] animate-spin" />}
                  State: <span className="text-[#249144] font-mono">{activeJob.status}</span>
                </span>
                <span className="text-slate-500">{activeJob.progress}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#249144] transition-all duration-300 rounded-full"
                  style={{ width: `${activeJob.progress}%` }}
                />
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Stage: {activeJob.current_stage}
              </p>
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-2">
            <button
              onClick={handleStartSubtitling}
              disabled={isProcessing || !selectedFile}
              className={`w-full py-3.5 font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 ${
                isProcessing || !selectedFile
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#249144] hover:bg-[#1a7536] text-white cursor-pointer active:scale-98'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Video Pipeline ({activeJob?.progress || 0}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Subtitles with Real AI Pipeline</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Generated Subtitles Result Box (Appears when completed) */}
        {activeJob && activeJob.status === 'COMPLETED' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 animate-in fade-in duration-300 space-y-6">
            
            {/* Header & Downloads */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#249144]" />
                  Synchronized Subtitles ({activeJob.subtitle_count} Cues)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detected Lang: <span className="font-semibold text-slate-600">{activeJob.detected_language || activeJob.source_language}</span> • Duration: {activeJob.video_duration_sec}s
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopySubtitles}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-[#249144] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={() => handleDownloadFile('srt')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .SRT</span>
                </button>
                <button
                  onClick={() => handleDownloadFile('vtt')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .VTT</span>
                </button>
              </div>
            </div>

            {/* Validation Banner */}
            {activeJob.validation && (
              <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
                activeJob.validation.valid
                  ? 'bg-green-50/60 border-green-200 text-green-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <Check className="w-4 h-4 text-[#249144] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    Quality Validation Passed: {activeJob.validation.segments_checked} segments checked with 0 fatal errors.
                  </p>
                  {activeJob.validation.warnings.length > 0 && (
                    <ul className="list-disc list-inside text-amber-700 text-[11px] space-y-0.5">
                      {activeJob.validation.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Subtitle Segments List with Video Seek */}
            <div className="space-y-3 pt-2">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Interactive Subtitle Cues (Click any cue to seek video player):
              </span>

              {activeJob.preview_segments.map((cue: SubtitleCue) => (
                <div
                  key={cue.index}
                  onClick={() => handleSeekToCue(cue.start_sec)}
                  className="bg-slate-50/80 hover:bg-green-50/40 rounded-2xl p-4 border border-slate-200 hover:border-[#249144] transition-all cursor-pointer group space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="text-[#249144] font-bold flex items-center gap-1.5">
                      <Play className="w-3 h-3 group-hover:fill-[#249144] transition-all" />
                      Cue #{cue.index} ({cue.speaker})
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      <Clock className="w-3 h-3" /> {cue.start_sec.toFixed(3)}s → {cue.end_sec.toFixed(3)}s ({cue.duration_sec}s)
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed font-sans">
                    {cue.translated_text}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 italic border-t border-slate-200/50 pt-1.5 mt-1">
                    <span>Original: {cue.source_text}</span>
                    <span className="text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 not-italic">
                      Source: {cue.translation_source}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
