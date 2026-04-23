import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton, SecondaryButton } from "@/auth/auth-buttons";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";

export const Route = createFileRoute("/kyc/pending")({
  head: () => ({ meta: [{ title: "Under review — Ewà Biz" }] }),
  component: PendingPage,
});

function PendingPage() {
  return (
    <AuthShell topLabel="Under review">
      <PendingBody />
    </AuthShell>
  );
}

function PendingBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const { setStatus } = useKyc();

  useEffect(() => {
    setStatus("pending");
  }, [setStatus]);

  return (
    <div className="relative z-[1] flex flex-1 flex-col items-center px-6">
      <div className="ewa-mark-in mt-16">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            backgroundColor: "rgba(255,130,63,0.10)",
            border: "1.5px solid rgba(255,130,63,0.42)",
            boxShadow: "0 0 44px rgba(255,130,63,0.22)",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
      </div>

      <h1
        className="ewa-rise mt-8 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontWeight: 500,
          fontSize: 26,
          letterSpacing: "-0.02em",
          color: text,
          margin: 0,
          maxWidth: 320,
          animationDelay: "180ms",
        }}
      >
        We're reviewing your details.
      </h1>
      <p
        className="ewa-fade mt-3 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 14,
          lineHeight: 1.55,
          color: text,
          opacity: 0.65,
          maxWidth: 300,
          animationDelay: "320ms",
        }}
      >
        Usually under 24 hours. We'll text you the moment you're approved — your
        studio stays open in the meantime.
      </p>

      <div
        className="ewa-rise mt-8 w-full rounded-2xl px-4 py-4 text-left"
        style={{
          backgroundColor: "rgba(255,130,63,0.06)",
          border: "1px solid rgba(255,130,63,0.22)",
          animationDelay: "420ms",
        }}
      >
        <div style={{ fontFamily: SANS_STACK, fontSize: 11, letterSpacing: "1.4px", textTransform: "uppercase", color: text, opacity: 0.55, fontWeight: 500 }}>
          What works while we review
        </div>
        <ul style={{ marginTop: 10, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Edit your profile and service menu",
            "Preview your public booking page",
            "Bookings and payouts unlock once approved",
          ].map((line) => (
            <li key={line} style={{ fontFamily: SANS_STACK, fontSize: 13, color: text, opacity: 0.78, display: "flex", gap: 10 }}>
              <span style={{ color: "#FF823F" }}>•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1" />

      <div className="ewa-rise mb-5 mt-6 flex w-full flex-col gap-2.5" style={{ animationDelay: "560ms" }}>
        <PrimaryButton onClick={() => navigate({ to: "/home" })}>
          Continue to my studio
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate({ to: "/kyc/approved" })}>
          Preview: simulate approval
        </SecondaryButton>
      </div>
    </div>
  );
}