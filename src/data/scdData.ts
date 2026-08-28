export interface SCDVideo {
  id: string;
  title: string;
  language: string;
  languageCode: string;
  region: string;
  youtubeId: string;
  duration: string;
  description: string;
  keyTopics: string[];
}

export const SCD_VIDEOS: SCDVideo[] = [
  {
    id: 'scd-hi-1',
    title: 'SCD Awareness Hindi 1: सिकिल सेल क्या है और जांच क्यों जरूरी है?',
    language: 'Hindi',
    languageCode: 'hin',
    region: 'PAN INDIA',
    youtubeId: 'csM95knOBmY',
    duration: '0:45',
    description: 'Introduction to Sickle Cell Disease, genetic inheritance, and the importance of pre-marital screening cards.',
    keyTopics: ['Diagnosis', 'Screening', 'Mission 2047']
  },
  {
    id: 'scd-hi-2',
    title: 'SCD Awareness Hindi 2: सिकिल सेल के लक्षण और शुरुआती पहचान',
    language: 'Hindi',
    languageCode: 'hin',
    region: 'PAN INDIA',
    youtubeId: 'pVMz6-HDeTE',
    duration: '0:46',
    description: 'Recognizing chronic fatigue, joint pain crises, jaundice, and frequent infections in children.',
    keyTopics: ['Symptoms', 'Joint Pain', 'Child Care']
  },
  {
    id: 'scd-hi-3',
    title: 'SCD Awareness Hindi 3: सिकिल सेल वाहक (Trait) बनाम रोगी (Disease)',
    language: 'Hindi',
    languageCode: 'hin',
    region: 'PAN INDIA',
    youtubeId: 'yRtF--ZyaEI',
    duration: '1:01',
    description: 'Understanding genetic counseling, color-coded health cards, and how to prevent transmission to newborns.',
    keyTopics: ['Genetics', 'Trait vs Disease', 'Counseling']
  },
  {
    id: 'scd-hi-4',
    title: 'SCD Awareness Hindi 4: हाइड्रोक्सीयूरिया दवा और आहार संबंधी सावधानियां',
    language: 'Hindi',
    languageCode: 'hin',
    region: 'PAN INDIA',
    youtubeId: 'Iwe_97zWbVk',
    duration: '1:01',
    description: 'Role of hydration, balanced nutrition, folic acid, and Hydroxyurea medication in managing sickle crisis.',
    keyTopics: ['Medication', 'Nutrition', 'Hydration']
  },
  {
    id: 'scd-hi-5',
    title: 'SCD Awareness Hindi 5: राष्ट्रीय सिकिल सेल उन्मूलन मिशन 2047',
    language: 'Hindi',
    languageCode: 'hin',
    region: 'PAN INDIA',
    youtubeId: 'fjs_F-3sOx0',
    duration: '1:30',
    description: 'National Sickle Cell Anaemia Elimination Mission inaugurated by Hon’ble PM for screening 7 crore tribal citizens.',
    keyTopics: ['Government Mission', 'Free Screening', 'Health Centers']
  },
  {
    id: 'scd-hi-6',
    title: 'SCD Awareness Hindi 6: दर्द संकट (Vaso-occlusive Crisis) में क्या करें?',
    language: 'Hindi',
    languageCode: 'hin',
    region: 'PAN INDIA',
    youtubeId: '-4Np7GDy_TM',
    duration: '4:22',
    description: 'Comprehensive emergency care guidelines for families and ASHA workers during acute pain episodes.',
    keyTopics: ['Emergency Care', 'ASHA Workers', 'Pain Relief']
  },
  {
    id: 'scd-hi-short',
    title: 'SCD Awareness Hindi Short: शादी से पहले सिकिल सेल कुंडली मिलान',
    language: 'Hindi',
    languageCode: 'hin',
    region: 'PAN INDIA',
    youtubeId: 'xvltgoHh5FQ',
    duration: '0:30',
    description: 'Quick awareness video on matching sickle cell screening status before marriage.',
    keyTopics: ['Pre-marital Counseling', 'Prevention']
  },
  {
    id: 'scd-bhi-1',
    title: 'SCD Awareness Bhili 1: भीली भाषा मां सिकिल सेल नी समझ',
    language: 'Bhili',
    languageCode: 'bhi',
    region: 'Madhya Pradesh & Gujarat',
    youtubeId: 'csM95knOBmY',
    duration: '0:45',
    description: 'Bhili audio narration detailing sickle cell inheritance and community testing camps.',
    keyTopics: ['Bhili Dialect', 'Testing Camps', 'Community Health']
  },
  {
    id: 'scd-bhi-2',
    title: 'SCD Awareness Bhili 2: रगत नी जांच अऊर वेदी नी सलाह',
    language: 'Bhili',
    languageCode: 'bhi',
    region: 'Rajasthan & MP',
    youtubeId: 'pVMz6-HDeTE',
    duration: '0:46',
    description: 'Importance of timely blood tests and following medical guidance in tribal habitations.',
    keyTopics: ['Blood Test', 'Clinic Visit']
  },
  {
    id: 'scd-gon-1',
    title: 'SCD Awareness Gondi 1: नेतुर ना जांच अऊर सिकिल सेल बीमारी',
    language: 'Gondi',
    languageCode: 'gon',
    region: 'Chhattisgarh & MP',
    youtubeId: 'yRtF--ZyaEI',
    duration: '1:05',
    description: 'Gondi audio explanation of blood testing, card distribution, and child health protection.',
    keyTopics: ['Gondi Audio', 'Blood Health', 'Tribal Welfare']
  },
  {
    id: 'scd-kui-1',
    title: 'SCD Awareness Kui 1: କୁଇ ଭାଷାରେ ସିକିଲ ସେଲ ସଚେତନତା',
    language: 'Kui',
    languageCode: 'kui',
    region: 'Odisha',
    youtubeId: 'Iwe_97zWbVk',
    duration: '1:10',
    description: 'Kui language guidance for Kondh communities on early diagnosis and screening card usage.',
    keyTopics: ['Odisha Tribal Health', 'Kui Audio']
  },
  {
    id: 'scd-tel-1',
    title: 'SCD Awareness Telugu 1: సికిల్ సెల్ వ్యాధి నివారణ మరియు సంరక్షణ',
    language: 'Telugu',
    languageCode: 'tel',
    region: 'Telangana & AP',
    youtubeId: 'fjs_F-3sOx0',
    duration: '1:20',
    description: 'Telugu guidance for Agency areas and ITDAs on sickle cell screening and treatment.',
    keyTopics: ['ITDA Agency Area', 'Screening Protocol']
  },
  {
    id: 'scd-odi-1',
    title: 'SCD Awareness Odia 1: ସିକିଲ ସେଲ ରୋଗ ନିୟନ୍ତ୍ରଣ ଓ ସତର୍କତା',
    language: 'Odia',
    languageCode: 'ori',
    region: 'Odisha',
    youtubeId: '-4Np7GDy_TM',
    duration: '2:15',
    description: 'Comprehensive Odia video guide on state health initiatives and district hospital care.',
    keyTopics: ['State Mission', 'Nutrition']
  }
];

