import { useState } from "react";
import { StepShell } from "../step-shell";
import { BigTextArea } from "../inputs";
import { useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

export function Step5Craft({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [craft, setCraft] = useState(data.craft ?? "");
  const submit = () => { patch({ craft: craft.trim() }); onNext(); };

  return (
    <StepShell
      step={2}
      title="How do you describe what you do?"
      subtitle="One or two sentences. Clients will read this on your profile."
      onContinue={submit}
      canContinue
      secondaryLabel="Skip for now"
      onSecondary={onNext}
    >
      <BigTextArea
        autoFocus
        value={craft}
        onChange={(e) => setCraft(e.target.value)}
        placeholder="I&apos;m a celebrity barber in Brooklyn focused on textured fades and beard sculpting."
      />
    </StepShell>
  );
}
