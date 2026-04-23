import { useNavigate } from "@tanstack/react-router";
import { StepShell } from "../step-shell";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { SERVICE_CATALOG, EXPERIENCE_OPTIONS, useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

export function Step14Review({ onNext }: StepProps) {
  const { data } = useOnboarding();
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
    { step: 1, label: "Name", value: [data.firstName, data.lastName].filter(Boolean).join(" ") || "—" },
    { step: 1, label: "Date of birth", value: data.dob ?? "—" },
    { step: 2, label: "About your craft", value: data.craft || "—" },
    { step: 3, label: "Services", value: services || "—" },
    { step: 4, label: "Experience", value: expLabel || "—" },
    { step: 5, label: "Specializations", value: (data.specializations ?? []).join(", ") || "—" },
    { step: 6, label: "Base address", value: data.addressLine || data.area?.label || "—" },
    { step: 6, label: "Travel radius", value: data.area ? `${data.area.radiusMi} mi` : "—" },
    { step: 7, label: "Availability", value: days },
    { step: 8, label: "Service menu", value: `${data.menu?.length ?? 0} item${(data.menu?.length ?? 0) === 1 ? "" : "s"}` },
    { step: 9, label: "Portfolio", value: `${data.portfolio?.length ?? 0} photo${(data.portfolio?.length ?? 0) === 1 ? "" : "s"}` },
  ];

  return (
    <StepShell
      step={10}
      title="Review and continue."
      subtitle="Looks good? Next we'll verify your identity."
      onContinue={onNext}
      canContinue
      ctaLabel="Continue to verification"
      quietBg={false}
    >
      <ReviewBody sections={sections} goEdit={goEdit} />
    </StepShell>
  );
}

function ReviewBody({
  sections,
  goEdit,
}: {
  sections: { step: number; label: string; value: string }[];
  goEdit: (step: number) => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
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
  );
}
