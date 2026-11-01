import { test } from "node:test";
import assert from "node:assert/strict";
import { localDate, reminderSlots, shiftDay, validDay, weekStart } from "./fitness-time";

test("weeks begin Monday and end Sunday, including year boundaries", () => {
  assert.equal(weekStart("2026-11-01"), "2026-10-26");
  assert.equal(weekStart("2026-11-02"), "2026-11-02");
  assert.equal(weekStart("2027-01-01"), "2026-12-28");
  assert.equal(shiftDay("2026-12-28", 6), "2027-01-03");
});

test("Zurich calendar dates are independent of UTC midnight", () => {
  assert.equal(localDate(new Date("2026-11-01T23:30:00Z"), "Europe/Zurich"), "2026-11-02");
  assert.equal(localDate(new Date("2026-07-01T22:30:00Z"), "Europe/Zurich"), "2026-07-02");
});

test("invalid and overflowing calendar dates are rejected", () => {
  assert.equal(validDay("2026-02-29"), false);
  assert.equal(validDay("2028-02-29"), true);
  assert.equal(validDay("2026-11-31"), false);
  assert.equal(validDay(""), false);
});

test("two weekly reminders are queued four weeks ahead, at local time", () => {
  const slots = reminderSlots({ days: [2, 5], time: "18:00", timezone: "Europe/Zurich" }, new Date("2026-11-01T12:00:00Z"));
  assert.equal(slots.length, 8);
  assert.equal(slots[0].toISOString(), "2026-11-03T17:00:00.000Z");
  assert.equal(slots.at(-1)?.toISOString(), "2026-11-27T17:00:00.000Z");
  assert.equal(new Set(slots.map(s => s.toISOString())).size, 8);
});

test("past times are not scheduled and summer time uses the right UTC offset", () => {
  const slots = reminderSlots({ days: [2, 5], time: "18:00", timezone: "Europe/Zurich" }, new Date("2026-06-02T16:30:00Z"));
  assert.equal(slots[0].toISOString(), "2026-06-05T16:00:00.000Z");
});

test("a nonexistent spring DST clock time is skipped", () => {
  const slots = reminderSlots({ days: [3, 7], time: "02:30", timezone: "Europe/Zurich" }, new Date("2027-03-25T12:00:00Z"));
  assert.ok(!slots.some(s => localDate(s, "Europe/Zurich") === "2027-03-28"));
});
