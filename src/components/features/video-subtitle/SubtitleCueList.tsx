/**
 * Simple Subtitle Cue List Component (Left Panel ~22%)
 * Fast, uncluttered navigator for subtitle cues.
 * Displays Cue #, Timecode, Santali preview, and single review indicator.
 */

import React, { useRef, useEffect } from 'react';
import { Plus, Check, AlertTriangle, Play, Music } from 'lucide-react';
import { StudioCue } from './types';
import { formatSecondsToTimecode } from './subtitleUtils';

interface SubtitleCueListProps {
  cues: StudioCue[];
  selectedCueId: string | null;
  activeCueId: string | null;
  onSelectCue: (cueId: string) => void;
  onSeekCue: (startSec: number) => void;
  onAddCue: () => void;
}

export const SubtitleCueList: React.FC<SubtitleCueListProps> = ({
  cues,
  selectedCueId,
  activeCueId,
  onSelectCue,
  onSeekCue,
  onAddCue
}) => {
  const activeItemRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll active cue into view during playback
  useEffect(() => {
    if (activeCueId && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeCueId]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Subtitles
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-mono font-bold">
            {cues.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onAddCue}
          className="px-2.5 py-1 rounded-lg bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
          title="Add new subtitle cue"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Cues List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2.5 space-y-2"
      >
        {cues.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No subtitles yet. Click '+ Add' to create one.
          </div>
        ) : (
          cues.map((cue) => {
            const isSelected = cue.id === selectedCueId;
            const isActive = cue.id === activeCueId;
            const isReviewed = cue.humanReviewStatus === 'reviewed' || cue.review_status === 'APPROVED';
            const isInstrumental = cue.media_type === 'instrumental';
            const needsReview = !isReviewed && (
              cue.review_status === 'REVIEW_REQUIRED' || 
              (cue.confidence !== undefined && cue.confidence < 0.65) ||
              cue.is_stale ||
              (cue.issues && cue.issues.some(i => i.severity === 'critical' || i.severity === 'warning'))
            );

            return (
              <div
                key={cue.id}
                ref={isActive ? activeItemRef : null}
                onClick={() => {
                  onSelectCue(cue.id);
                  onSeekCue(cue.start_sec);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-emerald-50/90 border-[#249144] ring-1 ring-[#249144]/30 shadow-xs'
                    : isActive
                    ? 'bg-slate-100/90 border-slate-300'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {/* Top Row: # Index, Timecode, Single Status */}
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[#249144]">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        #{cue.index}
                      </span>
                    ) : (
                      `#${cue.index}`
                    )}
                  </span>

                  <span className="text-[10px] text-slate-500 font-medium">
                    {formatSecondsToTimecode(cue.start_sec, 'display')} → {formatSecondsToTimecode(cue.end_sec, 'display')}
                  </span>

                  {/* Single Minimal Status Indicator */}
                  {isReviewed ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                      <Check className="w-2.5 h-2.5 text-[#249144]" /> OK
                    </span>
                  ) : needsReview ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Review
                    </span>
                  ) : null}
                </div>

                {/* Subtitle Preview */}
                {isInstrumental ? (
                  <p className="text-xs font-semibold text-purple-700 italic flex items-center gap-1">
                    <Music className="w-3 h-3 text-purple-600" />
                    <span>Instrumental Music</span>
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug break-words">
                    {cue.translated_text || cue.text || <span className="text-slate-400 italic">Empty subtitle</span>}
                  </p>
                )}

                {/* Small Latin snippet if available */}
                {cue.romanized_text && !isInstrumental && (
                  <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                    {cue.romanized_text}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
