import { cpSync } from "node:fs";

// Keep development search assets available on Windows, macOS and Linux.
cpSync(
  new URL("../dist/pagefind/", import.meta.url),
  new URL("../public/pagefind/", import.meta.url),
  { recursive: true }
);
