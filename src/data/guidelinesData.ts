export interface PolicyGuideline {
  id: string;
  title: string;
  category: 'Language Preservation' | 'Education Policy' | 'Healthcare & SCD' | 'Tribal Welfare';
  issuedBy: string;
  date: string;
  summary: string;
  keyDirectives: string[];
  pdfName: string;
  fileSize: string;
}

export const MINISTRY_GUIDELINES: PolicyGuideline[] = [
  {
    id: 'guide-nep-2020',
    title: 'National Education Policy (NEP) 2020: Mother Tongue Education in Tribal Regions',
    category: 'Education Policy',
    issuedBy: 'Ministry of Education & Ministry of Tribal Affairs',
    date: 'July 2020 (Updated 2024)',
    summary: 'Guidelines mandating primary and foundational stage instruction (up to Grade 5, preferably Grade 8) in the home language / mother tongue / tribal dialect to prevent dropouts and foster cognitive growth.',
    keyDirectives: [
      'Development of bilingual primers with state TRIs and CIIL.',
      'Training and recruitment of local tribal teachers proficient in native dialects.',
      'Digitization of folklore, oral stories, and songs into early grade curricula.'
    ],
    pdfName: 'NEP_2020_Tribal_Language_Guidelines.pdf',
    fileSize: '2.4 MB'
  },
  {
    id: 'guide-scd-mission',
    title: 'Operational Guidelines: National Sickle Cell Anaemia Elimination Mission',
    category: 'Healthcare & SCD',
    issuedBy: 'Ministry of Health & Family Welfare & Ministry of Tribal Affairs',
    date: 'July 2023',
    summary: 'National framework for universal point-of-care screening, pre-marital genetic counseling, color-coded health cards, and Hydroxyurea distribution across 278 tribal districts.',
    keyDirectives: [
      'Universal screening of 7 crore tribal population between 0-40 years.',
      'Distribution of Sickle Cell Status Cards (Green/Yellow/Red).',
      'Integration of translation tools (Adi Vaani) for tribal language awareness campaigns.'
    ],
    pdfName: 'SCD_Elimination_Mission_Guidelines_MoTA.pdf',
    fileSize: '4.1 MB'
  },
  {
    id: 'guide-tribal-language-preservation',
    title: 'Scheme for Preservation and Development of Indigenous Tribal Languages and Scripts',
    category: 'Language Preservation',
    issuedBy: 'Ministry of Tribal Affairs, Government of India',
    date: 'November 2023',
    summary: 'Financial and technological grants to Tribal Research Institutes (TRIs), universities, and consortium partners (IIT Delhi, BITS Pilani, IIIT-H) for AI corpora collection and dictionary creation.',
    keyDirectives: [
      'Collection of 10,000+ hours of tribal speech data for neural ASR and TTS.',
      'Preservation of endangered PVTG languages through phonetic archiving.',
      'Community crowdsourcing platform and linguistic validation.'
    ],
    pdfName: 'MoTA_Language_Preservation_Scheme_2023.pdf',
    fileSize: '1.8 MB'
  },
  {
    id: 'guide-adi-karmayogi',
    title: 'Adi Karmayogi Abhiyan: Grassroots Capacity Building for Tribal Frontline Cadres',
    category: 'Tribal Welfare',
    issuedBy: 'Ministry of Tribal Affairs & Mission Karmayogi',
    date: 'January 2024',
    summary: 'Training module guidelines for Gram Panchayat functionaries, ASHA workers, and Forest Rights committees using offline vernacular translation aids.',
    keyDirectives: [
      'Deployment of localized vernacular terminology packs for governance.',
      'Offline mobile app access in low-connectivity forest villages.',
      'Certification of tribal youth translators and cultural custodians.'
    ],
    pdfName: 'Adi_Karmayogi_Training_Framework_2024.pdf',
    fileSize: '3.2 MB'
  }
];
