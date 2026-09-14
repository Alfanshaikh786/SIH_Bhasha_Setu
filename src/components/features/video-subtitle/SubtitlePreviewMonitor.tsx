/**
 * Subtitle Preview Monitor Component
 * Multi-mode studio confidence monitor supporting:
 * 1. Synchronized Video Preview (Player with live style overlay)
 * 2. Subtitle-Only Confidence Monitor (Distraction-free broadcast inspection canvas)
 * 3. Linguistic Review Preview (Source vs Target comparative inspection)
 */

import React, { useState } from 'react';
import { 
  Video, 
  Monitor, 
  BookOpen, 
  Subtitles, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { 
  StudioCue, 
  SubtitleStyleConfig, 
  SubtitleDisplayMode 
} from './types';
import { 
  formatSecondsToTimecode, 
  formatDisplaySubtitleText,
  getRomanizedText 
} from './subtitleUtils';
import { SubtitleVideoPlayer } from './SubtitleVideoPlayer';

export type PreviewMonitorMode = 'video' | 'subtitle_only' | 'linguistic_review';

interface SubtitlePreviewMonitorProps {
  videoPreviewUrl: string;
  vttBlobUrl: string | null;
  targetLang: string;
  sourceLang?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  showSubtitles: boolean;
  activeCue: StudioCue | null;
  styleConfig: SubtitleStyleConfig;
  displayMode: SubtitleDisplayMode;
  videoRef: React.RefObject<HTMLVideoElement>;
  onTimeUpdate: (currTime: number) => void;
  onLoadedMetadata: (dur: number) => void;
  onTogglePlay: () => void;
  onSeekRelative: (offsetSec: number) => void;
  onSeekAbsolute: (timeSec: number) => void;
  onChangeSpeed: (speed: number) => void;
  onToggleSubtitles: () => void;
  onPrevCue?: () => void;
  onNextCue?: () => void;
}

export const SubtitlePreviewMonitor: React.FC<SubtitlePreviewMonitorProps> = ({
  videoPreviewUrl,
  vttBlobUrl,
  targetLang,
  sourceLang,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  showSubtitles,
  activeCue,
  styleConfig,
  displayMode,
  videoRef,
  onTimeUpdate,
  onLoadedMetadata,
  onTogglePlay,
  onSeekRelative,
  onSeekAbsolute,
  onChangeSpeed,
  onToggleSubtitles,
  onPrevCue,
  onNextCue
}) => {
  const [monitorMode, setMonitorMode] = useState<PreviewMonitorMode>('video');

  // Compute CSS styles based on SubtitleStyleConfig
  const getOverlayFontFamily = () => {
    switch (styleConfig.fontFamily) {
      case 'ol_chiki':
        return "'Noto Sans Ol Chiki', Arial, sans-serif";
      case 'serif':
        return "Domine, 'Times New Roman', serif";
      case 'sans':
        return "Inter, system-ui, sans-serif";
      case 'default':
      default:
        return "'Noto Sans Ol Chiki', Inter, system-ui, sans-serif";
    }
  };

  const getOverlayFontSize = () => {
    switch (styleConfig.fontSize) {
      case 'small':
        return 'clamp(10px, 1.2vw, 12px)';
      case 'large':
        return 'clamp(14px, 1.8vw, 17px)';
      case 'xlarge':
        return 'clamp(16px, 2.2vw, 20px)';
      case 'medium':
      default:
        return 'clamp(12px, 1.4vw, 14px)';
    }
  };

  const getOverlayFontWeight = () => {
    switch (styleConfig.fontWeight) {
      case 'bold': return 700;
      case 'medium': return 600;
      case 'regular':
      default: return 400;
    }
  };

  const getOverlayBackground = () => {
    switch (styleConfig.background) {
      case 'solid': return '#000000';
      case 'none': return 'transparent';
      case 'semi_transparent':
      default: return 'rgba(0, 0, 0, 0.72)';
    }
  };

  const getOverlayTextEffect = () => {
    switch (styleConfig.textEffect) {
      case 'shadow':
        return '2px 2px 4px rgba(0, 0, 0, 0.95)';
      case 'outline':
        return '0 0 2px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';
      case 'none':
      default:
        return 'none';
    }
  };

  const getPositionClasses = () => {
    switch (styleConfig.position) {
      case 'top': return 'top-5';
      case 'center': return 'top-1/2 -translate-y-1/2';
      case 'bottom':
      default: return 'bottom-6 sm:bottom-8';
    }
  };

  const getAlignmentClasses = () => {
    switch (styleConfig.alignment) {
      case 'left': return 'left-6 justify-start text-left';
      case 'right': return 'right-6 justify-end text-right';
      case 'center':
      default: return 'left-1/2 -translate-x-1/2 justify-center text-center';
    }
  };

  const activeFormatted = activeCue 
    ? formatDisplaySubtitleText(activeCue, displayMode) 
    : null;

  return (
    <div className="w-full flex flex-col space-y-2.5">
      
      {/* Top Monitor Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-[#249144]" />
            <span>Studio Preview Monitor</span>
          </span>
          {activeCue && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Cue #{activeCue.index}
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setMonitorMode('video')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              monitorMode === 'video'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-[#249144]" />
            <span>Video Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setMonitorMode('subtitle_only')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              monitorMode === 'subtitle_only'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5 text-blue-600" />
            <span>Subtitle Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setMonitorMode('linguistic_review')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              monitorMode === 'linguistic_review'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Linguistic Review</span>
          </button>
        </div>
      </div>

      {/* Monitor Display Area */}
      <div className="w-full relative">
        
        {/* MODE 1: Video Preview with Live Overlay */}
        {monitorMode === 'video' && (
          <div className="relative w-full">
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
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onTogglePlay={onTogglePlay}
              onSeekRelative={onSeekRelative}
              onSeekAbsolute={onSeekAbsolute}
              onChangeSpeed={onChangeSpeed}
              onToggleSubtitles={onToggleSubtitles}
              onPrevCue={onPrevCue}
              onNextCue={onNextCue}
            />

            {/* Custom Styled Subtitle Overlay rendered on top of video */}
            {showSubtitles && activeFormatted && (
              <div 
                className={`absolute ${getPositionClasses()} ${getAlignmentClasses()} z-20 pointer-events-none px-3 py-1 max-w-[80%] transition-all duration-150 rounded-md flex flex-col gap-0.5`}
                style={{
                  fontFamily: getOverlayFontFamily(),
                  fontSize: getOverlayFontSize(),
                  fontWeight: getOverlayFontWeight(),
                  backgroundColor: getOverlayBackground(),
                  textShadow: getOverlayTextEffect(),
                  color: styleConfig.presetId === 'high_contrast' ? '#fde047' : '#ffffff',
                  lineHeight: 1.3
                }}
              >
                <div>{activeFormatted.topText}</div>
                {activeFormatted.bottomText && (
                  <div className="text-[0.85em] opacity-90">{activeFormatted.bottomText}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: Subtitle-Only Confidence Monitor */}
        {monitorMode === 'subtitle_only' && (
          <div className="w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between p-6">
            
            {/* Safe Title Area Marker Guideline */}
            <div className="absolute inset-4 border border-dashed border-slate-800/80 rounded-xl pointer-events-none flex items-start justify-between p-2">
              <span className="text-[10px] font-mono text-slate-600">SAFE TITLE AREA (90%)</span>
              <span className="text-[10px] font-mono text-slate-600">CONFIDENCE MONITOR</span>
            </div>

            {/* Top metadata */}
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>TIMECODE: {formatSecondsToTimecode(currentTime, 'display')} / {formatSecondsToTimecode(duration, 'display')}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                STYLE: {styleConfig.presetId ? styleConfig.presetId.toUpperCase() : 'CUSTOM'}
              </div>
            </div>

            {/* Center / Positioned Subtitle Display */}
            <div className="flex-1 flex items-center justify-center relative z-10 my-4">
              {activeFormatted ? (
                <div
                  className="px-5 py-2.5 rounded-xl transition-all duration-150 max-w-[85%] text-center flex flex-col gap-1"
                  style={{
                    fontFamily: getOverlayFontFamily(),
                    fontSize: getOverlayFontSize(),
                    fontWeight: getOverlayFontWeight(),
                    backgroundColor: getOverlayBackground(),
                    textShadow: getOverlayTextEffect(),
                    color: styleConfig.presetId === 'high_contrast' ? '#fde047' : '#ffffff',
                    lineHeight: 1.4
                  }}
                >
                  <div>{activeFormatted.topText}</div>
                  {activeFormatted.bottomText && (
                    <div className="text-[0.88em] opacity-85">{activeFormatted.bottomText}</div>
                  )}
                </div>
              ) : (
                <div className="text-slate-600 font-mono text-xs italic">
                  [No active subtitle at current timecode]
                </div>
              )}
            </div>

            {/* Bottom playback transport */}
            <div className="flex items-center justify-between text-slate-300 z-10 border-t border-slate-900 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="w-8 h-8 rounded-lg bg-[#249144] hover:bg-[#1a7536] text-white flex items-center justify-center transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => onSeekRelative(-5)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSeekRelative(5)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs text-slate-400 font-sans">
                {activeCue ? `Cue ${activeCue.index} (${activeCue.duration_sec.toFixed(2)}s)` : 'No Cue Active'}
              </div>
            </div>

          </div>
        )}

        {/* MODE 3: Linguistic Review Preview */}
        {monitorMode === 'linguistic_review' && (
          <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-5 text-slate-100 flex flex-col space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Linguistic Alignment & Provenance</h4>
              </div>
              <span className="text-[11px] text-slate-400 font-sans">
                For manual linguist verification • Not auto-certified
              </span>
            </div>

            {activeCue ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Source Transcript Card */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Source Speech Transcript ({sourceLang?.toUpperCase() || 'AUDIO'})
                    </span>
                    {typeof activeCue.confidence === 'number' && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-700 text-emerald-300">
                        Conf: {Math.round(activeCue.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-sans text-slate-100 leading-relaxed min-h-[48px]">
                    {activeCue.source_text || <span className="italic text-slate-500">No source transcript available</span>}
                  </p>
                </div>

                {/* Target Translation Card */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Target Translation ({targetLang.toUpperCase()})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      {activeCue.translation_source || 'Translation'}
                    </span>
                  </div>
                  <p className="text-sm font-sans text-emerald-100 leading-relaxed min-h-[48px]">
                    {activeCue.translated_text || activeCue.text || <span className="italic text-slate-500">No translation text</span>}
                  </p>
                </div>

                {/* Romanization Phonetic Breakdown if Santali Ol Chiki */}
                {activeCue.translated_text && getRomanizedText(activeCue.translated_text) && (
                  <div className="md:col-span-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">Phonetic Romanization: </span>
                      <span className="font-mono text-amber-200">
                        {getRomanizedText(activeCue.translated_text)}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-sans text-xs italic">
                Play or seek the video to inspect subtitle cues side-by-side.
              </div>
            )}

            {/* Bottom playback transport */}
            <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="px-3 py-1.5 rounded-lg bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <div className="text-xs font-mono text-slate-400 pl-2">
                  {formatSecondsToTimecode(currentTime, 'display')}
                </div>
              </div>

              {activeCue && (
                <div className="text-[11px] text-slate-400">
                  Review Status: <span className="capitalize font-semibold text-slate-200">{activeCue.humanReviewStatus || 'not_reviewed'}</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
