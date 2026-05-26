import { Check } from "lucide-react";

const steps = ["Project", "Stack", "GitHub"] as const;

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = currentStep > stepNumber;
        const isCurrent = currentStep === stepNumber;

        return (
          <li
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
              isCurrent
                ? "border-purple-500/70 bg-purple-500/10 text-zinc-100"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400"
            }`}
            key={step}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                isComplete
                  ? "bg-purple-500 text-white"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {isComplete ? (
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                stepNumber
              )}
            </span>
            <span>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
