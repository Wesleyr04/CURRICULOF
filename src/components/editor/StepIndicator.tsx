"use client";

import React from "react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const STEPS = [
  { number: 1, title: "Dados Pessoais" },
  { number: 2, title: "Objetivo" },
  { number: 3, title: "Experiências" },
  { number: 4, title: "Formação" },
  { number: 5, title: "Habilidades" },
  { number: 6, title: "Revisão & Layout" },
];

export function StepIndicator({ currentStep, onSelectStep }: StepIndicatorProps) {
  return (
    <div className="w-full bg-white border-b border-slate-200 px-4 py-3 shadow-2xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {STEPS.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => onSelectStep(step.number)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isCurrent
                  ? "bg-blue-900 text-white shadow-xs"
                  : isCompleted
                  ? "bg-blue-50 text-blue-900 hover:bg-blue-100"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isCurrent
                    ? "bg-white text-blue-900"
                    : isCompleted
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.number}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
