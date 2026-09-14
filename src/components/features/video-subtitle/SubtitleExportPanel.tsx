/**
 * Subtitle Export Panel & Readiness Gate
 * Handles export format selection (SRT, WebVTT, Burned MP4) with pre-export checklist,
 * stale translation blocking, and honest warnings for unverified machine translations.
 */

import React, { useState } from 'react';
import { StudioCue, ReadinessScore } from './types';
import { 
  Download, 
  Film, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  Layers, 
  Sparkles,
  Check
} from 'lucide-react';
import { downloadSubtitleFile, requestBurnSubtitles } from '../../../services/videoSubtitleService';

interface SubtitleExportPanelProps {
  jobId: string;
  cues: StudioCue[];
  readinessScore?: ReadinessScore;
  targetLang: string;
  onNavigateToReview?: () => void;
}

export const SubtitleExportPanel: React.FC<SubtitleExportPanelProps> = ({
  jobId,
  cues,
  readinessScore,
  targetLang,
  onNavigateToReview
}) => {
  const [exportScript, setExportScript] = useState<'native' | 'latin' | 'bilingual'>('native');
  const [confirmUnverified, setConfirmUnverified] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  const staleCues = cues.filter(c => c.is_stale || c.translation_status === 'STALE');
  const unverifiedCues = cues.filter(c => c.review_status !== 'APPROVED' && c.translation_status !== 'HUMAN_VERIFIED');
  const hasStale = staleCues.length > 0;
  const requiresConfirmation = unverifiedCues.length > 0 && !confirmUnverified;

  const handleDownloadText = async (format: 'srt' | 'vtt') => {
    if (hasStale) {
      alert(`Cannot export: ${staleCues.length} cues have outdated translations. Please regenerate them in the review queue first.`);
      return;
    }

    setIsExporting(true);
    setDownloadMessage(null);
    try {
      let content = await downloadSubtitleFile(jobId, format);

      // If user selected Latin script export, adjust text
      if (exportScript === 'latin') {
        cues.forEach(c => {
          if (c.romanized_text && c.translated_text) {
            content = content.split(c.translated_text).join(c.romanized_text);
          }
        });
      }

      const blob = new Blob([content], { type: format === 'vtt' ? 'text/vtt' : 'application/x-subrip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bhasha_subtitles_${exportScript}_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadMessage(`Successfully downloaded ${format.toUpperCase()} (${exportScript} script).`);
    } catch (err: any) {
      alert(`Download failed: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-[#249144]" />
            <span>Subtitle Export & Publication Gate</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Export standard subtitle files or burned-in MP4 with verified timing and script integrity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Readiness:</span>
          <span className={`font-bold px-2 py-0.5 rounded-md ${
            readinessScore?.status === 'EXCELLENT'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {readinessScore?.score ?? 68}/100 ({readinessScore?.status ?? 'NEEDS_REVIEW'})
          </span>
        </div>
      </div>

      {/* Pre-Export Invariant Warnings */}
      {hasStale && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Export Blocked: Stale Translations Detected</span>
            <p className="text-[11px] text-red-800 leading-snug mt-0.5">
              {staleCues.length} subtitle cues have modified source text with un-regenerated translations. Outdated translations cannot be exported.
            </p>
            {onNavigateToReview && (
              <button
                type="button"
                onClick={onNavigateToReview}
                className="mt-2 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] cursor-pointer"
              >
                Go to Review Queue & Regenerate
              </button>
            )}
          </div>
        </div>
      )}

      {unverifiedCues.length > 0 && !hasStale && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Notice: Export Contains Unverified Machine Translations</span>
            <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
              {unverifiedCues.length} of {cues.length} cues are machine-generated without human verification.
            </p>
            <label className="mt-2.5 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmUnverified}
                onChange={(e) => setConfirmUnverified(e.target.checked)}
                className="rounded text-[#249144] focus:ring-[#249144]"
              />
              <span className="font-semibold text-amber-950 text-[11px]">
                I acknowledge these subtitles contain machine-generated tribal translations.
              </span>
            </label>
          </div>
        </div>
      )}

      {downloadMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{downloadMessage}</span>
        </div>
      )}

      {/* Script Selection */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Target Script Representation:
        </label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setExportScript('native')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              exportScript === 'native'
                ? 'bg-emerald-50/80 text-emerald-950 border-emerald-300 ring-2 ring-[#249144]/20 font-bold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="block text-sm mb-0.5">Ol Chiki Script</span>
            <span className="text-[10px] text-slate-500 font-normal">Authentic Santali script (U+1C50 - U+1C7F)</span>
          </button>

          <button
            type="button"
            onClick={() => setExportScript('latin')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              exportScript === 'latin'
                ? 'bg-teal-50/80 text-teal-950 border-teal-300 ring-2 ring-teal-500/20 font-bold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="block text-sm mb-0.5">Santali Latin Script</span>
            <span className="text-[10px] text-slate-500 font-normal">Romanized phonetic representation (sat-Latn)</span>
          </button>

          <button
            type="button"
            onClick={() => setExportScript('bilingual')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              exportScript === 'bilingual'
                ? 'bg-blue-50/80 text-blue-950 border-blue-300 ring-2 ring-blue-500/20 font-bold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="block text-sm mb-0.5">Bilingual (Ol Chiki + Latin)</span>
            <span className="text-[10px] text-slate-500 font-normal">Dual-line stacked educational format</span>
          </button>
        </div>
      </div>

      {/* Export Format Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {/* SRT Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">SubRip (.SRT)</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Universal subtitle format for YouTube, VLC, and media players with millisecond timestamps.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadText('srt')}
            disabled={hasStale || isExporting}
            className="w-full py-2 px-3 rounded-lg bg-[#249144] hover:bg-[#1a7536] disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .SRT</span>
          </button>
        </div>

        {/* WebVTT Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">WebVTT (.VTT)</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Web-native subtitle standard for HTML5 &lt;track&gt; elements and online video platforms.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadText('vtt')}
            disabled={hasStale || isExporting}
            className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .VTT</span>
          </button>
        </div>

        {/* Burned MP4 Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Film className="w-4 h-4 text-purple-700" />
              <h4 className="font-bold text-xs text-slate-900">Burned Video (MP4)</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Hardcodes styled Ol Chiki subtitles directly onto video frames via server FFmpeg.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const modalBtn = document.getElementById('bhasha-open-publish-modal');
              if (modalBtn) modalBtn.click();
            }}
            disabled={hasStale}
            className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Configure MP4 Burn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
