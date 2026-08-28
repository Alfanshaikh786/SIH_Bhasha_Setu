import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  RotateCw, 
  Volume2, 
  Shuffle, 
  Printer, 
  Download, 
  Award, 
  Sparkles, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Lightbulb, 
  Layers, 
  Trophy,
  Filter,
  RefreshCw,
  PenTool,
  Eraser,
  Undo2,
  Gamepad2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Play,
  Share2,
  Target,
  Star
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { SANTALI_DATASET, SantaliDatasetEntry } from '../../data/santaliDataset';
import { playTextSpeech } from '../../services/translationService';

type TabMode = 'flashcards' | 'worksheets' | 'assessment';
type WorksheetExerciseType = 'matching' | 'tracing' | 'scramble' | 'mcq';

export const LearningStudioPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabMode | null;
  const [activeTab, setActiveTab] = useState<TabMode>(
    tabParam === 'flashcards' || tabParam === 'assessment' || tabParam === 'worksheets' 
      ? tabParam 
      : 'flashcards'
  );

  useEffect(() => {
    if (tabParam === 'flashcards' || tabParam === 'worksheets' || tabParam === 'assessment') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: TabMode) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // ==========================================
  // 1. FLASHCARDS STATE
  // ==========================================
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    SANTALI_DATASET.forEach(item => {
      if (item.cat && item.cat !== 'General') cats.add(item.cat);
    });
    cats.add('Normally Used Words in Classroom');
    return Array.from(cats);
  }, []);

  // Filtered dataset for flashcards
  const flashcardDeck = useMemo(() => {
    if (selectedCategory === 'All') {
      return SANTALI_DATASET.slice(0, 300); // Top 300 rich entries
    }
    return SANTALI_DATASET.filter(item => item.cat === selectedCategory);
  }, [selectedCategory]);

  const currentCard: SantaliDatasetEntry | undefined = flashcardDeck[cardIndex] || flashcardDeck[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex(prev => (prev + 1) % flashcardDeck.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex(prev => (prev - 1 + flashcardDeck.length) % flashcardDeck.length);
  };

  const handleShuffleCards = () => {
    setIsFlipped(false);
    setCardIndex(Math.floor(Math.random() * flashcardDeck.length));
  };

  const handleToggleMastered = (id: string) => {
    setMasteredIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    if (!masteredIds.includes(id)) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }
  };

  // ==========================================
  // 2. REVAMPED INTERACTIVE WORKSHEET STATE
  // ==========================================
  const [worksheetViewMode, setWorksheetViewMode] = useState<'interactive' | 'printable'>('interactive');
  const [worksheetLang, setWorksheetLang] = useState<'eng' | 'hin'>('eng');
  const [worksheetCat, setWorksheetCat] = useState<string>('All');
  const [worksheetCount, setWorksheetCount] = useState<number>(6);
  const [worksheetType, setWorksheetType] = useState<WorksheetExerciseType>('matching');
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [worksheetItems, setWorksheetItems] = useState<SantaliDatasetEntry[]>([]);
  const [shuffledAnswers, setShuffledAnswers] = useState<{ id: string; sat: string; roman: string }[]>([]);

  // Interactive Matching State
  const [selectedColA, setSelectedColA] = useState<string | null>(null);
  const [userMatches, setUserMatches] = useState<Record<string, string>>({}); // { questionId: answerId }

  // Interactive MCQ State
  const [mcqUserAnswers, setMcqUserAnswers] = useState<Record<string, string>>({}); // { questionId: selectedAnswer }

  // Interactive Tracing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tracingIndex, setTracingIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState<string>('#249144');
  const [brushSize, setBrushSize] = useState<number>(6);

  // Interactive Sentence Scramble State
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const [placedTokens, setPlacedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [isScrambleCorrect, setIsScrambleCorrect] = useState<boolean | null>(null);

  // Graded Result Modal State
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradeScore, setGradeScore] = useState<{ score: number; total: number; percent: number; grade: string } | null>(null);

  // Generate new worksheet dataset
  const generateNewWorksheet = () => {
    let pool = SANTALI_DATASET;
    if (worksheetCat !== 'All') {
      pool = SANTALI_DATASET.filter(item => item.cat === worksheetCat);
    }
    if (pool.length < worksheetCount) pool = SANTALI_DATASET;

    // Random sample
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, worksheetCount);
    setWorksheetItems(selected);

    // Shuffled column B
    const answers = selected.map(item => ({ id: item.id, sat: item.sat, roman: item.roman }))
      .sort(() => 0.5 - Math.random());
    setShuffledAnswers(answers);

    // Reset interactive states
    setSelectedColA(null);
    setUserMatches({});
    setMcqUserAnswers({});
    setTracingIndex(0);
    setScrambleIndex(0);
    setGradeScore(null);
  };

  useEffect(() => {
    generateNewWorksheet();
  }, [worksheetCat, worksheetCount, worksheetType, worksheetLang]);

  // Handle Matching Selection
  const handleSelectColA = (id: string) => {
    setSelectedColA(prev => (prev === id ? null : id));
  };

  const handleSelectColB = (ansId: string) => {
    if (!selectedColA) return;
    setUserMatches(prev => ({
      ...prev,
      [selectedColA]: ansId
    }));
    setSelectedColA(null);
  };

  const handleRemoveMatch = (questionId: string) => {
    setUserMatches(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Setup Sentence Scramble for current item
  const currentScrambleItem = worksheetItems[scrambleIndex];
  useEffect(() => {
    if (!currentScrambleItem) return;
    // Split Santali sentence into words
    const rawWords = currentScrambleItem.sat.trim().split(/\s+/).filter(Boolean);
    const shuffled = [...rawWords].sort(() => 0.5 - Math.random());
    setAvailableTokens(shuffled);
    setPlacedTokens([]);
    setIsScrambleCorrect(null);
  }, [scrambleIndex, worksheetItems]);

  const handlePlaceToken = (token: string, index: number) => {
    setPlacedTokens(prev => [...prev, token]);
    setAvailableTokens(prev => prev.filter((_, i) => i !== index));
    setIsScrambleCorrect(null);
  };

  const handleRemovePlacedToken = (token: string, index: number) => {
    setAvailableTokens(prev => [...prev, token]);
    setPlacedTokens(prev => prev.filter((_, i) => i !== index));
    setIsScrambleCorrect(null);
  };

  const handleCheckScramble = () => {
    if (!currentScrambleItem) return;
    const constructed = placedTokens.join(' ').trim();
    const target = currentScrambleItem.sat.trim();
    const correct = constructed === target;
    setIsScrambleCorrect(correct);
    if (correct) {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      playTextSpeech(target, 'sat');
    }
  };

  // Tracing Canvas Logic
  const currentTracingItem = worksheetItems[tracingIndex];
  const redrawCanvasTemplate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw baseline guide grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rect.height / 2);
    ctx.lineTo(rect.width - 20, rect.height / 2);
    ctx.stroke();

    // Draw faint Ol Chiki watermark template
    if (currentTracingItem) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.font = 'bold 54px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentTracingItem.sat, rect.width / 2, rect.height / 2);
    }
  };

  useEffect(() => {
    if (worksheetType === 'tracing' && worksheetViewMode === 'interactive') {
      setTimeout(() => redrawCanvasTemplate(), 50);
    }
  }, [tracingIndex, worksheetType, worksheetViewMode, worksheetItems]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    redrawCanvasTemplate();
  };

  const handleDownloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `santali-calligraphy-${currentTracingItem?.sat || 'trace'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Grade & Submit Worksheet
  const handleGradeWorksheet = () => {
    let score = 0;
    const total = worksheetItems.length;

    if (worksheetType === 'matching') {
      worksheetItems.forEach(item => {
        if (userMatches[item.id] === item.id) score += 1;
      });
    } else if (worksheetType === 'mcq') {
      worksheetItems.forEach(item => {
        if (mcqUserAnswers[item.id] === item.sat) score += 1;
      });
    } else {
      score = total; // Tracing & sentence practice
    }

    const percent = Math.round((score / total) * 100);
    let grade = 'A+ (Excellent)';
    if (percent < 50) grade = 'Needs Practice';
    else if (percent < 80) grade = 'B (Good Effort)';

    setGradeScore({ score, total, percent, grade });
    setGradeModalOpen(true);
    if (percent >= 60) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handlePrintWorksheet = () => {
    window.print();
  };

  // ==========================================
  // 3. ASSESSMENT & QUIZ STATE
  // ==========================================
  interface QuizQuestion {
    id: string;
    question: string;
    targetLang: string;
    options: string[];
    correctAnswer: string;
    pronunciation: string;
    type: 'translate' | 'listening';
  }

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [studentName, setStudentName] = useState('Tribal Language Learner');
  const [showCertificate, setShowCertificate] = useState(false);

  const startNewQuiz = () => {
    const shuffled = [...SANTALI_DATASET].sort(() => 0.5 - Math.random()).slice(0, 10);
    const questions: QuizQuestion[] = shuffled.map((item, idx) => {
      const distractors = SANTALI_DATASET
        .filter(d => d.id !== item.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(d => d.sat);

      const options = [...distractors, item.sat].sort(() => 0.5 - Math.random());
      const isListening = idx % 3 === 0;

      return {
        id: item.id,
        question: isListening 
          ? 'Listen to the spoken audio and choose the matching Ol Chiki phrase:' 
          : `What is the Santali (Ol Chiki) translation for: "${item.en}"?`,
        targetLang: item.en,
        options,
        correctAnswer: item.sat,
        pronunciation: item.roman,
        type: isListening ? 'listening' : 'translate'
      };
    });

    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setShowCertificate(false);
  };

  useEffect(() => {
    startNewQuiz();
  }, []);

  const handleSelectAnswer = (opt: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(opt);
    const currentQ = quizQuestions[currentQuizIndex];
    if (opt === currentQ.correctAnswer) {
      setQuizScore(prev => prev + 1);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ========================================================================= */}
        {/* HEADER                                                                    */}
        {/* ========================================================================= */}
        <div className="text-center space-y-3 print:hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-[#14532d] text-xs font-bold tracking-wide shadow-2xs">
            <GraduationCap className="w-4 h-4 text-[#249144]" />
            <span>Interactive Pedagogy & Tribal Education Suite</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight domine-bold">
            Interactive Learning & Worksheet Studio
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-light">
            Dynamic on-screen interactive activities, digital Ol Chiki calligraphy tracing, live match puzzles, and 1-click printable classroom test sheets.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* TOP TAB SWITCHER (Flashcards, Worksheets, Quiz & Assessment)              */}
        {/* ========================================================================= */}
        <div className="flex justify-center print:hidden">
          <div className="bg-slate-200/80 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 max-w-2xl w-full">
            <button
              onClick={() => handleTabChange('flashcards')}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'flashcards'
                  ? 'bg-white text-[#14532d] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-4 h-4 text-[#249144]" />
              <span>3D Audio Flashcards</span>
            </button>

            <button
              onClick={() => handleTabChange('worksheets')}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'worksheets'
                  ? 'bg-white text-[#14532d] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-4 h-4 text-[#249144]" />
              <span>Worksheet Generator</span>
            </button>

            <button
              onClick={() => handleTabChange('assessment')}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'assessment'
                  ? 'bg-white text-[#14532d] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Target className="w-4 h-4 text-[#249144]" />
              <span>Quiz and Assessment</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: 3D AUDIO FLASHCARDS                                                */}
        {/* ========================================================================= */}
        {activeTab === 'flashcards' && currentCard && (
          <div className="space-y-6 print:hidden">
            {/* Top Toolbar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#249144]" />
                <span className="text-xs font-bold text-slate-700">Topic:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none hover:border-[#249144] cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Stats and Controls */}
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span>Card <strong className="text-slate-900">{cardIndex + 1}</strong> of <strong className="text-slate-900">{flashcardDeck.length}</strong></span>
                </div>
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#249144]" />
                  <span>Mastered: <strong className="text-[#14532d]">{masteredIds.length}</strong></span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#249144] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((cardIndex + 1) / flashcardDeck.length) * 100}%` }}
              />
            </div>

            {/* 3D Interactive Flip Card */}
            <div className="max-w-xl mx-auto py-4">
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer group select-none"
                style={{ perspective: '1000px' }}
              >
                <div 
                  className="relative w-full min-h-[340px] sm:min-h-[380px] rounded-3xl transition-transform duration-500 shadow-xl border border-slate-200/90"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* FRONT SIDE (Ol Chiki + Romanized + Audio) */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 p-8 flex flex-col justify-between items-center text-center backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                        {currentCard.cat || 'Santali / Ol Chiki'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMastered(currentCard.id);
                        }}
                        className={`p-2 rounded-xl border transition ${
                          masteredIds.includes(currentCard.id)
                            ? 'bg-amber-100 border-amber-300 text-amber-700'
                            : 'bg-white/80 border-slate-200 text-slate-400 hover:text-amber-500'
                        }`}
                        title="Mark as Learned"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div className="space-y-4 my-auto">
                      {/* Ol Chiki Main Text */}
                      <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-wide font-sans py-2">
                        {currentCard.sat}
                      </h2>
                      {/* Romanized Phonetic */}
                      <p className="text-sm sm:text-base font-semibold text-[#14532d] bg-green-100/70 border border-green-200 px-4 py-1.5 rounded-full inline-block">
                        🗣️ {currentCard.roman}
                      </p>
                    </div>

                    <div className="w-full flex items-center justify-between pt-4 border-t border-emerald-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTextSpeech(currentCard.sat, 'sat');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Listen Pronunciation</span>
                      </button>

                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Tap to Flip</span>
                      </span>
                    </div>
                  </div>

                  {/* BACK SIDE (English + Hindi Meaning) */}
                  <div 
                    className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 flex flex-col justify-between items-center text-center text-white backface-hidden"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">
                        Meaning & Context
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMastered(currentCard.id);
                        }}
                        className={`p-2 rounded-xl border transition ${
                          masteredIds.includes(currentCard.id)
                            ? 'bg-amber-400/20 border-amber-400 text-amber-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-amber-400'
                        }`}
                        title="Mark as Learned"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div className="space-y-4 my-auto">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">English</span>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white">
                          {currentCard.en}
                        </h3>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-slate-700/60 max-w-xs mx-auto">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Hindi (हिन्दी)</span>
                        <h4 className="text-xl sm:text-2xl font-bold text-emerald-200">
                          {currentCard.hi}
                        </h4>
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-between pt-4 border-t border-slate-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTextSpeech(currentCard.sat, 'sat');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Hear Santali</span>
                      </button>

                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Tap to Flip</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation & Control Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={handlePrevCard}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl border border-slate-200 shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-5 py-2.5 bg-[#249144] hover:bg-[#1a7536] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
                </button>

                <button
                  onClick={handleNextCard}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl border border-slate-200 shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleShuffleCards}
                  className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 shadow-xs transition active:scale-95 cursor-pointer"
                  title="Shuffle Deck"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REVAMPED INTERACTIVE WORKSHEETS & GENERATOR                         */}
        {/* ========================================================================= */}
        {activeTab === 'worksheets' && (
          <div className="space-y-6">
            
            {/* Top Toolbar & Mode Selector */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 domine-bold">
                      Worksheet Studio & Live Activity
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[#14532d] text-[10px] font-bold">
                      Interactive Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Switch between live interactive on-screen solving and printable A4 classroom format.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Mode Switcher: Interactive vs Printable */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                    <button
                      onClick={() => setWorksheetViewMode('interactive')}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                        worksheetViewMode === 'interactive' 
                          ? 'bg-white text-[#14532d] shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-[#249144]" />
                      <span>Live Solve Mode</span>
                    </button>
                    <button
                      onClick={() => setWorksheetViewMode('printable')}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                        worksheetViewMode === 'printable' 
                          ? 'bg-white text-[#14532d] shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#249144]" />
                      <span>Printable A4 Sheet</span>
                    </button>
                  </div>

                  <button
                    onClick={generateNewWorksheet}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="Generate New Question Set"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Shuffle Set</span>
                  </button>

                  <button
                    onClick={handlePrintWorksheet}
                    className="px-4 py-2 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

              {/* Customizer Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Format */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Activity Type</label>
                  <select
                    value={worksheetType}
                    onChange={(e) => setWorksheetType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-[#249144] cursor-pointer"
                  >
                    <option value="matching">🔀 Match the Pairs (Live Connect)</option>
                    <option value="tracing">✍️ Ol Chiki Calligraphy Tracing Pad</option>
                    <option value="scramble">🧩 Sentence Builder & Scramble</option>
                    <option value="mcq">🔘 Multiple Choice Translation</option>
                  </select>
                </div>

                {/* Language Pair */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Language Mode</label>
                  <select
                    value={worksheetLang}
                    onChange={(e) => setWorksheetLang(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-[#249144] cursor-pointer"
                  >
                    <option value="eng">English ↔ Santali</option>
                    <option value="hin">Hindi (हिन्दी) ↔ Santali</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Vocabulary Topic</label>
                  <select
                    value={worksheetCat}
                    onChange={(e) => setWorksheetCat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-[#249144] cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Question Count */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Exercise Length</label>
                  <select
                    value={worksheetCount}
                    onChange={(e) => setWorksheetCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-[#249144] cursor-pointer"
                  >
                    <option value={5}>5 Questions (Quick)</option>
                    <option value={6}>6 Questions (Standard)</option>
                    <option value={8}>8 Questions (Medium)</option>
                    <option value={10}>10 Questions (Comprehensive)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* VIEW A: LIVE INTERACTIVE SOLVE MODE                              */}
            {/* =============================================================== */}
            {worksheetViewMode === 'interactive' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
                
                {/* 1. INTERACTIVE MATCH THE COLUMNS */}
                {worksheetType === 'matching' && (
                  <div className="space-y-6">
                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-[#14532d] flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4 text-[#249144]" />
                          <span>Interactive Match the Pairs</span>
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          1. Click a phrase on the left (Column A). 2. Click its corresponding Santali translation on the right (Column B).
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                          Matched: {Object.keys(userMatches).length} / {worksheetItems.length}
                        </span>
                        <button
                          onClick={() => setUserMatches({})}
                          className="text-xs font-bold text-slate-500 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-white transition"
                        >
                          Reset Matches
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                      {/* Column A */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100">
                          Column A ({worksheetLang === 'eng' ? 'English' : 'हिन्दी'})
                        </span>
                        {worksheetItems.map((item, idx) => {
                          const isSelected = selectedColA === item.id;
                          const matchedAnsId = userMatches[item.id];
                          const isMatched = !!matchedAnsId;

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectColA(item.id)}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                isSelected 
                                  ? 'border-[#249144] bg-emerald-50 shadow-md scale-[1.02]' 
                                  : isMatched
                                  ? 'border-emerald-300 bg-green-50/50'
                                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/70'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-2xs">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    {worksheetLang === 'eng' ? item.en : item.hi}
                                  </p>
                                  {isMatched && (
                                    <p className="text-[11px] text-[#14532d] font-semibold flex items-center gap-1 mt-0.5">
                                      <Check className="w-3 h-3 text-[#249144]" /> Linked
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playTextSpeech(item.sat, 'sat');
                                  }}
                                  className="p-2 rounded-xl bg-white hover:bg-green-50 text-slate-500 hover:text-[#249144] border border-slate-200 shadow-2xs transition"
                                  title="Pronounce"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                {isMatched && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMatch(item.id);
                                    }}
                                    className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 shadow-2xs transition"
                                    title="Unlink"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Column B */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100">
                          Column B (Santali - Ol Chiki)
                        </span>
                        {shuffledAnswers.map((ans, idx) => {
                          const letter = String.fromCharCode(65 + idx);
                          const linkedByQuestion = Object.entries(userMatches).find(([_, aId]) => aId === ans.id);
                          const isLinked = !!linkedByQuestion;

                          return (
                            <div
                              key={ans.id}
                              onClick={() => handleSelectColB(ans.id)}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                isLinked
                                  ? 'border-emerald-400 bg-emerald-50/70 shadow-2xs'
                                  : selectedColA
                                  ? 'border-emerald-200 bg-white hover:bg-emerald-50/40 hover:border-[#249144] animate-pulse'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-[#249144] text-xs font-bold font-mono flex items-center justify-center flex-shrink-0">
                                  {letter}
                                </span>
                                <div>
                                  <p className="text-base font-bold text-[#249144] leading-relaxed">
                                    {ans.sat}
                                  </p>
                                  <p className="text-xs text-slate-400 font-mono italic">
                                    /{ans.roman}/
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTextSpeech(ans.sat, 'sat');
                                }}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-green-50 text-slate-500 hover:text-[#249144] border border-slate-200 shadow-2xs transition"
                                title="Listen to pronunciation"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. INTERACTIVE OL CHIKI TRACING PAD */}
                {worksheetType === 'tracing' && currentTracingItem && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <PenTool className="w-4 h-4 text-[#249144]" />
                          <span>Interactive Ol Chiki Digital Canvas</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Trace the watermark letters with your mouse or touchscreen to master authentic Ol Chiki strokes.
                        </p>
                      </div>
                      
                      {/* Character Switcher */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTracingIndex(prev => (prev - 1 + worksheetItems.length) % worksheetItems.length)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-[#249144] text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Prev
                        </button>
                        <span className="text-xs font-bold text-slate-600 px-2">
                          {tracingIndex + 1} / {worksheetItems.length}
                        </span>
                        <button
                          onClick={() => setTracingIndex(prev => (prev + 1) % worksheetItems.length)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-[#249144] text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Active Word Preview Header */}
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Meaning</span>
                        <h3 className="text-lg font-bold text-slate-900">
                          {worksheetLang === 'eng' ? currentTracingItem.en : currentTracingItem.hi}
                        </h3>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#249144]">Ol Chiki Script</span>
                        <p className="text-2xl font-bold text-[#249144]">
                          {currentTracingItem.sat}
                        </p>
                        <span className="text-xs font-mono text-[#14532d]">/{currentTracingItem.roman}/</span>
                      </div>

                      <button
                        onClick={() => playTextSpeech(currentTracingItem.sat, 'sat')}
                        className="px-4 py-2 bg-white hover:bg-green-50 text-[#14532d] border border-green-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4 text-[#249144]" />
                        <span>Pronounce</span>
                      </button>
                    </div>

                    {/* Canvas & Tools */}
                    <div className="space-y-3">
                      {/* Tool Palette */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100/70 rounded-2xl border border-slate-200">
                        {/* Ink Colors */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">Ink:</span>
                          {[
                            { color: '#249144', label: 'Forest Green' },
                            { color: '#1e40af', label: 'Royal Blue' },
                            { color: '#0f172a', label: 'Deep Black' },
                            { color: '#b91c1c', label: 'Ruby Red' }
                          ].map(c => (
                            <button
                              key={c.color}
                              onClick={() => setBrushColor(c.color)}
                              className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                                brushColor === c.color ? 'scale-110 border-slate-900 shadow-sm' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.label}
                            />
                          ))}
                        </div>

                        {/* Brush Thickness */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-500">Stroke:</span>
                          {[
                            { size: 3, label: 'Fine' },
                            { size: 6, label: 'Medium' },
                            { size: 12, label: 'Calligraphy' }
                          ].map(s => (
                            <button
                              key={s.size}
                              onClick={() => setBrushSize(s.size)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                brushSize === s.size ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleClearCanvas}
                            className="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eraser className="w-3.5 h-3.5" /> Clear
                          </button>
                          <button
                            onClick={handleDownloadCanvas}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Save PNG
                          </button>
                        </div>
                      </div>

                      {/* Canvas Element */}
                      <div className="relative w-full h-72 sm:h-80 bg-white rounded-3xl border-2 border-slate-200 shadow-inner overflow-hidden flex items-center justify-center">
                        <canvas
                          ref={canvasRef}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-full cursor-crosshair touch-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. INTERACTIVE SENTENCE SCRAMBLE */}
                {worksheetType === 'scramble' && currentScrambleItem && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#249144]" />
                          <span>Sentence Builder & Word Jumble</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Reconstruct the correct Santali sentence by tapping the scrambled word tiles below.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setScrambleIndex(prev => (prev - 1 + worksheetItems.length) % worksheetItems.length)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-[#249144] text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Prev
                        </button>
                        <span className="text-xs font-bold text-slate-600 px-2">
                          {scrambleIndex + 1} / {worksheetItems.length}
                        </span>
                        <button
                          onClick={() => setScrambleIndex(prev => (prev + 1) % worksheetItems.length)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-[#249144] text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Target Meaning */}
                    <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 text-center space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meaning in {worksheetLang === 'eng' ? 'English' : 'हिन्दी'}</span>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                        "{worksheetLang === 'eng' ? currentScrambleItem.en : currentScrambleItem.hi}"
                      </h3>
                    </div>

                    {/* Constructed Sentence Area */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Your Sentence Construction:</span>
                      <div className="min-h-20 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-wrap items-center gap-2.5">
                        {placedTokens.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Click the word tiles below to assemble the sentence in order...</span>
                        ) : (
                          placedTokens.map((token, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleRemovePlacedToken(token, idx)}
                              className="px-4 py-2 rounded-xl bg-[#249144] text-white text-sm font-bold shadow-xs hover:bg-[#1a7536] transition flex items-center gap-1.5 animate-in zoom-in-95 cursor-pointer"
                            >
                              <span>{token}</span>
                              <X className="w-3 h-3 text-emerald-200" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Available Word Chips */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Available Word Tiles:</span>
                      <div className="flex flex-wrap gap-2.5">
                        {availableTokens.map((token, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePlaceToken(token, idx)}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#249144] hover:bg-emerald-50 text-slate-800 text-sm font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                          >
                            {token}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {isScrambleCorrect === true && (
                          <span className="text-xs font-bold text-[#14532d] bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-[#249144]" /> Perfect! Pronunciation: /{currentScrambleItem.roman}/
                          </span>
                        )}
                        {isScrambleCorrect === false && (
                          <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                            <X className="w-4 h-4 text-red-500" /> Not quite right. Try rearranging the words!
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCheckScramble}
                          disabled={placedTokens.length === 0}
                          className="px-6 py-2.5 bg-[#249144] hover:bg-[#1a7536] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                        >
                          Check Answer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. INTERACTIVE MCQ */}
                {worksheetType === 'mcq' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#249144]" />
                        <span>Interactive Multiple Choice Assessment</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select the accurate Ol Chiki translation for each question. Click the speaker to hear pronunciation.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {worksheetItems.map((item, idx) => {
                        const selected = mcqUserAnswers[item.id];
                        const distractors = SANTALI_DATASET
                          .filter(d => d.id !== item.id)
                          .slice(0, 3)
                          .map(d => d.sat);
                        const options = [item.sat, ...distractors].sort();

                        return (
                          <div key={item.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900">
                                {idx + 1}. What is the Santali translation for: <em>"{worksheetLang === 'eng' ? item.en : item.hi}"</em>?
                              </span>
                              <button
                                onClick={() => playTextSpeech(item.sat, 'sat')}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#249144] shadow-2xs"
                                title="Listen to Spoken Audio"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {options.map((opt, oIdx) => {
                                const isOptSelected = selected === opt;
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => setMcqUserAnswers(prev => ({ ...prev, [item.id]: opt }))}
                                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition flex items-center gap-2.5 cursor-pointer ${
                                      isOptSelected
                                        ? 'bg-emerald-50 border-[#249144] text-[#14532d] shadow-2xs'
                                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                                    }`}
                                  >
                                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                                      isOptSelected ? 'border-[#249144] bg-[#249144] text-white' : 'border-slate-300 text-slate-500'
                                    }`}>
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bottom Grading Bar */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-[#249144]" />
                    <span>Real-time linguistic feedback active</span>
                  </div>

                  <button
                    onClick={handleGradeWorksheet}
                    className="px-6 py-3 bg-[#249144] hover:bg-[#1a7536] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Submit & Grade Worksheet</span>
                  </button>
                </div>

              </div>
            )}

            {/* =============================================================== */}
            {/* VIEW B: PRINTABLE A4 CLASSROOM TEST PAPER FORMAT                */}
            {/* =============================================================== */}
            {worksheetViewMode === 'printable' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl space-y-8 print:border-none print:shadow-none print:p-4 print:rounded-none max-w-4xl mx-auto">
                
                {/* Official Ministry Header */}
                <div className="border-b-2 border-slate-800 pb-6 space-y-2 text-center">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span>GOVERNMENT OF INDIA</span>
                    <span>MINISTRY OF TRIBAL AFFAIRS</span>
                    <span>BHASHA SETU LINGUISTIC PORTAL</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 domine-bold tracking-tight">
                    Santali Language Classroom Activity Sheet
                  </h1>
                  <p className="text-xs text-slate-600 font-sans">
                    Topic: <strong className="text-slate-900">{worksheetCat}</strong> • Language Pair: <strong className="text-slate-900">{worksheetLang === 'eng' ? 'English - Santali' : 'Hindi - Santali'}</strong>
                  </p>

                  {/* Student Info Lines */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs font-semibold text-slate-700 text-left border-t border-slate-200 mt-4">
                    <div>Student Name: _____________________</div>
                    <div>Class / Roll No: ___________</div>
                    <div>Date: ______________ Score: ____ / {worksheetItems.length}</div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-700">
                  <strong>Instructions:</strong> Match the phrases in Column A with their correct Santali (Ol Chiki) equivalent in Column B by writing the letter in the blank space.
                </div>

                {/* Match Columns Paper Format */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                      Column A ({worksheetLang === 'eng' ? 'English' : 'हिन्दी'})
                    </h4>
                    <div className="space-y-3">
                      {worksheetItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                          <span>{idx + 1}. {worksheetLang === 'eng' ? item.en : item.hi}</span>
                          <span className="font-mono text-slate-400">[ ____ ]</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                      Column B (Santali - Ol Chiki)
                    </h4>
                    <div className="space-y-3">
                      {shuffledAnswers.map((ans, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        return (
                          <div key={ans.id} className="flex items-center justify-between p-3 rounded-xl bg-green-50/50 border border-green-200/80 text-xs font-bold text-slate-900">
                            <span className="text-[#249144] font-mono">{letter}.</span>
                            <span className="text-sm font-semibold">{ans.sat}</span>
                            <span className="text-[11px] text-slate-400 font-mono italic">({ans.roman})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Teacher Answer Key Toggle */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between print:hidden">
                  <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      showAnswerKey ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAnswerKey ? 'Hide Teacher Answer Key' : 'Show Teacher Answer Key'}</span>
                  </button>
                </div>

                {showAnswerKey && (
                  <div className="border-t-2 border-dashed border-amber-400 pt-6 space-y-3 bg-amber-50/60 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span>Teacher Solution Key</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                      {worksheetItems.map((item, idx) => {
                        const matchIdx = shuffledAnswers.findIndex(ans => ans.id === item.id);
                        const letter = matchIdx !== -1 ? String.fromCharCode(65 + matchIdx) : '';
                        return (
                          <div key={item.id} className="p-2 rounded-lg bg-white border border-amber-200 flex justify-between">
                            <span>{idx + 1}. {worksheetLang === 'eng' ? item.en : item.hi}</span>
                            <span className="font-bold text-[#249144]">{letter} ({item.sat})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Performance Grade Celebration Modal */}
            {gradeModalOpen && gradeScore && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#249144] flex items-center justify-center mx-auto shadow-sm">
                    <Trophy className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900 domine-bold">Worksheet Evaluated!</h3>
                    <p className="text-xs text-slate-500">Student linguistic performance report</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                      <p className="text-lg font-extrabold text-[#249144]">{gradeScore.score} / {gradeScore.total}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
                      <p className="text-lg font-extrabold text-slate-800">{gradeScore.percent}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Grade</p>
                      <p className="text-xs font-bold text-emerald-800 mt-1">{gradeScore.grade}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setGradeModalOpen(false)}
                    className="w-full py-3 bg-[#249144] hover:bg-[#1a7536] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
                  >
                    Continue Practicing
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 3D FLASHCARDS                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'flashcards' && (
          <div className="space-y-6">
            
            {/* Category Filter & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#249144]" />
                <span className="text-xs font-bold text-slate-700">Vocabulary Topic:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none hover:border-[#249144] cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <span className="bg-green-50 text-[#14532d] px-3 py-1 rounded-full border border-green-200">
                  Mastered: {masteredIds.length} cards
                </span>
                <span>Card {cardIndex + 1} of {flashcardDeck.length}</span>
              </div>
            </div>

            {/* 3D Flip Flashcard */}
            {currentCard && (
              <div className="max-w-xl mx-auto">
                <div 
                  onClick={() => {
                    setIsFlipped(!isFlipped);
                    if (!isFlipped && autoSpeak) {
                      playTextSpeech(currentCard.sat, 'sat');
                    }
                  }}
                  className="w-full h-80 sm:h-96 rounded-3xl bg-white border-2 border-emerald-100 shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 relative p-8 flex flex-col justify-between group overflow-hidden"
                  style={{ perspective: '1000px' }}
                >
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-100/60 to-transparent rounded-bl-full pointer-events-none"></div>

                  {/* Top card header */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                      {currentCard.cat || 'General'}
                    </span>

                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1 group-hover:text-[#249144]">
                      <RotateCw className="w-3.5 h-3.5" /> Tap to flip
                    </span>
                  </div>

                  {/* Center Text Content */}
                  <div className="text-center space-y-4 my-auto z-10">
                    {!isFlipped ? (
                      /* FRONT SIDE (English / Hindi) */
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">English & Hindi</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                          {currentCard.en}
                        </h2>
                        <p className="text-lg text-slate-600 font-medium">
                          {currentCard.hi}
                        </p>
                      </div>
                    ) : (
                      /* BACK SIDE (Santali Ol Chiki & Pronunciation) */
                      <div className="space-y-3 animate-in zoom-in-95 duration-200">
                        <span className="text-xs font-bold text-[#249144] uppercase tracking-widest block">Santali (Ol Chiki)</span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-[#249144] leading-relaxed">
                          {currentCard.sat}
                        </h2>
                        <div className="inline-block bg-green-50 px-4 py-1.5 rounded-2xl border border-green-200">
                          <p className="text-sm font-bold text-[#14532d] font-mono">
                            /{currentCard.roman}/
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom card footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playTextSpeech(isFlipped ? currentCard.sat : currentCard.en, isFlipped ? 'sat' : 'eng');
                      }}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-green-50 text-slate-600 hover:text-[#249144] border border-slate-200 transition shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isFlipped ? 'Pronounce Santali' : 'Speak'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMastered(currentCard.id);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        masteredIds.includes(currentCard.id)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{masteredIds.includes(currentCard.id) ? 'Mastered!' : 'Mark Mastered'}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 mt-6">
                  <button
                    onClick={handlePrevCard}
                    className="px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-[#249144] font-bold text-xs sm:text-sm text-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <button
                    onClick={handleShuffleCards}
                    className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-[#249144] font-bold text-xs text-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Shuffle Cards"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleNextCard}
                    className="px-6 py-3 rounded-2xl bg-[#249144] hover:bg-[#1a7536] text-white shadow-md font-bold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    Next Card <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: QUIZ & ASSESSMENT                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'assessment' && (
          <div className="max-w-2xl mx-auto space-y-6 print:hidden">
            {!quizFinished ? (
              /* ACTIVE QUIZ SCREEN */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
                
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Question {currentQuizIndex + 1} of {quizQuestions.length}</span>
                    <span className="text-[#249144]">Score: {quizScore} / {currentQuizIndex}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-[#249144] transition-all duration-300 rounded-full"
                      style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Question Card */}
                {quizQuestions[currentQuizIndex] && (() => {
                  const qItem = quizQuestions[currentQuizIndex];
                  return (
                    <div className="space-y-5">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#249144]">
                          <HelpCircle className="w-4 h-4" />
                          <span>{qItem.type === 'listening' ? 'Listening Comprehension' : 'Translation Challenge'}</span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug text-center">
                          {qItem.question}
                        </h3>

                        {/* Pronunciation Audio Button */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => playTextSpeech(qItem.correctAnswer, 'sat')}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-green-50 text-[#249144] border border-green-200 text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>Listen to Spoken Audio</span>
                          </button>
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="grid gap-3">
                        {qItem.options.map((option, idx) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrect = option === qItem.correctAnswer;
                          const showResult = selectedAnswer !== null;

                          let style = 'bg-white border-slate-200 hover:border-[#249144] text-slate-800';
                          if (showResult) {
                            if (isCorrect) style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                            else if (isSelected) style = 'bg-red-50 border-red-500 text-red-900 font-bold';
                          }

                          return (
                            <button
                              key={idx}
                              disabled={selectedAnswer !== null}
                              onClick={() => handleSelectAnswer(option)}
                              className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition flex items-center justify-between cursor-pointer ${style}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span>{option}</span>
                              </div>

                              {showResult && isCorrect && <Check className="w-5 h-5 text-emerald-600" />}
                              {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-red-500" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Question CTA */}
                      {selectedAnswer !== null && (
                        <div className="flex justify-end pt-2 animate-in fade-in duration-150">
                          <button
                            onClick={handleNextQuizQuestion}
                            className="px-6 py-3 rounded-2xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                          >
                            <span>{currentQuizIndex < quizQuestions.length - 1 ? 'Next Question' : 'Complete Assessment'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            ) : (
              /* QUIZ RESULT SCREEN */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#249144] flex items-center justify-center mx-auto shadow-sm">
                  <Trophy className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 domine-bold">
                    Assessment Completed!
                  </h2>
                  <p className="text-slate-600 text-sm">
                    You scored <strong className="text-[#249144] font-bold">{quizScore}</strong> out of <strong className="text-slate-900">{quizQuestions.length}</strong> ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                  </p>
                </div>

                {/* Score badge summary */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Proficiency Level</p>
                  <p className="text-lg font-bold text-[#14532d]">
                    {quizScore >= 8 ? '🌟 Tribal Language Scholar' : quizScore >= 5 ? '🌿 Intermediate Learner' : '🌱 Beginner Explorer'}
                  </p>
                </div>

                {/* Certificate Generator Input */}
                <div className="space-y-3 max-w-md mx-auto">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Enter your name for Certificate:</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full text-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none hover:border-[#249144]"
                    placeholder="Enter Student Name"
                  />
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setShowCertificate(!showCertificate)}
                      className="px-6 py-2.5 bg-[#249144] hover:bg-[#1a7536] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>{showCertificate ? 'Hide Certificate' : 'Generate Certificate'}</span>
                    </button>

                    <button
                      onClick={startNewQuiz}
                      className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </div>

                {/* Printable Certificate */}
                {showCertificate && (
                  <div className="mt-8 p-8 sm:p-12 rounded-3xl border-4 border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-green-50/40 text-center space-y-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-amber-100 pb-3">
                      <span>MINISTRY OF TRIBAL AFFAIRS</span>
                      <span>BHASHA SETU CERTIFICATION</span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 domine-bold">
                        Certificate of Linguistic Achievement
                      </h3>
                      <p className="text-xs text-slate-500">This officially certifies that</p>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#249144] py-2 border-b-2 border-dashed border-emerald-300 max-w-xs mx-auto">
                        {studentName}
                      </h2>
                      <p className="text-xs text-slate-600 max-w-md mx-auto pt-2">
                        has successfully completed the Santali Tribal Language Assessment with an accuracy score of <strong>{Math.round((quizScore / quizQuestions.length) * 100)}%</strong>.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-amber-100 text-xs font-semibold text-slate-500">
                      <div>Date: {new Date().toLocaleDateString()}</div>
                      <div>Verified by Bhasha Setu Portal</div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
