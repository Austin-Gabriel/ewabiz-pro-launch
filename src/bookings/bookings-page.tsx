import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HomeShell, useHomeTheme, HOME_SANS } from "@/home/home-shell";
import { BottomTabs } from "@/home/bottom-tabs";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import { OnlineModeStrip } from "@/components/online-mode-strip";
import { useDevState } from "@/dev-state/dev-state-context";
import { LifecycleBody } from "@/bookings/lifecycle/lifecycle-surface";
import { formatUsd, type Booking } from "@/data/mock-data";
import {
  ALL_BOOKINGS,
  HISTORY_BOOKINGS,
  horizonOf,
  formatExpiresIn,
  formatTimeOnly,
  type Booking as CanonicalBooking,
  type TimeHorizon,
} from "@/data/mock-bookings";
import {
  BookingRowCard,
  BookingsGroup,
  BookingsSectionHeader,
  BookingTimeline,
  type TimelineEntry,
} from "@/bookings/booking-row-card";
import { useReschedule, formatTimeLeft } from "@/calendar/reschedule-context";

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
  return (
    <HomeShell>
      <OnlineModeStrip hide={isInProgressTab} />
      <ActiveBookingStrip hide={isInProgressTab} />
      <PageHeader />
      <TabBar tab={tab} onSelect={onTabChange} />

      <div className="flex flex-1 flex-col px-4 pb-2 pt-4">
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
        if (k === "calendar") navigate({ to: "/calendar" });
        if (k === "earnings") navigate({ to: "/earnings" });
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
              color: text,
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
  const navigate = useNavigate();
  // Active bookings (excluding completed/cancelled) live in a single
  // dismissible registry so accept/decline mutate the list locally.
  const [bookings, setBookings] = useState<CanonicalBooking[]>(() =>
    ALL_BOOKINGS.filter((b) => b.status === "confirmed" || b.status === "pending"),
  );

  const openDetail = (id: string) =>
    navigate({ to: "/bookings/$id", params: { id }, search: { from: "bookings", tab: "upcoming" } });

  const handleAccept = (id: string) =>
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)),
    );
  const handleDecline = (id: string) =>
    setBookings((prev) => prev.filter((b) => b.id !== id));

  // Group by time horizon. Sections are keyed in canonical display order.
  // Pending bookings live in their own dedicated top section. They do NOT
  // appear in the time-horizon groups — one or the other, never both.
  const pending = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "pending")
        .sort((a, b) => {
          const ax = a.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
          const bx = b.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
          return ax - bx;
        }),
    [bookings],
  );

  const groups = useMemo(() => {
    const buckets: Record<TimeHorizon, CanonicalBooking[]> = {
      today: [],
      "this-week": [],
      "this-month": [],
      "next-month": [],
      later: [],
    };
    for (const b of bookings) {
      if (b.status === "pending") continue;
      buckets[horizonOf(b.startsAt)].push(b);
    }
    for (const k of Object.keys(buckets) as TimeHorizon[]) {
      buckets[k].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    }
    return buckets;
  }, [bookings]);

  const total =
    pending.length +
    groups.today.length +
    groups["this-week"].length +
    groups["this-month"].length +
    groups["next-month"].length +
    groups.later.length;

  if (total === 0) {
    return (
      <EmptyBlock
        title="Nothing on the books yet"
        sub="Your scheduled bookings will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col pb-6">
      <PendingSection
        bookings={pending}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onOpen={openDetail}
      />
      <TodayHorizonGroup
        bookings={groups.today}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onOpen={openDetail}
      />
      <CollapsibleHorizonGroup
        title="This Week"
        bookings={groups["this-week"]}
        defaultOpen
        onAccept={handleAccept}
        onDecline={handleDecline}
        onOpen={openDetail}
      />
      <CollapsibleHorizonGroup
        title="This Month"
        bookings={groups["this-month"]}
        defaultOpen={false}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onOpen={openDetail}
      />
      <CollapsibleHorizonGroup
        title="Next Month"
        bookings={groups["next-month"]}
        defaultOpen={false}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onOpen={openDetail}
      />
      <CollapsibleHorizonGroup
        title="Later"
        bookings={groups.later}
        defaultOpen={false}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onOpen={openDetail}
      />
    </div>
  );
}

/* ---- Pending section (top, non-collapsable, hidden when empty) ---- */

