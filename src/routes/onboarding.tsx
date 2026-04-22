import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { EwaMark } from "@/components/ewa-logo";
import { PrimaryButton, SecondaryButton } from "@/components/auth-buttons";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Almost there — Ewà Biz" },
      { name: "description", content: "Resume your verification to go live." },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  { label: "Phone verified", done: true },
  { label: "Tell us about your craft", done: false, current: true },
  { label: "ID & license check", done: false },
  { label: "Go live", done: false },
];

/**
 * Mid-onboarding pro lands here on app open. Calm, reassuring — answers
 * the anxious question "did my verification go through, am I live yet?"
 * with a clear progress map and one obvious next action.
 */
function OnboardingPage() {
  return (
    <AuthShell topLabel="Almost there">
      <OnboardingBody />
    </AuthShell>
  );
}

function OnboardingBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const { completeOnboarding, reset } = useAuth();

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6">
      <div className="ewa-mark-in mt-4" style={{ paddingTop: "2vh" }}>
        <EwaMark size={36} />
      </div>

      <div className="ewa-rise mt-8" style={{ animationDelay: "120ms" }}>
        <h1
          style={{
            fontFamily: SANS_STACK,
            fontWeight: 500,
            fontSize: 26,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: text,
            margin: 0,
            maxWidth: 320,
          }}
        >
          You&apos;re almost live.
        </h1>
        <p
          style={{
            fontFamily: SANS_STACK,
            fontSize: 13,
            lineHeight: 1.55,
            color: text,
            opacity: 0.62,
            marginTop: 10,
            maxWidth: 320,
          }}
        >
          Pick up where you left off. The rest takes about four minutes.
        </p>
      </div>

      <div className="ewa-rise mt-7 flex flex-col gap-3" style={{ animationDelay: "240ms" }}>
        {STEPS.map((s, i) => {
          const accent = s.current ? "#FF823F" : s.done ? "#FF823F" : text;
          const opacity = s.current ? 1 : s.done ? 0.85 : 0.45;
          return (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{
                border: `1px solid ${s.current ? "rgba(255,130,63,0.45)" : "rgba(255,255,255,0.08)"}`,
                backgroundColor: s.current ? "rgba(255,130,63,0.06)" : "transparent",
              }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  border: `1.5px solid ${s.done || s.current ? "#FF823F" : "rgba(255,255,255,0.18)"}`,
                  backgroundColor: s.done ? "#FF823F" : "transparent",
                  color: s.done ? "#061C27" : accent,
                  fontFamily: SANS_STACK,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span
                style={{
                  fontFamily: SANS_STACK,
                  fontSize: 14,
                  fontWeight: s.current ? 500 : 400,
                  color: text,
                  opacity,
                }}
              >
                {s.label}
              </span>
              {s.current ? (
                <span
                  className="ml-auto"
                  style={{
                    fontFamily: SANS_STACK,
                    fontSize: 10,
                    letterSpacing: "1.6px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: "#FF823F",
                  }}
                >
                  Next
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="ewa-rise mb-4 flex flex-col gap-2.5" style={{ animationDelay: "440ms" }}>
        <PrimaryButton
          onClick={() => {
            // Demo: skip to "active" so you can see the active-pro path
            completeOnboarding();
            navigate({ to: "/home" });
          }}
        >
          Resume verification
        </PrimaryButton>
        <SecondaryButton
          onClick={() => {
            reset();
            navigate({ to: "/welcome" });
          }}
        >
          Sign out
        </SecondaryButton>
      </div>
    </div>
  );
}