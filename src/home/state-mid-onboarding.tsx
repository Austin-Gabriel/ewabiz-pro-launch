import { useNavigate } from "@tanstack/react-router";
import { HOME_SANS, HOME_SERIF, useHomeTheme } from "./home-shell";
import { PrimaryButton, SecondaryButton } from "@/auth/auth-buttons";
import { EwaMark } from "@/components/ewa-logo";

/**
 * Mid-onboarding gate. The pro hasn't finished signup or KYC, so we don't
 * pretend they have a studio. Warm, unrushed "pick up where you left off."
 */
export function StateMidOnboarding({
  resumeStep,
  totalSteps,
  firstName,
  resumeTo,
}: {
  resumeStep: number;
  totalSteps: number;
  firstName?: string;
  /** "onboarding" | "kyc" — which surface to send them back into. */
  resumeTo: "onboarding" | "kyc";
}) {
  const { text, isDark, borderCol } = useHomeTheme();
  const navigate = useNavigate();
  const pct = Math.min(100, Math.round((resumeStep / totalSteps) * 100));

  const headline =
    resumeTo === "kyc"
      ? "One more step before you open."
      : "Let's finish setting up your studio.";
  const sub =
    resumeTo === "kyc"
      ? "Verify your identity so payouts land in your account, not someone else's."
      : "A few more questions and your booking page goes live.";

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6 pt-2">
      <div className="ewa-mark-in flex items-center gap-3" style={{ marginTop: 8 }}>
        <EwaMark size={36} />
        <div style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.45, fontWeight: 600 }}>
          Welcome back{firstName ? `, ${firstName}` : ""}
        </div>
      </div>

      <h1
        className="ewa-rise"
        style={{
          fontFamily: HOME_SERIF,
          fontWeight: 400,
          fontSize: 34,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: text,
          margin: "28px 0 0 0",
          maxWidth: 320,
          animationDelay: "120ms",
        }}
      >
        {headline}
      </h1>
      <p
        className="ewa-fade"
        style={{
          fontFamily: HOME_SANS,
          fontSize: 14,
          lineHeight: 1.55,
          color: text,
          opacity: 0.65,
          maxWidth: 320,
          marginTop: 12,
          animationDelay: "240ms",
        }}
      >
        {sub}
      </p>

      {/* Progress card */}
      <div
        className="ewa-rise mt-8 rounded-2xl px-4 py-4"
        style={{
          backgroundColor: isDark ? "rgba(240,235,216,0.04)" : "rgba(6,28,39,0.035)",
          border: `1px solid ${borderCol}`,
          animationDelay: "340ms",
        }}
      >
        <div className="flex items-baseline justify-between">
          <div style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.4px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 600 }}>
            Your progress
          </div>
          <div style={{ fontFamily: HOME_SANS, fontSize: 12, color: "#FF823F", fontWeight: 600 }}>
            {pct}%
          </div>
        </div>
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: isDark ? "rgba(240,235,216,0.08)" : "rgba(6,28,39,0.08)" }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FF823F 0%, #FFA86E 100%)",
              transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              boxShadow: "0 0 12px rgba(255,130,63,0.45)",
            }}
          />
        </div>
        <div style={{ fontFamily: HOME_SANS, fontSize: 13, color: text, opacity: 0.7, marginTop: 12 }}>
          You left off on{" "}
          <span style={{ color: text, opacity: 1, fontWeight: 500 }}>
            step {resumeStep} of {totalSteps}
          </span>
          .
        </div>
      </div>

      <div className="flex-1" />

      <div className="ewa-rise mb-4 flex flex-col gap-2.5" style={{ animationDelay: "460ms" }}>
        <PrimaryButton
          onClick={() => {
            if (resumeTo === "kyc") navigate({ to: "/kyc" });
            else navigate({ to: "/onboarding" });
          }}
        >
          Pick up where I left off
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate({ to: "/welcome" })}>
          Save and continue later
        </SecondaryButton>
      </div>
    </div>
  );
}