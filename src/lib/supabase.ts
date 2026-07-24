import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Student = {
  id: string;
  name: string;
  grade: number | null;
  class_number: number | null;
  student_number: number | null;
  gender: string | null;
  is_active: boolean;
  created_at: string;
};

export function formatStudentInfo(s: Pick<Student, 'grade' | 'class_number' | 'student_number'>): string {
  const parts: string[] = [];
  if (s.grade != null) parts.push(`${s.grade}학년`);
  if (s.class_number != null) parts.push(`${s.class_number}반`);
  if (s.student_number != null) parts.push(`${s.student_number}번`);
  return parts.join(' ');
}

export type Incident = {
  id: string;
  occurred_at: string;
  location: string;
  incident_type: string;
  description: string;
  action_type: string | null;
  action_note: string | null;
  time_period: string | null;
  created_at: string;
  updated_at: string;
};

export type IncidentStudent = {
  id: string;
  incident_id: string;
  student_id: string;
  role: string;
  created_at: string;
  student?: Student;
};

export type IncidentWithStudents = Incident & {
  incident_students: IncidentStudent[];
};

export const INCIDENT_TYPES = [
  '수업·학습 방해',
  '신체적 행동',
  '언어적 행동',
  '규칙·질서 위반',
  '기타',
];

export const LOCATIONS = ['교실', '복도', '특별실', '화장실', '기타'];

export const ACTION_TYPES_ROW1 = ['없음', '단순지도', '개별지도', '심층상담'];
export const ACTION_TYPES_ROW2 = ['제1호-가목', '제1호-나목', '제2호-가목', '제2호-나목'];

export const ROLES = ['actor', 'victim', 'witness', 'other'];

export const ROLE_LABELS: Record<string, string> = {
  actor: '행동학생',
  victim: '피해학생',
  witness: '목격학생',
  other: '기타',
};

export const TIME_PERIODS_ROW1 = ['1교시', '2교시', '3교시', '4교시', '5교시', '6교시'];
export const TIME_PERIODS_ROW2 = ['아침시간', '점심시간', '하교시간'];

export const PERIODS_WITH_BREAK = ['1교시', '2교시', '3교시', '4교시', '5교시', '6교시'];

export function buildTimePeriod(period: string | null, isBreak: boolean): string | null {
  if (!period) return null;
  if (isBreak && PERIODS_WITH_BREAK.includes(period)) {
    return `${period} 후 쉬는시간`;
  }
  return period;
}

export function parseTimePeriod(timePeriod: string | null): { period: string | null; isBreak: boolean } {
  if (!timePeriod) return { period: null, isBreak: false };
  const breakMatch = timePeriod.match(/^(.+) 후 쉬는시간$/);
  if (breakMatch) {
    return { period: breakMatch[1], isBreak: true };
  }
  return { period: timePeriod, isBreak: false };
}

export function parseIncidentTypes(incidentType: string): string[] {
  if (!incidentType) return [];
  return incidentType.split(', ').map((t) => t.trim()).filter(Boolean);
}
