'use client';

import React, { useState } from 'react';
import macroQuestions from '@/app/data/macroQuestions.json';
import riaQuestions from '@/app/data/riasecQuestionsShuffled.json';

interface QuestionBase {
  id: string;
  text: string;
  scale: string[];
}

interface MacroQuestion extends QuestionBase {
  dimension: string;
}

interface RiaSecQuestion extends QuestionBase {
  category: string;
  style: string;
}

interface Answer {
  questionId: string;
  score: number;
}

const QUESTIONS_PER_PAGE = 10;
type Phase = 'macro' | 'riasec';

const QuizOptionGrid: React.FC<{
  question: QuestionBase;
  selected?: number;
  onSelect: (id: string, score: number) => void;
}> = ({ question, selected = 0, onSelect }) => (
  <div className="mb-8">
    <p className="mb-3 font-medium">{question.text}</p>
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
              flex flex-col items-center p-2 border rounded
              ${isSel
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'}
            `}
          >
            <span className="font-semibold">{score}</span>
            <span className="mt-1 text-xs text-center">{label}</span>
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
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h2 className="text-xl font-semibold mb-4">
          Let’s get to know you—big picture
        </h2>
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

        <div className="flex justify-end mt-6">
          <button
            onClick={next}
            disabled={!allAnswered}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Phase 2: paginated RIASEC
  const allRia = riaQuestions as RiaSecQuestion[];
  const start = currentPage * QUESTIONS_PER_PAGE;
  const pageQs = allRia.slice(start, start + QUESTIONS_PER_PAGE);
  const isLast = start + QUESTIONS_PER_PAGE >= allRia.length;

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

  function handleSubmit() {
    console.log('Macro answers:', macroAnswers);
    console.log('RIASEC answers:', riaAnswers);
    // TODO: router.push('/results', { state: { macroAnswers, riaAnswers } })
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-xl font-semibold mb-4">
        Part {currentPage + 1} of{' '}
        {Math.ceil(allRia.length / QUESTIONS_PER_PAGE)}: Career Preferences
      </h2>
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

      <div className="flex justify-between mt-6">
        <button
          onClick={goBack}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={goNext}
          disabled={!allOnPageAnswered}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isLast ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
