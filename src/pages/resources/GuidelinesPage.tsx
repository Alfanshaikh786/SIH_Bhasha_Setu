import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ExternalLink, 
  X, 
  Download, 
  Calendar, 
  Building2, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface GuidelineDoc {
  id: string;
  title: string;
  category: 'Bhili' | 'Regulatory' | 'Education' | 'Social Welfare' | 'Operational';
  pages: number;
  description: string;
  issuedBy: string;
  date: string;
  keyPoints: string[];
}

const GUIDELINE_DOCUMENTS: GuidelineDoc[] = [
  {
    id: 'pm-janman-bhili',
    title: 'PM-JANMAN Operational guidelines Hindi to Bhili',
    category: 'Bhili',
    pages: 24,
    description: 'Comprehensive operational guidelines for Particularly Vulnerable Tribal Groups (PVTGs) translated directly into Bhili language.',
    issuedBy: 'Ministry of Tribal Affairs',
    date: 'January 2024',
    keyPoints: [
      '11 critical interventions across 9 line ministries',
      'Special focus on 75 PVTG communities and habitations',
      'Mother tongue dissemination of health, housing, and clean water schemes'
    ]
  },
  {
    id: 'nos-scholarship',
    title: 'CENTRAL-SECTOR SCHOLARSHIP SCHEME OF NATIONAL OVERSEAS SCHOLARSHIP FOR ST CANDIDATES',
    category: 'Regulatory',
    pages: 24,
    description: 'Financial assistance guidelines for meritorious Scheduled Tribe students pursuing Master and Ph.D. level courses abroad.',
    issuedBy: 'Scholarship Division, MoTA',
    date: '2023 - 2024',
    keyPoints: [
      '100 annual slots for overseas higher studies',
      'Full tuition fees, living allowances, and contingency support',
      'Mandatory 30% reservation for female tribal scholars'
    ]
  },
  {
    id: 'post-matric-scholarship',
    title: 'POST MATRIC SCHOLARSHIP (CENTRALLY SPONSORED SCHEME)',
    category: 'Education',
    pages: 18,
    description: 'Centrally sponsored guidelines for post-secondary financial support to reduce dropout rates among ST youth.',
    issuedBy: 'Education Division, MoTA',
    date: 'Updated 2024',
    keyPoints: [
      'Direct Benefit Transfer (DBT) directly into beneficiary bank accounts',
      'Comprehensive coverage of institutional fees and maintenance allowance',
      'Digital onboarding via National Scholarship Portal (NSP)'
    ]
  },
  {
    id: 'pm-janman-scheme',
    title: 'PM- JANJATI ADIVASI NYAYA MAHA ABHIYAN (PM JANMAN)',
    category: 'Social Welfare',
    pages: 32,
    description: 'Master mission document for socio-economic empowerment of 75 PVTG communities across 18 states and UTs.',
    issuedBy: 'Government of India / MoTA',
    date: 'November 2023',
    keyPoints: [
      'Total mission outlay of ₹24,104 crore',
      'Electrification, pucca housing, road connectivity, and mobile medical units',
      'Multi-purpose community centres (Van Dhan Vikas Kendras)'
    ]
  },
  {
    id: 'national-fellowship',
    title: 'NATIONAL FELLOWSHIP & SCHOLARSHIP FOR HIGHER EDUCATION OF SCHEDULED TRIBE STUDENTS',
    category: 'Education',
    pages: 16,
    description: 'Merit-based fellowships and top-class institutional education for tribal students pursuing M.Phil, Ph.D., and premier university degrees.',
    issuedBy: 'MoTA & UGC',
    date: '2023 - 2024',
    keyPoints: [
      '750 annual fellowship slots for research scholars',
      'Full tuition coverage in premier institutes (IITs, IIMs, AIIMS, NITs)',
      'Quarterly contingency and research book grants'
    ]
  },
  {
    id: 'pre-matric-scholarship',
    title: 'PRE-MATRIC SCHOLARSHIP FOR SCHEDULED TRIBE STUDENTS STUDYING IN CLASS IX & X',
    category: 'Education',
    pages: 20,
    description: 'Incentive-based scheme to bridge the transition gap from elementary to secondary education for tribal school students.',
    issuedBy: 'MoTA State Coordination',
    date: '2023 - 2024',
    keyPoints: [
      'Special support for both day scholars and hostellers',
      'Disability allowances and merit incentives',
      '100% electronic monitoring via State PM-Portal'
    ]
  },
  {
    id: 'da-jgua-operational',
    title: 'DA JGUA Operational Guidelines',
    category: 'Operational',
    pages: 28,
    description: 'Standard operating procedures for Dharti Aaba Janjatiya Gram Utkarsh Abhiyan (DA JGUA) holistic village transformation.',
    issuedBy: 'Programme Implementation Unit, MoTA',
    date: 'October 2024',
    keyPoints: [
      'Saturation of 63,000 tribal-majority villages across 549 districts',
      'Convergent infrastructure across 17 central ministries',
      'Community ownership through Gram Sabhas'
    ]
  },
  {
    id: 'da-jgua-interventions',
    title: 'DA JGUA MoTA Interventions',
    category: 'Operational',
    pages: 22,
    description: 'Specific sectoral targets, Tribal Marketing development, FRA titling, and linguistic empowerment frameworks under DA JGUA.',
    issuedBy: 'MoTA Strategic Cell',
    date: 'November 2024',
    keyPoints: [
      'Establishment of tribal language translation kiosks',
      'Support for Tribal Research Institutes (TRIs)',
      'Promotion of minor forest produce value addition'
    ]
  }
];

