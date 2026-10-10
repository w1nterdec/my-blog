import { cpSync, rmSync } from "node:fs";

// Keep development search assets available on Windows, macOS and Linux.
rmSync(new URL("../public/pagefind/", import.meta.url), { recursive: true, force: true });
cpSync(
  new URL("../dist/pagefind/", import.meta.url),
  new URL("../public/pagefind/", import.meta.url),
  { recursive: true }
);
