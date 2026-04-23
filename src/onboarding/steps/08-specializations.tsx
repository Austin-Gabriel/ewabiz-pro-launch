import { useState, useMemo } from "react";
import { StepShell } from "../step-shell";
import { Chip, BigInput } from "../inputs";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { SERVICE_CATALOG, SPECIALIZATIONS, useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

export function Step8Specializations({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [picked, setPicked] = useState<string[]>(data.specializations ?? []);
  const [custom, setCustom] = useState<string>(data.customSpecialty ?? "");
  const [showCustom, setShowCustom] = useState<boolean>(Boolean(data.customSpecialty));

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

  const submit = () => {
    patch({
      specializations: picked,
      customSpecialty: custom.trim() ? custom.trim() : undefined,
    });
    onNext();
  };

  return (
    <StepShell
      step={5}
      title="What&apos;s your specialty?"
      subtitle="The techniques you&apos;re known for. This powers client matching."
      onContinue={submit}
      canContinue
      secondaryLabel="Skip for now"
      onSecondary={onNext}
    >
      <SpecBody
        grouped={grouped}
        picked={picked}
        toggle={toggle}
        custom={custom}
        setCustom={setCustom}
        showCustom={showCustom}
        setShowCustom={setShowCustom}
      />
    </StepShell>
  );
}

function SpecBody({
  grouped,
  picked,
  toggle,
  custom,
  setCustom,
  showCustom,
  setShowCustom,
}: {
  grouped: { slug: string; label: string; items: string[] }[];
  picked: string[];
  toggle: (label: string) => void;
  custom: string;
  setCustom: (v: string) => void;
  showCustom: boolean;
  setShowCustom: (v: boolean) => void;
}) {
  const { text } = useAuthTheme();
  return (
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

        {grouped.length > 0 ? (
          <div className="mt-1">
            {showCustom ? (
              <div className="flex flex-col gap-2">
                <BigInput
                  autoFocus
                  placeholder="e.g. Sisterlocks, Russian volume lashes"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  label="Your specialty"
                />
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: SANS_STACK, fontSize: 11, color: text, opacity: 0.5 }}>
                    We'll review and may add it to the menu.
                  </span>
                  {custom ? (
                    <button
                      type="button"
                      onClick={() => { setCustom(""); setShowCustom(false); }}
                      style={{
                        marginLeft: "auto",
                        fontFamily: SANS_STACK, fontSize: 11.5, fontWeight: 500, color: "#FF823F",
                      }}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="self-start transition-opacity active:opacity-70"
                style={{
                  fontFamily: SANS_STACK,
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "#FF823F",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                  textDecorationThickness: 1,
                  background: "transparent",
                  padding: 0,
                }}
              >
                Don't see your specialty? Tell us.
              </button>
            )}
          </div>
        ) : null}
    </div>
  );
}
