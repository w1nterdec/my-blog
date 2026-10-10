import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { eligible, exportContent } from "../scripts/sync-content.mjs";
test("drafts and scheduled items remain private at the exact publication boundary", () => {
  const now = Date.parse("2026-10-10T00:00:00Z");
  assert.equal(eligible({ draft: true }, now), false);
  assert.equal(eligible({ pubDatetime: "2026-10-10T00:00:01Z" }, now), false);
  assert.equal(eligible({ pubDatetime: "2026-10-10T00:00:00Z" }, now), true);
  assert.throws(() => eligible({ pubDatetime: "invalid" }, now));
});
test("export excludes private bodies, unused photos, extra fields, and original metadata", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zhixing-content-test-"));
  try {
    const content = join(dir, "private"), output = join(dir, "site");
    for (const path of ["settings", "posts", "media"]) await mkdir(join(content, path), { recursive: true });
    const raw = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: "green" } }).jpeg().withMetadata().toBuffer();
    await writeFile(join(content, "media/real.jpg"), raw);
    await writeFile(join(content, "media/unused.jpg"), raw);
    await writeFile(join(content, "settings/journal.json"), JSON.stringify({
      personal: { name: "test", avatar: "avatar.webp", project: {}, secret: "PRIVATE" }, places: [],
      photos: [{ title: "public", category: "风光", src: "/media/real.jpg" }, { draft: true, title: "PRIVATE", src: "/media/unused.jpg" }],
      notes: [{ draft: true, body: "PRIVATE" }], music: [], games: []
    }));
    await writeFile(join(content, "posts/draft.md"), '---\ntitle: secret\ndraft: true\n---\nPRIVATE');
    await writeFile(join(content, "posts/future.md"), '---\ntitle: later\npubDatetime: 2099-01-01T00:00:00Z\n---\nPRIVATE');
    await writeFile(join(content, "posts/public.md"), '---\ntitle: public\ndescription: summary\npubDatetime: 2020-01-01T00:00:00Z\n---\n![test](/media/real.jpg)');
    const out = await exportContent(content, output);
    assert.equal(JSON.stringify(out).includes("PRIVATE"), false);
    assert.deepEqual(await readdir(join(output, "src/content/posts/imported")), ["public.md"]);
    const images = await readdir(join(output, "public/uploads"));
    assert.equal(images.length, 1);
    const metadata = await sharp(join(output, "public/uploads", images[0])).metadata();
    assert.equal(metadata.width, 1920);
    assert.equal(metadata.exif, undefined);
    assert.equal((await readFile(join(output, "src/content/posts/imported/public.md"), "utf8")).includes("/media/"), false);
  } finally { await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); }
});
