import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getOnboardingSnapshot } from "@/lib/onboarding-context";

/**
 * Bare /onboarding entry — resume at the furthest step the pro reached.
 * No standalone UI; this is purely a router redirect so the URL is shareable
 * and the back button always lands somewhere meaningful.
 */
export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/onboarding") return;
    const snap = getOnboardingSnapshot();
    const step = Math.max(1, snap.furthestStep ?? 1);
    navigate({ to: "/onboarding/$step", params: { step: String(step) }, replace: true });
  }, [location.pathname, navigate]);

  return <Outlet />;
}
