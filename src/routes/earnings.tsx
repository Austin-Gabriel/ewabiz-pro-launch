import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { EarningsHomePage } from "@/earnings/earnings-home-page";

export const Route = createFileRoute("/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Ewà Biz" }] }),
  component: EarningsRoute,
});

function EarningsRoute() {
  return (
    <RequireAuth>
      <EarningsHomePage />
    </RequireAuth>
  );
}