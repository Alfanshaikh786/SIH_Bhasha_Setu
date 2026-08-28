import React from 'react';
import { Building2, Landmark, GraduationCap } from 'lucide-react';

interface Partner {
  name: string;
  category: 'Consortium Partner' | 'Tribal Research Institute';
  location: string;
  role: string;
  badge: string;
}

const CONSORTIUM_PARTNERS: Partner[] = [
  {
    name: 'IIT Delhi',
    category: 'Consortium Partner',
    location: 'New Delhi',
    role: 'Lead AI Core & Multi-modal Architecture',
    badge: 'IITD'
  },
  {
    name: 'BITS Pilani',
    category: 'Consortium Partner',
    location: 'Pilani, Rajasthan',
    role: 'Neural Speech (ASR/TTS) Models',
    badge: 'BITS'
  },
  {
    name: 'IIIT Hyderabad',
    category: 'Consortium Partner',
    location: 'Hyderabad, Telangana',
    role: 'Linguistic Corpora & Translation Models',
    badge: 'IIITH'
  },
  {
    name: 'IIIT Naya Raipur',
    category: 'Consortium Partner',
    location: 'Chhattisgarh',
    role: 'Tribal Field Dataset Acquisition',
    badge: 'IIITNR'
  }
];

const TRI_INSTITUTES: Partner[] = [
  {
    name: 'TRI Chhattisgarh',
    category: 'Tribal Research Institute',
    location: 'Raipur',
    role: 'Gondi & Halbi Linguistic Verification',
    badge: 'TRICG'
  },
  {
    name: 'TRI Odisha (SCSTRTI)',
    category: 'Tribal Research Institute',
    location: 'Bhubaneswar',
    role: 'Kui, Saora & Santali Field Primers',
    badge: 'TRIOD'
  },
  {
    name: 'TRI Madhya Pradesh',
    category: 'Tribal Research Institute',
    location: 'Bhopal',
    role: 'Bhili & Baigani Folklore Archiving',
    badge: 'TRIMP'
  },
  {
    name: 'TRI Jharkhand',
    category: 'Tribal Research Institute',
    location: 'Ranchi',
    role: 'Mundari, Ho & Kurukh Curricula',
    badge: 'TRIJH'
  }
];

export const PartnersMarquee: React.FC = () => {
  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        
        {/* Consortium Partners */}
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-[#249144] uppercase tracking-wider block mb-1">
            Academic & Research Leadership
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 domine-bold">
            Consortium Partners
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Developed in premier collaboration with India's leading technological institutes and linguistic departments.
          </p>
        </div>

        {/* Consortium Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {CONSORTIUM_PARTNERS.map((partner, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#249144] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-[#249144] flex items-center justify-center font-bold text-xs group-hover:bg-[#249144] group-hover:text-white transition">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{partner.name}</h3>
                  <span className="text-[11px] text-slate-400">{partner.location}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                {partner.role}
              </p>
            </div>
          ))}
        </div>

        {/* Tribal Research Institutes involved */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-[#249144] uppercase tracking-wider block mb-1">
            Field Validation & Community Co-creation
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 domine-bold">
            Tribal Research Institutes (TRIs)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRI_INSTITUTES.map((tri, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#249144] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-700 group-hover:text-white transition">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{tri.name}</h4>
                  <span className="text-[11px] text-slate-400">{tri.location}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                {tri.role}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
