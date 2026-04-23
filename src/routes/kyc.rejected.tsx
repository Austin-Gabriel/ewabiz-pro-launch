import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton, SecondaryButton } from "@/auth/auth-buttons";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";

export const Route = createFileRoute("/kyc/rejected")({
  head: () => ({ meta: [{ title: "Couldn't verify — Ewà Biz" }] }),
  component: RejectedPage,
});

function RejectedPage() {
  return (
    <AuthShell topLabel="Action needed">
      <RejectedBody />
    </AuthShell>
  );
}

function RejectedBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const { data, setStatus, patch } = useKyc();

  useEffect(() => {
    setStatus("rejected");
  }, [setStatus]);

  const tryAgain = () => {
    // Clear capture artefacts so the pro re-shoots fresh.
    patch({ idFront: undefined, idBack: undefined, selfie: undefined, status: "in_progress", furthest: "id-front" });
    navigate({ to: "/kyc/$step", params: { step: "id-front" } });
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col items-center px-6">
      <div className="ewa-mark-in mt-16">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            backgroundColor: "rgba(255,120,90,0.12)",
            border: "1.5px solid rgba(255,120,90,0.45)",
            boxShadow: "0 0 44px rgba(255,120,90,0.25)",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF785A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
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
        We couldn't verify you yet.
      </h1>
      <p
        className="ewa-fade mt-3 text-center"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 14,
          lineHeight: 1.55,
          color: text,
          opacity: 0.65,
          maxWidth: 320,
          animationDelay: "320ms",
        }}
      >
        {data.rejectionReason ?? "Something didn't match. Try again with a clear, well-lit ID and selfie."}
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
          A few tips
        </div>
        <ul style={{ marginTop: 10, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Use bright, even light — no glare on the ID",
            "Place the ID on a dark, flat surface",
            "Look straight at the camera for the selfie",
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
        <PrimaryButton onClick={tryAgain}>Try again</PrimaryButton>
        <SecondaryButton onClick={() => navigate({ to: "/home" })}>
          I'll do this later
        </SecondaryButton>
      </div>
    </div>
  );
}