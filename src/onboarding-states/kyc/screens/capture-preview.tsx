import { useAuthTheme, SANS_STACK } from "@/auth/auth-shell";

/**
 * Compact preview tile shown on capture-step shells. If a shot exists, we
 * render a thumbnail with a "Retake" CTA. Otherwise, an empty framed slot
 * with an "Open camera" CTA. Tapping either opens the full-screen camera.
 */
export function CapturePreview({
  shot,
  variant,
  ctaLabel,
  onOpen,
}: {
  shot?: string;
  variant: "card" | "face";
  ctaLabel: string;
  onOpen: () => void;
}) {
  const { text, borderCol } = useAuthTheme();

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onOpen}
        className="relative w-full overflow-hidden transition-transform active:scale-[0.99]"
        style={{
          aspectRatio: variant === "card" ? "1.586 / 1" : "3 / 4",
          borderRadius: variant === "card" ? 18 : 200,
          border: `1.5px dashed ${shot ? "transparent" : "rgba(255,130,63,0.55)"}`,
          backgroundColor: shot ? "transparent" : "rgba(255,130,63,0.06)",
        }}
      >
        {shot ? (
          <img
            src={shot}
            alt="Captured"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ borderRadius: variant === "card" ? 18 : 200 }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,130,63,0.14)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF823F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.5-2Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </span>
            <span style={{ fontFamily: SANS_STACK, fontSize: 12.5, color: text, opacity: 0.65 }}>
              Tap to open camera
            </span>
          </div>
        )}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="self-start rounded-full px-4 py-2 transition-transform active:scale-95"
        style={{
          fontFamily: SANS_STACK,
          fontSize: 12,
          fontWeight: 500,
          color: "#FF823F",
          border: `1px solid rgba(255,130,63,0.45)`,
          backgroundColor: "rgba(255,130,63,0.08)",
        }}
      >
        {ctaLabel}
      </button>

      {/* Tiny ambient note. Borrows the same border token so it harmonises. */}
      <div
        className="mt-2 rounded-xl px-3 py-2"
        style={{ border: `1px solid ${borderCol}` }}
      >
        <div style={{ fontFamily: SANS_STACK, fontSize: 11.5, color: text, opacity: 0.6, lineHeight: 1.5 }}>
          Hold steady, fill the frame, avoid glare.
        </div>
      </div>
    </div>
  );
}