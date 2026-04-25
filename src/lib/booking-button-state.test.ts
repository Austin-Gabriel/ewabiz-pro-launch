import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getBookingButtonState, type BookingButtonInput } from "./booking-button-state";

const baseBooking: BookingButtonInput = {
  startsAt: new Date(2026, 3, 25, 13, 0),
  status: "confirmed",
};

describe("getBookingButtonState", () => {
  test("booking 4 hours from now today returns countdown state with correct copy", () => {
    assert.deepEqual(
      getBookingButtonState(baseBooking, new Date(2026, 3, 25, 9, 0)),
      { state: "countdown", copy: "Starts in 4h", tappable: true },
    );
  });

  test("booking 10 minutes from now today returns ready state", () => {
    assert.deepEqual(
      getBookingButtonState(baseBooking, new Date(2026, 3, 25, 12, 50)),
      { state: "ready", copy: "Start booking", tappable: true },
    );
  });

  test("Maya-only demo timing keeps later same-day booking in countdown state", () => {
    assert.deepEqual(
      getBookingButtonState(
        { ...baseBooking, startsAt: new Date(2026, 3, 25, 10, 30) },
        new Date(2026, 3, 25, 10, 20),
      ),
      { state: "ready", copy: "Start booking", tappable: true },
    );
    assert.deepEqual(
      getBookingButtonState(baseBooking, new Date(2026, 3, 25, 10, 20)),
      { state: "countdown", copy: "Starts in 2h 40m", tappable: true },
    );
  });

  test("booking tomorrow returns hidden state", () => {
    assert.deepEqual(
      getBookingButtonState(
        { ...baseBooking, startsAt: new Date(2026, 3, 26, 13, 0) },
        new Date(2026, 3, 25, 9, 0),
      ),
      { state: "hidden" },
    );
  });

  test("booking in progress returns in_progress state", () => {
    assert.deepEqual(
      getBookingButtonState(
        { ...baseBooking, status: "in-progress" },
        new Date(2026, 3, 25, 9, 0),
      ),
      { state: "in_progress" },
    );
  });
});