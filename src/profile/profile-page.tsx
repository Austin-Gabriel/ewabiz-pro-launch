import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
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
  CertificateSheet,
} from "@/profile/edits/edit-sheets";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

  const navigate = useNavigate();
  const portfolio = portfolioSliceForDensity(dev.dataDensity, draft.portfolio);
  const reviews = reviewsForDensity(reviewDensityFromDev(dev.dataDensity));

  // Dev-state can override certificate without touching the persisted draft —
  // lets reviewers preview every verification state from the toggle.
  const certificate: CertificateStatus =
    dev.certificate === "auto" ? draft.certificate : dev.certificate;
  const effectiveDraft = dev.certificate === "auto" ? draft : { ...draft, certificate };

  // Mode is in-memory only — closing/reopening returns to Editing.
  const [mode, setMode] = useState<ProfileMode>("editing");

  // Sheets ----
  const [headlineOpen, setHeadlineOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProService | null>(null);
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);
  // Pencil icon in the page header opens a full-screen "Edit profile"
  // sheet that holds every administrative row. The main Profile surface
  // stays focused on storefront overview rows only.
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  // Avatar upload action sheet — tapping the avatar in the IdentityCard
  // opens this; choosing a source assigns a mock photo URL to the draft.
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);

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
      certificate,
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
      certificate,
    ],
  );

  function openServiceSheet(service: ProService | null) {
    setEditingService(service);
    setServiceSheetOpen(true);
  }

  if (mode === "preview") {
    return (
      <HomeShell>
        <ClientPreview
          draft={effectiveDraft}
          portfolio={portfolio}
          reviews={reviews}
          onExit={() => setMode("editing")}
        />
        <ProfileBottomTabs />
      </HomeShell>
    );
  }

  return (
    <HomeShell>
      <OnlineModeStrip />
      <ActiveBookingStrip />
      <PageHeader
        mode={mode}
        onModeChange={setMode}
        onEdit={() => setEditSheetOpen(true)}
      />

      <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-2">
        {proState === "mid-pending" ? <PendingReviewBanner /> : null}
        {draft.visibility === "paused" ? (
          <PausedBanner onResume={() => updateProfileDraft({ visibility: "live" })} />
        ) : null}

        <IdentityCard
          draft={effectiveDraft}
          reviews={reviews}
          onEdit={() => setEditSheetOpen(true)}
          onAvatarTap={() => setAvatarSheetOpen(true)}
        />

        <OverviewGroup title="Storefront">
          <OverviewRow
            icon={<ScissorsIcon />}
            title="Services & pricing"
            subtitle={
              draft.services.length > 0
                ? `${draft.services.length} ${draft.services.length === 1 ? "service" : "services"}`
                : "Add services to get bookings"
            }
            onClick={() => setEditSheetOpen(true)}
          />
          <OverviewDivider />
          <OverviewRow
            icon={<PhotoIcon />}
            title="Portfolio"
            subtitle={
              draft.portfolio.length > 0
                ? `${draft.portfolio.length} ${draft.portfolio.length === 1 ? "photo" : "photos"}`
                : "Add photos to start"
            }
            onClick={() => void navigate({ to: "/profile/portfolio" })}
          />
          <OverviewDivider />
          <OverviewRow
            icon={<StarOutlineIcon />}
            title="Reviews"
            subtitle={
              reviews.length > 0
                ? `${averageRating(reviews).toFixed(1)} · ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`
                : "No reviews yet"
            }
            onClick={() => setEditSheetOpen(true)}
          />
          <OverviewDivider />
          <OverviewRow
            icon={<EyeIcon />}
            title="Customer view"
            subtitle="How clients see you"
            onClick={() => setMode("preview")}
          />
        </OverviewGroup>

        <OverviewGroup title="How you work">
          <OverviewRow
            icon={<CalendarIcon />}
            title="Availability"
            subtitle={
              draft.availabilitySummary.trim().length > 0
                ? draft.availabilitySummary
                : "Set your weekly schedule"
            }
            onClick={() => void navigate({ to: "/calendar" })}
          />
          <OverviewDivider />
          <OverviewRow
            icon={<CardIcon />}
            title="Payouts"
            subtitle="Add bank account"
            onClick={() => void navigate({ to: "/earnings" })}
          />
        </OverviewGroup>

        <OverviewGroup title="Social">
          <OverviewRow
            icon={<LinkIcon />}
            title="Connect socials"
            subtitle="Share your work"
            right={draft.social.instagram || draft.social.tiktok ? "Connected" : "Connect"}
            onClick={() => setEditSheetOpen(true)}
          />
        </OverviewGroup>
      </div>

      <ProfileBottomTabs />

      {/* Grouped edit sheet — opened by the pencil on the header card. */}
      <ProfileEditSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        draft={draft}
        certificate={certificate}
        proState={proState}
        checklist={checklist}
        onOpenHeadline={() => { setEditSheetOpen(false); setHeadlineOpen(true); }}
        onOpenAbout={() => { setEditSheetOpen(false); setAboutOpen(true); }}
        onOpenLocation={() => { setEditSheetOpen(false); setLocationOpen(true); }}
        onOpenCertificate={() => { setEditSheetOpen(false); setCertificateOpen(true); }}
        onAddService={() => { setEditSheetOpen(false); openServiceSheet(null); }}
      />

      <AvatarUploadSheet
        open={avatarSheetOpen}
        onOpenChange={setAvatarSheetOpen}
        hasAvatar={Boolean(draft.avatarUrl)}
      />

      {/* Edit sheets */}
      <HeadlineSheet open={headlineOpen} onOpenChange={setHeadlineOpen} defaultValue={draft.headline} />
      <AboutSheet open={aboutOpen} onOpenChange={setAboutOpen} defaultValue={draft.about} />
      <BaseLocationSheet open={locationOpen} onOpenChange={setLocationOpen} draft={draft} />
      <ServiceSheet open={serviceSheetOpen} onOpenChange={setServiceSheetOpen} service={editingService} />
      <CertificateSheet open={certificateOpen} onOpenChange={setCertificateOpen} status={certificate} />
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
          to="/onboarding"
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

function PageHeader({
  mode,
  onModeChange,
  onEdit,
}: {
  mode?: ProfileMode;
  onModeChange?: (m: ProfileMode) => void;
  onEdit?: () => void;
} = {}) {
  const { text } = useHomeTheme();
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-3" style={{ height: 52 }}>
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
      <div className="flex items-center gap-2">
        {onEdit ? (
          <HeaderIconButton ariaLabel="Edit profile" color={text} onClick={onEdit}>
            <PencilIcon />
          </HeaderIconButton>
        ) : null}
        {mode && onModeChange ? (
          <HeaderIconButton
            ariaLabel={mode === "preview" ? "Exit preview" : "Preview as a client"}
            color={text}
            onClick={() => onModeChange(mode === "preview" ? "editing" : "preview")}
            active={mode === "preview"}
          >
            <EyeIcon />
          </HeaderIconButton>
        ) : null}
        <HeaderIconButton
          ariaLabel="Settings"
          color={text}
          onClick={() => void navigate({ to: "/settings" })}
        >
          <SettingsIcon />
        </HeaderIconButton>
      </div>
    </div>
  );
}

