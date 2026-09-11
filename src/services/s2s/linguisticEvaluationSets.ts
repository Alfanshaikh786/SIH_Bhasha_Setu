/**
 * Bhasha Setu — Linguistic Evaluation Sets (Phase 3)
 * 
 * Provides authenticated multi-domain evaluation cases:
 * - Healthcare High-Risk Set (Clinical Never-Guess enforcement)
 * - Education Set (Classroom instructions, reading, literacy)
 * - Agriculture Set (Crops, soil, weather, irrigation)
 * - Numbers, Proper Nouns & Dosage (Verbatim preservation)
 * - Code-Switching (Santali+Hindi, Santali+English, Hindi+English)
 * - Real-World Multi-Turn Dialogue Scenarios (End-to-end semantic continuity)
 */

export interface LinguisticTestCase {
  id: string;
  domain: 'HEALTHCARE' | 'EDUCATION' | 'AGRICULTURE' | 'ADMINISTRATION' | 'NUMBERS_PROPER_NOUNS' | 'CODE_SWITCHING' | 'DIALOGUE';
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  expectedTargetText: string;
  acceptableSynonyms?: string[];
  riskLevel: 'STANDARD' | 'ELEVATED' | 'CRITICAL';
  verificationStatus: 'VERIFIED_GOLDEN' | 'FIELD_COLLECTED' | 'SYNTHETIC_BENCHMARK';
  notes?: string;
}

export interface DialogueTurnTestCase {
  turnNumber: number;
  speaker: 'SpeakerA' | 'SpeakerB';
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  expectedTranslation: string;
  requiredSemanticConcepts: string[];
}

export interface DialogueScenarioTestCase {
  id: string;
  title: string;
  domain: string;
  turns: DialogueTurnTestCase[];
}

// 1. HEALTHCARE HIGH-RISK EVALUATION SET
export const HEALTHCARE_EVALUATION_SET: LinguisticTestCase[] = [
  {
    id: 'health_001_fever',
    domain: 'HEALTHCARE',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱤᱧᱟᱜ ᱨᱩᱣᱟᱹ ᱦᱮᱡ ᱟᱠᱟᱱᱟ',
    expectedTargetText: 'मुझे बुखार है',
    acceptableSynonyms: ['मुझे तेज बुखार है', 'मुझे बुखार आया है'],
    riskLevel: 'CRITICAL',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Core febrile symptom report in tribal primary healthcare'
  },
  {
    id: 'health_002_pain',
    domain: 'HEALTHCARE',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱤᱧᱟᱜ ᱦᱚᱲᱢᱚ ᱦᱟᱹᱥᱩᱭᱤᱧ ᱠᱟᱱᱟ',
    expectedTargetText: 'मेरे शरीर में दर्द हो रहा है',
    acceptableSynonyms: ['मेरे बदन में दर्द है', 'मुझे बदन दर्द है'],
    riskLevel: 'CRITICAL',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Generalized somatic pain report'
  },
  {
    id: 'health_003_sickle_cell',
    domain: 'HEALTHCARE',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱨᱩᱣᱟᱹ ᱨᱮᱭᱟᱜ ᱡᱟᱹᱧᱪ',
    expectedTargetText: 'सिकल सेल रोग की जांच',
    acceptableSynonyms: ['सिकल सेल की जांच', 'सिकल सेल एनीमिया टेस्ट'],
    riskLevel: 'CRITICAL',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'National Sickle Cell Elimination Mission key clinical phrase'
  },
  {
    id: 'health_004_dosage',
    domain: 'HEALTHCARE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'यह दवा दिन में दो बार लें',
    expectedTargetText: 'ᱱᱚᱣᱟ ᱨᱟᱱ ᱫᱤᱱᱟᱹᱢ ᱵᱟᱨ ᱫᱷᱟᱣ ᱡᱚᱢ ᱢᱮ',
    acceptableSynonyms: ['ᱱᱚᱣᱟ ᱨᱟᱱ ᱫᱤᱱ ᱨᱮ ᱵᱟᱨ ᱫᱷᱟᱣ ᱡᱚᱢ ᱢᱮ'],
    riskLevel: 'CRITICAL',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Prescription dosage frequency instruction'
  },
  {
    id: 'health_005_vaccine',
    domain: 'HEALTHCARE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'बच्चे को टीका लगवाना जरूरी है',
    expectedTargetText: 'ᱜᱤᱫᱽᱨᱟᱹ ᱴᱤᱠᱟᱹ ᱮᱢᱟᱭ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ',
    acceptableSynonyms: ['ᱜᱤᱫᱽᱨᱟᱹ ᱴᱤᱠᱟᱹ ᱞᱟᱜᱟᱣ ᱞᱟᱹᱠᱛᱤ'],
    riskLevel: 'CRITICAL',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Universal Immunization Programme counseling phrase'
  }
];

