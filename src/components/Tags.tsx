import { ROLE_LABELS, ROLE_STYLES } from '@/lib/supabase';
import type { IncidentStudent } from '@/lib/supabase';

export { ROLE_STYLES };

export function StudentTag({ name, role }: { name: string; role: string }) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.other;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {name} · {ROLE_LABELS[role] ?? role}
    </span>
  );
}

export function ActionTag({ type }: { type: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: '#1e3a5f' }}
    >
      {type}
    </span>
  );
}

export function IncidentStudentsList({ students }: { students: IncidentStudent[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {students.map((is) => (
        <StudentTag key={is.id} name={is.student?.name ?? '?'} role={is.role} />
      ))}
    </div>
  );
}