const CATEGORIES = ['All', 'Bhili', 'Regulatory', 'Education', 'Social Welfare', 'Operational'] as const;

export const GuidelinesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [selectedDoc, setSelectedDoc] = useState<GuidelineDoc | null>(null);

  const filteredDocs = GUIDELINE_DOCUMENTS.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
                        doc.description.toLowerCase().includes(search.toLowerCase()) ||
                        doc.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'All' || doc.category === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Section Header (Exact Match to User Screenshot 1) */}
        <div className="w-full flex flex-col items-center text-center space-y-3">
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            Ministry Guidelines
          </h1>

          {/* Underline Bar with Centered Green Accent */}
          <div className="relative w-36 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
          </div>

          <p className="max-w-2xl text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            Official documents, regulations, and procedures for government program
          </p>
        </div>

        {/* 3-Metric Stats Banner (Exact Match to User Screenshot 1) */}
        <div className="rounded-2xl bg-[#f0fdf4] border border-[#dcfce7] p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-emerald-200/80 text-center">
            
            <div className="py-2 md:py-0">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900 block tracking-tight">
                8
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Documents
              </span>
            </div>

            <div className="py-2 md:py-0">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900 block tracking-tight">
                5
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Categories
              </span>
            </div>

            <div className="py-2 md:py-0">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900 block tracking-tight">
                Open
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                Access
              </span>
            </div>

          </div>
        </div>

        {/* Search Bar & Category Filter Pills (Exact Match to User Screenshot 1) */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search guidelines by title or category..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#249144] focus:ring-2 focus:ring-[#249144]/20 shadow-xs transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 hide-scrollbar">
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCat === cat
                    ? 'bg-[#249144] border-[#249144] text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Document Cards Grid (Exact Match to User Screenshots 2 & 4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/90 border-t-4 border-t-[#249144] p-6 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group space-y-5"
            >
              <div className="space-y-4">
                {/* Header with Category Badge & Document Icon */}
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-[#f0fdf4] text-emerald-800 border border-[#dcfce7] rounded-full px-3 py-0.5 text-xs font-semibold">
                    {doc.category}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] text-[#249144] border border-[#dcfce7] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>

                {/* Document Title */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    PDF Document • {doc.pages} pages
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full py-2.5 bg-[#249144] hover:bg-[#1a7536] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                >
                  <span>Open Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocs.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-6">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No matching guidelines found</h3>
            <p className="text-sm text-slate-500 mt-1">Try another search keyword or reset category filter.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCat('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Document Detail Preview Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden space-y-6 animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedDoc(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] text-[#249144] border border-[#dcfce7] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 domine-bold leading-snug">
                    {selectedDoc.title}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-800 bg-[#f0fdf4] px-2.5 py-0.5 rounded-full border border-[#dcfce7] mt-1 inline-block">
                    {selectedDoc.category} • {selectedDoc.pages} Pages
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  {selectedDoc.description}
                </p>

                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Key Policy Highlights:
                  </span>
                  {selectedDoc.keyPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#249144] flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-medium">Issued Authority</span>
                    <span className="font-bold text-slate-800">{selectedDoc.issuedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Release Timeline</span>
                    <span className="font-bold text-slate-800">{selectedDoc.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const text = `# ${selectedDoc.title}\nIssued by: ${selectedDoc.issuedBy}\nDate: ${selectedDoc.date}\nCategory: ${selectedDoc.category}\n\nSummary:\n${selectedDoc.description}\n\nKey Directives:\n${selectedDoc.keyPoints.join('\n- ')}`;
                    const blob = new Blob([text], { type: 'text/plain' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${selectedDoc.title.slice(0, 30)}.txt`;
                    a.click();
                  }}
                  className="px-5 py-2.5 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Guidelines (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
