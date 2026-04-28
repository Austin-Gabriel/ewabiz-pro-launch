import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import { BottomTabs, type TabKey } from "@/home/bottom-tabs";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import { OnlineModeStrip } from "@/components/online-mode-strip";
import { useDevState } from "@/dev-state/dev-state-context";
import { useAuth } from "@/auth/auth-context";
import { useKyc } from "@/onboarding-states/kyc/kyc-context";
import { resolveProState, type ResolvedProState } from "@/earnings/earnings-state";
import { type CertificateStatus } from "@/data/mock-pro-profile";
import {
  type PortfolioPhoto,
} from "@/data/mock-portfolio";
import { type ProService } from "@/data/mock-services";
import {
  reviewsForDensity,
  averageRating,
  type ReviewDensity,
  type ProReview,
} from "@/data/mock-reviews";
import {
  useProfileDraft,
  updateProfileDraft,
  type ProfileDraft,
} from "@/profile/profile-draft-store";
import {
  HeadlineSheet,
  AboutSheet,
  ServiceSheet,
  BaseLocationSheet,
} from "@/profile/edits/edit-sheets";

/**
 * Profile — editorial identity surface for the pro. Phase 1: Editing mode
 * with all sections (header, completion card, portfolio, services, about,
 * reviews, availability summary, base location, visibility, settings link).
 *
 * Pro state gating mirrors Earnings: mid-onboarding → locked, mid-pending →
 * editable with banner, live → full surface.
 *
 * Spec: every card is pure white in BOTH modes (mem://design/card-surfaces).
 * Editorial spacing — generous whitespace, never compress with " · ".
 */

const UI = HOME_SANS;
const NAVY = "#061C27";
const ORANGE = "#FF823F";
const SUCCESS = "#16A34A";

type ProfileMode = "editing" | "preview";

/* Density mapping — derive Profile-specific densities from the existing
 * dev-state dataDensity field. Phase 2: portfolio comes from the editable
 * draft, but the density slider still trims/empties the displayed list so
 * design reviewers can preview empty/minimum states without clearing data. */
function portfolioSliceForDensity(
  d: ReturnType<typeof useDevState>["state"]["dataDensity"],
  full: PortfolioPhoto[],
): PortfolioPhoto[] {
  if (d === "empty") return [];
  if (d === "sparse") return full.slice(0, 3);
  return full;
}
function reviewDensityFromDev(d: ReturnType<typeof useDevState>["state"]["dataDensity"]): ReviewDensity {
  if (d === "empty") return "none";
  if (d === "sparse") return "few";
  return "many";
}

