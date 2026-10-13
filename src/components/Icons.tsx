import type { ReactNode, SVGProps } from 'react'

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

type P = SVGProps<SVGSVGElement>

export const IconChat = (p: P) => (
  <Icon {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
)
export const IconSend = (p: P) => (
  <Icon {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" />
  </Icon>
)
export const IconImage = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </Icon>
)
export const IconUsers = (p: P) => (
  <Icon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
    <path d="M16 3.1a4 4 0 0 1 0 7.8" />
  </Icon>
)
export const IconLogout = (p: P) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
)
export const IconX = (p: P) => (
  <Icon {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
)
export const IconUndo = (p: P) => (
  <Icon {...p}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
  </Icon>
)
export const IconRefresh = (p: P) => (
  <Icon {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Icon>
)
export const IconArrowDown = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </Icon>
)
export const IconChevron = ({ up, ...p }: P & { up?: boolean }) => (
  <Icon {...p}>
    <path d={up ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
  </Icon>
)
export const IconAlert = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Icon>
)
export const IconClock = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
)
export const IconWrench = (p: P) => (
  <Icon {...p}>
    <path d="M14.7 6.3a4 4 0 0 0 5 5L21 17l-4 4-5.7-1.3a4 4 0 0 0-5-5L3 8l4-4z" />
  </Icon>
)
