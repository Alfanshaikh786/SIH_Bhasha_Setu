import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, GraduationCap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AdditionalFeatureCardProps {
  title: string;
  description: string;
  link: string;
  tag: string;
  icon: React.ReactNode;
  accentBg: string;
  accentText: string;
}

const AdditionalFeatureCard: React.FC<AdditionalFeatureCardProps> = ({
  title,
  description,
  link,
  tag,
  icon,
  accentBg,
  accentText
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-6 sm:gap-7 group">
      
      {/* Left Icon Badge */}
      <div className={`relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ${accentBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
        <div className={accentText}>
          {icon}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex flex-col justify-between flex-1 text-center sm:text-left">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            <span className="text-[10px] bg-emerald-100 text-[#14532d] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {tag}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
            {description}
          </p>
        </div>

        <div className="mt-4">
          <Link
            to={link}
            className="bg-gradient-to-b from-[#249144] to-[#14532d] hover:from-[#1b7536] hover:to-[#0f3e21] text-white px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all duration-200 group-hover:shadow"
          >
            <span>Launch Feature</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

    </div>
  );
};

export const AdditionalFeaturesSection: React.FC = () => {
  return (
    <section id="additional-features" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-t border-slate-200/80">
      
      {/* Section Header */}
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#14532d] mb-3 shadow-2xs">
          <span>Specialized Modes</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1e293b] tracking-tight" style={{ fontFamily: "'Domine', Georgia, serif" }}>
          Additional Features
        </h2>
        
        {/* Underline Bar with Centered Green Accent */}
        <div className="relative mt-3.5 w-36 sm:w-48 h-[2px] bg-slate-200">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
        </div>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-500 max-w-2xl font-sans">
          Specialized operational modes engineered for rural village fieldwork, classroom projection, verified lexicon search, and urgent triage.
        </p>
      </div>

      {/* Grid of 4 Additional Features */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        
        {/* 1. Field Mode */}
        <AdditionalFeatureCard
          title="Field Mode"
          tag="Outdoor / Mobile"
          description="High-contrast one-handed interface with large touch targets, real-time noise feedback, and a 4-step workflow: Speak → Recognize → Translate → Listen."
          link="/field-mode"
          icon={<Compass className="w-10 h-10" />}
          accentBg="bg-emerald-100"
          accentText="text-[#249144]"
        />

        {/* 2. Teacher Mode */}
        <AdditionalFeatureCard
          title="Teacher Mode"
          tag="Classroom Projection"
          description="Live projector dual-script captions, synchronized Santali Ol Chiki subtitles, dynamic lesson vocabulary extraction, and instant transcript export (.TXT & .SRT)."
          link="/teacher-mode"
          icon={<GraduationCap className="w-10 h-10" />}
          accentBg="bg-indigo-100"
          accentText="text-indigo-600"
        />

        {/* 3. Emergency Mode */}
        <AdditionalFeatureCard
          title="Emergency Mode"
          tag="Offline Triage Cards"
          description="Rapid high-visibility communication cards for urgent medical situations, pain assessment, fever, and snakebites with instant Santali & Hindi audio."
          link="/emergency-mode"
          icon={<AlertTriangle className="w-10 h-10" />}
          accentBg="bg-red-100"
          accentText="text-red-600"
        />

        {/* 4. Verified Knowledge Base */}
        <AdditionalFeatureCard
          title="Verified Knowledge Base"
          tag="12 Domains"
          description="Instant search across 12 practical semantic categories indexing 6,780 parallel master records in Ol Chiki, Roman pronunciation, Hindi, and English."
          link="/knowledge-base"
          icon={<ShieldCheck className="w-10 h-10" />}
          accentBg="bg-emerald-100"
          accentText="text-[#249144]"
        />

      </div>
    </section>
  );
};
