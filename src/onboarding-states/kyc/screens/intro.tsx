import { useNavigate } from "@tanstack/react-router";
import { KycShell } from "../kyc-shell";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import type { KycScreenProps } from "@/routes/kyc.$step";

export function KycIntro({ onNext }: KycScreenProps) {
  return (
    <KycShell
      step="intro"
      title="Let's verify it's you."
      subtitle="A quick check unlocks bookings and payouts. Three minutes, no mailroom."
      onContinue={onNext}
      canContinue
      ctaLabel="Start verification"
      secondaryLabel="Do this later"
      onSecondary={() => undefined}
      quietBg={false}
    >
      <IntroBody />
    </KycShell>
  );
}

function IntroBody() {
  const { text, borderCol } = useAuthTheme();
  const navigate = useNavigate();

  // Override secondary inline so it routes home with state preserved.
  // (KycShell wires its own onSecondary; we instead inject a direct CTA below.)
  const items = [
    {
      label: "Government ID",
      caption: "Driver's license or passport",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="12" r="2.2" />
          <path d="M14 11h4" /><path d="M14 14h3" />
        </svg>
      ),
    },
    {
      label: "A quick selfie",
      caption: "We match it to your ID",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      ),
    },
    {
      label: "Tax info",
      caption: "Required by your bank for payouts",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ border: `1px solid ${borderCol}`, backgroundColor: "rgba(255,130,63,0.04)" }}
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,130,63,0.12)" }}
          >
            {it.icon}
          </span>
          <div className="flex flex-col">
            <div style={{ fontFamily: SANS_STACK, fontSize: 14, fontWeight: 500, color: text }}>
              {it.label}
            </div>
            <div style={{ fontFamily: SANS_STACK, fontSize: 12, color: text, opacity: 0.55, marginTop: 2 }}>
              {it.caption}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => navigate({ to: "/home" })}
        className="mt-4 self-start text-left transition-opacity hover:opacity-80"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 12.5,
          color: text,
          opacity: 0.55,
          fontWeight: 500,
        }}
      >
        Your details are encrypted and used only for verification.
      </button>
    </div>
  );
}