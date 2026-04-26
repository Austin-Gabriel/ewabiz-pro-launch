import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { RecentEarningsPage } from "@/earnings/recent-earnings-page";

export const Route = createFileRoute("/earnings/recent")({
  head: () => ({ meta: [{ title: "Recent earnings — Ewà Biz" }] }),
  component: () => (
    <RequireAuth>
      <RecentEarningsPage />
    </RequireAuth>
  ),
});