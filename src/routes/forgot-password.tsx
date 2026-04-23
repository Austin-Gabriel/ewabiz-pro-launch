import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton } from "@/auth/auth-buttons";
import { AuthInput } from "@/auth/auth-input";
import { useAuth } from "@/auth/auth-context";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Ewà Biz" },
      { name: "description", content: "Send a reset link to your email." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const navigate = useNavigate();
  return (
    <AuthShell topLabel="Reset password" onBack={() => navigate({ to: "/login" })} quietSquiggles>
      <ForgotBody />
    </AuthShell>
  );
}

function ForgotBody() {
  const { text } = useAuthTheme();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const valid = /\S+@\S+\.\S+/.test(email);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await sendPasswordReset(email);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6">
      <div className="ewa-rise mt-10" style={{ animationDelay: "120ms" }}>
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
          {sent ? "Check your inbox." : "Reset your password."}
        </h1>
        <p
          style={{
            fontFamily: SANS_STACK,
            fontSize: 13,
            lineHeight: 1.5,
            color: text,
            opacity: 0.6,
            marginTop: 8,
          }}
        >
          {sent
            ? `We sent a link to ${email}. Tap it to set a new password.`
            : "We'll email you a secure link to choose a new password."}
        </p>
      </div>

      {!sent ? (
        <div className="ewa-rise mt-8" style={{ animationDelay: "240ms" }}>
          <AuthInput
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            autoFocus
          />
        </div>
      ) : null}

      {error ? (
        <p
          className="mt-3 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12, color: "#FF6B5B" }}
        >
          {error}
        </p>
      ) : null}

      <div className="flex-1" />

      <div className="ewa-rise mb-4 flex flex-col gap-2" style={{ animationDelay: "380ms" }}>
        {sent ? (
          <Link
            to="/login"
            className="block text-center"
            style={{ fontFamily: SANS_STACK, fontSize: 13, color: "#FF823F", fontWeight: 600 }}
          >
            Back to sign in →
          </Link>
        ) : (
          <PrimaryButton onClick={submit} disabled={!valid || busy}>
            {busy ? "Sending…" : "Send reset link"}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}