function HeaderIconButton({
  ariaLabel,
  color,
  onClick,
  active,
  children,
}: {
  ariaLabel: string;
  color: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active ? true : undefined}
      onClick={onClick}
      className="flex items-center justify-center transition-opacity active:opacity-50"
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        color,
        backgroundColor: active ? "rgba(255,130,63,0.16)" : "rgba(6,28,39,0.06)",
        border: "none",
      }}
    >
      {children}
    </button>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: ProfileMode;
  onChange: (m: ProfileMode) => void;
}) {
  const { text } = useHomeTheme();
  const isPreview = mode === "preview";
  return (
    <div
      role="tablist"
      aria-label="Profile mode"
      className="flex items-center"
      style={{
        padding: 3,
        borderRadius: 999,
        backgroundColor: "rgba(6,28,39,0.06)",
        border: "1px solid rgba(6,28,39,0.08)",
      }}
    >
      <ModePill
        active={!isPreview}
        label="Edit"
        onClick={() => onChange("editing")}
        textColor={text}
      />
      <ModePill
        active={isPreview}
        label="Preview"
        onClick={() => onChange("preview")}
        textColor={text}
      />
    </div>
  );
}

function ModePill({
  active,
  label,
  onClick,
  textColor,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  textColor: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="transition-all active:scale-[0.97]"
      style={{
        fontFamily: UI,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.01em",
        padding: "5px 11px",
        borderRadius: 999,
        border: "none",
        backgroundColor: active ? "#FFFFFF" : "transparent",
        color: active ? NAVY : textColor,
        opacity: active ? 1 : 0.6,
        boxShadow: active
          ? "0 1px 2px rgba(6,28,39,0.10), 0 4px 10px -6px rgba(6,28,39,0.20)"
          : "none",
      }}
    >
      {label}
    </button>
  );
}

/* ---------- Preview mode ---------- */

