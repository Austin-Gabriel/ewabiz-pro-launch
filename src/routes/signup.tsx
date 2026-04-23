import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton } from "@/auth/auth-buttons";
import { AuthInput } from "@/auth/auth-input";
import { setPendingSignup } from "@/auth/signup-pending";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join Ewà Biz" },
      { name: "description", content: "Create your Ewà account." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  return (
    <AuthShell topLabel="Create account" onBack={() => navigate({ to: "/welcome" })} quietSquiggles>
      <SignUpBody />
    </AuthShell>
  );
}

function SignUpBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const valid =
    fullName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6 &&
    phone.replace(/\D/g, "").length >= 7;

  const submit = () => {
    if (!valid) return;
    // Stash account fields and continue to the dedicated "I am a…" screen.
    setPendingSignup({
      fullName: fullName.trim(),
      email,
      password,
      phone,
    });
    navigate({ to: "/signup/services" });
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6 pb-6">
      <div className="ewa-rise mt-6" style={{ animationDelay: "100ms" }}>
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
          Create your account.
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
          A few details so we can text you bookings and pay you out.
        </p>
      </div>

      <div className="ewa-rise mt-6 flex flex-col gap-4" style={{ animationDelay: "200ms" }}>
        <AuthInput
          label="Full name"
          autoComplete="name"
          placeholder="Jamie Carter"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthInput
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 555 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="flex-1" />

      <div className="ewa-rise mt-8 flex flex-col gap-2" style={{ animationDelay: "320ms" }}>
        <PrimaryButton onClick={submit} disabled={!valid}>
          Continue
        </PrimaryButton>
        <p
          className="mt-2 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 12.5, color: text, opacity: 0.6 }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#FF823F", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
        <p
          className="mt-1 text-center"
          style={{ fontFamily: SANS_STACK, fontSize: 10.5, color: text, opacity: 0.4, lineHeight: 1.5 }}
        >
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
