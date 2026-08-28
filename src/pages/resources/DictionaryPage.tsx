import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  ArrowRight, 
  Search, 
  BookOpen, 
  Volume2, 
  Sparkles, 
  PlusCircle, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink,
  Check,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DICTIONARY_ENTRIES, DICTIONARY_CATEGORIES } from '../../data/dictionaryData';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { playTextSpeech } from '../../services/translationService';

interface DictionaryResource {
  id: string;
  title: string;
  language: string;
  type: string;
  description: string;
  totalPages?: number;
  pdfUrl?: string;
}

const FEATURED_DICTIONARIES: DictionaryResource[] = [
  {
    id: 'hakkipikki-dict',
    title: 'Hakkipikki–Kannada–English Dictionary',
    language: 'Kannada',
    type: 'Digital Resource',
    description: 'Comprehensive trilingual vocabulary and phonetic grammar for the nomadic Hakki Pikki community.',
    totalPages: 320
  },
  {
    id: 'tri-dict',
    title: 'Language Dictionaries TRI',
    language: 'Indigenous',
    type: 'Digital Resource',
    description: 'Official Tribal Research Institute (TRI) comparative lexicon covering central and eastern tribal belts.',
    totalPages: 480
  },
  {
    id: 'tangkhul-dict',
    title: 'Tangkhul Naga Grammar and Dictionary',
    language: 'Tangkhul Naga',
    type: 'Digital Resource',
    description: 'Comprehensive grammar, etymology, and morphological guide for the Tangkhul Naga language.',
    totalPages: 290
  },
  {
    id: 'prakashan-dict',
    title: 'प्रकाशन का विवरण',
    language: 'Hindi',
    type: 'Digital Resource',
    description: 'National publication details, linguistic classification, and state-wise tribal dialect glossaries.',
    totalPages: 164
  }
];

