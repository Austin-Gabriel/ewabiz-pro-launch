import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/auth/auth-context";
import { useHomeTheme, HOME_SANS } from "./home-shell";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Lightweight profile sheet for the bottom Profile tab. Keeps the dashboard
 * focused on action; account-level controls (email, sign out) live here.
 */
export function ProfileSheet({ open, onClose }: Props) {
  const { isDark, text, borderCol } = useHomeTheme();
  const { email, displayName, reset } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  const signOut = async () => {
    await reset();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div
      className="fixed inset-0 z-30"
      style={{ pointerEvents: "auto" }}
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl px-5 pt-4"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)",
          backgroundColor: isDark ? "#0A1F2E" : "#F7F3E6",
          border: `1px solid ${borderCol}`,
          fontFamily: HOME_SANS,
        }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: text, opacity: 0.18 }} />
        <div className="flex items-center gap-3 pb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: "rgba(255,130,63,0.15)",
              color: "#FF823F",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {(displayName ?? email ?? "P").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span style={{ fontSize: 15, fontWeight: 600, color: text }}>
              {displayName ?? "Your studio"}
            </span>
            <span style={{ fontSize: 12, color: text, opacity: 0.6 }}>
              {email ?? "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-col" style={{ borderTop: `1px solid ${borderCol}` }}>
          <Row
            label="Payout method"
            onClick={() => {
              onClose();
              navigate({ to: "/earnings/payout-method" });
            }}
          />
          <Row
            label="Tax documents"
            onClick={() => {
              onClose();
              navigate({ to: "/earnings/tax-documents" });
            }}
          />
          <Row label="Account settings" disabled />
          <Row label="Help & support" disabled />
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full rounded-xl px-4 py-3 text-left transition-all active:scale-[0.99]"
            style={{
              border: `1px solid ${borderCol}`,
              backgroundColor: "transparent",
              color: "#FF6B5B",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick?: () => void }) {
  const { text, borderCol } = useHomeTheme();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-between py-3.5 transition-opacity disabled:opacity-50"
      style={{
        borderBottom: `1px solid ${borderCol}`,
        color: text,
        fontSize: 14,
      }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.4 }}>→</span>
    </button>
  );
}