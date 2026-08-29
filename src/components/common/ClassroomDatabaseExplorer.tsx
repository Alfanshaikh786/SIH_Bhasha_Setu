import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Volume2, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Check, 
  Copy,
  Layers,
  ChevronRight,
  WifiOff
} from 'lucide-react';
import { 
  searchClassroomSentences, 
  getClassroomCategories, 
  getSqliteStats, 
  TranslationRow 
} from '../../services/sqliteService';
import { playTextSpeech } from '../../services/translationService';

interface Props {
  onSelectSentence?: (englishText: string, targetTranslation: string) => void;
}

export const ClassroomDatabaseExplorer: React.FC<Props> = ({ onSelectSentence }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [results, setResults] = useState<TranslationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [dbStats, setDbStats] = useState(getSqliteStats());

  // Load categories and initial rows on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      const cats = await getClassroomCategories();
      const initialRows = await searchClassroomSentences('', 'All', 15);
      if (isMounted) {
        setCategories(cats);
        setResults(initialRows);
        setDbStats(getSqliteStats());
        setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Filter rows when search term or category changes
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const rows = await searchClassroomSentences(searchTerm, selectedCategory, 25);
      if (isMounted) {
        setResults(rows);
        setDbStats(getSqliteStats());
        setIsLoading(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedCategory]);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Top Banner & Offline DB Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-[#14532d]">
              <Database className="w-5 h-5 text-[#249144]" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                Local SQLite Classroom Database
                <span className="text-[11px] font-bold bg-emerald-50 text-[#14532d] border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="w-3 h-3 text-[#249144]" /> 100% Offline Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-light">
                Indexed from <strong className="font-semibold text-slate-700">Santhali-Words.csv</strong> • {dbStats.totalRows || '6,780'} verified bilingual classroom sentences
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-[#249144]" />
          <span>SQLite WASM (translations.db)</span>
        </div>
      </div>

      {/* Search Toolbar & Category Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search classroom sentence in English, Hindi, or Santali (e.g. 'homework', 'cow', 'book')..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#249144] focus:ring-2 focus:ring-[#249144]/15 transition"
          />
        </div>

        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter classroom sentences by category"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] transition cursor-pointer"
          >
            <option value="All">All Categories ({dbStats.totalRows || '6,780'})</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sentences List / Grid */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
            <Database className="w-6 h-6 animate-pulse text-[#249144]" />
            <span>Querying local SQLite database...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No matching sentence found in the SQLite database for "{searchTerm}".
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {results.map((row) => (
              <div 
                key={row.id}
                className="bg-slate-50/70 hover:bg-emerald-50/40 border border-slate-200/80 hover:border-[#249144]/60 rounded-2xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      #{row.id}
                    </span>
                    <span className="text-[10px] font-bold text-[#14532d] bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {row.category || 'Classroom'}
                    </span>
                  </div>

                  {/* English & Hindi */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-bold text-slate-900">{row.english}</span>
                    <span className="text-xs text-slate-500 font-medium">({row.hindi})</span>
                  </div>

                  {/* Santali Ol Chiki & Roman */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="text-sm font-bold text-[#14532d] font-sans">
                      {row.santali}
                    </span>
                    {row.santali_roman && (
                      <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono text-[11px]">
                        🗣️ {row.santali_roman}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  <button
                    onClick={() => playTextSpeech(row.santali, 'sat')}
                    className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#249144] border border-slate-200 shadow-2xs transition cursor-pointer"
                    title="Listen Santali Pronunciation"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleCopy(`${row.english} -> ${row.santali}`, row.id)}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition cursor-pointer"
                    title="Copy Translation"
                  >
                    {copiedId === row.id ? <Check className="w-3.5 h-3.5 text-[#249144]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {onSelectSentence && (
                    <button
                      onClick={() => onSelectSentence(row.english, row.santali)}
                      className="px-3 py-1.5 bg-[#249144] hover:bg-[#1a7536] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>Translate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
