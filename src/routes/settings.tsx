import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { SettingsPage } from "@/settings/settings-page";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Ewà Biz" }] }),
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});
