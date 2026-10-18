import { test } from "node:test";
import assert from "node:assert/strict";
import { getRunningDays } from "../src/utils/getRunningDays.ts";

test("uptime follows the site calendar across midnight, regardless of UTC date", () => {
  assert.equal(
    getRunningDays(
      "2026-09-30",
      new Date("2026-10-17T15:59:59Z"),
      "Asia/Shanghai"
    ),
    17
  );
  assert.equal(
    getRunningDays(
      "2026-09-30",
      new Date("2026-10-17T16:00:00Z"),
      "Asia/Shanghai"
    ),
    18
  );
});

test("uptime handles leap days and invalid launch dates", () => {
  assert.equal(
    getRunningDays("2024-02-28", new Date("2024-03-01T00:00:00Z"), "UTC"),
    2
  );
  assert.equal(getRunningDays("2026-02-30"), null);
  assert.equal(getRunningDays("not-a-date"), null);
  assert.equal(
    getRunningDays("2026-09-30", new Date("2026-09-29T00:00:00Z"), "UTC"),
    0
  );
});
