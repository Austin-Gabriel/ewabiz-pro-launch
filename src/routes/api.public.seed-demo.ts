import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/admin.server";

const DEMO_EMAIL = "test@ewa.app";
const DEMO_PASSWORD = "test1234";

/**
 * Idempotently provisions the demo reviewer account so the preview never
 * has to sign up from scratch between rebuilds.
 *
 *   email: test@ewa.app
 *   password: test1234
 *
 * Pre-marked as onboarding_complete so the first tap lands directly in
 * the live dashboard with mock bookings + stats.
 */
export const Route = createFileRoute("/api/public/seed-demo")({
  server: {
    handlers: {
      POST: async () => {
        try {
          // listUsers is paginated; one page (default 50) is plenty for our use.
          const { data: list } = await supabaseAdmin.auth.admin.listUsers();
          const existing = list?.users.find((u) => u.email === DEMO_EMAIL);
          if (existing) {
            return Response.json({ ok: true, seeded: false });
          }
          const { error } = await supabaseAdmin.auth.admin.createUser({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            email_confirm: true,
            user_metadata: {
              full_name: "Demo Pro",
              display_name: "Demo",
              services: ["hair", "nails"],
              onboarding_complete: true,
            },
          });
          if (error) {
            return Response.json({ ok: false, error: error.message }, { status: 500 });
          }
          return Response.json({ ok: true, seeded: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
});