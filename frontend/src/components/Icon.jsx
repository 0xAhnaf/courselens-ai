const paths = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  file: '<path d="M6 2h8l4 4v16H6zM14 2v5h5M9 13h6M9 17h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  warning: '<path d="M12 3 2.5 20h19zM12 9v4M12 17h.01"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
  sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8zM5 13l.7 1.8 1.8.7-1.8.7L5 18l-.7-1.8-1.8-.7 1.8-.7z"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
  eyeOff: '<path d="m3 3 18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.7M6.6 6.6C3.5 8.5 2 12 2 12s3.5 6 10 6a10.4 10.4 0 0 0 4-.8M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
}

export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={`icon ${className}`}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      dangerouslySetInnerHTML={{ __html: paths[name] || paths.sparkles }}
    />
  )
}
