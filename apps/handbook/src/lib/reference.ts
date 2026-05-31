import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Monorepo root (needle/), resolved from this module at build time. */
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export type ReferenceDoc = {
  slug: string;
  title: string;
  category: 'docs' | 'design';
  relativePath: string;
  absolutePath: string;
};

function titleFromPath(relativePath: string): string {
  const base = path.basename(relativePath, '.md');
  return base
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function walkMarkdown(dir: string, category: 'docs' | 'design', prefix: string): ReferenceDoc[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const docs: ReferenceDoc[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      docs.push(...walkMarkdown(full, category, rel));
    } else if (entry.name.endsWith('.md')) {
      const slug = rel.replace(/\.md$/, '').replace(/\\/g, '/');
      docs.push({
        slug: `${category}/${slug}`,
        title: titleFromPath(rel),
        category,
        relativePath: rel,
        absolutePath: full,
      });
    }
  }

  return docs.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getAllReferenceDocs(): ReferenceDoc[] {
  return [
    ...walkMarkdown(path.join(repoRoot, 'docs'), 'docs', ''),
    ...walkMarkdown(path.join(repoRoot, 'design'), 'design', ''),
  ];
}

export function getReferenceDoc(slug: string): ReferenceDoc | undefined {
  return getAllReferenceDocs().find((doc) => doc.slug === slug);
}

export function readReferenceContent(doc: ReferenceDoc): string {
  return fs.readFileSync(doc.absolutePath, 'utf8');
}

/** Documented helper for content agents — repo-relative paths from handbook app. */
export const contentRoots = {
  docs: path.join(repoRoot, 'docs'),
  design: path.join(repoRoot, 'design'),
} as const;
