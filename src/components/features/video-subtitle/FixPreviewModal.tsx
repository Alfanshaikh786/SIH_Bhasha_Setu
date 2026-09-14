/**
 * Smart Fix Preview Modal Component
 * Displays transparent preview of all deterministic non-linguistic corrections
 * before they are applied, with clear non-fabrication disclaimers.
 */

import React from 'react';
import { 
  Wand2, 
  Check, 
  X, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Layers, 
  AlignLeft,
  Info
} from 'lucide-react';
import { SafeCorrection } from './types';

interface FixPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  safeCorrections: SafeCorrection[];
  onApplyFixes: () => void;
}

export const FixPreviewModal: React.FC<FixPreviewModalProps> = ({
  isOpen,
  onClose,
  safeCorrections,
  onApplyFixes
}) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: SafeCorrection['type']) => {
    switch (type) {
      case 'overlap_fix':
      case 'boundary_clamp':
      case 'timing_order':
        return <Clock className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'line_wrap':
        return <AlignLeft className="w-4 h-4 text-emerald-600 shrink-0" />;
      default:
        return <Wand2 className="w-4 h-4 text-[#249144] shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-100 text-[#14532d] flex items-center justify-center shadow-xs">
              <Wand2 className="w-5 h-5 text-[#249144]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Smart Corrections Preview
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                {safeCorrections.length} safe deterministic adjustments detected.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ethical Non-Fabrication Disclaimer */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100/80 text-emerald-900 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#249144] shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed font-sans">
            <span className="font-bold">Linguistic Integrity Guarantee:</span>
            <p className="text-emerald-800 text-[11px]">
              Only timing boundaries, overlap offsets, and line-lengths will be adjusted. 
              <strong> Zero translations or tribal phrases will be altered.</strong> All applied corrections can be undone with <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">Ctrl+Z</code>.
            </p>
          </div>
        </div>

        {/* Corrections List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {safeCorrections.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Check className="w-8 h-8 text-[#249144] mx-auto mb-2" />
              <p className="font-bold text-slate-800">Zero Safe Corrections Needed</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                All subtitle cues currently satisfy temporal and formatting invariants.
              </p>
            </div>
          ) : (
            safeCorrections.map((corr, idx) => (
              <div
                key={corr.id || idx}
                className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-1.5 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(corr.type)}
                    <span>{corr.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-slate-200 text-slate-700">
                    #{corr.cueIndex}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 font-sans leading-snug pl-6">
                  {corr.description}
                </p>

                {(corr.beforeValue || corr.afterValue) && (
                  <div className="pl-6 flex items-center gap-2 text-[11px] font-mono text-slate-500 pt-0.5">
                    <span className="line-through text-slate-400">{corr.beforeValue}</span>
                    <ArrowRight className="w-3 h-3 text-[#249144]" />
                    <span className="font-bold text-emerald-700">{corr.afterValue}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={safeCorrections.length === 0}
            onClick={() => {
              onApplyFixes();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md ${
              safeCorrections.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#249144] hover:bg-[#1a7536] text-white cursor-pointer active:scale-98'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Apply {safeCorrections.length} Safe Corrections</span>
          </button>
        </div>
      </div>
    </div>
  );
};
