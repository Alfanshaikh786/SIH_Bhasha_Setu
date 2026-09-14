/**
 * Simple Subtitle Timeline Component
 * One clean timeline lane with time ruler, subtle instrumental background tint,
 * interactive seeking, cue block selection, boundary drag trimming, and playback cursor.
 */

import React, { useRef, useState } from 'react';
import { Music, AlertTriangle } from 'lucide-react';
import { StudioCue, SnapPoint, MediaRegion } from './types';
import { formatSecondsToTimecode, findNearestSnapPoint, validateBoundaryAdjustment } from './subtitleUtils';

interface SubtitleTimelineProps {
  cues: StudioCue[];
  selectedCueId: string | null;
  activeCueId: string | null;
  currentTime: number;
  duration: number;
  mediaRegions?: MediaRegion[];
  onSelectCue: (cueId: string) => void;
  onSeek: (timeSec: number) => void;
  snapPoints?: SnapPoint[];
  onUpdateTiming?: (cueId: string, startSec: number, endSec: number) => void;
}

interface DragState {
  cueId: string;
  edge: 'start' | 'end';
  originalStart: number;
  originalEnd: number;
  currentStart: number;
  currentEnd: number;
  snappedTime: number | null;
}

export const SubtitleTimeline: React.FC<SubtitleTimelineProps> = ({
  cues,
  selectedCueId,
  activeCueId,
  currentTime,
  duration,
  mediaRegions = [],
  onSelectCue,
  onSeek,
  snapPoints = [],
  onUpdateTiming
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Time ruler ticks (every 5 seconds)
  const timeMarks = React.useMemo(() => {
    if (duration <= 0) return [];
    const step = duration > 120 ? 15 : duration > 60 ? 10 : 5;
    const marks: number[] = [];
    for (let t = 0; t <= duration; t += step) {
      marks.push(t);
    }
    return marks;
  }, [duration]);

  // Click on track to seek
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) return;
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = ratio * duration;
    onSeek(seekTime);
  };

  // Drag start for cue boundaries
  const handleMouseDownEdge = (
    e: React.MouseEvent,
    cue: StudioCue,
    edge: 'start' | 'end'
  ) => {
    e.stopPropagation();
    if (!onUpdateTiming) return;

    setDragState({
      cueId: cue.id,
      edge,
      originalStart: cue.start_sec,
      originalEnd: cue.end_sec,
      currentStart: cue.start_sec,
      currentEnd: cue.end_sec,
      snappedTime: null
    });

    const startX = e.clientX;
    const trackWidth = trackRef.current?.getBoundingClientRect().width || 1;

    const handleMouseMove = (moveEvt: MouseEvent) => {
      const deltaPx = moveEvt.clientX - startX;
      const deltaSec = (deltaPx / trackWidth) * duration;

      let newStart = cue.start_sec;
      let newEnd = cue.end_sec;

      if (edge === 'start') {
        newStart = Math.max(0, cue.start_sec + deltaSec);
        if (newEnd - newStart < 0.3) newStart = newEnd - 0.3;
      } else {
        newEnd = Math.min(duration, cue.end_sec + deltaSec);
        if (newEnd - newStart < 0.3) newEnd = newStart + 0.3;
      }

      // Snap to nearest boundary if within 120ms
      let snapped: number | null = null;
      if (snapPoints && snapPoints.length > 0) {
        const targetVal = edge === 'start' ? newStart : newEnd;
        const snap = findNearestSnapPoint(targetVal, snapPoints, 0.12);
        if (snap && snap.didSnap) {
          snapped = snap.snappedTime;
          if (edge === 'start') newStart = snap.snappedTime;
          else newEnd = snap.snappedTime;
        }
      }

      const valid = validateBoundaryAdjustment(newStart, newEnd, 0.30, duration);
      if (valid.valid) {
        setDragState(prev => prev ? {
          ...prev,
          currentStart: newStart,
          currentEnd: newEnd,
          snappedTime: snapped
        } : null);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      setDragState(curr => {
        if (curr && onUpdateTiming) {
          onUpdateTiming(curr.cueId, curr.currentStart, curr.currentEnd);
        }
        return null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-slate-900 rounded-xl p-3 select-none shadow-sm flex flex-col space-y-1">
      {/* Time Ruler */}
      <div className="w-full h-4 relative text-[10px] font-mono text-slate-400 overflow-hidden">
        {timeMarks.map((mark) => {
          const leftPercent = duration > 0 ? (mark / duration) * 100 : 0;
          return (
            <div
              key={mark}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: `${leftPercent}%` }}
            >
              <span>{formatSecondsToTimecode(mark, 'display')}</span>
              <div className="w-[1px] h-1.5 bg-slate-600" />
            </div>
          );
        })}
      </div>

      {/* Main Subtitle Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="w-full h-12 bg-slate-950 rounded-lg relative overflow-hidden cursor-pointer border border-slate-800"
      >
        {/* Subtle Background Regions for Instrumental Music */}
        {mediaRegions.filter(r => r.type === 'instrumental').map((region) => {
          const left = duration > 0 ? (region.start / duration) * 100 : 0;
          const width = duration > 0 ? (region.duration / duration) * 100 : 0;
          return (
            <div
              key={region.id}
              title={`Instrumental Music (${region.duration.toFixed(1)}s)`}
              className="absolute top-0 bottom-0 bg-purple-950/40 border-l border-r border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-300 pointer-events-none"
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="flex items-center gap-1 opacity-75">
                <Music className="w-3 h-3" />
                <span>Instrumental ({region.duration.toFixed(1)}s)</span>
              </span>
            </div>
          );
        })}

        {/* Subtitle Cue Blocks */}
        {cues.map((cue) => {
          if (duration <= 0) return null;

          const isBeingDragged = dragState?.cueId === cue.id;
          const start = isBeingDragged ? dragState.currentStart : cue.start_sec;
          const end = isBeingDragged ? dragState.currentEnd : cue.end_sec;

          const leftPercent = (start / duration) * 100;
          const widthPercent = Math.max(0.6, ((end - start) / duration) * 100);

          const isSelected = cue.id === selectedCueId;
          const isActive = cue.id === activeCueId;
          const needsReview = cue.review_status === 'REVIEW_REQUIRED' || (cue.confidence !== undefined && cue.confidence < 0.65);

          return (
            <div
              key={cue.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCue(cue.id);
                onSeek(cue.start_sec);
              }}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`
              }}
              className={`absolute top-1.5 bottom-1.5 rounded-md px-1.5 flex items-center justify-between text-xs transition-all overflow-hidden border ${
                isSelected
                  ? 'bg-[#249144] border-white text-white z-20 shadow-md ring-1 ring-white/50'
                  : isActive
                  ? 'bg-emerald-700/90 border-emerald-400 text-white z-10'
                  : needsReview
                  ? 'bg-amber-900/70 border-amber-500/60 text-amber-100 hover:bg-amber-800'
                  : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {/* Left boundary drag handle */}
              {onUpdateTiming && (
                <div
                  onMouseDown={(e) => handleMouseDownEdge(e, cue, 'start')}
                  className="absolute left-0 top-0 bottom-0 w-1.5 hover:w-2 hover:bg-white/40 cursor-ew-resize z-30"
                  title="Drag start boundary"
                />
              )}

              {/* Cue content preview */}
              <div className="flex items-center gap-1 overflow-hidden pointer-events-none">
                <span className="font-mono font-bold text-[10px] shrink-0 opacity-90">
                  #{cue.index}
                </span>
                {needsReview && (
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                )}
                <span className="truncate text-[10px] font-sans">
                  {cue.translated_text || cue.text}
                </span>
              </div>

              {/* Right boundary drag handle */}
              {onUpdateTiming && (
                <div
                  onMouseDown={(e) => handleMouseDownEdge(e, cue, 'end')}
                  className="absolute right-0 top-0 bottom-0 w-1.5 hover:w-2 hover:bg-white/40 cursor-ew-resize z-30"
                  title="Drag end boundary"
                />
              )}
            </div>
          );
        })}

        {/* Playhead Cursor */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-40 transition-none"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-2.5 h-2.5 bg-red-500 -ml-1 -top-1 absolute rotate-45" />
        </div>
      </div>
    </div>
  );
};
