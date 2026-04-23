import { useState } from "react";
import { StepShell } from "../step-shell";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { DEFAULT_AVAILABILITY, useOnboarding, type WeekDay, type WeeklyAvailability } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

const DAYS: { key: WeekDay; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export function Step11Availability({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [w, setW] = useState<WeeklyAvailability>(data.availability ?? DEFAULT_AVAILABILITY);

  const update = (k: WeekDay, next: Partial<typeof w[WeekDay]>) =>
    setW((prev) => ({ ...prev, [k]: { ...prev[k], ...next } }));

  const submit = () => { patch({ availability: w }); onNext(); };

  return (
    <StepShell
      step={7}
      title="Your weekly hours."
      subtitle="We&apos;ve set a common pro schedule. Adjust whatever doesn&apos;t fit."
      onContinue={submit}
      canContinue
    >
      <AvailabilityBody w={w} update={update} />
    </StepShell>
  );
}

function AvailabilityBody({
  w,
  update,
}: {
  w: WeeklyAvailability;
  update: (k: WeekDay, next: Partial<WeeklyAvailability[WeekDay]>) => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
    <div className="flex flex-col">
        {DAYS.map((d) => {
          const day = w[d.key];
          return (
            <div
              key={d.key}
              className="flex items-center gap-3 py-3"
              style={{ borderBottom: `1px solid ${borderCol}` }}
            >
              <button
                type="button"
                onClick={() => update(d.key, { enabled: !day.enabled })}
                className="transition-opacity active:opacity-70"
                style={{
                  width: 80, textAlign: "left",
                  fontFamily: SANS_STACK, fontSize: 14,
                  fontWeight: day.enabled ? 500 : 400,
                  color: day.enabled ? text : text, opacity: day.enabled ? 1 : 0.45,
                }}
              >
                {d.label}
              </button>
              {day.enabled ? (
                <div className="flex flex-1 items-center justify-end gap-2">
                  <TimeBox value={day.start} onChange={(v) => update(d.key, { start: v })} />
                  <span style={{ color: text, opacity: 0.4 }}>–</span>
                  <TimeBox value={day.end} onChange={(v) => update(d.key, { end: v })} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => update(d.key, { enabled: true })}
                  className="ml-auto"
                  style={{ fontFamily: SANS_STACK, fontSize: 12, color: "#FF823F", fontWeight: 500 }}
                >
                  + Add hours
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}

function TimeBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { text, borderCol } = useAuthTheme();
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent outline-none"
      style={{
        fontFamily: SANS_STACK, fontSize: 13, color: text,
        padding: "6px 10px", borderRadius: 8,
        border: `1px solid ${borderCol}`,
      }}
    />
  );
}
