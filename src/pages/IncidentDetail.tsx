import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { IncidentWithStudents } from '../lib/types'
import {
  ROLE_LABELS,
  ROLE_COLORS,
  TIME_PERIODS,
  LOCATIONS,
  INCIDENT_TYPES,
  ACTION_TYPES,
} from '../lib/types'
import { fetchIncidentById, deleteIncident } from '../lib/incidents'
import { formatDateTime } from '../lib/format'

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const navigate = useNavigate()

  const [incident, setIncident] = useState<IncidentWithStudents | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // edit form state
  const [occurredAt, setOccurredAt] = useState('')
  const [timePeriod, setTimePeriod] = useState('')
  const [location, setLocation] = useState('교실')
  const [incidentTypes, setIncidentTypes] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [actionType, setActionType] = useState('')
  const [actionNote, setActionNote] = useState('')
  const [studentRoles, setStudentRoles] = useState<
    Record<string, string>
  >({})

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      if (!id) return
      setLoading(true)
      const inc = await fetchIncidentById(id)
      if (cancelled) return
      setIncident(inc)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`incident-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_students' },
        () => load(),
      )
      .subscribe()

    return () => {
      cancelled = true
      if (id) supabase.removeChannel(channel)
    }
  }, [id])

  function startEdit() {
    if (!incident) return
    const d = new Date(incident.occurred_at)
    const off = d.getTimezoneOffset() * 60000
    setOccurredAt(new Date(d.getTime() - off).toISOString().slice(0, 16))
    setTimePeriod(incident.time_period || '')
    setLocation(incident.location || '교실')
    setIncidentTypes(
      incident.incident_type
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    )
    setDescription(incident.description || '')
    setActionType(incident.action_type || '')
    setActionNote(incident.action_note || '')
    const roles: Record<string, string> = {}
    for (const is of incident.incident_students || []) {
      roles[is.id] = is.role
    }
    setStudentRoles(roles)
    setEditing(true)
  }

  function toggleType(t: string) {
    if (incidentTypes.includes(t)) {
      setIncidentTypes(incidentTypes.filter((x) => x !== t))
    } else {
      setIncidentTypes([...incidentTypes, t])
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!incident || !id) return
    setSaving(true)
    setError('')
    try {
      const occurredDate = new Date(occurredAt).toISOString()
      const { error: incError } = await supabase
        .from('incidents')
        .update({
          occurred_at: occurredDate,
          location,
          incident_type: incidentTypes.join(', ') || '기타',
          description: description.trim(),
          action_type: actionType || null,
          action_note: actionNote.trim() || null,
          time_period: timePeriod || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (incError) throw incError

      for (const is of incident.incident_students || []) {
        const newRole = studentRoles[is.id]
        if (newRole && newRole !== is.role) {
          await supabase
            .from('incident_students')
            .update({ role: newRole })
            .eq('id', is.id)
        }
      }

      setEditing(false)
      const updated = await fetchIncidentById(id)
      setIncident(updated)
    } catch (err) {
      console.error(err)
      setError('수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!incident || !id) return
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await deleteIncident(id)
      if (returnTo) {
        navigate(returnTo)
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error(err)
      setError('삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-slate-400">불러오는 중...</div>
  }

  if (!incident) {
    return <div className="py-8 text-center text-slate-400">사건을 찾을 수 없습니다.</div>
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-xl font-bold text-slate-800">사건 수정</h1>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              작성 일시
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              발생 시간대
            </label>
            <div className="flex flex-wrap gap-2">
              {TIME_PERIODS.map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setTimePeriod(timePeriod === tp ? '' : tp)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    timePeriod === tp
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              장소
            </label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    location === loc
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              사건 유형 (중복 선택 가능)
            </label>
            <div className="flex flex-wrap gap-2">
              {INCIDENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    incidentTypes.includes(t)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {incident.incident_students && incident.incident_students.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                관련 학생 역할
              </label>
              <div className="space-y-2">
                {incident.incident_students.map((is) => (
                  <div
                    key={is.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2"
                  >
                    <Link
                      to={`/students/${is.student_id}`}
                      className="font-medium text-slate-800 hover:text-primary-600"
                    >
                      {is.student?.name}
                    </Link>
                    <select
                      value={studentRoles[is.id] || is.role}
                      onChange={(e) =>
                        setStudentRoles({
                          ...studentRoles,
                          [is.id]: e.target.value,
                        })
                      }
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              사건 내용
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              조치 유형
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTION_TYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setActionType(actionType === a ? '' : a)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    actionType === a
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              생활지도 내용
            </label>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '수정 완료'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-600 transition hover:bg-slate-50"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">사건 상세</h1>
        <div className="no-print flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            🖨️ 인쇄
          </button>
          <button
            onClick={startEdit}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-slate-400">작성 일시</span>
            <span className="font-medium text-slate-800">
              {formatDateTime(incident.created_at)}
            </span>
          </div>
          {incident.time_period && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-slate-400">발생 시간대</span>
              <span className="font-medium text-slate-800">
                {incident.time_period}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-slate-400">장소</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {incident.location}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-slate-400">사건 유형</span>
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

          {incident.incident_students && incident.incident_students.length > 0 && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-slate-400">관련 학생</span>
              <div className="flex flex-wrap gap-2">
                {incident.incident_students.map((is) => (
                  <Link
                    key={is.id}
                    to={`/students/${is.student_id}`}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                      ROLE_COLORS[is.role] || ROLE_COLORS.other
                    } hover:opacity-80`}
                  >
                    {ROLE_LABELS[is.role] || is.role} {is.student?.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <span className="w-24 shrink-0 text-slate-400">사건 내용</span>
            <p className="whitespace-pre-wrap text-slate-800">
              {incident.description}
            </p>
          </div>

          {incident.action_type && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-slate-400">조치 유형</span>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {incident.action_type}
              </span>
            </div>
          )}

          {incident.action_note && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-slate-400">생활지도</span>
              <p className="whitespace-pre-wrap text-slate-800">
                {incident.action_note}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 인쇄용 보호자 통지서 */}
      <div className="print-only rounded-lg border border-slate-300 p-6">
        <h2 className="text-center text-lg font-bold">생활지도 기록 안내</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div>일시: {formatDateTime(incident.created_at)}</div>
          <div>시간대: {incident.time_period || '-'}</div>
          <div>장소: {incident.location}</div>
          <div>유형: {incident.incident_type}</div>
          <div>
            관련 학생:{' '}
            {incident.incident_students
              ?.map((is) => `${ROLE_LABELS[is.role]} ${is.student?.name}`)
              .join(', ')}
          </div>
          <div>내용: {incident.description}</div>
          {incident.action_note && <div>지도: {incident.action_note}</div>}
        </div>
      </div>

      <div className="no-print flex gap-2">
        {returnTo ? (
          <Link
            to={returnTo}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← 돌아가기
          </Link>
        ) : null}
        <Link
          to="/"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