// 2. EDUCATION EVALUATION SET
export const EDUCATION_EVALUATION_SET: LinguisticTestCase[] = [
  {
    id: 'edu_001_book',
    domain: 'EDUCATION',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'किताब खोलो',
    expectedTargetText: 'ᱯᱚᱛᱚᱵ ᱡᱷᱤᱡᱽ ᱢᱮ',
    acceptableSynonyms: ['ᱯᱚᱛᱚᱵ ᱠᱷᱩᱞᱟᱹᱣ ᱢᱮ'],
    riskLevel: 'STANDARD',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Standard primary classroom instruction'
  },
  {
    id: 'edu_002_read_write',
    domain: 'EDUCATION',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱚᱞ ᱟᱨ ᱯᱟᱲᱦᱟᱣ ᱢᱮ',
    expectedTargetText: 'लिखो और पढ़ो',
    acceptableSynonyms: ['पढ़ो और लिखो'],
    riskLevel: 'STANDARD',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Foundational literacy instruction'
  },
  {
    id: 'edu_003_meaning',
    domain: 'EDUCATION',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱱᱚᱣᱟ ᱨᱮᱭᱟᱜ ᱢᱮᱱᱮᱛ ᱫᱚ ᱪᱮᱫ?',
    expectedTargetText: 'इसका क्या मतलब है?',
    acceptableSynonyms: ['इसका अर्थ क्या है?'],
    riskLevel: 'STANDARD',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Student query in bilingual tribal classroom'
  }
];

// 3. AGRICULTURE EVALUATION SET
export const AGRICULTURE_EVALUATION_SET: LinguisticTestCase[] = [
  {
    id: 'agri_001_crops',
    domain: 'AGRICULTURE',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱪᱟᱥ ᱟᱨ ᱤᱛᱟᱹ',
    expectedTargetText: 'खेती और बीज',
    acceptableSynonyms: ['फसल और बीज'],
    riskLevel: 'STANDARD',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Agricultural inputs and sowing vocabulary'
  },
  {
    id: 'agri_002_rain',
    domain: 'AGRICULTURE',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱫᱟᱜ ᱡᱟᱹᱲᱤ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ',
    expectedTargetText: 'बारिश हो रही है',
    acceptableSynonyms: ['वर्षा हो रही है'],
    riskLevel: 'STANDARD',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Monsoon weather condition'
  },
  {
    id: 'agri_003_soil',
    domain: 'AGRICULTURE',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'मिट्टी की जांच',
    expectedTargetText: 'ᱦᱟᱥᱟ ᱨᱮᱭᱟᱜ ᱡᱟᱹᱧᱪ',
    acceptableSynonyms: ['ᱦᱟᱥᱟ ᱡᱟᱹᱧᱪ'],
    riskLevel: 'STANDARD',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Soil Health Card terminology'
  }
];

