import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ewaLogo from "@/assets/ewa-logo.png";

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

const SANS = '"Uncut Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

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
  const squiggleOpacity = isDark ? 0.08 : 0.12;
  const grainOpacity = isDark ? 0.18 : 0.22;

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-hidden"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: SANS,
        transition: "background-color 600ms cubic-bezier(0.4, 0, 0.2, 1), color 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Organic drifting squiggles — soft, low-opacity, slow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[10%] ewa-drift-a"
        style={{ opacity: squiggleOpacity, transition: "opacity 600ms ease" }}
      >
        <svg viewBox="0 0 600 600" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <path
            d="M-20,180 C80,100 180,260 290,180 S500,100 640,200"
            fill="none"
            stroke="#FF823F"
            strokeWidth="42"
            strokeLinecap="round"
          />
          <path
            d="M-40,440 C90,360 220,520 340,440 S560,360 660,460"
            fill="none"
            stroke="#FF823F"
            strokeWidth="36"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[15%] ewa-drift-b"
        style={{ opacity: squiggleOpacity * 0.7, transition: "opacity 600ms ease" }}
      >
        <svg viewBox="0 0 600 600" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <path
            d="M-30,300 C120,220 260,400 400,310 S620,240 700,330"
            fill="none"
            stroke="#FF823F"
            strokeWidth="28"
            strokeLinecap="round"
          />
        </svg>
      </div>

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
          transition: "background 600ms ease",
        }}
      />

      {/* Printed-paper grain overlay (SVG turbulence) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          opacity: grainOpacity,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "220px 220px",
          transition: "opacity 600ms ease",
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
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            border: `1px solid ${borderCol}`,
            color: text,
            opacity: 0.7,
            fontSize: 12,
            transition: "border-color 600ms ease, color 600ms ease, transform 200ms ease",
          }}
        >
          {isDark ? "☀" : "☾"}
        </button>
      </div>

      {/* Logo block — exact brand wordmark, quietly breathing */}
      <div
        className="relative z-[1] flex flex-col items-center"
        style={{ paddingTop: "13vh" }}
      >
        <div className="relative ewa-mark-in">
          <div className="ewa-breathe relative">
            {/* Easter egg: tiny spark glints off the bagel every ~11s for those who linger */}
            <span
              aria-hidden
              className="ewa-spark absolute"
              style={{
                top: "18%",
                left: "10%",
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: "#FFE9D6",
                boxShadow: "0 0 12px 2px rgba(255,233,214,0.9)",
                pointerEvents: "none",
              }}
            />
            <img
              src={ewaLogo}
              alt="Ewà"
              draggable={false}
              style={{
                height: 64,
                width: "auto",
                display: "block",
                // Lift wordmark off cream background by knocking out the brand's dark bg.
                // In dark mode the logo's native dark background blends into ours.
                mixBlendMode: isDark ? "normal" : "multiply",
                filter: isDark ? "none" : "contrast(1.02)",
                transition: "filter 600ms ease",
              }}
            />
          </div>
        </div>

        <div
          className="ewa-fade"
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 9,
            letterSpacing: "4px",
            color: "#FF823F",
            marginTop: 14,
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
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 26,
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
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
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 13,
            lineHeight: 1.5,
            letterSpacing: "0",
            color: text,
            opacity: 0.62,
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
          className="group relative w-full overflow-hidden transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_0_44px_0_rgba(255,130,63,0.42)] active:scale-[0.98] active:translate-y-0"
          style={{
            height: 52,
            borderRadius: 9999,
            backgroundColor: "#FF823F",
            color: "#061C27",
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "0",
            boxShadow: "0 0 32px 0 rgba(255,130,63,0.28), 0 1px 0 0 rgba(255,255,255,0.15) inset",
          }}
        >
          <span
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)",
            }}
          />
          <span className="relative">Join as a pro</span>
        </button>

        <button
          type="button"
          onClick={() => console.log("sign_in_tapped")}
          className="mt-2.5 w-full transition-all duration-300 active:scale-[0.98]"
          style={{
            height: 52,
            borderRadius: 9999,
            backgroundColor: "transparent",
            border: `1px solid ${borderCol}`,
            color: text,
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: "0",
            transition: "border-color 300ms ease, background-color 300ms ease, transform 200ms ease, color 600ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#FF823F";
            e.currentTarget.style.backgroundColor = isDark
              ? "rgba(255,130,63,0.06)"
              : "rgba(255,130,63,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = borderCol;
            e.currentTarget.style.backgroundColor = "transparent";
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
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 11.5,
            letterSpacing: "0",
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
            fontFamily: SANS,
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
