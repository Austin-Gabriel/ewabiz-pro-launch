import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { EwaMark } from "@/components/ewa-logo";
import { PrimaryButton } from "@/auth/auth-buttons";
import { AuthInput } from "@/auth/auth-input";
import { useAuth } from "@/auth/auth-context";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Ewà Biz" },
      { name: "description", content: "Start your verification journey to take trusted bookings." },
    ],
  }),
  component: JoinPage,
});

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

      <div className="ewa-rise mt-10" style={{ animationDelay: "120ms" }}>
        <h1
          style={{
            fontFamily: SANS_STACK,
            fontWeight: 500,
            fontSize: 28,
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
            color: text,
            margin: 0,
            maxWidth: 320,
          }}
        >
          Let&apos;s{" "}
          <span className="relative inline-block">
            begin
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
          Your number is how clients reach you. We&apos;ll send a code to confirm it&apos;s yours.
        </p>
      </div>

      <div className="ewa-rise mt-10" style={{ animationDelay: "260ms" }}>
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
          autoFocus
        />
      </div>

      <div className="flex-1" />

      <div className="ewa-rise mb-4" style={{ animationDelay: "380ms" }}>
        <PrimaryButton onClick={submit} disabled={!valid}>
          Continue
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
