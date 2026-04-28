/**
 * Profile edit bottom sheets — shared visual language with the editorial
 * Profile surface. Each sheet is its own controlled component so the parent
 * (ProfilePage) decides which one is open.
 *
 * Persistence goes through profile-draft-store (localStorage). These sheets
 * read the current draft on open via a defaultValue prop — they don't
 * subscribe — so typing inside the sheet doesn't fight an external update.
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { HOME_SANS } from "@/home/home-shell";
import {
  removeService,
  updateProfileDraft,
  upsertService,
  type ProfileDraft,
} from "@/profile/profile-draft-store";
import type { ProService } from "@/data/mock-services";

const UI = HOME_SANS;
const NAVY = "#061C27";
const ORANGE = "#FF823F";

/* ---------- Shared primitives ---------- */

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label
      style={{
        fontFamily: UI,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: NAVY,
        opacity: 0.55,
      }}
    >
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.55, marginTop: 6, lineHeight: 1.4 }}>
      {children}
    </p>
  );
}

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

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full px-5 py-3 transition-opacity active:opacity-80"
      style={{
        backgroundColor: ORANGE,
        color: NAVY,
        fontFamily: UI,
        fontSize: 14,
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full px-5 py-3 transition-opacity active:opacity-60"
      style={{
        backgroundColor: "transparent",
        color: danger ? "#DC2626" : NAVY,
        fontFamily: UI,
        fontSize: 14,
        fontWeight: 600,
        opacity: danger ? 1 : 0.7,
      }}
    >
      {children}
    </button>
  );
}

function SheetShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-0 p-0"
        style={{ backgroundColor: "#FFFFFF", color: NAVY, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <SheetHeader className="px-5 pb-2 pt-5 text-left">
          <SheetTitle style={{ fontFamily: UI, fontSize: 18, fontWeight: 600, color: NAVY, letterSpacing: "-0.005em" }}>
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.65, lineHeight: 1.45 }}>
              {description}
            </SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="overflow-y-auto px-5 py-4" style={{ flex: 1 }}>
          {children}
        </div>
        <SheetFooter className="flex flex-col gap-2 border-t px-5 py-4" style={{ borderColor: "rgba(6,28,39,0.08)" }}>
          {footer}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Headline ---------- */

const HEADLINE_MAX = 60;

export function HeadlineSheet({
  open,
  onOpenChange,
  defaultValue,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  const trimmed = value.trim();
  const tooLong = trimmed.length > HEADLINE_MAX;

  function save() {
    if (!trimmed || tooLong) return;
    updateProfileDraft({ headline: trimmed });
    onOpenChange(false);
  }

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title="Edit headline"
      description="One short line that tells clients who you are. Shown right under your name."
      footer={<PrimaryButton onClick={save} disabled={!trimmed || tooLong}>Save</PrimaryButton>}
    >
      <FieldLabel>Headline</FieldLabel>
      <input
        type="text"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. Braider in Bed-Stuy"
        style={inputStyle}
        maxLength={HEADLINE_MAX + 20}
      />
      <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
        <FieldHint>Keep it specific. Neighborhood, specialty, or both.</FieldHint>
        <span style={{ fontFamily: UI, fontSize: 12, color: tooLong ? "#DC2626" : NAVY, opacity: tooLong ? 1 : 0.5 }}>
          {trimmed.length}/{HEADLINE_MAX}
        </span>
      </div>
    </SheetShell>
  );
}

/* ---------- About ---------- */

const ABOUT_MAX = 600;

export function AboutSheet({
  open,
  onOpenChange,
  defaultValue,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  const trimmed = value.trim();
  const tooLong = trimmed.length > ABOUT_MAX;

  function save() {
    if (tooLong) return;
    updateProfileDraft({ about: trimmed });
    onOpenChange(false);
  }

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title="About you"
      description="A few sentences in your own voice. Where you trained, what you love, what clients should know."
      footer={<PrimaryButton onClick={save} disabled={tooLong}>Save</PrimaryButton>}
    >
      <FieldLabel>About</FieldLabel>
      <textarea
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        placeholder="I learned to braid in my mother's salon…"
        rows={8}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
      />
      <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
        <FieldHint>Write like you'd talk to a new client.</FieldHint>
        <span style={{ fontFamily: UI, fontSize: 12, color: tooLong ? "#DC2626" : NAVY, opacity: tooLong ? 1 : 0.5 }}>
          {trimmed.length}/{ABOUT_MAX}
        </span>
      </div>
    </SheetShell>
  );
}

