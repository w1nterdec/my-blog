import { test } from "node:test";
import assert from "node:assert/strict";
import { createAdminServer } from "../server/admin/index.mjs";
test("OAuth rejects absent configuration and forged callback state without contacting GitHub", async () => {
  let calls = 0;
  const server = createAdminServer({ ADMIN_ORIGIN: "http://127.0.0.1", ADMIN_CLIENT_ID: "test", ADMIN_CLIENT_SECRET: "test" }, async () => { calls++; throw new Error("unexpected"); });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${base}/api/admin/callback?state=forged&code=test`)).status, 403);
    assert.equal((await fetch(`${base}/api/admin/auth?provider=unknown`)).status, 400);
    const auth = await fetch(`${base}/api/admin/auth?provider=github`, { redirect: "manual" });
    assert.equal(auth.status, 302);
    const redirect = new URL(auth.headers.get("location"));
    assert.equal(redirect.origin, "https://github.com");
    assert.equal(redirect.searchParams.get("state").length, 64);
    assert.match(auth.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
    assert.equal(calls, 0);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