// 4. NUMBERS, PROPER NOUNS & DOSAGE PRESERVATION
export const PROPER_NOUNS_EVALUATION_SET: LinguisticTestCase[] = [
  {
    id: 'noun_001_place_person',
    domain: 'NUMBERS_PROPER_NOUNS',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'पार्वती मुर्मू दुमका से आई हैं',
    expectedTargetText: 'Parvati Murmu Dumka ᱠᱷᱚᱱ ᱦᱮᱡ ᱟᱠᱟᱱᱟᱭ',
    acceptableSynonyms: ['ᱯᱟᱨᱵᱚᱛᱤ ᱢᱩᱨᱢᱩ ᱫᱩᱢᱠᱟ ᱠᱷᱚᱱ ᱦᱮᱡ ᱟᱠᱟᱱᱟᱭ'],
    riskLevel: 'ELEVATED',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Proper names and district locations must never be translated into common nouns'
  },
  {
    id: 'noun_002_dosage_number',
    domain: 'NUMBERS_PROPER_NOUNS',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: '500mg पैरासिटामोल 2 बार लें',
    expectedTargetText: '500mg Paracetamol 2 ᱫᱷᱟᱣ ᱡᱚᱢ ᱢᱮ',
    acceptableSynonyms: ['500mg पैरासिटामोल 2 ᱫᱷᱟᱣ ᱡᱚᱢ ᱢᱮ'],
    riskLevel: 'CRITICAL',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Dosage numbers and clinical substance names must be strictly preserved'
  }
];

// 5. CODE-SWITCHING SAFETY EVALUATION SET
export const CODE_SWITCHING_EVALUATION_SET: LinguisticTestCase[] = [
  {
    id: 'code_001_sat_eng',
    domain: 'CODE_SWITCHING',
    sourceLang: 'sat',
    targetLang: 'hin',
    sourceText: 'ᱟᱞᱮ ᱟᱹᱛᱩ ᱨᱮ hospital ᱵᱟᱹᱱᱩᱜ-ᱟ',
    expectedTargetText: 'हमारे गांव में अस्पताल नहीं है',
    acceptableSynonyms: ['हमारे गांव में hospital नहीं है'],
    riskLevel: 'ELEVATED',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Santali sentence incorporating English loanword hospital'
  },
  {
    id: 'code_002_hin_eng',
    domain: 'CODE_SWITCHING',
    sourceLang: 'hin',
    targetLang: 'sat',
    sourceText: 'डॉक्टर साहब attendance check करेंगे',
    expectedTargetText: 'ᱰᱟᱠᱛᱚᱨ ᱥᱟᱦᱮᱵ attendance check ᱮᱭᱟᱭ',
    acceptableSynonyms: ['Doctor साहब attendance check ᱠᱟᱹᱢᱤᱭᱟᱭ'],
    riskLevel: 'ELEVATED',
    verificationStatus: 'VERIFIED_GOLDEN',
    notes: 'Hindi sentence with English professional terms'
  }
];

