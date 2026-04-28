/**
 * Portfolio manage page — full-screen push route from /profile.
 *
 * Reorder via up/down arrows on each row (touch-friendly; HTML5 DnD on
 * mobile WebViews is unreliable). Add a photo by URL. Delete with
 * confirmation.
 *
 * Pure white cards in both light and dark mode, per profile design rules.
 */

import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import {
  addPortfolioPhoto,
  movePortfolioPhoto,
  removePortfolioPhoto,
  useProfileDraft,
} from "@/profile/profile-draft-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

const UI = HOME_SANS;
const NAVY = "#061C27";
const ORANGE = "#FF823F";

export function PortfolioManagePage() {
  const navigate = useNavigate();
  const draft = useProfileDraft();
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <HomeShell noTabBarSpacing>
      <Header onBack={() => navigate({ to: "/profile" })} count={draft.portfolio.length} />

      <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-2">
        <CardTheme>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(6,28,39,0.10)",
              borderRadius: 16,
              boxShadow: "0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-opacity active:opacity-70"
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: 12,
                  border: "1.5px dashed rgba(255,130,63,0.5)",
                  backgroundColor: "rgba(255,130,63,0.06)",
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.7" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div className="flex flex-col" style={{ flex: 1 }}>
                <span style={{ fontFamily: UI, fontSize: 15, fontWeight: 600, color: NAVY }}>
                  Add a photo
                </span>
                <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.6, marginTop: 2 }}>
                  Paste a link to a photo of your work
                </span>
              </div>
            </button>

            {draft.portfolio.length === 0 ? (
              <div className="px-4 pb-5 pt-1" style={{ borderTop: "1px solid rgba(6,28,39,0.06)" }}>
                <p style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.6, marginTop: 12, lineHeight: 1.5 }}>
                  No photos yet. Add at least three so clients can see your work.
                </p>
              </div>
            ) : (
              <div>
                {draft.portfolio.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: "1px solid rgba(6,28,39,0.06)" }}
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      className="h-14 w-14 rounded-xl object-cover"
                      style={{ border: "1px solid rgba(6,28,39,0.06)", flexShrink: 0 }}
                      loading="lazy"
                    />
                    <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontFamily: UI, fontSize: 13, fontWeight: 500, color: NAVY,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                      >
                        {photo.alt || "Untitled"}
                      </span>
                      <span style={{ fontFamily: UI, fontSize: 11, color: NAVY, opacity: 0.5, marginTop: 2 }}>
                        Position {idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowButton
                        label="Move up"
                        disabled={idx === 0}
                        onClick={() => movePortfolioPhoto(photo.id, "up")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 15l6-6 6 6" />
                        </svg>
                      </ArrowButton>
                      <ArrowButton
                        label="Move down"
                        disabled={idx === draft.portfolio.length - 1}
                        onClick={() => movePortfolioPhoto(photo.id, "down")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </ArrowButton>
                      <button
                        type="button"
                        aria-label="Delete photo"
                        onClick={() => setConfirmDelete(photo.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity active:opacity-60"
                        style={{ color: "#DC2626", opacity: 0.85 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardTheme>
      </div>

      <AddPhotoSheet open={addOpen} onOpenChange={setAddOpen} />
      <DeleteConfirmSheet
        photoId={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </HomeShell>
  );
}

function Header({ onBack, count }: { onBack: () => void; count: number }) {
  const { text } = useHomeTheme();
  return (
    <div className="flex items-center justify-between gap-3 px-3 pt-3" style={{ height: 52 }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity active:opacity-60"
        style={{ color: text }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className="flex flex-col items-center" style={{ flex: 1 }}>
        <h1 style={{ fontFamily: UI, fontSize: 17, fontWeight: 600, color: text, letterSpacing: "-0.005em" }}>
          Portfolio
        </h1>
        <span style={{ fontFamily: UI, fontSize: 11, color: text, opacity: 0.55, marginTop: 1 }}>
          {count} {count === 1 ? "photo" : "photos"}
        </span>
      </div>
      <div style={{ width: 40 }} />
    </div>
  );
}

function ArrowButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity active:opacity-60"
      style={{ color: NAVY, opacity: disabled ? 0.25 : 0.7 }}
    >
      {children}
    </button>
  );
}

/* ---------- Add photo sheet ---------- */

const inputStyle: React.CSSProperties = {
  fontFamily: UI,
  fontSize: 15,
  color: NAVY,
  width: "100%",
  marginTop: 8,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(6,28,39,0.15)",
  backgroundColor: "#fff",
  outline: "none",
};

function AddPhotoSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const valid = /^https?:\/\//i.test(url.trim());

  function save() {
    if (!valid) return;
    addPortfolioPhoto({ url: url.trim(), alt: alt.trim() || "Portfolio photo" });
    setUrl("");
    setAlt("");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-0 p-0"
        style={{ backgroundColor: "#FFFFFF", color: NAVY, maxHeight: "90vh" }}
      >
        <SheetHeader className="px-5 pb-2 pt-5 text-left">
          <SheetTitle style={{ fontFamily: UI, fontSize: 18, fontWeight: 600, color: NAVY }}>
            Add a photo
          </SheetTitle>
          <SheetDescription style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.65, lineHeight: 1.45 }}>
            Paste a link to a photo of your work. Native upload comes with the live backend.
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 py-4">
          <label style={{ fontFamily: UI, fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: NAVY, opacity: 0.55 }}>
            Photo URL
          </label>
          <input
            type="url"
            value={url}
            autoFocus
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            style={inputStyle}
          />
          <label style={{ fontFamily: UI, fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: NAVY, opacity: 0.55, display: "block", marginTop: 16 }}>
            Description
          </label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="e.g. Knotless braids with caramel ends"
            style={inputStyle}
          />
        </div>
        <SheetFooter className="border-t px-5 py-4" style={{ borderColor: "rgba(6,28,39,0.08)" }}>
          <button
            type="button"
            onClick={save}
            disabled={!valid}
            className="w-full rounded-full px-5 py-3 transition-opacity active:opacity-80"
            style={{
              backgroundColor: ORANGE, color: NAVY, fontFamily: UI, fontSize: 14, fontWeight: 600,
              opacity: valid ? 1 : 0.5,
            }}
          >
            Add photo
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Delete confirm ---------- */

function DeleteConfirmSheet({ photoId, onClose }: { photoId: string | null; onClose: () => void }) {
  return (
    <Sheet open={photoId !== null} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-0 p-0"
        style={{ backgroundColor: "#FFFFFF", color: NAVY }}
      >
        <SheetHeader className="px-5 pb-2 pt-5 text-left">
          <SheetTitle style={{ fontFamily: UI, fontSize: 18, fontWeight: 600, color: NAVY }}>
            Delete this photo?
          </SheetTitle>
          <SheetDescription style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.65, lineHeight: 1.45 }}>
            This removes it from your portfolio. You can always add it again later.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="flex flex-col gap-2 border-t px-5 py-4" style={{ borderColor: "rgba(6,28,39,0.08)" }}>
          <button
            type="button"
            onClick={() => { if (photoId) removePortfolioPhoto(photoId); onClose(); }}
            className="w-full rounded-full px-5 py-3 transition-opacity active:opacity-80"
            style={{ backgroundColor: "#DC2626", color: "#fff", fontFamily: UI, fontSize: 14, fontWeight: 600 }}
          >
            Delete photo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full px-5 py-3 transition-opacity active:opacity-60"
            style={{ backgroundColor: "transparent", color: NAVY, fontFamily: UI, fontSize: 14, fontWeight: 600, opacity: 0.7 }}
          >
            Keep it
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
