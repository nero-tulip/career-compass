import React from 'react';

interface QuizIntroProps {
  title: string;
  description: string;
  whatItMeasures?: {
    title?: string;
    items: string[];
  };
  timeEstimate?: string;
  howItWorks?: string[];
  tips?: string[];
  onStart: () => void;
  onBack: () => void;
}

export default function QuizIntro({
  title,
  description,
  whatItMeasures,
  timeEstimate,
  howItWorks,
  tips,
  onStart,
  onBack,
}: QuizIntroProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 lg:px-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed text-balance">
          {description}
        </p>
        {timeEstimate && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100 mt-4">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{timeEstimate}</span>
          </div>
        )}
      </div>

      <div className="grid gap-8 md:gap-12 md:grid-cols-2 lg:gap-16">
        {/* Left Col: Details */}
        <div className="space-y-10">
          {whatItMeasures && (
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                {whatItMeasures.title || "What we'll analyze"}
              </h3>
              <ul className="space-y-3">
                {whatItMeasures.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 leading-normal">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

           {howItWorks && (
            <section className="space-y-4">
               <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                How it works
              </h3>
               <ul className="space-y-3">
                {howItWorks.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 leading-normal">
                     <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right Col: Tips & Action */}
        <div className="space-y-10 flex flex-col justify-between">
          {tips && (
            <section className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 relative overflow-hidden">
               {/* Decorative blob */}
               <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl" />
               
               <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 relative z-10">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Tips for best results
              </h3>
              <ul className="space-y-3 relative z-10">
                {tips.map((tip, i) => (
                  <li key={i} className="text-gray-600 text-sm leading-relaxed">
                    "{tip}"
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="space-y-4 pt-4">
             <button
              onClick={onStart}
              className="w-full btn btn-primary text-lg py-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold rounded-xl"
            >
              Start
            </button>
            <button
              onClick={onBack}
              className="w-full btn btn-ghost text-gray-500 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            <p className="text-xs text-center text-gray-400 mt-4">
              Your answers are private and valid for your report only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
