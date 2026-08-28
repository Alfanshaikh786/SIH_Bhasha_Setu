import { SANTALI_DATASET } from './santaliDataset';

export interface DictionaryEntry {
  id: string;
  word: string;
  nativeScript: string;
  language: string;
  languageCode: string;
  ipa: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'greeting' | 'adverb' | string;
  definitionEn: string;
  definitionHi: string;
  exampleNative: string;
  exampleEn: string;
  exampleHi: string;
  category: string;
  audioText?: string;
  synonyms?: string[];
}

export const BASE_DICTIONARY_ENTRIES: DictionaryEntry[] = [
  // Santali entries
  {
    id: 'snt-1',
    word: 'Johar',
    nativeScript: 'ᱡᱚᱦᱟᱨ',
    language: 'Santali',
    languageCode: 'sat',
    ipa: '/dʒoːhaːr/',
    partOfSpeech: 'greeting',
    definitionEn: 'Traditional respectful greeting, salutation, or welcome acknowledging the divine in all beings.',
    definitionHi: 'पारंपरिक आदरसूचक अभिवादन, प्रणाम या जोहार।',
    exampleNative: 'ᱡᱚᱦᱟᱨ ᱜᱮ, ᱟᱢ ᱫᱚ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟ?',
    exampleEn: 'Greetings, how are you doing?',
    exampleHi: 'जोहार, आप कैसे हैं?',
    category: 'Greetings',
    synonyms: ['Namaste', 'Salutation']
  },
  {
    id: 'snt-2',
    word: 'Hasa',
    nativeScript: 'ᱦᱟᱥᱟ',
    language: 'Santali',
    languageCode: 'sat',
    ipa: '/haːsaː/',
    partOfSpeech: 'noun',
    definitionEn: 'Soil, mother earth, native land.',
    definitionHi: 'मिट्टी, मातृभूमि, धरती।',
    exampleNative: 'ᱟᱵᱚᱣᱟᱜ ᱦᱟᱥᱟ ᱟᱵᱚᱣᱟᱜ ᱡᱤᱣᱤ ᱠᱟᱱᱟ᱾',
    exampleEn: 'Our land is our life.',
    exampleHi: 'हमारी मिट्टी ही हमारा जीवन है।',
    category: 'Agriculture & Nature',
    synonyms: ['Dharti', 'Matti']
  },
  {
    id: 'snt-3',
    word: 'Ran',
    nativeScript: 'ᱨᱟᱱ',
    language: 'Santali',
    languageCode: 'sat',
    ipa: '/raːn/',
    partOfSpeech: 'noun',
    definitionEn: 'Medicine, herbal healing cure, traditional remedy.',
    definitionHi: 'दवा, औषधी, जड़ी-बूटी।',
    exampleNative: 'ᱱᱚᱶᱟ ᱨᱟᱱ ᱫᱚ ᱵᱤᱨ ᱠᱷᱚᱱ ᱧᱟᱢᱚᱜ-ᱟ᱾',
    exampleEn: 'This medicine is obtained from the forest.',
    exampleHi: 'यह दवा जंगल से प्राप्त होती है।',
    category: 'Health & Medicine',
    synonyms: ['Oushadh', 'Dawai']
  },
  {
    id: 'snt-4',
    word: 'Baha',
    nativeScript: 'ᱵᱟᱦᱟ',
    language: 'Santali',
    languageCode: 'sat',
    ipa: '/baːhaː/',
    partOfSpeech: 'noun',
    definitionEn: 'Flower; also refers to the spring Baha Parab flower festival celebrating the Sal tree blossom.',
    definitionHi: 'फूल; साथ ही संथाली वसंत उत्सव "बाहा परब"।',
    exampleNative: 'ᱵᱟᱦᱟ ᱯᱚᱨᱚᱵᱽ ᱨᱮ ᱥᱟᱨᱡᱚᱢ ᱵᱟᱦᱟ ᱠᱚ ᱯᱩᱡᱟᱹᱭᱟ᱾',
    exampleEn: 'During Baha Parab, sacred Sal flowers are offered.',
    exampleHi: 'बाहा पर्व में साल के फूलों की पूजा की जाती है।',
    category: 'Society & Culture',
    synonyms: ['Phool', 'Pushp']
  },
  {
    id: 'snt-5',
    word: 'Hormo',
    nativeScript: 'ᱦᱚᱲᱢᱚ',
    language: 'Santali',
    languageCode: 'sat',
    ipa: '/hɔɽmɔ/',
    partOfSpeech: 'noun',
    definitionEn: 'Body, physical health and well-being.',
    definitionHi: 'शरीर, स्वास्थ्य, देह।',
    exampleNative: 'ᱦᱚᱲᱢᱚ ᱵᱮᱥ ᱫᱚᱦᱚ ᱞᱟᱹᱜᱤᱫ ᱥᱟᱯᱷᱟ ᱫᱟᱜ ᱧᱩ ᱢᱮ᱾',
    exampleEn: 'Drink clean water to keep your body healthy.',
    exampleHi: 'शरीर को स्वस्थ रखने के लिए साफ पानी पिएं।',
    category: 'Health & Medicine'
  },
  {
    id: 'snt-6',
    word: 'Mayam',
    nativeScript: 'ᱢᱟᱭᱟᱢ',
    language: 'Santali',
    languageCode: 'sat',
    ipa: '/maːjam/',
    partOfSpeech: 'noun',
    definitionEn: 'Blood; vital circulatory fluid (crucial for SCD diagnosis).',
    definitionHi: 'रक्त, खून।',
    exampleNative: 'ᱢᱟᱭᱟᱢ ᱵᱤᱰᱟᱹᱣ ᱞᱟᱹᱜᱤᱫ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱪᱟᱞᱟᱣ ᱢᱮ᱾',
    exampleEn: 'Go to the hospital for a blood screening test.',
    exampleHi: 'रक्त जांच के लिए अस्पताल जाएं।',
    category: 'Health & Medicine'
  },

  // Mundari entries
  {
    id: 'unr-1',
    word: 'Ulgulan',
    nativeScript: 'ᱩᱞᱜᱩᱞᱟᱱ',
    language: 'Mundari',
    languageCode: 'unr',
    ipa: '/ulɡulaːn/',
    partOfSpeech: 'noun',
    definitionEn: 'The Great Revolution / Rebellion initiated by Birsa Munda for indigenous rights and autonomy.',
    definitionHi: 'महान जनक्रांति, बिरसा मुंडा का ऐतिहासिक जल-जंगल-ज़मीन आंदोलन।',
    exampleNative: 'ᱵᱤᱨᱥᱟ ᱢᱩᱱᱰᱟ ᱫᱚ ᱩᱞᱜᱩᱞᱟᱱ ᱮ ᱮᱛᱚᱦᱚᱵ ᱞᱮᱫ-ᱟ᱾',
    exampleEn: 'Birsa Munda ignited the historic Ulgulan.',
    exampleHi: 'बिरसा मुंडा ने महान उलगुलान का शंखनाद किया था।',
    category: 'Society & Culture'
  },
  {
    id: 'unr-2',
    word: 'Daa',
    nativeScript: 'ᱫᱟᱜ',
    language: 'Mundari',
    languageCode: 'unr',
    ipa: '/daːʔ/',
    partOfSpeech: 'noun',
    definitionEn: 'Water, rain, life source.',
    definitionHi: 'पानी, जल, वर्षा।',
    exampleNative: 'ᱫᱟᱜ ᱫᱚ ᱡᱤᱣᱤ ᱨᱮᱱᱟᱜ ᱢᱩᱬᱩᱛ ᱠᱟᱱᱟ᱾',
    exampleEn: 'Water is the primary source of life.',
    exampleHi: 'जल ही जीवन का मूल आधार है।',
    category: 'Agriculture & Nature'
  },

  // Ho language entries
  {
    id: 'ho-1',
    word: 'Singbonga',
    nativeScript: '𑢹𑣉𑣉 ᱥᱤᱝᱵᱚᱝᱜᱟ / सिंगबोंगा',
    language: 'Ho',
    languageCode: 'hoc',
    ipa: '/siŋ.bɔŋ.ga/',
    partOfSpeech: 'noun',
    definitionEn: 'The supreme creator deity / solar deity in Ho and Munda indigenous Sarna spirituality.',
    definitionHi: 'सर्वोच्च सृष्टिकर्ता देवता, हो एवं सरना समाज के प्रमुख आराध्य देव।',
    exampleNative: 'ᱥᱤᱝᱵᱚᱝᱜᱟ ᱟᱵᱚ ᱥᱟᱱᱟᱢ ᱠᱚᱭ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱚᱱᱟ᱾',
    exampleEn: 'Singbonga protects and guides all living beings.',
    exampleHi: 'सिंगबोंगा हम सभी की रक्षा करते हैं।',
    category: 'Society & Culture',
    synonyms: ['Creator', 'Sun Deity']
  },
  {
    id: 'ho-2',
    word: 'Mage Porob',
    nativeScript: 'ᱢᱟᱜᱮ ᱯᱚᱨᱚᱵᱽ / मागे परब',
    language: 'Ho',
    languageCode: 'hoc',
    ipa: '/maː.geː pɔ.rɔb/',
    partOfSpeech: 'noun',
    definitionEn: 'The primary annual harvesting and thanksgiving festival celebrated with folk songs and dances by the Ho community.',
    definitionHi: 'हो समुदाय का सबसे प्रमुख वार्षिक फसल उत्सव एवं पारंपरिक पर्व।',
    exampleNative: 'ᱢᱟᱜᱮ ᱯᱚᱨᱚᱵᱽ ᱨᱮ ᱟᱹᱛᱩ ᱦᱚᱲ ᱠᱚ ᱮᱱᱮᱡ ᱥᱮᱨᱮᱧᱟ᱾',
    exampleEn: 'Villagers celebrate Mage Porob with traditional music and dance.',
    exampleHi: 'मागे परब में गांव के लोग पारंपरिक नृत्य और गीत गाते हैं।',
    category: 'Society & Culture',
    synonyms: ['Harvest Festival', 'Mage Parab']
  },
  {
    id: 'ho-3',
    word: 'Daah',
    nativeScript: 'ᱫᱟᱜ / दाः',
    language: 'Ho',
    languageCode: 'hoc',
    ipa: '/daːʔ/',
    partOfSpeech: 'noun',
    definitionEn: 'Water, life-sustaining liquid, rain.',
    definitionHi: 'जल, पानी, जीवनदायी अमृत।',
    exampleNative: 'ᱫᱟᱜ ᱧᱩ ᱢᱮ ᱟᱨ ᱦᱚᱲᱢᱚ ᱵᱮᱥ ᱫᱚᱦᱚᱭ ᱢᱮ᱾',
    exampleEn: 'Drink water and stay healthy.',
    exampleHi: 'पानी पियो और स्वस्थ रहो।',
    category: 'Agriculture & Nature',
    synonyms: ['Water', 'Pani']
  },
  {
    id: 'ho-4',
    word: 'Jaher Than',
    nativeScript: 'ᱡᱟᱦᱮᱨ ᱛᱷᱟᱱ / जाहेर थान',
    language: 'Ho',
    languageCode: 'hoc',
    ipa: '/dʒaː.heːr t̪ʰaːn/',
    partOfSpeech: 'noun',
    definitionEn: 'Sacred grove of Sal trees where tribal community deities and nature spirits are worshipped.',
    definitionHi: 'पवित्र शाल कुंज जहां ग्राम देवता एवं प्रकृति की पूजा की जाती है।',
    exampleNative: 'ᱡᱟᱦᱮᱨ ᱛᱷᱟᱱ ᱨᱮ ᱵᱟᱦᱟ ᱯᱩᱡᱟᱹ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾',
    exampleEn: 'Baha nature worship rituals are performed at Jaher Than.',
    exampleHi: 'जाहेर थान पर बाहा पूजा की जाती है।',
    category: 'Society & Culture',
    synonyms: ['Sacred Grove', 'Sarna Sthal']
  }
];

