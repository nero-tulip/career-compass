'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import macroQuestions from '@/app/data/macroQuestions.json';
import riaQuestions from '@/app/data/riasecQuestionsShuffled.json';
import type { Answer } from '@/app/types/quiz';
import ProgressBar from '@/app/components/ProgressBar';

interface QuestionBase {
  id: string;
  text: string;
  scale: string[];
}


interface RiaSecQuestion extends QuestionBase {
  category: string;
  style: string;
}

interface MacroQuestion extends QuestionBase {
  dimension: string;
}


const QUESTIONS_PER_PAGE = 10;
type Phase = 'macro' | 'riasec';

const QuizOptionGrid: React.FC<{
  question: QuestionBase;
  selected?: number;
  onSelect: (id: string, score: number) => void;
}> = ({ question, selected = 0, onSelect }) => (
  <div className="mb-8">
    <p className="mb-3 text-base font-medium text-gray-900 dark:text-gray-50">{question.text}</p>
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${question.scale.length}, minmax(0,1fr))`,
      }}
    >
      {question.scale.map((label, idx) => {
        const score = idx + 1;
        const isSel = selected === score;
        return (
          <button
            key={score}
            onClick={() => onSelect(question.id, score)}
            className={`
              flex flex-col items-center p-3 rounded-md border
              ${isSel
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white/70 dark:bg-white/5 text-gray-900 dark:text-gray-100 border-black/10 dark:border-white/10 hover:bg-white'}
            `}
          >
            <span className="font-semibold text-sm">{score}</span>
            <span className="mt-1 text-[11px] leading-snug text-center opacity-80">{label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('macro');
  const [macroAnswers, setMacroAnswers] = useState<Answer[]>([]);
  const [riaAnswers, setRiaAnswers] = useState<Answer[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  // Prepare RIASEC pagination/progress values at top-level to keep hooks order consistent
  const allRia = riaQuestions as RiaSecQuestion[];
  const start = currentPage * QUESTIONS_PER_PAGE;
  const pageQs = allRia.slice(start, start + QUESTIONS_PER_PAGE);
  const isLast = start + QUESTIONS_PER_PAGE >= allRia.length;
  const totalPages = Math.ceil(allRia.length / QUESTIONS_PER_PAGE);
  const progress = useMemo(
    () =>
      (currentPage * QUESTIONS_PER_PAGE + pageQs.filter(q => riaAnswers.some(a => a.questionId === q.id)).length) /
      (allRia.length || 1),
    [currentPage, pageQs, riaAnswers, allRia.length]
  );

  const handleMacroAnswer = (questionId: string, score: number) => {
    setMacroAnswers((prev) => {
      const exists = prev.find((a) => a.questionId === questionId);
      if (exists) {
        return prev.map((a) =>
          a.questionId === questionId ? { ...a, score } : a
        );
      }
      return [...prev, { questionId, score }];
    });
  };

  const handleRiaAnswer = (questionId: string, score: number) => {
    setRiaAnswers((prev) => {
      const exists = prev.find((a) => a.questionId === questionId);
      if (exists) {
        return prev.map((a) =>
          a.questionId === questionId ? { ...a, score } : a
        );
      }
      return [...prev, { questionId, score }];
    });
  };

  // Phase 1: all macro questions
  if (phase === 'macro') {
    const allMacro = macroQuestions as MacroQuestion[];
    const allAnswered = allMacro.every((q) =>
      macroAnswers.some((a) => a.questionId === q.id)
    );

    const next = () => {
      if (allAnswered) setPhase('riasec');
    };

    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="mb-6">
          <ProgressBar value={allMacro.length ? macroAnswers.length / allMacro.length : 0} label="Part 1 of 2" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Big picture</h2>
        {allMacro.map((q) => {
          const sel = macroAnswers.find((a) => a.questionId === q.id)?.score;
          return (
            <QuizOptionGrid
              key={q.id}
              question={q}
              selected={sel}
              onSelect={handleMacroAnswer}
            />
          );
        })}

        <div className="flex justify-end mt-8">
          <button
            onClick={next}
            disabled={!allAnswered}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Phase 2: paginated RIASEC

  const allOnPageAnswered = pageQs.every((q) =>
    riaAnswers.some((a) => a.questionId === q.id)
  );

  const goNext = () => {
    if (!allOnPageAnswered) return;
    if (isLast) {
      handleSubmit();
    } else {
      setCurrentPage((p) => p + 1);
    }
  };
  const goBack = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  async function handleSubmit() {
    try {
      console.log('Submitting macroAnswers:', macroAnswers);
      console.log('Submitting riaAnswers:', riaAnswers);
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          macroAnswers,
          riaAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit results');
      }

      const data = await response.json();
      // Save results to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('careerwise_results', JSON.stringify(data));
      }
      router.push('/results');
    } catch (error) {
      console.error('Error submitting results:', error);
      alert('Failed to submit results. Please try again.');
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6">
        <ProgressBar value={progress} label={`Part 2 of 2 • Page ${currentPage + 1} of ${totalPages}`} />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Career preferences</h2>
      {pageQs.map((q) => {
        const sel = riaAnswers.find((a) => a.questionId === q.id)?.score;
        return (
          <QuizOptionGrid
            key={q.id}
            question={q}
            selected={sel}
            onSelect={handleRiaAnswer}
          />
        );
      })}

      <div className="flex justify-between mt-8">
        <button
          onClick={goBack}
          disabled={currentPage === 0}
          className="px-5 py-2.5 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={goNext}
          disabled={!allOnPageAnswered}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {isLast ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
