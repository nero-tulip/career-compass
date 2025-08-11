"use client";

import React, { useEffect, useMemo, useState } from 'react';
import CareerCard from '@/app/components/CareerCard';

interface CareerMatch {
  code: string;
  title: string;
  riasec: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
}

interface ResultsData {
  profile: {
    riasec: {
      R: number;
      I: number;
      A: number;
      S: number;
      E: number;
      C: number;
    };
    dominantTraits: string[];
  };
  matchingCareers: CareerMatch[];
  analysis: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('careerwise_results') : null;
    if (stored) {
      setResults(JSON.parse(stored));
      setLoading(false);
    } else {
      setError('No results found. Please complete the quiz first.');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Analyzing your career profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const riasecLabels = {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional'
  };

  const dominantLabels = useMemo(
    () => results.profile.dominantTraits.map(trait => riasecLabels[trait as keyof typeof riasecLabels]).join(', '),
    [results.profile.dominantTraits]
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-center mb-8">Your career profile</h1>

      <div className="grid lg:grid-cols-3 gap-6 items-start mb-8">
        <div className="lg:col-span-2 rounded-xl border border-black/5 dark:border-white/10 p-6 bg-white/60 dark:bg-white/5">
          <h2 className="text-2xl font-semibold mb-4">RIASEC breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(results.profile.riasec).map(([key, value]) => (
              <div key={key} className="rounded-lg p-4 bg-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-100 font-medium">{riasecLabels[key as keyof typeof riasecLabels]}</span>
                  <span className="text-gray-100 font-semibold">{value.toFixed(1)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${(value / 7) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Dominant traits:</span> {dominantLabels}</p>
        </div>
        <div className="rounded-xl border border-black/5 dark:border-white/10 p-6 bg-white/60 dark:bg-white/5">
          <h2 className="text-2xl font-semibold mb-2">Top matches</h2>
          <div className="space-y-3">
            {results.matchingCareers?.slice(0, 3).map((c) => (
              <CareerCard key={c.code} career={c} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/5 dark:border-white/10 p-8 bg-gray-900">
        <h2 className="text-3xl font-semibold mb-4 text-gray-100 text-center">What this means for you</h2>
        <p className="text-white leading-relaxed whitespace-pre-line text-xl text-center">{results.analysis}</p>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={() => {
            localStorage.removeItem('careerwise_results');
            window.location.href = '/quiz';
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retake quiz
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
        >
          Print
        </button>
      </div>
    </div>
  );
}
