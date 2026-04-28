import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import { useAuth } from "@/auth/auth-context";
import { useProfileDraft, updateProfileDraft } from "@/profile/profile-draft-store";

/**
 * Settings — industrial, functional account hub. Stripe-like grouped rows.
 * Pure white cards in both modes. Sign-out and email live here only.
 */

const UI = HOME_SANS;
const NAVY = "#061C27";
const ORANGE = "#FF823F";
const DANGER = "#DC2626";

export function SettingsPage() {
  const auth = useAuth();
  const draft = useProfileDraft();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function doSignOut() {
    setSigningOut(true);
    try {
      await auth.reset();
    } finally {
      setSigningOut(false);
      navigate({ to: "/login" });
    }
  }

  return (
    <HomeShell noTabBarSpacing>
      <ActiveBookingStrip />
      <SubHeader />

      <div className="flex flex-1 flex-col gap-5 px-4 pb-10 pt-2">
        {/* Account ------------------------------------------------------- */}
        <Group title="Account">
          <ReadRow label="Signed in as" value={auth.email ?? auth.identifier ?? "—"} />
          <DividerRow />
          <NavRow label="Change password" onClick={() => navigate({ to: "/login" })} />
          <DividerRow />
          <NavRow label="Two-factor authentication" rightLabel="Off" disabled />
        </Group>

        {/* Notifications ------------------------------------------------- */}
        <Group title="Notifications">
          <SwitchRow label="New booking requests" defaultOn />
          <DividerRow />
          <SwitchRow label="Booking reminders" defaultOn />
          <DividerRow />
          <SwitchRow label="Messages from clients" defaultOn />
          <DividerRow />
          <SwitchRow label="Promotions and tips" />
        </Group>

        {/* Booking preferences ------------------------------------------ */}
        <Group title="Booking preferences">
          <NavRow label="Lead time" rightLabel="2 hours" disabled />
          <DividerRow />
          <NavRow label="Cancellation window" rightLabel="24 hours" disabled />
        </Group>

        {/* Payouts and tax (route, don't rebuild) ----------------------- */}
        <Group title="Payouts and tax">
          <LinkRow label="Payouts" to="/earnings" />
          <DividerRow />
          <LinkRow label="Tax documents" to="/earnings" />
        </Group>

        {/* Privacy and visibility --------------------------------------- */}
        <Group title="Privacy">
          <SwitchRow
            label="Profile is live"
            defaultOn={draft.visibility === "live"}
            onChange={(on) => updateProfileDraft({ visibility: on ? "live" : "paused" })}
          />
          <DividerRow />
          <NavRow label="Blocked clients" rightLabel="0" disabled />
        </Group>

        {/* Support ------------------------------------------------------ */}
        <Group title="Support">
          <NavRow label="Help center" disabled />
          <DividerRow />
          <NavRow label="Contact support" disabled />
          <DividerRow />
          <NavRow label="Terms of service" disabled />
          <DividerRow />
          <NavRow label="Privacy policy" disabled />
          <DividerRow />
          <DangerRow
            label="Delete account"
            onClick={() => setConfirmDeleteOpen(true)}
          />
        </Group>

        {/* Danger zone -------------------------------------------------- */}
        <Group>
          <DangerRow
            label={signingOut ? "Signing out…" : "Sign out"}
            onClick={() => setConfirmOpen(true)}
            disabled={signingOut}
          />
        </Group>

        <p
          className="pb-2 pt-1 text-center"
          style={{ fontFamily: UI, fontSize: 11, color: NAVY, opacity: 0.4, letterSpacing: "0.04em" }}
        >
          Ewà Biz · v0.1
        </p>
      </div>

      {confirmOpen ? (
        <ConfirmSignOut
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            void doSignOut();
          }}
        />
      ) : null}
      {confirmDeleteOpen ? (
        <ConfirmDeleteAccount
          onCancel={() => setConfirmDeleteOpen(false)}
          onConfirm={() => {
            setConfirmDeleteOpen(false);
            void doSignOut();
          }}
        />
      ) : null}
    </HomeShell>
  );
}

/* ---------- Header ---------- */

