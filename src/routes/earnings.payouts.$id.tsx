import { createFileRoute, useParams } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { PayoutDetailPage } from "@/earnings/payout-detail-page";

export const Route = createFileRoute("/earnings/payouts/$id")({
  head: () => ({ meta: [{ title: "Payout — Ewà Biz" }] }),
  component: PayoutDetailRoute,
});

function PayoutDetailRoute() {
  const { id } = useParams({ from: "/earnings/payouts/$id" });
  return (
    <RequireAuth>
      <PayoutDetailPage payoutId={id} />
    </RequireAuth>
  );
}
