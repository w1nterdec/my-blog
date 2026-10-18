import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { parse } from "yaml";
import sharp from "sharp";
import { exportContent } from "../scripts/sync-content.mjs";
import { projectDocument } from "../src/utils/project-document.ts";

test("plain README derives metadata while explicit metadata takes priority", () => {
  assert.deepEqual(
    projectDocument(
      {},
      "# Example\n\nA **Markdown** introduction.\n\nSecond paragraph.",
      "example/README.md"
    ),
    { title: "Example", description: "A Markdown introduction." }
  );
  assert.equal(projectDocument({}, "", "example/README.md").title, "example");
  assert.deepEqual(
    projectDocument(
      { title: "Manual", description: "Summary" },
      "# Example\n\nBody",
      "README.md"
    ),
    { title: "Manual", description: "Summary" }
  );
});

test("project export accepts README and Markdown, excludes drafts and schedules, and clears withdrawn documents", async () => {
  const dir = await mkdtemp(join(tmpdir(), "w1nter-project-test-"));
  const source = join(dir, "content");
  const output = join(dir, "site");
  const published = join(output, "src/content/projects/_published");
  try {
    for (const path of ["settings", "posts", "projects/demo", "media"])
      await mkdir(join(source, path), { recursive: true });
    await writeFile(
      join(source, "settings/journal.json"),
      JSON.stringify({
        personal: {
          name: "test",
          avatar: "avatar.webp",
          project: { url: "REMOVED_PROJECT_URL" },
        },
        places: [],
      })
    );
    await sharp({
      create: { width: 16, height: 16, channels: 3, background: "white" },
    })
      .png()
      .toFile(join(source, "media/diagram.png"));
    await writeFile(
      join(source, "projects/demo/README.md"),
      "\uFEFF# Demo\n\nA project document.\n\n![diagram](/media/diagram.png)\n\n```js\nconsole.log('demo');\n```\n"
    );
    await writeFile(
      join(source, "projects/notes.markdown"),
      "---\ntitle: Notes\ndescription: Summary\npubDatetime: null\nmodDatetime: null\nsecret: PRIVATE_EXTRA\n---\n## Details\n\nA table below.\n"
    );
    await writeFile(
      join(source, "projects/draft.md"),
      "---\ntitle: Private\ndraft: true\n---\nPRIVATE_BODY"
    );
    await writeFile(
      join(source, "projects/future.md"),
      "---\ntitle: Later\npubDatetime: 2099-01-01T00:00:00Z\n---\nFUTURE_BODY"
    );
    const data = await exportContent(source, output);
    assert.equal(JSON.stringify(data).includes("REMOVED_PROJECT_URL"), false);
    const readme = await readFile(join(published, "demo/README.md"), "utf8");
    assert.match(readme, /title: Demo/);
    assert.match(readme, /description: A project document\./);
    assert.match(readme, /\/uploads\//);
    assert.match(readme, /console\.log\('demo'\)/);
    assert.equal(readme.includes("/media/"), false);
    await assert.rejects(
      exportContent(published, output),
      /separate from generated output/
    );
    assert.equal(
      await readFile(join(published, "demo/README.md"), "utf8"),
      readme
    );
    const files = await readdir(published);
    assert.deepEqual(files.sort(), ["demo", "notes.md"]);
    assert.equal(
      (await readFile(join(published, "notes.md"), "utf8")).includes(
        "PRIVATE_EXTRA"
      ),
      false
    );
    assert.equal((await readFile(join(published, "notes.md"), "utf8")).includes("Datetime"), false);
    await writeFile(
      join(source, "projects/demo/README.md"),
      "---\ndraft: true\n---\nWITHDRAWN"
    );
    await exportContent(source, output);
    assert.deepEqual(await readdir(published), ["notes.md"]);
    assert.deepEqual(await readdir(join(output, "public/uploads")), []);
    await writeFile(
      join(source, "projects/executable.mdx"),
      "export const code = true;"
    );
    await assert.rejects(exportContent(source, output), /Only Markdown/);
  } finally {
    await rm(dir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
});

test("CMS imports Markdown bodies locally and preserves the existing body after invalid input", async () => {
  const script = await readFile(
    new URL("../public/admin/editor.js", import.meta.url),
    "utf8"
  );
  const changes = [];
  let widget;
  const markdown = { control: () => {}, preview: () => {} };
  const CMS = {
    getWidget: () => markdown,
    registerWidget: (name, control) => {
      assert.equal(name, "markdown-file");
      widget = control;
    },
    init() {},
    registerPreviewStyle() {},
    registerEventListener() {},
  };
  runInNewContext(script, {
    CMS,
    window: { h() {}, createClass: control => control },
  });
  const control = {
    state: widget.getInitialState(),
    props: { onChange: body => changes.push(body) },
    setState(state) {
      this.state = { ...this.state, ...(typeof state === "function" ? state(this.state) : state) };
    },
  };
  await widget.importFile.call(control, {
    target: {
      files: [
        {
          name: "README.md",
          size: 100,
          text: async () => "---\ntitle: metadata\n---\n# Body\n\nText",
        },
      ],
      value: "README.md",
    },
  });
  assert.equal(changes[0], "# Body\n\nText");
  assert.equal(control.state.editorKey, 1);
  await widget.importFile.call(control, {
    target: { files: [{ name: "run.mdx", size: 100 }], value: "run.mdx" },
  });
  assert.equal(changes.length, 1);
  assert.match(control.state.message, /5MB/);
  const config = parse(
    await readFile(
      new URL("../public/admin/config.yml", import.meta.url),
      "utf8"
    )
  );
  assert.equal(
    config.collections.find(item => item.name === "projects").folder,
    "projects"
  );
  assert.equal(
    config.collections
      .find(item => item.name === "projects")
      .fields.find(field => field.name === "body").widget,
    "markdown-file"
  );
});
