export interface PrimerCollection {
  id: string;
  state: string;
  slug: string;
  primerCount: number;
  description: string;
  languages: string[];
  coverColor: string;
  primers: PrimerBook[];
}

export interface PrimerBook {
  id: string;
  title: string;
  language: string;
  script: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  pages: number;
  chapters: {
    title: string;
    description: string;
    alphabetChart?: { letter: string; name: string; sound: string; example: string }[];
    words?: { word: string; script: string; meaning: string; pronunciation: string }[];
    sentences?: { native: string; english: string; hindi: string }[];
  }[];
}

export const PRIMER_COLLECTIONS: PrimerCollection[] = [
  {
    id: 'santali-collection',
    state: 'Santali (Ol Chiki)',
    slug: 'santali-primers',
    primerCount: 12,
    description: 'Official bilingual mother-tongue textbooks, Ol Chiki script charts, and classroom readers created for Santali literacy.',
    languages: ['Santali', 'English', 'Hindi'],
    coverColor: 'from-green-700 to-emerald-900',
    primers: [
      {
        id: 'sat-1',
        title: 'Ol Chiki Reader: Grade 1 (Santali)',
        language: 'Santali',
        script: 'Ol Chiki',
        level: 'Beginner',
        pages: 60,
        chapters: [
          {
            title: 'ᱯᱩᱭᱞᱩ ᱦᱟᱹᱴᱤᱧ: ᱚᱞ ᱪᱤᱠᱤ ᱪᱮᱫᱚᱜ (Learn Ol Chiki)',
            description: 'The 30 fundamental letters and 6 modifiers created by Pandit Raghunath Murmu.',
            alphabetChart: [
              { letter: 'ᱚ', name: 'La', sound: '/ɔ/', example: 'ᱚᱞ (Ol - To write)' },
              { letter: 'ᱛ', name: 'At', sound: '/t̪/', example: 'ᱛᱤ (Ti - Hand)' },
              { letter: 'ᱜ', name: 'Ag', sound: '/ɡ/', example: 'ᱜᱟᱰᱟ (Gada - River)' },
              { letter: 'ᱝ', name: 'Ang', sound: '/ŋ/', example: 'ᱦᱟᱹᱛᱤ (Hati - Elephant)' },
              { letter: 'ᱞ', name: 'Al', sound: '/l/', example: 'ᱞᱩᱛᱩᱨ (Lutur - Ear)' },
              { letter: 'ᱟ', name: 'Laa', sound: '/a/', example: 'ᱟᱭᱳ (Ayo - Mother)' }
            ],
            words: [
              { word: 'ᱚᱞ', script: 'ᱚᱞ', meaning: 'To write', pronunciation: 'ol' },
              { word: 'ᱯᱟᱲᱦᱟᱣ', script: 'ᱯᱟᱲᱦᱟᱣ', meaning: 'To read', pronunciation: 'parhao' },
              { word: 'ᱟᱥᱲᱟ', script: 'ᱟᱥᱲᱟ', meaning: 'School', pronunciation: 'asra' }
            ],
            sentences: [
              { native: 'ᱤᱧ ᱫᱚ ᱚᱞ ᱪᱤᱠᱤ ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱧ᱾', english: 'I am reading Ol Chiki.', hindi: 'मैं ओल चिकी पढ़ रहा हूँ।' },
              { native: 'ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ᱾', english: 'Our country is India.', hindi: 'हमारा देश भारत है।' }
            ]
          }
        ]
      },
      {
        id: 'sat-2',
        title: 'Santali Nature & Health Primer (Grade 2)',
        language: 'Santali',
        script: 'Ol Chiki',
        level: 'Intermediate',
        pages: 72,
        chapters: [
          {
            title: 'ᱫᱚᱥᱟᱨ ᱦᱟᱹᱴᱤᱧ: ᱦᱚᱲᱢᱚ ᱟᱨ ᱨᱟᱱ (Health & Nature)',
            description: 'Vocabulary for bodily health, clean water, and botanical medicinal flora.',
            words: [
              { word: 'ᱦᱚᱲᱢᱚ', script: 'ᱦᱚᱲᱢᱚ', meaning: 'Health / Body', pronunciation: 'hormo' },
              { word: 'ᱫᱟᱜ', script: 'ᱫᱟᱜ', meaning: 'Clean Water', pronunciation: 'daag' },
              { word: 'ᱨᱟᱱ', script: 'ᱨᱟᱱ', meaning: 'Medicine', pronunciation: 'raan' }
            ],
            sentences: [
              { native: 'ᱥᱟᱯᱷᱟ ᱫᱟᱜ ᱧᱩ ᱞᱮᱠᱷᱟᱱ ᱦᱚᱲᱢᱚ ᱵᱮᱥ ᱛᱟᱦᱮᱸᱱᱟ᱾', english: 'Drinking clean water keeps your body healthy.', hindi: 'साफ पानी पीने से शरीर स्वस्थ रहता है।' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'mundari-collection',
    state: 'Mundari',
    slug: 'mundari-primers',
    primerCount: 8,
    description: 'Comprehensive mother-tongue textbooks, Sarhul cultural folklore, and bilingual environmental primers for Mundari.',
    languages: ['Mundari', 'English', 'Hindi'],
    coverColor: 'from-emerald-800 to-teal-950',
    primers: [
      {
        id: 'unr-1',
        title: 'Mundari Bhasha Shiksha: Level 1',
        language: 'Mundari',
        script: 'Mundari Bani / Devanagari',
        level: 'Beginner',
        pages: 54,
        chapters: [
          {
            title: 'ᱯᱟᱹᱴᱷ ᱑: ᱟᱵᱚᱣᱟᱜ ᱟᱹᱛᱩ (Our Village)',
            description: 'Core family, village, and forest vocabulary in Mundari.',
            words: [
              { word: 'ᱡᱚᱦᱟᱨ', script: 'ᱡᱚᱦᱟᱨ', meaning: 'Greetings', pronunciation: 'johar' },
              { word: 'ᱫᱟᱜ', script: 'ᱫᱟᱜ', meaning: 'Water', pronunciation: 'daa' },
              { word: 'ᱵᱟᱦᱟ', script: 'ᱵᱟᱦᱟ', meaning: 'Flower (Sarhul blossom)', pronunciation: 'baha' }
            ],
            sentences: [
              { native: 'ᱵᱤᱨᱥᱟ ᱢᱩᱱᱰᱟ ᱫᱚ ᱩᱞᱜᱩᱞᱟᱱ ᱮ ᱮᱛᱚᱦᱚᱵ ᱞᱮᱫ-ᱟ᱾', english: 'Birsa Munda ignited the historic Ulgulan.', hindi: 'बिरसा मुंडा ने महान उलगुलान की शुरुआत की थी।' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'ho-collection',
    state: 'Ho (Warang Chiti)',
    slug: 'ho-primers',
    primerCount: 6,
    description: 'Official bilingual primers in the Warang Chiti script for the Ho community of Kolhan and Mayurbhanj.',
    languages: ['Ho', 'English', 'Hindi'],
    coverColor: 'from-teal-700 to-green-950',
    primers: [
      {
        id: 'hoc-1',
        title: 'Warang Chiti Lipi Pathamala: Grade 1',
        language: 'Ho',
        script: 'Warang Chiti / Devanagari',
        level: 'Beginner',
        pages: 58,
        chapters: [
          {
            title: 'ᱦᱟᱹᱴᱤᱧ ᱑: ᱣᱟᱨᱟᱝ ᱪᱤᱛᱤ ᱪᱮᱫᱚᱜ (Learn Warang Chiti)',
            description: 'The indigenous Warang Chiti script created by Lako Bodra.',
            words: [
              { word: 'ᱡᱚᱦᱟᱨ / जोहार', script: 'ᱡᱚᱦᱟᱨ', meaning: 'Greetings', pronunciation: 'johar' },
              { word: 'ᱢᱟᱜᱮ ᱯᱚᱨᱚᱵᱽ', script: 'ᱢᱟᱜᱮ ᱯᱚᱨᱚᱵᱽ', meaning: 'Mage Festival', pronunciation: 'mage porob' },
              { word: 'ᱥᱤᱝᱵᱚᱝᱜᱟ', script: 'ᱥᱤᱝᱵᱚᱝᱜᱟ', meaning: 'Singbonga Supreme Deity', pronunciation: 'singbonga' }
            ],
            sentences: [
              { native: 'ᱥᱤᱝᱵᱚᱝᱜᱟ ᱟᱵᱚ ᱥᱟᱱᱟᱢ ᱠᱚᱭ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱵᱚᱱᱟ᱾', english: 'Singbonga protects and guides all living beings.', hindi: 'सिंगबोंगा हम सभी की रक्षा करते हैं।' }
            ]
          }
        ]
      }
    ]
  }
];

export const TOTAL_PRIMERS_COUNT = PRIMER_COLLECTIONS.reduce((acc, c) => acc + c.primerCount, 0);
