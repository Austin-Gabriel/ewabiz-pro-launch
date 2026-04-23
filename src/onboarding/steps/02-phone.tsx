import { useState } from "react";
import { StepShell } from "../step-shell";
import { BigInput } from "../inputs";
import { useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

const COUNTRIES = [
  { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+234", flag: "🇳🇬" },
  { code: "+27", flag: "🇿🇦" },
  { code: "+254", flag: "🇰🇪" },
];

export function Step2Phone({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const initial = data.phone ?? "";
  const [cc, setCc] = useState(initial.match(/^\+\d+/)?.[0] ?? "+1");
  const [num, setNum] = useState(initial.replace(/^\+\d+\s*/, ""));
  const valid = num.replace(/\D/g, "").length >= 7;

  const submit = () => {
    if (!valid) return;
    patch({ phone: `${cc} ${num}`.trim() });
    onNext();
  };

  return (
    <StepShell
      step={1}
      title={<>Let&apos;s get you set up.</>}
      subtitle="Start with your phone number — we'll text you a code."
      onContinue={submit}
      canContinue={valid}
      ctaLabel="Send code"
    >
      <div className="flex items-end gap-3">
        <select
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          className="bg-transparent outline-none"
          style={{
            height: 52,
            borderBottom: "1px solid currentColor",
            opacity: 0.85,
            fontFamily: '"Uncut Sans", system-ui, sans-serif',
            fontSize: 18,
            paddingRight: 6,
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} style={{ color: "#061C27" }}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <div className="flex-1">
          <BigInput
            type="tel"
            inputMode="tel"
            autoFocus
            placeholder="555 000 0000"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
      </div>
    </StepShell>
  );
}
