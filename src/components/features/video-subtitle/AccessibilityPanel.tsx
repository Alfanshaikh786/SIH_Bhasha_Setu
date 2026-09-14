/**
 * Accessibility Panel Component
 * Compact automated accessibility preview inspecting safe title area,
 * typography contrast, line-limits, script font coverage, and reading pace.
 */

import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sliders, 
  HelpCircle 
} from 'lucide-react';
import { StudioCue, SubtitleStyleConfig } from './types';
import { evaluateAccessibility } from './subtitleUtils';

interface AccessibilityPanelProps {
  cues: StudioCue[];
  styleConfig: SubtitleStyleConfig;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  cues,
  styleConfig
}) => {
  const audit = evaluateAccessibility(cues, styleConfig);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4 text-slate-800">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            audit.overallCompliant ? 'bg-emerald-50 text-[#14532d]' : 'bg-amber-50 text-amber-700'
          }`}>
            <ShieldCheck className="w-4 h-4 text-[#249144]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Accessibility & Readability Audit</h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Automated studio checks • Overall Score: {audit.score}/100
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          audit.overallCompliant 
            ? 'bg-emerald-50 text-[#14532d] border border-emerald-200' 
            : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {audit.overallCompliant ? 'Compliant' : 'Advisories Present'}
        </span>
      </div>

      {/* Checks list */}
      <div className="space-y-2">
        {audit.checks.map((chk) => (
          <div
            key={chk.id}
            className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
              chk.passed
                ? 'bg-slate-50/60 border-slate-200/80 text-slate-800'
                : 'bg-amber-50/50 border-amber-200/80 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {chk.passed ? (
                <CheckCircle2 className="w-4 h-4 text-[#249144] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold">{chk.label}</span>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  {chk.detail}
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
              chk.passed 
                ? 'bg-slate-200/60 text-slate-700' 
                : 'bg-amber-200/70 text-amber-900 font-bold'
            }`}>
              {chk.passed ? 'PASS' : 'ADVISORY'}
            </span>
          </div>
        ))}
      </div>

      {/* Standard Disclaimer Notice */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500 text-[11px] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          <span className="font-semibold text-slate-700">Standards Notice: </span>
          Checks reflect studio heuristics for video safe margins, color contrast, and subtitle line limits. Does not certify formal external accessibility standard compliance.
        </p>
      </div>

    </div>
  );
};
