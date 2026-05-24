type IconProps = { size?: number };

export function IconArrow({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11L11 5M11 5H6.5M11 5V9.5" />
    </svg>
  );
}

export function IconChevron({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

export function IconBack({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4l-4 4 4 4" />
    </svg>
  );
}

export function IconCal({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

export function IconMic({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="4" height="8" rx="2" />
      <path d="M3.5 8.5a4.5 4.5 0 0 0 9 0M8 13v1.5" />
    </svg>
  );
}

export function IconPaperclip({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 5.5l-5 5a2 2 0 1 0 2.8 2.8l6-6a3.5 3.5 0 0 0-5-5l-6 6" />
    </svg>
  );
}

export function IconCheck({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

export function IconThumbsUp({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 14V7l3-4.5c.7 0 1.2.5 1.2 1.2V6.5h3a1.3 1.3 0 0 1 1.3 1.6l-1.1 4.8a1.5 1.5 0 0 1-1.5 1.1H5.5z" />
      <path d="M5.5 7H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2.5" />
    </svg>
  );
}

export function IconThumbsDown({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2v7l-3 4.5c-.7 0-1.2-.5-1.2-1.2V9.5h-3A1.3 1.3 0 0 1 2 7.9L3.1 3.1A1.5 1.5 0 0 1 4.6 2h5.9z" />
      <path d="M10.5 9H13a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-2.5" />
    </svg>
  );
}

export function IconSpark({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l1.4 4.6L14 7l-4.6 1.4L8 13l-1.4-4.6L2 7l4.6-1.4L8 1z" />
    </svg>
  );
}

export function IconPlus({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

export function IconCommand({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 4.5h5v5h-5z" />
      <path d="M4 6a1.5 1.5 0 1 1 1.5-1.5v7A1.5 1.5 0 1 1 4 10h7a1.5 1.5 0 1 1-1.5 1.5v-7A1.5 1.5 0 1 1 11 6H4z" />
    </svg>
  );
}
