# भाषा | SETU (Bhasha Setu)
### *Bridging Tribal Languages | A Translator for Migrant Teachers*

[![Vite](https://img.shields.io/badge/Vite-6.4.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Bhasha Setu** is an AI-powered multidirectional translation, speech synthesis, and offline-first language accessibility platform designed for migrant teachers, frontline workers (ASHA/Gram Sevaks), and indigenous communities.

---

## 🌟 Key Features

### 1. 🔄 Multi-Directional Translation Engine
- **Text-to-Text Translation**: Bidirectional translation supporting **Santali (Ol Chiki & Romanized)**, **Hindi**, and **English**, along with 10+ major regional Indian languages.
- **Phonetic & Script Mapping**: Ol Chiki to Latin/Roman phonetic transcription with confidence matching algorithms.

### 2. 🎙️ Voice & Speech Intelligence
- **Voice-to-Voice Dialogue**: Real-time spoken dialogue with automatic speech recognition (ASR) and neural text-to-speech (TTS).
- **Speech-to-Text (ASR)**: Speech transcription for classroom conversations and field queries.
- **Text-to-Speech (TTS)**: On-device speech synthesis with precise timing and audio feedback.

### 3. 📷 OCR Document & Script Extraction
- Extract text from physical textbooks, handwritten notes, and classroom boards in tribal scripts (Ol Chiki).
- Instant translation and audio pronunciation playback directly from image captures.

### 4. 🎬 Video Subtitling & Dubbing
- Generate synchronized bilingual subtitles (`.srt` / `.vtt`) for educational videos and cultural documentaries.

### 5. 📚 Multilingual Dictionary & Lexicon Explorer
- Searchable database of **6,780+ curated tribal words & phrases** with IPA phonetics, parts of speech, and classroom context examples.
- Community contribution portal for linguists and native speakers.

### 6. 📴 Offline Mode (Offline-First Ready)
- Full-featured offline operation using cached datasets and on-device Web Speech & Regex phonetic models.
- Interactive offline status HUD and toggle.

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
- **Amarnath Singh** ([@amarnathsingh72](https://github.com/amarnathsingh72))

- **Institution**: Sahyadri College of Engineering and Management, Mangaluru
