/**
 * Simple Subtitle Cue Editor Component (Right Panel ~25%)
 * Clean, focused editor for the selected subtitle cue:
 * - Cue # and Timecodes
 * - ORIGINAL TRANSCRIPT (editable, stale invalidation + regenerate button)
 * - SANTALI — OL CHIKI (editable)
 * - LATIN / PRONUNCIATION (editable)
 * - 🔊 Listen Button with actual working audio playback & truth-in-labeling
 * - Minimal status: e.g. "⚠ Low recognition confidence: 34%" + [✓ Approve] button
 * - Small expandable "Details" section for provenance, CPS, and actions
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  AlertTriangle, 
  Volume2, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  Scissors,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { StudioCue, SnapPoint } from './types';
import { formatSecondsToTimecode, parseTimecodeToSeconds, speakCuePronunciation } from './subtitleUtils';
import { synthesizeTTS } from '../../../services/videoSubtitleService';

interface SubtitleCueEditorProps {
  cue: StudioCue | null;
  videoDuration: number;
  currentPlaybackTime: number;
  contentMode?: 'song_lyrics' | 'speech_dialogue' | 'instrumental' | 'mixed';
  onUpdateText: (cueId: string, transText: string, sourceText?: string, romanText?: string) => void;
  onUpdateTiming: (cueId: string, startSec: number, endSec: number) => void;
  onSplitCue: (cueId: string, splitTimeSec: number) => void;
  onDeleteCue: (cueId: string) => void;
  onMarkReviewed?: (cueId: string) => void;
  onRegenerateTranslation?: (cueId: string) => void;
}

export const SubtitleCueEditor: React.FC<SubtitleCueEditorProps> = ({
  cue,
  videoDuration,
  currentPlaybackTime,
  contentMode,
  onUpdateText,
  onUpdateTiming,
  onSplitCue,
  onDeleteCue,
  onMarkReviewed,
  onRegenerateTranslation
}) => {
  if (!cue) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
        <span className="text-3xl mb-2 opacity-60">✍️</span>
        <h4 className="font-bold text-slate-700 text-sm">No Subtitle Selected</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Select any cue from the left list or click on the timeline to edit.
        </p>
      </div>
    );
  }

  // Local state for immediate typing responsiveness
  const [translatedText, setTranslatedText] = useState(cue.translated_text || '');
  const [sourceText, setSourceText] = useState(cue.source_text || '');
  const [romanizedText, setRomanizedText] = useState(cue.romanized_text || '');
  const [startTimeInput, setStartTimeInput] = useState(formatSecondsToTimecode(cue.start_sec, 'display'));
  const [endTimeInput, setEndTimeInput] = useState(formatSecondsToTimecode(cue.end_sec, 'display'));
  const [timingError, setTimingError] = useState<string | null>(null);

  // Expandable details accordion
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Functional TTS State
  const [ttsState, setTtsState] = useState<'idle' | 'generating' | 'playing' | 'error'>('idle');
  const [ttsVoiceLabel, setTtsVoiceLabel] = useState<string>('Pronunciation Approximation');
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state when selected cue changes
  useEffect(() => {
    setTranslatedText(cue.translated_text || '');
    setSourceText(cue.source_text || '');
    setRomanizedText(cue.romanized_text || '');
    setStartTimeInput(formatSecondsToTimecode(cue.start_sec, 'display'));
    setEndTimeInput(formatSecondsToTimecode(cue.end_sec, 'display'));
    setTimingError(null);
    setTtsState('idle');
    setTtsError(null);
  }, [cue.id, cue.start_sec, cue.end_sec, cue.translated_text, cue.source_text, cue.romanized_text]);

  // Handlers for text changes
  const handleTranslatedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTranslatedText(val);
    onUpdateText(cue.id, val, sourceText, romanizedText);
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSourceText(val);
    onUpdateText(cue.id, translatedText, val, romanizedText);
  };

  const handleRomanizedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRomanizedText(val);
    onUpdateText(cue.id, translatedText, sourceText, val);
  };

  // Timestamp blur commit
  const handleTimingBlur = () => {
    const parsedStart = parseTimecodeToSeconds(startTimeInput);
    const parsedEnd = parseTimecodeToSeconds(endTimeInput);

    if (parsedStart === null || parsedEnd === null) {
      setTimingError('Invalid timecode. Use MM:SS.mmm');
      return;
    }
    if (parsedStart < 0) {
      setTimingError('Start time cannot be negative.');
      return;
    }
    if (parsedEnd <= parsedStart) {
      setTimingError('End time must be greater than start time.');
      return;
    }
    setTimingError(null);
    onUpdateTiming(cue.id, parsedStart, parsedEnd);
  };

  // Functional TTS Listen Trigger
  const handleListenClick = async () => {
    if (ttsState === 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setTtsState('idle');
      return;
    }

    setTtsState('generating');
    setTtsError(null);

    const textToSynthesize = (romanizedText || translatedText || sourceText).trim();
    if (!textToSynthesize) {
      setTtsState('error');
      setTtsError('Subtitle has no text to pronounce.');
      return;
    }

    try {
      // 1. Call Backend TTS Provider
      const res = await synthesizeTTS(textToSynthesize, 'sat', 'Latin', 1.0);
      
      const label = res.is_native ? 'Native Santali Voice' : 'Pronunciation Approximation';
      setTtsVoiceLabel(label);

      // 2. Play audio based on provider response
      if (res.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${res.audio_base64}`);
        audioRef.current = audio;
        audio.onplay = () => setTtsState('playing');
        audio.onended = () => setTtsState('idle');
        audio.onerror = () => {
          setTtsState('error');
          setTtsError('Audio playback failed.');
        };
        await audio.play();
      } else {
        // Fallback: Browser Web Speech API with Indian cadence
        setTtsState('playing');
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToSynthesize);
          utterance.lang = 'hi-IN'; // Indian acoustic cadence approximation
          utterance.rate = 0.90;
          utterance.onend = () => setTtsState('idle');
          utterance.onerror = () => {
            setTtsState('error');
            setTtsError('Speech synthesis failed.');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setTtsState('idle');
        }
      }
    } catch (err: any) {
      console.warn('TTS Synthesis failed, executing local fallback:', err);
      // Resilient fallback: speak directly via speech synthesis
      try {
        setTtsVoiceLabel('Pronunciation Approximation');
        setTtsState('playing');
        speakCuePronunciation({
          ...cue,
          romanized_text: romanizedText,
          translated_text: translatedText,
          source_text: sourceText
        });
        setTimeout(() => setTtsState('idle'), 2500);
      } catch (fallbackErr: any) {
        setTtsState('error');
        setTtsError(err.message || 'Voice generation failed.');
      }
    }
  };

  const isReviewed = cue.humanReviewStatus === 'reviewed' || cue.review_status === 'APPROVED';
  const confPct = typeof cue.confidence === 'number' ? Math.round(cue.confidence * 100) : null;
  const isLowConf = confPct !== null && confPct < 65;
  const isSongMode = contentMode === 'song_lyrics' || cue.content_mode === 'song_lyrics' || cue.media_type === 'singing';
  const confidenceWarningLabel = isSongMode
    ? `Lyrics recognition needs review: ${confPct}%`
    : `Low ASR confidence: ${confPct}%`;

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header: Cue # and Timecodes */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              Cue #{cue.index}
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
              {cue.duration_sec.toFixed(2)}s
            </span>
            {isReviewed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3 text-[#249144]" /> Approved
              </span>
            )}
          </div>
        </div>

        {/* Start / End Timing Inputs */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <input
            type="text"
            value={startTimeInput}
            onChange={(e) => setStartTimeInput(e.target.value)}
            onBlur={handleTimingBlur}
            aria-label="Cue start time"
            className="w-16 bg-white border border-slate-200 rounded-md px-1.5 py-1 text-center text-slate-700 font-semibold focus:border-[#249144] outline-none"
          />
          <span className="text-slate-400">→</span>
          <input
            type="text"
            value={endTimeInput}
            onChange={(e) => setEndTimeInput(e.target.value)}
            onBlur={handleTimingBlur}
            aria-label="Cue end time"
            className="w-16 bg-white border border-slate-200 rounded-md px-1.5 py-1 text-center text-slate-700 font-semibold focus:border-[#249144] outline-none"
          />
        </div>
      </div>

      {timingError && (
        <div className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium border-b border-red-200">
          {timingError}
        </div>
      )}

      {/* Main Form Fields (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* 1. ORIGINAL TRANSCRIPT */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Original Transcript
          </label>
          <textarea
            rows={2}
            value={sourceText}
            onChange={handleSourceChange}
            placeholder="Original speech transcript..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#249144] focus:bg-white transition resize-none"
          />
          {/* Stale Translation Banner */}
          {cue.is_stale && (
            <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2 text-xs text-amber-800">
              <span className="flex items-center gap-1 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Source changed · Translation outdated
              </span>
              {onRegenerateTranslation && (
                <button
                  type="button"
                  onClick={() => onRegenerateTranslation(cue.id)}
                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. SANTALI — OL CHIKI */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Santali — Ol Chiki</span>
            <span className="text-[10px] font-normal text-slate-400">Target Subtitle</span>
          </label>
          <textarea
            rows={2}
            value={translatedText}
            onChange={handleTranslatedChange}
            placeholder="Santali Ol Chiki translation..."
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#249144] focus:ring-1 focus:ring-[#249144]/20 transition resize-none leading-relaxed"
          />
        </div>

        {/* 3. LATIN / PRONUNCIATION */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Latin / Pronunciation
          </label>
          <input
            type="text"
            value={romanizedText}
            onChange={handleRomanizedChange}
            placeholder="Phonetic Latin pronunciation..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-teal-900 outline-none focus:border-teal-500 focus:bg-white transition"
          />
        </div>

        {/* 4. 🔊 LISTEN BUTTON */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleListenClick}
            disabled={ttsState === 'generating'}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-98 ${
              ttsState === 'playing'
                ? 'bg-emerald-700 text-white animate-pulse'
                : ttsState === 'generating'
                ? 'bg-slate-200 text-slate-500 cursor-wait'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
            }`}
          >
            {ttsState === 'generating' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" />
                <span>Generating voice...</span>
              </>
            ) : ttsState === 'playing' ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-white" />
                <span>▶ Playing {ttsVoiceLabel}... (Click to Stop)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                <span>🔊 Listen ({ttsVoiceLabel})</span>
              </>
            )}
          </button>

          {ttsError && (
            <div className="mt-1.5 text-[11px] text-red-600 flex items-center justify-between">
              <span>⚠ {ttsError}</span>
              <button 
                type="button"
                onClick={handleListenClick}
                className="underline font-bold hover:text-red-800"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* 5. Minimal Status & Approval Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Small Status */}
          <div className="text-xs">
            {isLowConf ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                {confidenceWarningLabel}
              </span>
            ) : isReviewed ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#249144]" />
                Human Verified
              </span>
            ) : (
              <span className="text-slate-500 font-medium">
                Review recommended
              </span>
            )}
          </div>

          {/* Quick Approve Button */}
          {onMarkReviewed && !isReviewed && (
            <button
              type="button"
              onClick={() => onMarkReviewed(cue.id)}
              className="px-3.5 py-1.5 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>
          )}
        </div>

        {/* 6. Expandable "Details" Accordion (Provenance, CPS, Actions) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 py-1"
          >
            <span>Technical Details & Actions</span>
            {isDetailsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {isDetailsOpen && (
            <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Recognition:</span>
                <span className="font-mono text-slate-800 font-medium">
                  {cue.provenance?.recognition || 'Faster-Whisper'} ({confPct ?? 'N/A'}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Translation:</span>
                <span className="font-mono text-slate-800 font-medium">
                  {cue.provenance?.translation || cue.translation_source || 'Google Translate'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reading Speed:</span>
                <span className="font-mono text-slate-800 font-medium">
                  {cue.cps ? `${cue.cps.toFixed(1)} CPS` : `${(translatedText.length / Math.max(0.5, cue.duration_sec)).toFixed(1)} CPS`}
                </span>
              </div>

              {/* Split / Delete Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSplitCue(cue.id, currentPlaybackTime > cue.start_sec ? currentPlaybackTime : (cue.start_sec + cue.end_sec) / 2)}
                  className="flex-1 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Scissors className="w-3 h-3 text-slate-500" />
                  <span>Split Cue</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCue(cue.id)}
                  className="py-1 px-2.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 font-medium text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
