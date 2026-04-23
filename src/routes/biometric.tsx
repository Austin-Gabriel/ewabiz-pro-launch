import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { EwaMark } from "@/components/ewa-logo";
import { useAuth } from "@/auth/auth-context";
import { RequireAuth } from "@/auth/require-auth";

export const Route = createFileRoute("/biometric")({
  head: () => ({ meta: [{ title: "Unlock — Ewà Biz" }] }),
  component: BiometricRoute,
});

function BiometricRoute() {
  return (
    <RequireAuth>
      <BiometricPage />
    </RequireAuth>
  );
}

/**
 * "Walking into your own studio." Active pros land here from splash if a
 * session + biometric exist. One tap (or auto-prompt) unlocks → /home.
 */
function BiometricPage() {
  return (
    <AuthShell>
      <BiometricBody />
    </AuthShell>
  );
}

function BiometricBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const { displayName, reset } = useAuth();
  const [unlocking, setUnlocking] = useState(false);

  const tryUnlock = () => {
    setUnlocking(true);
    window.setTimeout(() => navigate({ to: "/home" }), 700);
  };

  useEffect(() => {
    // Auto-prompt after the brand moment settles, like a native sheet.
    const t = window.setTimeout(tryUnlock, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-8">
      <div className="ewa-mark-in">
        <div className={unlocking ? "ewa-breathe" : ""}>
          <EwaMark size={64} />
        </div>
      </div>

      <h1
        className="ewa-rise mt-7 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: "-0.02em",
          color: text,
          margin: 0,
          animationDelay: "200ms",
        }}
      >
        Welcome back{displayName ? `, ${displayName}` : ""}.
      </h1>
      <p
        className="ewa-fade mt-2 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 13,
          color: text,
          opacity: 0.55,
          animationDelay: "320ms",
        }}
      >
        {unlocking ? "Unlocking your studio…" : "Look at your camera to unlock."}
      </p>

      <button
        type="button"
        onClick={tryUnlock}
        className="ewa-rise mt-10 flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95"
        style={{
          animationDelay: "440ms",
          backgroundColor: "rgba(255,130,63,0.1)",
          border: `1.5px solid rgba(255,130,63,0.45)`,
          boxShadow: "0 0 44px 0 rgba(255,130,63,0.25)",
        }}
        aria-label="Unlock with Face ID"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8V6a1 1 0 0 1 1-1h2" />
          <path d="M19 8V6a1 1 0 0 0-1-1h-2" />
          <path d="M5 16v2a1 1 0 0 0 1 1h2" />
          <path d="M19 16v2a1 1 0 0 1-1 1h-2" />
          <path d="M9 10v1" />
          <path d="M15 10v1" />
          <path d="M12 10v3" />
          <path d="M9 16c1 .8 2 1 3 1s2-.2 3-1" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => {
          reset();
          navigate({ to: "/welcome" });
        }}
        className="ewa-fade mt-8 transition-opacity hover:opacity-100"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 12,
          fontWeight: 500,
          color: text,
          opacity: 0.5,
          animationDelay: "600ms",
        }}
      >
        Use a different account
      </button>
    </div>
  );
}