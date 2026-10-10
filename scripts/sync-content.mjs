import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir, rm, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import sharp from 'sharp';
// Avoid libvips keeping file handles open across Windows rebuilds.
sharp.cache(false);
const root = fileURLToPath(new URL('..', import.meta.url));
const pick = (item, keys) => Object.fromEntries(keys.filter(key => item[key] !== undefined).map(key => [key, item[key]]));
export function eligible(item, now = Date.now()) {
  if (item.draft === true) return false;
  if (!item.pubDatetime) return true;
  const time = Date.parse(item.pubDatetime);
  if (!Number.isFinite(time)) throw new Error('Invalid publication date');
  return time <= now;
}
export function readPost(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error('Article must contain YAML frontmatter');
  return { data: parse(match[1]), body: match[2] };
}
export async function exportContent(contentDir, outputRoot = root, now = Date.now()) {
  const source = await realpath(resolve(contentDir));
  const postDir = resolve(outputRoot, 'src/content/posts/imported');
  const mediaDir = resolve(outputRoot, 'public/uploads');
  const dataDir = resolve(outputRoot, 'src/data/generated');
  if (source === outputRoot || !relative(source, postDir).startsWith('..'))
    throw new Error('Content source must be separate from generated output');
  for (const dir of [postDir, mediaDir, dataDir]) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }
  const images = new Map();
  async function image(path) {
    if (typeof path !== 'string' || !path.startsWith('/media/')) return path;
    if (images.has(path)) return images.get(path);
    const actual = await realpath(resolve(source, path.slice(1)));
    if (!relative(source, actual).startsWith(`media${sep}`)) throw new Error('Image outside media directory');
    const bytes = await sharp(actual, { limitInputPixels: 50_000_000 })
      .rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
    const filename = `${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}.webp`;
    await writeFile(resolve(mediaDir, filename), bytes);
    const url = `/uploads/${filename}`;
    images.set(path, url);
    return url;
  }
  const journal = JSON.parse(await readFile(resolve(source, 'settings/journal.json'), 'utf8'));
  const out = {
    personal: pick(journal.personal, ['name', 'signature', 'avatar', 'location', 'status', 'project']),
    places: (journal.places ?? []).map(item => pick(item, ['name', 'coordinates', 'residence', 'visited', 'description'])),
    photos: [], music: [], notes: [], games: []
  };
  out.personal.avatar = await image(out.personal.avatar);
  out.personal.project = pick(out.personal.project ?? {}, ['name', 'description', 'url']);
  for (const item of journal.photos ?? []) {
    if (!eligible(item, now)) continue;
    const photo = pick(item, ['src', 'alt', 'title', 'category', 'date', 'location', 'camera', 'story']);
    if (!['人像', '猫犬', '风光'].includes(photo.category)) throw new Error('Unknown photography category');
    photo.src = await image(photo.src);
    if (photo.src?.startsWith('/uploads/')) {
      const metadata = await sharp(resolve(outputRoot, `public${photo.src}`)).metadata();
      photo.width = metadata.width; photo.height = metadata.height;
    }
    out.photos.push(photo);
  }
  for (const item of journal.music ?? []) {
    if (!eligible(item, now)) continue;
    const music = pick(item, ['id', 'artist', 'title', 'kind', 'cover', 'thought', 'spotify', 'qq']);
    if (music.cover) music.cover = await image(music.cover);
    out.music.push(music);
  }
  for (const item of journal.notes ?? []) {
    if (eligible(item, now)) out.notes.push(pick(item, ['id', 'body', 'pubDatetime', 'island']));
  }
  for (const item of journal.games ?? []) {
    if (eligible(item, now)) out.games.push(pick(item, ['id', 'title', 'platform', 'status', 'score', 'thought']));
  }
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const path = resolve(directory, entry.name);
      if ((await lstat(path)).isSymbolicLink()) throw new Error('Symlinks are not allowed in content');
      if (entry.isDirectory()) { await walk(path); continue; }
      if (!entry.name.endsWith('.md')) throw new Error('Only Markdown articles are accepted, not executable MDX');
      const article = readPost(await readFile(path, 'utf8'));
      if (!eligible(article.data, now)) continue;
      if (!article.data.title || !article.data.description || !article.data.pubDatetime)
        throw new Error('Missing required article fields');
      const assets = new Set(article.body.match(/\/media\/[^\s)\]"'<>]+/g) ?? []);
      for (const asset of assets) article.body = article.body.split(asset).join(await image(asset));
      const allowed = pick(article.data, ['title', 'author', 'description', 'pubDatetime', 'modDatetime', 'featured', 'tags', 'ogImage']);
      if (allowed.ogImage) allowed.ogImage = await image(allowed.ogImage);
      allowed.pubDatetime = new Date(allowed.pubDatetime);
      if (allowed.modDatetime) allowed.modDatetime = new Date(allowed.modDatetime);
      const name = relative(resolve(source, 'posts'), path);
      await mkdir(resolve(postDir, name, '..'), { recursive: true });
      await writeFile(resolve(postDir, name), `---\n${stringify(allowed)}---\n${article.body}`);
    }
  }
  await walk(resolve(source, 'posts'));
  await writeFile(resolve(dataDir, 'journal.json'), JSON.stringify(out, null, 2));
  return out;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (!process.env.CONTENT_DIR) process.stdout.write('CONTENT_DIR absent: using public defaults.\n');
  else { await exportContent(process.env.CONTENT_DIR); process.stdout.write('Published content exported; private drafts omitted.\n'); }
}
