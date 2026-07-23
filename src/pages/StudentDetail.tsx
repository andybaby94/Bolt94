import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Student, IncidentWithStudents } from '../lib/types'
import { ROLE_LABELS } from '../lib/types'
import { fetchIncidentsByStudentId } from '../lib/incidents'
import { incidentMatchesQuery } from '../lib/highlight'
import { formatDateTime } from '../lib/format'
import IncidentCard from '../components/IncidentCard'

type RoleFilter = 'all' | 'actor' | 'victim' | 'witness' | 'other'

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const [student, setStudent] = useState<Student | null>(null)
  const [incidents, setIncidents] = useState<IncidentWithStudents[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      if (!id) return
      const { data: stu } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()
      if (!cancelled) setStudent(stu as Student)
      const incs = await fetchIncidentsByStudentId(id)
      if (!cancelled) setIncidents(incs)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel(`student-${id}`)
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

  const filtered = incidents.filter((inc) => {
    if (!incidentMatchesQuery(inc, query)) return false
    if (roleFilter !== 'all') {
      const hasRole = inc.incident_students?.some(
        (is) =>
          is.student_id === id && is.role === roleFilter,
      )
      if (!hasRole) return false
    }
    return true
  })

  const roleCounts: Record<string, number> = { actor: 0, victim: 0, witness: 0, other: 0 }
  for (const inc of incidents) {
    for (const is of inc.incident_students || []) {
      if (is.student_id === id) roleCounts[is.role] = (roleCounts[is.role] || 0) + 1
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-slate-400">불러오는 중...</div>
  }

  if (!student) {
    return <div className="py-8 text-center text-slate-400">학생을 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-5">
      {/* 학생 정보 */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-xl font-bold text-primary-600">
          {student.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{student.name}</h1>
          <div className="text-sm text-slate-500">
            {student.grade}학년 {student.class_number}반 {student.student_number}번
          </div>
        </div>
      </div>

      {/* 보호자 통지서 / 인쇄 */}
      <div className="no-print flex gap-2">
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          🖨️ 인쇄
        </button>
      </div>

      {/* 인쇄용 보호자 통지서 */}
      <div className="print-only rounded-lg border border-slate-300 p-6">
        <h2 className="text-center text-lg font-bold">생활지도 기록 안내</h2>
        <p className="mt-2 text-sm">
          학생: {student.name} ({student.grade}학년 {student.class_number}반 {student.student_number}번)
        </p>
        <div className="mt-4 space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="border-b border-slate-200 pb-2 text-sm">
              <div>일시: {formatDateTime(inc.created_at)}</div>
              <div>유형: {inc.incident_type}</div>
              <div>내용: {inc.description}</div>
              {inc.action_note && <div>지도: {inc.action_note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 검색 */}
      <div className="no-print">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사건 내용, 생활지도 내용, 학생 이름 검색"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* 역할 필터 */}
      <div className="no-print flex flex-wrap gap-2">
        {(['all', 'actor', 'victim', 'witness', 'other'] as RoleFilter[]).map(
          (r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                roleFilter === r
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r === 'all' ? '전체' : ROLE_LABELS[r]}
              {r !== 'all' && roleCounts[r] > 0 && (
                <span className="ml-1 text-xs text-slate-400">
                  ({roleCounts[r]})
                </span>
              )}
            </button>
          ),
        )}
      </div>

      {/* 사건 목록 */}
      <div className="no-print">
        <div className="mb-2 text-sm text-slate-500">
          총 {filtered.length}건
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
            해당하는 사건이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                query={query}
                returnTo={`/students/${id}`}
              />
            ))}
          </div>
        )}
      </div>

      <Link
        to="/"
        className="no-print inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        홈으로
      </Link>
    </div>
  )
}
