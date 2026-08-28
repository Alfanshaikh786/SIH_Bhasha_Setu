import React, { useState } from 'react';
import { 
  FileText, 
  ArrowRight, 
  BookOpen, 
  X, 
  Download, 
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { PRIMER_COLLECTIONS, PrimerCollection } from '../../data/primersData';

interface PrimerCardData {
  id: string;
  name: string;
  countText: string;
  count: number;
  description: string;
  languages: string[];
}

const PRIMER_ITEMS: PrimerCardData[] = [
  {
    id: 'andaman-nicobar',
    name: 'Andaman & Nicobar',
    countText: '5 primers available',
    count: 5,
    description: 'Foundational language primers for Great Andamanese, Jarawa, Onge, and Nicobarese languages.',
    languages: ['Great Andamanese', 'Jarawa', 'Onge', 'Nicobarese']
  },
  {
    id: 'andhra-pradesh',
    name: 'Andhra Pradesh',
    countText: '6 primers available',
    count: 6,
    description: 'Early grade multilingual primers for Chenchu, Koya, Kolami, and Savara communities.',
    languages: ['Chenchu', 'Koya', 'Kolami', 'Savara']
  },
  {
    id: 'gujarat',
    name: 'Gujarat',
    countText: '1 primer available',
    count: 1,
    description: 'Tribal learning primers for Rathwi, Bhili, and Dangi dialects with Gujarati translations.',
    languages: ['Bhili', 'Rathwi', 'Dangi']
  },
  {
    id: 'jharkhand',
    name: 'Jharkhand',
    countText: '8 primers available',
    count: 8,
    description: 'Bilingual primers in Ol Chiki Santali, Mundari, Ho (Varang Kshiti), and Kurukh (Tolong Siki).',
    languages: ['Santali', 'Mundari', 'Ho', 'Kurukh', 'Kharia']
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    countText: '6 primers available',
    count: 6,
    description: 'Multilingual pedagogical readers for Betta Kuruba, Soliga, Jenu Kuruba, and Koraga.',
    languages: ['Betta Kuruba', 'Soliga', 'Jenu Kuruba', 'Koraga']
  },
  {
    id: 'kerala',
    name: 'Kerala',
    countText: '6 primers available',
    count: 6,
    description: 'Interactive picture primers and textbooks for Irula, Muduga, Kurumba, and Paniya.',
    languages: ['Irula', 'Muduga', 'Kurumba', 'Paniya']
  },
  {
    id: 'madhya-pradesh',
    name: 'Madhya Pradesh',
    countText: '13 primers available',
    count: 13,
    description: 'Extensive primary school primers for Gondi, Bhili, Baigani, Korku, Sahariya, and Bharia.',
    languages: ['Gondi', 'Bhili', 'Baigani', 'Korku', 'Sahariya']
  },
  {
    id: 'maharashtra',
    name: 'Maharashtra',
    countText: '1 primer available',
    count: 1,
    description: 'Foundational learning resources for Katkari, Warli, Madia Gondi, and Pawra.',
    languages: ['Katkari', 'Warli', 'Madia Gond']
  },
  {
    id: 'odisha',
    name: 'Odisha',
    countText: '11 primers available',
    count: 11,
    description: 'State MLE primers covering Kui, Kuvi, Saora, Juang, Bonda, Desia, and Santali.',
    languages: ['Kui', 'Kuvi', 'Saora', 'Juang', 'Bonda']
  },
  {
    id: 'telangana',
    name: 'Telangana',
    countText: '8 primers available',
    count: 8,
    description: 'Mother-tongue textbooks for Gondi (Gunjala script), Koya, Lambadi, and Kolami.',
    languages: ['Gondi', 'Koya', 'Kolami', 'Lambadi']
  },
  {
    id: 'ciil',
    name: 'CIIL',
    countText: '50 primers available',
    count: 50,
    description: 'Central Institute of Indian Languages national master primer depository covering 50+ indigenous tongues.',
    languages: ['Pan-India Tribal Languages', 'North-East Dialects', 'Central India']
  }
];

export const PrimersPage: React.FC = () => {
  const [selectedPrimer, setSelectedPrimer] = useState<PrimerCardData | null>(null);

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Section Header (Exact Match to User Screenshot 1) */}
        <div className="w-full flex flex-col items-center text-center space-y-3">
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            Language Primers
          </h1>

          {/* Underline Bar with Centered Green Accent */}
          <div className="relative w-36 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
          </div>

          <p className="max-w-2xl text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            Comprehensive learning resources for India's diverse languages and cultures
          </p>
        </div>

        {/* 3-Metric Stats Banner (Exact Match to User Screenshot 1) */}
        <div className="rounded-2xl bg-[#f0fdf4] border border-[#dcfce7] p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-emerald-200/80 text-center">
            
            <div className="py-2 md:py-0">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900 block tracking-tight">
                11
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Collections
              </span>
            </div>

            <div className="py-2 md:py-0">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900 block tracking-tight">
                115
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Total Primers
              </span>
            </div>

            <div className="py-2 md:py-0">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900 block tracking-tight">
                20+
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                States Covered
              </span>
            </div>

          </div>
        </div>

        {/* 11 Regional Primer Collection Cards (Exact Match to User Screenshot 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRIMER_ITEMS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 border-t-4 border-t-[#249144] p-6 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Green Document Icon */}
                <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] text-[#249144] border border-[#dcfce7] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {item.countText}
                  </p>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-5 border-t border-slate-100 mt-6">
                <button
                  onClick={() => setSelectedPrimer(item)}
                  className="text-xs sm:text-sm font-bold text-[#249144] hover:text-[#1a7536] inline-flex items-center gap-1.5 transition-colors cursor-pointer group-hover:translate-x-0.5"
                >
                  <span>Browse collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Primer Collection Detail Modal */}
        {selectedPrimer && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden space-y-6 animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedPrimer(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] text-[#249144] border border-[#dcfce7] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 domine-bold">
                    {selectedPrimer.name} Collection
                  </h3>
                  <span className="text-xs font-semibold text-emerald-800 bg-[#f0fdf4] px-2.5 py-0.5 rounded-full border border-[#dcfce7] mt-1 inline-block">
                    {selectedPrimer.countText}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  {selectedPrimer.description}
                </p>
                
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Languages & Dialects Covered:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPrimer.languages.map((l, i) => (
                      <span key={i} className="text-xs px-3 py-1 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedPrimer(null)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => alert(`Accessing digital primer repository for ${selectedPrimer.name}`)}
                  className="px-5 py-2.5 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Primers Archive</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
