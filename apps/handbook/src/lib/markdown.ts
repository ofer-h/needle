import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function renderMarkdown(source: string): string {
  return marked.parse(source) as string;
}

/** Rewrite relative markdown links to handbook reference routes where possible. */
export function rewriteDocLinks(html: string, _docSlug: string): string {
  return html.replace(/href="([^"]+\.md)"/g, (_match, href: string) => {
    if (href.startsWith('http')) return `href="${href}"`;
    const normalized = href.replace(/^\.\//, '').replace(/^\.\.\//, '');
    if (normalized.startsWith('design/')) {
      const slug = `design/${normalized.replace(/^design\//, '').replace(/\.md$/, '')}`;
      return `href="/reference/${slug}/"`;
    }
    if (normalized.includes('docs/') || !normalized.includes('/')) {
      const clean = normalized.replace(/^docs\//, '').replace(/\.md$/, '');
      return `href="/reference/docs/${clean}/"`;
    }
    return `href="${href}"`;
  });
}

export type LinkCheckResult = {
  href: string;
  ok: boolean;
  note?: string;
};

export function extractInternalLinks(html: string): string[] {
  const links: string[] = [];
  const re = /href="(\/[^"#?]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    links.push(m[1] ?? '');
  }
  return [...new Set(links)];
}
