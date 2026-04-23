import { useState } from "react";
import { StepShell } from "../step-shell";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { EXPERIENCE_OPTIONS, useOnboarding, type OnboardingData } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

export function Step7Experience({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [exp, setExp] = useState<OnboardingData["experience"]>(data.experience);

  const submit = () => { if (exp) { patch({ experience: exp }); onNext(); } };

  return (
    <StepShell
      step={4}
      title="How long, professionally?"
      subtitle="Helps us match you with the right kind of clients."
      onContinue={submit}
      canContinue={!!exp}
    >
      <ExperienceBody exp={exp} setExp={setExp} />
    </StepShell>
  );
}

function ExperienceBody({
  exp,
  setExp,
}: {
  exp: OnboardingData["experience"];
  setExp: (v: OnboardingData["experience"]) => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
    <div className="flex flex-col gap-2.5">
        {EXPERIENCE_OPTIONS.map((o) => {
          const selected = exp === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setExp(o.value)}
              className="text-left transition-all duration-200 active:scale-[0.99]"
              style={{
                padding: "16px 18px",
                borderRadius: 16,
                border: `1px solid ${selected ? "#FF823F" : borderCol}`,
                backgroundColor: selected ? "rgba(255,130,63,0.08)" : "transparent",
                color: text,
                fontFamily: SANS_STACK,
                fontSize: 15,
                fontWeight: selected ? 500 : 400,
              }}
            >
              {o.label}
            </button>
          );
        })}
    </div>
  );
}
