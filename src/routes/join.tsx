import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { EwaMark } from "@/components/ewa-logo";
import { PrimaryButton } from "@/components/auth-buttons";
import { AuthInput } from "@/components/auth-input";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Ewà Biz" },
      { name: "description", content: "Start your verification journey to take trusted bookings." },
    ],
  }),
  component: JoinPage,
});

const STEPS = [
  { n: "01", label: "Verify your phone" },
  { n: "02", label: "Tell us about your craft" },
  { n: "03", label: "ID & license check" },
  { n: "04", label: "Go live, take bookings" },
];

function JoinPage() {
  const navigate = useNavigate();
  return (
    <AuthShell topLabel="Join as a pro" onBack={() => navigate({ to: "/welcome" })}>
      <JoinBody />
    </AuthShell>
  );
}

function JoinBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const { setIdentifier } = useAuth();
  const [phone, setPhone] = useState("");
  const valid = phone.replace(/\D/g, "").length >= 7;

  const submit = () => {
    if (!valid) return;
    setIdentifier(phone);
    navigate({ to: "/verify", search: { mode: "join" } });
  };

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
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
            color: text,
            margin: 0,
            maxWidth: 320,
          }}
        >
          Let&apos;s get you{" "}
          <span className="relative inline-block">
            verified
            <span
              aria-hidden
              className="absolute left-0 ewa-underline-anim"
              style={{
                bottom: -3,
                height: 2,
                width: "100%",
                backgroundColor: "#FF823F",
                borderRadius: 2,
                animationDelay: "700ms",
              }}
            />
          </span>
          .
        </h1>
        <p
          style={{
            fontFamily: SANS_STACK,
            fontSize: 13,
            lineHeight: 1.55,
            color: text,
            opacity: 0.62,
            marginTop: 10,
            maxWidth: 320,
          }}
        >
          Ewà Biz is invite-grade. We verify every pro before they go live —
          your clients can trust who they&apos;re booking, and so can you.
        </p>
      </div>

      {/* What happens next preview */}
      <div
        className="ewa-rise mt-7 rounded-2xl px-4 py-4"
        style={{
          animationDelay: "240ms",
          border: `1px solid rgba(255,130,63,0.18)`,
          backgroundColor: "rgba(255,130,63,0.04)",
        }}
      >
        <div
          style={{
            fontFamily: SANS_STACK,
            fontSize: 10,
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#FF823F",
            marginBottom: 12,
          }}
        >
          What happens next · ~6 min
        </div>
        <ol className="flex flex-col gap-2.5">
          {STEPS.map((s) => (
            <li key={s.n} className="flex items-baseline gap-3">
              <span
                style={{
                  fontFamily: SANS_STACK,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#FF823F",
                  opacity: 0.85,
                  width: 18,
                }}
              >
                {s.n}
              </span>
              <span
                style={{
                  fontFamily: SANS_STACK,
                  fontSize: 13,
                  fontWeight: 400,
                  color: text,
                  opacity: 0.85,
                }}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="ewa-rise mt-7" style={{ animationDelay: "360ms" }}>
        <AuthInput
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1  •  555  •  000  •  0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </div>

      <div className="flex-1" />

      <div className="ewa-rise mb-4" style={{ animationDelay: "500ms" }}>
        <PrimaryButton onClick={submit} disabled={!valid}>
          Send verification code
        </PrimaryButton>
        <p
          className="mt-3 text-center"
          style={{
            fontFamily: SANS_STACK,
            fontSize: 10.5,
            color: text,
            opacity: 0.4,
            lineHeight: 1.5,
          }}
        >
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}