function PendingSection({
  bookings,
  onAccept,
  onDecline,
  onOpen,
}: {
  bookings: CanonicalBooking[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const { text } = useHomeTheme();
  if (bookings.length === 0) return null;
  return (
    <BookingsGroup>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2
          style={{
            fontFamily: UI,
            fontSize: 16,
            fontWeight: 700,
            color: text,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Pending
        </h2>
        <span
          style={{
            fontFamily: UI,
            fontSize: 12,
            color: text,
            opacity: 0.55,
            fontWeight: 500,
            letterSpacing: "-0.005em",
          }}
        >
          {bookings.length} {bookings.length === 1 ? "request" : "requests"}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {bookings.map((b) => (
          <BookingRowCard
            key={b.id}
            booking={adaptCanonical(b)}
            pending={pendingPropsFor(b, onAccept, onDecline)}
            onSelect={() => onOpen(b.id)}
          />
        ))}
      </div>
    </BookingsGroup>
  );
}

/* ---- Horizon groups ---- */

function adaptCanonical(b: CanonicalBooking): Booking {
  return {
    id: b.id,
    clientName: b.clientName,
    clientInitial: b.clientInitial,
    service: b.service,
    startsAt: formatTimeOnly(b.startsAt),
    durationMin: b.durationMin,
    priceUsd: b.priceUsd,
    isNewClient: b.isNewClient,
    location: b.neighborhood,
    address: b.address,
    distance: b.distance,
    avatarHue: b.avatarHue,
  };
}

function pendingPropsFor(
  b: CanonicalBooking,
  onAccept: (id: string) => void,
  onDecline: (id: string) => void,
) {
  if (b.status !== "pending") return undefined;
  return {
    expiresLabel: b.expiresAt ? formatExpiresIn(b.expiresAt) : "Expires soon",
    onAccept: () => onAccept(b.id),
    onDecline: () => onDecline(b.id),
  };
}

function pendingReschedulePropFor(
  bookingId: string,
  proposalFor: ReturnType<typeof useReschedule>["proposalFor"],
  _tick: number,
): { timeLeftLabel: string } | undefined {
  const p = proposalFor(bookingId);
  if (!p || p.status !== "pending") return undefined;
  return { timeLeftLabel: formatTimeLeft(p.expiresAt.getTime() - Date.now()) };
}

function TodayHorizonGroup({
  bookings,
  onAccept,
  onDecline,
  onOpen,
}: {
  bookings: CanonicalBooking[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const { proposalFor, tick } = useReschedule();
  if (bookings.length === 0) return null;

  const entries: TimelineEntry[] = bookings.map((b, i) => {
    const adapted = adaptCanonical(b);
    const [time, meridiem] = formatStackedTime(adapted.startsAt);
    const prev = i > 0 ? bookings[i - 1] : undefined;
    const gapBefore = prev
      ? gapBetween(prev.startsAt, prev.durationMin, b.startsAt)
      : undefined;
    return {
      booking: adapted,
      time,
      meridiem,
      isNext: i === 0 && b.status === "confirmed",
      gapBefore,
      pending: pendingPropsFor(b, onAccept, onDecline),
      pendingReschedule: pendingReschedulePropFor(b.id, proposalFor, tick),
      onOpen: () => onOpen(b.id),
    };
  });

  const totalUsd = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.priceUsd, 0);

  return (
    <BookingsGroup>
      <BookingsSectionHeader
        title="Today"
        meta={`${bookings.length} ${bookings.length === 1 ? "booking" : "bookings"} — ${formatUsd(totalUsd)}`}
        date={currentDateLabel()}
      />
      <BookingTimeline entries={entries} />
    </BookingsGroup>
  );
}

function CollapsibleHorizonGroup({
  title,
  bookings,
  defaultOpen,
  onAccept,
  onDecline,
  onOpen,
}: {
  title: string;
  bookings: CanonicalBooking[];
  defaultOpen: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { text } = useHomeTheme();
  const { proposalFor, tick } = useReschedule();
  if (bookings.length === 0) return null;

  return (
    <BookingsGroup>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-baseline justify-between gap-3 text-left transition-opacity active:opacity-70"
        aria-expanded={open}
      >
        <h2
          style={{
            fontFamily: UI,
            fontSize: 16,
            fontWeight: 700,
            color: text,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontFamily: UI,
            fontSize: 12,
            color: text,
            opacity: 0.55,
            fontWeight: 500,
            letterSpacing: "-0.005em",
          }}
        >
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
          <span
            aria-hidden
            style={{
              display: "inline-block",
              marginLeft: 8,
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 180ms ease",
            }}
          >
            ›
          </span>
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-2.5">
          {bookings.map((b) => (
            <BookingRowCard
              key={b.id}
              booking={adaptCanonical(b)}
              pending={pendingPropsFor(b, onAccept, onDecline)}
              pendingReschedule={pendingReschedulePropFor(b.id, proposalFor, tick)}
              onSelect={() => onOpen(b.id)}
            />
          ))}
        </div>
      ) : null}
    </BookingsGroup>
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
  const navigate = useNavigate();
  const now = new Date();

  const buckets = useMemo(() => {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const out: Record<"today" | "yesterday" | "this-week" | "earlier", CanonicalBooking[]> = {
      today: [],
      yesterday: [],
      "this-week": [],
      earlier: [],
    };
    for (const b of HISTORY_BOOKINGS) {
      const t = b.startsAt;
      if (t >= startOfToday) out.today.push(b);
      else if (t >= startOfYesterday) out.yesterday.push(b);
      else if (t >= startOfWeek) out["this-week"].push(b);
      else out.earlier.push(b);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (id: string) =>
    navigate({ to: "/bookings/$id", params: { id }, search: { from: "bookings", tab: "history" } });

  return (
    <div className="flex flex-col pb-6">
      <HistoryGroup label="Today" items={buckets.today} onOpen={open} />
      <HistoryGroup label="Yesterday" items={buckets.yesterday} onOpen={open} />
      <HistoryGroup label="This Week" items={buckets["this-week"]} onOpen={open} />
      <HistoryGroup label="Earlier" items={buckets.earlier} onOpen={open} />
    </div>
  );
}

function HistoryGroup({
  label,
  items,
  onOpen,
}: {
  label: string;
  items: CanonicalBooking[];
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <BookingsGroup>
      <BookingsSectionHeader title={label} />
      <div className="flex flex-col gap-2.5">
        {items.map((b) => (
          <BookingRowCard
            key={b.id}
            booking={adaptCanonical(b)}
            cancelled={b.status === "cancelled"}
            onSelect={() => onOpen(b.id)}
          />
        ))}
      </div>
    </BookingsGroup>
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

/* ---------------- Time helpers ---------------- */

function formatStackedTime(t: string): [string, "AM" | "PM"] {
  // Accepts every shape formatTime() can emit: "10:30 AM", "1 PM", "10:30",
  // even "13:00". Without optional minutes the regex was failing on the
  // on-the-hour PM form ("1 PM") and returning ["1 PM", "AM"] — which
  // showed up as "1 PM" stacked over "AM" on the rail.
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return [t, "AM"];
  let h = parseInt(m[1], 10);
  const mm = m[2];
  let suffix: "AM" | "PM";
  if (m[3]) {
    suffix = m[3].toUpperCase() as "AM" | "PM";
  } else {
    if (h === 0) { h = 12; suffix = "AM"; }
    else if (h === 12) { suffix = "PM"; }
    else if (h > 12) { h -= 12; suffix = "PM"; }
    else if (h >= 1 && h <= 6) { suffix = "PM"; }
    else { suffix = "AM"; }
  }
  // Rail always shows "H:MM" so on-the-hour times read as "1:00 / PM"
  // rather than "1 / PM" — the rail's geometry expects two characters per
  // line. (Other surfaces that use formatTime directly still drop the
  // ":00" via the user's preferred no-leading-zero rule.)
  const timeStr = `${h}:${mm ?? "00"}`;
  return [timeStr, suffix];
}

function gapBetween(prevStart: Date, prevDuration: number, nextStart: Date): string | undefined {
  // Compute the open window between bookings directly from Date objects.
  // The previous version parsed pre-formatted strings, which produced NaN
  // whenever the string shape didn't match (e.g., a Date coerced to string).
  const prevEndMs = prevStart.getTime() + prevDuration * 60_000;
  const gap = Math.round((nextStart.getTime() - prevEndMs) / 60_000);
  if (!Number.isFinite(gap) || gap <= 5) return undefined;
  const h = Math.floor(gap / 60);
  const m = gap % 60;
  if (h === 0) return `${m}m gap`;
  if (m === 0) return `${h}h gap`;
  return `${h}h ${m}m gap`;
}

function toMinutes(t: string): number {
  const [time, suffix] = formatStackedTime(t);
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (suffix === "PM" && h !== 12) h += 12;
  if (suffix === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function currentDateLabel(d: Date = new Date()): string {
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const month = d.toLocaleDateString(undefined, { month: "short" });
  const day = d.getDate();
  return `${weekday}, ${month} ${day}`;
}
