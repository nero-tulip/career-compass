"use client";

import { useState } from "react";

/**
 * Reusable FAQ Component
 * Features a custom accordion with smooth reveal animations.
 */

type FAQItem = {
  question: string;
  answer: string | React.ReactNode;
};

const faqData: FAQItem[] = [
  {
    question: "How accurate are the results?",
    answer: (
      <>
        Extremely accurate. Our matching engine is built on government and
        academic data sources spanning more than 30 years. By combining the
        scientifically validated &quot;Big 5&quot; personality model with the RIASEC
        interest framework, we can predict career satisfaction with high
        reliability. Users consistently tell us the results feel &quot;scarily
        accurate&quot; because they reflect who they truly are.
      </>
    ),
  },
  {
    question: "Is this different from free school tests?",
    answer: (
      <>
        Yes, significantly. Most free tests give you a simple label and a
        generic list of jobs. We provide a comprehensive platform. We analyze{" "}
        <em>why</em> you fit certain roles based on fit-gaps, work styles, and
        motivators. We don&#39;t just leave you with a list; we give you a roadmap
        and the tools to actually execute on your goals.
      </>
    ),
  },
  {
    question: "What exactly is included in the PRO platform?",
    answer: (
      <div className="space-y-4">
        <p>
          CareerCompass PRO is a complete platform designed to take you from
          confusion to clarity. It includes multiple deep-dive modules:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Advanced Personality Analysis:</strong> A full Big 5 breakdown to understand
            your core traits.
          </li>
          <li>
            <strong>Career Fit Reports:</strong> Detailed compatibility scores for over 900
            career paths.
          </li>
          <li>
            <strong>Action Plan Builder:</strong> Tools to set goals and track your progress.
          </li>
          <li>
            <strong>Execution Resources:</strong> Curated guides and mentorship features.
          </li>
        </ul>
        <p>It’s everything you need to build a plan and execute upon your goals.</p>
      </div>
    ),
  },
  {
    question: "Who is CareerCompass designed for?",
    answer: (
      <>
        It’s for anyone feeling stuck or unsure about their future. Whether
        you’re a high school student choosing a university degree, a university
        student questioning their major, or a professional considering a
        complete career change, our platform gives you the data-backed
        confidence to make your next move.
      </>
    ),
  },
  {
    question: "Can I use this for my child or student?",
    answer: (
      <>
        Absolutely. Many parents gift CareerCompass to their young adults to
        help them make informed decisions about university preferences or
        vocational paths. It’s a refined way to start a conversation about their
        future based on objective data rather than just opinion.
      </>
    ),
  },
  {
    question: "How is this different from seeing a career counsellor?",
    answer: (
      <>
        Career counsellors are great, but they can be expensive and variable in
        quality. CareerCompass acts as an always-available digital guide. We use
        the same psychometric frameworks professionals use, but at a fraction of
        the cost, and you can revisit your data and explore new paths whenever
        you want.
      </>
    ),
  },
  {
    question: "Is my data safe?",
    answer: (
      <>
        Yes, 100%. We are a privacy-first company. Your results are generated
        securely and are only used to provide <em>your</em> report. We do not
        sell your personal data to recruiters, advertisers, or third parties.
      </>
    ),
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem, isOpen: boolean, onToggle: () => void }) {
  return (
    <div
      className={`group rounded-2xl border bg-white/70 backdrop-blur shadow-[var(--shadow-1)] transition-all duration-300 overflow-hidden ${
        isOpen ? "border-mint-400 ring-1 ring-mint-400/20" : "border-black/10 hover:border-black/15"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left focus:outline-none cursor-pointer"
      >
        <span className={`font-medium text-lg transition-colors ${isOpen ? "text-mint-600" : "text-gray-900"}`}>
            {item.question}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white border border-black/5 shadow-sm transition-transform duration-300 ${
            isOpen ? "rotate-45" : "rotate-0"
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-colors ${isOpen ? "text-mint-600" : "text-gray-400"}`}
          >
            <path
              d="M6 1V11M1 6H11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-5 pt-0 text-[15px] leading-relaxed text-[--text-dim]">
            {item.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {faqData.map((item, index) => (
        <AccordionItem
          key={index}
          item={item}
          isOpen={openIndex === index}
          onToggle={() => toggle(index)}
        />
      ))}
    </div>
  );
}
