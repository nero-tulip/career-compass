'use client';

import React, { useState } from 'react';
import questions from '@/app/data/riasecQuestions.json';

interface Question {
  id: string;
  text: string;
  scale: string[]; // now 5 labels
}

interface Answer {
  questionId: string;
  score: number;
}

const QUESTIONS_PER_PAGE = 10;

const QuizQuestion: React.FC<{
  question: Question;
  answer?: number;
  onAnswer: (questionId: string, score: number) => void;
}> = ({ question, answer = 0, onAnswer }) => (
  <div className="mb-8">
    <p className="mb-3 font-medium">{question.text}</p>
    <div className="grid grid-cols-5 gap-2">
      {question.scale.map((label, idx) => {
        const score = idx + 1;
        const isSelected = answer === score;
        return (
          <button
            key={idx}
            onClick={() => onAnswer(question.id, score)}
            className={`
              flex flex-col items-center p-2 border rounded
              ${isSelected
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
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const handleAnswer = (questionId: string, score: number) => {
    setAnswers((prev) => {
      const exists = prev.find((a) => a.questionId === questionId);
      if (exists) {
        return prev.map((a) =>
          a.questionId === questionId ? { ...a, score } : a
        );
      }
      return [...prev, { questionId, score }];
    });
  };

  const allQuestions = questions as Question[];
  const start = currentPage * QUESTIONS_PER_PAGE;
  const pageQuestions = allQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  const isLastPage = start + QUESTIONS_PER_PAGE >= allQuestions.length;

  const handleNext = () => {
    if (isLastPage) {
      handleSubmit();
    } else {
      setCurrentPage((p) => p + 1);
    }
  };
  const handleBack = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  const handleSubmit = () => {
    console.log('Final answers:', answers);
    // TODO: replace with router.push('/results', { state: { answers } })
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {pageQuestions.map((q) => {
        const ans = answers.find((a) => a.questionId === q.id)?.score;
        return (
          <QuizQuestion
            key={q.id}
            question={q}
            answer={ans}
            onAnswer={handleAnswer}
          />
        );
      })}

      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {isLastPage ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
