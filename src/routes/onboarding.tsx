import { createFileRoute, redirect } from "@tanstack/react-router";
import { getOnboardingSnapshot } from "@/lib/onboarding-context";

/**
 * Bare /onboarding entry — resume at the furthest step the pro reached.
 * No standalone UI; this is purely a router redirect so the URL is shareable
 * and the back button always lands somewhere meaningful.
 */
export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    const snap = getOnboardingSnapshot();
    const step = Math.max(1, snap.furthestStep ?? 1);
    throw redirect({ to: "/onboarding/$step", params: { step: String(step) } });
  },
  component: () => null,
});
