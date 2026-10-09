import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";
export async function GET() {
  return rss({
    title: "Zhixing Journal",
    description:
      "Small moments, everyday feelings, and thoughts worth keeping.",
    site: config.site.url,
    customData: "<language>en</language>",
    items: getSortedPosts(await getCollection("posts")).map(
      ({ data, id, filePath }) => ({
        link: getPostUrl(id, filePath, "en"),
        title: data.title,
        description: data.description,
        pubDate: new Date(data.modDatetime ?? data.pubDatetime),
      })
    ),
  });
}
