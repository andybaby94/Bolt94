import { ROLE_LABELS } from '@/lib/supabase';
import type { IncidentStudent } from '@/lib/supabase';

const ROLE_STYLES: Record<string, string> = {
  actor: 'bg-red-50 text-red-700 border-red-200',
  victim: 'bg-blue-50 text-blue-700 border-blue-200',
  witness: 'bg-green-50 text-green-700 border-green-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function StudentTag({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
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
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: '#1e3a5f' }}>
      {type}
    </span>
  );
}

export function IncidentStudentsList({
  students,
}: {
  students: IncidentStudent[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {students.map((is) => (
        <StudentTag
          key={is.id}
          name={is.student?.name ?? '?'}
          role={is.role}
        />
      ))}
    </div>
  );
}
