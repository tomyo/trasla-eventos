import assert from "node:assert/strict";
import test from "node:test";

import { renderEventEntry } from "../components/event-entry/render.js";
import { formatEventDate, formatLocalDate, isDateToday, isDateWithinMonth, isDateWithinWeek } from "../lib/utils.js";

const startDate = new Date("2026-08-17T00:00:00.000Z");

test("formats a UTC-midnight event in the configured Córdoba timezone", () => {
  assert.equal(formatLocalDate(startDate), "2026-08-16");
  assert.equal(formatEventDate(startDate, { onlyTime: true }), "21:00h");
  assert.equal(formatEventDate(startDate), "DOMINGO 16/08 - 21:00h");
});

test("allows callers to override the event timezone", () => {
  assert.equal(formatLocalDate(startDate, "UTC"), "2026-08-17");
  assert.equal(formatEventDate(startDate, { onlyTime: true, timeZone: "UTC" }), "");
});

test("uses the event calendar day for today, week, and month filters", () => {
  const cordobaAfternoon = new Date("2026-08-16T15:00:00.000Z");

  assert.equal(isDateToday(startDate, cordobaAfternoon), true);
  assert.equal(isDateWithinWeek(startDate, cordobaAfternoon), true);
  assert.equal(isDateWithinMonth(startDate, cordobaAfternoon), true);
  assert.equal(isDateToday(startDate, new Date("2026-08-17T03:00:00.000Z")), false);
});

test("uses the configured event timezone for event grouping and display", () => {
  const html = renderEventEntry({
    title: "Emilio del Guercio Íntimo y Acústico",
    startsAt: startDate.toISOString(),
    locality: "Los Hornillos",
    activity: "Evento",
    slug: "emilio-del-guercio-intimo-y-acustico-8061b9e3",
    images: "https://example.com/event.jpg",
  });

  assert.match(html, /date="2026-08-16"/);
  assert.match(html, /Los Hornillos\s+- 21:00h/);
});