export function ProfilePage() {
  const { state: dev } = useDevState();
  const auth = useAuth();
  const { data: kyc } = useKyc();
  const proState: ResolvedProState = resolveProState(dev.proState, auth, kyc);
  const draft = useProfileDraft();

  if (proState === "mid-onboarding") return <LockedShell />;

  const portfolio = portfolioSliceForDensity(dev.dataDensity, draft.portfolio);
  const reviews = reviewsForDensity(reviewDensityFromDev(dev.dataDensity));

  // Mode is in-memory only — closing/reopening returns to Editing.
  const [mode, setMode] = useState<ProfileMode>("editing");

  // Sheets ----
  const [headlineOpen, setHeadlineOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProService | null>(null);
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);

  // Profile completion checklist — derived from current data. Each item is
  // binary done / not done. No percentage scoring.
  const checklist = useMemo(
    () => buildChecklist({
      hasHeadline: draft.headline.trim().length > 0,
      hasAvatar: Boolean(draft.avatarUrl),
      hasAbout: draft.about.trim().length > 0,
      portfolioCount: draft.portfolio.length,
      hasServices: draft.services.length > 0,
      hasSocial: Boolean(draft.social.instagram || draft.social.tiktok),
      hasAvailability: draft.availabilitySummary.trim().length > 0,
      certificate: draft.certificate,
    }),
    [
      draft.headline,
      draft.avatarUrl,
      draft.about,
      draft.portfolio.length,
      draft.services.length,
      draft.social.instagram,
      draft.social.tiktok,
      draft.availabilitySummary,
      draft.certificate,
    ],
  );

  function openServiceSheet(service: ProService | null) {
    setEditingService(service);
    setServiceSheetOpen(true);
  }

  if (mode === "preview") {
    return (
      <HomeShell>
        <OnlineModeStrip />
        <ActiveBookingStrip />
        <PageHeader mode={mode} onModeChange={setMode} />
        <PreviewStrip onExit={() => setMode("editing")} />
        <ClientPreview
          draft={draft}
          portfolio={portfolio}
          reviews={reviews}
        />
        <ProfileBottomTabs />
      </HomeShell>
    );
  }

  return (
    <HomeShell>
      <OnlineModeStrip />
      <ActiveBookingStrip />
      <PageHeader mode={mode} onModeChange={setMode} />

      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-2">
        {proState === "mid-pending" ? <PendingReviewBanner /> : null}
        {draft.visibility === "paused" ? (
          <PausedBanner onResume={() => updateProfileDraft({ visibility: "live" })} />
        ) : null}

        <ProfileCompletionCard items={checklist} />

        <ProfileHeaderCard draft={draft} onEditHeadline={() => setHeadlineOpen(true)} />

        <PortfolioCard photos={portfolio} />

        <ServicesCard
          services={draft.services}
          onAdd={() => openServiceSheet(null)}
          onEdit={(s) => openServiceSheet(s)}
        />

        <AboutCard about={draft.about} onEdit={() => setAboutOpen(true)} />

        <ReviewsCard reviews={reviews} />

        <AvailabilityCard summary={draft.availabilitySummary} />

        <BaseLocationCard
          neighborhood={draft.neighborhood}
          baseAddress={draft.baseAddress}
          travelRadiusMi={draft.travelRadiusMi}
          onEdit={() => setLocationOpen(true)}
        />

        {proState === "live" ? (
          <VisibilityCard
            visibility={draft.visibility}
            onChange={(v) => updateProfileDraft({ visibility: v })}
          />
        ) : null}

        <SettingsLinkRow />
      </div>

      <ProfileBottomTabs />

      {/* Edit sheets */}
      <HeadlineSheet open={headlineOpen} onOpenChange={setHeadlineOpen} defaultValue={draft.headline} />
      <AboutSheet open={aboutOpen} onOpenChange={setAboutOpen} defaultValue={draft.about} />
      <BaseLocationSheet open={locationOpen} onOpenChange={setLocationOpen} draft={draft} />
      <ServiceSheet open={serviceSheetOpen} onOpenChange={setServiceSheetOpen} service={editingService} />
    </HomeShell>
  );
}

/* ---------- Shells ---------- */

function LockedShell() {
  return (
    <HomeShell>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.5, color: "currentColor" }}>
          Almost there
        </div>
        <h2 style={{ fontFamily: UI, fontSize: 22, fontWeight: 600, marginTop: 8 }}>
          Finish your setup
        </h2>
        <p style={{ fontFamily: UI, fontSize: 14, marginTop: 8, opacity: 0.7, maxWidth: 280, lineHeight: 1.5 }}>
          Your profile unlocks once you finish onboarding and verification.
        </p>
        <Link
          to="/home"
          className="mt-6 rounded-full px-5 py-3"
          style={{ backgroundColor: ORANGE, color: NAVY, fontWeight: 600, fontSize: 14 }}
        >
          Continue setup
        </Link>
      </div>
      <ProfileBottomTabs />
    </HomeShell>
  );
}

function PageHeader() {
  const { text } = useHomeTheme();
  return (
    <div className="flex items-center justify-between px-5 pt-3" style={{ height: 52 }}>
      <h1
        style={{
          fontFamily: UI,
          fontSize: 22,
          fontWeight: 600,
          color: text,
          letterSpacing: "-0.01em",
        }}
      >
        Profile
      </h1>
    </div>
  );
}

function ProfileBottomTabs() {
  const navigate = useNavigate();
  return (
    <BottomTabs
      active={"profile" as TabKey}
      onSelect={(k) => {
        if (k === "home") return void navigate({ to: "/home" });
        if (k === "bookings") return void navigate({ to: "/bookings", search: { tab: "upcoming" } });
        if (k === "calendar") return void navigate({ to: "/calendar" });
        if (k === "earnings") return void navigate({ to: "/earnings" });
      }}
    />
  );
}

/* ---------- Card primitive ---------- */

function ProfileCard({ children }: { children: ReactNode }) {
  return (
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
        {children}
      </div>
    </CardTheme>
  );
}

function CardEyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: NAVY,
        opacity: 0.5,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontFamily: UI, fontSize: 16, fontWeight: 600, color: NAVY, letterSpacing: "-0.005em" }}>
      {children}
    </h2>
  );
}

/* ---------- Banners ---------- */

