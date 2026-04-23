import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton, SecondaryButton } from "@/auth/auth-buttons";
import { RequireAuth } from "@/auth/require-auth";

export const Route = createFileRoute("/enable-faceid")({
  head: () => ({
    meta: [
      { title: "Enable Face ID — Ewà Biz" },
      { name: "description", content: "Sign in faster next time with Face ID." },
    ],
  }),
  component: EnableFaceIdRoute,
});

function EnableFaceIdRoute() {
  return (
    <RequireAuth>
      <EnableFaceIdPage />
    </RequireAuth>
  );
}

function EnableFaceIdPage() {
  return (
    <AuthShell topLabel="One last thing">
      <EnableFaceIdBody />
    </AuthShell>
  );
}

function EnableFaceIdBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();

  const enable = () => {
    // Mock: pretend OS prompt accepted; route into the studio.
    navigate({ to: "/biometric" });
  };
  const skip = () => navigate({ to: "/home" });

  return (
    <div className="relative z-[1] flex flex-1 flex-col items-center px-6">
      <div className="ewa-mark-in mt-14">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            backgroundColor: "rgba(255,130,63,0.12)",
            border: "1.5px solid rgba(255,130,63,0.45)",
            boxShadow: "0 0 48px 0 rgba(255,130,63,0.28)",
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8V6a1 1 0 0 1 1-1h2" />
            <path d="M19 8V6a1 1 0 0 0-1-1h-2" />
            <path d="M5 16v2a1 1 0 0 0 1 1h2" />
            <path d="M19 16v2a1 1 0 0 1-1 1h-2" />
            <path d="M9 10v1" /><path d="M15 10v1" /><path d="M12 10v3" />
            <path d="M9 16c1 .8 2 1 3 1s2-.2 3-1" />
          </svg>
        </div>
      </div>

      <h1
        className="ewa-rise mt-8 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontWeight: 500,
          fontSize: 26,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          color: text,
          margin: 0,
          maxWidth: 300,
          animationDelay: "180ms",
        }}
      >
        Sign in faster next time.
      </h1>
      <p
        className="ewa-fade mt-3 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 14,
          lineHeight: 1.5,
          color: text,
          opacity: 0.6,
          maxWidth: 300,
          animationDelay: "300ms",
        }}
      >
        Use Face ID to sign in with a glance.
      </p>

      <div className="flex-1" />

      <div
        className="ewa-rise mb-3 flex w-full flex-col gap-2.5"
        style={{ animationDelay: "440ms" }}
      >
        <PrimaryButton onClick={enable}>Enable Face ID</PrimaryButton>
        <SecondaryButton onClick={skip}>Not now</SecondaryButton>
      </div>
      <button
        type="button"
        onClick={skip}
        className="ewa-fade mb-4 transition-opacity hover:opacity-80"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 12,
          color: text,
          opacity: 0.5,
          animationDelay: "560ms",
        }}
      >
        You can change this in Settings.
      </button>
    </div>
  );
}