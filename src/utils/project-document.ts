type DocumentMetadata = {
  title?: string;
  description?: string;
};

/** Plain README files can supply their title and summary without frontmatter. */
export function projectDocument(
  data: DocumentMetadata,
  body: string,
  filename: string
) {
  const heading = body.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1];
  const parts = filename
    .replaceAll("\\", "/")
    .replace(/\.(md|markdown)$/i, "")
    .split("/");
  const fallback =
    /^readme$/i.test(parts.at(-1) ?? "") && parts.length > 1
      ? parts.at(-2)
      : parts.at(-1);
  const summary =
    body
      .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "")
      .replace(/^#{1,6}\s+.*$/gm, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/[*_`>|]/g, "")
      .trim()
      .split(/\n\s*\n/)[0]
      ?.replace(/\s+/g, " ")
      .slice(0, 160) ?? "";
  return {
    title: data.title?.trim() || heading || fallback || "README",
    description: data.description?.trim() || summary,
  };
}
