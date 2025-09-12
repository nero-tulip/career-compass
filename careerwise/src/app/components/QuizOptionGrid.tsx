"use client";

import React, { useEffect, useRef, useState } from "react";

/** Minimal shape the grid needs */
export interface QuestionBase {
  id: string;
  text: string;
  scale: string[]; // labels for 1..N
}

/** Deterministic color choice per question id */
const COLOR_CLASSES = [
  "text-mint-600",
  "text-sky-600",
  "text-blush-600",
  "text-lav-600",
  "text-sand-600",
];
function colorClassForId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return COLOR_CLASSES[Math.abs(hash) % COLOR_CLASSES.length];
}

const QuizOptionGrid: React.FC<{
  question: QuestionBase;
  selected?: number;
  onSelect: (id: string, score: number) => void;
}> = ({ question, selected = 0, onSelect }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setVisible(e.isIntersecting)),
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="mb-24 min-h-[60vh] flex flex-col justify-center">
      <p className={`mb-6 text-2xl md:text-3xl font-semibold text-center reveal ${visible ? "is-visible" : ""} ${colorClassForId(question.id)}`}>
        {question.text}
      </p>
      <div
        className={`grid gap-4 reveal ${visible ? "is-visible" : ""}`}
        style={{ gridTemplateColumns: `repeat(${question.scale.length}, minmax(0,1fr))` }}
      >
        {question.scale.map((label, idx) => {
          const score = idx + 1;
          const isSel = selected === score;
          return (
            <div key={score} className="flex flex-col items-center">
              <button
                onClick={() => onSelect(question.id, score)}
                className={`flex items-center justify-center w-full p-3 md:p-4 quiz-option ${isSel ? "quiz-option-selected" : ""}`}
                aria-label={`${score}: ${label}`}
              >
                <span className="font-semibold text-lg md:text-xl leading-none">{score}</span>
              </button>
              {(score === 1 || score === 3 || score === 5) && (
                <span className="mt-2 text-sm md:text-base leading-snug text-center opacity-90">{label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizOptionGrid;
