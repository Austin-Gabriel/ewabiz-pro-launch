import { useEffect, useRef, useState } from "react";
import { SANS_STACK } from "@/auth/auth-shell";

export type CameraFacing = "environment" | "user";

export interface CameraCaptureProps {
  facing: CameraFacing;
  /** Frame guide style: ID card (rectangle) or face (oval). */
  frame: "card" | "face";
  /** Called with a JPEG data URL once the user confirms a capture. */
  onCapture: (dataUrl: string) => void;
  /** Cancel out of the camera (e.g. system back). */
  onCancel: () => void;
  /** Short instruction printed above the frame guide. */
  instruction: string;
  /** Optional sub-line under the instruction (e.g. "Step 1 of 2"). */
  subInstruction?: string;
}

/**
 * Full-screen, native-feeling camera. Uses the real getUserMedia stream so
 * the framing is honest (this is meant to feel like Apple Wallet's "Add ID"
 * sheet). On capture, paints the current video frame to a canvas and emits a
 * JPEG data URL — a verification provider would receive a real upload here.
 */
export function CameraCapture({
  facing,
  frame,
  onCapture,
  onCancel,
  instruction,
  subInstruction,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not supported on this device.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "We couldn't open your camera. Check your browser permissions.";
        setError(msg);
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  const snap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 220);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      // Mirror selfie so the captured photo matches what the user saw on screen.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setShot(dataUrl);
  };

  const confirm = () => {
    if (!shot) return;
    onCapture(shot);
  };
  const retake = () => setShot(null);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: "#000", color: "#F0EBD8", fontFamily: SANS_STACK }}
    >
      {/* Live preview / captured shot */}
      <div className="relative flex-1 overflow-hidden">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shot}
            alt="Captured frame"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
            playsInline
            muted
          />
        )}

        {/* Darken outside the framing window using an SVG mask cutout. */}
        {!shot && !error ? <FrameOverlay variant={frame} /> : null}

        {/* Top instruction bar */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 pt-[calc(env(safe-area-inset-top)+12px)]">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close camera"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-95"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
          <div className="max-w-[260px] text-center">
            <div style={{ fontSize: 14, fontWeight: 500 }}>{instruction}</div>
            {subInstruction ? (
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {subInstruction}
              </div>
            ) : null}
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Capture flash */}
        {flash ? (
          <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.85)", animation: "fadeOut 220ms ease forwards" }} />
        ) : null}

        {/* Error toast */}
        {error ? (
          <div className="absolute inset-x-6 bottom-32 rounded-2xl p-4 text-center" style={{ backgroundColor: "rgba(255,80,80,0.18)", border: "1px solid rgba(255,80,80,0.4)" }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{error}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
              Allow camera access in your browser, then try again.
            </div>
          </div>
        ) : null}
      </div>

      {/* Shutter / confirm bar */}
      <div
        className="flex items-center justify-around px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6"
        style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      >
        {shot ? (
          <>
            <button
              type="button"
              onClick={retake}
              className="px-6 py-3 rounded-full transition-transform active:scale-95"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#F0EBD8",
                border: "1px solid rgba(240,235,216,0.35)",
                backgroundColor: "transparent",
              }}
            >
              Retake
            </button>
            <button
              type="button"
              onClick={confirm}
              className="px-7 py-3 rounded-full transition-transform active:scale-95"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#061C27",
                backgroundColor: "#FF823F",
                boxShadow: "0 0 28px rgba(255,130,63,0.5)",
              }}
            >
              Use photo
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={snap}
            disabled={!!error}
            aria-label="Capture"
            className="relative h-[72px] w-[72px] rounded-full transition-transform active:scale-90 disabled:opacity-40"
            style={{ border: "3px solid #F0EBD8" }}
          >
            <span
              className="absolute inset-[5px] rounded-full"
              style={{ backgroundColor: "#F0EBD8" }}
            />
          </button>
        )}
      </div>
    </div>
  );
}

function FrameOverlay({ variant }: { variant: "card" | "face" }) {
  // ID card uses standard 1.586:1 aspect (CR80). Face uses tall oval.
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 180"
      preserveAspectRatio="none"
    >
      <defs>
        <mask id="kyc-frame-mask">
          <rect width="100" height="180" fill="white" />
          {variant === "card" ? (
            <rect x="6" y="60" width="88" height="56" rx="4" fill="black" />
          ) : (
            <ellipse cx="50" cy="80" rx="34" ry="50" fill="black" />
          )}
        </mask>
      </defs>
      <rect
        width="100"
        height="180"
        fill="rgba(0,0,0,0.55)"
        mask="url(#kyc-frame-mask)"
      />
      {variant === "card" ? (
        <rect
          x="6"
          y="60"
          width="88"
          height="56"
          rx="4"
          fill="none"
          stroke="#FF823F"
          strokeWidth="0.6"
        />
      ) : (
        <ellipse
          cx="50"
          cy="80"
          rx="34"
          ry="50"
          fill="none"
          stroke="#FF823F"
          strokeWidth="0.6"
        />
      )}
    </svg>
  );
}