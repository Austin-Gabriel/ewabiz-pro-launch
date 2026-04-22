import { useNavigate } from "@tanstack/react-router";
import { StepShell } from "../step-shell";
import { useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { SERVICE_CATALOG, EXPERIENCE_OPTIONS, useOnboarding } from "@/lib/onboarding-context";
import type { StepProps } from "../step-router";

export function Step14Review({ onNext }: StepProps) {
  const { data } = useOnboarding();
  const { text, borderCol } = useAuthTheme();
  const navigate = useNavigate();

  const goEdit = (step: number) =>
    navigate({ to: "/onboarding/$step", params: { step: String(step) } });

  const services = (data.services ?? [])
    .map((s) => SERVICE_CATALOG.find((c) => c.slug === s)?.label)
    .filter(Boolean)
    .join(", ");

  const expLabel = EXPERIENCE_OPTIONS.find((e) => e.value === data.experience)?.label;

  const days = data.availability
    ? Object.entries(data.availability).filter(([, v]) => v.enabled).map(([k]) => k.toUpperCase()).join(" · ")
    : "—";

  const sections = [
    { step: 4, label: "Name", value: [data.firstName, data.lastName].filter(Boolean).join(" ") || "—" },
    { step: 4, label: "Date of birth", value: data.dob ?? "—" },
    { step: 2, label: "Phone", value: data.phone ?? "—" },
    { step: 5, label: "About your craft", value: data.craft || "—" },
    { step: 6, label: "Services", value: services || "—" },
    { step: 7, label: "Experience", value: expLabel || "—" },
    { step: 8, label: "Specializations", value: (data.specializations ?? []).join(", ") || "—" },
    { step: 9, label: "Service area", value: data.area ? `${data.area.label ?? "Base"} · ${data.area.radiusMi} mi` : "—" },
    { step: 11, label: "Availability", value: days },
    { step: 12, label: "Service menu", value: `${data.menu?.length ?? 0} item${(data.menu?.length ?? 0) === 1 ? "" : "s"}` },
    { step: 13, label: "Portfolio", value: `${data.portfolio?.length ?? 0} photo${(data.portfolio?.length ?? 0) === 1 ? "" : "s"}` },
  ];

  return (
    <StepShell
      step={14}
      title="Review and continue."
      subtitle="Looks good? Next we'll verify your identity."
      onContinue={onNext}
      canContinue
      ctaLabel="Continue to verification"
    >
      <div className="flex flex-col">
        {sections.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goEdit(s.step)}
            className="flex items-start gap-3 py-4 text-left transition-opacity active:opacity-70"
            style={{ borderBottom: `1px solid ${borderCol}` }}
          >
            <div className="flex-1">
              <div
                style={{
                  fontFamily: SANS_STACK, fontSize: 10, letterSpacing: "1.6px",
                  textTransform: "uppercase", fontWeight: 500, color: text, opacity: 0.5,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: SANS_STACK, fontSize: 14.5, color: text,
                  marginTop: 4, lineHeight: 1.4,
                }}
              >
                {s.value}
              </div>
            </div>
            <span style={{ fontFamily: SANS_STACK, fontSize: 12, color: "#FF823F", fontWeight: 500, paddingTop: 2 }}>
              Edit
            </span>
          </button>
        ))}
      </div>
    </StepShell>
  );
}