export const DictionaryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedDocModal, setSelectedDocModal] = useState<DictionaryResource | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  
  const [contributeForm, setContributeForm] = useState({
    word: '',
    nativeScript: '',
    language: 'Santali',
    meaningEn: '',
    meaningHi: '',
    example: '',
    contributorName: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCurrentPage(1);
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      setShowContributeModal(false);
      setSubmitted(false);
      setContributeForm({
        word: '',
        nativeScript: '',
        language: 'Santali',
        meaningEn: '',
        meaningHi: '',
        example: '',
        contributorName: ''
      });
    }, 2000);
  };

  // Filter entries efficiently using useMemo
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DICTIONARY_ENTRIES.filter(entry => {
      const matchesSearch = !q ||
        entry.word.toLowerCase().includes(q) ||
        entry.nativeScript.toLowerCase().includes(q) ||
        entry.definitionEn.toLowerCase().includes(q) ||
        entry.definitionHi.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'All Categories' || entry.category === selectedCategory;
      const matchesLang = selectedLanguage === 'All' || entry.language === selectedLanguage;

      return matchesSearch && matchesCategory && matchesLang;
    });
  }, [searchQuery, selectedCategory, selectedLanguage]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage) || 1;
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(start, start + itemsPerPage);
  }, [filteredEntries, currentPage, itemsPerPage]);

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Section Header (Exact Match to User Screenshot 2) */}
        <div className="w-full flex flex-col items-center text-center space-y-3">
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            Dictionary
          </h1>

          {/* Underline Bar with Centered Green Accent */}
          <div className="relative w-36 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
          </div>

          <p className="max-w-2xl text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            Explore our collection of multilingual dictionaries and linguistic resources for indigenous languages
          </p>
        </div>


        {/* Interactive Searchable Lexicon Explorer */}
        <div className="border-t border-slate-200/80 pt-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 domine-bold tracking-tight">
                Searchable Lexicon & Word Bank
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Look up individual tribal words, definitions, and IPA phonetics
              </p>
            </div>

            <button
              onClick={() => setShowContributeModal(true)}
              className="px-4 py-2.5 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 transition active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Contribute Word</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search 6,800+ words/sentences in English, Hindi, or Ol Chiki (e.g. cow, गाय, ᱜᱟᱹᱭ)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#249144] focus:bg-white transition"
                />
              </div>

              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                aria-label="Filter by language"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none hover:border-[#249144] cursor-pointer"
              >
                <option value="All">All Languages</option>
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 hide-scrollbar">
              {DICTIONARY_CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[#249144] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results Count Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>
                Showing <strong className="text-slate-800">{filteredEntries.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>–<strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredEntries.length)}</strong> of <strong className="text-emerald-700">{filteredEntries.length.toLocaleString()}</strong> entries
              </span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>

          {/* Word Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedEntries.map((entry) => {
              const isBookmarked = bookmarks.includes(entry.id);
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg sm:text-xl font-bold text-slate-900">{entry.word}</span>
                          <span className="text-base font-bold text-[#249144]">{entry.nativeScript}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f0fdf4] text-emerald-800 px-2 py-0.5 rounded-full border border-[#dcfce7]">
                            {entry.language}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                          {entry.ipa && <span>{entry.ipa}</span>}
                          {entry.ipa && <span>•</span>}
                          <span className="italic capitalize">{entry.partOfSpeech}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => playTextSpeech(entry.nativeScript || entry.word, entry.languageCode)}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#249144] hover:bg-green-50 transition"
                          title="Listen to native pronunciation"
                          aria-label="Listen to native pronunciation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleBookmark(entry.id)}
                          className={`p-2 rounded-xl transition ${isBookmarked ? 'text-[#249144] bg-green-50' : 'text-slate-400 hover:text-slate-600'}`}
                          title="Bookmark word"
                          aria-label="Bookmark word"
                        >
                          {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
                      <div className="text-slate-800 font-medium flex items-start gap-1 justify-between">
                        <div>
                          <strong className="text-slate-400 uppercase text-[10px] block">English:</strong>
                          {entry.definitionEn}
                        </div>
                        <button
                          onClick={() => playTextSpeech(entry.definitionEn, 'eng')}
                          className="text-slate-300 hover:text-slate-600 p-1"
                          title="Listen to English"
                          aria-label="Listen to English"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-slate-700 font-medium flex items-start gap-1 justify-between">
                        <div>
                          <strong className="text-slate-400 uppercase text-[10px] block">हिन्दी:</strong>
                          {entry.definitionHi}
                        </div>
                        <button
                          onClick={() => playTextSpeech(entry.definitionHi, 'hin')}
                          className="text-slate-300 hover:text-slate-600 p-1"
                          title="Listen to Hindi"
                          aria-label="Listen to Hindi"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {entry.exampleNative && entry.exampleNative !== entry.nativeScript && (
                      <div className="mt-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Usage:</span>
                        <p className="text-xs font-semibold text-emerald-900">{entry.exampleNative}</p>
                        <p className="text-[11px] text-slate-500 italic">{entry.exampleEn}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-600">
                      {entry.category}
                    </span>
                    <button
                      onClick={() => playTextSpeech(entry.nativeScript, 'sat')}
                      className="text-[11px] text-[#249144] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" /> Speak Santali
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                  title="First Page"
                  aria-label="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 px-3"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium px-2">
                  Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
                </span>
                
                {/* Page Jumper */}
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  aria-label="Select page"
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none hover:border-[#249144] cursor-pointer"
                >
                  {Array.from({ length: Math.min(totalPages, 50) }, (_, i) => i + 1).map(p => (
                    <option key={p} value={p}>Page {p}</option>
                  ))}
                  {totalPages > 50 && (
                    <option value={totalPages}>Page {totalPages}</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 px-3"
                  aria-label="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                  title="Last Page"
                  aria-label="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dictionary Preview Modal */}
        {selectedDocModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden space-y-5 animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedDocModal(null)}
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
                    {selectedDocModal.title}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-800 bg-[#f0fdf4] px-2.5 py-0.5 rounded-full border border-[#dcfce7] mt-1 inline-block">
                    {selectedDocModal.language} • {selectedDocModal.type}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  {selectedDocModal.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-medium">Pages / Glossary Count</span>
                    <span className="font-bold text-slate-800">{selectedDocModal.totalPages} Pages</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">License / Publisher</span>
                    <span className="font-bold text-slate-800">Ministry of Tribal Affairs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedDocModal(null)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => alert(`Opening digital edition for ${selectedDocModal.title}`)}
                  className="px-5 py-2.5 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Access Digital Edition</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contribute Word Modal */}
        {showContributeModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
              <button
                onClick={() => setShowContributeModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-[#249144] uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Community Linguist Contribution
              </div>
              <h2 className="text-2xl font-bold text-slate-900 domine-bold mb-4">
                Contribute a Tribal Word
              </h2>

              {submitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-green-100 text-[#249144] flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Thank you for your contribution!</h3>
                  <p className="text-sm text-slate-500">
                    Your word will be verified by our linguistic committee from TRIs and added to the official dictionary.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContributeSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Word (Latin)</label>
                      <input
                        required
                        type="text"
                        value={contributeForm.word}
                        onChange={e => setContributeForm({ ...contributeForm, word: e.target.value })}
                        placeholder="e.g. Hasa"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Native Script</label>
                      <input
                        required
                        type="text"
                        value={contributeForm.nativeScript}
                        onChange={e => setContributeForm({ ...contributeForm, nativeScript: e.target.value })}
                        placeholder="e.g. ᱦᱟᱥᱟ"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
                    <select
                      value={contributeForm.language}
                      onChange={e => setContributeForm({ ...contributeForm, language: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144]"
                    >
                      {SUPPORTED_LANGUAGES.filter(l => l.isTribal).map(l => (
                        <option key={l.id} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meaning (English)</label>
                    <input
                      required
                      type="text"
                      value={contributeForm.meaningEn}
                      onChange={e => setContributeForm({ ...contributeForm, meaningEn: e.target.value })}
                      placeholder="e.g. Soil, mother earth"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meaning (हिन्दी)</label>
                    <input
                      required
                      type="text"
                      value={contributeForm.meaningHi}
                      onChange={e => setContributeForm({ ...contributeForm, meaningHi: e.target.value })}
                      placeholder="e.g. मिट्टी, धरती"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#249144] hover:bg-[#1a7536] text-white text-sm font-semibold rounded-xl shadow-xs transition"
                  >
                    Submit Word for Verification
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
