export interface Student {
  id: string
  name: string
  grade: number
  class_number: number
  student_number: number
  created_at: string
}

export interface Incident {
  id: string
  occurred_at: string
  location: string
  incident_type: string
  description: string
  action_type: string | null
  action_note: string | null
  created_at: string
  updated_at: string
  time_period: string | null
}

export interface IncidentStudent {
  id: string
  incident_id: string
  student_id: string
  role: string
  created_at: string
  student?: Student
}

export interface IncidentWithStudents extends Incident {
  incident_students: (IncidentStudent & { student: Student })[]
}

export type Role = 'actor' | 'victim' | 'witness' | 'other'

export const ROLE_LABELS: Record<string, string> = {
  actor: '행동학생',
  victim: '피해학생',
  witness: '목격학생',
  other: '기타',
}

export const ROLE_COLORS: Record<string, string> = {
  actor: 'bg-red-100 text-red-700 border-red-200',
  victim: 'bg-blue-100 text-blue-700 border-blue-200',
  witness: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
}

export const ROLE_DOT_COLORS: Record<string, string> = {
  actor: 'bg-red-500',
  victim: 'bg-blue-500',
  witness: 'bg-amber-500',
  other: 'bg-slate-400',
}

export const TIME_PERIODS = [
  '아침시간',
  '1교시',
  '1교시 후 쉬는시간',
  '2교시',
  '2교시 후 쉬는시간',
  '3교시',
  '3교시 후 쉬는시간',
  '4교시',
  '4교시 후 쉬는시간',
  '점심시간',
  '5교시',
  '5교시 후 쉬는시간',
  '6교시',
  '6교시 후 쉬는시간',
  '하교시간',
]

export const LOCATIONS = [
  '교실',
  '복도',
  '운동장',
  '특별실',
  '화장실',
  '기타',
]

export const INCIDENT_TYPES = [
  '교우관계',
  '수업방해',
  '생활습관',
  '교육관계',
  '신체충돌',
  '언어폭력',
  '기타',
]

export const ACTION_TYPES = [
  '단순지도',
  '개별상담',
  '제1호-가목',
  '제1호-나목',
  '제2호-나목',
  '1호',
  '2호',
  '3호',
]
