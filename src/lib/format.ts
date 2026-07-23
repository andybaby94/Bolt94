import type { IncidentWithStudents } from './types'

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function isWithinDays(iso: string, days: number): boolean {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  return diff <= days * 24 * 60 * 60 * 1000
}

export function getStudentNamesByRole(
  incident: IncidentWithStudents,
): { role: string; names: string[] }[] {
  const roleMap: Record<string, string[]> = {}
  for (const is of incident.incident_students || []) {
    const role = is.role
    if (!roleMap[role]) roleMap[role] = []
    if (is.student?.name) roleMap[role].push(is.student.name)
  }
  return Object.entries(roleMap).map(([role, names]) => ({ role, names }))
}
