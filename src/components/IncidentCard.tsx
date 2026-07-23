import type { IncidentWithStudents } from '@/lib/supabase';
import { formatKST as formatDateTime } from '@/lib/datetime';
import { IncidentStudentsList, ActionTag } from './Tags';

export function IncidentCard({
  incident,
  onClick,
}: {
  incident: IncidentWithStudents;
  onClick: () => void;
}) {
  const students = incident.incident_students ?? [];
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="font-medium">{formatDateTime(incident.occurred_at)}</span>
        {incident.time_period && (
          <>
            <span>·</span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
              {incident.time_period}
            </span>
          </>
        )}
        <span>·</span>
        <span>{incident.location}</span>
        <span>·</span>
        <span>{incident.incident_type}</span>
        {incident.action_type && (
          <>
            <span>·</span>
            <ActionTag type={incident.action_type} />
          </>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-gray-800">
        {incident.description}
      </p>
      <div className="mt-3">
        <IncidentStudentsList students={students} />
      </div>
    </button>
  );
}

export { formatDateTime };
