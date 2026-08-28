import React from 'react';
import { 
  Globe, 
  Heart, 
  BookOpen, 
  Mic, 
  Target, 
  Users, 
  Award,
  Handshake
} from 'lucide-react';

interface LanguageCardData {
  name: string;
  speakers: string;
  history: string;
  importance: string;
}

const PRESERVED_LANGUAGES: LanguageCardData[] = [
  {
    name: 'Santali',
    speakers: '7.6 million speakers',
    history: 'Santali is the mother tongue of the Santhal tribe and belongs to the Munda sub-family of Austroasiatic languages, written in the Ol Chiki script.',
    importance: "As one of India's 8th Schedule constitutional languages, Santali holds deep cultural, literary, social, and indigenous importance."
  },
  {
    name: 'Mundari',
    speakers: '1.1+ million speakers',
    history: 'Mundari belongs to the Austro-Asiatic Munda language family and is spoken mainly across Jharkhand, Odisha, Chhattisgarh, and West Bengal.',
    importance: 'It is central to ancient tribal rituals, Sarhul festivals, folklore, sacred song traditions, and indigenous environmental knowledge systems.'
  },
  {
    name: 'Ho',
    speakers: '1.4+ million speakers',
    history: 'Ho is an Austroasiatic language of the Munda branch spoken predominantly in the Kolhan region of Jharkhand and Mayurbhanj in Odisha, traditionally written in the Warang Chiti script.',
    importance: 'It preserves the deep oral literature, sacred Jaher than grove rituals, Mage Porob and Baha festivals, and historical resistance lore of the Ho community.'
  }
];

const IMPACT_AREAS = [
  {
    icon: Globe,
    title: 'Governance Inclusion',
    description: 'Translating official schemes and documents directly into tribal languages.'
  },
  {
    icon: Heart,
    title: 'Healthcare Access',
    description: 'Speech-to-speech and OCR tools for clear healthcare communication.'
  },
  {
    icon: BookOpen,
    title: 'Education',
    description: 'Generating bilingual primers and digital learning resources.'
  },
  {
    icon: Mic,
    title: 'Cultural Preservation',
    description: 'Transcribing and translating oral traditions, songs, and stories.'
  },
  {
    icon: Target,
    title: 'Economic Empowerment',
    description: 'Helping tribal communities participate fairly in markets and the digital economy.'
  }
];

export const AboutPage: React.FC = () => {
  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* 1. Header Section */}
        <div className="w-full flex flex-col items-center text-center space-y-4">
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            About Bhasha Setu
          </h1>

          {/* Underline Bar with Centered Green Accent */}
          <div className="relative w-36 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
          </div>

          <p className="max-w-2xl text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            India's first AI-powered platform dedicated to preserving and empowering tribal languages
          </p>

          {/* Dual Tagline Box */}
          <div className="pt-2 flex flex-col items-center">
            <div className="inline-flex items-center justify-center px-6 py-2 bg-[#3b8c5a] text-white font-bold text-sm sm:text-base rounded-xl shadow-xs">
              अपनी भाषा, अपनी विरासत, अपनी आवाज़
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#249144] tracking-wide mt-2">
              Our Language, Our Heritage, Our Voice
            </span>
          </div>
        </div>

        {/* 2. The Languages We Preserve Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 domine-bold tracking-tight">
              The Languages We Preserve
            </h2>
          </div>

          {/* 3-Column Grid for Santali, Mundari, and Ho */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRESERVED_LANGUAGES.map((lang, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-emerald-200/90 p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-[#249144] transition-all space-y-4"
              >
                {/* Language Title & Speaker Badge */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {lang.name}
                  </h3>
                  <span className="inline-block bg-[#e8f5ec] text-[#249144] border border-[#d1ead4] rounded-full px-3.5 py-0.5 text-xs font-bold">
                    {lang.speakers}
                  </span>
                </div>

                {/* History Block */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    History:
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {lang.history}
                  </p>
                </div>

                {/* Importance Block */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Importance:
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {lang.importance}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Note Banner */}
          <div className="rounded-2xl border border-emerald-200/90 bg-[#f0fdf4]/60 p-5 text-center shadow-xs">
            <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
              Together, these languages represent India's linguistic diversity and the voices of millions who have been historically underrepresented.
            </p>
          </div>
        </div>

        {/* 3. Our Impact Areas Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 domine-bold tracking-tight">
              Our Impact Areas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {IMPACT_AREAS.map((area, idx) => {
              const IconComp = area.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#e8f5ec] text-[#249144] flex items-center justify-center shadow-xs">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {area.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {area.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Tricolor Mission, Vision & Values Container */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-orange-500 via-white to-emerald-500 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Our Mission */}
            <div className="bg-[#f0fdf9] rounded-2xl p-6 shadow-sm border border-emerald-100 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center shadow-xs">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Our Mission
                </h3>
                <p className="text-xs sm:text-sm font-medium text-emerald-800 leading-relaxed font-sans">
                  To bridge the digital divide for India's tribal communities through AI-powered translation technology.
                </p>
              </div>
            </div>

            {/* Our Vision */}
            <div className="bg-[#fffbeb] rounded-2xl p-6 shadow-sm border border-amber-100 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#d97706] text-white flex items-center justify-center shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Our Vision
                </h3>
                <p className="text-xs sm:text-sm font-medium text-amber-900 leading-relaxed font-sans">
                  A digitally inclusive India where no citizen is left behind due to language barriers.
                </p>
              </div>
            </div>

            {/* Our Values */}
            <div className="bg-[#faf5ff] rounded-2xl p-6 shadow-sm border border-purple-100 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center shadow-xs">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Our Values
                </h3>
                <p className="text-xs sm:text-sm font-medium text-purple-900 leading-relaxed font-sans">
                  Respect, collaboration, authenticity, innovation, and empowerment through digital inclusion.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 5. Why Tribal Language Preservation Matters Banner */}
        <div className="bg-[#3b8c5a] rounded-3xl p-8 sm:p-10 text-white text-center shadow-xl space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold domine-bold tracking-tight text-white">
            Why Tribal Language Preservation Matters
          </h2>
          <div className="max-w-3xl mx-auto space-y-2 text-xs sm:text-sm font-light text-green-50 leading-relaxed">
            <p>
              Tribal languages carry centuries of knowledge, traditions, songs, folklore, and cultural identity.
            </p>
            <p>
              Bhasha Setu bridges the digital gap by preserving linguistic diversity while enabling practical empowerment.
            </p>
          </div>
        </div>

        {/* 6. Our Commitment to Communities Card (Matching Screenshot) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-6">
          {/* Centered Green Circular Handshake Icon */}
          <div className="w-16 h-16 rounded-full bg-[#f0fdf4] border border-[#dcfce7] text-[#249144] flex items-center justify-center mx-auto shadow-xs">
            <Handshake className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight domine-bold">
              Our Commitment to Communities
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
              We are committed to co-creating with tribal communities, ensuring authenticity, respect, and acceptance.
            </p>
          </div>

          {/* 4 Green Pill Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="bg-[#f0fdf4] text-emerald-800 border border-[#dcfce7] rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-xs">
              Community-First Approach
            </span>
            <span className="bg-[#f0fdf4] text-emerald-800 border border-[#dcfce7] rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-xs">
              Cultural Authenticity
            </span>
            <span className="bg-[#f0fdf4] text-emerald-800 border border-[#dcfce7] rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-xs">
              Expert Validation
            </span>
            <span className="bg-[#f0fdf4] text-emerald-800 border border-[#dcfce7] rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-xs">
              Inclusive Technology
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
