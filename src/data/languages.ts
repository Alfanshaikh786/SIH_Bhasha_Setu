export interface TribalLanguage {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  badge: string;
  family: 'Austroasiatic' | 'Dravidian' | 'Tibeto-Burman' | 'Indo-Aryan';
  speakers: string;
  states: string[];
  script: string;
  description: string;
  history: string;
  importance: string;
  isTribal: boolean;
  virtualKeys?: string[];
  samplePhrases?: {
    text: string;
    translation: string;
    category: string;
  }[];
}

export const SUPPORTED_LANGUAGES: TribalLanguage[] = [
  {
    id: 'santali',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    code: 'sat',
    badge: 'ᱥᱟ',
    family: 'Austroasiatic',
    speakers: '7.6 Million',
    states: ['Jharkhand', 'Odisha', 'West Bengal', 'Bihar', 'Assam'],
    script: 'Ol Chiki',
    description: "Scheduled VIII language written in the unique Ol Chiki script created by Pandit Raghunath Murmu.",
    history: "Santali belongs to the Munda sub-family of Austroasiatic languages, spoken by the Santhal tribe across eastern India. In 1925, Pandit Raghunath Murmu created the Ol Chiki script for Santali.",
    importance: "As one of India's 22 Scheduled languages, Santali holds deep cultural, historical, educational, and constitutional significance.",
    isTribal: true,
    virtualKeys: ['ᱚ', 'ᱛ', 'ᱜ', 'ᱝ', 'ᱞ', 'ᱟ', 'ᱠ', 'ᱡ', 'ᱢ', 'ᱣ', 'ᱤ', 'ᱥ', 'ᱦ', 'ᱧ', 'ᱨ', 'ᱩ', 'ᱪ', 'ᱫ', 'ᱬ', 'ᱭ', 'ᱮ', 'ᱯ', 'ᱰ', 'ᱱ', 'ᱲ', 'ᱳ', 'ᱴ', 'ᱵ', 'ᱶ', 'ᱷ', 'ᱸ', 'ᱹ', 'ᱺ', 'ᱻ', 'ᱼ', 'ᱽ'],
    samplePhrases: [
      { text: 'ᱡᱚᱦᱟᱨ', translation: 'Greetings / Welcome (Johar)', category: 'Greeting' },
      { text: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?', translation: 'What is your name?', category: 'General' },
      { text: 'ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱵᱟᱵᱩᱞᱟᱞ ᱠᱟᱱᱟ᱾', translation: 'My name is Babulal.', category: 'General' },
      { text: 'ᱟᱢ ᱫᱚ ᱚᱠᱟ ᱠᱷᱚᱱ ᱦᱮᱡ ᱠᱟᱱᱟ?', translation: 'Where have you come from?', category: 'General' },
      { text: 'ᱦᱚᱲᱢᱚ ᱵᱮᱥ ᱢᱮᱱᱟᱜ-ᱟ?', translation: 'Is your health good?', category: 'Health' },
      { text: 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱩᱭ ᱮᱱᱟ᱾', translation: 'Sickle cell screening test was completed.', category: 'Health' }
    ]
  },
  {
    id: 'mundari',
    name: 'Mundari',
    nativeName: 'ᱢᱩᱱᱰᱟᱨᱤ',
    code: 'unr',
    badge: 'मु',
    family: 'Austroasiatic',
    speakers: '1.1+ Million',
    states: ['Jharkhand', 'Odisha', 'West Bengal', 'Chhattisgarh'],
    script: 'Mundari Bani / Devanagari',
    description: "Austroasiatic Munda language central to the legacy of Bhagwan Birsa Munda and Ulgulan.",
    history: "Spoken by the Munda people in the Chota Nagpur plateau, historically linked to the legendary freedom struggle of Birsa Munda.",
    importance: "Mundari is integral to Sarna religious customs, Sarhul festival, Karam songs, and indigenous forest governance.",
    isTribal: true,
    virtualKeys: ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', '्'],
    samplePhrases: [
      { text: 'ᱡᱚᱦᱟᱨ ᱜᱮ', translation: 'Warm greetings (Johar ge)', category: 'Greeting' },
      { text: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱤᱱᱟᱹ?', translation: 'What is your name?', category: 'General' },
      { text: 'ᱵᱟᱦᱟ ᱯᱚᱨᱚᱵᱽ ᱦᱤᱡᱩᱜ ᱠᱟᱱᱟ᱾', translation: 'The Baha flower festival is arriving.', category: 'Culture' }
    ]
  },
  {
    id: 'ho',
    name: 'Ho',
    nativeName: '𑢹𑣉𑣉 / हो',
    code: 'hoc',
    badge: 'हो',
    family: 'Austroasiatic',
    speakers: '1.4+ Million',
    states: ['Jharkhand', 'Odisha', 'West Bengal', 'Bihar'],
    script: 'Warang Chiti / Devanagari',
    description: "Austroasiatic Munda language of the Ho people, written in the indigenous Warang Chiti script.",
    history: "Ho is spoken predominantly in the Kolhan division of Jharkhand and Mayurbhanj in Odisha. In the 20th century, community leader Lako Bodra created the Warang Chiti script to preserve Ho literacy and literature.",
    importance: "Preserves the sacred Sarna heritage, Mage Porob and Baha festivals, Jaher than rituals, and the constitutional legacy of the Kolhan resistance.",
    isTribal: true,
    virtualKeys: ['𑢡', '𑢢', '𑢣', '𑢤', '𑢥', '𑢦', '𑢧', '𑢨', '𑢩', '𑢪', '𑢫', '𑢬', '𑢭', '𑢮', '𑢯', '𑢰', '𑢱', '𑢲', '𑢳', '𑢴', '𑢵', '𑢶', '𑢷', '𑢸', '𑢹', '𑢺', '𑢻', '𑢼', '𑢽', '𑢾', '𑢿', '𑣀', '𑣁', '𑣂', '𑣃', '𑣄', '𑣅', '𑣆', '𑣇', '𑣈', '𑣉'],
    samplePhrases: [
      { text: 'ᱡᱚᱦᱟᱨ / जोहार', translation: 'Greetings (Johar)', category: 'Greeting' },
      { text: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱤᱱᱟᱹ? / अम्माग् नुतूम चीना?', translation: 'What is your name?', category: 'General' },
      { text: 'ᱢᱟᱜᱮ ᱯᱚᱨᱚᱵᱽ / मागे परब', translation: 'Mage festival celebration', category: 'Culture' },
      { text: 'ᱟᱞᱤᱝ ᱫᱚ ᱦᱚ ᱦᱚᱲ ᱛᱟᱱᱟᱞᱤᱝ᱾', translation: 'We belong to the Ho community.', category: 'Identity' },
      { text: 'ᱨᱟᱱ ᱡᱚᱢ ᱨᱮᱭᱟᱜ ᱚᱠᱛᱚ ᱦᱩᱭ ᱮᱱᱟ᱾', translation: 'It is time to take medicine.', category: 'Health' }
    ]
  },
  {
    id: 'hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    code: 'hin',
    badge: 'HI',
    family: 'Indo-Aryan',
    speakers: '600+ Million',
    states: ['PAN India'],
    script: 'Devanagari',
    description: "Official language of the Union of India, bridging central schemes and regional dialogue.",
    history: "One of the most spoken languages in India, acting as a bridge language for national governance.",
    importance: "Essential for translating central ministry schemes, guidelines, and medical advisories into local dialects.",
    isTribal: false,
    virtualKeys: ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', '्'],
    samplePhrases: [
      { text: 'नमस्ते, आप कैसे हैं?', translation: 'Hello, how are you?', category: 'Greeting' },
      { text: 'जनजातीय कार्य मंत्रालय की योजनाएं', translation: 'Ministry of Tribal Affairs Schemes', category: 'Governance' }
    ]
  },
  {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    code: 'eng',
    badge: 'EN',
    family: 'Indo-Aryan',
    speakers: 'Global',
    states: ['Global'],
    script: 'Latin',
    description: "Global bridge language for digital empowerment, academic research, and policy documentation.",
    history: "Global lingua franca connecting indigenous researchers with international linguistic archives.",
    importance: "Enables bilingual publication of tribal dictionaries, primers, and scientific documentation.",
    isTribal: false,
    samplePhrases: [
      { text: 'Welcome to the Bhasha Setu portal.', translation: 'भाषा सेतु पोर्टल में आपका स्वागत है।', category: 'Greeting' },
      { text: 'Empowering tribal communities through AI translation.', translation: 'एआई अनुवाद के माध्यम से जनजातीय समुदायों का सशक्तिकरण।', category: 'Mission' }
    ]
  }
];

export const TRIBAL_ONLY_LANGUAGES = SUPPORTED_LANGUAGES.filter(l => l.isTribal);
