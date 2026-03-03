import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { parseFrontmatter, cleanSvxContent } from '../src/content.js';
import type { DocPage, DocsIndex } from '../src/types.js';

function findSvxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSvxFiles(full));
    } else if (entry.name === '+page.svx') {
      results.push(full);
    }
  }
  return results;
}

function fileToRoute(filePath: string, routesDir: string): string {
  const rel = relative(routesDir, filePath);
  // e.g. docs/api/play/+page.svx → /docs/api/play
  return '/' + rel.replace(/\/?\+page\.svx$/, '');
}

function routeToSection(route: string): string {
  const parts = route.split('/').filter(Boolean);
  return parts[0] || 'docs';
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function main() {
  const projectRoot = resolve(import.meta.dirname, '..', '..');
  const routesDir = resolve(projectRoot, 'src', 'routes');
  const outputDir = resolve(import.meta.dirname, '..', 'data');
  const outputPath = resolve(outputDir, 'docs-index.json');

  // Only scan docs and faq directories
  const scanDirs = ['docs', 'faq']
    .map((d) => resolve(routesDir, d))
    .filter((d) => existsSync(d));

  console.log(`Scanning .svx files in ${routesDir}...`);

  const svxFiles: string[] = [];
  for (const dir of scanDirs) {
    svxFiles.push(...findSvxFiles(dir));
  }
  console.log(`Found ${svxFiles.length} .svx files`);

  const pages: DocPage[] = [];

  for (const filePath of svxFiles) {
    const raw = readFileSync(filePath, 'utf-8');
    const route = fileToRoute(filePath, routesDir);
    const section = routeToSection(route);

    const { frontmatter, body } = parseFrontmatter(raw);
    const cleanedBody = cleanSvxContent(body);

    // If no title from frontmatter, derive from route slug
    const title =
      frontmatter.title ||
      slugToTitle(route.split('/').filter(Boolean).pop() || 'Untitled');

    const page: DocPage = {
      route,
      section,
      title,
      body: cleanedBody,
      tags: frontmatter.tags,
    };

    if (frontmatter.nav_title) page.nav_title = frontmatter.nav_title;
    if (frontmatter.description) page.description = frontmatter.description;
    if (frontmatter.order !== undefined) page.order = frontmatter.order;
    if (frontmatter.icon) page.icon = frontmatter.icon;
    if (frontmatter.badge) page.badge = frontmatter.badge;
    if (frontmatter.updated) page.updated = frontmatter.updated;

    pages.push(page);
  }

  // Sort by section then route
  pages.sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.route.localeCompare(b.route);
  });

  const index: DocsIndex = {
    generatedAt: new Date().toISOString(),
    pageCount: pages.length,
    pages,
  };

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`Generated ${outputPath} with ${pages.length} pages`);

  // Print summary
  const sections = new Map<string, number>();
  for (const p of pages) {
    sections.set(p.section, (sections.get(p.section) || 0) + 1);
  }
  for (const [section, count] of sections) {
    console.log(`  ${section}: ${count} pages`);
  }
}

main();
