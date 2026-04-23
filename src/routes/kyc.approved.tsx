import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton } from "@/auth/auth-buttons";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import { useAuth } from "@/auth/auth-context";

export const Route = createFileRoute("/kyc/approved")({
  head: () => ({ meta: [{ title: "You're verified — Ewà Biz" }] }),
  component: ApprovedPage,
});

function ApprovedPage() {
  return (
    <AuthShell topLabel="Verified">
      <ApprovedBody />
    </AuthShell>
  );
}

function ApprovedBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const { setStatus } = useKyc();
  const { completeOnboarding } = useAuth();

  // Idempotent: if a pro lands here directly (preview), reflect approved.
  useEffect(() => {
    setStatus("approved");
    completeOnboarding();
  }, [setStatus, completeOnboarding]);

  return (
    <div className="relative z-[1] flex flex-1 flex-col items-center px-6">
      <div className="ewa-mark-in mt-16">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full ewa-breathe"
          style={{
            backgroundColor: "rgba(255,130,63,0.14)",
            border: "1.5px solid rgba(255,130,63,0.5)",
            boxShadow: "0 0 56px rgba(255,130,63,0.32)",
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
      </div>

      <h1
        className="ewa-rise mt-8 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontWeight: 500,
          fontSize: 28,
          letterSpacing: "-0.02em",
          color: text,
          margin: 0,
          maxWidth: 320,
          animationDelay: "180ms",
        }}
      >
        You're verified.
      </h1>
      <p
        className="ewa-fade mt-3 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 14,
          color: text,
          opacity: 0.65,
          maxWidth: 300,
          animationDelay: "320ms",
        }}
      >
        Your studio is ready. Bookings and payouts are now live.
      </p>

      <div className="flex-1" />

      <div
        className="ewa-rise mb-6 w-full"
        style={{ animationDelay: "440ms" }}
      >
        <PrimaryButton onClick={() => navigate({ to: "/home" })}>
          Open my studio
        </PrimaryButton>
      </div>
    </div>
  );
}