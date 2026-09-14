/**
 * Subtitle Health & Review Queue Component
 * Displays real-time quality validation checklist, computed quality score breakdown,
 * 4-level severity review queue, "Fix Safe Issues" trigger, and bulk review approval.
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  Wand2,
  Check,
  Filter,
  Info
} from 'lucide-react';
import { StudioValidationReport, StudioQualityScore, ReviewIssue, ReviewSeverity } from './types';
import { formatSecondsToTimecode } from './subtitleUtils';

interface SubtitleHealthPanelProps {
  report: StudioValidationReport;
  qualityScore: StudioQualityScore;
  onSelectIssue: (cueId: string, timeSec: number) => void;
  onOpenFixPreview?: () => void;
  onMarkHighConfidenceReviewed?: () => void;
  eligibleHighConfidenceCount?: number;
}

export const SubtitleHealthPanel: React.FC<SubtitleHealthPanelProps> = ({
  report,
  qualityScore,
  onSelectIssue,
  onOpenFixPreview,
  onMarkHighConfidenceReviewed,
  eligibleHighConfidenceCount = 0
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | ReviewSeverity>('all');

  const filteredIssues = report.issues.filter(issue => {
    if (severityFilter === 'all') return true;
    return issue.severity === severityFilter;
  });

  const getRatingBadge = (rating: StudioQualityScore['rating']) => {
    switch (rating) {
      case 'Excellent':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Good':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Needs Review':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Critical Issues':
        return 'bg-red-100 text-red-900 border-red-300';
    }
  };

  const getSeverityIcon = (sev: ReviewSeverity) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;
    }
  };

  const getSeverityBadgeClass = (sev: ReviewSeverity) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-5">
      
      {/* Top Row: Title, Actions & Quality Score */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#249144]" />
            Subtitle Health & Quality Review
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Automated verification across {report.segmentsChecked} cues • {report.criticalErrors.length} critical • {report.warnings.length} warnings
          </p>
        </div>

        {/* Action Controls & Quality Score */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Fix Safe Issues Button */}
          {report.safeFixesAvailableCount > 0 && onOpenFixPreview && (
            <button
              type="button"
              onClick={onOpenFixPreview}
              className="px-3.5 py-2 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-98"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Fix {report.safeFixesAvailableCount} Safe Issues</span>
            </button>
          )}

          {/* Bulk Approve High Confidence */}
          {eligibleHighConfidenceCount > 0 && onMarkHighConfidenceReviewed && (
            <button
              type="button"
              onClick={onMarkHighConfidenceReviewed}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-[#249144]" />
              <span>Approve {eligibleHighConfidenceCount} High Conf</span>
            </button>
          )}

          {/* Quality Score Badge */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 px-3.5 shadow-2xs">
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                Quality Score
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-slate-900">
                  {qualityScore.score}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 100</span>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRatingBadge(qualityScore.rating)}`}>
              {qualityScore.rating}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Progress Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Timing */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span>Timing Sync</span>
            <span className="font-mono font-bold">{qualityScore.breakdown.timing}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full" 
              style={{ width: `${qualityScore.breakdown.timing}%` }} 
            />
          </div>
        </div>

        {/* Readability */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span>Readability</span>
            <span className="font-mono font-bold">{qualityScore.breakdown.readability}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full" 
              style={{ width: `${qualityScore.breakdown.readability}%` }} 
            />
          </div>
        </div>

        {/* Recognition */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span>Recognition</span>
            <span className="font-mono font-bold">{qualityScore.breakdown.recognition}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#249144] rounded-full" 
              style={{ width: `${qualityScore.breakdown.recognition}%` }} 
            />
          </div>
        </div>

        {/* Translation */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span>Translation</span>
            <span className="font-mono font-bold">{qualityScore.breakdown.translation}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-600 rounded-full" 
              style={{ width: `${qualityScore.breakdown.translation}%` }} 
            />
          </div>
        </div>

        {/* Unicode */}
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
            <span>Unicode</span>
            <span className="font-mono font-bold">{qualityScore.breakdown.unicode}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-600 rounded-full" 
              style={{ width: `${qualityScore.breakdown.unicode}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Checklist on Left, Review Queue on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        
        {/* Automated Validation Checklist */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Automated Quality Invariants:
          </h4>

          <div className="space-y-2">
            {report.checks.map((chk) => (
              <div
                key={chk.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  chk.passed
                    ? 'bg-green-50/50 border-green-200 text-green-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#249144] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{chk.label}</span>
                </div>

                {chk.detail && (
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                    {chk.detail}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4-Level Severity Review Queue */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Review Queue ({report.issues.length} items):
            </h4>

            {/* Severity Filter Chips */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setSeverityFilter('all')}
                className={`px-2 py-0.5 rounded-md transition ${
                  severityFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                All ({report.issues.length})
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter('critical')}
                className={`px-2 py-0.5 rounded-md transition ${
                  severityFilter === 'critical' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                Crit ({report.criticalErrors.length})
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter('error')}
                className={`px-2 py-0.5 rounded-md transition ${
                  severityFilter === 'error' ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                Err ({report.errors.length})
              </button>
              <button
                type="button"
                onClick={() => setSeverityFilter('warning')}
                className={`px-2 py-0.5 rounded-md transition ${
                  severityFilter === 'warning' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                Warn ({report.warnings.length})
              </button>
            </div>
          </div>

          <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
            {filteredIssues.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 text-[#249144] mx-auto mb-1.5" />
                <p className="font-bold text-slate-700">Zero Issues in Filter</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No issues found matching severity filter "{severityFilter}".
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onSelectIssue(issue.cueId, issue.timeSec)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#249144] bg-slate-50 hover:bg-green-50/40 transition-all cursor-pointer flex items-center justify-between gap-2 group shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-800 group-hover:text-[#249144] transition-colors">
                        <span>Cue #{issue.cueIndex}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          [{formatSecondsToTimecode(issue.timeSec, 'display')}]
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider font-sans border ${getSeverityBadgeClass(issue.severity)}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {issue.isFixable && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-[#14532d] uppercase">
                        Safe Fix
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#249144] transition-colors shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
