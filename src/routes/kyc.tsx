import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getKycSnapshot } from "@/onboarding-states/kyc/kyc-context";
import { RequireAuth } from "@/auth/require-auth";

/**
 * Bare /kyc entry — resume at the furthest step the pro reached. Mirrors
 * /onboarding's resume behaviour so the URL is shareable and back always
 * lands somewhere meaningful.
 */
export const Route = createFileRoute("/kyc")({
  component: KycRoute,
});

function KycRoute() {
  return (
    <RequireAuth>
      <KycLayout />
    </RequireAuth>
  );
}

function KycLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/kyc") return;
    const snap = getKycSnapshot();
    // If the verification has already concluded, route to the result screen.
    if (snap.status === "approved") {
      navigate({ to: "/kyc/approved", replace: true });
      return;
    }
    if (snap.status === "pending") {
      navigate({ to: "/kyc/pending", replace: true });
      return;
    }
    if (snap.status === "rejected") {
      navigate({ to: "/kyc/rejected", replace: true });
      return;
    }
    const step = snap.furthest ?? "intro";
    navigate({ to: "/kyc/$step", params: { step }, replace: true });
  }, [location.pathname, navigate]);

  return <Outlet />;
}