function PendingReviewBanner() {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "12px 14px",
        backgroundColor: "rgba(255,130,63,0.10)",
        border: "1px solid rgba(255,130,63,0.30)",
      }}
    >
      <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: ORANGE }}>
        Your profile is being reviewed
      </div>
      <div style={{ fontFamily: UI, fontSize: 13, color: "currentColor", opacity: 0.8, marginTop: 4, lineHeight: 1.45 }}>
        Clients won&rsquo;t see it until you&rsquo;re approved. You can keep editing in the meantime.
      </div>
    </div>
  );
}

function PausedBanner({ onResume }: { onResume: () => void }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "12px 14px",
        backgroundColor: "rgba(220,38,38,0.10)",
        border: "1px solid rgba(220,38,38,0.30)",
      }}
    >
      <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: "#DC2626" }}>
        Your profile is paused
      </div>
      <div style={{ fontFamily: UI, fontSize: 13, color: "currentColor", opacity: 0.8, marginTop: 4, lineHeight: 1.45 }}>
        Clients can&rsquo;t book you right now.
      </div>
      <button
        type="button"
        onClick={onResume}
        className="mt-3 rounded-full px-4 py-2"
        style={{ backgroundColor: ORANGE, color: NAVY, fontFamily: UI, fontSize: 13, fontWeight: 600 }}
      >
        Resume bookings
      </button>
    </div>
  );
}

/* ---------- Profile completion ---------- */

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

function buildChecklist(input: {
  hasHeadline: boolean;
  hasAvatar: boolean;
  hasAbout: boolean;
  portfolioCount: number;
  hasServices: boolean;
  hasSocial: boolean;
  hasAvailability: boolean;
  certificate: ReturnType<typeof useDevState> extends never ? never : import("@/data/mock-pro-profile").CertificateStatus;
}): ChecklistItem[] {
  return [
    { id: "headline", label: "Add your headline", done: input.hasHeadline },
    { id: "avatar", label: "Add a profile photo", done: input.hasAvatar },
    { id: "about", label: "Write your About section", done: input.hasAbout },
    { id: "portfolio", label: "Add at least 3 portfolio photos", done: input.portfolioCount >= 3 },
    { id: "services", label: "Add your services and prices", done: input.hasServices },
    { id: "social", label: "Add your social media links", done: input.hasSocial },
    { id: "availability", label: "Set your availability", done: input.hasAvailability },
    {
      id: "certificate",
      label: "Cosmetology certificate",
      // Verified OR explicitly marked "I don't have one" (none) both count
      // as resolved — the checklist asks the pro to make a choice, not to
      // necessarily upload.
      done: input.certificate === "verified" || input.certificate === "none",
    },
  ];
}

