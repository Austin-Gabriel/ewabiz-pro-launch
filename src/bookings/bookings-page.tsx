import { type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HomeShell, useHomeTheme, HOME_SANS, CardTheme } from "@/home/home-shell";
import { BottomTabs } from "@/home/bottom-tabs";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import { useDevState } from "@/dev-state/dev-state-context";
import { LifecycleBody } from "@/bookings/lifecycle/lifecycle-surface";
import { LIFECYCLE_BOOKING } from "@/bookings/lifecycle/lifecycle-data";
import { LIVE_ACTIVE_DAY, formatUsd, type Booking } from "@/data/mock-data";

const UI = HOME_SANS;
const ORANGE = "#FF823F";

export type BookingsTab = "upcoming" | "in-progress" | "history";

export function BookingsPage({
  tab,
  onTabChange,
}: {
  tab: BookingsTab;
  onTabChange: (t: BookingsTab) => void;
}) {
  const { state: dev } = useDevState();
  const isInProgressTab = tab === "in-progress";
  // The In Progress tab embeds the lifecycle body when a booking is active.
  // Strip is hidden on this tab (redundant with the body).
  return (
    <HomeShell>
      <ActiveBookingStrip hide={isInProgressTab} />
      <PageHeader />
      <TabBar tab={tab} onSelect={onTabChange} />

      <div className="flex flex-1 flex-col px-4 pb-2 pt-3">
        {tab === "upcoming" ? <UpcomingTab /> : null}
        {tab === "in-progress" ? (
          <InProgressTab lifecycleActive={dev.lifecycle !== "none" && dev.lifecycle !== "incoming"} />
        ) : null}
        {tab === "history" ? <HistoryTab /> : null}
      </div>

      <BottomTabsForBookings />
    </HomeShell>
  );
}

function BottomTabsForBookings() {
  const navigate = useNavigate();
  return (
    <BottomTabs
      active="bookings"
      onSelect={(k) => {
        if (k === "home") navigate({ to: "/home" });
        if (k === "bookings") navigate({ to: "/bookings" });
      }}
    />
  );
}

/* ---------------- Header ---------------- */