// 6. REAL-WORLD MULTI-TURN DIALOGUE SCENARIOS
export const DIALOGUE_SCENARIOS: DialogueScenarioTestCase[] = [
  {
    id: 'diag_001_phc_consultation',
    title: 'Primary Health Centre (PHC) Consultation',
    domain: 'HEALTHCARE',
    turns: [
      {
        turnNumber: 1,
        speaker: 'SpeakerA',
        sourceLang: 'sat',
        targetLang: 'hin',
        sourceText: 'ᱡᱚᱦᱟᱨ ᱰᱟᱠᱛᱚᱨ ᱵᱟᱹᱵᱩ, ᱤᱧᱟᱜ ᱨᱩᱣᱟᱹ ᱦᱮᱡ ᱟᱠᱟᱱᱟ',
        expectedTranslation: 'नमस्ते डॉक्टर साहब, मुझे बुखार आया है',
        requiredSemanticConcepts: ['नमस्ते', 'बुखार']
      },
      {
        turnNumber: 2,
        speaker: 'SpeakerB',
        sourceLang: 'hin',
        targetLang: 'sat',
        sourceText: 'नमस्ते, आपको बुखार कब से है?',
        expectedTranslation: 'ᱡᱚᱦᱟᱨ, ᱟᱢᱟᱜ ᱨᱩᱣᱟᱹ ᱛᱤᱥ ᱠᱷᱚᱱ ᱦᱩᱭ ᱟᱠᱟᱱᱟ?',
        requiredSemanticConcepts: ['ᱡᱚᱦᱟᱨ', 'ᱨᱩᱣᱟᱹ']
      },
      {
        turnNumber: 3,
        speaker: 'SpeakerA',
        sourceLang: 'sat',
        targetLang: 'hin',
        sourceText: 'ᱵᱟᱨ ᱫᱤᱱ ᱠᱷᱚᱱ ᱟᱨ ᱦᱚᱲᱢᱚ ᱦᱟᱹᱥᱩᱭᱤᱧ ᱠᱟᱱᱟ',
        expectedTranslation: 'दो दिनों से और बदन में दर्द है',
        requiredSemanticConcepts: ['दो', 'दर्द']
      },
      {
        turnNumber: 4,
        speaker: 'SpeakerB',
        sourceLang: 'hin',
        targetLang: 'sat',
        sourceText: 'यह दवा दिन में दो बार गर्म पानी के साथ लें',
        expectedTranslation: 'ᱱᱚᱣᱟ ᱨᱟᱱ ᱫᱤᱱ ᱨᱮ ᱵᱟᱨ ᱫᱷᱟᱣ ᱞᱚᱞᱚ ᱫᱟᱜ ᱥᱟᱶ ᱡᱚᱢ ᱢᱮ',
        requiredSemanticConcepts: ['ᱨᱟᱱ', 'ᱵᱟᱨ ᱫᱷᱟᱣ', 'ᱫᱟᱜ']
      },
      {
        turnNumber: 5,
        speaker: 'SpeakerA',
        sourceLang: 'sat',
        targetLang: 'hin',
        sourceText: 'ᱥᱟᱨᱦᱟᱣ ᱰᱟᱠᱛᱚᱨ ᱵᱟᱹᱵᱩ',
        expectedTranslation: 'धन्यवाद डॉक्टर साहब',
        requiredSemanticConcepts: ['धन्यवाद']
      }
    ]
  },
  {
    id: 'diag_002_school_classroom',
    title: 'Tribal Primary School Classroom Interaction',
    domain: 'EDUCATION',
    turns: [
      {
        turnNumber: 1,
        speaker: 'SpeakerA',
        sourceLang: 'hin',
        targetLang: 'sat',
        sourceText: 'सभी बच्चे अपनी किताब खोलो',
        expectedTranslation: 'ᱡᱚᱛᱚ ᱜᱤᱫᱽᱨᱟᱹ ᱟᱯᱱᱟᱨᱟᱜ ᱯᱚᱛᱚᱵ ᱡᱷᱤᱡᱽ ᱯᱮ',
        requiredSemanticConcepts: ['ᱜᱤᱫᱽᱨᱟᱹ', 'ᱯᱚᱛᱚᱵ', 'ᱡᱷᱤᱡᱽ']
      },
      {
        turnNumber: 2,
        speaker: 'SpeakerB',
        sourceLang: 'sat',
        targetLang: 'hin',
        sourceText: 'ᱥᱟᱨ, ᱤᱧᱟᱜ ᱯᱚᱛᱚᱵ ᱚᱲᱟᱜ ᱨᱮ ᱢᱮᱱᱟᱜ-ᱟ',
        expectedTranslation: 'सर, मेरी किताब घर पर है',
        requiredSemanticConcepts: ['किताब', 'घर']
      },
      {
        turnNumber: 3,
        speaker: 'SpeakerA',
        sourceLang: 'hin',
        targetLang: 'sat',
        sourceText: 'कोई बात नहीं, पास वाले साथी के साथ पढ़ो',
        expectedTranslation: 'ᱪᱮᱫ ᱵᱟᱝ, ᱥᱩᱨ ᱜᱟᱛᱮ ᱥᱟᱶ ᱯᱟᱲᱦᱟᱣ ᱢᱮ',
        requiredSemanticConcepts: ['ᱥᱩᱨ', 'ᱯᱟᱲᱦᱟᱣ']
      }
    ]
  }
];