function ProfileCompletionCard({ items }: { items: ChecklistItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const allDone = done === total;

  if (allDone) return null;

  return (
    <ProfileCard>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left transition-opacity active:opacity-80"
      >
        <div className="flex flex-col gap-1.5" style={{ flex: 1 }}>
          <CardEyebrow>Profile completion</CardEyebrow>
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: UI, fontSize: 18, fontWeight: 600, color: NAVY }}>
              {done} of {total} done
            </span>
          </div>
          <div
            aria-hidden
            className="mt-1 overflow-hidden"
            style={{ height: 4, borderRadius: 999, backgroundColor: "rgba(6,28,39,0.08)" }}
          >
            <div
              style={{
                height: "100%",
                width: `${(done / total) * 100}%`,
                backgroundColor: ORANGE,
                borderRadius: 999,
                transition: "width 320ms ease",
              }}
            />
          </div>
        </div>
        <Chevron open={expanded} />
      </button>

      {expanded ? (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(6,28,39,0.08)" }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: "1px solid rgba(6,28,39,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <CheckDot done={item.done} />
                <span
                  style={{
                    fontFamily: UI,
                    fontSize: 14,
                    color: NAVY,
                    opacity: item.done ? 0.55 : 1,
                    textDecoration: item.done ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </span>
              </div>
              {!item.done ? (
                <span aria-hidden style={{ color: NAVY, opacity: 0.4 }}>→</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </ProfileCard>
  );
}

function CheckDot({ done }: { done: boolean }) {
  if (done) {
    return (
      <span
        className="flex items-center justify-center"
        style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: SUCCESS }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
    );
  }
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: 999,
        border: "1.5px solid rgba(6,28,39,0.25)",
      }}
    />
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={NAVY}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease", opacity: 0.55 }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ---------- Profile header ---------- */

function ProfileHeaderCard({
  draft,
  onEditHeadline,
}: {
  draft: ProfileDraft;
  onEditHeadline: () => void;
}) {
  const p = draft;
  const showLicensedBadge = p.certificate === "verified";

  return (
    <ProfileCard>
      <div className="flex flex-col items-center gap-4 px-5 pb-5 pt-6 text-center">
        <Avatar initials={p.initials} avatarUrl={p.avatarUrl} />

        <div className="flex flex-col items-center gap-1.5">
          <h2 style={{ fontFamily: UI, fontSize: 22, fontWeight: 600, color: NAVY, letterSpacing: "-0.01em" }}>
            {p.displayName}
          </h2>
          <button
            type="button"
            onClick={onEditHeadline}
            className="transition-opacity active:opacity-60"
            style={{
              fontFamily: UI,
              fontSize: 14,
              color: NAVY,
              opacity: p.headline ? 0.7 : 0.55,
              fontStyle: p.headline ? "normal" : "italic",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {p.headline || "Add a headline"}
          </button>
        </div>

        {showLicensedBadge ? (
          <div
            className="flex items-center gap-1.5"
            style={{
              padding: "5px 10px",
              borderRadius: 999,
              backgroundColor: "rgba(255,130,63,0.12)",
              border: "1px solid rgba(255,130,63,0.30)",
            }}
          >
            <BagelIcon />
            <span style={{ fontFamily: UI, fontSize: 11, fontWeight: 600, color: ORANGE, letterSpacing: "0.02em" }}>
              Licensed cosmetologist
            </span>
          </div>
        ) : null}

        {/* Location stack — each meaningful value gets its own line. */}
        <div className="flex flex-col items-center gap-0.5">
          <div style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.75 }}>
            {p.neighborhood}
          </div>
          <div style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.55 }}>
            Travels up to {p.travelRadiusMi} mi
          </div>
        </div>

        {p.specializations.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {p.specializations.map((s) => (
              <span
                key={s}
                style={{
                  fontFamily: UI,
                  fontSize: 11,
                  fontWeight: 500,
                  color: NAVY,
                  opacity: 0.85,
                  padding: "4px 10px",
                  borderRadius: 999,
                  backgroundColor: "rgba(6,28,39,0.05)",
                  border: "1px solid rgba(6,28,39,0.08)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}

        {(p.social.instagram || p.social.tiktok) ? (
          <div className="flex items-center gap-3 pt-1">
            {p.social.instagram ? (
              <SocialLink label="Instagram" handle={p.social.instagram} icon={<InstagramIcon />} />
            ) : null}
            {p.social.tiktok ? (
              <SocialLink label="TikTok" handle={p.social.tiktok} icon={<TikTokIcon />} />
            ) : null}
          </div>
        ) : null}
      </div>
    </ProfileCard>
  );
}

function Avatar({ initials, avatarUrl }: { initials: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <div
        className="overflow-hidden"
        style={{
          width: 84,
          height: 84,
          borderRadius: 999,
          border: "1px solid rgba(6,28,39,0.10)",
        }}
      >
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 84,
        height: 84,
        borderRadius: 999,
        backgroundColor: "#F0EBD8",
        color: "#7A2E0E",
        fontFamily: UI,
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

function SocialLink({ label, handle, icon }: { label: string; handle: string; icon: ReactNode }) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label={`${label} @${handle}`}
      className="flex items-center gap-1.5 transition-opacity active:opacity-60"
      style={{
        color: NAVY,
        opacity: 0.75,
        fontFamily: UI,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {icon}
      <span>@{handle}</span>
    </a>
  );
}

function BagelIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 4c0 2.5 2 4.5 4.5 4.5" />
    </svg>
  );
}

/* ---------- Portfolio ---------- */

function PortfolioCard({ photos }: { photos: PortfolioPhoto[] }) {
  const navigate = useNavigate();
  const goManage = () => void navigate({ to: "/profile/portfolio" });
  return (
    <ProfileCard>
      <div className="flex items-center justify-between px-5 pt-4">
        <CardTitle>Portfolio</CardTitle>
        {photos.length > 0 ? (
          <button
            type="button"
            className="transition-opacity active:opacity-50"
            style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: NAVY, opacity: 0.6 }}
            onClick={goManage}
          >
            Edit
          </button>
        ) : null}
      </div>

      {photos.length === 0 ? (
        <PortfolioEmpty onAdd={goManage} />
      ) : (
        <div className="grid grid-cols-3 gap-1.5 p-3">
          <button
            type="button"
            aria-label="Add photo"
            onClick={goManage}
            className="flex aspect-square items-center justify-center rounded-xl transition-all active:scale-[0.97]"
            style={{
              border: "1.5px dashed rgba(255,130,63,0.5)",
              backgroundColor: "rgba(255,130,63,0.05)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.7" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-xl"
              style={{ border: "1px solid rgba(6,28,39,0.06)" }}
            >
              <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

function PortfolioEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          backgroundColor: "rgba(255,130,63,0.10)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="11" r="2" />
          <path d="M21 16l-5-5-7 8" />
        </svg>
      </div>
      <p style={{ fontFamily: UI, fontSize: 14, color: NAVY, opacity: 0.7, maxWidth: 240, lineHeight: 1.45 }}>
        Add at least 3 photos to show your work.
      </p>
      <button
        type="button"
        className="rounded-full px-4 py-2"
        style={{ backgroundColor: ORANGE, color: NAVY, fontFamily: UI, fontSize: 13, fontWeight: 600 }}
        onClick={onAdd}
      >
        Add photos
      </button>
    </div>
  );
}

/* ---------- Services ---------- */

function ServicesCard({
  services,
  onAdd,
  onEdit,
}: {
  services: ProService[];
  onAdd: () => void;
  onEdit: (s: ProService) => void;
}) {
  return (
    <ProfileCard>
      <div className="flex items-center justify-between px-5 pt-4">
        <CardTitle>Services</CardTitle>
        <button
          type="button"
          className="transition-opacity active:opacity-50"
          style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: ORANGE }}
          onClick={onAdd}
        >
          Add
        </button>
      </div>

      {services.length === 0 ? (
        <div className="px-5 pb-5 pt-3">
          <button
            type="button"
            onClick={onAdd}
            className="text-left transition-opacity active:opacity-60"
            style={{ fontFamily: UI, fontSize: 14, color: NAVY, opacity: 0.55, fontStyle: "italic", background: "none", border: "none", padding: 0 }}
          >
            Add the services you offer with prices and durations.
          </button>
        </div>
      ) : (
        <div className="px-5 pb-2 pt-2">
          {services.map((s, i) => (
            <button
              type="button"
              key={s.id}
              className="flex w-full items-start justify-between gap-4 py-3.5 text-left transition-opacity active:opacity-60"
              style={{
                borderTop: i === 0 ? "none" : "1px solid rgba(6,28,39,0.06)",
              }}
              onClick={() => onEdit(s)}
            >
              <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: NAVY }}>
                  {s.name}
                </span>
                <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.6 }}>
                  {formatDuration(s.durationMin)}
                </span>
              </div>
              <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: NAVY }}>
                ${s.priceUsd}
              </div>
            </button>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

/* ---------- About ---------- */

function AboutCard({ about, onEdit }: { about?: string; onEdit: () => void }) {
  return (
    <ProfileCard>
      <div className="flex items-center justify-between px-5 pt-4">
        <CardTitle>About</CardTitle>
        <button
          type="button"
          className="transition-opacity active:opacity-50"
          style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: NAVY, opacity: 0.6 }}
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
      <div className="px-5 pb-5 pt-2">
        {about && about.trim().length > 0 ? (
          <p style={{ fontFamily: UI, fontSize: 14, color: NAVY, opacity: 0.85, lineHeight: 1.55 }}>
            {about}
          </p>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="text-left transition-opacity active:opacity-60"
            style={{
              fontFamily: UI,
              fontSize: 14,
              color: NAVY,
              opacity: 0.55,
              fontStyle: "italic",
            }}
          >
            Tell clients what makes your craft yours.
          </button>
        )}
      </div>
    </ProfileCard>
  );
}

/* ---------- Reviews ---------- */

function ReviewsCard({ reviews }: { reviews: ProReview[] }) {
  const visible = reviews.slice(0, 5);
  const avg = averageRating(reviews);

  return (
    <ProfileCard>
      <div className="flex items-center justify-between px-5 pt-4">
        <CardTitle>Reviews</CardTitle>
        {reviews.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <Star />
            <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: NAVY }}>
              {avg.toFixed(1)}
            </span>
            <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.55 }}>
              ({reviews.length})
            </span>
          </div>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <div className="px-5 pb-5 pt-3">
          <p style={{ fontFamily: UI, fontSize: 14, color: NAVY, opacity: 0.6, lineHeight: 1.5 }}>
            Reviews appear here once clients leave them.
          </p>
        </div>
      ) : (
        <div className="px-5 pb-3 pt-2">
          {visible.map((r, i) => (
            <div
              key={r.id}
              className="py-3.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(6,28,39,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    backgroundColor: "rgba(6,28,39,0.05)",
                    color: NAVY,
                    fontFamily: UI,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {r.clientFirstInitial}
                </div>
                <div className="flex flex-col">
                  <Stars count={r.rating} />
                  <span style={{ fontFamily: UI, fontSize: 11, color: NAVY, opacity: 0.5, marginTop: 2 }}>
                    {formatReviewDate(r.date)}
                  </span>
                </div>
              </div>
              <p style={{ fontFamily: UI, fontSize: 14, color: NAVY, opacity: 0.85, lineHeight: 1.5, marginTop: 8 }}>
                {r.text}
              </p>
            </div>
          ))}
          {reviews.length > visible.length ? (
            <button
              type="button"
              className="w-full py-3 text-center transition-opacity active:opacity-50"
              style={{
                fontFamily: UI,
                fontSize: 13,
                fontWeight: 600,
                color: NAVY,
                opacity: 0.7,
                borderTop: "1px solid rgba(6,28,39,0.06)",
              }}
              onClick={() => { /* future: /profile/reviews */ }}
            >
              View all {reviews.length}
            </button>
          ) : null}
        </div>
      )}
    </ProfileCard>
  );
}

function Star({ filled = true }: { filled?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? ORANGE : "none"} stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" />
    </svg>
  );
}
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= count} />
      ))}
    </div>
  );
}
function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ---------- Availability summary ---------- */

