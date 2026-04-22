import { useState, useRef, useEffect } from "react";
import { StepShell } from "../step-shell";
import { useAuthTheme, SANS_STACK } from "@/components/auth-shell";
import { useOnboarding } from "@/lib/onboarding-context";
import type { StepProps } from "../step-router";

/**
 * Mapbox token gate — pro will paste their public token in env later. For now,
 * render an on-brand stylized map mock with a draggable pin and radius.
 * (User selected Mapbox; we'll wire it once a token is provided.)
 */
export function Step9Area({ onNext }: StepProps) {
  const { data, patch } = useOnboarding();
  const { text, borderCol, isDark } = useAuthTheme();
  const [radius, setRadius] = useState(data.area?.radiusMi ?? 8);
  const [pin, setPin] = useState({ x: data.area?.lng ?? 50, y: data.area?.lat ?? 50 });
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const onUp = () => { dragging.current = false; };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  const move = (e: React.PointerEvent) => {
    if (!dragging.current || !mapRef.current) return;
    const r = mapRef.current.getBoundingClientRect();
    const x = Math.min(95, Math.max(5, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(95, Math.max(5, ((e.clientY - r.top) / r.height) * 100));
    setPin({ x, y });
  };

  const submit = () => {
    patch({ area: { lat: pin.y, lng: pin.x, radiusMi: radius, label: "Brooklyn, NY" } });
    onNext();
  };

  const radiusPx = 30 + radius * 4; // 1 → 34px, 30 → 150px
  const grid = isDark ? "rgba(240,235,216,0.06)" : "rgba(6,28,39,0.05)";

  return (
    <StepShell
      step={9}
      title="Where do you work?"
      subtitle="Drop your base, then set how far you'll travel."
      onContinue={submit}
      canContinue
    >
      <div className="flex flex-1 flex-col">
        <div
          ref={mapRef}
          className="relative overflow-hidden rounded-3xl"
          style={{
            aspectRatio: "1.1",
            border: `1px solid ${borderCol}`,
            backgroundColor: isDark ? "#0A1F2E" : "#F7F3E6",
            backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
            backgroundSize: "26px 26px",
            cursor: "crosshair",
            touchAction: "none",
          }}
          onPointerDown={(e) => { dragging.current = true; move(e); }}
          onPointerMove={move}
        >
          {/* meandering "streets" */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden>
            <path d="M0,80 Q60,60 120,90 T200,70" fill="none" stroke="rgba(255,130,63,0.18)" strokeWidth="1.2" />
            <path d="M30,0 Q40,80 60,120 T80,200" fill="none" stroke="rgba(255,130,63,0.14)" strokeWidth="1" />
            <path d="M0,140 Q90,130 200,160" fill="none" stroke="rgba(255,130,63,0.12)" strokeWidth="1" />
          </svg>
          {/* Radius circle */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${pin.x}%`, top: `${pin.y}%`,
              width: radiusPx * 2, height: radiusPx * 2,
              transform: "translate(-50%, -50%)",
              borderRadius: 9999,
              border: "1.5px dashed rgba(255,130,63,0.6)",
              backgroundColor: "rgba(255,130,63,0.10)",
              transition: "width 200ms ease, height 200ms ease",
            }}
          />
          {/* Pin */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${pin.x}%`, top: `${pin.y}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
              <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0Z" fill="#FF823F" />
              <circle cx="14" cy="14" r="5" fill="#061C27" />
            </svg>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span style={{ fontFamily: SANS_STACK, fontSize: 10, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 500 }}>
              Travel radius
            </span>
            <span style={{ fontFamily: SANS_STACK, fontSize: 20, color: "#FF823F", fontWeight: 600 }}>
              {radius} mi
            </span>
          </div>
          <input
            type="range" min={1} max={30} value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="mt-3 w-full accent-[#FF823F]"
            style={{ accentColor: "#FF823F" }}
          />
        </div>
      </div>
    </StepShell>
  );
}
