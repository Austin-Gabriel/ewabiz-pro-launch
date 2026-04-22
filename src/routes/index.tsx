import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Always start at the splash — splash performs the persona state
    // check and routes to /welcome, /onboarding, or /biometric.
    throw redirect({ to: "/splash" });
  },
});
