/**
 * VIEW B: Santali — Latin & Voice Workspace
 * Dedicated workspace for Santali Latin phonetic editing, pronunciation fine-tuning,
 * and AI voice synthesis with truthful provider labeling (Native Santali vs Pronunciation Approximation).
 */

import React, { useState } from 'react';
import { StudioCue, SnapPoint, MediaRegion, MediaCoverage } from './types';
import { SubtitleVideoPlayer } from './SubtitleVideoPlayer';
import { SubtitleTimeline } from './SubtitleTimeline';
import { formatSecondsToTimecode, speakCuePronunciation } from './subtitleUtils';
import { 
  Volume2, 
  Play, 
  Pause, 
  Languages, 
  Sparkles, 
  ShieldAlert, 
  Info, 
  Check, 
  VolumeX, 
  RefreshCw, 
  AudioWaveform as WaveIcon,
  HelpCircle
} from 'lucide-react';

interface LatinVoiceWorkspaceProps {
  cues: StudioCue[];
  selectedCue: StudioCue | null;
  activeCue: StudioCue | null;
  videoPreviewUrl: string;
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
  snapPoints?: SnapPoint[];
}

export const LatinVoiceWorkspace: React.FC<LatinVoiceWorkspaceProps> = ({
  cues,
  selectedCue,
  activeCue,
  videoPreviewUrl,
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
  snapPoints = []
}) => {
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('hi-IN');

  const currentCueIndex = cues.findIndex(c => c.id === selectedCue?.id);

  const handleSpeak = async (cue: StudioCue) => {
    setIsSpeaking(true);
    try {
      await speakCuePronunciation(cue);
    } catch (err) {
      console.error('Speech playback error:', err);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0">
      {/* Left Panel: Cue List with Latin & Audio Buttons (Col 1-4) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-[420px] lg:min-h-0 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-teal-600" />
              <span>Santali Latin & Voice Tracks</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {cues.length} speech cues with phonetic Latin bridges
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
            sat-Latn
          </span>
        </div>

        {/* Scrollable Cue List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {cues.map((cue) => {
            const isSelected = selectedCue?.id === cue.id;
            const isActive = activeCue?.id === cue.id;

            return (
              <div
                key={cue.id}
                onClick={() => {
                  onSelectCue(cue.id);
                  onSeek(cue.start_sec);
                }}
                className={`p-3 rounded-xl border text-xs transition cursor-pointer flex flex-col space-y-2 ${
                  isSelected
                    ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                    : isActive
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      #{cue.index}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatSecondsToTimecode(cue.start_sec, 'display')} → {formatSecondsToTimecode(cue.end_sec, 'display')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(cue);
                    }}
                    title="Play phonetic audio"
                    className="p-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Listen</span>
                  </button>
                </div>

                {/* Ol Chiki native */}
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Ol Chiki:
                  </span>
                  <p className="text-slate-900 font-bold font-sans line-clamp-1">
                    {cue.translated_text || '(no translation)'}
                  </p>
                </div>

                {/* Latin Phonetic Script */}
                <div className="p-2 rounded-lg bg-teal-50/50 border border-teal-200/60">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-800 block mb-0.5">
                    Latin (sat-Latn):
                  </span>
                  <p className="text-teal-950 font-mono text-[11px] line-clamp-2">
                    {cue.romanized_text || '(latin transliteration pending)'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center & Right Panel: Video + Voice Tuning Studio (Col 5-12) */}
      <div className="lg:col-span-8 flex flex-col space-y-3 min-h-0">
        {/* Dynamic Aspect-Ratio Video Player */}
        <div className="bg-black rounded-2xl overflow-hidden shadow-md flex items-center justify-center relative min-h-[220px] max-h-[min(420px,calc(100vh-400px))]">
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
          />
        </div>

        {/* Dedicated Voice Inspector & TTS Player Card */}
        {selectedCue ? (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-mono font-bold text-sm">
                  #{selectedCue.index}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Phonetic Voice Tuning & Speech Synthesis
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Duration: {selectedCue.duration_sec.toFixed(2)}s • Timecode: {formatSecondsToTimecode(selectedCue.start_sec, 'display')}
                  </p>
                </div>
              </div>

              {/* Truth-in-Labeling Provider Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Pronunciation Approximation (Browser Indian Acoustic Route)</span>
              </div>
            </div>

            {/* Script Display Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Ol Chiki Native Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Language (Ol Chiki Script):
                </span>
                <p className="text-base font-bold text-slate-900 font-sans">
                  {selectedCue.translated_text || '(empty)'}
                </p>
              </div>

              {/* Editable Santali Latin Card */}
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    Phonetic Latin (TTS Input Text):
                  </span>
                  <span className="text-[9px] font-mono text-teal-700">sat-Latn</span>
                </div>
                <input
                  type="text"
                  value={selectedCue.romanized_text || ''}
                  onChange={(e) => {
                    onUpdateText(
                      selectedCue.id,
                      selectedCue.translated_text,
                      selectedCue.source_text,
                      e.target.value
                    );
                  }}
                  className="w-full bg-white border border-teal-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-teal-950 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                  placeholder="Type phonetic pronunciation..."
                />
              </div>
            </div>

            {/* Voice Transport Controls */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSpeak(selectedCue)}
                  disabled={isSpeaking}
                  className="px-4 py-2 rounded-xl bg-[#249144] hover:bg-[#1a7536] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer active:scale-95"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeaking ? 'Synthesizing...' : '▶ Listen Translation'}</span>
                </button>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 text-[11px]">Speed:</span>
                  {[0.75, 1.0, 1.25].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setTtsSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                        ttsSpeed === spd
                          ? 'bg-teal-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Music/Singing Clarification Notice */}
              {selectedCue.media_type === 'singing' && (
                <div className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Singing detected. Spoken translation audio available (translated singing not currently generated).</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <Volume2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">Select a cue from the left list to tune voice audio</p>
          </div>
        )}

        {/* 100% Full Timeline */}
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
    </div>
  );
};