// Map 6,780+ Santali dataset items to DictionaryEntry format
const parsedSantaliEntries: DictionaryEntry[] = SANTALI_DATASET.map(item => ({
  id: item.id,
  word: item.roman || item.en,
  nativeScript: item.sat,
  language: 'Santali',
  languageCode: 'sat',
  ipa: item.roman ? `/${item.roman}/` : '',
  partOfSpeech: 'noun',
  definitionEn: item.en,
  definitionHi: item.hi,
  exampleNative: item.sat,
  exampleEn: item.en,
  exampleHi: item.hi,
  category: item.cat || 'General',
  audioText: item.roman || item.sat,
  synonyms: [item.en, item.hi]
}));

// Combined rich dictionary of 6,800+ words and sentences
export const DICTIONARY_ENTRIES: DictionaryEntry[] = [
  ...BASE_DICTIONARY_ENTRIES,
  ...parsedSantaliEntries
];

export const DICTIONARY_CATEGORIES = [
  'All Categories',
  'Animal',
  'Bird',
  'Vegetable',
  'Fruit',
  'Flower',
  'Water Animal',
  'Insects',
  'Parts of Body',
  'Normally Used Words in Classroom',
  'Residence',
  'Transport',
  'Relation',
  'Colours',
  'Greetings',
  'Health & Medicine',
  'Agriculture & Nature',
  'Family & Kinship',
  'Society & Culture',
  'Numbers & Time',
  'General'
] as const;
