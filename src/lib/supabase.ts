import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Student = {
  id: string;
  name: string;
  grade: number;
  class_number: number;
  student_number: number;
  created_at: string;
};

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
  student?: Student;
};

export type IncidentWithStudents = Incident & {
  incident_students: IncidentStudent[];
};

export const ROLES = ['actor', 'victim', 'witness', 'other'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  actor: '행동학생',
  victim: '피해학생',
  witness: '목격학생',
  other: '기타',
};

export const ROLE_STYLES: Record<string, string> = {
  actor: 'bg-red-50 text-red-700 border-red-200',
  victim: 'bg-blue-50 text-blue-700 border-blue-200',
  witness: 'bg-green-50 text-green-700 border-green-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const LOCATIONS = [
  '교실',
  '복도',
  '운동장',
  '화장실',
  '식당',
  '기타',
] as const;

export const INCIDENT_TYPES = [
  '수업방해',
  '폭행',
  '욕설',
  '물품파손',
  '교우관계',
  '생활습관, 교우관계',
  '기타',
] as const;

export const ACTION_TYPES = [
  '단순지도',
  '개별상담',
  '제1호-가목',
  '제1호-나목',
  '제2호-가목',
  '제2호-나목',
  '제3호',
] as const;

export const TIME_PERIODS = [
  '아침시간',
  '1교시',
  '2교시',
  '3교시',
  '4교시',
  '점심시간',
  '5교시',
  '6교시',
  '하교시간',
] as const;

export const PERIODS_WITH_BREAK = ['아침시간', '1교시', '2교시', '3교시', '4교시', '5교시', '6교시'];

export const BREAKABLE_PERIODS = ['1교시', '2교시', '3교시', '4교시', '5교시', '6교시'];

export function buildTimePeriod(period: string | null, isBreak: boolean): string | null {
  if (!period) return null;
  if (isBreak && PERIODS_WITH_BREAK.includes(period)) {
    return `${period} 후 쉬는시간`;
  }
  return period;
}

export function parseTimePeriod(timePeriod: string | null): { period: string | null; isBreak: boolean } {
  if (!timePeriod) return { period: null, isBreak: false };
  const match = timePeriod.match(/^(.+) 후 쉬는시간$/);
  if (match) {
    return { period: match[1], isBreak: true };
  }
  return { period: timePeriod, isBreak: false };
}

export function formatStudentLabel(s: Student): string {
  return `${s.grade}학년 ${s.class_number}반 ${s.student_number}번 ${s.name}`;
}

export function kstLocalToISO(local: string): string {
  const d = new Date(local);
  return d.toISOString();
}

export function isoToKstLocal(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
