# Bhasha Setu — Subtitle Timeline & Media Coverage Architecture

## 1. Subtitle Coverage vs. Timeline Coverage

A critical flaw in naive subtitling systems is conflating **subtitle duration** with **media processing duration**:
- If a 35.8-second video has dialogue or singing only during the first 24 seconds followed by 11.8 seconds of instrumental outro, naive systems report *"Converted only 65% of the video"* or create awkward empty regions.
- In Bhasha Setu, **Timeline Coverage is ALWAYS 100%**. Every millisecond of the video is analyzed and accounted for.

### Metrics Definitions

| Metric | Formula | Example (`AUDIO SONG.mp4`) | Meaning |
|---|---|---|---|
| **Total Media Duration** | Total duration probed via FFprobe | `35.85s` | Complete length of the media file. |
| **Recognized Vocal Duration** | Sum of speech and singing segments | `24.00s` | Audio containing transcribable vocal content. |
| **Instrumental Duration** | Sum of musical / accompaniment regions | `11.85s` | Audio containing instruments without dialogue. |
| **Subtitle Coverage** | Sum of subtitle cue durations | `23.40s` (`65.3%`) | Percentage of media with active on-screen subtitles. |
| **Timeline Coverage** | $(\text{Vocal} + \text{Instrumental} + \text{Silence}) / \text{Total}$ | **`100.0%`** | Entire timeline audited; zero unaccounted time. |

---

## 2. Media Content Classification (`server/video/media_classifier.py`)

The timeline is segmented into semantic `MediaRegion` blocks:

```json
{
  "id": "region_0",
  "start": 0.0,
  "end": 24.0,
  "duration": 24.0,
  "type": "singing",
  "confidence": 0.34,
  "rms": 0.071,
  "speech_probability": 0.34,
  "music_probability": 0.66,
  "notes": "Vocals / lyrics detected"
},
{
  "id": "region_1",
  "start": 24.0,
  "end": 35.85,
  "duration": 11.85,
  "type": "instrumental",
  "confidence": 0.92,
  "rms": 0.106,
  "speech_probability": 0.00,
  "music_probability": 0.92,
  "notes": "Instrumental music detected"
}
```

### Classification Heuristics
1. **ASR Speech Tokens**: Faster-Whisper segment boundaries and token timestamps provide high-precision boundaries for dialogue and lyrics.
2. **Audio Energy (RMS)**: Validates presence of acoustic signal vs digital silence ($RMS < 0.005$).
3. **Non-Speech Energy**: High acoustic energy without ASR speech tokens indicates an instrumental section.
4. **No Fake Subtitle Cues**: The system never generates phantom subtitle cues across instrumental regions.

---

## 3. Visual Timeline Multi-Lane Architecture

The timeline UI (`SubtitleTimeline.tsx`) is rendered across four functional strata:

```
00:00     00:05     00:10     00:15     00:20     00:25     00:30     00:35.8
─────────────────────────────────────────────────────────────────────────────
[1. TIME RULER]
  |         |         |         |         |         |         |         |
─────────────────────────────────────────────────────────────────────────────
[2. MEDIA CLASSIFICATION LANE]
  ███████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  (Green: 🎤 Lyrics / Speech)                  (Purple: 🎵 Instrumental 11.8s)
─────────────────────────────────────────────────────────────────────────────
[3. SUBTITLE CUE LANE]
  [#1 0.0-4.6] [#2 4.6-7.8] [#3 7.8-10.2] ... [#9 20.1-23.4]  [ (No Cues) ]
─────────────────────────────────────────────────────────────────────────────
[4. REVIEW MARKERS & PLAYHEAD]
  ⚠ Low ASR    ⚠ Low ASR    ⚠ Low ASR                                ▲ Cursor
```

### Lane Functions:
- **Lane 1 (Time Ruler)**: Formatted timecode markers (`MM:SS.mmm`) with interactive seek cursor.
- **Lane 2 (Media Classification)**: Visual representation of 100% of media duration color-coded by acoustic type (`emerald` for speech/lyrics, `purple` for instrumental, `slate` for silence).
- **Lane 3 (Subtitle Cues)**: Proportional cue blocks displaying cue index, Ol Chiki text snippet, and duration.
- **Lane 4 (Review Badges)**: Cues with warnings or low confidence display amber warning icons.
- **Interactive Trimming**: Boundary drag handles allow sub-frame edge trimming with automatic snap-to-speech boundaries.
