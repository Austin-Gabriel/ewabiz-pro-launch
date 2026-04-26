import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  earningsForDensity,
  formatMoney,
  type EarningEvent,
} from "@/data/mock-earnings";
import { useDevState } from "@/dev-state/dev-state-context";
import {
  EARNINGS_NAVY,
  EARNINGS_UI,
  EarningsCard,
  EarningsCardEyebrow,
  EarningsSubShell,
} from "./earnings-shell";
import { findBookingById } from "@/data/mock-bookings";

const NAVY = EARNINGS_NAVY;
const UI = EARNINGS_UI;

type Filter = "all" | "week" | "month";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

function densityFromDev(d: ReturnType<typeof useDevState>["state"]["dataDensity"]) {
  if (d === "empty") return "none" as const;
  if (d === "sparse") return "sparse" as const;
  return "rich" as const;
}

export function RecentEarningsPage() {
  const { state: dev } = useDevState();
  const events = useMemo(() => earningsForDensity(densityFromDev(dev.dataDensity)), [dev.dataDensity]);
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(40);

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      if (filter === "all") return true;
      const ms = filter === "week" ? 7 : 30;
      return now - e.date.getTime() <= ms * 24 * 60 * 60 * 1000;
    });
  }, [events, filter]);

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > visible.length;

  return (
    <EarningsSubShell title="Recent earnings">
      <FilterChips value={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <EarningsCard>
          <div className="flex flex-col">
            {visible.map((e, i) => (
              <EarningRow key={e.id} event={e} divider={i < visible.length - 1} />
            ))}
          </div>
        </EarningsCard>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setLimit((l) => l + 40)}
          className="mx-auto mt-2 transition-opacity active:opacity-50"
          style={{
            fontFamily: UI,
            fontSize: 13,
            fontWeight: 600,
            color: NAVY,
            opacity: 0.7,
          }}
        >
          Load more →
        </button>
      ) : null}
    </EarningsSubShell>
  );
}

function FilterChips({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  return (
    <div className="flex gap-2 px-1 pb-1 pt-2">
      {FILTERS.map((f) => {
        const active = f.key === value;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            style={{
              fontFamily: UI,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 999,
              backgroundColor: active ? NAVY : "rgba(6,28,39,0.05)",
              color: active ? "#F0EBD8" : NAVY,
              border: active ? "1px solid transparent" : "1px solid rgba(6,28,39,0.1)",
              opacity: active ? 1 : 0.85,
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function EarningRow({ event, divider }: { event: EarningEvent; divider: boolean }) {
  const navigate = useNavigate();
  const dateLabel = formatRowDate(event.date);
  const routable = !!findBookingById(event.bookingId);
  return (
    <button
      type="button"
      onClick={() => {
        if (routable) navigate({ to: "/bookings/$id", params: { id: event.bookingId } });
      }}
      className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
      style={{
        padding: "14px 16px",
        borderBottom: divider ? "1px solid rgba(6,28,39,0.08)" : "none",
        fontFamily: UI,
        textAlign: "left",
        cursor: routable ? "pointer" : "default",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
          {event.clientLabel}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            color: NAVY,
            opacity: 0.6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {event.service} · {dateLabel}
        </div>
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: NAVY,
          fontVariantNumeric: "tabular-nums",
          marginLeft: 12,
        }}
      >
        {formatMoney(event.net)}
      </div>
    </button>
  );
}

function formatRowDate(d: Date): string {
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const base = `${months[d.getMonth()]} ${d.getDate()}`;
  return sameYear ? base : `${base}, ${d.getFullYear()}`;
}

function EmptyState() {
  return (
    <EarningsCard>
      <div
        style={{
          padding: "44px 16px",
          textAlign: "center",
          fontFamily: UI,
        }}
      >
        <EarningsCardEyebrow>No earnings yet</EarningsCardEyebrow>
        <div style={{ marginTop: 8, fontSize: 14, color: NAVY, opacity: 0.7 }}>
          Completed bookings will show up here.
        </div>
      </div>
    </EarningsCard>
  );
}