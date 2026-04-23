import { useEffect, useRef, useState } from "react";
import { StepShell } from "../step-shell";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

export function Step3Otp({ onNext }: StepProps) {
  const { data } = useOnboarding();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendIn, setResendIn] = useState(30);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const code = digits.join("");
  const complete = code.length === 6;

  useEffect(() => {
    if (complete) {
      const t = setTimeout(onNext, 350);
      return () => clearTimeout(t);
    }
  }, [complete, onNext]);

  const change = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "").slice(-1);
    setDigits((p) => { const n = [...p]; n[i] = v; return n; });
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const paste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!p) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < p.length; i++) next[i] = p[i];
    setDigits(next);
    refs.current[Math.min(p.length, 5)]?.focus();
  };

  return (
    <StepShell
      step={2}
      title="Enter the 6-digit code."
      subtitle={<>Sent to <span style={{ fontWeight: 500 }}>{data.phone ?? "your phone"}</span>.</>}
      onContinue={onNext}
      canContinue={complete}
      ctaLabel={complete ? "Verifying…" : "Continue"}
    >
      <OtpBody
        digits={digits}
        refs={refs}
        change={change}
        paste={paste}
        resendIn={resendIn}
        onResend={() => { setResendIn(30); setDigits(["","","","","",""]); refs.current[0]?.focus(); }}
      />
    </StepShell>
  );
}

function OtpBody({
  digits, refs, change, paste, resendIn, onResend,
}: {
  digits: string[];
  refs: React.MutableRefObject<Array<HTMLInputElement | null>>;
  change: (i: number, raw: string) => void;
  paste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  resendIn: number;
  onResend: () => void;
}) {
  const { text, borderCol } = useAuthTheme();
  return (
    <>
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={d}
            onChange={(e) => change(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
            onPaste={paste}
            className="text-center transition-all duration-200"
            style={{
              width: "13.5%", aspectRatio: "1",
              borderRadius: 14,
              border: `1px solid ${d ? "#FF823F" : borderCol}`,
              backgroundColor: d ? "rgba(255,130,63,0.06)" : "transparent",
              color: text,
              fontFamily: SANS_STACK,
              fontSize: 22, fontWeight: 500, outline: "none",
            }}
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        {resendIn > 0 ? (
          <span style={{ fontFamily: SANS_STACK, fontSize: 12, color: text, opacity: 0.45 }}>
            Resend in {resendIn}s
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            style={{ fontFamily: SANS_STACK, fontSize: 12, fontWeight: 500, color: "#FF823F" }}
          >
            Resend code
          </button>
        )}
      </div>
    </>
  );
}
