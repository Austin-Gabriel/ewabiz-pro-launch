import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { PayoutMethodPage } from "@/earnings/payout-method-page";

export const Route = createFileRoute("/earnings/payout-method")({
  head: () => ({ meta: [{ title: "Payout method — Ewà Biz" }] }),
  component: () => (
    <RequireAuth>
      <PayoutMethodPage />
    </RequireAuth>
  ),
});