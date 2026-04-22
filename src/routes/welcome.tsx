import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Ewà Biz — Your craft comes first" },
      {
        name: "description",
        content:
          "Ewà Biz is the professional app for independent barbers and stylists. Trusted bookings on your schedule, on your terms.",
      },
      { property: "og:title", content: "Ewà Biz — Your craft comes first" },
      {
        property: "og:description",
        content: "Trusted bookings on your schedule, on your terms.",
      },
    ],
  }),
  component: WelcomePage,
});

const FONT = 'Helvetica, "Helvetica Neue", Arial, sans-serif';

function WelcomePage() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    if (mq.matches) setIsDark(false);
    setMounted(true);
  }, []);

  const text = isDark ? "#F0EBD8" : "#061C27";
  const bg = isDark ? "#061C27" : "#F0EBD8";
  const glowBase = isDark ? 0.14 : 0.09;
  const borderCol = isDark ? "rgba(240,235,216,0.18)" : "rgba(6,28,39,0.18)";

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-hidden transition-colors duration-300 ease-out"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: FONT,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Ambient radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 ewa-glow-anim"
        style={
          {
            background: `radial-gradient(circle 460px at 50% 28%, rgba(255,130,63,${glowBase}) 0%, rgba(255,130,63,0) 70%)`,
            ["--glow-base" as never]: glowBase,
          } as React.CSSProperties
        }
      />

      {/* Subtle grain / vignette for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)"
            : "radial-gradient(ellipse at center, transparent 60%, rgba(6,28,39,0.06) 100%)",
        }}
      />

      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-5"
        style={{ paddingTop: 14 }}
      >
        <div
          className="ewa-fade"
          style={{
            fontSize: 10,
            letterSpacing: "1.6px",
            textTransform: "uppercase",
            color: text,
            opacity: 0.45,
            fontWeight: 500,
          }}
        >
          For Professionals
        </div>
        <button
          type="button"
          onClick={() => setIsDark((v) => !v)}
          aria-label="Toggle color mode"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            border: `1px solid ${borderCol}`,
            color: text,
            opacity: 0.7,
            fontSize: 12,
          }}
        >
          {isDark ? "☀" : "☾"}
        </button>
      </div>

      {/* Logo block */}
      <div
        className="relative z-[1] flex flex-col items-center"
        style={{ paddingTop: "14vh" }}
      >
        <div className="relative ewa-mark-in" style={{ width: 56, height: 56 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: "#FF823F",
              boxShadow: "0 8px 32px -8px rgba(255,130,63,0.5)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 20,
              height: 20,
              backgroundColor: bg,
              top: "50%",
              left: "50%",
              transform: "translate(-65%, -50%)",
              transition: "background-color 300ms ease",
            }}
          />
          <div
            className="absolute"
            style={{
              width: 11,
              height: 2.5,
              backgroundColor: "#FF823F",
              borderRadius: 2,
              top: -5,
              right: -3,
              transform: "rotate(15deg)",
            }}
          />
        </div>

        <div
          className="ewa-rise"
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 26,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginTop: 18,
            color: text,
            animationDelay: "120ms",
          }}
        >
          ewà
          <span style={{ color: "#FF823F" }}>.</span>
        </div>

        <div
          className="ewa-fade"
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: "3.5px",
            color: "#FF823F",
            marginTop: 10,
            animationDelay: "260ms",
          }}
        >
          BIZ
        </div>
      </div>

      <div className="flex-1" />

      {/* Headline block */}
      <div className="relative z-[1] flex flex-col items-center px-8 text-center">
        <h1
          className="ewa-rise"
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 26,
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            color: text,
            margin: 0,
            animationDelay: "400ms",
            maxWidth: 320,
          }}
        >
          Your{" "}
          <span className="relative inline-block">
            craft
            <span
              aria-hidden
              className="absolute left-0 ewa-underline-anim"
              style={{
                bottom: -3,
                height: 2,
                width: "100%",
                backgroundColor: "#FF823F",
                borderRadius: 2,
                animationDelay: "900ms",
              }}
            />
          </span>{" "}
          comes first.
        </h1>

        <p
          className="ewa-rise"
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
            color: text,
            opacity: 0.6,
            marginTop: 12,
            marginBottom: 0,
            maxWidth: 280,
            animationDelay: "520ms",
          }}
        >
          Trusted bookings — on your schedule, on your terms.
        </p>
      </div>

      {/* CTA block */}
      <div
        className="relative z-[1] mt-10 flex flex-col items-stretch px-5 ewa-rise"
        style={{ animationDelay: "640ms" }}
      >
        <button
          type="button"
          onClick={() => console.log("join_as_pro_tapped")}
          className="group relative w-full overflow-hidden transition-transform duration-200 active:scale-[0.98]"
          style={{
            height: 52,
            borderRadius: 9999,
            backgroundColor: "#FF823F",
            color: "#061C27",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "-0.005em",
            boxShadow: "0 0 32px 0 rgba(255,130,63,0.28), 0 1px 0 0 rgba(255,255,255,0.15) inset",
          }}
        >
          <span
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)",
            }}
          />
          <span className="relative">Join as a pro</span>
        </button>

        <button
          type="button"
          onClick={() => console.log("sign_in_tapped")}
          className="mt-2.5 w-full transition-all duration-200 active:scale-[0.98]"
          style={{
            height: 52,
            borderRadius: 9999,
            backgroundColor: "transparent",
            border: `1px solid ${borderCol}`,
            color: text,
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: "-0.005em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isDark
              ? "rgba(240,235,216,0.4)"
              : "rgba(6,28,39,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = borderCol;
          }}
        >
          I already have an account
        </button>
      </div>

      {/* Footer */}
      <div
        className="relative z-[1] mt-6 flex flex-col items-center px-4 pb-4 ewa-fade"
        style={{ animationDelay: "780ms" }}
      >
        <a
          href="#"
          className="group text-center transition-opacity hover:opacity-100"
          style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: 11.5,
            letterSpacing: "-0.005em",
          }}
        >
          <span style={{ color: text, opacity: 0.45 }}>Looking for a beauty pro? </span>
          <span
            style={{ color: "#FF823F", fontWeight: 500 }}
            className="transition-all group-hover:tracking-wide"
          >
            Get the Ewà app →
          </span>
        </a>
        <div
          style={{
            marginTop: 10,
            fontFamily: FONT,
            fontSize: 10,
            letterSpacing: "0.02em",
            color: text,
            opacity: 0.35,
          }}
        >
          Terms of Service · Privacy Policy
        </div>
      </div>

      {/* mounted gate to prevent FOUC of theme */}
      {!mounted && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundColor: bg, transition: "opacity 200ms" }}
        />
      )}
    </div>
  );
}
