import { useState, useMemo } from "react";
import { StepShell } from "../step-shell";
import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";
import { useOnboarding } from "@/onboarding/onboarding-context";
import type { StepProps } from "../step-router";

/**
 * Step 8 — Base address.
 *
 * This is the pro's home base, used to calculate travel distance to clients.
 * It is NEVER shown to anyone. Mocked Google Places-style autocomplete:
 * a small curated suggestion list filtered by query — wired to a real Places
 * API in a follow-up.
 */
const SUGGESTIONS: { line: string; lat: number; lng: number }[] = [
  { line: "245 Bedford Ave, Brooklyn, NY 11211", lat: 40.7138, lng: -73.9614 },
  { line: "1 Atlantic Ave, Brooklyn, NY 11201", lat: 40.6904, lng: -73.9956 },
  { line: "780 Franklin Ave, Brooklyn, NY 11238", lat: 40.6717, lng: -73.9576 },
  { line: "350 5th Ave, New York, NY 10118", lat: 40.7484, lng: -73.9857 },
  { line: "1 Times Square, New York, NY 10036", lat: 40.7569, lng: -73.9861 },
  { line: "500 Fulton St, Brooklyn, NY 11201", lat: 40.6906, lng: -73.9826 },
  { line: "111 8th Ave, New York, NY 10011", lat: 40.7414, lng: -74.0033 },
];

export function Step9Area({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const [radius, setRadius] = useState(data.area?.radiusMi ?? 10);
  const [query, setQuery] = useState(data.addressLine ?? "");
  const [selected, setSelected] = useState<{ line: string; lat: number; lng: number } | null>(
    data.addressLine && data.area
      ? { line: data.addressLine, lat: data.area.lat, lng: data.area.lng }
      : null,
  );
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTIONS.slice(0, 5);
    return SUGGESTIONS.filter((s) => s.line.toLowerCase().includes(q)).slice(0, 5);
  }, [query]);

  const choose = (s: { line: string; lat: number; lng: number }) => {
    setSelected(s);
    setQuery(s.line);
    setOpen(false);
  };

  const clearAddress = () => {
    setSelected(null);
    setQuery("");
    setOpen(true);
  };

  const submit = () => {
    if (!selected) return;
    patch({
      addressLine: selected.line,
      area: {
        lat: selected.lat,
        lng: selected.lng,
        radiusMi: radius,
        label: selected.line.split(",").slice(0, 2).join(",").trim(),
      },
    });
    onNext();
  };

  return (
    <StepShell
      step={6}
      title="What's your base address?"
      subtitle="We use this to calculate travel distance to clients. Never shown to anyone."
      onContinue={submit}
      canContinue={!!selected}
    >
      <AddressBody
        query={query}
        setQuery={setQuery}
        open={open}
        setOpen={setOpen}
        matches={matches}
        choose={choose}
        selected={selected}
        clearAddress={clearAddress}
        radius={radius}
        setRadius={setRadius}
      />
    </StepShell>
  );
}

function AddressBody({
  query, setQuery, open, setOpen, matches, choose,
  selected, clearAddress, radius, setRadius,
}: {
  query: string;
  setQuery: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  matches: { line: string; lat: number; lng: number }[];
  choose: (s: { line: string; lat: number; lng: number }) => void;
  selected: { line: string; lat: number; lng: number } | null;
  clearAddress: () => void;
  radius: number;
  setRadius: (n: number) => void;
}) {
  const { text, borderCol, isDark } = useAuthTheme();
  const grid = isDark ? "rgba(240,235,216,0.06)" : "rgba(6,28,39,0.05)";
  const radiusPx = 30 + radius * 4;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Address autocomplete */}
      {!selected ? (
        <div className="relative">
          <div
            className="flex items-center gap-3"
            style={{ borderBottom: `1px solid ${open ? "#FF823F" : borderCol}`, height: 52 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="1.6" style={{ opacity: 0.55 }}>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Start typing your address…"
              className="flex-1 bg-transparent outline-none"
              style={{
                color: text, fontFamily: SANS_STACK,
                fontSize: 18, fontWeight: 400, letterSpacing: "-0.01em",
              }}
            />
          </div>
          {open && matches.length > 0 ? (
            <div
              className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-2xl"
              style={{
                border: `1px solid ${borderCol}`,
                backgroundColor: isDark ? "rgba(10,31,46,0.96)" : "rgba(247,243,230,0.98)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 12px 40px -12px rgba(0,0,0,0.35)",
              }}
            >
              {matches.map((s) => (
                <button
                  key={s.line}
                  type="button"
                  onClick={() => choose(s)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(255,130,63,0.08)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.8" style={{ marginTop: 3 }}>
                    <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  <span style={{ fontFamily: SANS_STACK, fontSize: 14, color: text, lineHeight: 1.4 }}>
                    {s.line}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className="flex items-start gap-3 rounded-2xl px-4 py-3"
          style={{ border: `1px solid ${borderCol}`, backgroundColor: "rgba(255,130,63,0.06)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.8" style={{ marginTop: 3 }}>
            <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <div className="flex-1">
            <div style={{ fontFamily: SANS_STACK, fontSize: 10, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 500 }}>
              Your base
            </div>
            <div style={{ fontFamily: SANS_STACK, fontSize: 14.5, color: text, marginTop: 4, lineHeight: 1.4 }}>
              {selected.line}
            </div>
          </div>
          <button
            type="button"
            onClick={clearAddress}
            style={{ fontFamily: SANS_STACK, fontSize: 12, color: "#FF823F", fontWeight: 500 }}
          >
            Change
          </button>
        </div>
      )}

      {/* Map preview */}
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          aspectRatio: "1.6",
          border: `1px solid ${borderCol}`,
          backgroundColor: isDark ? "#0A1F2E" : "#F7F3E6",
          backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
          opacity: selected ? 1 : 0.5,
          transition: "opacity 300ms ease",
        }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden>
          <path d="M0,80 Q60,60 120,90 T200,70" fill="none" stroke="rgba(255,130,63,0.18)" strokeWidth="1.2" />
          <path d="M30,0 Q40,80 60,120 T80,200" fill="none" stroke="rgba(255,130,63,0.14)" strokeWidth="1" />
          <path d="M0,140 Q90,130 200,160" fill="none" stroke="rgba(255,130,63,0.12)" strokeWidth="1" />
        </svg>
        <div
          className="pointer-events-none absolute"
          style={{
            left: "50%", top: "50%",
            width: radiusPx * 2, height: radiusPx * 2,
            transform: "translate(-50%, -50%)",
            borderRadius: 9999,
            border: "1.5px dashed rgba(255,130,63,0.6)",
            backgroundColor: "rgba(255,130,63,0.10)",
            transition: "width 200ms ease, height 200ms ease",
          }}
        />
        <div
          className="pointer-events-none absolute"
          style={{ left: "50%", top: "50%", transform: "translate(-50%, -100%)" }}
        >
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
            <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0Z" fill="#FF823F" />
            <circle cx="14" cy="14" r="5" fill="#061C27" />
          </svg>
        </div>
      </div>

      {/* Travel radius */}
      <div>
        <div className="flex items-baseline justify-between">
          <span style={{ fontFamily: SANS_STACK, fontSize: 10, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 500 }}>
            How far will you travel?
          </span>
          <span style={{ fontFamily: SANS_STACK, fontSize: 20, color: "#FF823F", fontWeight: 600 }}>
            {radius} mi
          </span>
        </div>
        <input
          type="range" min={1} max={30} value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="mt-3 w-full"
          style={{ accentColor: "#FF823F" }}
        />
      </div>
    </div>
  );
}
