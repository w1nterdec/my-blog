import type { CollectionEntry } from "astro:content";

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - Excludes future posts, including in development and previews
 */
export function postFilter({ data }: CollectionEntry<"posts">) {
  return !data.draft && Date.now() >= new Date(data.pubDatetime).getTime();
}
