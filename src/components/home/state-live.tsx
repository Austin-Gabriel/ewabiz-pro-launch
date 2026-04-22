import { useState } from "react";
import { HOME_SANS, useHomeTheme } from "./home-shell";
import { EwaMark } from "@/components/ewa-logo";
import {
  type Booking,
  type BookingRequest,
  formatUsd,
} from "./mock-data";

// Industrial type discipline on the working surface: Inter only, no serif,
// no italics. The brand still uses Fraunces elsewhere — this screen is a tool.
const UI = `Inter, ${HOME_SANS}`;

/**
 * The live working surface. Same scaffold for all three variants — what
 * changes is just the content. Editorial hierarchy:
 *
 *   1. Greeting (serif, the warmest thing on screen)
 *   2. Focus card (next booking | first-booking nudge | open slot)
 *   3. Earnings glance (proud, never busy)
 *   4. Pending requests (only when present)
 *   5. Today's schedule
 */
export function StateLive({
  greetingName: _greetingName,
  weekToDateUsd,
  monthToDateUsd,
  bookingsToday,
  pendingRequests,
  bookingLink,
  nextOpenSlot,
}: {
  greetingName: string;
  weekToDateUsd: number;
  monthToDateUsd: number;
  bookingsToday: Booking[];
  pendingRequests: BookingRequest[];
  bookingLink?: string;
  nextOpenSlot?: string;
}) {
  void _greetingName;
  const isFirstTime =
    bookingsToday.length === 0 && pendingRequests.length === 0 && weekToDateUsd === 0;
  const nextBooking = bookingsToday[0];
  const unreadCount = pendingRequests.length; // bell badge mirrors the queue

  return (
    <div className="relative z-[1] flex flex-1 flex-col px-5 pt-1">
      {/* Thin top bar — logomark left, notifications bell right. Nothing else.
          The pro knows who they are; we don't greet them. */}
      <TopBar unreadCount={unreadCount} />

      {/* UP NEXT — the hero. Sits immediately below the top bar with breathing
          room. Either a real booking, a first-booking nudge, or a quiet-day
          empty state — same slot, different content. */}
      <FocusCard
        nextBooking={nextBooking}
        nextOpenSlot={nextOpenSlot}
        isFirstTime={isFirstTime}
        bookingLink={bookingLink}
      />

      {/* EARNINGS GLANCE */}
      <EarningsGlance
        weekToDateUsd={weekToDateUsd}
        monthToDateUsd={monthToDateUsd}
        isFirstTime={isFirstTime}
      />

      {/* WAITING ON YOU */}
      {pendingRequests.length > 0 ? (
        <PendingRequests requests={pendingRequests} />
      ) : null}

      {/* TODAY'S SCHEDULE — only when there are additional bookings beyond
          the one already in Up Next. */}
      {bookingsToday.length > 1 ? <TodaySchedule bookings={bookingsToday} /> : null}

      <div style={{ height: 24 }} />
    </div>
  );
}

/* ---------------- Top bar ---------------- */

