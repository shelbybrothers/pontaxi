// Vector only — no emoji anywhere in this UI.

export const Chevron = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M4 2.5 8 6l-4 3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Play = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill={color} aria-hidden="true">
    <path d="M4 2.6 15 9 4 15.4z" />
  </svg>
)

export const Pad = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 1.8 6.2 4h3.6zM8 14.2 6.2 12h3.6zM1.8 8 4 6.2v3.6zM14.2 8 12 6.2v3.6z" fill={color} stroke="none" />
    <circle cx="8" cy="8" r="1.4" fill={color} stroke="none" />
  </svg>
)

export const Dash = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
    <path d="M2 5.5h6M2 8h8M2 10.5h5" />
    <path d="M11.5 4.5 14.5 8l-3 3.5" strokeLinejoin="round" />
  </svg>
)

export const Door = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.5 2 4 3.2v9.6L9.5 14z" />
    <path d="M9.5 3.4H12v9.2H9.5" />
    <circle cx="6.6" cy="8" r="0.7" fill={color} stroke="none" />
  </svg>
)

export const Tap = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.5 7V3.6a1.3 1.3 0 0 1 2.6 0V9l1.6-.9a1.3 1.3 0 0 1 1.8 1.6l-1.4 3.2a2.6 2.6 0 0 1-2.4 1.5H7a2.6 2.6 0 0 1-2.6-2.6V8.4a1 1 0 0 1 2.1-.6z" />
  </svg>
)

export const XMark = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export const Down = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 4.5 6 8l3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const People = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true">
    <circle cx="6" cy="5" r="2.5" />
    <path d="M1.6 13.4c0-2.4 2-4 4.4-4s4.4 1.6 4.4 4z" />
    <circle cx="11.6" cy="5.6" r="2" />
    <path d="M11.6 9.9c1.9 0 3.2 1.3 3.2 3.5h-2.6c0-1.4-.4-2.6-1.2-3.5z" />
  </svg>
)

export const Parcel = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 5 8 2.2 13.5 5v6L8 13.8 2.5 11z" />
    <path d="M2.5 5 8 7.8 13.5 5M8 7.8v6" />
  </svg>
)
