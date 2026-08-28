import React from 'react';
import { ShieldCheck, Lock, FileText, Globe } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#249144]" /> Data Sovereignty & Protection
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Privacy Policy & Governance
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Ministry of Tribal Affairs guidelines for indigenous data sovereignty, user confidentiality, and open linguistic licensing.
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed font-light">
          <div>
            <h2 className="text-xl font-bold text-slate-900 domine-bold mb-2">1. Indigenous Linguistic Sovereignty</h2>
            <p>
              All tribal folklore, audio samples, oral narratives, and manuscript scans submitted to the Bhasha Setu platform are governed by the Indigenous Data Sovereignty Framework. The intellectual and cultural rights remain with the respective tribal communities and custodial clans.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 domine-bold mb-2">2. Processing of Text, Voice & OCR Data</h2>
            <p>
              Queries entered in the Text-to-Text, Speech-to-Text, and OCR tools are processed in accordance with Digital Personal Data Protection (DPDP) Act standards. Data submitted for immediate translation is ephemerally evaluated and not monetized or transferred to third-party commercial entities.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 domine-bold mb-2">3. Community Contributor Consent</h2>
            <p>
              When linguists or community members contribute words, definitions, or audio chants, explicit consent is obtained to include these entries in the public Open Linguistic Knowledge Graph for academic and welfare enrichment.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 domine-bold mb-2">4. Contact & Inquiries</h2>
            <p>
              For grievances, data queries, or removal requests regarding cultural materials, contact our nodal data governance officer at:
            </p>
            <p className="font-semibold text-slate-900 mt-2">
              Sahyadri College of Engineering and Management, Mangaluru<br />
              Email: <a href="mailto:alfanshaikh902@gmail.com" className="text-[#249144] hover:underline">alfanshaikh902@gmail.com</a>
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
