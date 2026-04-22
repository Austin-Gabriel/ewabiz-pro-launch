import { useState } from "react";
import { StepShell } from "../step-shell";
import { ToggleRow } from "../inputs";
import { DEFAULT_TRAVEL, useOnboarding } from "@/lib/onboarding-context";
import type { StepProps } from "../step-router";

export function Step10Travel({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [t, setT] = useState(data.travel ?? DEFAULT_TRAVEL);
  const submit = () => { patch({ travel: t }); onNext(); };

  return (
    <StepShell
      step={10}
      title="How do you see clients?"
      subtitle="Pick everything that applies. You can change this anytime."
      onContinue={submit}
      canContinue
    >
      <div>
        <ToggleRow label="I travel to clients" description="Mobile service, you bring the chair." on={t.travelToClients} onChange={(v) => setT({ ...t, travelToClients: v })} />
        <ToggleRow label="I accept home visits" description="Clients book you to come to their home." on={t.homeVisits} onChange={(v) => setT({ ...t, homeVisits: v })} />
        <ToggleRow label="I accept office visits" description="On-site at workplaces or co-working spaces." on={t.officeVisits} onChange={(v) => setT({ ...t, officeVisits: v })} />
        <ToggleRow label="I have a studio" description="Clients can book to come to your space." on={t.studio} onChange={(v) => setT({ ...t, studio: v })} />
      </div>
    </StepShell>
  );
}
