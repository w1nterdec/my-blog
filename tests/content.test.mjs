import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkContent } from "../scripts/check-content.mjs";

const metadata =
  "---\ntitle: Example\ndescription: Summary\npubDatetime: 2026-01-01T00:00:00+08:00\n";
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), "blog-content-"));
  const write = async (path, body) => {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), body);
  };
  try {
    await run(root, write);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("valid public covers, Markdown references, HTML and relative images pass; code examples are ignored", async () => {
  await fixture(async (root, write) => {
    await write("public/images/cover.webp", "image");
    await write("src/content/posts/demo/diagram.png", "image");
    await write(
      "src/content/posts/demo/index.md",
      `${metadata}ogImage: /images/cover.webp\n---\n![inline](/images/cover.webp?v=1)\n![relative](./diagram.png)\n![reference][cover]\n\n[cover]: /images/cover.webp\n\n<img src="/images/cover.webp" alt="cover">\n\n\`![code](/missing.png)\`\n\n\`\`\`md\n![example](/missing.png)\n\`\`\`\n`
    );
    await write(
      "src/content/projects/demo/README.md",
      "# Demo\n\nA plain README.\n\n![remote](https://example.com/image.png)"
    );
    assert.deepEqual(await checkContent(root), []);
  });
});

test("missing covers and body images fail with the originating file and URL", async () => {
  await fixture(async (root, write) => {
    await write(
      "src/content/posts/broken.md",
      `${metadata}ogImage: /images/missing.webp\n---\n![missing][photo]\n\n[photo]: /images/body.png\n\n<img src="/images/html.png">`
    );
    const errors = await checkContent(root);
    assert.equal(errors.length, 3);
    for (const url of ["missing.webp", "body.png", "html.png"])
      assert.ok(
        errors.some(error => error.includes("broken.md") && error.includes(url))
      );
  });
});

test("case differences, old generated URLs and relative covers are rejected before Astro builds", async () => {
  await fixture(async (root, write) => {
    await write("public/images/Cover.png", "image");
    await write(
      "src/content/posts/broken.md",
      `${metadata}ogImage: ./cover.png\n---\n![case](/images/cover.png)\n![legacy](/uploads/7d7d99a489b4d7117f769fcd.webp)`
    );
    const errors = await checkContent(root);
    assert.equal(errors.length, 3);
    assert.ok(errors.some(error => error.includes("大小写")));
    assert.ok(errors.some(error => error.includes("旧图片路径")));
    assert.ok(errors.some(error => error.includes("ogImage")));
  });
});

test("drafts still require valid source; legacy generated folders never enter local publishing", async () => {
  await fixture(async (root, write) => {
    await write(
      "src/content/posts/_published/legacy.md",
      "stale generated content"
    );
    await write(
      "src/content/posts/draft.md",
      `${metadata}draft: true\n---\n![draft](/images/missing.png)`
    );
    await write("src/content/posts/plain.md", "No metadata");
    await write("src/content/projects/demo.markdown", "# Rename me");
    const errors = await checkContent(root);
    assert.equal(errors.length, 3);
    assert.ok(errors.some(error => error.includes("draft.md")));
    assert.ok(errors.some(error => error.includes("frontmatter")));
    assert.ok(errors.some(error => error.includes(".md 文件")));
  });
});
