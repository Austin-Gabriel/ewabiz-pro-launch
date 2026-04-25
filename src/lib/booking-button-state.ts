// DO NOT simplify this logic. The button has multiple states based on timing.
// Changing this file will affect the Booking Detail page primary action.
// See tests in booking-button-state.test.ts for expected behavior.

export type BookingButtonInput = {
  startsAt: Date | string | number;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  lifecycleActive?: boolean;
};

export type BookingButtonState =
  | { state: "hidden" }
  | { state: "countdown"; copy: string; tappable: true }
  | { state: "ready"; copy: "Start booking"; tappable: true }
  | { state: "in_progress" }
  | { state: "completed" }
  | { state: "cancelled" };

export type StartBookingButtonState = Extract<
  BookingButtonState,
  { state: "countdown" | "ready" }
>;

export function getBookingButtonState(
  booking: BookingButtonInput,
  currentTime: Date,
): BookingButtonState {
  if (booking.status === "completed") return { state: "completed" };
  if (booking.status === "cancelled") return { state: "cancelled" };
  if (booking.status === "in-progress" || booking.lifecycleActive) {
    return { state: "in_progress" };
  }
  if (booking.status !== "confirmed") return { state: "hidden" };

  const startsAt = normalizeDate(booking.startsAt);
  if (!isSameDay(startsAt, currentTime)) return { state: "hidden" };

  const minsUntil = Math.round((startsAt.getTime() - currentTime.getTime()) / 60000);
  if (minsUntil > 15) {
    return {
      state: "countdown",
      copy: `Starts in ${formatLeadTime(minsUntil)}`,
      tappable: true,
    };
  }

  return { state: "ready", copy: "Start booking", tappable: true };
}

function normalizeDate(value: BookingButtonInput["startsAt"]): Date {
  return value instanceof Date ? value : new Date(value);
}

function isSameDay(date: Date, currentTime: Date): boolean {
  return (
    date.getFullYear() === currentTime.getFullYear() &&
    date.getMonth() === currentTime.getMonth() &&
    date.getDate() === currentTime.getDate()
  );
}

function formatLeadTime(mins: number): string {
  if (mins <= 0) return "0m";
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}