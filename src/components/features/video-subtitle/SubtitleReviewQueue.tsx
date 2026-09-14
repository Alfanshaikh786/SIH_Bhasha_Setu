/**
 * Subtitle Review Queue Component
 * Replaces repetitive single-card warnings with an intelligent categorized review queue:
 * Groups issues by category (Recognition, Translation, Timing, Readability, Script)
 * and allows fast targeted inspection and one-click bulk approval.
 */

import React, { useState } from 'react';
import { StudioCue, ReadinessScore } from './types';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Check, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  Volume2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { formatSecondsToTimecode } from './subtitleUtils';

interface SubtitleReviewQueueProps {
  cues: StudioCue[];
  readinessScore?: ReadinessScore;
  onSelectCue: (cueId: string) => void;
  onApproveCue: (cueId: string) => void;
  onApproveAll?: () => void;
  onRegenerateCue?: (cueId: string) => void;
}

type ReviewCategory = 'all' | 'recognition' | 'translation' | 'timing' | 'readability' | 'unicode';

export const SubtitleReviewQueue: React.FC<SubtitleReviewQueueProps> = ({
  cues,
  readinessScore,
  onSelectCue,
  onApproveCue,
  onApproveAll,
  onRegenerateCue
}) => {
  const [activeCategory, setActiveCategory] = useState<ReviewCategory>('recognition');

  // Categorize cues
  const recognitionCues = cues.filter(c => (c.confidence !== undefined && c.confidence < 0.65) || c.media_type === 'singing');
  const translationCues = cues.filter(c => c.is_stale || c.translation_status === 'STALE' || c.translation_status === 'MACHINE_TRANSLATED' || c.review_status === 'REVIEW_REQUIRED');
  const timingCues = cues.filter(c => c.issues && c.issues.some(i => i.type === 'timing' || i.type === 'overlap' || i.type === 'duration'));
  const readabilityCues = cues.filter(c => (c.cps && c.cps > 20) || (c.line_count && c.line_count > 2) || (c.issues && c.issues.some(i => i.type === 'readability')));

  const getFilteredList = () => {
    switch (activeCategory) {
      case 'recognition': return recognitionCues;
      case 'translation': return translationCues;
      case 'timing': return timingCues;
      case 'readability': return readabilityCues;
      case 'all':
      default:
        return cues.filter(c => c.review_status === 'REVIEW_REQUIRED' || c.is_stale || (c.confidence && c.confidence < 0.65));
    }
  };

  const currentList = getFilteredList();

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Header with Grouping Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#249144]" />
            <span>Human Review Gate & Queue</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Categorized issue batches prevent repetitive warnings and ensure honest verification.
          </p>
        </div>

        {onApproveAll && currentList.length > 0 && (
          <button
            type="button"
            onClick={onApproveAll}
            className="px-3 py-1.5 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve All in Category ({currentList.length})</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('recognition')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            activeCategory === 'recognition'
              ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Recognition Confidence</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-bold">
            {recognitionCues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('translation')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            activeCategory === 'translation'
              ? 'bg-blue-50 text-blue-900 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Translation Verification</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-200/70 text-blue-900 text-[10px] font-bold">
            {translationCues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('readability')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            activeCategory === 'readability'
              ? 'bg-teal-50 text-teal-900 border-teal-300 ring-2 ring-teal-500/20'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span>Readability & CPS</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-teal-200/70 text-teal-900 text-[10px] font-bold">
            {readabilityCues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('timing')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            activeCategory === 'timing'
              ? 'bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-500/20'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Timing Sync</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-200/70 text-purple-900 text-[10px] font-bold">
            {timingCues.length}
          </span>
        </button>
      </div>

      {/* Category Insight Banner */}
      {activeCategory === 'recognition' && (
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Acoustic ASR Confidence Alert (~34%)</span>
            <p className="text-[11px] text-amber-800 leading-snug">
              Singing vocals and background instruments reduce Whisper confidence. Review the original spoken transcript before approving machine translation.
            </p>
          </div>
        </div>
      )}

      {/* Queue Items */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {currentList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">All cues in this category are verified!</p>
          </div>
        ) : (
          currentList.map((cue) => (
            <div
              key={cue.id}
              className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-slate-800">
                    Cue #{cue.index}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    [{formatSecondsToTimecode(cue.start_sec, 'display')} → {formatSecondsToTimecode(cue.end_sec, 'display')}]
                  </span>
                  {cue.confidence !== undefined && (
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase font-mono ${
                      cue.confidence < 0.4 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      ASR {Math.round(cue.confidence * 100)}%
                    </span>
                  )}
                  {cue.is_stale && (
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                      ⚠ Stale Translation
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-slate-600 italic text-[11px] truncate">
                    Source: {cue.source_text || '(empty)'}
                  </p>
                  <p className="text-slate-900 font-bold font-sans text-xs truncate">
                    Ol Chiki: {cue.translated_text || '(empty)'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectCue(cue.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                >
                  Inspect
                </button>

                {cue.is_stale && onRegenerateCue && (
                  <button
                    type="button"
                    onClick={() => onRegenerateCue(cue.id)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer"
                  >
                    Regenerate
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onApproveCue(cue.id)}
                  className="px-2.5 py-1 rounded-lg bg-[#249144] hover:bg-[#1a7536] text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
