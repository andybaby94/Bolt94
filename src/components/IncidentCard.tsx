import { Link } from 'react-router-dom'
import type { IncidentWithStudents } from '../lib/types'
import { ROLE_LABELS, ROLE_DOT_COLORS } from '../lib/types'
import { formatDateTime } from '../lib/format'
import { highlightText } from '../lib/highlight'

export default function IncidentCard({
  incident,
  query = '',
  returnTo,
}: {
  incident: IncidentWithStudents
  query?: string
  returnTo?: string
}) {
  const to = returnTo
    ? `/incidents/${incident.id}?returnTo=${encodeURIComponent(returnTo)}`
    : `/incidents/${incident.id}`

  return (
    <Link
      to={to}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-slate-500">
          작성 {formatDateTime(incident.created_at)}
        </div>
        <div className="flex flex-wrap gap-1">
          {incident.incident_type
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => (
              <span
                key={t}
                className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
              >
                {t}
              </span>
            ))}
        </div>
      </div>

      {incident.time_period && (
        <div className="mt-1 text-xs text-slate-500">
          발생 시간대: {incident.time_period}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
          {incident.location}
        </span>
      </div>

      <p
        className="mt-2 line-clamp-3 text-sm text-slate-800"
        dangerouslySetInnerHTML={{
          __html: highlightText(
            incident.description || '',
            query,
          ),
        }}
      />

      {incident.action_type && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="font-medium text-slate-500">조치:</span>
          <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            {incident.action_type}
          </span>
          {incident.action_note && (
            <span
              className="text-slate-600"
              dangerouslySetInnerHTML={{
                __html: highlightText(incident.action_note, query),
              }}
            />
          )}
        </div>
      )}

      {incident.incident_students?.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <div className="flex flex-wrap gap-2">
            {incident.incident_students.map((is) => (
              <span
                key={is.id}
                className="inline-flex items-center gap-1 text-xs"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    ROLE_DOT_COLORS[is.role] || ROLE_DOT_COLORS.other
                  }`}
                />
                <span className="text-slate-500">
                  {ROLE_LABELS[is.role] || is.role}
                </span>
                <span
                  className="font-medium text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(is.student?.name || '', query),
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  )
}
