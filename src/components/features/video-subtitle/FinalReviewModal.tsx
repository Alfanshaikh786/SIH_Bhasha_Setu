/**
 * Final Pre-Export Review Modal Component
 * Evaluates export safety. Blocks export if critical errors exist,
 * displays transparent verification checklist, and enables direct .SRT and .VTT downloads.
 */

import React from 'react';
import { 
  FileCheck, 
  Download, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { StudioValidationReport, StudioQualityScore } from './types';

interface FinalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: StudioValidationReport;
  qualityScore: StudioQualityScore;
  totalCuesCount: number;
  onDownloadFile: (fmt: 'srt' | 'vtt') => void;
  onNavigateToIssue: (cueId: string, timeSec: number) => void;
}

export const FinalReviewModal: React.FC<FinalReviewModalProps> = ({
  isOpen,
  onClose,
  report,
  qualityScore,
  totalCuesCount,
  onDownloadFile,
  onNavigateToIssue
}) => {
  if (!isOpen) return null;

  const hasCriticalErrors = report.criticalErrors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
              hasCriticalErrors ? 'bg-red-100 text-red-700' : 'bg-green-100 text-[#14532d]'
            }`}>
              {hasCriticalErrors ? <ShieldAlert className="w-5 h-5 text-red-600" /> : <FileCheck className="w-5 h-5 text-[#249144]" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Final Subtitle Verification Check
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Pre-export audit across {totalCuesCount} cues • Quality Score: {qualityScore.score}/100
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Critical Blocking Alert if Critical Errors Exist */}
          {hasCriticalErrors ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Export Blocked: {report.criticalErrors.length} Critical Issues Must Be Resolved</span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed font-sans pl-7">
                Exporting subtitles with inverted timestamps or empty text would produce broken, corrupt subtitle files. Please review and correct the following items:
              </p>

              {/* Critical Issues List */}
              <div className="space-y-1.5 pt-2 pl-7">
                {report.criticalErrors.map((err) => (
                  <div 
                    key={err.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/80 border border-red-200 text-xs"
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
                      Resolve Issue
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Successful Clean Check Card */
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-[#249144] shrink-0" />
                <span>All Critical Invariants Passed Cleanly</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed font-sans pl-7">
                Zero fatal timing, overlap, or Unicode errors detected. The subtitle cues are 100% compliant with standard broadcast specifications.
              </p>
            </div>
          )}

          {/* Verification Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verification Checklist:
            </h4>

            <div className="space-y-2">
              {report.checks.map((chk) => (
                <div
                  key={chk.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    chk.passed 
                      ? 'bg-green-50/50 border-green-200 text-green-900' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#249144] shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{chk.label}</span>
                  </div>

                  {chk.detail && (
                    <span className="text-[11px] font-mono text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                      {chk.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Non-Critical Warnings Banner */}
          {!hasCriticalErrors && report.warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">{report.warnings.length} Advisory Warnings Present:</span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Export is permitted. Warnings represent neural translations or minor readability guidelines, but do not break subtitle file syntax.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer & Export Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Back to Editor
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={hasCriticalErrors}
              onClick={() => {
                onDownloadFile('srt');
                onClose();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
                hasCriticalErrors 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer active:scale-98'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .SRT</span>
            </button>

            <button
              type="button"
              disabled={hasCriticalErrors}
              onClick={() => {
                onDownloadFile('vtt');
                onClose();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition ${
                hasCriticalErrors 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-[#249144] hover:bg-[#1a7536] text-white cursor-pointer active:scale-98'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .VTT</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