function PreviewStrip({ onExit }: { onExit: () => void }) {
  return (
    <div className="px-4 pt-2">
      <div
        className="flex items-center justify-between gap-3"
        style={{
          borderRadius: 14,
          padding: "10px 14px",
          backgroundColor: NAVY,
          color: "#FFFFFF",
        }}
      >
        <div className="flex items-center gap-2.5" style={{ minWidth: 0 }}>
          <EyeIcon />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: UI, fontSize: 12, fontWeight: 600, letterSpacing: "0.02em" }}>
              Previewing as a client
            </div>
            <div style={{ fontFamily: UI, fontSize: 11, opacity: 0.7, marginTop: 1 }}>
              This is what your profile looks like.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full transition-opacity active:opacity-70"
          style={{
            fontFamily: UI,
            fontSize: 12,
            fontWeight: 600,
            color: NAVY,
            backgroundColor: "#FFFFFF",
            padding: "6px 12px",
            border: "none",
            flexShrink: 0,
          }}
        >
          Exit
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ClientPreview({
  draft,
  portfolio,
  reviews,
}: {
  draft: ProfileDraft;
  portfolio: PortfolioPhoto[];
  reviews: ProReview[];
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-3">
      <PreviewHeroCard draft={draft} portfolio={portfolio} reviews={reviews} />
      <PreviewIdentityCard draft={draft} />
      {portfolio.length > 1 ? (
        <PreviewRecentWorkCard photos={portfolio.slice(1, 5)} />
      ) : null}
      {draft.services.length > 0 ? (
        <PreviewServicesCard services={draft.services} />
      ) : null}
      {draft.about.trim().length > 0 ? (
        <PreviewAboutCard about={draft.about} />
      ) : null}
      {reviews.length > 0 ? (
        <PreviewReviewsCard reviews={reviews} />
      ) : null}
      <PreviewBookCard />
    </div>
  );
}

/* Preview cards — split out so each section feels like its own object,
 * matching how a real explore listing is composed of stacked cards rather
 * than one stitched-together sheet. */

function PreviewHeroCard({
  draft,
  portfolio,
  reviews,
}: {
  draft: ProfileDraft;
  portfolio: PortfolioPhoto[];
  reviews: ProReview[];
}) {
  const hero = portfolio[0];
  const avg = averageRating(reviews);
  return (
    <ProfileCard>
      <div className="relative" style={{ aspectRatio: "4 / 3", backgroundColor: "#F0EBD8" }}>
        {hero ? (
          <img src={hero.url} alt={hero.alt} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar initials={draft.initials} avatarUrl={draft.avatarUrl} />
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "55%",
            background: "linear-gradient(to top, rgba(6,28,39,0.78) 0%, rgba(6,28,39,0) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 pb-3">
          <div className="flex flex-col" style={{ minWidth: 0 }}>
            <h2 style={{ fontFamily: UI, fontSize: 20, fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
              {draft.displayName}
            </h2>
            <span style={{ fontFamily: UI, fontSize: 12, color: "#FFFFFF", opacity: 0.85, marginTop: 2 }}>
              {draft.neighborhood}
            </span>
            <span style={{ fontFamily: UI, fontSize: 12, color: "#FFFFFF", opacity: 0.7, marginTop: 1 }}>
              Travels up to {draft.travelRadiusMi} mi
            </span>
          </div>
          {reviews.length > 0 ? (
            <div
              className="flex items-center gap-1"
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.95)",
              }}
            >
              <Star />
              <span style={{ fontFamily: UI, fontSize: 12, fontWeight: 700, color: NAVY }}>
                {avg.toFixed(1)}
              </span>
              <span style={{ fontFamily: UI, fontSize: 11, color: NAVY, opacity: 0.55 }}>
                ({reviews.length})
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </ProfileCard>
  );
}

function PreviewIdentityCard({ draft }: { draft: ProfileDraft }) {
  const showLicensed = draft.certificate === "verified";
  return (
    <ProfileCard>
      <div className="flex flex-col gap-3 px-5 py-4">
        {draft.headline ? (
          <p style={{ fontFamily: UI, fontSize: 14, color: NAVY, opacity: 0.85 }}>
            {draft.headline}
          </p>
        ) : null}
        {showLicensed ? (
          <div
            className="flex items-center gap-1.5 self-start"
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              backgroundColor: "rgba(255,130,63,0.12)",
              border: "1px solid rgba(255,130,63,0.30)",
            }}
          >
            <BagelIcon />
            <span style={{ fontFamily: UI, fontSize: 11, fontWeight: 600, color: ORANGE }}>
              Licensed cosmetologist
            </span>
          </div>
        ) : null}
        {draft.specializations.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {draft.specializations.map((s) => (
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
      </div>
    </ProfileCard>
  );
}

function PreviewRecentWorkCard({ photos }: { photos: PortfolioPhoto[] }) {
  return (
    <ProfileCard>
      <div className="px-5 py-4">
        <SectionLabel>Recent work</SectionLabel>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-lg"
              style={{ border: "1px solid rgba(6,28,39,0.06)" }}
            >
              <img src={p.url} alt={p.alt} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </ProfileCard>
  );
}

function PreviewServicesCard({ services }: { services: ProService[] }) {
  return (
    <ProfileCard>
      <div className="px-5 py-4">
        <SectionLabel>Services</SectionLabel>
        <div className="mt-1">
          {services.map((s, i) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-4 py-3"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(6,28,39,0.06)" }}
            >
              <div className="flex flex-col gap-0.5" style={{ flex: 1 }}>
                <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, color: NAVY }}>
                  {s.name}
                </span>
                <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.55 }}>
                  {formatDuration(s.durationMin)}
                </span>
              </div>
              <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: NAVY }}>
                ${s.priceUsd}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProfileCard>
  );
}

