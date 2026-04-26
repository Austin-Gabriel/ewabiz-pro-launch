import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { PayoutHistoryPage } from "@/earnings/payout-history-page";

export const Route = createFileRoute("/earnings/payouts")({
  head: () => ({ meta: [{ title: "Payout history — Ewà Biz" }] }),
  component: PayoutsRoute,
});

function PayoutsRoute() {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, "");
  const isRoot = path === "/earnings/payouts";
  return (
    <RequireAuth>
      {isRoot ? <PayoutHistoryPage /> : <Outlet />}
    </RequireAuth>
  );
}
