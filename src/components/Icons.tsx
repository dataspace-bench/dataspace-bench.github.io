import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function ArrowUpRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}

export function GithubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.23c-3.23.7-3.91-1.37-3.91-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.58-.29-5.29-1.29-5.29-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.09 0 4.4-2.72 5.38-5.31 5.67.42.36.79 1.07.79 2.17v3.22c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  )
}

export function DatabaseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </svg>
  )
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h7l4 4v14H7zM14 3v5h4M10 12h5M10 16h5" />
    </svg>
  )
}

export function VideoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3z" />
    </svg>
  )
}

export function TableIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11M15 9v11" />
    </svg>
  )
}

export function BracesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 3H6a2 2 0 0 0-2 2v4a3 3 0 0 1-2 3 3 3 0 0 1 2 3v4a2 2 0 0 0 2 2h2M16 3h2a2 2 0 0 1 2 2v4a3 3 0 0 0 2 3 3 3 0 0 0-2 3v4a2 2 0 0 1-2 2h-2" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 5 6v5c0 4.55 2.91 8.46 7 10 4.09-1.54 7-5.45 7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 44" aria-hidden="true">
      <defs>
        <linearGradient id="brand-gradient" x1="4" y1="3" x2="39" y2="41">
          <stop stopColor="#8b7cf6" />
          <stop offset=".52" stopColor="#57bae9" />
          <stop offset="1" stopColor="#77d8bd" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="13" fill="#0a1424" />
      <path
        d="M11.5 11.5h11c7.3 0 12.5 4 12.5 10.5s-5.2 10.5-12.5 10.5h-11v-21Z"
        fill="none"
        stroke="url(#brand-gradient)"
        strokeWidth="3.4"
      />
      <circle cx="17" cy="17.4" r="1.8" fill="#ffd36a" />
      <circle cx="17" cy="26.8" r="1.8" fill="#ff9f8f" />
      <path d="M17 17.4h7.8M17 26.8h7.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
