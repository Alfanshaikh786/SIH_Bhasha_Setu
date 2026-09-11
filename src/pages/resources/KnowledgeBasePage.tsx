import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Volume2, 
  Copy, 
  Check, 
  Sparkles, 
  Filter, 
  Layers, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  KNOWLEDGE_CATEGORIES, 
  KnowledgeCategory, 
  queryKnowledgeBase, 
  KnowledgePhrase 
} from '../../data/knowledgeBaseData';
import { playTextSpeech } from '../../services/translationService';

export const KnowledgeBasePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 16;

  const { items, total } = useMemo(() => {
    return queryKnowledgeBase({
      category: selectedCategory,
      keyword: searchQuery,
      page: currentPage,
      pageSize
    });
  }, [selectedCategory, searchQuery, currentPage]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#14532d] text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#249144]" />
              <span>Verified Language Knowledge Base</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Verified Tribal Lexicon & Phrases
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Explore 6,780 parallel verified records categorized across 12 educational and field domains.
            </p>
          </div>

          <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span><strong>{total.toLocaleString()}</strong> Phrases Available</span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by English, Hindi, Ol Chiki script, or Roman phonetic..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#249144] transition"
              />
            </div>

            {/* Category Select on mobile */}
            <div className="sm:hidden">
              <select
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none"
              >
                {KNOWLEDGE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Category Filter Pills */}
          <div className="hidden sm:flex flex-wrap gap-1.5 pt-1">
            {KNOWLEDGE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#249144] text-white shadow-xs font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Knowledge Phrase Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-[#249144]/60 transition-all space-y-3 group"
            >
              {/* Category & Status tag */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {p.category}
                </span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#249144]" /> 100% Verified
                </span>
              </div>

              {/* Santali Ol Chiki Script & Audio */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xl font-bold text-slate-900 leading-snug font-sans">
                    {p.sat}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => playTextSpeech(p.sat, 'sat')}
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-[#249144] border border-slate-200 transition cursor-pointer"
                      title="Listen Santali audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(p.sat, `${p.id}-sat`)}
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition cursor-pointer"
                      title="Copy Ol Chiki text"
                    >
                      {copiedId === `${p.id}-sat` ? <Check className="w-4 h-4 text-[#249144]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic font-mono">
                  Phonetic: {p.roman}
                </p>
              </div>

              {/* Parallel Hindi & English Translations */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <p className="font-semibold text-slate-800">
                  <strong className="text-slate-400 font-normal uppercase text-[10px] block">Hindi:</strong>
                  {p.hi}
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-400 font-normal uppercase text-[10px] block">English:</strong>
                  {p.en}
                </p>
              </div>

              {p.notes && (
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Context: {p.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No verified phrases matched your search.</p>
            <p className="text-slate-400">Try searching for keywords like "hospital", "book", "water", or "school".</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200 text-xs text-slate-600">
            <span>Page {currentPage} of {totalPages} ({total} entries)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
