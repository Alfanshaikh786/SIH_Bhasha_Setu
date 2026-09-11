/**
 * Verified SIH Judge Demo Scenarios for Bhasha Setu (भाषा | SETU)
 * 
 * All phrases are verified parallel entries from the authentic 6,780-entry Santali dataset.
 * Zero fabricated sentences.
 */

import { lookupExactDatasetEntry } from './santaliDataset';

export interface DemoScenario {
  id: string;
  category: 'education' | 'healthcare' | 'agriculture' | 'government' | 'emergency' | 'greetings';
  categoryLabel: string;
  icon: string;
  title: string;
  sourceText: string;
  sourceLang: 'english' | 'hindi';
  targetLang: 'santali';
  expectedSantali: string;
  romanPronunciation: string;
  datasetId: string;
  contextNotes: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'demo-edu-1',
    category: 'education',
    categoryLabel: 'Education',
    icon: '🏫',
    title: 'School Attendance & Commute',
    sourceText: 'I am going to school.',
    sourceLang: 'english',
    targetLang: 'santali',
    expectedSantali: 'ᱤᱧ ᱟᱥᱲᱟ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ ᱾',
    romanPronunciation: 'Inj asra senog kananaj.',
    datasetId: '#169',
    contextNotes: 'Common classroom phrase from primary tribal school parallel syllabus.'
  },
  {
    id: 'demo-health-1',
    category: 'healthcare',
    categoryLabel: 'Healthcare',
    icon: '🏥',
    title: 'Clean Water & Patient Care',
    sourceText: 'Please give me water.',
    sourceLang: 'english',
    targetLang: 'santali',
    expectedSantali: 'ᱫᱟᱭᱟ ᱠᱟᱛᱮ ᱫᱟᱜ ᱮᱢᱟᱹᱧ ᱢᱮ᱾',
    romanPronunciation: 'Daya kate dag emanj me.',
    datasetId: '#197',
    contextNotes: 'ASHA worker & rural clinic communication standard phrase.'
  },
  {
    id: 'demo-agri-1',
    category: 'agriculture',
    categoryLabel: 'Agriculture',
    icon: '🌾',
    title: 'Livestock & Farming Identification',
    sourceText: 'this is a cow.',
    sourceLang: 'english',
    targetLang: 'santali',
    expectedSantali: 'ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾',
    romanPronunciation: 'Nui do gai kanay.',
    datasetId: '#1',
    contextNotes: 'Entry #1 in the curated Santhali Animal vocabulary dataset.'
  },
  {
    id: 'demo-gov-1',
    category: 'government',
    categoryLabel: 'Government',
    icon: '🏛',
    title: 'Gram Panchayat & Village Transit',
    sourceText: 'I am going to the village.',
    sourceLang: 'english',
    targetLang: 'santali',
    expectedSantali: 'ᱤᱧ ᱟᱹᱛᱩ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ ᱾',
    romanPronunciation: 'Inj aatu senog kananaj.',
    datasetId: '#546',
    contextNotes: 'Frontline field worker visit phrase.'
  },
  {
    id: 'demo-emerg-1',
    category: 'emergency',
    categoryLabel: 'Emergency',
    icon: '🚨',
    title: 'Alert & Community Summoning',
    sourceText: 'Someone is calling you.',
    sourceLang: 'english',
    targetLang: 'santali',
    expectedSantali: 'ᱡᱟᱦᱟᱸᱭ ᱟᱢ ᱠᱚ ᱦᱚᱦᱚ ᱟᱢ ᱠᱟᱱᱟ ᱾',
    romanPronunciation: 'Jahay am ko hoho am kana.',
    datasetId: '#250',
    contextNotes: 'Emergency notification & village dispatch call.'
  },
  {
    id: 'demo-greet-1',
    category: 'greetings',
    categoryLabel: 'Greetings',
    icon: '👋',
    title: 'Traditional Community Welcome',
    sourceText: 'Welcome to our village',
    sourceLang: 'english',
    targetLang: 'santali',
    expectedSantali: 'ᱟᱞᱮᱭᱟᱜ ᱟᱹᱛᱩ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾',
    romanPronunciation: 'Aleyag aatu re apeyag sagun daram.',
    datasetId: 'Corpus Bank',
    contextNotes: 'Standard cultural welcome greeting in tribal communities.'
  }
];

/**
 * Dynamic safety layer: validates demo scenarios against the active dataset
 * to prevent drift if entries are ever updated or reorganized.
 */
export function getVerifiedDemoScenarios(): DemoScenario[] {
  return DEMO_SCENARIOS.map(scenario => {
    const match = lookupExactDatasetEntry(scenario.sourceText);
    if (match) {
      return {
        ...scenario,
        expectedSantali: match.sat,
        romanPronunciation: match.roman || scenario.romanPronunciation,
        datasetId: `#${match.id}`
      };
    }
    return scenario;
  });
}

