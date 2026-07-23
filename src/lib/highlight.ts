import type { IncidentWithStudents } from './types'

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 rounded px-0.5 text-inherit">$1</mark>',
  )
}

export function incidentMatchesQuery(
  incident: IncidentWithStudents,
  query: string,
): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  if (incident.description?.toLowerCase().includes(q)) return true
  if (incident.action_note?.toLowerCase().includes(q)) return true
  if (
    incident.incident_students?.some((is) =>
      is.student?.name?.toLowerCase().includes(q),
    )
  )
    return true
  return false
}
