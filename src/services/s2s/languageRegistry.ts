/**
 * Bhasha Setu — S2S Modular Language Capability Registry
 * 
 * Provides a pluggable, modular capability registry for languages in S2S.
 * 
 * Current status:
 * - Santali (sat): ACTIVE (Ol Chiki, IndicConformer ONNX int8, Romanized phonetic TTS bridge)
 * - Hindi (hin): ACTIVE (Devanagari, Native WebSpeech / Faster-Whisper, Native TTS)
 * - English (eng): ACTIVE (Latin, Native WebSpeech / Faster-Whisper, Indian English TTS)
 * - Mundari (unr): GATED_PHASE_2 (Devanagari/Bani, strict ethical guardrail, Phase 2 notice)
 * - Ho (hoc): GATED_PHASE_3 (Warang Chiti/Devanagari, strict ethical guardrail, Phase 3 notice)
 * 
 * Future Mundari/Ho activation can be done simply by updating status and engine adapters
 * here without rewriting the S2S pipeline or changing the UI.
 */

export type LanguageStatus = 'ACTIVE' | 'GATED_PHASE_2' | 'GATED_PHASE_3';

export interface ASREngineConfig {
  engineType: 'indic_conformer_ws' | 'browser_webspeech' | 'faster_whisper' | 'custom_finetuned' | 'gated';
  sampleRate: number;
  channels: number;
  offlineCapable: boolean;
  endpoint?: string;
  expectedScript: string;
}

export interface TranslationEngineConfig {
  engineType: 'local_sqlite_hybrid' | 'indictrans2' | 'rule_lexicon' | 'gated';
  offlineCapable: boolean;
  hasBilingualCorpus: boolean;
}

export interface TTSEngineConfig {
  engineType: 'native_voice' | 'phonetic_roman_bridge' | 'custom_tribal_tts' | 'gated';
  preferVoicePattern?: string[];
  fallbackRate: number;
}

export interface PronunciationEngineConfig {
  hasRomanMapping: boolean;
  hasIPAMapping: boolean;
  scriptNormalizer?: (text: string) => string;
}

export interface LanguageCapabilityConfig {
  code: string;
  iso639_3: string;
  name: string;
  nativeName: string;
  script: string;
  unicodeRange?: [number, number]; // e.g. [0x1C50, 0x1C7F] for Ol Chiki
  status: LanguageStatus;
  guardrailMessage?: string;
  asr: ASREngineConfig;
  translation: TranslationEngineConfig;
  tts: TTSEngineConfig;
  pronunciation: PronunciationEngineConfig;
}

export class LanguageCapabilityRegistry {
  private static registry: Map<string, LanguageCapabilityConfig> = new Map();

