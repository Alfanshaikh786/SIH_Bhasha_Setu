import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What is the purpose of this website?',
    answer: 'This platform is designed to preserve, promote, and make Indian tribal languages accessible through translations, dictionaries, primers, and awareness initiatives. It also provides tools for speech and text translation, along with government guidelines and awareness on social and health issues.'
  },
  {
    question: 'Who can use this website?',
    answer: 'The website is open to students, researchers, government officials, translators, NGOs, and anyone interested in Indian tribal languages, speech translations, and related resources.'
  },
  {
    question: 'What languages are supported for translation?',
    answer: 'Currently, we focus on Indian tribal languages including Santali, Mundari, and Ho along with Hindi and English.'
  },
  {
    question: 'Can I upload documents for OCR translation?',
    answer: 'Yes. You can upload scanned documents or images containing printed or handwritten text (PNG, JPG, PDF), and the OCR tool will extract and translate the text into your chosen language.'
  },
  {
    question: 'Is the Speech-to-Text translation real-time?',
    answer: 'Yes, speech-to-text works in real time, making it useful for live events, grassroots meetings, healthcare interactions, and conferences.'
  },
  {
    question: 'What kind of dictionary does the website provide?',
    answer: 'We provide bilingual and multilingual dictionaries that cover tribal languages, Hindi, and English. Users can search for words, meanings, phonetic IPA, synonyms, and contextual usage examples.'
  },
  {
    question: 'What are primers?',
    answer: 'Primers are foundational language learning books and pedagogical resources designed to help children and new learners understand, read, and practice tribal languages and scripts easily.'
  },
  {
    question: 'What ministry guidelines are available on the website?',
    answer: 'We provide updated policies, official circulars, and guidelines from relevant ministries (such as Tribal Affairs, Health, and Education) related to language preservation, mother-tongue education (NEP 2020), and health awareness.'
  },
  {
    question: 'Why does the website include SCD awareness?',
    answer: 'Sickle Cell Disease (SCD) is a major inherited genetic blood health issue across tribal communities in India. The website spreads awareness, provides bilingual video guidelines, and shares resources for prevention and pre-marital screening.'
  },
  {
    question: 'Do I need to create an account to use the services?',
    answer: 'Most translation and educational resources are freely accessible to all citizens without mandatory login. Creating an account helps you save translation history, bookmarks, and contribute new words to the linguistic repository.'
  },
  {
    question: 'Can I use the translation for official purposes?',
    answer: 'Yes, the models are trained with academic consortium rigor (IIT Delhi, BITS Pilani, IIIT-H). However, we recommend verifying critical legal or medical documents with certified language experts as automated beta AI translations may have contextual nuances.'
  },
  {
    question: 'How accurate are translations?',
    answer: 'The translations are powered by advanced neural models trained on curated tribal datasets and verified with linguistic experts and native speaker communities. Accuracy is continually refined through community contributions.'
  },
  {
    question: 'How can I report an error or suggest an improvement?',
    answer: 'You can use the “Contact & Feedback” option on the website or email us directly at alfanshaikh902@gmail.com.'
  },
  {
    question: 'Can I contribute to the dictionary or primers?',
    answer: 'Yes! We actively encourage community linguists and native speakers to contribute. Registered users can submit new vocabulary, recordings, or primer lessons through the word contribution portal for expert review.'
  }
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 lg:py-24 px-6 sm:px-8 lg:px-12 bg-white">
      {/* Header */}
      <div className="w-full py-8 px-4 flex flex-col items-center text-center">
        <h2 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900 max-w-5xl">
          Frequently Asked Questions
        </h2>
        <div className="relative mt-4 sm:mt-5 w-32 sm:w-48 md:w-64 h-[2px] bg-slate-200">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 sm:w-20 bg-[#86c498] rounded-full"></div>
        </div>
        <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-slate-500">
          Find comprehensive answers to common questions about the Bhasha Setu translation platform.
        </p>
      </div>

      {/* Accordion List */}
      <div className="max-w-4xl mx-auto mt-8 divide-y divide-slate-200 border-y border-slate-200">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="py-5 sm:py-6">
              <h3>
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                  className="cursor-pointer w-full text-left outline-none font-semibold text-slate-900 flex items-center justify-between gap-4 group"
                >
                  <span className="text-base sm:text-lg text-slate-800 group-hover:text-[#249144] transition-colors font-medium">
                    {faq.question}
                  </span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? 'bg-[#249144] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-green-100 group-hover:text-[#249144]'}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
              </h3>

              {isOpen && (
                <div className="mt-3.5 pr-8 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-light">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
