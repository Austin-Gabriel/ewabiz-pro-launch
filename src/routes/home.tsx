import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { EwaLockup } from "@/components/ewa-logo";
import { SecondaryButton } from "@/components/auth-buttons";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Home — Ewà Biz" }],
  }),
  component: HomePage,
});

/**
 * Placeholder home for the active-pro path. Real "respect their time"
 * dashboard is out of scope for the auth flow — but this confirms the
 * gate routes them here correctly.
 */
function HomePage() {
  return (
    <AuthShell topLabel="Home">
      <HomeBody />
    </AuthShell>
  );
}

function HomeBody() {
  const { isDark, text } = useAuthTheme();
  const navigate = useNavigate();
  const { displayName, identifier, reset } = useAuth();

  return (
    <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="ewa-mark-in">
        <EwaLockup isDark={isDark} markSize={56} />
      </div>
      <h1
        className="ewa-rise mt-8"
        style={{
          fontFamily: SANS_STACK,
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: "-0.02em",
          color: text,
          margin: 0,
          animationDelay: "200ms",
        }}
      >
        You&apos;re in, {displayName ?? "pro"}.
      </h1>
      <p
        className="ewa-fade mt-3"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 13,
          color: text,
          opacity: 0.6,
          animationDelay: "320ms",
          maxWidth: 280,
        }}
      >
        Your dashboard lives here. Bookings, schedule, payouts — built for
        the four minutes between clients.
      </p>
      {identifier ? (
        <p
          className="ewa-fade mt-2"
          style={{
            fontFamily: SANS_STACK,
            fontSize: 11,
            color: text,
            opacity: 0.35,
            animationDelay: "400ms",
          }}
        >
          Signed in as {identifier}
        </p>
      ) : null}
      <div className="ewa-rise mt-10 w-full max-w-xs" style={{ animationDelay: "500ms" }}>
        <SecondaryButton
          onClick={() => {
            reset();
            navigate({ to: "/welcome" });
          }}
        >
          Sign out
        </SecondaryButton>
      </div>
    </div>
  );
}