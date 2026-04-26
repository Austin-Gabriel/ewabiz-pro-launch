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
import { groupEarningsByDay } from "./earnings-aggregates";

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
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== "all") {
        const ms = filter === "week" ? 7 : 30;
        if (now - e.date.getTime() > ms * 24 * 60 * 60 * 1000) return false;
      }
      if (q && !e.clientLabel.toLowerCase().includes(q) && !e.service.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [events, filter, query]);

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > visible.length;
  const groups = useMemo(() => groupEarningsByDay(visible), [visible]);
  const filteredTotal = useMemo(() => filtered.reduce((s, e) => s + e.net, 0), [filtered]);

  return (
    <EarningsSubShell title="Recent earnings">
      <SearchField value={query} onChange={setQuery} />
      <FilterChips value={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-2">
            <DayHeader label={g.label} weekday={g.weekday} total={g.total} count={g.events.length} />
            <EarningsCard>
              <div className="flex flex-col">
                {g.events.map((e, i) => (
                  <EarningRow key={e.id} event={e} divider={i < g.events.length - 1} />
                ))}
              </div>
            </EarningsCard>
          </div>
        ))
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

      {filtered.length > 0 ? (
        <div
          className="sticky bottom-2 mt-2 self-stretch"
          style={{
            backgroundColor: "rgba(6,28,39,0.92)",
            color: "#F0EBD8",
            borderRadius: 12,
            padding: "10px 14px",
            fontFamily: UI,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 24px -10px rgba(6,28,39,0.4)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.7 }}>
            Filtered total
          </span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.3 }}>
            <span style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {formatMoney(filteredTotal)}
            </span>
            <span style={{ fontSize: 11, opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
              {filtered.length} {filtered.length === 1 ? "booking" : "bookings"}
            </span>
          </span>
        </div>
      ) : null}
    </EarningsSubShell>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        backgroundColor: "rgba(6,28,39,0.05)",
        borderRadius: 10,
        padding: "8px 12px",
        fontFamily: UI,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Search client or service"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none"
        style={{
          fontFamily: UI,
          fontSize: 13,
          color: NAVY,
          border: "none",
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{ fontSize: 12, color: NAVY, opacity: 0.5 }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function DayHeader({ label, weekday, total, count }: { label: string; weekday: string; total: number; count: number }) {
  return (
    <div
      className="flex items-start justify-between px-1"
      style={{ fontFamily: UI, fontSize: 12, color: NAVY }}
    >
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
        <span style={{ fontWeight: 700, opacity: 0.7, letterSpacing: "0.02em" }}>{label}</span>
        <span style={{ fontWeight: 500, opacity: 0.55, fontSize: 11 }}>{weekday}</span>
      </span>
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          lineHeight: 1.3,
          fontVariantNumeric: "tabular-nums",
          opacity: 0.7,
        }}
      >
        <span style={{ fontWeight: 600 }}>{formatMoney(total)}</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {count} {count === 1 ? "booking" : "bookings"}
        </span>
      </span>
    </div>
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
  const dotColor = event.status === "paid" ? "#15803D" : "#FF823F";
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
      <div className="flex items-start gap-2.5" style={{ minWidth: 0, flex: 1 }}>
        <span
          aria-hidden
          aria-label={event.status}
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: dotColor,
            marginTop: 7,
            flexShrink: 0,
          }}
        />
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
            lineHeight: 1.4,
          }}
        >
          {event.service}
        </div>
        <div
          style={{
            marginTop: 1,
            fontSize: 11,
            color: NAVY,
            opacity: 0.5,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {dateLabel}
        </div>
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