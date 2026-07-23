export interface Student {
  id: string
  name: string
  grade: number
  class_number: number
  student_number: number
  is_active: boolean
  created_at: string
}

export type IncidentRole = 'actor' | 'victim' | 'witness' | 'other'

export interface Incident {
  id: string
  occurred_at: string
  location: string
  incident_type: string
  description: string
  action_type: string | null
  action_note: string | null
  time_period: string | null
  created_at: string
  updated_at: string
}

export interface IncidentStudent {
  id: string
  incident_id: string
  student_id: string
  role: IncidentRole
  created_at: string
}

export interface IncidentWithStudents extends Incident {
  incident_students: {
    id: string
    role: IncidentRole
    student: Student
  }[]
}

export const ROLE_LABELS: Record<IncidentRole, string> = {
  actor: '행동학생',
  victim: '피해학생',
  witness: '목격학생',
  other: '기타',
}

export const ROLE_COLORS: Record<IncidentRole, string> = {
  actor: 'bg-error-100 text-error-700 border-error-200',
  victim: 'bg-warning-100 text-warning-700 border-warning-200',
  witness: 'bg-primary-100 text-primary-700 border-primary-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}

export const ACTION_TYPES = [
  '제1호-가목',
  '제1호-나목',
  '제2호',
  '제3호',
  '기타',
] as const

export const INCIDENT_TYPES = [
  '신체충돌',
  '언어폭력',
  '교육관계',
  '생활습관',
  '기타',
] as const

export const TIME_PERIODS = [
  '오전 수업 시간',
  '1교시 후 쉬는시간',
  '2교시 후 쉬는시간',
  '점심시간',
  '오후 수업 시간',
  '방과 후',
  '기타',
] as const