function AvailabilityCard({ summary }: { summary: string }) {
  return (
    <ProfileCard>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex flex-col gap-1.5" style={{ flex: 1 }}>
          <CardEyebrow>Availability</CardEyebrow>
          <p style={{ fontFamily: UI, fontSize: 14, color: NAVY, opacity: 0.85 }}>
            {summary}
          </p>
        </div>
        <Link
          to="/calendar"
          className="transition-opacity active:opacity-50"
          style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: NAVY, opacity: 0.6 }}
        >
          Edit
        </Link>
      </div>
    </ProfileCard>
  );
}

/* ---------- Base location ---------- */

function BaseLocationCard({
  neighborhood,
  baseAddress,
  travelRadiusMi,
  onEdit,
}: {
  neighborhood: string;
  baseAddress: string;
  travelRadiusMi: number;
  onEdit: () => void;
}) {
  return (
    <ProfileCard>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-1.5" style={{ flex: 1, minWidth: 0 }}>
          <CardEyebrow>Base location</CardEyebrow>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: NAVY }}>
              {neighborhood}
            </span>
            <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {baseAddress}
            </span>
            <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.6 }}>
              Travels up to {travelRadiusMi} mi
            </span>
          </div>
        </div>
        <button
          type="button"
          className="transition-opacity active:opacity-50"
          style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: NAVY, opacity: 0.6 }}
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
    </ProfileCard>
  );
}

