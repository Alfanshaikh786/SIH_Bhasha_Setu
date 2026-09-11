/**
 * Bhasha Setu — S2S Golden Test Set & Regression Suite
 * 
 * Deterministic test items spanning 6 vital domains:
 * - Education
 * - Healthcare & Clinical
 * - Agriculture & Rural Livelihood
 * - Administration & Civic Schemes
 * - Daily Conversation
 * - Greetings & Cultural Etiquette
 */

import { DomainCategory, RiskLevel } from './s2sTypes';

export interface GoldenTestCase {
  id: string;
  domain: DomainCategory;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  expectedTargetText: string;
  expectedRomanized?: string;
  riskLevel: RiskLevel;
  criticalTerms?: string[];
}

export const S2S_GOLDEN_TEST_SET: GoldenTestCase[] = [
  // 1. Education
  {
    id: 'gold-edu-1',
    domain: 'EDUCATION',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'अपनी किताब खोलो।',
    expectedTargetText: 'ᱟᱢᱟᱜ ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱢᱮ ᱾',
    expectedRomanized: 'Amag puthi jhij me.',
    riskLevel: 'moderate'
  },
  {
    id: 'gold-edu-2',
    domain: 'EDUCATION',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'ध्यान से सुनो।',
    expectedTargetText: 'ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱧᱡᱚᱢ ᱢᱮ ᱾',
    expectedRomanized: 'Dheyan te aamjom me.',
    riskLevel: 'low'
  },
  {
    id: 'gold-edu-3',
    domain: 'EDUCATION',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱤᱧ ᱫᱚ ᱚᱞ ᱪᱤᱠᱤ ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱧ ᱾',
    expectedTargetText: 'मैं ओल चिकी पढ़ रहा हूँ।',
    expectedRomanized: 'Inj do Ol Chiki parhao kananj.',
    riskLevel: 'low'
  },

  // 2. Healthcare & Clinical
  {
    id: 'gold-health-1',
    domain: 'CRITICAL_HEALTHCARE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'सिकल सेल जांच पूरी हो गई।',
    expectedTargetText: 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱩᱭ ᱮᱱᱟ ᱾',
    expectedRomanized: 'Sikil sel bidaw hoyena.',
    riskLevel: 'critical',
    criticalTerms: ['sickle cell', 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ']
  },
  {
    id: 'gold-health-2',
    domain: 'HEALTHCARE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'कहाँ दर्द हो रहा है?',
    expectedTargetText: 'ᱚᱠᱟᱨᱮ ᱦᱟᱹᱥᱩ ᱮᱫ ᱢᱮᱭᱟ?',
    expectedRomanized: 'Okare hasu ed meya?',
    riskLevel: 'high',
    criticalTerms: ['hasu', 'दर्द']
  },
  {
    id: 'gold-health-3',
    domain: 'HEALTHCARE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'क्या आपको बुखार है?',
    expectedTargetText: 'ᱟᱢ ᱫᱚ ᱨᱩᱣᱟᱹ ᱦᱮᱡ ᱟᱠᱟᱱ ᱢᱮᱭᱟ?',
    expectedRomanized: 'Am do ruwa hej akan meya?',
    riskLevel: 'high',
    criticalTerms: ['ruwa', 'बुखार']
  },
  {
    id: 'gold-health-4',
    domain: 'HEALTHCARE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'दवा लेने का समय हो गया है।',
    expectedTargetText: 'ᱨᱟᱱ ᱡᱚᱢ ᱨᱮᱭᱟᱜ ᱚᱠᱛᱚ ᱦᱩᱭ ᱮᱱᱟ ᱾',
    expectedRomanized: 'Ran jom reyag okto hoyena.',
    riskLevel: 'high',
    criticalTerms: ['ran', 'दवा']
  },

  // 3. Agriculture
  {
    id: 'gold-agri-1',
    domain: 'AGRICULTURE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'यह गाय है।',
    expectedTargetText: 'ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾',
    expectedRomanized: 'Nui do gai kanay.',
    riskLevel: 'low'
  },
  {
    id: 'gold-agri-2',
    domain: 'AGRICULTURE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'बीज बोने का काम हो गया।',
    expectedTargetText: 'ᱤᱛᱟᱹ ᱮᱨ ᱦᱩᱭ ᱮᱱᱟ ᱾',
    expectedRomanized: 'Ita er hoeyena.',
    riskLevel: 'low'
  },

  // 4. Daily Life & Greetings
  {
    id: 'gold-daily-1',
    domain: 'GENERAL',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'नमस्ते / जोहार',
    expectedTargetText: 'ᱡᱚᱦᱟᱨ',
    expectedRomanized: 'Johar',
    riskLevel: 'low'
  },
  {
    id: 'gold-daily-2',
    domain: 'GENERAL',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'आपका नाम क्या है?',
    expectedTargetText: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?',
    expectedRomanized: 'Amag nyutum ched?',
    riskLevel: 'low'
  },
  {
    id: 'gold-daily-3',
    domain: 'GENERAL',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'कृपया मुझे पीने का पानी दीजिए।',
    expectedTargetText: 'ᱫᱟᱭᱟ ᱠᱟᱛᱮ ᱤᱧ ᱧᱩ ᱫᱟᱜ ᱮᱢᱟᱹᱧ ᱢᱮ ᱾',
    expectedRomanized: 'Daya kate inj nyu daag emanj me.',
    riskLevel: 'low'
  }
];
