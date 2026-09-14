/**
 * VIEW A: Santali — Ol Chiki Subtitle Workspace
 * Dedicated primary workspace for native Ol Chiki subtitle creation, source transcription editing,
 * line wrapping (max 2 lines, 42 chars), and confidence-aware review.
 */

import React from 'react';
import { StudioCue, SubtitleViewMode, SnapPoint, MediaRegion, MediaCoverage, AddCueType } from './types';
import { SubtitleCueList } from './SubtitleCueList';
import { SubtitleCueEditor } from './SubtitleCueEditor';
import { SubtitleVideoPlayer } from './SubtitleVideoPlayer';
import { SubtitleTimeline } from './SubtitleTimeline';
import { AudioWaveform } from './AudioWaveform';
import { 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Info, 
  Plus, 
  Music,
  Check
} from 'lucide-react';

interface OlChikiWorkspaceProps {
  cues: StudioCue[];
  selectedCue: StudioCue | null;
  activeCue: StudioCue | null;
  videoPreviewUrl: string;
  videoFile: File | null;
  vttBlobUrl: string | null;
  targetLang: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  showSubtitles: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaRegions: MediaRegion[];
  mediaCoverage?: MediaCoverage;
  onSelectCue: (cueId: string) => void;
  onSeek: (timeSec: number) => void;
  onTogglePlay: () => void;
  onSeekRelative: (offset: number) => void;
  onChangeSpeed: (speed: number) => void;
  onToggleSubtitles: () => void;
  onUpdateText: (cueId: string, transText: string, srcText?: string, romanText?: string) => void;
  onUpdateTiming: (cueId: string, startSec: number, endSec: number) => void;
  onUpdateSpeaker: (cueId: string, speaker: string) => void;
  onSplitCue: (cueId: string, splitSec: number) => void;
  onMergePrevious: (cueId: string) => void;
  onMergeNext: (cueId: string) => void;
  onDuplicateCue: (cueId: string) => void;
  onDeleteCue: (cueId: string) => void;
  onAddCue: (type?: AddCueType) => void;
  onApproveCue?: (cueId: string) => void;
  onRegenerateCue?: (cueId: string) => void;
  snapPoints?: SnapPoint[];
}

export const OlChikiWorkspace: React.FC<OlChikiWorkspaceProps> = ({
  cues,
  selectedCue,
  activeCue,
  videoPreviewUrl,
  videoFile,
  vttBlobUrl,
  targetLang,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  showSubtitles,
  videoRef,
  mediaRegions,
  mediaCoverage,
  onSelectCue,
  onSeek,
  onTogglePlay,
  onSeekRelative,
  onChangeSpeed,
  onToggleSubtitles,
  onUpdateText,
  onUpdateTiming,
  onUpdateSpeaker,
  onSplitCue,
  onMergePrevious,
  onMergeNext,
  onDuplicateCue,
  onDeleteCue,
  onAddCue,
  onApproveCue,
  onRegenerateCue,
  snapPoints = []
}) => {
  const currentCueIndex = cues.findIndex(c => c.id === selectedCue?.id);
  const canMergePrev = currentCueIndex > 0;
  const canMergeNext = currentCueIndex >= 0 && currentCueIndex < cues.length - 1;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0">
      {/* Left Panel: Cue Navigator (Col 1-3) */}
      <div className="lg:col-span-3 min-h-[420px] lg:min-h-0 flex flex-col">
        <SubtitleCueList
          cues={cues}
          selectedCueId={selectedCue?.id || null}
          activeCueId={activeCue?.id || null}
          onSelectCue={onSelectCue}
          onSeekCue={onSeek}
          onAddCue={() => onAddCue('dialogue')}
        />
      </div>

      {/* Center Panel: Video Preview + Active Subtitle + Full Timeline (Col 4-8) */}
      <div className="lg:col-span-6 flex flex-col space-y-3 min-h-0">
        {/* Dynamic Aspect-Ratio Video Player */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-md flex items-center justify-center relative min-h-[220px] max-h-[min(480px,calc(100vh-340px))]">
          <SubtitleVideoPlayer
            videoPreviewUrl={videoPreviewUrl}
            vttBlobUrl={vttBlobUrl}
            targetLang={targetLang}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            showSubtitles={showSubtitles}
            videoRef={videoRef}
            onTimeUpdate={() => {}}
            onLoadedMetadata={() => {}}
            onTogglePlay={onTogglePlay}
            onSeekRelative={onSeekRelative}
            onSeekAbsolute={onSeek}
            onChangeSpeed={onChangeSpeed}
            onToggleSubtitles={onToggleSubtitles}
            onPrevCue={() => {
              if (currentCueIndex > 0) onSelectCue(cues[currentCueIndex - 1].id);
            }}
            onNextCue={() => {
              if (currentCueIndex >= 0 && currentCueIndex < cues.length - 1) onSelectCue(cues[currentCueIndex + 1].id);
            }}
          />
        </div>

        {/* Live Active Subtitle Overlay Strip */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Active Subtitle (Ol Chiki):
              </span>
              {activeCue && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  Cue #{activeCue.index}
                </span>
              )}
            </div>
            <p className="text-base font-bold text-slate-900 font-sans truncate">
              {activeCue?.translated_text || <span className="text-slate-400 italic text-xs font-normal">No subtitle active at current timecode</span>}
            </p>
          </div>

          {activeCue && activeCue.source_text && (
            <div className="hidden sm:block max-w-[220px] text-right text-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Spoken Transcript:
              </span>
              <p className="text-slate-600 truncate italic">
                {activeCue.source_text}
              </p>
            </div>
          )}
        </div>

        {/* Audio Waveform */}
        <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
          <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              Acoustic Energy & Speech Peaks
            </span>
            <span className="font-mono text-[9px] text-slate-500">
              Web Audio 16 kHz Mono
            </span>
          </div>
          <AudioWaveform
            videoFile={videoFile}
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
            height={38}
          />
        </div>

        {/* 100% Full Timeline with Media Regions & Review Flags */}
        <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 text-white">
          <SubtitleTimeline
            cues={cues}
            selectedCueId={selectedCue?.id || null}
            activeCueId={activeCue?.id || null}
            currentTime={currentTime}
            duration={duration}
            onSelectCue={onSelectCue}
            onSeek={onSeek}
            snapPoints={snapPoints}
            onUpdateTiming={onUpdateTiming}
          />
        </div>
      </div>

      {/* Right Panel: Cue Inspector (Col 9-12) */}
      <div className="lg:col-span-3 min-h-[420px] lg:min-h-0 flex flex-col">
        <SubtitleCueEditor
          cue={selectedCue}
          videoDuration={duration}
          currentPlaybackTime={currentTime}
          onUpdateText={onUpdateText}
          onUpdateTiming={onUpdateTiming}
          onSplitCue={onSplitCue}
          onDeleteCue={onDeleteCue}
          onMarkReviewed={onApproveCue}
        />
      </div>
    </div>
  );
};