function TopBar({ unreadCount }: { unreadCount: number }) {
  const { text, isDark, borderCol } = useHomeTheme();
  return (
    <div
      className="ewa-fade flex items-center justify-between"
      style={{ height: 44, marginTop: 2 }}
    >
      <div className="relative" style={{ height: 26, width: 26 }}>
        <span
          aria-hidden
          className="ewa-splash-ring absolute"
          style={{
            top: "100%",
            left: "50%",
            width: 26,
            height: 7,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(255,130,63,0.55) 0%, rgba(255,130,63,0) 70%)",
            animationDelay: "60ms",
          }}
        />
        <div className="ewa-drop" style={{ animationDelay: "60ms" }}>
          <EwaMark size={26} />
        </div>
      </div>

      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className="relative flex items-center justify-center rounded-full transition-transform active:scale-95"
        style={{
          width: 36,
          height: 36,
          backgroundColor: isDark ? "rgba(240,235,216,0.05)" : "rgba(255,255,255,0.55)",
          border: `1px solid ${borderCol}`,
          color: text,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span
            aria-hidden
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              backgroundColor: "#FF823F",
              color: "#061C27",
              fontFamily: UI,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
              boxShadow: "0 0 12px rgba(255,130,63,0.55)",
              border: `2px solid ${isDark ? "#061C27" : "#F0EBD8"}`,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}

/* ---------------- Focus card ---------------- */

function FocusCard({
  nextBooking,
  nextOpenSlot,
  isFirstTime,
  bookingLink,
}: {
  nextBooking?: Booking;
  nextOpenSlot?: string;
  isFirstTime: boolean;
  bookingLink?: string;
}) {
  const { text, isDark, borderCol } = useHomeTheme();

  if (isFirstTime) {
    return (
      <div
        className="ewa-rise mt-6 overflow-hidden rounded-3xl px-5 py-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,130,63,0.18) 0%, rgba(255,130,63,0.06) 100%)",
          border: "1px solid rgba(255,130,63,0.32)",
          boxShadow: "0 12px 36px rgba(255,130,63,0.18)",
          animationDelay: "180ms",
        }}
      >
        <div style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.6px", textTransform: "uppercase", color: "#FF823F", fontWeight: 700 }}>
          You're live
        </div>
        <p
          style={{
            fontFamily: UI,
            fontSize: 22,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            color: text,
            marginTop: 8,
            fontWeight: 400,
          }}
        >
          Your first booking is one share away.
        </p>
        <p style={{ fontFamily: HOME_SANS, fontSize: 13, lineHeight: 1.5, color: text, opacity: 0.7, marginTop: 8 }}>
          Send your link to three regulars. The first to book sets the tone for the rest.
        </p>

        {bookingLink ? (
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-transform active:scale-[0.99]"
            style={{
              backgroundColor: isDark ? "rgba(6,28,39,0.55)" : "rgba(247,243,230,0.85)",
              border: `1px solid ${borderCol}`,
            }}
            onClick={() => navigator.clipboard?.writeText(`https://${bookingLink}`)}
          >
            <div className="flex flex-col items-start">
              <span style={{ fontFamily: HOME_SANS, fontSize: 10, letterSpacing: "1.4px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 600 }}>
                Your booking link
              </span>
              <span style={{ fontFamily: HOME_SANS, fontSize: 14, color: text, fontWeight: 500, marginTop: 2 }}>
                {bookingLink}
              </span>
            </div>
            <span
              style={{
                fontFamily: HOME_SANS,
                fontSize: 12,
                color: "#FF823F",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              Copy
            </span>
          </button>
        ) : null}
      </div>
    );
  }

  if (nextBooking) {
    return (
      <div
        className="ewa-rise mt-6 overflow-hidden rounded-3xl"
        style={{
          background: isDark
            ? "linear-gradient(160deg, rgba(255,130,63,0.14) 0%, rgba(240,235,216,0.04) 60%)"
            : "linear-gradient(160deg, rgba(255,130,63,0.16) 0%, rgba(255,255,255,0.6) 60%)",
          border: `1px solid ${isDark ? "rgba(255,130,63,0.30)" : "rgba(255,130,63,0.32)"}`,
          boxShadow: "0 12px 36px rgba(255,130,63,0.14)",
          animationDelay: "180ms",
        }}
      >
        <div className="px-5 pt-5">
          <div className="flex items-center gap-2">
            <span
              className="ewa-breathe inline-block rounded-full"
              style={{
                width: 7,
                height: 7,
                backgroundColor: "#FF823F",
                boxShadow: "0 0 10px rgba(255,130,63,0.7)",
              }}
            />
            <span style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.6px", textTransform: "uppercase", color: "#FF823F", fontWeight: 700 }}>
              Up next
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <span
              style={{
                fontFamily: UI,
                fontSize: 44,
                fontWeight: 400,
                color: text,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {nextBooking.startsAt}
            </span>
            <span style={{ fontFamily: HOME_SANS, fontSize: 13, color: text, opacity: 0.6, fontWeight: 500 }}>
              · {nextBooking.durationMin} min
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-2.5">
            <Avatar initial={nextBooking.clientInitial} />
            <div className="flex flex-col">
              <span style={{ fontFamily: HOME_SANS, fontSize: 15, color: text, fontWeight: 500 }}>
                {nextBooking.clientName}
                {nextBooking.isNewClient ? (
                  <span
                    className="ml-2 inline-block rounded-full px-1.5 py-px align-middle"
                    style={{
                      fontSize: 9,
                      letterSpacing: "1.2px",
                      textTransform: "uppercase",
                      color: "#FF823F",
                      backgroundColor: "rgba(255,130,63,0.12)",
                      border: "1px solid rgba(255,130,63,0.35)",
                      fontWeight: 700,
                    }}
                  >
                    New
                  </span>
                ) : null}
              </span>
              <span style={{ fontFamily: HOME_SANS, fontSize: 12.5, color: text, opacity: 0.6 }}>
                {nextBooking.service}
              </span>
            </div>
          </div>
        </div>

        {/* Action strip */}
        <div
          className="mt-4 flex divide-x"
          style={{
            borderTop: `1px solid ${isDark ? "rgba(240,235,216,0.08)" : "rgba(6,28,39,0.08)"}`,
          }}
        >
          <FocusAction label="Message" icon="msg" />
          <FocusAction label="Directions" icon="map" />
          <FocusAction label="Mark done" icon="check" />
        </div>
      </div>
    );
  }

  // Quiet day, no bookings
  return (
    <div
      className="ewa-rise mt-6 rounded-3xl px-5 py-5"
      style={{
        backgroundColor: isDark ? "rgba(240,235,216,0.04)" : "rgba(255,255,255,0.5)",
        border: `1px solid ${borderCol}`,
        animationDelay: "180ms",
      }}
    >
      <div style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 600 }}>
        Today
      </div>
      <p
        style={{
          fontFamily: UI,
          fontSize: 24,
          lineHeight: 1.25,
          color: text,
          marginTop: 8,
          letterSpacing: "-0.01em",
        }}
      >
        Nothing on the books — rest, or open a slot.
      </p>
      {nextOpenSlot ? (
        <p style={{ fontFamily: HOME_SANS, fontSize: 13, color: text, opacity: 0.6, marginTop: 8 }}>
          Next available: <span style={{ color: "#FF823F", fontWeight: 600 }}>{nextOpenSlot}</span>
        </p>
      ) : null}
    </div>
  );
}

function FocusAction({ label, icon }: { label: string; icon: "msg" | "map" | "check" }) {
  const { text } = useHomeTheme();
  return (
    <button
      type="button"
      className="flex flex-1 items-center justify-center gap-1.5 py-3.5 transition-opacity hover:opacity-100 active:opacity-60"
      style={{ fontFamily: HOME_SANS, fontSize: 12.5, fontWeight: 500, color: text, opacity: 0.75 }}
    >
      {icon === "msg" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ) : icon === "map" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {label}
    </button>
  );
}

/* ---------------- Earnings glance ---------------- */

function EarningsGlance({
  weekToDateUsd,
  monthToDateUsd,
  isFirstTime,
}: {
  weekToDateUsd: number;
  monthToDateUsd: number;
  isFirstTime: boolean;
}) {
  const { text, isDark, borderCol } = useHomeTheme();
  return (
    <div
      className="ewa-rise mt-4 grid grid-cols-2 gap-3"
      style={{ animationDelay: "260ms" }}
    >
      <EarningCell
        label="This week"
        value={formatUsd(weekToDateUsd)}
        isFirstTime={isFirstTime}
      />
      <EarningCell
        label="This month"
        value={formatUsd(monthToDateUsd)}
        isFirstTime={isFirstTime}
        subtle
      />
    </div>
  );
}

function EarningCell({
  label,
  value,
  subtle,
  isFirstTime,
}: {
  label: string;
  value: string;
  subtle?: boolean;
  isFirstTime: boolean;
}) {
  const { text, isDark, borderCol } = useHomeTheme();
  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        backgroundColor: isDark ? "rgba(240,235,216,0.04)" : "rgba(255,255,255,0.55)",
        border: `1px solid ${borderCol}`,
      }}
    >
      <div style={{ fontFamily: HOME_SANS, fontSize: 10.5, letterSpacing: "1.5px", textTransform: "uppercase", color: text, opacity: subtle ? 0.4 : 0.5, fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: UI,
          fontSize: 26,
          fontWeight: 400,
          color: text,
          letterSpacing: "-0.02em",
          marginTop: 4,
          opacity: isFirstTime ? 0.35 : 1,
        }}
      >
        {value}
      </div>
      {!isFirstTime ? (
        <div style={{ fontFamily: HOME_SANS, fontSize: 11, color: text, opacity: 0.45, marginTop: 2 }}>
          paid out Friday
        </div>
      ) : (
        <div style={{ fontFamily: HOME_SANS, fontSize: 11, color: text, opacity: 0.4, marginTop: 2 }}>
          your first dollar lives here
        </div>
      )}
    </div>
  );
}

/* ---------------- Pending requests ---------------- */

function PendingRequests({ requests }: { requests: BookingRequest[] }) {
  const { text, isDark, borderCol } = useHomeTheme();
  const [resolved, setResolved] = useState<Record<string, "accept" | "decline" | undefined>>({});

  return (
    <section className="ewa-rise mt-6" style={{ animationDelay: "340ms" }}>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.55, fontWeight: 700, margin: 0 }}>
          Waiting on you · {requests.length}
        </h2>
      </div>
      <div className="flex flex-col gap-2.5">
        {requests.map((r) => {
          const state = resolved[r.id];
          return (
            <div
              key={r.id}
              className="rounded-2xl px-4 py-3.5"
              style={{
                backgroundColor: isDark ? "rgba(240,235,216,0.045)" : "rgba(255,255,255,0.6)",
                border: `1px solid ${state ? borderCol : "rgba(255,130,63,0.28)"}`,
                opacity: state ? 0.55 : 1,
                transition: "opacity 300ms ease, border-color 300ms ease",
              }}
            >
              <div className="flex items-start gap-3">
                <Avatar initial={r.clientInitial} />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span style={{ fontFamily: HOME_SANS, fontSize: 14.5, color: text, fontWeight: 500 }}>
                      {r.clientName}
                    </span>
                    <span style={{ fontFamily: UI, fontSize: 16, color: text, fontWeight: 400 }}>
                      {formatUsd(r.priceUsd)}
                    </span>
                  </div>
                  <div style={{ fontFamily: HOME_SANS, fontSize: 12.5, color: text, opacity: 0.65, marginTop: 2 }}>
                    {r.service}
                  </div>
                  <div style={{ fontFamily: HOME_SANS, fontSize: 12, color: "#FF823F", marginTop: 4, fontWeight: 600 }}>
                    {r.requestedFor}
                  </div>
                  {r.message ? (
                    <p
                      style={{
                        fontFamily: UI,
                        
                        fontSize: 13,
                        lineHeight: 1.45,
                        color: text,
                        opacity: 0.6,
                        marginTop: 8,
                      }}
                    >
                      "{r.message}"
                    </p>
                  ) : null}

                  {!state ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setResolved((s) => ({ ...s, [r.id]: "accept" }))}
                        className="flex-1 rounded-full py-2 transition-transform active:scale-95"
                        style={{
                          backgroundColor: "#FF823F",
                          color: "#061C27",
                          fontFamily: HOME_SANS,
                          fontSize: 12.5,
                          fontWeight: 600,
                          boxShadow: "0 0 18px rgba(255,130,63,0.32)",
                        }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolved((s) => ({ ...s, [r.id]: "decline" }))}
                        className="rounded-full px-4 py-2 transition-transform active:scale-95"
                        style={{
                          backgroundColor: "transparent",
                          border: `1px solid ${borderCol}`,
                          color: text,
                          opacity: 0.75,
                          fontFamily: HOME_SANS,
                          fontSize: 12.5,
                          fontWeight: 500,
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontFamily: HOME_SANS,
                        fontSize: 12,
                        color: state === "accept" ? "#FF823F" : text,
                        opacity: state === "accept" ? 1 : 0.5,
                        marginTop: 10,
                        fontWeight: 600,
                      }}
                    >
                      {state === "accept" ? "✓ Accepted — they've been texted." : "Declined."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Today's schedule ---------------- */

function TodaySchedule({ bookings }: { bookings: Booking[] }) {
  const { text, isDark, borderCol } = useHomeTheme();
  const remaining = bookings.slice(1); // first one is in the focus card

  return (
    <section className="ewa-rise mt-6" style={{ animationDelay: "420ms" }}>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.55, fontWeight: 700, margin: 0 }}>
          Today · {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
        </h2>
        <span style={{ fontFamily: HOME_SANS, fontSize: 11, color: text, opacity: 0.45 }}>
          {totalRevenue(bookings)} total
        </span>
      </div>
      {remaining.length === 0 ? (
        <div
          className="rounded-2xl px-4 py-3.5"
          style={{
            backgroundColor: isDark ? "rgba(240,235,216,0.03)" : "rgba(255,255,255,0.45)",
            border: `1px solid ${borderCol}`,
          }}
        >
          <span style={{ fontFamily: UI,  fontSize: 13.5, color: text, opacity: 0.6 }}>
            That's the whole day. Beautiful.
          </span>
        </div>
      ) : (
        <ol className="flex flex-col gap-2 p-0" style={{ listStyle: "none" }}>
          {remaining.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                backgroundColor: isDark ? "rgba(240,235,216,0.035)" : "rgba(255,255,255,0.5)",
                border: `1px solid ${borderCol}`,
              }}
            >
              <div
                style={{
                  fontFamily: UI,
                  fontSize: 18,
                  fontWeight: 400,
                  color: text,
                  letterSpacing: "-0.01em",
                  width: 56,
                  flexShrink: 0,
                }}
              >
                {b.startsAt}
              </div>
              <Avatar initial={b.clientInitial} small />
              <div className="min-w-0 flex-1">
                <div className="truncate" style={{ fontFamily: HOME_SANS, fontSize: 13.5, color: text, fontWeight: 500 }}>
                  {b.clientName}
                  {b.isNewClient ? (
                    <span
                      className="ml-2 inline-block rounded-full px-1.5 py-px align-middle"
                      style={{
                        fontSize: 8.5,
                        letterSpacing: "1.1px",
                        textTransform: "uppercase",
                        color: "#FF823F",
                        backgroundColor: "rgba(255,130,63,0.12)",
                        border: "1px solid rgba(255,130,63,0.35)",
                        fontWeight: 700,
                      }}
                    >
                      New
                    </span>
                  ) : null}
                </div>
                <div className="truncate" style={{ fontFamily: HOME_SANS, fontSize: 12, color: text, opacity: 0.55 }}>
                  {b.service} · {b.durationMin} min
                </div>
              </div>
              <div style={{ fontFamily: HOME_SANS, fontSize: 13, color: text, opacity: 0.7, fontWeight: 500 }}>
                {formatUsd(b.priceUsd)}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function QuietDayNote({ nextOpenSlot }: { nextOpenSlot?: string }) {
  const { text, isDark, borderCol } = useHomeTheme();
  return (
    <section
      className="ewa-rise mt-6 rounded-2xl px-4 py-4"
      style={{
        backgroundColor: isDark ? "rgba(240,235,216,0.03)" : "rgba(255,255,255,0.45)",
        border: `1px solid ${borderCol}`,
        animationDelay: "420ms",
      }}
    >
      <div style={{ fontFamily: HOME_SANS, fontSize: 11, letterSpacing: "1.6px", textTransform: "uppercase", color: text, opacity: 0.5, fontWeight: 700 }}>
        Today
      </div>
      <p style={{ fontFamily: UI,  fontSize: 16, color: text, opacity: 0.7, marginTop: 6 }}>
        Empty calendar. Good light to clean the station.
      </p>
      {nextOpenSlot ? (
        <p style={{ fontFamily: HOME_SANS, fontSize: 12.5, color: text, opacity: 0.55, marginTop: 8 }}>
          Next open slot: <span style={{ color: "#FF823F", fontWeight: 600 }}>{nextOpenSlot}</span>
        </p>
      ) : null}
    </section>
  );
}

function totalRevenue(bookings: Booking[]) {
  return formatUsd(bookings.reduce((s, b) => s + b.priceUsd, 0));
}

/* ---------------- Avatar ---------------- */

function Avatar({ initial, small }: { initial: string; small?: boolean }) {
  const { isDark } = useHomeTheme();
  const size = small ? 28 : 36;
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        background: "linear-gradient(135deg, rgba(255,130,63,0.35) 0%, rgba(255,130,63,0.10) 100%)",
        border: `1px solid ${isDark ? "rgba(255,130,63,0.35)" : "rgba(255,130,63,0.40)"}`,
        color: isDark ? "#F0EBD8" : "#061C27",
        fontFamily: UI,
        fontSize: small ? 12 : 15,
        fontWeight: 500,
      }}
    >
      {initial}
    </div>
  );
}