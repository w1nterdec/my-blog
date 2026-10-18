import { createHash } from "node:crypto";
import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  rm,
  realpath,
  lstat,
} from "node:fs/promises";
import { resolve, relative, sep, isAbsolute } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";
import sharp from "sharp";
import { projectDocument } from "../src/utils/project-document.ts";
// Avoid libvips keeping file handles open across Windows rebuilds.
sharp.cache(false);
const root = fileURLToPath(new URL("..", import.meta.url));
const pick = (item, keys) =>
  Object.fromEntries(
    keys.filter(key => item[key] !== undefined).map(key => [key, item[key]])
  );
export function eligible(item, now = Date.now()) {
  if (item.draft != null && typeof item.draft !== "boolean")
    throw new Error("Draft status must be a boolean");
  if (item.draft === true) return false;
  if (!item.pubDatetime) return true;
  const time = Date.parse(item.pubDatetime);
  if (!Number.isFinite(time)) throw new Error("Invalid publication date");
  return time <= now;
}
export function readPost(source) {
  const match = source.match(
    /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/
  );
  if (!match) throw new Error("Article must contain YAML frontmatter");
  const data = parse(match[1]) ?? {};
  if (typeof data !== "object" || Array.isArray(data))
    throw new Error("Frontmatter must contain a metadata object");
  return { data, body: match[2] };
}
export async function exportContent(
  contentDir,
  outputRoot = root,
  now = Date.now()
) {
  const source = await realpath(resolve(contentDir));
  const postDir = resolve(outputRoot, "src/content/posts/_published");
  const projectDir = resolve(outputRoot, "src/content/projects/_published");
  const mediaDir = resolve(outputRoot, "public/uploads");
  const dataDir = resolve(outputRoot, "src/data/generated");
  const contains = (parent, child) => {
    const path = relative(parent, child);
    return (
      path === "" ||
      (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path))
    );
  };
  if (
    [postDir, projectDir, mediaDir, dataDir].some(
      dir => contains(source, dir) || contains(dir, source)
    )
  )
    throw new Error("Content source must be separate from generated output");
  for (const dir of [postDir, projectDir, mediaDir, dataDir]) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }
  const images = new Map();
  async function image(path) {
    if (typeof path !== "string" || !path.startsWith("/media/")) return path;
    if (images.has(path)) return images.get(path);
    const actual = await realpath(resolve(source, path.slice(1)));
    if (!relative(source, actual).startsWith(`media${sep}`))
      throw new Error("Image outside media directory");
    const bytes = await sharp(actual, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
    const filename = `${createHash("sha256").update(bytes).digest("hex").slice(0, 24)}.webp`;
    await writeFile(resolve(mediaDir, filename), bytes);
    const url = `/uploads/${filename}`;
    images.set(path, url);
    return url;
  }
  const journal = JSON.parse(
    await readFile(resolve(source, "settings/journal.json"), "utf8")
  );
  const out = {
    personal: pick(journal.personal, ["name", "signature", "avatar"]),
    places: (journal.places ?? []).map(item =>
      pick(item, ["name", "coordinates", "residence", "visited", "description"])
    ),
  };
  out.personal.avatar = await image(out.personal.avatar);
  const projectFiles = new Set();
  async function walk(directory, collection = "posts") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const path = resolve(directory, entry.name);
      if ((await lstat(path)).isSymbolicLink())
        throw new Error("Symlinks are not allowed in content");
      if (entry.isDirectory()) {
        await walk(path, collection);
        continue;
      }
      if (
        collection === "projects"
          ? !/\.(md|markdown)$/i.test(entry.name)
          : !entry.name.endsWith(".md")
      )
        throw new Error(
          "Only Markdown articles are accepted, not executable MDX"
        );
      const text = (await readFile(path, "utf8")).replace(/^\uFEFF/, "");
      const article =
        collection === "projects" && !/^---\r?\n/.test(text)
          ? { data: {}, body: text }
          : readPost(text);
      if (!eligible(article.data, now)) continue;
      if (
        collection === "posts" &&
        (!article.data.title ||
          !article.data.description ||
          !article.data.pubDatetime)
      )
        throw new Error("Missing required article fields");
      const assets = new Set(
        article.body.match(/\/media\/[^\s)\]"'<>]+/g) ?? []
      );
      for (const asset of assets)
        article.body = article.body.split(asset).join(await image(asset));
      const allowed = pick(
        article.data,
        collection === "projects"
          ? ["title", "description", "pubDatetime", "modDatetime", "ogImage"]
          : [
              "title",
              "author",
              "description",
              "pubDatetime",
              "modDatetime",
              "featured",
              "tags",
              "ogImage",
            ]
      );
      for (const field of ["pubDatetime", "modDatetime"]) {
        if (allowed[field] == null || allowed[field] === "") delete allowed[field];
      }
      if (allowed.ogImage) allowed.ogImage = await image(allowed.ogImage);
      if (allowed.pubDatetime)
        allowed.pubDatetime = new Date(allowed.pubDatetime);
      if (allowed.modDatetime)
        allowed.modDatetime = new Date(allowed.modDatetime);
      let name = relative(resolve(source, collection), path);
      const destination = collection === "projects" ? projectDir : postDir;
      if (collection === "projects") {
        Object.assign(allowed, projectDocument(allowed, article.body, name));
        name = name.replace(/\.(md|markdown)$/i, ".md");
        if (projectFiles.has(name.toLowerCase()))
          throw new Error(`Duplicate project file: ${name}`);
        projectFiles.add(name.toLowerCase());
      }
      await mkdir(resolve(destination, name, ".."), { recursive: true });
      await writeFile(
        resolve(destination, name),
        `---\n${stringify(allowed)}---\n${article.body}`
      );
    }
  }
  await walk(resolve(source, "posts"));
  const sourceProjects = resolve(source, "projects");
  const projectStat = await lstat(sourceProjects).catch(error => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (projectStat?.isSymbolicLink())
    throw new Error("Symlinks are not allowed in content");
  if (projectStat) await walk(sourceProjects, "projects");
  await writeFile(
    resolve(dataDir, "journal.json"),
    JSON.stringify(out, null, 2)
  );
  return out;
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  if (!process.env.CONTENT_DIR)
    process.stdout.write("CONTENT_DIR absent: using public defaults.\n");
  else {
    await exportContent(process.env.CONTENT_DIR);
    process.stdout.write(
      "Published content exported; private drafts omitted.\n"
    );
  }
}
