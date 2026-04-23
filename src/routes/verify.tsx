import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { EwaMark } from "@/components/ewa-logo";
import { PrimaryButton } from "@/auth/auth-buttons";
import { useAuth } from "@/auth/auth-context";

type VerifyMode = "sign-in" | "join";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>): { mode: VerifyMode } => {
    const mode = search.mode === "join" ? "join" : "sign-in";
    return { mode };
  },
  head: () => ({
    meta: [
      { title: "Verify — Ewà Biz" },
      { name: "description", content: "Enter the 6-digit code we just sent." },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const navigate = useNavigate();
  const { mode } = Route.useSearch();
  return (
    <AuthShell
      topLabel="Verify"
      onBack={() => navigate({ to: mode === "join" ? "/join" : "/sign-in" })}
    >
      <VerifyBody mode={mode} />
    </AuthShell>
  );
}

function VerifyBody({ mode }: { mode: VerifyMode }) {
  const { text, borderCol } = useAuthTheme();
  const navigate = useNavigate();
  const { identifier, completeRegistration, completeSignIn, state } = useAuth();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendIn, setResendIn] = useState(30);
  const [error, setError] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [resendIn]);

  const handleChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "").slice(-1);
    setError(false);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let k = 0; k < pasted.length; k++) next[k] = pasted[k];
    setDigits(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const code = digits.join("");
  const complete = code.length === 6;

  useEffect(() => {
    if (!complete) return;
    // Auto-submit + simulated verification
    const t = window.setTimeout(() => {
      if (code === "000000") {
        setError(true);
        return;
      }
      const id = identifier ?? "";
      if (mode === "join") {
        completeRegistration(id);
        navigate({ to: "/onboarding/$step", params: { step: "4" } });
      } else {
        completeSignIn(id);
        if (state === "onboarding") {
          navigate({ to: "/onboarding" });
        } else {
          navigate({ to: "/home" });
        }
      }
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, code]);

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6">
      <div className="ewa-mark-in mt-4 flex items-center" style={{ paddingTop: "2vh" }}>
        <EwaMark size={36} />
      </div>

      <div className="ewa-rise mt-8" style={{ animationDelay: "120ms" }}>
        <h1
          style={{
            fontFamily: SANS_STACK,
            fontWeight: 500,
            fontSize: 26,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: text,
            margin: 0,
          }}
        >
          Enter the 6-digit code.
        </h1>
        <p
          style={{
            fontFamily: SANS_STACK,
            fontSize: 13,
            lineHeight: 1.55,
            color: text,
            opacity: 0.6,
            marginTop: 8,
          }}
        >
          Sent to{" "}
          <span style={{ color: text, opacity: 0.9, fontWeight: 500 }}>
            {identifier || "your phone"}
          </span>
          .
        </p>
      </div>

      <div className="ewa-rise mt-8 flex justify-between gap-2" style={{ animationDelay: "260ms" }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="text-center transition-all duration-200"
            style={{
              width: "13.5%",
              aspectRatio: "1",
              borderRadius: 14,
              border: `1px solid ${error ? "#FF6B5B" : d ? "#FF823F" : borderCol}`,
              backgroundColor: d ? "rgba(255,130,63,0.06)" : "transparent",
              color: text,
              fontFamily: SANS_STACK,
              fontSize: 22,
              fontWeight: 500,
              outline: "none",
            }}
          />
        ))}
      </div>

      {error ? (
        <p
          className="mt-3 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12, color: "#FF6B5B" }}
        >
          That code didn&apos;t match. Try again.
        </p>
      ) : null}

      <div className="ewa-fade mt-6 text-center" style={{ animationDelay: "400ms" }}>
        {resendIn > 0 ? (
          <span style={{ fontFamily: SANS_STACK, fontSize: 12, color: text, opacity: 0.45 }}>
            Resend in {resendIn}s
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setResendIn(30);
              setDigits(["", "", "", "", "", ""]);
              refs.current[0]?.focus();
            }}
            style={{
              fontFamily: SANS_STACK,
              fontSize: 12,
              fontWeight: 500,
              color: "#FF823F",
            }}
          >
            Resend code
          </button>
        )}
      </div>

      <div className="flex-1" />

      <div className="ewa-rise mb-4" style={{ animationDelay: "520ms" }}>
        <PrimaryButton
          disabled={!complete}
          onClick={() => {
            if (!complete) return;
            // Trigger via state — same path as auto-submit
            setDigits([...digits]);
          }}
        >
          {complete ? "Verifying…" : "Continue"}
        </PrimaryButton>
      </div>
    </div>
  );
}