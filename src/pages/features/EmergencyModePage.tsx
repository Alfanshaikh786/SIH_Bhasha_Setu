import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Volume2, 
  Copy, 
  Check, 
  PhoneCall, 
  ShieldAlert, 
  HeartPulse, 
  Flame, 
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
import { playTextSpeech } from '../../services/translationService';

interface EmergencyCard {
  id: string;
  category: 'medical' | 'trauma' | 'safety' | 'vital';
  title: string;
  sat: string; // Ol Chiki
  roman: string;
  hi: string;
  en: string;
}

const EMERGENCY_PHRASES: EmergencyCard[] = [
  {
    id: 'emg-1',
    category: 'medical',
    title: 'Call Ambulance / Hospital',
    sat: 'ᱜᱚᱲᱚ ᱟᱹᱧ ᱯᱮ! ᱮᱢᱵᱩᱞᱮᱱᱥ ᱦᱚᱦᱚᱣᱟᱭ ᱯᱮ ᱾',
    roman: 'Goro anj pe! Ambulance hohoway pe.',
    hi: 'मदद करो! तुरंत एम्बुलेंस को बुलाओ।',
    en: 'Help! Please call the ambulance immediately.'
  },
  {
    id: 'emg-2',
    category: 'vital',
    title: 'Where Does it Hurt?',
    sat: 'ᱚᱠᱟᱨᱮ ᱦᱟᱹᱥᱩ ᱮᱫ ᱢᱮᱭᱟ?',
    roman: 'Okare hasu ed meya?',
    hi: 'कहाँ दर्द हो रहा है? मुझे बताओ।',
    en: 'Where does it hurt? Show me.'
  },
  {
    id: 'emg-3',
    category: 'trauma',
    title: 'Snakebite / Urgent Animal Attack',
    sat: 'ᱵᱤᱧ ᱜᱮᱨ ᱟᱠᱟᱫᱮᱭᱟ! ᱞᱚᱜᱚᱱ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱤᱫᱤᱭᱮ ᱯᱮ ᱾',
    roman: 'Biny ger akadeya! Logon haspatal idiye pe.',
    hi: 'सांप ने काट लिया है! तुरंत अस्पताल ले चलो।',
    en: 'A snake has bitten! Take them to hospital immediately.'
  },
  {
    id: 'emg-4',
    category: 'vital',
    title: 'High Fever / Difficulty Breathing',
    sat: 'ᱟᱹᱰᱤ ᱠᱮᱴᱮᱡ ᱨᱩᱣᱟᱹ ᱦᱮᱡ ᱟᱠᱟᱱᱟ ᱟᱨ ᱥᱟᱦᱮᱫ ᱦᱟᱹᱥᱩ ᱠᱟᱱᱟ ᱾',
    roman: 'Adi ketej ruwa hej akana ar sahed hasu kana.',
    hi: 'बहुत तेज़ बुखार है और सांस लेने में तकलीफ है।',
    en: 'Severe high fever and difficulty breathing.'
  },
  {
    id: 'emg-5',
    category: 'safety',
    title: 'Contaminated Water / Boil Water',
    sat: 'ᱱᱚᱣᱟ ᱫᱟᱜ ᱟᱞᱚᱯᱮ ᱧᱩᱭᱟ, ᱞᱚᱜᱚᱱ ᱦᱮᱰᱮᱡ ᱫᱟᱜ ᱧᱩᱭ ᱯᱮ ᱾',
    roman: 'Nowa daag alope nyuya, logon hedej daag nyuy pe.',
    hi: 'यह पानी मत पियो, सिर्फ उबला हुआ पानी पियो।',
    en: 'Do not drink this water, only drink boiled water.'
  },
  {
    id: 'emg-6',
    category: 'safety',
    title: 'Flood / Extreme Weather Shelter',
    sat: 'ᱵᱟᱹᱰ ᱫᱟᱜ ᱦᱤᱡᱩᱜ ᱠᱟᱱᱟ! ᱪᱮᱛᱟᱱ ᱴᱷᱟᱶ ᱛᱮ ᱪᱟᱞᱟᱜ ᱯᱮ ᱾',
    roman: 'Bad daag hijug kana! Chetan thaon te chalag pe.',
    hi: 'बाढ़ का पानी आ रहा है! ऊंचे स्थान पर चलें।',
    en: 'Flood waters are coming! Move to higher ground immediately.'
  }
];

export const EmergencyModePage: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="min-h-screen bg-red-950/20 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Emergency Banner */}
        <div className="bg-red-600 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-200" />
              <span>RAPID EMERGENCY MODE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide">
              Emergency Tribal Communication Aid
            </h1>
            <p className="text-xs sm:text-sm text-red-100">
              One-touch high-contrast phrases for frontline health workers, disaster responders, and field officers.
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-center sm:text-right">
            <span className="text-[10px] uppercase font-bold text-red-200 block">National Emergency</span>
            <span className="text-2xl font-black tracking-widest text-white">112 / 108</span>
          </div>
        </div>

        {/* Medical & Ethical Disclaimer */}
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <strong className="block text-amber-900 font-bold mb-0.5">Responsible Use & Medical Disclaimer:</strong>
            This module provides verified translation assistance for acute situations. It does <strong>not</strong> substitute for trained clinical judgment or emergency medical personnel. Always contact local healthcare centers immediately during critical trauma or illness.
          </div>
        </div>

        {/* Emergency Phrase Cards */}
        <div className="space-y-3.5">
          {EMERGENCY_PHRASES.map(card => (
            <div
              key={card.id}
              className="bg-white rounded-3xl p-5 border-2 border-red-200 shadow-sm hover:border-red-500 transition-all space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-red-600" /> {card.title}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playTextSpeech(card.sat, 'sat')}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-red-600" />
                    <span>Santali Audio</span>
                  </button>
                  <button
                    onClick={() => playTextSpeech(card.hi, 'hin')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-slate-600" />
                    <span>Hindi Audio</span>
                  </button>
                </div>
              </div>

              {/* Santali Ol Chiki Script */}
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug font-sans">
                  {card.sat}
                </p>
                <p className="text-xs text-slate-500 italic font-mono">
                  Phonetic: {card.roman}
                </p>
              </div>

              {/* Parallel Hindi & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Hindi</span>
                  <p className="font-bold text-slate-900 text-sm">{card.hi}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">English</span>
                  <p className="font-semibold text-slate-800 text-sm">{card.en}</p>
                </div>
              </div>

              {/* Quick Copy */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleCopy(`${card.sat}\n${card.hi}\n${card.en}`, card.id)}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedId === card.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === card.id ? 'Copied' : 'Copy All Text'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
