import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { SettingsPlaceholderPage } from "@/settings/settings-placeholder";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Ewà Biz" }] }),
  component: () => (
    <RequireAuth>
      <SettingsPlaceholderPage />
    </RequireAuth>
  ),
});
