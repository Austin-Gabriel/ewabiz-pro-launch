import { useNavigate } from "@tanstack/react-router";
import { HomeShell, useHomeTheme, HOME_SANS } from "@/home/home-shell";
import { BottomTabs } from "@/home/bottom-tabs";
import { ActiveBookingStrip } from "@/components/active-booking-strip";
import { useDevState } from "@/dev-state/dev-state-context";
import { LifecycleBody } from "@/bookings/lifecycle/lifecycle-surface";
import { LIFECYCLE_BOOKING } from "@/bookings/lifecycle/lifecycle-data";
import { LIVE_ACTIVE_DAY, formatUsd, type Booking } from "@/data/mock-data";
import {
  BookingRowCard,
  BookingsGroup,
  BookingsSectionHeader,
  BookingTimeline,
  type TimelineEntry,
} from "@/bookings/booking-row-card";

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
  const today = LIVE_ACTIVE_DAY.bookingsToday as Booking[];

  if (today.length === 0) {
    return (
      <EmptyBlock
        title="Nothing on the books yet"
        sub="Your scheduled bookings will appear here."
      />
    );
  }

  // Build timeline entries with stacked time labels and computed gap labels.
  const entries: TimelineEntry[] = today.map((b, i) => {
    const [time, meridiem] = formatStackedTime(b.startsAt);
    const prev = i > 0 ? today[i - 1] : undefined;
    const gapBefore = prev
      ? gapBetween(prev.startsAt, prev.durationMin, b.startsAt)
      : undefined;
    return {
      booking: b,
      time,
      meridiem,
      isNext: i === 0,
      gapBefore,
    };
  });

  const totalUsd = today.reduce((sum, b) => sum + b.priceUsd, 0);
  const dateLabel = currentDateLabel();

  return (
    <div className="flex flex-col pb-6">
      <BookingsGroup>
        <BookingsSectionHeader
          title="Today"
          meta={`${today.length} ${today.length === 1 ? "booking" : "bookings"} · ${formatUsd(totalUsd)}`}
          date={dateLabel}
          serif
        />
        <BookingTimeline entries={entries} />
      </BookingsGroup>

      {/* Placeholder for This Week / Later groups (no rail, no NEXT). */}
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

interface HistoryItem extends Booking {
  cancelled?: boolean;
}

function HistoryTab() {
  // Static demo set spread across the four buckets.
  const today: HistoryItem[] = [
    {
      id: "ht1",
      clientName: LIFECYCLE_BOOKING.clientName,
      clientInitial: LIFECYCLE_BOOKING.clientInitial,
      service: LIFECYCLE_BOOKING.service,
      startsAt: "9:00 AM",
      durationMin: LIFECYCLE_BOOKING.durationMin,
      priceUsd: LIFECYCLE_BOOKING.priceUsd,
      location: LIFECYCLE_BOOKING.neighborhood,
      avatarHue: "peach",
    },
  ];
  const yesterday: HistoryItem[] = [
    {
      id: "hy1",
      clientName: "Jordan Lee",
      clientInitial: "J",
      service: "Knotless braids · medium",
      startsAt: "Yesterday",
      durationMin: 240,
      priceUsd: 220,
      location: "Crown Heights, Brooklyn",
      avatarHue: "blue",
    },
  ];
  const thisWeek: HistoryItem[] = [
    {
      id: "hw1",
      clientName: "Devon M.",
      clientInitial: "D",
      service: "Silk press",
      startsAt: "Mon",
      durationMin: 75,
      priceUsd: 120,
      location: "Park Slope, Brooklyn",
      avatarHue: "violet",
    },
    {
      id: "hw2",
      clientName: "Imani O.",
      clientInitial: "I",
      service: "Wash & blow-dry",
      startsAt: "Mon",
      durationMin: 60,
      priceUsd: 0,
      location: "Crown Heights, Brooklyn",
      avatarHue: "amber",
      cancelled: true,
    } as HistoryItem,
  ];
  const earlier: HistoryItem[] = [
    {
      id: "he1",
      clientName: "Aaliyah K.",
      clientInitial: "A",
      service: "Box braids · waist length",
      startsAt: "Apr 18",
      durationMin: 360,
      priceUsd: 320,
      location: "Harlem, Manhattan",
      avatarHue: "green",
    },
  ];

  return (
    <div className="flex flex-col pb-6">
      <HistoryGroup label="Today" items={today} />
      <HistoryGroup label="Yesterday" items={yesterday} />
      <HistoryGroup label="This Week" items={thisWeek} />
      <HistoryGroup label="Earlier" items={earlier} />
    </div>
  );
}

function HistoryGroup({ label, items }: { label: string; items: HistoryItem[] }) {
  if (items.length === 0) return null;
  return (
    <BookingsGroup>
      <BookingsSectionHeader title={label} />
      <div className="flex flex-col gap-2.5">
        {items.map((b) => (
          <BookingRowCard key={b.id} booking={b} cancelled={b.cancelled} />
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
  // Accepts "10:30" or "10:30 AM". Returns ["10:30", "AM"].
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
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
  return [`${h}:${mm}`, suffix];
}

function gapBetween(prevStart: string, prevDuration: number, nextStart: string): string | undefined {
  const prevEnd = toMinutes(prevStart) + prevDuration;
  const next = toMinutes(nextStart);
  const gap = next - prevEnd;
  if (gap <= 5) return undefined;
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
  return `${weekday} · ${month} ${day}`;
}