function SubHeader() {
  const { text } = useHomeTheme();
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-2 pt-2" style={{ height: 52 }}>
      <button
        type="button"
        aria-label="Back"
        onClick={() => navigate({ to: "/profile" })}
        className="flex items-center justify-center transition-opacity active:opacity-50"
        style={{ width: 44, height: 44, color: text, background: "transparent", border: "none" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <h1 style={{ fontFamily: UI, fontSize: 16, fontWeight: 600, color: text, letterSpacing: "-0.005em" }}>
        Settings
      </h1>
      <div style={{ width: 44 }} />
    </div>
  );
}

/* ---------- Group / Card primitives ---------- */

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title ? (
        <h2
          className="px-2"
          style={{
            fontFamily: UI,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: NAVY,
            opacity: 0.5,
          }}
        >
          {title}
        </h2>
      ) : null}
      <CardTheme>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(6,28,39,0.10)",
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(6,28,39,0.05)",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </CardTheme>
    </section>
  );
}

function DividerRow() {
  return <div style={{ height: 1, backgroundColor: "rgba(6,28,39,0.06)" }} />;
}

/* ---------- Rows ---------- */

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <span style={{ fontFamily: UI, fontSize: 14, color: NAVY }}>{label}</span>
      <span
        style={{
          fontFamily: UI,
          fontSize: 13,
          color: NAVY,
          opacity: 0.6,
          maxWidth: 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function NavRow({
  label,
  rightLabel,
  onClick,
  disabled,
}: {
  label: string;
  rightLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-opacity active:opacity-60"
      style={{
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, color: NAVY }}>{label}</span>
      <div className="flex items-center gap-2">
        {rightLabel ? (
          <span style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.55 }}>
            {rightLabel}
          </span>
        ) : null}
        <Chevron />
      </div>
    </button>
  );
}

function LinkRow({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 transition-opacity active:opacity-60"
      style={{ textDecoration: "none" }}
    >
      <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, color: NAVY }}>{label}</span>
      <Chevron />
    </Link>
  );
}

function SwitchRow({
  label,
  defaultOn = false,
  onChange,
}: {
  label: string;
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span style={{ fontFamily: UI, fontSize: 14, color: NAVY }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => {
          const next = !on;
          setOn(next);
          onChange?.(next);
        }}
        className="relative transition-colors"
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          backgroundColor: on ? ORANGE : "rgba(6,28,39,0.20)",
          border: "none",
          padding: 0,
        }}
      >
        <span
          aria-hidden
          className="absolute top-0.5 transition-all"
          style={{
            left: on ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: 999,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(6,28,39,0.25)",
          }}
        />
      </button>
    </div>
  );
}

function DangerRow({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="w-full px-4 py-4 text-center transition-opacity active:opacity-60"
      style={{
        background: "transparent",
        border: "none",
        fontFamily: UI,
        fontSize: 14,
        fontWeight: 600,
        color: DANGER,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {label}
    </button>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/* ---------- Confirm sign-out ---------- */

function ConfirmSignOut({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(6,28,39,0.45)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md"
        style={{
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: "20px 20px 28px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto mb-4"
          style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: "rgba(6,28,39,0.15)" }}
        />
        <h3 style={{ fontFamily: UI, fontSize: 17, fontWeight: 600, color: NAVY, textAlign: "center" }}>
          Sign out of Ewà Biz?
        </h3>
        <p
          style={{
            fontFamily: UI,
            fontSize: 13,
            color: NAVY,
            opacity: 0.65,
            textAlign: "center",
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          You can sign back in anytime with your email.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-full transition-opacity active:opacity-80"
            style={{
              fontFamily: UI,
              fontSize: 14,
              fontWeight: 600,
              color: "#FFFFFF",
              backgroundColor: DANGER,
              padding: "13px 16px",
              border: "none",
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-full transition-opacity active:opacity-60"
            style={{
              fontFamily: UI,
              fontSize: 14,
              fontWeight: 600,
              color: NAVY,
              backgroundColor: "transparent",
              padding: "13px 16px",
              border: "1px solid rgba(6,28,39,0.12)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}