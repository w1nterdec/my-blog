import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));
function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}
// Check exact spelling on Windows too, matching Linux deployment.
async function existsWithExactCase(base, target) {
  const path = relative(base, target);
  if (isAbsolute(path) || path === ".." || path.startsWith(`..${sep}`))
    return false;
  let current = base;
  for (const part of path.split(sep)) {
    if (!(await readdir(current)).includes(part)) return false;
    current = resolve(current, part);
  }
  return (await stat(current)).isFile();
}
export async function checkContent(directory = root) {
  const errors = [];
  async function checkImage(url, file, publicOnly = false) {
    if (typeof url !== "string" || !url.trim()) {
      errors.push(`${relative(directory, file)}: 图片路径不能为空`);
      return;
    }
    if (/^(?:https?:|data:|\/\/)/i.test(url)) return;
    try {
      const path = decodeURIComponent(url.split(/[?#]/)[0]);
      if (/^\/(?:media|uploads)\//.test(path))
        throw new Error(
          "旧图片路径需要迁移到 public/images/，并改为 /images/..."
        );
      if (publicOnly && !path.startsWith("/"))
        throw new Error("ogImage 必须使用 /images/... 或完整 HTTPS URL");
      const base = path.startsWith("/")
        ? resolve(directory, "public")
        : directory;
      const target = path.startsWith("/")
        ? resolve(base, path.slice(1))
        : resolve(dirname(file), path);
      if (!(await existsWithExactCase(base, target)))
        throw new Error("图片不存在或文件名大小写不匹配");
    } catch (error) {
      errors.push(`${relative(directory, file)}: ${url} — ${error.message}`);
    }
  }
  const processor = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [
      () => async (tree, file) => {
        const definitions = new Map();
        const references = new Set();
        const images = [];
        walk(tree, node => {
          if (node.type === "definition")
            definitions.set(node.identifier, node.url);
          if (node.type === "imageReference") references.add(node.identifier);
          if (node.type === "image") images.push(node.url);
          if (node.type === "html") {
            for (const match of node.value.matchAll(
              /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi
            ))
              images.push(match[1]);
          }
        });
        for (const reference of references) {
          if (definitions.has(reference))
            images.push(definitions.get(reference));
        }
        await Promise.all(images.map(url => checkImage(url, file.path)));
      },
    ],
  });
  async function scan(folder, collection) {
    const entries = await readdir(folder, { withFileTypes: true }).catch(
      error => {
        if (error.code === "ENOENT") return [];
        throw error;
      }
    );
    for (const entry of entries) {
      if (/^[._]/.test(entry.name)) continue;
      const file = resolve(folder, entry.name);
      if (entry.isDirectory()) {
        await scan(file, collection);
        continue;
      }
      if (/\.(?:mdx|markdown)$/i.test(entry.name)) {
        errors.push(`${relative(directory, file)}: 请使用 .md 文件`);
        continue;
      }
      if (!entry.name.endsWith(".md")) continue;
      try {
        const source = (await readFile(file, "utf8")).replace(/^\uFEFF/, "");
        const match = source.match(
          /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/
        );
        if (!match && collection === "posts")
          throw new Error("文章缺少 YAML frontmatter");
        const data = match ? parse(match[1]) : {};
        if (!data || typeof data !== "object" || Array.isArray(data))
          throw new Error("frontmatter 必须是字段对象");
        if (
          collection === "posts" &&
          (!data.title || !data.description || !data.pubDatetime)
        )
          throw new Error("文章必须填写 title、description、pubDatetime");
        if (data.ogImage != null) await checkImage(data.ogImage, file, true);
        await processor.render(match ? match[2] : source, {
          fileURL: pathToFileURL(file),
        });
      } catch (error) {
        errors.push(`${relative(directory, file)}: ${error.message}`);
      }
    }
  }
  for (const collection of ["posts", "projects", "pages"])
    await scan(resolve(directory, "src/content", collection), collection);
  return errors;
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const errors = await checkContent();
  if (errors.length) {
    process.stderr.write(`${errors.join("\n")}\n`);
    process.exitCode = 1;
  } else process.stdout.write("文章与图片检查通过。\n");
}
