import { useState, useMemo } from "react";
import { StepShell } from "../step-shell";
import { Chip } from "../inputs";
import { useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { SERVICE_CATALOG, SPECIALIZATIONS, useOnboarding } from "@/lib/onboarding-context";
import type { StepProps } from "../step-router";

export function Step8Specializations({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const { text } = useAuthTheme();
  const [picked, setPicked] = useState<string[]>(data.specializations ?? []);

  const grouped = useMemo(() => {
    const services = data.services ?? [];
    return services
      .map((slug) => ({
        slug,
        label: SERVICE_CATALOG.find((s) => s.slug === slug)?.label ?? slug,
        items: SPECIALIZATIONS[slug] ?? [],
      }))
      .filter((g) => g.items.length > 0);
  }, [data.services]);

  const toggle = (label: string) =>
    setPicked((p) => (p.includes(label) ? p.filter((s) => s !== label) : [...p, label]));

  const submit = () => { patch({ specializations: picked }); onNext(); };

  return (
    <StepShell
      step={8}
      title="What&apos;s your specialty?"
      subtitle="The techniques you&apos;re known for. This powers client matching."
      onContinue={submit}
      canContinue
      secondaryLabel="Skip for now"
      onSecondary={onNext}
    >
      <div className="flex flex-col gap-6">
        {grouped.length === 0 ? (
          <p style={{ fontFamily: SANS_STACK, fontSize: 13, color: text, opacity: 0.6 }}>
            Pick at least one service first.
          </p>
        ) : (
          grouped.map((g) => (
            <div key={g.slug}>
              <div
                style={{
                  fontFamily: SANS_STACK, fontSize: 10, letterSpacing: "1.6px",
                  textTransform: "uppercase", fontWeight: 500, color: text, opacity: 0.5,
                  marginBottom: 10,
                }}
              >
                {g.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((label) => (
                  <Chip key={label} label={label} selected={picked.includes(label)} onToggle={() => toggle(label)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </StepShell>
  );
}