function PageHeader() {
  const { text } = useHomeTheme();
  return (
    <div className="flex items-center justify-between px-4 pt-2" style={{ height: 48 }}>
      <h1
        style={{
          fontFamily: UI,
          fontSize: 22,
          fontWeight: 700,
          color: text,
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        Bookings
      </h1>
    </div>
  );
}

/* ---------------- Tab bar ---------------- */

function TabBar({
  tab,
  onSelect,
}: {
  tab: BookingsTab;
  onSelect: (t: BookingsTab) => void;
}) {
  const { state: dev } = useDevState();
  const inProgressDot = dev.lifecycle !== "none" && dev.lifecycle !== "incoming";
  const tabs: { key: BookingsTab; label: string; dot?: boolean }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "in-progress", label: "In Progress", dot: inProgressDot },
    { key: "history", label: "History" },
  ];
  const { text, borderCol } = useHomeTheme();
  return (
    <div
      className="mt-1 flex items-center gap-1 px-4"
      style={{ borderBottom: `1px solid ${borderCol}` }}
      role="tablist"
    >
      {tabs.map((t) => {
        const active = t.key === tab;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(t.key)}
            className="relative flex items-center gap-1.5 py-3 transition-opacity active:opacity-70"
            style={{
              flex: 1,
              fontFamily: UI,
              fontSize: 13,
              fontWeight: 600,
              color: active ? text : text,
              opacity: active ? 1 : 0.5,
              backgroundColor: "transparent",
              border: "none",
              borderBottom: active ? `2px solid ${ORANGE}` : "2px solid transparent",
              marginBottom: -1,
              letterSpacing: "-0.005em",
            }}
          >
            <span>{t.label}</span>
            {t.dot ? (
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 9999,
                  backgroundColor: ORANGE,
                  boxShadow: "0 0 8px rgba(255,130,63,0.6)",
                  animation: "ewa-tab-dot 1800ms ease-in-out infinite",
                }}
              />
            ) : null}
          </button>
        );
      })}
      <style>{`
        @keyframes ewa-tab-dot {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Upcoming ---------------- */

function UpcomingTab() {
  const today = LIVE_ACTIVE_DAY.bookingsToday as Booking[];
  if (today.length === 0) {
    return (
      <EmptyBlock
        title="Nothing on the books yet"
        sub="Your scheduled bookings will appear here."
      />
    );
  }
  return (
    <div className="flex flex-col gap-4 pb-6">
      <Section title="Today">
        {today.map((b) => (
          <BookingRow key={b.id} booking={b} />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { text } = useHomeTheme();
  return (
    <div>
      <div
        style={{
          fontFamily: UI,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: text,
          opacity: 0.55,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <CardTheme>
      <BookingRowInner booking={booking} />
    </CardTheme>
  );
}

function BookingRowInner({ booking }: { booking: Booking }) {
  const { text, cardSurface, cardBorder } = useHomeTheme();
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
      style={{
        backgroundColor: cardSurface,
        border: `1px solid ${cardBorder}`,
        boxShadow: "0 1px 2px rgba(6,28,39,0.05)",
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: 44,
          height: 44,
          backgroundColor: "rgba(255,130,63,0.16)",
          border: "1px solid rgba(255,130,63,0.4)",
          color: "#7A2E0E",
          fontFamily: UI,
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {booking.clientInitial}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{ fontFamily: UI, fontSize: 14.5, fontWeight: 700, color: text, letterSpacing: "-0.005em" }}
        >
          {booking.clientName}
        </div>
        <div
          className="truncate"
          style={{ fontFamily: UI, fontSize: 12.5, color: text, opacity: 0.6, marginTop: 2 }}
        >
          {booking.service} · {booking.location ?? "Brooklyn"}
        </div>
      </div>
      <div className="flex flex-col items-end leading-tight">
        <span
          style={{
            fontFamily: UI,
            fontSize: 13,
            fontWeight: 700,
            color: text,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.005em",
          }}
        >
          {booking.startsAt}
        </span>
        <span
          style={{
            fontFamily: UI,
            fontSize: 11.5,
            color: text,
            opacity: 0.55,
            marginTop: 2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatUsd(booking.priceUsd)}
        </span>
      </div>
    </div>
  );
}

/* ---------------- In Progress ---------------- */

function InProgressTab({ lifecycleActive }: { lifecycleActive: boolean }) {
  if (!lifecycleActive) {
    return (
      <EmptyBlock
        title="No active booking"
        sub="When a booking starts, you'll see it here."
      />
    );
  }
  return (
    <div className="flex flex-1 flex-col">
      <LifecycleBody />
    </div>
  );
}

/* ---------------- History ---------------- */

function HistoryTab() {
  // One static example to show shape.
  const past: Booking[] = [
    {
      id: "h1",
      clientName: LIFECYCLE_BOOKING.clientName,
      clientInitial: LIFECYCLE_BOOKING.clientInitial,
      service: LIFECYCLE_BOOKING.service,
      startsAt: "Yesterday",
      durationMin: LIFECYCLE_BOOKING.durationMin,
      priceUsd: LIFECYCLE_BOOKING.priceUsd,
      location: LIFECYCLE_BOOKING.neighborhood,
      avatarHue: "peach",
    },
  ];
  return (
    <div className="flex flex-col gap-4 pb-6">
      <Section title="This week">
        {past.map((b) => (
          <BookingRow key={b.id} booking={b} />
        ))}
      </Section>
    </div>
  );
}

/* ---------------- Empty ---------------- */

function EmptyBlock({ title, sub }: { title: string; sub: string }) {
  const { text } = useHomeTheme();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
      <p
        style={{
          fontFamily: UI,
          fontSize: 18,
          fontWeight: 600,
          color: text,
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: UI,
          fontSize: 13,
          color: text,
          opacity: 0.6,
          marginTop: 8,
          maxWidth: 260,
          lineHeight: 1.5,
        }}
      >
        {sub}
      </p>
    </div>
  );
}