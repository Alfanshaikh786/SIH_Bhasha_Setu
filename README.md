# भाषा | SETU (Bhasha Setu)
### *Bridging Tribal Languages | A Translator for Migrant Teachers*

[![Vite](https://img.shields.io/badge/Vite-6.4.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Bhasha Setu** is an offline-first multidirectional tribal language translation and linguistic accessibility platform designed for migrant teachers, frontline healthcare workers (ASHA/Gram Sevaks), and indigenous communities.

---

## 🌟 Key Features

### 1. 🔄 Multi-Directional Translation Engine
- **Verified Offline Corpus**: 6,780 parallel Santali records preserved 100% on-device (in-memory O(1) Map + SQLite WASM sandbox).
- **Text-to-Text Translation**: Bidirectional translation supporting **Santali (Ol Chiki, Roman, Devanagari)**, **Hindi**, and **English**.
- **Zero-Hallucination Guard**: Sentence translation for unsupported tribal languages (**Mundari**, **Ho**) is strictly blocked with vocabulary assistance, guaranteeing exactly 0 fabricated sentences.
- **Phonetic & Script Mapping**: Ol Chiki to Latin/Roman and Devanagari transliteration with dependent vowel (matra) composition and zero glyph leakage.

### 2. 🎙️ Voice & Speech Intelligence
- **Voice-to-Voice Dialogue**: Spoken dialogue with speech recognition (ASR) and phonetic speech synthesis guides.
- **Speech-to-Text (ASR)**: Speech transcription for classroom instruction and community dialogue.
- **Text-to-Speech (TTS)**: Phonetic pronunciation guidance via Web Speech API and Indian system voices with transparent non-native disclosure.

### 3. 📷 OCR Document & Script Extraction
- Extract text from physical textbooks, notes, and classroom boards.
- Instant translation and audio pronunciation playback directly from image captures.

### 4. 🎬 Video Subtitling & Dubbing
- Generate synchronized bilingual subtitles (`.srt` / `.vtt`) for educational videos and cultural documentaries.

### 5. 📚 Multilingual Dictionary & Lexicon Explorer
- Searchable database of **6,780 curated tribal words & phrases** with IPA phonetics, parts of speech, and classroom context examples.
- Community feedback and human-in-the-loop linguist evaluation review portal.

### 6. 📴 True Offline Mode (Zero-Network Architecture)
- Pre-compiled 4.03 MB SQLite WebAssembly database (`translations.db`) executing locally with 0 bytes transmitted.
- Service Worker Cache-First precaching with standalone PWA support on low-end mobile screens (360×800).

### 7. 📱 Progressive Web App (PWA)
- Installable on Android, iOS, and Desktop with offline caching, service workers, and responsive mobile layout.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Lucide Icons, Custom Typography (Noto Sans Devanagari, Noto Sans Ol Chiki, Domine, Outfit, Inter)
- **Audio & Speech**: Web Speech API (`SpeechRecognition`, `SpeechSynthesis`), Custom TTS synthesis engine
- **State Management & Routing**: React Router v6, Context API, LocalStorage persistence

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Alfanshaikh786/SIH_Bhasha_Setu.git
   cd SIH_Bhasha_Setu
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   node node_modules/vite/bin/vite.js
   # or
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```
SIH/
├── public/                # Static assets, PWA icons, manifest
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Logo, PWA prompt, modals
│   │   ├── home/          # Home page sections & hero
│   │   └── layout/        # Navbar, Footer
│   ├── data/              # Curated tribal datasets & dictionaries
│   ├── pages/             # Route pages (Features, Resources, Gallery)
│   ├── services/          # Translation & auth service logic
│   ├── App.tsx            # Main application router
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global Tailwind styles & fonts
├── Santhali-Words.csv     # Master tribal language lexicon (6,780+ entries)
├── package.json
└── vite.config.ts
```

---

## 👥 Contributors
Developed for the **Smart India Hackathon (SIH)**.

- **Alfan Shaikh** ([@Alfanshaikh786](https://github.com/Alfanshaikh786))

- **Institution**: Sahyadri College of Engineering and Management, Mangaluru
