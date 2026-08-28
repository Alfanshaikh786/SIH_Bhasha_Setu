export interface VVIPSpeech {
  id: string;
  title: string;
  speaker: 'Hon’ble PM Shri Narendra Modi' | 'Hon’ble President Smt. Droupadi Murmu';
  speakerRole: string;
  language: string;
  languageCode: string;
  youtubeId: string;
  duration: string;
  date: string;
  event: string;
  description: string;
  subtitles: {
    startSec: number;
    endSec: number;
    textNative: string;
    textEn: string;
    textHi: string;
  }[];
}

export const VVIP_SPEECHES: VVIPSpeech[] = [
  {
    id: 'pm-betta-kuruba',
    title: "PM's Independence Day Address | Live Subtitles – Betta Kuruba",
    speaker: 'Hon’ble PM Shri Narendra Modi',
    speakerRole: 'Prime Minister of India',
    language: 'Bettakuruba',
    languageCode: 'bvk',
    youtubeId: 'DNDJYTGDyj8',
    duration: '14:20',
    date: '15 Aug 2024',
    event: '78th Independence Day, Red Fort',
    description: "Hon'ble Prime Minister's historic address to the nation delivered from the Red Fort, with neural live subtitles rendered in Betta Kuruba.",
    subtitles: [
      { startSec: 0, endSec: 8, textNative: 'ನನ್ನ ಪ್ರೀತಿಯ 140 ಕೋಟಿ ಭಾರತೀಯ ಸಹೋದರ ಸಹೋದರಿಯರಿಗೆ ನಮಸ್ಕಾರ.', textEn: 'Greetings to my beloved 140 crore fellow Indian brothers and sisters.', textHi: 'मेरे प्यारे 140 करोड़ परिवारजनों को स्वतंत्रता दिवस की शुभकामनाएं।' },
      { startSec: 9, endSec: 20, textNative: 'ಇಂದು ನಮ್ಮ ದೇಶವು ಸ್ವಾತಂತ್ರ್ಯದ ಅಮೃತ ಕಾಲದಲ್ಲಿ ಹೆಮ್ಮೆಯಿಂದ ಮುನ್ನಡೆಯುತ್ತಿದೆ.', textEn: 'Today our nation marches forward with pride in the Amrit Kaal of independence.', textHi: 'आज हमारा देश आज़ादी के अमृत काल में गर्व के साथ आगे बढ़ रहा है।' }
    ]
  },
  {
    id: 'pm-koya',
    title: "PM's Independence Day Address | Live Subtitles – Koya",
    speaker: 'Hon’ble PM Shri Narendra Modi',
    speakerRole: 'Prime Minister of India',
    language: 'Koya',
    languageCode: 'kff',
    youtubeId: 'qDTo0HQy47M',
    duration: '12:45',
    date: '15 Aug 2024',
    event: '78th Independence Day, Red Fort',
    description: "National Independence Day address with AI-generated synchronized subtitles in the Koya language.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'నా ప్రియమైన 140 కోట్ల కుటుంబ సభ్యులారా, స్వాతంత్య్ర దినోత్సవ శుభాకాంక్షలు.', textEn: 'My dear 140 crore family members, warm greetings on Independence Day.', textHi: 'मेरे प्रिय 140 करोड़ परिवारजनों, स्वतंत्रता दिवस की बहुत-बहुत बधाई।' }
    ]
  },
  {
    id: 'pm-bhili',
    title: "PM's Independence Day Address | Live Subtitles – Bhili",
    speaker: 'Hon’ble PM Shri Narendra Modi',
    speakerRole: 'Prime Minister of India',
    language: 'Bhili',
    languageCode: 'bhi',
    youtubeId: '2jLC4q6lC_Q',
    duration: '15:10',
    date: '15 Aug 2024',
    event: '78th Independence Day, Red Fort',
    description: "Independence Day broadcast rendered with accurate real-time speech translation into Western Indo-Aryan Bhili.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'म्हारा प्यारा १४० करोड़ देशवासी भाइया-बेहना ने आजादी नो सण नी घणी-घणी बधाई!', textEn: 'Heartiest congratulations on Independence Day to my 140 crore countrymen!', textHi: 'मेरे प्यारे 140 करोड़ देशवासियों को स्वतंत्रता दिवस की बहुत-बहुत बधाई!' }
    ]
  },
  {
    id: 'pm-kui',
    title: "PM's Independence Day Address | Live Subtitles – Kui",
    speaker: 'Hon’ble PM Shri Narendra Modi',
    speakerRole: 'Prime Minister of India',
    language: 'Kui',
    languageCode: 'kui',
    youtubeId: 'GvP6ovc51dw',
    duration: '11:30',
    date: '15 Aug 2024',
    event: '78th Independence Day, Red Fort',
    description: "Subtitled Kui translation for Kondh tribal communities in Odisha and Andhra Pradesh.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'ଆମର ୧୪୦ କୋଟି ଭାରତୀୟ ପରିବାରବର୍ଗଙ୍କୁ ସ୍ୱାଧୀନତା ଦିବସର ଶୁଭେଚ୍ଛା।', textEn: 'Greetings on Independence Day to our 140 crore Indian family.', textHi: 'हमारे 140 करोड़ परिवारजनों को स्वतंत्रता दिवस की शुभकामनाएं।' }
    ]
  },
  {
    id: 'pm-garo',
    title: "PM's Independence Day Address | Live Subtitles – Garo",
    speaker: 'Hon’ble PM Shri Narendra Modi',
    speakerRole: 'Prime Minister of India',
    language: 'Garo',
    languageCode: 'grt',
    youtubeId: 'XsBGU_vvpPw',
    duration: '13:15',
    date: '15 Aug 2024',
    event: '78th Independence Day, Red Fort',
    description: "Garo subtitled edition of the Prime Minister's national address for Meghalaya and Assam.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'Angni namchikbegipa 140 crore songtangni manderangna Jakgitel Salni pattianiko on·a.', textEn: 'Sending Independence Day blessings to my beloved 140 crore citizens.', textHi: 'मेरे प्यारे 140 करोड़ देशवासियों को स्वतंत्रता दिवस की हार्दिक शुभकामनाएं।' }
    ]
  },
  {
    id: 'pm-santali',
    title: "PM's Independence Day Address | Live Subtitles – Santali",
    speaker: 'Hon’ble PM Shri Narendra Modi',
    speakerRole: 'Prime Minister of India',
    language: 'Santali',
    languageCode: 'sat',
    youtubeId: 'HUtRx4NDMwk',
    duration: '16:00',
    date: '15 Aug 2024',
    event: '78th Independence Day, Red Fort',
    description: "Santali translation with Ol Chiki on-screen subtitles for Santhal communities across eastern India.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'ᱤᱧᱟᱜ ᱫᱩᱞᱟᱹᱲ ᱑᱔᱐ ᱠᱳᱴᱤ ᱫᱤᱥᱚᱢ ᱦᱚᱲ ᱠᱚ ᱯᱷᱩᱨᱜᱟᱹᱞ ᱢᱟᱦᱟᱸ ᱨᱮᱱᱟᱜ ᱟᱭᱢᱟ ᱟᱭᱢᱟ ᱡᱚᱦᱟᱨ!', textEn: 'Warm Independence Day greetings to all 140 crore fellow citizens!', textHi: 'मेरे प्यारे 140 करोड़ देशवासियों को स्वतंत्रता दिवस का जोहार!' }
    ]
  },
  {
    id: 'pm-gondi',
    title: "PM's Independence Day Address | Live Subtitles – Gondi",
    speaker: 'Hon’ble PM Shri Narendra Modi',
    speakerRole: 'Prime Minister of India',
    language: 'Gondi',
    languageCode: 'gon',
    youtubeId: 'yB-q60MPnF8',
    duration: '14:50',
    date: '15 Aug 2024',
    event: '78th Independence Day, Red Fort',
    description: "Central Gondi dialect translation broadcast across central Indian tribal belts.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'नावा १४० करोड़ कुटुंब ना भाई-बहेनी तुन आजादी ना जोहार!', textEn: 'Independence Day salutations to my 140 crore family members!', textHi: 'मेरे 140 करोड़ परिवारजनों को आज़ादी का सेवा जोहार!' }
    ]
  },
  {
    id: 'pm-mundari',
    title: "PM's Independence Day Address | Live Subtitles – Mundari",
    speaker: 'Hon’ble PM Shri Narendra Modi',
    speakerRole: 'Prime Minister of India',
    language: 'Mundari',
    languageCode: 'unr',
    youtubeId: 'zDElFYFERl4',
    duration: '12:10',
    date: '15 Aug 2024',
    event: '78th Independence Day, Red Fort',
    description: "Mundari subtitled edition celebrating the courage of Bhagwan Birsa Munda and indigenous unity.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱨᱮᱱ ᱑᱔᱐ ᱠᱳᱴᱤ ᱦᱚᱲ ᱠᱚ ᱡᱚᱦᱟᱨ ᱟᱨ ᱯᱷᱩᱨᱜᱟᱹᱞ ᱢᱟᱦᱟᱸ ᱨᱮᱱᱟᱜ ᱵᱟᱫᱷᱟᱭ!', textEn: 'Greetings and congratulations on Independence Day to 140 crore citizens!', textHi: 'देश के 140 करोड़ नागरिकों को स्वतंत्रता दिवस की जोहार और बधाई!' }
    ]
  },
  {
    id: 'pres-library-gondi',
    title: "Rashtrapati Bhavan | President Smt. Droupadi Murmu On Historic Heritage",
    speaker: 'Hon’ble President Smt. Droupadi Murmu',
    speakerRole: 'President of India',
    language: 'Gondi',
    languageCode: 'gon',
    youtubeId: '1_cG6S6GGvnZ9IyNeqlLCOU_4ot8tK3sQ',
    duration: '08:45',
    date: '20 Jan 2024',
    event: 'Rashtrapati Bhavan Cultural Heritage Series',
    description: "Hon'ble President Smt. Droupadi Murmu speaking on the value of education, indigenous literature, and cultural preservation.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'किताबी ज्ञान अऊर हम्मा पुरखा ना विद्या समाज तुन ताकत सींदा।', textEn: 'Knowledge from books and ancestral wisdom empowers society.', textHi: 'किताबों का ज्ञान और हमारे पुरखों की विद्या समाज को सच्ची ताकत देती है।' }
    ]
  },
  {
    id: 'pres-education-santali',
    title: "President Smt. Droupadi Murmu: The Transformative Power of Education",
    speaker: 'Hon’ble President Smt. Droupadi Murmu',
    speakerRole: 'President of India',
    language: 'Santali',
    languageCode: 'sat',
    youtubeId: 'pVMz6-HDeTE',
    duration: '09:20',
    date: '12 Mar 2024',
    event: 'National Tribal Youth Convention',
    description: "Inspiring address by Hon'ble President sharing personal reflections on education and language revitalization in Santali.",
    subtitles: [
      { startSec: 0, endSec: 10, textNative: 'ᱚᱞᱚᱜ ᱯᱟᱲᱦᱟᱣ ᱜᱮ ᱟᱵᱚᱣᱟᱜ ᱡᱤᱭᱚᱱ ᱨᱮ ᱟᱹᱰᱤ ᱢᱟᱨᱟᱝ ᱵᱚᱫᱚᱞ ᱮ ᱟᱹᱜᱩ ᱫᱟᱲᱮᱭᱟᱜ-ᱟ᱾', textEn: 'Education is the greatest catalyst for transformation in our lives.', textHi: 'शिक्षा ही हमारे जीवन में सबसे बड़ा सकारात्मक परिवर्तन ला सकती है।' }
    ]
  }
];
