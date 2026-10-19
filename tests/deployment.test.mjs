import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readlink,
  symlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

test(
  "release activation verifies the served version, preserves the current site on failure and supports rollback",
  { skip: process.platform === "win32" },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "blog-deployment-"));
    const run = (script, args = [], mode = "success") =>
      spawnSync(
        "bash",
        [
          fileURLToPath(
            new URL(`../infrastructure/${script}`, import.meta.url)
          ),
          ...args,
        ],
        {
          env: {
            ...process.env,
            BLOG_ROOT: root,
            PATH: `${root}/bin:${process.env.PATH}`,
            CURL_MODE: mode,
          },
          encoding: "utf8",
        }
      );
    try {
      for (const dir of ["bin", "releases/source-1-1", "releases/source-2-1"])
        await mkdir(join(root, dir), { recursive: true });
      for (const id of ["source-1-1", "source-2-1"]) {
        for (const file of ["index.html", "404.html"])
          await writeFile(join(root, "releases", id, file), id);
        await writeFile(join(root, "releases", id, "release.txt"), id);
      }
      await symlink("releases/source-1-1", join(root, "current"));
      await writeFile(
        join(root, "bin/curl"),
        '#!/usr/bin/env bash\n[[ "$CURL_MODE" != fail ]] || exit 22\nif [[ "${@: -1}" == */release.txt ]]; then\n  if [[ "$CURL_MODE" == stale ]]; then printf old; else cat "$BLOG_ROOT/current/release.txt"; fi\nfi\n',
        { mode: 0o755 }
      );
      assert.notEqual(run("activate-release.sh", ["../outside"]).status, 0);
      assert.notEqual(run("activate-release.sh", ["source-3-1"]).status, 0);
      for (const mode of ["stale", "fail"]) {
        assert.notEqual(
          run("activate-release.sh", ["source-2-1"], mode).status,
          0
        );
        assert.equal(
          await readlink(join(root, "current")),
          "releases/source-1-1"
        );
      }
      const result = run("activate-release.sh", ["source-2-1"]);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(
        await readlink(join(root, "current")),
        "releases/source-2-1"
      );
      assert.equal(
        (await readFile(join(root, ".previous-release"), "utf8")).trim(),
        "releases/source-1-1"
      );
      // An SSH retry must not replace the rollback target with the active release.
      assert.equal(run("activate-release.sh", ["source-2-1"]).status, 0);
      assert.equal(
        (await readFile(join(root, ".previous-release"), "utf8")).trim(),
        "releases/source-1-1"
      );
      assert.notEqual(run("rollback-release.sh", [], "fail").status, 0);
      assert.equal(
        await readlink(join(root, "current")),
        "releases/source-2-1"
      );
      assert.equal(run("rollback-release.sh").status, 0);
      assert.equal(
        await readlink(join(root, "current")),
        "releases/source-1-1"
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
);
