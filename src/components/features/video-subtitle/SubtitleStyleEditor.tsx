/**
 * Subtitle Style & Display Mode Editor Component
 * Professional, compact studio control panel for typography, alignment,
 * background containers, text effects, style presets, and bilingual/romanized display modes.
 */

import React from 'react';
import { 
  Palette, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Layers, 
  Sparkles, 
  Eye, 
  Check, 
  Sliders,
  Languages
} from 'lucide-react';
import { 
  SubtitleStyleConfig, 
  SubtitleDisplayMode, 
  SubtitleStylePreset,
  SubtitleFontFamily,
  SubtitleFontSize,
  SubtitleFontWeight,
  SubtitleAlignment,
  SubtitlePosition,
  SubtitleBackground,
  SubtitleTextEffect
} from './types';
import { STYLE_PRESETS } from './subtitleUtils';

interface SubtitleStyleEditorProps {
  styleConfig: SubtitleStyleConfig;
  displayMode: SubtitleDisplayMode;
  targetLang: string;
  sourceLang?: string;
  onChangeStyle: (newStyle: SubtitleStyleConfig) => void;
  onChangeDisplayMode: (newMode: SubtitleDisplayMode) => void;
  onApplyPreset: (preset: SubtitleStylePreset) => void;
}

export const SubtitleStyleEditor: React.FC<SubtitleStyleEditorProps> = ({
  styleConfig,
  displayMode,
  targetLang,
  sourceLang,
  onChangeStyle,
  onChangeDisplayMode,
  onApplyPreset
}) => {
  const isSantali = targetLang.toLowerCase() === 'sat';

  const handleUpdate = (patch: Partial<SubtitleStyleConfig>) => {
    onChangeStyle({
      ...styleConfig,
      ...patch,
      presetId: undefined // custom override
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-6 text-slate-800">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#14532d] flex items-center justify-center">
            <Palette className="w-4 h-4 text-[#249144]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Subtitle Style & Presentation</h3>
            <p className="text-[11px] text-slate-500 font-sans">Presentation metadata • Never alters subtitle text or timing</p>
          </div>
        </div>
      </div>

      {/* 1. Style Presets */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Style Presets</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = styleConfig.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#249144] bg-emerald-50/50 shadow-xs ring-1 ring-[#249144]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${isSelected ? 'text-[#14532d]' : 'text-slate-800'}`}>
                    {preset.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#249144]" />}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 font-sans">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Subtitle Display Modes (Bilingual & Romanization) */}
      <div className="space-y-2.5 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span>Subtitle Display Mode</span>
          </label>
          <span className="text-[10px] font-medium text-slate-400">Max 2 lines layout</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          
          {/* Native Only */}
          <button
            type="button"
            onClick={() => onChangeDisplayMode('native')}
            className={`p-2 rounded-xl border text-left transition text-xs cursor-pointer ${
              displayMode === 'native'
                ? 'border-[#249144] bg-emerald-50/50 text-[#14532d] font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-bold">Native Only</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Target translation</div>
          </button>

          {/* Original + Native */}
          <button
            type="button"
            onClick={() => onChangeDisplayMode('original_native')}
            className={`p-2 rounded-xl border text-left transition text-xs cursor-pointer ${
              displayMode === 'original_native'
                ? 'border-[#249144] bg-emerald-50/50 text-[#14532d] font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-bold">Original + Native</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Source top, target below</div>
          </button>

          {/* Native + Original */}
          <button
            type="button"
            onClick={() => onChangeDisplayMode('native_original')}
            className={`p-2 rounded-xl border text-left transition text-xs cursor-pointer ${
              displayMode === 'native_original'
                ? 'border-[#249144] bg-emerald-50/50 text-[#14532d] font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-bold">Native + Original</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Target top, source below</div>
          </button>

          {/* Native + Romanized */}
          <button
            type="button"
            onClick={() => onChangeDisplayMode('native_romanized')}
            disabled={!isSantali}
            title={!isSantali ? 'Romanization currently verified for Ol Chiki Santali' : ''}
            className={`p-2 rounded-xl border text-left transition text-xs cursor-pointer ${
              !isSantali
                ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
                : displayMode === 'native_romanized'
                  ? 'border-[#249144] bg-emerald-50/50 text-[#14532d] font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-bold">Native + Romanized</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Ol Chiki + Phonetics</div>
          </button>

          {/* Romanized Only */}
          <button
            type="button"
            onClick={() => onChangeDisplayMode('romanized')}
            disabled={!isSantali}
            title={!isSantali ? 'Romanization currently verified for Ol Chiki Santali' : ''}
            className={`p-2 rounded-xl border text-left transition text-xs cursor-pointer ${
              !isSantali
                ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
                : displayMode === 'romanized'
                  ? 'border-[#249144] bg-emerald-50/50 text-[#14532d] font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-bold">Romanized Only</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Phonetic pronunciation</div>
          </button>

          {/* Original Source Only */}
          <button
            type="button"
            onClick={() => onChangeDisplayMode('original')}
            className={`p-2 rounded-xl border text-left transition text-xs cursor-pointer ${
              displayMode === 'original'
                ? 'border-[#249144] bg-emerald-50/50 text-[#14532d] font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-bold">Original Only</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">Source transcript</div>
          </button>

        </div>

        {/* Romanization Disclosure Note */}
        {(displayMode === 'native_romanized' || displayMode === 'romanized') && (
          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/80 font-sans">
            <span className="font-semibold text-slate-700">Linguistic Integrity: </span>
            Romanization represents phonetic pronunciation rules for Ol Chiki, strictly distinct from linguistic translation.
          </p>
        )}
      </div>

      {/* 3. Typography Controls */}
      <div className="space-y-4 pt-1 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-slate-600" />
          <span>Typography & Layout</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Font Family */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Font Family</label>
            <select
              value={styleConfig.fontFamily}
              onChange={(e) => handleUpdate({ fontFamily: e.target.value as SubtitleFontFamily })}
              className="w-full p-2 rounded-xl border border-slate-200 bg-white font-sans text-xs focus:ring-1 focus:ring-[#249144] focus:outline-hidden"
            >
              <option value="default">Default (Noto Sans / System)</option>
              <option value="sans">Modern Sans-Serif (Inter)</option>
              <option value="serif">Editorial Serif (Domine)</option>
              <option value="ol_chiki">Authentic Ol Chiki (Noto Sans)</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Font Size</label>
            <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              {(['small', 'medium', 'large', 'xlarge'] as SubtitleFontSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleUpdate({ fontSize: size })}
                  className={`flex-1 py-1 rounded-lg text-[11px] capitalize transition cursor-pointer ${
                    styleConfig.fontSize === size
                      ? 'bg-white font-bold text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {size === 'xlarge' ? 'XL' : size[0].toUpperCase() + size.slice(1, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Font Weight */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Font Weight</label>
            <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              {(['regular', 'medium', 'bold'] as SubtitleFontWeight[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleUpdate({ fontWeight: w })}
                  className={`flex-1 py-1 rounded-lg text-[11px] capitalize transition cursor-pointer ${
                    styleConfig.fontWeight === w
                      ? 'bg-white font-bold text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Text Alignment</label>
            <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => handleUpdate({ alignment: 'left' })}
                title="Left Align"
                className={`flex-1 py-1 flex items-center justify-center rounded-lg transition cursor-pointer ${
                  styleConfig.alignment === 'left' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ alignment: 'center' })}
                title="Center Align"
                className={`flex-1 py-1 flex items-center justify-center rounded-lg transition cursor-pointer ${
                  styleConfig.alignment === 'center' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ alignment: 'right' })}
                title="Right Align"
                className={`flex-1 py-1 flex items-center justify-center rounded-lg transition cursor-pointer ${
                  styleConfig.alignment === 'right' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Container & Presentation Effects */}
      <div className="space-y-4 pt-1 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span>Container & Effects</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          {/* Position */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Vertical Position</label>
            <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              {(['bottom', 'center', 'top'] as SubtitlePosition[]).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => handleUpdate({ position: pos })}
                  className={`flex-1 py-1 rounded-lg text-[11px] capitalize transition cursor-pointer ${
                    styleConfig.position === pos
                      ? 'bg-white font-bold text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Background Container */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Background Container</label>
            <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => handleUpdate({ background: 'none' })}
                className={`flex-1 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                  styleConfig.background === 'none' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ background: 'semi_transparent' })}
                className={`flex-1 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                  styleConfig.background === 'semi_transparent' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Semi-Dark
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ background: 'solid' })}
                className={`flex-1 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                  styleConfig.background === 'solid' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Solid Black
              </button>
            </div>
          </div>

          {/* Text Effect */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Text Effect</label>
            <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
              {(['none', 'outline', 'shadow'] as SubtitleTextEffect[]).map((eff) => (
                <button
                  key={eff}
                  type="button"
                  onClick={() => handleUpdate({ textEffect: eff })}
                  className={`flex-1 py-1 rounded-lg text-[11px] capitalize transition cursor-pointer ${
                    styleConfig.textEffect === eff
                      ? 'bg-white font-bold text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {eff}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
