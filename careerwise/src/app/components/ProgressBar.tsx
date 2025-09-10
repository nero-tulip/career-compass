"use client";

import React from "react";

type ProgressBarProps = {
  value: number; // 0 to 1
  label?: string;
};

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="w-full">
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full rounded-full bar-track overflow-hidden">
        <div
          className="h-full rounded-full bar-fill transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
          aria-valuemin={0}
          aria-valuenow={pct}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
    </div>
  );
}


