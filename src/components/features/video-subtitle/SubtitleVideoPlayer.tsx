/**
 * Subtitle Video Player Component
 * Embeds the HTML5 video player with dynamically mounted WebVTT subtitle track,
 * real-time playback synchronization, and comprehensive studio playback controls.
 */

import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Subtitles, 
  Volume2, 
  VolumeX,
  Gauge
} from 'lucide-react';
import { formatSecondsToTimecode } from './subtitleUtils';

interface SubtitleVideoPlayerProps {
  videoPreviewUrl: string;
  vttBlobUrl: string | null;
  targetLang: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  showSubtitles: boolean;
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

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const SubtitleVideoPlayer: React.FC<SubtitleVideoPlayerProps> = ({
  videoPreviewUrl,
  vttBlobUrl,
  targetLang,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  showSubtitles,
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
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [aspectClass, setAspectClass] = useState<string>('aspect-video');

  const handleLoadedMetadataInternal = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const vid = e.currentTarget;
    if (vid.videoWidth && vid.videoHeight) {
      const ratio = vid.videoWidth / vid.videoHeight;
      if (ratio < 0.75) {
        setAspectClass('aspect-[9/16]');
      } else if (ratio >= 0.75 && ratio <= 1.25) {
        setAspectClass('aspect-square');
      } else {
        setAspectClass('aspect-video');
      }
    }
    onLoadedMetadata(vid.duration);
  };

  // Sync playback rate to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoRef]);

  // Sync track visibility
  useEffect(() => {
    if (videoRef.current && videoRef.current.textTracks && videoRef.current.textTracks.length > 0) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        videoRef.current.textTracks[i].mode = showSubtitles ? 'showing' : 'hidden';
      }
    }
  }, [showSubtitles, vttBlobUrl, videoRef]);

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleToggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-800 relative group flex flex-col">
      {/* Video Display Area */}
      <div 
        className={`w-full ${aspectClass} max-h-[min(480px,calc(100vh-340px))] bg-black relative flex items-center justify-center cursor-pointer transition-all duration-300`}
        onClick={onTogglePlay}
      >
        <video
          ref={videoRef}
          src={videoPreviewUrl}
          className="w-full h-full object-contain pointer-events-auto max-h-[min(480px,calc(100vh-340px))]"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onLoadedMetadata={handleLoadedMetadataInternal}
          playsInline
        >
          {vttBlobUrl && (
            <track
              key={vttBlobUrl}
              label="Bhasha Setu Subtitles"
              kind="subtitles"
              srcLang={targetLang}
              src={vttBlobUrl}
              default={showSubtitles}
            />
          )}
          Your browser does not support HTML5 video.
        </video>

        {/* Center overlay play button indicator when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
              <Play className="w-7 h-7 fill-current translate-x-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Control Bar Overlay */}
      <div className="bg-slate-950/95 border-t border-slate-800 p-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 text-slate-200">
        
        {/* Left: Playback & Seeking */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="w-8 h-8 rounded-lg bg-[#249144] hover:bg-[#1e7e34] text-white flex items-center justify-center transition shadow-xs"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
          </button>

          {/* Jump -5s */}
          <button
            type="button"
            onClick={() => onSeekRelative(-5)}
            title="Rewind 5 seconds"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Jump +5s */}
          <button
            type="button"
            onClick={() => onSeekRelative(5)}
            title="Forward 5 seconds"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Prev Cue */}
          {onPrevCue && (
            <button
              type="button"
              onClick={onPrevCue}
              title="Previous Subtitle Cue"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Next Cue */}
          {onNextCue && (
            <button
              type="button"
              onClick={onNextCue}
              title="Next Subtitle Cue"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Timecode counter */}
          <div className="font-mono text-xs text-slate-300 pl-1">
            <span>{formatSecondsToTimecode(currentTime, 'display')}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{formatSecondsToTimecode(duration, 'display')}</span>
          </div>
        </div>

        {/* Right: Audio, Subtitles, Speed, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mute toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Subtitle track toggle */}
          <button
            type="button"
            onClick={onToggleSubtitles}
            title={showSubtitles ? 'Hide Subtitles' : 'Show Subtitles'}
            className={`px-2.5 h-8 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              showSubtitles 
                ? 'bg-[#249144]/20 border border-[#249144] text-green-400' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>CC</span>
          </button>

          {/* Playback speed selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              title="Playback Speed"
              className="px-2 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-300 flex items-center gap-1 transition"
            >
              <Gauge className="w-3 h-3 text-slate-400" />
              <span>{playbackRate}x</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute right-0 bottom-10 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl z-50 min-w-[70px] space-y-0.5">
                {SPEED_OPTIONS.map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      onChangeSpeed(spd);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1 text-xs font-mono rounded-lg transition ${
                      playbackRate === spd 
                        ? 'bg-[#249144] text-white font-bold' 
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title="Fullscreen"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
