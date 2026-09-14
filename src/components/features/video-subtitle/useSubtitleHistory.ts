/**
 * Subtitle History Hook: Bounded Undo / Redo Stack with Debouncing
 * Bhasha Setu AI Subtitle Studio
 */

import { useState, useRef, useCallback } from 'react';
import { StudioCue, EditorHistoryState } from './types';

const MAX_HISTORY_LENGTH = 30;

export function useSubtitleHistory(initialCues: StudioCue[], initialSelectedId: string | null = null) {
  const [history, setHistory] = useState<EditorHistoryState[]>([
    { cues: initialCues, selectedCueId: initialSelectedId }
  ]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const currentState = history[currentIndex] || { cues: initialCues, selectedCueId: initialSelectedId };

  /**
   * Pushes a new state immediately (for atomic actions: add, delete, split, merge, timing change)
   */
  const pushState = useCallback((newCues: StudioCue[], selectedCueId: string | null) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setHistory((prev) => {
      // Discard any future redo states
      const sliced = prev.slice(0, currentIndex + 1);
      const next = [...sliced, { cues: newCues, selectedCueId }];
      // Keep within max boundary
      if (next.length > MAX_HISTORY_LENGTH) {
        return next.slice(next.length - MAX_HISTORY_LENGTH);
      }
      return next;
    });

    setCurrentIndex((prev) => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
  }, [currentIndex]);

  /**
   * Debounced push for frequent typing in text fields (waits 600ms before taking a snapshot)
   */
  const pushDebouncedState = useCallback((newCues: StudioCue[], selectedCueId: string | null) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      pushState(newCues, selectedCueId);
      debounceTimerRef.current = null;
    }, 600);
  }, [pushState]);

  /**
   * Reverts to previous history state
   */
  const undo = useCallback(() => {
    if (!canUndo) return null;
    const newIdx = currentIndex - 1;
    setCurrentIndex(newIdx);
    return history[newIdx];
  }, [canUndo, currentIndex, history]);

  /**
   * Re-applies next history state
   */
  const redo = useCallback(() => {
    if (!canRedo) return null;
    const newIdx = currentIndex + 1;
    setCurrentIndex(newIdx);
    return history[newIdx];
  }, [canRedo, currentIndex, history]);

  /**
   * Resets the entire history stack (e.g., when a new video job is loaded or reverted to original)
   */
  const resetHistory = useCallback((cues: StudioCue[], selectedCueId: string | null = null) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setHistory([{ cues, selectedCueId }]);
    setCurrentIndex(0);
  }, []);

  return {
    currentState,
    pushState,
    pushDebouncedState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    historyLength: history.length,
    currentIndex
  };
}
