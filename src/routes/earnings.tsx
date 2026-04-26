import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { EarningsHomePage } from "@/earnings/earnings-home-page";

export const Route = createFileRoute("/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Ewà Biz" }] }),
  component: EarningsRoute,
});

function EarningsRoute() {
  return (
    <RequireAuth>
      <EarningsRouteInner />
    </RequireAuth>
  );
}

function EarningsRouteInner() {
  const location = useLocation();

  // `/earnings/recent`, `/earnings/payouts`, `/earnings/payout-method`,
  // `/earnings/tax-documents` are child routes of `/earnings`. When a child
  // is active, render the <Outlet /> so the child page appears instead of
  // re-rendering the home page (which looked like a reload to the user).
  // Normalize trailing slash so `/earnings/` still counts as the root.
  const path = location.pathname.replace(/\/+$/, "");
  const isRoot = path === "/earnings";
  if (!isRoot) {
    return <Outlet />;
  }

  return <EarningsHomePage />;
}