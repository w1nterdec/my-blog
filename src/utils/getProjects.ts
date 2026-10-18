import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import { projectDocument } from "./project-document";

export async function getProjects() {
  const projects = (await getCollection("projects"))
    .filter(
      project =>
        !project.data.draft &&
        (!project.data.pubDatetime ||
          project.data.pubDatetime.getTime() <= Date.now())
    )
    .map(project => ({
      ...project,
      data: {
        ...project.data,
        ...projectDocument(project.data, project.body ?? "", project.id),
      },
      slug: project.id.replace(/^_published\//, "").replace(/\/readme$/i, ""),
    }))
    .sort(
      (a, b) =>
        (b.data.pubDatetime?.getTime() ?? 0) -
          (a.data.pubDatetime?.getTime() ?? 0) ||
        a.data.title.localeCompare(b.data.title)
    );
  const slugs = new Set<string>();
  for (const project of projects) {
    if (slugs.has(project.slug))
      throw new Error(`Duplicate project URL: ${project.slug}`);
    slugs.add(project.slug);
  }
  return projects;
}

export function getProjectUrl(slug: string, locale?: string) {
  return getRelativeLocaleUrl(locale ?? "zh-CN", `projects/${slug}`);
}

export type ProjectDocument = Awaited<ReturnType<typeof getProjects>>[number];
