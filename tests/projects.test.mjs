import { test } from "node:test";
import assert from "node:assert/strict";
import { projectDocument } from "../src/utils/project-document.ts";

test("plain README derives metadata while explicit metadata takes priority", () => {
  assert.deepEqual(
    projectDocument(
      {},
      "# Example\n\nA **Markdown** introduction.\n\nSecond paragraph.",
      "example/README.md"
    ),
    {
      title: "Example",
      description: "A Markdown introduction.",
    }
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
