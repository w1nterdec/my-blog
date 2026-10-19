import { test } from "node:test";
import assert from "node:assert/strict";
import { postFilter } from "../src/utils/postFilter.ts";

test("local posts exclude drafts and future dates at the exact publication boundary", context => {
  const now = Date.parse("2026-10-19T00:00:00Z");
  context.mock.method(Date, "now", () => now);
  assert.equal(
    postFilter({ data: { draft: true, pubDatetime: new Date(now - 1) } }),
    false
  );
  assert.equal(
    postFilter({ data: { draft: false, pubDatetime: new Date(now + 1) } }),
    false
  );
  assert.equal(postFilter({ data: { pubDatetime: new Date(now) } }), true);
});
