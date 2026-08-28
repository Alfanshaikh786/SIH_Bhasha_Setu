import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    languageInterest: 'Santali',
    messageType: 'Feedback',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <Mail className="w-3.5 h-3.5 text-[#249144]" /> Community Engagement & Support
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Contact & Feedback
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Reach out to the Ministry of Tribal Affairs linguistic project team, submit translation feedback, or register as a language contributor.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
          
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 domine-bold">
                Project Headquarters
              </h2>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 text-[#249144] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs uppercase">Institution / Address</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Sahyadri College of Engineering and Management, Mangaluru
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 text-[#249144] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs uppercase">Official Email</h3>
                    <a href="mailto:alfanshaikh902@gmail.com" className="text-xs font-semibold text-[#249144] hover:underline mt-0.5 block">
                      alfanshaikh902@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#14532d] to-[#249144] rounded-3xl p-6 text-white shadow-md space-y-2">
              <h3 className="font-bold text-base domine-bold">Native Linguists Wanted</h3>
              <p className="text-xs text-green-100 leading-relaxed font-light">
                Are you a native speaker or researcher of Santali, Bhili, Gondi, Kui, Garo, or Kokborok? Join our validation circle to test neural models.
              </p>
            </div>
          </div>

          {/* Right Column: Feedback & Contribution Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 text-[#249144] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 domine-bold">
                  Message Dispatched Successfully!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for contributing to the Adi Vaani ecosystem. Our linguistic research team will review your inquiry within 48 business hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-mota px-6 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. Rajesh Murmu"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rajesh@university.ac.in"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={formData.messageType}
                      onChange={e => setFormData({ ...formData, messageType: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144] transition"
                    >
                      <option value="Feedback">Translation Quality Feedback</option>
                      <option value="Contributor">Linguist Contributor Enrollment</option>
                      <option value="Research">Academic Research Collaboration</option>
                      <option value="General">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Tribal Language</label>
                    <select
                      value={formData.languageInterest}
                      onChange={e => setFormData({ ...formData, languageInterest: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144] transition"
                    >
                      <option value="Santali">Santali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
                      <option value="Bhili">Bhili (भीली)</option>
                      <option value="Gondi">Gondi (गोंडी)</option>
                      <option value="Mundari">Mundari (ᱢᱩᱱᱰᱟᱨᱤ)</option>
                      <option value="Kui">Kui (କୁଇ)</option>
                      <option value="Garo">Garo (A·chik)</option>
                      <option value="Kokborok">Kokborok (ককবোরক)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message / Suggestions</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide specific word suggestions, translation corrections, or collaboration details..."
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-[#249144] transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-mota w-full py-3.5 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Inquiry to Ministry Team</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
