import React from 'react';
import { Award, Users, Download, Sparkles, CheckCircle2, ShieldCheck, HardDrive, BookOpen } from 'lucide-react';

export const AdiKarmayogiPage: React.FC = () => {
  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <Award className="w-3.5 h-3.5 text-[#249144]" /> Mission Karmayogi Tribal Chapter
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Adi Karmayogi Abhiyan
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Grassroots capacity building, digital literacy, and offline vernacular translation packs for frontline tribal workers and youth.
          </p>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#14532d] via-[#166534] to-[#1f6333] rounded-3xl p-8 sm:p-12 text-white shadow-xl my-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-green-200">Empowering 100,000+ Tribal Youth</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold domine-bold">
              Bridging the Last-Mile Linguistic Divide
            </h2>
            <p className="text-sm sm:text-base text-green-100 leading-relaxed font-light">
              Under the Adi Karmayogi initiative, ASHA workers, Gram Sevaks, and community linguists are equipped with offline translation models and certified tribal terminology glossaries.
            </p>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 text-[#249144] flex items-center justify-center">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Offline Language Packs</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download zero-bandwidth language packs to perform translation, OCR scanning, and TTS in deep forest villages without cell towers.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 text-[#249144] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Field Cadre Certification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Self-paced micro-modules on tribal legal terminology, health counseling, PDS welfare forms, and forest rights.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 text-[#249144] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">ASHA & ANM Kits</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Specialized audio guides for Sickle Cell Disease counseling, maternal health, and immunization in 10+ dialects.
            </p>
          </div>
        </div>

        {/* Offline Translation Pack Download Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 domine-bold">Download Offline Dialect Packs</h3>
            <p className="text-xs text-slate-500 mt-1">Install once on your Android/iOS device for 100% offline usage.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { lang: 'Santali (Ol Chiki)', size: '24 MB', version: 'v2.4' },
              { lang: 'Bhili (Devanagari)', size: '18 MB', version: 'v2.1' },
              { lang: 'Gondi (Central)', size: '22 MB', version: 'v2.2' },
              { lang: 'Mundari (Bani)', size: '16 MB', version: 'v1.9' },
              { lang: 'Kui (Odisha)', size: '19 MB', version: 'v2.0' },
              { lang: 'Garo (A·chik)', size: '15 MB', version: 'v1.8' }
            ].map((pack, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{pack.lang}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{pack.size} • {pack.version}</span>
                </div>
                <button
                  onClick={() => alert(`Downloading offline pack for ${pack.lang}...`)}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:border-[#249144] text-[#249144] shadow-sm transition"
                  title="Download pack"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
