import { useState, type ChangeEvent } from "react";
import { KycShell } from "../kyc-shell";
import { AuthInput } from "@/auth/auth-input";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import { useOnboarding } from "@/onboarding/onboarding-context";
import type { KycScreenProps } from "@/routes/kyc.$step";

export function KycTax({ onNext }: KycScreenProps) {
  const { data, patch } = useKyc();
  const { data: onb } = useOnboarding();

  const [first, setFirst] = useState(data.legalFirstName ?? onb.firstName ?? "");
  const [last, setLast] = useState(data.legalLastName ?? onb.lastName ?? "");
  const [dob, setDob] = useState(data.dob ?? onb.dob ?? "");
  const [ssn, setSsn] = useState(data.ssnLast4 ?? "");

  const valid =
    first.trim().length > 0 &&
    last.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(dob) &&
    /^\d{4}$/.test(ssn);

  const submit = () => {
    if (!valid) return;
    patch({
      legalFirstName: first.trim(),
      legalLastName: last.trim(),
      dob,
      ssnLast4: ssn,
      status: "in_progress",
    });
    onNext();
  };

  return (
    <KycShell
      step="tax"
      title="Your legal details."
      subtitle="Required by your bank for payouts. Stored encrypted, never shown publicly."
      onContinue={submit}
      canContinue={valid}
    >
      <TaxBody
        first={first}
        setFirst={setFirst}
        last={last}
        setLast={setLast}
        dob={dob}
        setDob={setDob}
        ssn={ssn}
        setSsn={setSsn}
      />
    </KycShell>
  );
}

function TaxBody({
  first, setFirst, last, setLast, dob, setDob, ssn, setSsn,
}: {
  first: string; setFirst: (v: string) => void;
  last: string; setLast: (v: string) => void;
  dob: string; setDob: (v: string) => void;
  ssn: string; setSsn: (v: string) => void;
}) {
  const { text } = useAuthTheme();
  const onSsn = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setSsn(digits);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <AuthInput
          label="Legal first name"
          autoComplete="given-name"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />
        <AuthInput
          label="Legal last name"
          autoComplete="family-name"
          value={last}
          onChange={(e) => setLast(e.target.value)}
        />
      </div>
      <AuthInput
        label="Date of birth"
        type="date"
        autoComplete="bday"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
      />
      <AuthInput
        label="SSN — last 4"
        inputMode="numeric"
        autoComplete="off"
        placeholder="••••"
        value={ssn}
        onChange={onSsn}
      />
      <div
        className="mt-2 flex items-start gap-2 rounded-xl px-3 py-3"
        style={{
          backgroundColor: "rgba(255,130,63,0.05)",
          border: "1px solid rgba(255,130,63,0.18)",
        }}
      >
        <span style={{ color: "#FF823F", marginTop: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <span style={{ fontFamily: SANS_STACK, fontSize: 11.5, color: text, opacity: 0.7, lineHeight: 1.5 }}>
          Used only for IRS 1099 reporting. Not shared with clients or shown on your profile.
        </span>
      </div>
    </div>
  );
}