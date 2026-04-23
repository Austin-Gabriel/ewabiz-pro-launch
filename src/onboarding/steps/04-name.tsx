import { useState } from "react";
import { StepShell } from "../step-shell";
import { BigInput } from "../inputs";
import { useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

export function Step4Name({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [first, setFirst] = useState(data.firstName ?? "");
  const [last, setLast] = useState(data.lastName ?? "");
  const [dob, setDob] = useState(data.dob ?? "");
  // Name was already captured at signup — only DOB gates progress.
  const valid = first.trim().length >= 2 && last.trim().length >= 2 && dob.length === 10;

  const submit = () => {
    if (!valid) return;
    patch({ firstName: first.trim(), lastName: last.trim(), dob });
    onNext();
  };

  return (
    <StepShell
      step={1}
      title="Confirm your details."
      subtitle="We pre-filled what you gave us at signup. Add your date of birth so we can verify your ID."
      onContinue={submit}
      canContinue={valid}
    >
      <div className="flex flex-col gap-7">
        <BigInput label="First name" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Maya" />
        <BigInput label="Last name" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Okafor" />
        <BigInput label="Date of birth" autoFocus type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
      </div>
    </StepShell>
  );
}
