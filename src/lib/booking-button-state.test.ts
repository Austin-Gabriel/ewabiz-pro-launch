import { describe, expect, test } from "bun:test";

import { getBookingButtonState, type BookingButtonInput } from "./booking-button-state";

const baseBooking: BookingButtonInput = {
  startsAt: new Date(2026, 3, 25, 13, 0),
  status: "confirmed",
};

describe("getBookingButtonState", () => {
  test("booking 4 hours from now today returns countdown state with correct copy", () => {
    expect(
      getBookingButtonState(baseBooking, new Date(2026, 3, 25, 9, 0)),
    ).toEqual({ state: "countdown", copy: "Starts in 4h", tappable: true });
  });

  test("booking 10 minutes from now today returns ready state", () => {
    expect(
      getBookingButtonState(baseBooking, new Date(2026, 3, 25, 12, 50)),
    ).toEqual({ state: "ready", copy: "Start booking", tappable: true });
  });

  test("booking tomorrow returns hidden state", () => {
    expect(
      getBookingButtonState(
        { ...baseBooking, startsAt: new Date(2026, 3, 26, 13, 0) },
        new Date(2026, 3, 25, 9, 0),
      ),
    ).toEqual({ state: "hidden" });
  });

  test("booking in progress returns in_progress state", () => {
    expect(
      getBookingButtonState(
        { ...baseBooking, status: "in-progress" },
        new Date(2026, 3, 25, 9, 0),
      ),
    ).toEqual({ state: "in_progress" });
  });
});