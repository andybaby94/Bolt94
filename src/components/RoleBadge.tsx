import { ROLE_LABELS, ROLE_COLORS, ROLE_DOT_COLORS } from '../lib/types'

export default function RoleBadge({
  role,
  name,
}: {
  role: string
  name?: string
}) {
  const label = ROLE_LABELS[role] || role
  const color = ROLE_COLORS[role] || ROLE_COLORS.other
  const dot = ROLE_DOT_COLORS[role] || ROLE_DOT_COLORS.other
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
      {name && <span className="font-semibold">{name}</span>}
    </span>
  )
}
