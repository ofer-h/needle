export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/** Single source of truth for handbook navigation. Content agents must not edit this file. */
export const navSections: NavSection[] = [
  {
    title: 'Start',
    items: [{ label: 'Overview', href: '/' }],
  },
  {
    title: 'Product',
    items: [
      { label: 'Product hub', href: '/product/' },
      { label: 'Positioning', href: '/product/positioning/' },
      { label: 'Competitive landscape', href: '/product/competitive/' },
      { label: 'Daily flow direction', href: '/product/daily-flow/' },
      { label: 'Accountability', href: '/product/accountability/' },
    ],
  },
  {
    title: 'How the app works',
    items: [
      { label: 'Today & scheduling', href: '/app/today/' },
      { label: 'Capture & classify', href: '/app/capture/' },
      { label: 'Torch intervention', href: '/app/torch/' },
      { label: 'Async UX & observability', href: '/app/async/' },
    ],
  },
  {
    title: 'Model & direction',
    items: [
      { label: 'Anatomy (task/item model)', href: '/anatomy/' },
      { label: 'Architecture', href: '/architecture/' },
      { label: 'Infra 101', href: '/infra/' },
      { label: 'Decisions timeline', href: '/decisions/' },
      { label: 'Roadmap', href: '/roadmap/' },
    ],
  },
  {
    title: 'Reference',
    items: [{ label: 'Docs & design files', href: '/reference/' }],
  },
];

export function flattenNav(): NavItem[] {
  return navSections.flatMap((section) => section.items);
}

export function isActive(pathname: string, href: string): boolean {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const target = href.endsWith('/') ? href : `${href}/`;
  if (target === '/') return normalized === '/';
  return normalized.startsWith(target);
}
