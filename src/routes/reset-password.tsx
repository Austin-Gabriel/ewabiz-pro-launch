import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { PrimaryButton } from "@/auth/auth-buttons";
import { AuthInput } from "@/auth/auth-input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password — Ewà Biz" }] }),
  component: ResetPage,
});

function ResetPage() {
  return (
    <AuthShell topLabel="New password" quietSquiggles>
      <ResetBody />
    </AuthShell>
  );
}

function ResetBody() {
  const { text } = useAuthTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // Wait for Supabase to detect the recovery token from the URL hash.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const valid = password.length >= 6 && password === confirm;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    window.setTimeout(() => navigate({ to: "/login" }), 1200);
  };

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-6">
      <div className="ewa-rise mt-10" style={{ animationDelay: "120ms" }}>
        <h1
          style={{
            fontFamily: SANS_STACK,
            fontWeight: 500,
            fontSize: 26,
            color: text,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {done ? "Password updated." : "Choose a new password."}
        </h1>
        <p
          style={{
            fontFamily: SANS_STACK,
            fontSize: 13,
            color: text,
            opacity: 0.6,
            marginTop: 8,
          }}
        >
          {done
            ? "Redirecting you to sign in…"
            : ready
              ? "Pick something memorable. At least 6 characters."
              : "Verifying your reset link…"}
        </p>
      </div>

      {!done && ready ? (
        <div className="ewa-rise mt-8 flex flex-col gap-4" style={{ animationDelay: "240ms" }}>
          <AuthInput
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AuthInput
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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

      {!done && ready ? (
        <div className="ewa-rise mb-4" style={{ animationDelay: "360ms" }}>
          <PrimaryButton onClick={submit} disabled={!valid || busy}>
            {busy ? "Saving…" : "Update password"}
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}