import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { EwaLockup } from "@/components/ewa-logo";
import { getAuthSnapshot } from "@/lib/auth-context";

export const Route = createFileRoute("/splash")({
  head: () => ({
    meta: [{ title: "Ewà Biz" }],
  }),
  component: SplashPage,
});

/**
 * Brand moment, ~1.6s. After the breath, route by persona:
 *   active     → /home (in production: prompt biometric first)
 *   onboarding → /onboarding (resume KYC)
 *   guest      → /welcome
 */
function SplashPage() {
  return (
    <AuthShell glowBoost={1.4}>
      <SplashBody />
    </AuthShell>
  );
}

function SplashBody() {
  const { isDark, text } = useAuthTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => {
      const snap = getAuthSnapshot();
      if (snap.state === "active") {
        navigate({ to: "/biometric" });
      } else if (snap.state === "onboarding") {
        navigate({ to: "/onboarding" });
      } else {
        navigate({ to: "/welcome" });
      }
    }, 1600);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-8">
      <div className="ewa-mark-in">
        <div className="ewa-breathe">
          <EwaLockup isDark={isDark} markSize={68} />
        </div>
      </div>
      <p
        className="ewa-fade mt-8 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontWeight: 400,
          fontSize: 12,
          letterSpacing: "0.04em",
          color: text,
          opacity: 0.5,
          animationDelay: "500ms",
        }}
      >
        Where craft meets clientele.
      </p>
    </div>
  );
}