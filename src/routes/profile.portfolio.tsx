import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { PortfolioManagePage } from "@/profile/portfolio-manage-page";

export const Route = createFileRoute("/profile/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Ewà Biz" }] }),
  component: () => (
    <RequireAuth>
      <PortfolioManagePage />
    </RequireAuth>
  ),
});