/* ---------- Service add / edit ---------- */

export function ServiceSheet({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Existing service to edit, or null to add new. */
  service: ProService | null;
}) {
  const isEdit = service !== null;
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(service?.name ?? "");
    setDuration(service ? String(service.durationMin) : "");
    setPrice(service ? String(service.priceUsd) : "");
    setDescription(service?.description ?? "");
  }, [open, service]);

  const durationN = Number.parseInt(duration, 10);
  const priceN = Number.parseInt(price, 10);
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(durationN) && durationN > 0 &&
    Number.isFinite(priceN) && priceN >= 0;

  function save() {
    if (!valid) return;
    upsertService({
      id: service?.id ?? `svc-${Date.now()}`,
      name: name.trim(),
      durationMin: durationN,
      priceUsd: priceN,
      description: description.trim() || undefined,
    });
    onOpenChange(false);
  }

  function del() {
    if (!service) return;
    removeService(service.id);
    onOpenChange(false);
  }

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit service" : "Add a service"}
      description="One service per row. Keep names specific so clients know exactly what they're booking."
      footer={
        <>
          <PrimaryButton onClick={save} disabled={!valid}>{isEdit ? "Save changes" : "Add service"}</PrimaryButton>
          {isEdit ? <GhostButton onClick={del} danger>Delete service</GhostButton> : null}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel>Service name</FieldLabel>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Knotless braids — medium"
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Duration (min)</FieldLabel>
            <input
              type="number"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="240"
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel>Price (USD)</FieldLabel>
            <input
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="220"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Description (optional)</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mid-back length, includes parting and edges."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>
      </div>
    </SheetShell>
  );
}

/* ---------- Base location ---------- */

export function BaseLocationSheet({
  open,
  onOpenChange,
  draft,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: Pick<ProfileDraft, "neighborhood" | "baseAddress" | "travelRadiusMi">;
}) {
  const [neighborhood, setNeighborhood] = useState(draft.neighborhood);
  const [baseAddress, setBaseAddress] = useState(draft.baseAddress);
  const [travelRadiusMi, setTravelRadiusMi] = useState(String(draft.travelRadiusMi));

  useEffect(() => {
    if (!open) return;
    setNeighborhood(draft.neighborhood);
    setBaseAddress(draft.baseAddress);
    setTravelRadiusMi(String(draft.travelRadiusMi));
  }, [open, draft.neighborhood, draft.baseAddress, draft.travelRadiusMi]);

  const radiusN = Number.parseInt(travelRadiusMi, 10);
  const valid =
    neighborhood.trim().length > 0 &&
    baseAddress.trim().length > 0 &&
    Number.isFinite(radiusN) && radiusN > 0 && radiusN <= 100;

  function save() {
    if (!valid) return;
    updateProfileDraft({
      neighborhood: neighborhood.trim(),
      baseAddress: baseAddress.trim(),
      travelRadiusMi: radiusN,
    });
    onOpenChange(false);
  }

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title="Base location"
      description="Your home base and how far you'll travel for clients. Clients only see the neighborhood, never the full address."
      footer={<PrimaryButton onClick={save} disabled={!valid}>Save</PrimaryButton>}
    >
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel>Neighborhood</FieldLabel>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Bed-Stuy"
            style={inputStyle}
          />
          <FieldHint>This is what clients see.</FieldHint>
        </div>

        <div>
          <FieldLabel>Full address (private)</FieldLabel>
          <input
            type="text"
            value={baseAddress}
            onChange={(e) => setBaseAddress(e.target.value)}
            placeholder="412 Marcus Garvey Blvd, Brooklyn, NY 11216"
            style={inputStyle}
          />
          <FieldHint>Used to calculate travel distance. Never shown to clients.</FieldHint>
        </div>

        <div>
          <FieldLabel>Travel radius (miles)</FieldLabel>
          <input
            type="number"
            inputMode="numeric"
            value={travelRadiusMi}
            onChange={(e) => setTravelRadiusMi(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="5"
            style={inputStyle}
          />
          <FieldHint>How far you're willing to go for at-home appointments.</FieldHint>
        </div>
      </div>
    </SheetShell>
  );
}
