import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { ProfilePage } from "@/profile/profile-page";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Ewà Biz" }] }),
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});
