import React, { useMemo } from 'react';
import { Sparkles, X, ArrowRight, ShieldCheck, Check, BookOpen, Layers } from 'lucide-react';
import { getVerifiedDemoScenarios, DemoScenario } from '../../data/demoScenarios';
import { SupportedLanguage } from '../../services/languageService';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
  onSelectMundariHonestyDemo: () => void;
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  onSelectMundariHonestyDemo
}) => {
  const verifiedScenarios = useMemo(() => getVerifiedDemoScenarios(), []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-green-50 text-[#249144] border border-[#d1ead4]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                SIH 60-Second Demo Showcase
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Verified Dataset
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                1-click demonstration scenarios backed by 6,780 parallel Santali entries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Scenarios List */}
        <div className="overflow-y-auto space-y-3 pr-1 text-xs">
          
          <p className="text-slate-600 text-xs">
            Select any scenario below to instantly execute a verified translation with full linguistic provenance and offline execution:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {verifiedScenarios.map((sc) => (
              <div
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-green-50/70 border border-slate-200 hover:border-[#249144] transition cursor-pointer flex flex-col justify-between group shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{sc.icon}</span> {sc.categoryLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[9px] font-mono font-bold">
                      {sc.datasetId}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    "{sc.sourceText}"
                  </p>
                  <p className="text-xs text-emerald-800 font-medium font-sans">
                    {sc.expectedSantali}
                  </p>
                  <p className="text-[10px] text-slate-500 italic">
                    {sc.contextNotes}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-[#249144] font-bold">
                  <span>100% Offline Ready</span>
                  <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Run Scenario <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Mundari / Ho Linguistic Honesty Showcase Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-amber-900 text-xs">
                  Zero-Hallucination Demo (Mundari / Ho Future Readiness)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 text-[10px] font-bold">
                Linguistic Honesty
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Show how Bhasha Setu truthfully informs users that Mundari and Ho full-sentence models are in active architecture preparation, offering only verified dictionary assistance instead of fabricating translations.
            </p>
            <button
              onClick={onSelectMundariHonestyDemo}
              className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Demonstrate Mundari Zero-Hallucination Guard</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-[10px] text-slate-400">
            Powered by 6,780 parallel sentence entries
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