  static {
    // 1. Santali (sat) — PRODUCTION ACTIVE
    LanguageCapabilityRegistry.register({
      code: 'sat',
      iso639_3: 'sat',
      name: 'Santali',
      nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
      script: 'Ol Chiki',
      unicodeRange: [0x1C50, 0x1C7F],
      status: 'ACTIVE',
      asr: {
        engineType: 'indic_conformer_ws',
        sampleRate: 16000,
        channels: 1,
        offlineCapable: true,
        endpoint: '/api/asr/stream',
        expectedScript: 'Ol Chiki'
      },
      translation: {
        engineType: 'local_sqlite_hybrid',
        offlineCapable: true,
        hasBilingualCorpus: true
      },
      tts: {
        engineType: 'phonetic_roman_bridge',
        preferVoicePattern: ['en-IN', 'hi-IN'],
        fallbackRate: 0.9
      },
      pronunciation: {
        hasRomanMapping: true,
        hasIPAMapping: true
      }
    });

    // 2. Hindi (hin) — PRODUCTION ACTIVE
    LanguageCapabilityRegistry.register({
      code: 'hin',
      iso639_3: 'hin',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      script: 'Devanagari',
      unicodeRange: [0x0900, 0x097F],
      status: 'ACTIVE',
      asr: {
        engineType: 'browser_webspeech',
        sampleRate: 16000,
        channels: 1,
        offlineCapable: true,
        expectedScript: 'Devanagari'
      },
      translation: {
        engineType: 'local_sqlite_hybrid',
        offlineCapable: true,
        hasBilingualCorpus: true
      },
      tts: {
        engineType: 'native_voice',
        preferVoicePattern: ['hi-IN', 'hi'],
        fallbackRate: 0.95
      },
      pronunciation: {
        hasRomanMapping: true,
        hasIPAMapping: false
      }
    });

    // 3. English (eng) — PRODUCTION ACTIVE
    LanguageCapabilityRegistry.register({
      code: 'eng',
      iso639_3: 'eng',
      name: 'English',
      nativeName: 'English',
      script: 'Latin',
      unicodeRange: [0x0020, 0x007F],
      status: 'ACTIVE',
      asr: {
        engineType: 'browser_webspeech',
        sampleRate: 16000,
        channels: 1,
        offlineCapable: true,
        expectedScript: 'Latin'
      },
      translation: {
        engineType: 'local_sqlite_hybrid',
        offlineCapable: true,
        hasBilingualCorpus: true
      },
      tts: {
        engineType: 'native_voice',
        preferVoicePattern: ['en-IN', 'en-GB', 'en-US'],
        fallbackRate: 0.95
      },
      pronunciation: {
        hasRomanMapping: false,
        hasIPAMapping: false
      }
    });

    // 4. Mundari (unr) — GATED PHASE 2
    LanguageCapabilityRegistry.register({
      code: 'unr',
      iso639_3: 'unr',
      name: 'Mundari',
      nativeName: 'मुंडारी',
      script: 'Devanagari / Mundari Bani',
      status: 'GATED_PHASE_2',
      guardrailMessage: 'Mundari ASR is currently under development. This language will be enabled after validated training and testing.',
      asr: {
        engineType: 'gated',
        sampleRate: 16000,
        channels: 1,
        offlineCapable: false,
        expectedScript: 'Devanagari'
      },
      translation: {
        engineType: 'local_sqlite_hybrid',
        offlineCapable: true,
        hasBilingualCorpus: true
      },
      tts: {
        engineType: 'phonetic_roman_bridge',
        preferVoicePattern: ['hi-IN', 'en-IN'],
        fallbackRate: 0.9
      },
      pronunciation: {
        hasRomanMapping: true,
        hasIPAMapping: false
      }
    });

    // 5. Ho (hoc) — GATED PHASE 3
    LanguageCapabilityRegistry.register({
      code: 'hoc',
      iso639_3: 'hoc',
      name: 'Ho',
      nativeName: 'हो / ᱣᱟᱨᱟᱝ ᱪᱤᱛᱤ',
      script: 'Warang Chiti / Devanagari',
      status: 'GATED_PHASE_3',
      guardrailMessage: 'Ho ASR is currently under development. This language will be enabled after validated training and testing.',
      asr: {
        engineType: 'gated',
        sampleRate: 16000,
        channels: 1,
        offlineCapable: false,
        expectedScript: 'Warang Chiti'
      },
      translation: {
        engineType: 'local_sqlite_hybrid',
        offlineCapable: true,
        hasBilingualCorpus: true
      },
      tts: {
        engineType: 'phonetic_roman_bridge',
        preferVoicePattern: ['hi-IN', 'en-IN'],
        fallbackRate: 0.9
      },
      pronunciation: {
        hasRomanMapping: true,
        hasIPAMapping: false
      }
    });
  }

  public static register(config: LanguageCapabilityConfig): void {
    this.registry.set(config.code.toLowerCase(), config);
    if (config.iso639_3) {
      this.registry.set(config.iso639_3.toLowerCase(), config);
    }
  }

  public static get(code: string): LanguageCapabilityConfig | undefined {
    return this.registry.get(code.toLowerCase());
  }

  public static isASRActive(code: string): boolean {
    const cfg = this.get(code);
    return !!cfg && cfg.status === 'ACTIVE' && cfg.asr.engineType !== 'gated';
  }

  public static getGuardrailNotice(code: string): string | null {
    const cfg = this.get(code);
    if (!cfg) return null;
    if (cfg.status !== 'ACTIVE') {
      return cfg.guardrailMessage || `${cfg.name} speech recognition is scheduled for upcoming phase development.`;
    }
    return null;
  }

  public static getAllActiveLanguages(): LanguageCapabilityConfig[] {
    const list: LanguageCapabilityConfig[] = [];
    const seen = new Set<string>();
    for (const [, cfg] of this.registry.entries()) {
      if (cfg.status === 'ACTIVE' && !seen.has(cfg.code)) {
        seen.add(cfg.code);
        list.push(cfg);
      }
    }
    return list;
  }
}