/* ---------- Visibility control ---------- */

function VisibilityCard({
  visibility,
  onChange,
}: {
  visibility: "live" | "paused";
  onChange: (v: "live" | "paused") => void;
}) {
  const live = visibility === "live";
  return (
    <ProfileCard>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-1.5" style={{ flex: 1 }}>
          <CardEyebrow>Visibility</CardEyebrow>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: live ? SUCCESS : "rgba(6,28,39,0.35)",
              }}
            />
            <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: NAVY }}>
              {live ? "Your profile is live" : "Your profile is paused"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(live ? "paused" : "live")}
          className="transition-opacity active:opacity-60"
          style={{
            fontFamily: UI,
            fontSize: 13,
            fontWeight: 600,
            color: live ? "#DC2626" : ORANGE,
          }}
        >
          {live ? "Pause" : "Resume"}
        </button>
      </div>
    </ProfileCard>
  );
}

/* ---------- Settings link ---------- */

function SettingsLinkRow() {
  return (
    <Link
      to="/settings"
      className="block"
      style={{ textDecoration: "none" }}
    >
      <ProfileCard>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <SettingsIcon />
            <span style={{ fontFamily: UI, fontSize: 15, fontWeight: 600, color: NAVY }}>
              Settings
            </span>
          </div>
          <span aria-hidden style={{ color: NAVY, opacity: 0.4 }}>→</span>
        </div>
      </ProfileCard>
    </Link>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
