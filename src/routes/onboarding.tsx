import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getOnboardingSnapshot } from "@/onboarding/onboarding-context";
import { RequireAuth } from "@/auth/require-auth";

/**
 * Bare /onboarding entry — resume at the furthest step the pro reached.
 * No standalone UI; this is purely a router redirect so the URL is shareable
 * and the back button always lands somewhere meaningful.
 */
export const Route = createFileRoute("/onboarding")({
  component: OnboardingRouteGuarded,
});

function OnboardingRouteGuarded() {
  return (
    <RequireAuth>
      <OnboardingRoute />
    </RequireAuth>
  );
}

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
