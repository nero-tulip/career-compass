'use client';

import React, { useEffect, useState } from 'react';

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Your Career Analysis</h1>
      
      {/* RIASEC Profile */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl text-blue-950 font-semibold mb-4">Your RIASEC Profile</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(results.profile.riasec).map(([key, value]) => (
            <div key={key} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-100">{riasecLabels[key as keyof typeof riasecLabels]}</span>
                <span className="text-lg font-bold text-gray-100">{value.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(value / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-sm text-blue-900">
            <strong>Dominant Traits:</strong> {results.profile.dominantTraits.map(trait => riasecLabels[trait as keyof typeof riasecLabels]).join(', ')}
          </p>
        </div>
      </div>

      {/* Analysis - now more prominent and macro */}
      <div className="bg-gray-900 rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-100 text-center">Career Analysis & Your RIASEC Meaning</h2>
        <div className="prose max-w-none">
          <p className="text-white leading-relaxed whitespace-pre-line text-lg text-center">
            {results.analysis}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center space-x-4">
        <button 
          onClick={() => {
            localStorage.removeItem('careerwise_results');
            window.location.href = '/quiz';
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retake Quiz
        </button>
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
        >
          Print Results
        </button>
      </div>
    </div>
  );
}
