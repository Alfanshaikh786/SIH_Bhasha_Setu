import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  X, 
  Download, 
  ShieldCheck, 
  BookOpen, 
  Trash2,
  Check,
  Send
} from 'lucide-react';
import { 
  HumanEvaluationReview, 
  ReviewClassification, 
  ReviewNuance, 
  getStoredHumanEvaluations, 
  saveHumanEvaluation, 
  updateHumanEvaluationStatus, 
  deleteHumanEvaluation, 
  exportHumanEvaluationsJson 
} from '../../services/feedbackService';

interface HumanEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSourceText?: string;
  initialTargetText?: string;
  sourceLang?: string;
  targetLang?: string;
  category?: string;
}

export const HumanEvaluationModal: React.FC<HumanEvaluationModalProps> = ({
  isOpen,
  onClose,
  initialSourceText = 'I am going to school.',
  initialTargetText = 'ᱤᱧ ᱟᱥᱲᱟ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ ᱾',
  sourceLang = 'English',
  targetLang = 'Santali',
  category = 'Education'
}) => {
  const [sourceText, setSourceText] = useState(initialSourceText);
  const [targetText, setTargetText] = useState(initialTargetText);
  const [reviewerName, setReviewerName] = useState('Native Speaker Reviewer');
  const [classification, setClassification] = useState<ReviewClassification>('CORRECT');
  const [nuance, setNuance] = useState<ReviewNuance>('STANDARD');
  const [notes, setNotes] = useState('');
  const [evaluations, setEvaluations] = useState<HumanEvaluationReview[]>([]);
  const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSourceText(initialSourceText);
      setTargetText(initialTargetText);
      setEvaluations(getStoredHumanEvaluations());
    }
  }, [isOpen, initialSourceText, initialTargetText]);

  if (!isOpen) return null;

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim() || !targetText.trim()) return;

    saveHumanEvaluation({
      sourceText,
      targetText,
      sourceLang,
      targetLang,
      category,
      classification,
      nuance,
      reviewer: reviewerName,
      notes
    });

    setSubmitSuccess(true);
    setEvaluations(getStoredHumanEvaluations());
    setTimeout(() => {
      setSubmitSuccess(false);
      setNotes('');
    }, 1500);
  };

  const handleExport = () => {
    const jsonStr = exportHumanEvaluationsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BhashaSetu_Human_Evaluation_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-2xl w-full max-h-[92vh] flex flex-col space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Human Linguistic Evaluation</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Linguist Review
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Native speaker arbitration workflow • Changes remain pending_review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'review'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Review Translation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Review Log</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white text-purple-700 text-[10px] font-bold">
              {evaluations.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Submit Review */}
        {activeTab === 'review' ? (
          <form onSubmit={handleSubmitEvaluation} className="overflow-y-auto space-y-4 pr-1 text-xs">
            
            {/* Bilingual Display Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>{sourceLang} Source ({category}):</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200">Pending Evaluation</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{sourceText}</p>
              
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-500 font-semibold block">{targetLang} Translation:</span>
                <p className="text-base font-bold text-slate-950 mt-0.5">{targetText}</p>
              </div>
            </div>

            {/* Classification Buttons (Part 4 Requirements) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block text-xs">
                Linguistic Correctness Classification:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                <button
                  type="button"
                  onClick={() => setClassification('CORRECT')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    classification === 'CORRECT'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>CORRECT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClassification('PARTIALLY_CORRECT')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    classification === 'PARTIALLY_CORRECT'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>PARTIALLY</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClassification('INCORRECT')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    classification === 'INCORRECT'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>INCORRECT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClassification('UNSURE')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    classification === 'UNSURE'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>UNSURE</span>
                </button>

              </div>
            </div>

            {/* Linguistic Nuance Tags */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block text-xs">
                Dialectal & Nuance Context:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'STANDARD', label: 'Standard Form' },
                  { id: 'DIALECT_DIFFERENCE', label: 'Dialect Difference' },
                  { id: 'ALTERNATIVE_VALID', label: 'Alternative Valid' },
                  { id: 'CONTEXT_DIFFERENCE', label: 'Context Difference' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNuance(item.id as ReviewNuance)}
                    className={`px-2 py-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer text-center ${
                      nuance === item.id
                        ? 'bg-purple-100 border-purple-400 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviewer Details & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reviewer Name / Organization:</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                  placeholder="e.g. Dr. Murmu (Santali Academy)"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Linguistic Field Notes (Optional):</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                  placeholder="e.g. Mayurbhanj Northern variant observed"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Stored locally under strict <code>pending_review</code> status
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                {submitSuccess ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{submitSuccess ? 'Evaluation Logged!' : 'Log Evaluation'}</span>
              </button>
            </div>

          </form>
        ) : (
          /* Tab 2: Review Log & Lifecycle */
          <div className="overflow-y-auto space-y-3 pr-1 text-xs">
            {evaluations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No human evaluations logged yet. Review a translation to add to the log.
              </div>
            ) : (
              evaluations.map((ev) => (
                <div key={ev.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        ev.classification === 'CORRECT' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        ev.classification === 'PARTIALLY_CORRECT' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        ev.classification === 'INCORRECT' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {ev.classification}
                      </span>
                      {ev.nuance && ev.nuance !== 'STANDARD' && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-semibold">
                          {ev.nuance}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        ev.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        ev.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ev.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-[11px]">
                    <span className="text-slate-500 font-medium">"{ev.sourceText}"</span>
                    <span className="text-slate-400 mx-1.5">→</span>
                    <span className="text-slate-900 font-bold">{ev.targetText}</span>
                  </div>

                  {ev.notes && (
                    <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-100">
                      Notes: {ev.notes} ({ev.reviewer})
                    </p>
                  )}

                  {/* Lifecycle Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          updateHumanEvaluationStatus(ev.id, 'approved');
                          setEvaluations(getStoredHumanEvaluations());
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition ${
                          ev.status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => {
                          updateHumanEvaluationStatus(ev.id, 'rejected');
                          setEvaluations(getStoredHumanEvaluations());
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition ${
                          ev.status === 'rejected' ? 'bg-rose-600 text-white' : 'bg-white border border-rose-300 text-rose-800 hover:bg-rose-50'
                        }`}
                      >
                        ✗ Reject
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        deleteHumanEvaluation(ev.id);
                        setEvaluations(getStoredHumanEvaluations());
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={handleExport}
            disabled={evaluations.length === 0}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Export Linguist JSON</span>
          </button>
          <button
            onClick={onClose}
            className="btn-mota px-5 py-1.5 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
