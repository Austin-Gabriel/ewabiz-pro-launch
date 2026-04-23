import { useState } from "react";
import { StepShell } from "../step-shell";
import { Chip } from "../inputs";
import { SERVICE_CATALOG, useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

export function Step6Services({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [picked, setPicked] = useState<string[]>(data.services ?? []);
  const toggle = (slug: string) =>
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));

  const submit = () => { patch({ services: picked }); onNext(); };

  return (
    <StepShell
      step={3}
      title="What do you offer?"
      subtitle="Pick all that apply. You can refine prices and durations later."
      onContinue={submit}
      canContinue={picked.length > 0}
    >
      <div className="flex flex-wrap gap-2">
        {SERVICE_CATALOG.map((s) => (
          <Chip key={s.slug} label={s.label} selected={picked.includes(s.slug)} onToggle={() => toggle(s.slug)} />
        ))}
      </div>
    </StepShell>
  );
}
