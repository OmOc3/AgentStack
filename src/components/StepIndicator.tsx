import { Check } from "lucide-react";

const steps = ["Name", "Stack", "Preview", "GitHub", "Generate"] as const;

export function StepIndicator({ currentStep }: { currentStep: number }) {
  const totalSteps = steps.length;

  return (
    <ol
      aria-label={`Progress: Step ${currentStep} of ${totalSteps}`}
      className="flex flex-wrap gap-2 sm:grid sm:grid-cols-5 sm:gap-3"
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = currentStep > stepNumber;
        const isCurrent = currentStep === stepNumber;
        const isFuture = currentStep < stepNumber;

        return (
          <li className="list-none" key={step}>
            <div
              aria-current={isCurrent ? "step" : undefined}
              aria-disabled={isFuture ? "true" : undefined}
              className={`flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-2 text-sm sm:gap-3 sm:px-3 ${
                isCurrent
                  ? "border-purple-500/70 bg-purple-500/10 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-300"
              }`}
              role="group"
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
              <span className="hidden sm:block">{step}</span>
              {isCurrent ? (
                <span className="sm:hidden">{step}</span>
              ) : (
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-current opacity-50 sm:hidden"
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