export const SCD_DIALECT_FILTERS = [
  'All',
  'Hindi',
  'Bhili',
  'Baigani',
  'Odia',
  'Kui',
  'Kuvi Khond',
  'Adivasi Odia',
  'Halbi',
  'Telugu',
  'Gondi'
] as const;

export const SCD_INFOGRAPHICS = {
  whatIsScd: {
    title: 'What is Sickle Cell Disease (SCD)?',
    desc: 'SCD is an inherited genetic blood disorder that causes red blood cells to become rigid and crescent/sickle-shaped instead of round and flexible. These sickle cells block blood flow in tiny vessels, leading to severe pain, organ damage, and chronic anemia.',
    points: [
      'Normal RBCs are round, flexible, and live for ~120 days.',
      'Sickle RBCs are hard, sticky, crescent-shaped, and break down in 10-20 days.',
      'Prevalent across Central, Western, Eastern, and Southern Indian tribal belts.'
    ]
  },
  mission2047: {
    title: 'National Sickle Cell Anaemia Elimination Mission 2047',
    target: 'Screening 7.0 Crore citizens aged 0-40 across 17 high-prevalence states.',
    cards: [
      { color: 'bg-green-50 border-green-300 text-green-800', type: 'Normal (AA)', status: 'Free to marry anyone without genetic risk to children.' },
      { color: 'bg-yellow-50 border-yellow-300 text-yellow-800', type: 'Carrier / Trait (AS)', status: 'Advised not to marry another AS carrier to prevent giving birth to SS child.' },
      { color: 'bg-red-50 border-red-300 text-red-800', type: 'Diseased (SS)', status: 'Requires regular Hydroxyurea medication, hydration, and medical care.' }
    ]
  }
};
