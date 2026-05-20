import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton, SecondaryButton } from "@/auth/auth-buttons";
import { AuthInput } from "@/auth/auth-input";
import { useAuth } from "@/auth/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Ewà Biz" },
      { name: "description", content: "Sign in to your Ewà studio." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <AuthShell topLabel="Sign in" onBack={() => navigate({ to: "/welcome" })} quietSquiggles>
      <LoginBody />
    </AuthShell>
  );
}

function LoginBody() {
  const { text, borderCol } = useAuthTheme();
  const navigate = useNavigate();
  const { signInWithPassword, signInDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"none" | "login" | "demo">("none");

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = async () => {
    if (!valid || busy !== "none") return;
    setBusy("login");
    setError(null);
    const { error: err } = await signInWithPassword(email, password);
    setBusy("none");
    if (err) {
      setError(err);
      return;
    }
    navigate({ to: "/splash" });
  };

  const demo = async () => {
    if (busy !== "none") return;
    setBusy("demo");
    setError(null);
    const { error: err } = await signInDemo();
    setBusy("none");
    if (err) {
      setError(err);
      return;
    }
    navigate({ to: "/home" });
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6">
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
          Welcome back.
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
          Sign in to your studio.
        </p>
      </div>

      <div className="ewa-rise mt-7 flex flex-col gap-4" style={{ animationDelay: "260ms" }}>
        <AuthInput
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          to="/forgot-password"
          style={{
            fontFamily: SANS_STACK,
            fontSize: 12,
            color: "#FF823F",
            fontWeight: 500,
          }}
        >
          Forgot password?
        </Link>
      </div>

      {error ? (
        <p
          className="mt-3 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12, color: "#FF6B5B" }}
        >
          {error}
        </p>
      ) : null}

      <div className="flex-1" />

      <div className="ewa-rise mb-4 flex flex-col gap-2.5" style={{ animationDelay: "440ms" }}>
        <PrimaryButton onClick={submit} disabled={!valid || busy !== "none"}>
          {busy === "login" ? "Signing in…" : "Continue"}
        </PrimaryButton>
        <SecondaryButton onClick={demo} disabled={busy !== "none"}>
          {busy === "demo" ? "Loading demo…" : "⚡ Skip to demo"}
        </SecondaryButton>
        <p
          className="mt-2 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12.5, color: text, opacity: 0.6 }}
        >
          New here?{" "}
          <Link to="/signup" style={{ color: "#FF823F", fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>

      <DemoHint borderCol={borderCol} text={text} />
    </div>
  );
}

function DemoHint({ borderCol, text }: { borderCol: string; text: string }) {
  return (
    <div
      className="ewa-fade mb-2 rounded-xl px-3 py-2.5 text-center"
      style={{
        animationDelay: "560ms",
        border: `1px dashed ${borderCol}`,
      }}
    >
      <span style={{ fontFamily: SANS_STACK, fontSize: 11, color: text, opacity: 0.55 }}>
        Demo:{" "}
        <span style={{ color: text, opacity: 0.9, fontWeight: 600 }}>test@ewa.app</span>
        {" / "}
        <span style={{ color: text, opacity: 0.9, fontWeight: 600 }}>test1234</span>
      </span>
    </div>
  );
}