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
    <div className="surface p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tight">{career.title}</h3>
          <p className="text-xs muted mt-0.5">{career.code}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
        {(["R","I","A","S","E","C"] as const).map((k) => (
          <div key={k} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{k}</span>
              <span className="tabular-nums muted">{career.riasec[k].toFixed(1)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bar-track overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(career.riasec[k] / 7) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


