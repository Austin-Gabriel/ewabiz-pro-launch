import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { StepShell } from "@/components/onboarding/step-shell";
import { Step14Review } from "@/components/onboarding/steps/14-review";
import { TOTAL_STEPS, getOnboardingSnapshot } from "@/lib/onboarding-context";

export const Route = createFileRoute("/onboarding/review")({
  beforeLoad: () => {
    // Bounce here straight to step 14 to keep one URL pattern.
    throw redirect({ to: "/onboarding/$step", params: { step: String(TOTAL_STEPS) } });
  },
  component: () => null,
});

// Suppress unused warnings — these stay imported in case we split review out later.
void StepShell;
void Step14Review;
void getOnboardingSnapshot;
void useNavigate;