function PreviewAboutCard({ about }: { about: string }) {
  return (
    <ProfileCard>
      <div className="px-5 py-4">
        <SectionLabel>About</SectionLabel>
        <p style={{ fontFamily: UI, fontSize: 14, color: NAVY, opacity: 0.85, lineHeight: 1.55, marginTop: 6 }}>
          {about}
        </p>
      </div>
    </ProfileCard>
  );
}

function PreviewReviewsCard({ reviews }: { reviews: ProReview[] }) {
  const avg = averageRating(reviews);
  return (
    <ProfileCard>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Reviews</SectionLabel>
          <div className="flex items-center gap-1">
            <Star />
            <span style={{ fontFamily: UI, fontSize: 12, fontWeight: 600, color: NAVY }}>
              {avg.toFixed(1)}
            </span>
            <span style={{ fontFamily: UI, fontSize: 11, color: NAVY, opacity: 0.55 }}>
              ({reviews.length})
            </span>
          </div>
        </div>
        <div className="mt-2">
          {reviews.slice(0, 2).map((r, i) => (
            <div
              key={r.id}
              className="py-3"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(6,28,39,0.06)" }}
            >
              <Stars count={r.rating} />
              <p style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.85, lineHeight: 1.5, marginTop: 6 }}>
                {r.text}
              </p>
              <span style={{ fontFamily: UI, fontSize: 11, color: NAVY, opacity: 0.5, marginTop: 4, display: "inline-block" }}>
                {r.clientFirstInitial}. · {formatReviewDate(r.date)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ProfileCard>
  );
}

function PreviewBookCard() {
  return (
    <ProfileCard>
      <div className="px-5 py-4">
        <button
          type="button"
          disabled
          className="w-full rounded-full"
          style={{
            fontFamily: UI,
            fontSize: 15,
            fontWeight: 600,
            color: NAVY,
            backgroundColor: ORANGE,
            padding: "13px 16px",
            border: "none",
            cursor: "default",
          }}
        >
          Book
        </button>
      </div>
    </ProfileCard>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span
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
      {children}
    </span>
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

function CollapsibleHeader({
  title,
  count,
  open,
  onToggle,
  rightAction,
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  rightAction?: { label: string; onClick: () => void; accent?: boolean };
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 transition-opacity active:opacity-70"
        style={{ background: "transparent", border: "none", padding: 0 }}
      >
        <CardTitle>{title}</CardTitle>
        {typeof count === "number" && count > 0 ? (
          <span style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.55 }}>
            {count}
          </span>
        ) : null}
        <Chevron open={open} />
      </button>
      {rightAction ? (
        <button
          type="button"
          onClick={rightAction.onClick}
          className="transition-opacity active:opacity-50"
          style={{
            fontFamily: UI,
            fontSize: 13,
            fontWeight: 600,
            color: rightAction.accent ? ORANGE : NAVY,
            opacity: rightAction.accent ? 1 : 0.6,
            background: "transparent",
            border: "none",
          }}
        >
          {rightAction.label}
        </button>
      ) : null}
    </div>
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
  certificate: CertificateStatus;
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
  onEdit,
}: {
  draft: ProfileDraft;
  onEdit: () => void;
}) {
  const p = draft;
  const showLicensedBadge = p.certificate === "verified";

  return (
    <ProfileCard>
      {/* Horizontal identity row — avatar left, name + headline right,
       * pencil edit button on the far right (matches the demo sheet
       * layout the user prefers). */}
      <div className="flex items-center gap-4 px-5 py-5">
        <Avatar initials={p.initials} avatarUrl={p.avatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2
            style={{
              fontFamily: UI,
              fontSize: 20,
              fontWeight: 700,
              color: NAVY,
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}
          >
            {p.displayName}
          </h2>
          <button
            type="button"
            onClick={onEdit}
            className="self-start transition-opacity active:opacity-60"
            style={{
              fontFamily: UI,
              fontSize: 13,
              color: NAVY,
              opacity: p.headline ? 0.7 : 0.55,
              fontStyle: p.headline ? "normal" : "italic",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {p.headline || "Add a headline"}
          </button>
          {showLicensedBadge ? (
            <div
              className="mt-1 flex items-center gap-1.5 self-start"
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                backgroundColor: "rgba(255,130,63,0.12)",
                border: "1px solid rgba(255,130,63,0.30)",
              }}
            >
              <BagelIcon />
              <span style={{ fontFamily: UI, fontSize: 10.5, fontWeight: 600, color: ORANGE, letterSpacing: "0.02em" }}>
                Licensed
              </span>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit profile"
          className="flex shrink-0 items-center justify-center transition-opacity active:opacity-60"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(6,28,39,0.12)",
            color: NAVY,
          }}
        >
          <PencilIcon />
        </button>
      </div>

      {/* Secondary row — location + specializations + socials,
       * each on its own line per the no-middle-dots rule. */}
      <div
        className="flex flex-col gap-3 px-5 pb-5"
        style={{ borderTop: "1px solid rgba(6,28,39,0.06)", paddingTop: 14 }}
      >
        <div className="flex flex-col gap-0.5">
          <div style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.75 }}>
            {p.neighborhood}
          </div>
          <div style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.55 }}>
            Travels up to {p.travelRadiusMi} mi
          </div>
        </div>

        {p.specializations.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
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
          <div className="flex items-center gap-4">
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

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

/* ---------- Identity card (main page) ---------- */

function IdentityCard({
  draft,
  reviews,
  onEdit,
  onAvatarTap,
}: {
  draft: ProfileDraft;
  reviews: ProReview[];
  onEdit: () => void;
  onAvatarTap: () => void;
}) {
  const avg = reviews.length > 0 ? averageRating(reviews) : 0;
  return (
    <ProfileCard>
      <div className="flex items-center gap-4 px-5 py-5">
        <button
          type="button"
          onClick={onAvatarTap}
          aria-label={draft.avatarUrl ? "Change profile photo" : "Add profile photo"}
          className="relative shrink-0 rounded-full transition-opacity active:opacity-70"
          style={{ background: "transparent", border: "none", padding: 0 }}
        >
          <Avatar initials={draft.initials} avatarUrl={draft.avatarUrl} />
          <span
            aria-hidden
            className="absolute flex items-center justify-center"
            style={{
              right: -2,
              bottom: -2,
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: ORANGE,
              color: NAVY,
              border: "2px solid #FFFFFF",
              boxShadow: "0 2px 6px rgba(6,28,39,0.15)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2
            style={{
              fontFamily: UI,
              fontSize: 20,
              fontWeight: 700,
              color: NAVY,
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}
          >
            {draft.displayName}
          </h2>
          <span
            style={{
              fontFamily: UI,
              fontSize: 13,
              color: NAVY,
              opacity: draft.headline ? 0.7 : 0.5,
              fontStyle: draft.headline ? "normal" : "italic",
            }}
          >
            {draft.headline || "Add a headline"}
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <Star />
            {reviews.length > 0 ? (
              <>
                <span style={{ fontFamily: UI, fontSize: 12, fontWeight: 600, color: NAVY }}>
                  {avg.toFixed(1)}
                </span>
                <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.55 }}>
                  ({reviews.length})
                </span>
              </>
            ) : (
              <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.55 }}>
                No reviews yet
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit profile"
          className="flex shrink-0 items-center justify-center transition-opacity active:opacity-60"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(6,28,39,0.12)",
            color: NAVY,
          }}
        >
          <PencilIcon />
        </button>
      </div>
    </ProfileCard>
  );
}

/* ---------- Overview groups (main page rows) ---------- */

function OverviewGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div
        className="px-2"
        style={{
          fontFamily: UI,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "currentColor",
          opacity: 0.55,
        }}
      >
        {title}
      </div>
      <ProfileCard>{children}</ProfileCard>
    </section>
  );
}

