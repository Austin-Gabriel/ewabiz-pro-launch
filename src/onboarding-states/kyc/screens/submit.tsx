import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { KycShell } from "../kyc-shell";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";

/**
 * Final summary + submit. On submit we run a short "verifying" moment and
 * then route to one of the three result screens. The chosen outcome is
 * picker-controlled so the design review can preview every state without
 * needing a real provider.
 */
export function KycSubmit() {
  const { data, setStatus } = useKyc();
  const navigate = useNavigate();
  const [outcome, setOutcome] = useState<"approved" | "pending" | "rejected">("approved");
  const [submitting, setSubmitting] = useState(false);

  const ready =
    !!data.legalFirstName &&
    !!data.legalLastName &&
    !!data.dob &&
    !!data.ssnLast4 &&
    !!data.idFront &&
    !!data.idBack &&
    !!data.selfie;

  const submit = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      if (outcome === "approved") {
        setStatus("approved");
        navigate({ to: "/kyc/approved" });
      } else if (outcome === "pending") {
        setStatus("pending");
        navigate({ to: "/kyc/pending" });
      } else {
        setStatus("rejected");
        navigate({ to: "/kyc/rejected" });
      }
    }, 1400);
  };

  return (
    <KycShell
      step="submit"
      title={submitting ? "Verifying…" : "Submit for verification."}
      subtitle={
        submitting
          ? "Cross-checking your details. This usually takes a few seconds."
          : "Take one last look. We'll review and let you know."
      }
      onContinue={submit}
      canContinue={ready && !submitting}
      ctaLabel={submitting ? "Verifying…" : "Submit"}
    >
      <SubmitBody
        outcome={outcome}
        setOutcome={setOutcome}
        submitting={submitting}
      />
    </KycShell>
  );
}

function SubmitBody({
  outcome,
  setOutcome,
  submitting,
}: {
  outcome: "approved" | "pending" | "rejected";
  setOutcome: (o: "approved" | "pending" | "rejected") => void;
  submitting: boolean;
}) {
  const { text, borderCol } = useAuthTheme();
  const { data } = useKyc();

  const summary = [
    { label: "Legal name", value: [data.legalFirstName, data.legalLastName].filter(Boolean).join(" ") || "—" },
    { label: "Date of birth", value: data.dob ?? "—" },
    { label: "SSN", value: data.ssnLast4 ? `•••• ${data.ssnLast4}` : "—" },
    { label: "ID — front", value: data.idFront ? "Captured" : "—" },
    { label: "ID — back", value: data.idBack ? "Captured" : "—" },
    { label: "Selfie", value: data.selfie ? "Captured" : "—" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col">
        {summary.map((s) => (
          <div
            key={s.label}
            className="flex items-start justify-between gap-3 py-3"
            style={{ borderBottom: `1px solid ${borderCol}` }}
          >
            <div
              style={{
                fontFamily: SANS_STACK,
                fontSize: 10,
                letterSpacing: "1.6px",
                textTransform: "uppercase",
                fontWeight: 500,
                color: text,
                opacity: 0.55,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontFamily: SANS_STACK, fontSize: 13.5, color: text, textAlign: "right" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Preview-only outcome picker. Lets the design review walk every result
          state without needing a real verification backend. */}
      <div
        className="rounded-2xl px-4 py-3"
        style={{ border: `1px dashed rgba(255,130,63,0.45)`, backgroundColor: "rgba(255,130,63,0.05)" }}
      >
        <div
          style={{
            fontFamily: SANS_STACK,
            fontSize: 10,
            letterSpacing: "1.6px",
            textTransform: "uppercase",
            fontWeight: 500,
            color: "#FF823F",
            marginBottom: 8,
          }}
        >
          Preview outcome (mocked)
        </div>
        <div className="flex gap-2">
          {(["approved", "pending", "rejected"] as const).map((o) => (
            <button
              key={o}
              type="button"
              disabled={submitting}
              onClick={() => setOutcome(o)}
              className="flex-1 rounded-full py-2 transition-transform active:scale-95"
              style={{
                fontFamily: SANS_STACK,
                fontSize: 11.5,
                fontWeight: 500,
                textTransform: "capitalize",
                color: outcome === o ? "#061C27" : text,
                backgroundColor: outcome === o ? "#FF823F" : "transparent",
                border: `1px solid ${outcome === o ? "#FF823F" : borderCol}`,
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}