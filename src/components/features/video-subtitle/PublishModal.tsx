/**
 * Publishing & Export Studio Modal Component
 * Comprehensive publishing center supporting:
 * - Export Presets (Standard, Web, Social, Educational, Accessibility)
 * - Complete Export Summary
 * - Pre-Export Safety Gate (blocks critical errors, warns on advisories)
 * - Burned-in MP4 Rendering with Real Stage-Based Progress
 * - Session Export History
 */

import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Download, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Film, 
  Video, 
  Layers, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles,
  History,
  FileText,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { 
  StudioCue, 
  StudioValidationReport, 
  StudioQualityScore, 
  ReviewSummaryStats,
  SubtitleStyleConfig, 
  SubtitleDisplayMode, 
  SessionExportItem,
  ExportPresetId
} from './types';
import { 
  formatSecondsToTimecode, 
  EXPORT_PRESETS, 
  STYLE_PRESETS 
} from './subtitleUtils';
import { 
  requestBurnSubtitles, 
  pollBurnJobStatus, 
  getBurnedVideoDownloadUrl 
} from '../../../services/videoSubtitleService';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  originalFilename: string;
  durationSec: number;
  targetLang: string;
  sourceLang?: string;
  cues: StudioCue[];
  styleConfig: SubtitleStyleConfig;
  displayMode: SubtitleDisplayMode;
  report: StudioValidationReport;
  qualityScore: StudioQualityScore;
  reviewSummary: ReviewSummaryStats;
  sessionExports: SessionExportItem[];
  onDownloadFile: (fmt: 'srt' | 'vtt') => void;
  onNavigateToIssue: (cueId: string, timeSec: number) => void;
  onRecordExport: (item: SessionExportItem) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  jobId,
  originalFilename,
  durationSec,
  targetLang,
  sourceLang,
  cues,
  styleConfig,
  displayMode,
  report,
  qualityScore,
  reviewSummary,
  sessionExports,
  onDownloadFile,
  onNavigateToIssue,
  onRecordExport
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ExportPresetId>('standard_subtitles');
  const [isBurning, setIsBurning] = useState(false);
  const [burnStage, setBurnStage] = useState<string>('');
  const [burnError, setBurnError] = useState<string | null>(null);
  const [completedBurnUrl, setCompletedBurnUrl] = useState<string | null>(null);
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);

  if (!isOpen) return null;

  const hasCriticalErrors = report.criticalErrors.length > 0;
  const hasWarnings = report.warnings.length > 0;
  const activeStylePreset = STYLE_PRESETS.find(p => p.id === styleConfig.presetId) || {
    name: 'Custom Style'
  };

  const getDisplayModeLabel = (mode: SubtitleDisplayMode) => {
    switch (mode) {
      case 'original_native': return 'Bilingual (Original + Native)';
      case 'native_original': return 'Bilingual (Native + Original)';
      case 'native_romanized': return 'Bilingual (Native + Romanized)';
      case 'romanized': return 'Romanized Only';
      case 'original': return 'Original Source Only';
      case 'native':
      default: return 'Native Script Only';
    }
  };

  // Trigger Burned-In MP4 Rendering
  const handleStartBurnVideo = async () => {
    if (hasCriticalErrors) return;

    try {
      setIsBurning(true);
      setBurnError(null);
      setCompletedBurnUrl(null);
      setBurnStage('Preparing video and subtitle tracks...');

      const startRes = await requestBurnSubtitles({
        jobId,
        cues,
        styleOpts: styleConfig,
        subtitleMode: displayMode
      });

      const burnJobId = startRes.burn_job_id;
      setBurnStage(startRes.current_stage || 'Encoding video with FFmpeg...');

      // Poll stage progress
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await pollBurnJobStatus(burnJobId);
          setBurnStage(statusRes.current_stage || 'Processing...');

          if (statusRes.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setIsBurning(false);
            const downloadUrl = getBurnedVideoDownloadUrl(burnJobId);
            setCompletedBurnUrl(downloadUrl);

            // Record session export
            onRecordExport({
              id: `mp4_${Date.now()}`,
              format: 'mp4',
              presetName: activeStylePreset.name,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              filename: `${originalFilename.replace(/\.[^/.]+$/, '')}_subtitled.mp4`,
              url: downloadUrl
            });
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsBurning(false);
            setBurnError(statusRes.error || 'Burn-in video encoding failed.');
          }
        } catch (err: any) {
          clearInterval(pollInterval);
          setIsBurning(false);
          setBurnError(err?.message || 'Error communicating with rendering worker.');
        }
      }, 1000);

    } catch (err: any) {
      setIsBurning(false);
      setBurnError(err?.message || 'Failed to initialize video burn job.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
              hasCriticalErrors ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-[#14532d]'
            }`}>
              {hasCriticalErrors ? <ShieldAlert className="w-5 h-5 text-red-600" /> : <Film className="w-5 h-5 text-[#249144]" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Publish & Export Subtitles
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                {originalFilename} • {cues.length} cues • Quality Score: {qualityScore.score}/100
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Critical Error Blocker Banner */}
          {hasCriticalErrors && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Export Blocked: {report.criticalErrors.length} Critical Issues Must Be Resolved</span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed font-sans pl-7">
                Exporting with inverted or negative timestamps produces broken files. Resolve these cues before publishing:
              </p>
              <div className="space-y-1.5 pt-1 pl-7">
                {report.criticalErrors.map((err) => (
                  <div 
                    key={err.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/90 border border-red-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-red-900">Cue #{err.cueIndex}: </span>
                      <span className="text-red-700">{err.description}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToIssue(err.cueId, err.timeSec);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition shrink-0 cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1. Export Presets Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#249144]" />
              <span>Export Presets</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EXPORT_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition text-xs flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#249144] bg-emerald-50/60 shadow-xs ring-1 ring-[#249144]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${isSelected ? 'text-[#14532d]' : 'text-slate-900'}`}>
                        {preset.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#249144]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      {preset.outputFormats.map(fmt => (
                        <span key={fmt} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Comprehensive Export Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Export Summary
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Video File</span>
                <p className="font-semibold text-slate-800 truncate" title={originalFilename}>
                  {originalFilename}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase">Duration</span>
                <p className="font-semibold text-slate-800 font-mono">
                  {formatSecondsToTimecode(durationSec, 'display')}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase">Subtitles</span>
                <p className="font-semibold text-slate-800">
                  {cues.length} cues
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase">Target Language</span>
                <p className="font-semibold text-slate-800 capitalize">
                  {targetLang === 'sat' ? 'Santali (Ol Chiki)' : targetLang}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase">Display Mode</span>
                <p className="font-semibold text-slate-800 truncate" title={getDisplayModeLabel(displayMode)}>
                  {getDisplayModeLabel(displayMode)}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase">Review Status</span>
                <p className="font-semibold text-slate-800">
                  {reviewSummary.reviewedCount} reviewed • {reviewSummary.reviewRequiredCount} need review
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase">Validation</span>
                <p className={`font-semibold flex items-center gap-1 ${hasCriticalErrors ? 'text-red-600' : 'text-[#14532d]'}`}>
                  {hasCriticalErrors ? '✗ Critical Issues' : '✓ No Critical Issues'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase">Active Style</span>
                <p className="font-semibold text-slate-800 truncate">
                  {activeStylePreset.name}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Non-Critical Warnings Banner */}
          {!hasCriticalErrors && hasWarnings && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">{report.warnings.length} Advisory Subtitle Warnings Remain</span>
                <p className="text-amber-800 text-[11px] leading-relaxed font-sans">
                  Warnings indicate neural translations or reading pacing guidelines. You may publish now or review the flagged cues.
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={warningsAcknowledged}
                    onChange={(e) => setWarningsAcknowledged(e.target.checked)}
                    className="rounded text-[#249144] focus:ring-[#249144]"
                  />
                  <span className="text-[11px] font-semibold text-amber-950">
                    I acknowledge remaining advisories and wish to proceed with export
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 4. Burned-In Rendering Progress / Result Card */}
          {isBurning && (
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#249144] animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Rendering Burned-in MP4 Video
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">FFmpeg ASS Engine</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{burnStage || 'Processing...'}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Stage-based execution • Preserves original resolution, aspect ratio, audio track, and timings.
              </p>
            </div>
          )}

          {completedBurnUrl && !isBurning && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#249144] shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-900">Burned-In Video Rendered Successfully!</h5>
                  <p className="text-[11px] text-emerald-700 font-sans mt-0.5">
                    Your MP4 with hardcoded subtitles is ready for download.
                  </p>
                </div>
              </div>
              <a
                href={completedBurnUrl}
                download={`${originalFilename.replace(/\.[^/.]+$/, '')}_subtitled.mp4`}
                className="px-4 py-2 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>
          )}

          {burnError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{burnError}</span>
            </div>
          )}

          {/* 5. Session Export History */}
          {sessionExports.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Current Session Export History</span>
                </label>
                <span className="text-[10px] text-slate-400 font-sans">
                  Session only • Not stored permanently in database
                </span>
              </div>

              <div className="space-y-1.5">
                {sessionExports.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono uppercase font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {item.format}
                      </span>
                      <span className="font-medium text-slate-800">{item.filename}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({item.timestamp})</span>
                    </div>

                    {item.url && (
                      <a
                        href={item.url}
                        download={item.filename}
                        className="text-[11px] font-bold text-[#249144] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Back to Editor
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Download SRT */}
            <button
              type="button"
              disabled={hasCriticalErrors}
              onClick={() => {
                onDownloadFile('srt');
                onRecordExport({
                  id: `srt_${Date.now()}`,
                  format: 'srt',
                  presetName: 'Standard SRT',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  filename: `${originalFilename.replace(/\.[^/.]+$/, '')}.srt`
                });
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition ${
                hasCriticalErrors
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer active:scale-98'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .SRT</span>
            </button>

            {/* Download VTT */}
            <button
              type="button"
              disabled={hasCriticalErrors}
              onClick={() => {
                onDownloadFile('vtt');
                onRecordExport({
                  id: `vtt_${Date.now()}`,
                  format: 'vtt',
                  presetName: 'Standard VTT',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  filename: `${originalFilename.replace(/\.[^/.]+$/, '')}.vtt`
                });
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition ${
                hasCriticalErrors
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-800 text-white cursor-pointer active:scale-98'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .VTT</span>
            </button>

            {/* Render Burned-In MP4 Video */}
            <button
              type="button"
              disabled={hasCriticalErrors || isBurning}
              onClick={handleStartBurnVideo}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition ${
                hasCriticalErrors || isBurning
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#249144] hover:bg-[#1a7536] text-white cursor-pointer active:scale-98'
              }`}
            >
              {isBurning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
              <span>{isBurning ? 'Rendering MP4...' : 'Render Burned-in MP4'}</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
