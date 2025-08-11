"use client";

import React from "react";
import type { RIASECProfile } from "@/app/types/career";

export type Career = {
  code: string;
  title: string;
  riasec: RIASECProfile;
};

type CareerCardProps = {
  career: Career;
};

export default function CareerCard({ career }: CareerCardProps) {
  return (
    <div className="rounded-xl border border-black/5 dark:border-white/10 p-5 bg-white/60 dark:bg-white/5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tight">{career.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{career.code}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm">
        {(["R","I","A","S","E","C"] as const).map((k) => (
          <div key={k} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-200">{k}</span>
              <span className="tabular-nums text-gray-500 dark:text-gray-400">{career.riasec[k].toFixed(1)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${(career.riasec[k] / 7) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


