"use client";

import {
  Check,
  Cpu,
  FileText,
  Github,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

type GenerationStep = {
  Icon: LucideIcon;
  label: string;
  progressClass: string;
  durationClass: string;
};

const steps: GenerationStep[] = [
  {
    Icon: Cpu,
    label: "Analyzing your stack...",
    progressClass: "w-full",
    durationClass: "duration-[1500ms]",
  },
  {
    Icon: FileText,
    label: "Generating agent files with AI...",
    progressClass: "w-full",
    durationClass: "duration-[3500ms]",
  },
  {
    Icon: Github,
    label: "Creating GitHub repository...",
    progressClass: "w-full",
    durationClass: "duration-[3000ms]",
  },
  {
    Icon: Upload,
    label: "Pushing files to repo...",
    progressClass: "w-[88%]",
    durationClass: "duration-[2400ms]",
  },
];

export function GenerationProgress() {
  const [activeStep, setActiveStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setHasStarted(true), 50),
      window.setTimeout(() => setActiveStep(1), 1500),
      window.setTimeout(() => setActiveStep(2), 5000),
      window.setTimeout(() => setActiveStep(3), 8000),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-zinc-950/50"
      role="status"
    >
      <ol className="space-y-5">
        {steps.map((step, index) => {
          const isComplete = index < activeStep;
          const isActive = index === activeStep;
          const Icon = step.Icon;
          const textClass = isActive
            ? "text-purple-300"
            : isComplete
              ? "text-zinc-300"
              : "text-zinc-300";
          const indicatorClass = isActive
            ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
            : isComplete
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-zinc-800 bg-zinc-900 text-zinc-300";
          const progressClass = isComplete
            ? "w-full duration-300"
            : isActive && hasStarted
              ? `${step.progressClass} ${step.durationClass}`
              : "w-0 duration-300";

          return (
            <li
              aria-current={isActive ? "step" : undefined}
              className="space-y-2"
              key={step.label}
            >
              <div
                className={`flex items-center gap-3 transition-colors duration-200 ease-out ${textClass}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ease-out ${indicatorClass}`}
                >
                  {isComplete ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Icon
                      aria-hidden="true"
                      className={`h-4 w-4 ${
                        isActive ? "animate-spin motion-reduce:animate-none" : ""
                      }`}
                    />
                  )}
                </span>
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full bg-purple-500 transition-[width] ease-out ${progressClass}`}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