function OverviewDivider() {
  return (
    <div
      aria-hidden
      style={{ height: 1, backgroundColor: "rgba(6,28,39,0.06)", marginLeft: 60 }}
    />
  );
}

function OverviewRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  right?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-opacity active:opacity-60"
      style={{ background: "transparent", border: "none" }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: "rgba(255,130,63,0.10)",
          color: ORANGE,
        }}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span style={{ fontFamily: UI, fontSize: 15, fontWeight: 600, color: NAVY }}>
          {title}
        </span>
        {subtitle ? (
          <span
            style={{
              fontFamily: UI,
              fontSize: 12,
              color: NAVY,
              opacity: 0.55,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
      {right ? (
        <span
          style={{
            fontFamily: UI,
            fontSize: 12,
            fontWeight: 600,
            color: ORANGE,
            backgroundColor: "rgba(255,130,63,0.12)",
            padding: "4px 10px",
            borderRadius: 999,
            flexShrink: 0,
          }}
        >
          {right}
        </span>
      ) : (
        <span aria-hidden style={{ color: NAVY, opacity: 0.35, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </button>
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
  const [open, setOpen] = useState(true);
  return (
    <ProfileCard>
      <CollapsibleHeader
        title="Portfolio"
        count={photos.length}
        open={open}
        onToggle={() => setOpen((v) => !v)}
        rightAction={photos.length > 0 ? { label: "Edit", onClick: goManage } : undefined}
      />
      {!open ? null : photos.length === 0 ? (
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
  const [open, setOpen] = useState(true);
  return (
    <ProfileCard>
      <CollapsibleHeader
        title="Services"
        count={services.length}
        open={open}
        onToggle={() => setOpen((v) => !v)}
        rightAction={{ label: "Add", onClick: onAdd, accent: true }}
      />
      {!open ? null : services.length === 0 ? (
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
  const [open, setOpen] = useState(true);

  return (
    <ProfileCard>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 pt-4 pb-3 text-left transition-opacity active:opacity-70"
        style={{ background: "transparent", border: "none" }}
      >
        <div className="flex items-center gap-2">
          <CardTitle>Reviews</CardTitle>
          {reviews.length > 0 ? (
            <span style={{ fontFamily: UI, fontSize: 13, color: NAVY, opacity: 0.55 }}>
              {reviews.length}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {reviews.length > 0 ? (
            <div className="flex items-center gap-1">
              <Star />
              <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 600, color: NAVY }}>
                {avg.toFixed(1)}
              </span>
            </div>
          ) : null}
          <Chevron open={open} />
        </div>
      </button>
      {!open ? null : reviews.length === 0 ? (
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

/* ---------- Certificate ---------- */

function CertificateCard({
  status,
  onEdit,
}: {
  status: CertificateStatus;
  onEdit: () => void;
}) {
  const meta = certificateMeta(status);
  return (
    <ProfileCard>
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-opacity active:opacity-60"
        style={{ background: "transparent", border: "none" }}
      >
        <div className="flex flex-col gap-1.5" style={{ flex: 1, minWidth: 0 }}>
          <CardEyebrow>Cosmetology certificate</CardEyebrow>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: meta.dot,
              }}
            />
            <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: NAVY }}>
              {meta.title}
            </span>
          </div>
          <p style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.6, marginTop: 2, lineHeight: 1.45 }}>
            {meta.body}
          </p>
        </div>
        <span
          style={{
            fontFamily: UI,
            fontSize: 13,
            fontWeight: 600,
            color: status === "verified" || status === "pending" ? NAVY : ORANGE,
            opacity: status === "verified" || status === "pending" ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {meta.action}
        </span>
      </button>
    </ProfileCard>
  );
}

function certificateMeta(status: CertificateStatus): {
  title: string;
  body: string;
  action: string;
  dot: string;
} {
  switch (status) {
    case "verified":
      return {
        title: "Verified",
        body: "Clients see your Licensed cosmetologist badge.",
        action: "Manage",
        dot: SUCCESS,
      };
    case "pending":
      return {
        title: "Under review",
        body: "We usually verify within 1–2 business days.",
        action: "View",
        dot: ORANGE,
      };
    case "rejected":
      return {
        title: "Couldn't verify",
        body: "Try uploading a clearer copy or mark that you don't have one.",
        action: "Fix",
        dot: "#DC2626",
      };
    case "none":
    default:
      return {
        title: "Not added",
        body: "Upload your license to earn a Licensed badge on your profile.",
        action: "Add",
        dot: "rgba(6,28,39,0.30)",
      };
  }
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

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

/* ---------- Inline client preview (shown directly on the editing screen) -- */

function ClientPreviewInline({
  draft,
  portfolio,
  reviews,
}: {
  draft: ProfileDraft;
  portfolio: PortfolioPhoto[];
  reviews: ProReview[];
}) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div
        style={{
          fontFamily: UI,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "currentColor",
          opacity: 0.55,
          paddingLeft: 4,
        }}
      >
        Client preview
      </div>
      <PreviewHeroCard draft={draft} portfolio={portfolio} reviews={reviews} />
      <PreviewIdentityCard draft={draft} />
      {portfolio.length > 1 ? (
        <PreviewRecentWorkCard photos={portfolio.slice(1, 5)} />
      ) : null}
      {draft.services.length > 0 ? (
        <PreviewServicesCard services={draft.services} />
      ) : null}
      {draft.about.trim().length > 0 ? (
        <PreviewAboutCard about={draft.about} />
      ) : null}
      {reviews.length > 0 ? (
        <PreviewReviewsCard reviews={reviews} />
      ) : null}
    </div>
  );
}

/* ---------- Profile edit sheet (opened by the header pencil) -------------- */

function ProfileEditSheet({
  open,
  onOpenChange,
  draft,
  certificate,
  proState,
  checklist,
  onOpenHeadline,
  onOpenAbout,
  onOpenLocation,
  onOpenCertificate,
  onAddService,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: ProfileDraft;
  certificate: CertificateStatus;
  proState: ResolvedProState;
  checklist: ChecklistItem[];
  onOpenHeadline: () => void;
  onOpenAbout: () => void;
  onOpenLocation: () => void;
  onOpenCertificate: () => void;
  onAddService: () => void;
}) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const close = () => onOpenChange(false);
  const go = (to: string) => {
    close();
    void navigate({ to });
  };

  const certMeta = certificateMeta(certificate);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await auth.reset();
    } finally {
      setSigningOut(false);
      close();
      void navigate({ to: "/login" });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-0 p-0"
        style={{
          backgroundColor: NAVY,
          color: "#FFFFFF",
          height: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SheetHeader className="flex flex-row items-center justify-between px-5 pb-1 pt-5 text-left">
          <SheetTitle
            style={{
              fontFamily: UI,
              fontSize: 18,
              fontWeight: 600,
              color: "#FFFFFF",
              letterSpacing: "-0.005em",
            }}
          >
            Edit profile
          </SheetTitle>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="flex items-center justify-center transition-opacity active:opacity-60"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.10)",
              color: "#FFFFFF",
              border: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-3">
          <SheetGroup title="Basics">
            <SheetRow
              icon={<PencilIcon />}
              title="Name and headline"
              subtitle={draft.headline || "Add a headline"}
              onClick={onOpenHeadline}
            />
            <SheetDivider />
            <SheetRow
              icon={<UserIcon />}
              title="About"
              subtitle={
                draft.about.trim().length > 0
                  ? truncate(draft.about, 50)
                  : "Tell clients about your craft"
              }
              onClick={onOpenAbout}
            />
            <SheetDivider />
            <SheetCompletenessRow items={checklist} />
          </SheetGroup>

          <SheetGroup title="Storefront">
            <SheetRow
              icon={<ScissorsIcon />}
              title="Services & pricing"
              subtitle={
                draft.services.length > 0
                  ? `${draft.services.length} services`
                  : "Add services to get bookings"
              }
              onClick={onAddService}
            />
            <SheetDivider />
            <SheetRow
              icon={<PhotoIcon />}
              title="Portfolio"
              subtitle={
                draft.portfolio.length > 0
                  ? `${draft.portfolio.length} photos`
                  : "Add photos to start"
              }
              onClick={() => go("/profile/portfolio")}
            />
            <SheetDivider />
            <SheetRow
              icon={<StarOutlineIcon />}
              title="Reviews"
              subtitle="What clients are saying"
              disabled
            />
          </SheetGroup>

          <SheetGroup title="How you work">
            <SheetRow
              icon={<CalendarIcon />}
              title="Availability"
              subtitle={
                draft.availabilitySummary.trim().length > 0
                  ? draft.availabilitySummary
                  : "Set your weekly schedule"
              }
              onClick={() => go("/calendar")}
            />
            <SheetDivider />
            <SheetRow
              icon={<PinIcon />}
              title="Service area / Base location"
              subtitle={`${draft.neighborhood}`}
              onClick={onOpenLocation}
            />
            <SheetDivider />
            <SheetRow
              icon={<ClockIcon />}
              title="Booking rules"
              subtitle="2 hr prep · 24 hr lead"
              comingSoon
            />
            <SheetDivider />
            <SheetRow
              icon={<ShieldIcon />}
              title="Cancellation policy"
              subtitle="Moderate"
              comingSoon
            />
          </SheetGroup>

          <SheetGroup title="Account">
            <SheetRow
              icon={<UserIcon />}
              title="Personal info"
              subtitle={auth.email ?? "Name, email, phone"}
              comingSoon
            />
            <SheetDivider />
            <SheetRow
              icon={<BadgeIcon />}
              title="Verification"
              subtitle={certMeta.title}
              right={certificate === "verified" ? "Verified" : undefined}
              onClick={onOpenCertificate}
            />
            <SheetDivider />
            <SheetRow
              icon={<CardIcon />}
              title="Payouts"
              subtitle="Add bank account"
              onClick={() => go("/earnings")}
            />
            <SheetDivider />
            <SheetRow
              icon={<DocumentIcon />}
              title="Tax info"
              subtitle="W-9, 1099 forms"
              onClick={() => go("/earnings")}
            />
            <SheetDivider />
            <SheetRow
              icon={<BellIcon />}
              title="Notifications"
              subtitle="Push, email, SMS"
              comingSoon
            />
          </SheetGroup>

          <SheetGroup title="Extras">
            <SheetRow
              icon={<LinkIcon />}
              title="Connect socials"
              subtitle="Share your work"
              comingSoon
            />
            <SheetDivider />
            <SheetRow
              icon={<GiftIcon />}
              title="Refer a pro"
              subtitle="Earn $50 per referral"
              comingSoon
            />
            <SheetDivider />
            <SheetRow
              icon={<HelpIcon />}
              title="Help & support"
              subtitle="FAQs and contact"
              comingSoon
            />
            <SheetDivider />
            <SheetRow
              icon={<SunIcon />}
              title="App appearance"
              subtitle="System"
              comingSoon
            />
            <SheetDivider />
            <SheetRow
              icon={<GearIcon />}
              title="Settings"
              subtitle="Privacy, password, more"
              onClick={() => go("/settings")}
            />
          </SheetGroup>

          {proState === "live" ? (
            <SheetGroup title="Visibility">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex flex-col gap-1">
                  <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: NAVY }}>
                    {draft.visibility === "live"
                      ? "Your profile is live"
                      : "Your profile is paused"}
                  </span>
                  <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.6 }}>
                    {draft.visibility === "live"
                      ? "Clients can find and book you."
                      : "Hidden from search and booking."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateProfileDraft({
                      visibility: draft.visibility === "live" ? "paused" : "live",
                    })
                  }
                  className="transition-opacity active:opacity-60"
                  style={{
                    fontFamily: UI,
                    fontSize: 13,
                    fontWeight: 600,
                    color: draft.visibility === "live" ? "#DC2626" : ORANGE,
                    background: "transparent",
                    border: "none",
                  }}
                >
                  {draft.visibility === "live" ? "Pause" : "Resume"}
                </button>
              </div>
            </SheetGroup>
          ) : null}

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 w-full rounded-full transition-opacity active:opacity-70"
            style={{
              fontFamily: UI,
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.20)",
              padding: "13px 16px",
            }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>

          <p
            className="pt-3 text-center"
            style={{
              fontFamily: UI,
              fontSize: 11,
              color: "#FFFFFF",
              opacity: 0.4,
              letterSpacing: "0.04em",
            }}
          >
            Ewà Biz · v1.0.2
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SheetCompletenessRow({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const remaining = total - done;
  if (remaining === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className="flex shrink-0 items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: "rgba(255,130,63,0.10)",
          color: ORANGE,
          fontFamily: UI,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {pct}%
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: NAVY }}>
          Profile completeness
        </span>
        <div
          aria-hidden
          className="overflow-hidden"
          style={{ height: 4, borderRadius: 999, backgroundColor: "rgba(6,28,39,0.08)" }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              backgroundColor: ORANGE,
              borderRadius: 999,
              transition: "width 320ms ease",
            }}
          />
        </div>
        <span style={{ fontFamily: UI, fontSize: 12, color: NAVY, opacity: 0.55 }}>
          {remaining} {remaining === 1 ? "item" : "items"} left
        </span>
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  const trimmed = s.trim();
  if (trimmed.length <= n) return trimmed;
  return `${trimmed.slice(0, n - 1).trimEnd()}…`;
}

function SheetGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <div
        className="px-2 pb-2"
        style={{
          fontFamily: UI,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#FFFFFF",
          opacity: 0.55,
        }}
      >
        {title}
      </div>
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SheetDivider() {
  return (
    <div
      aria-hidden
      style={{ height: 1, backgroundColor: "rgba(6,28,39,0.06)", marginLeft: 56 }}
    />
  );
}

function SheetRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
  disabled,
  comingSoon,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  right?: string;
  onClick?: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}) {
  const isDisabled = disabled || comingSoon;
  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-opacity active:opacity-60 disabled:cursor-default"
      style={{ background: "transparent", border: "none" }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: 32, height: 32, color: NAVY, opacity: 0.7 }}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span style={{ fontFamily: UI, fontSize: 15, fontWeight: 600, color: NAVY }}>
          {title}
        </span>
        {subtitle ? (
          <span
            style={{
              fontFamily: UI,
              fontSize: 12,
              color: NAVY,
              opacity: 0.55,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
      {comingSoon ? (
        <ComingSoonPill />
      ) : right ? (
        <span
          style={{
            fontFamily: UI,
            fontSize: 12,
            fontWeight: 600,
            color: ORANGE,
            flexShrink: 0,
            paddingRight: 4,
          }}
        >
          {right}
        </span>
      ) : (
        <span aria-hidden style={{ color: NAVY, opacity: 0.35, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </button>
  );
}

export function ComingSoonPill() {
  return (
    <span
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: NAVY,
        opacity: 0.7,
        backgroundColor: "rgba(6,28,39,0.08)",
        padding: "3px 8px",
        borderRadius: 999,
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      Coming soon
    </span>
  );
}

/* Sheet row icons — kept lightweight inline so the sheet stays self-contained. */
function ScissorsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </svg>
  );
}
function PhotoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M21 16l-5-5-7 8" />
    </svg>
  );
}
function StarOutlineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function BadgeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </svg>
  );
}
function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h6" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 7 2 7H4s2-2 2-7" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9M12 8v13M12 8s-3-5-6-3 0 5 3 5M12 8s3-5 6-3-0 5-3 5" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .8-1.5 1.5-1.5 3M12 17h.01" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
