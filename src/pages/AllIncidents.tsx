import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { IncidentWithStudents } from '../lib/types'
import { INCIDENT_TYPES, ROLE_LABELS } from '../lib/types'
import { fetchIncidentsWithStudents } from '../lib/incidents'
import { incidentMatchesQuery } from '../lib/highlight'
import { isToday, isWithinDays } from '../lib/format'
import IncidentCard from '../components/IncidentCard'

type PeriodFilter = 'all' | 'today' | '7days' | '30days'
type RoleFilter = 'all' | 'actor' | 'victim' | 'witness' | 'other'

export default function AllIncidents() {
  const [incidents, setIncidents] = useState<IncidentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchIncidentsWithStudents()
        if (!cancelled) setIncidents(data)
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel('all-incidents')
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
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (!incidentMatchesQuery(inc, query)) return false

      if (period === 'today' && !isToday(inc.created_at)) return false
      if (period === '7days' && !isWithinDays(inc.created_at, 7)) return false
      if (period === '30days' && !isWithinDays(inc.created_at, 30)) return false

      if (typeFilters.length > 0) {
        const incTypes = inc.incident_type
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
        const hasAny = typeFilters.some((tf) => incTypes.includes(tf))
        if (!hasAny) return false
      }

      if (roleFilter !== 'all') {
        const hasRole = inc.incident_students?.some(
          (is) => is.role === roleFilter,
        )
        if (!hasRole) return false
      }

      return true
    })
  }, [incidents, query, period, typeFilters, roleFilter])

  function toggleType(t: string) {
    if (typeFilters.includes(t)) {
      setTypeFilters(typeFilters.filter((x) => x !== t))
    } else {
      setTypeFilters([...typeFilters, t])
    }
  }

  function clearFilters() {
    setQuery('')
    setPeriod('all')
    setTypeFilters([])
    setRoleFilter('all')
  }

  const hasActiveFilter =
    query.trim() !== '' ||
    period !== 'all' ||
    typeFilters.length > 0 ||
    roleFilter !== 'all'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">전체 사건 조회</h1>
        <div className="text-sm text-slate-500">
          총 {filtered.length}건 / 전체 {incidents.length}건
        </div>
      </div>

      {/* 검색 */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="사건 내용, 생활지도 내용, 관련 학생 이름 검색"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {/* 기간 필터 */}
      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-500">기간</div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', '전체'],
              ['today', '오늘'],
              ['7days', '최근 7일'],
              ['30days', '최근 30일'],
            ] as [PeriodFilter, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                period === val
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 사건 유형 필터 */}
      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-500">
          사건 유형 (중복 선택 가능)
        </div>
        <div className="flex flex-wrap gap-2">
          {INCIDENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                typeFilters.includes(t)
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 역할 필터 */}
      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-500">역할</div>
        <div className="flex flex-wrap gap-2">
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
              </button>
            ),
          )}
        </div>
      </div>

      {hasActiveFilter && (
        <button
          onClick={clearFilters}
          className="text-sm text-slate-500 underline hover:text-slate-700"
        >
          필터 초기화
        </button>
      )}

      {/* 사건 목록 */}
      {loading ? (
        <div className="py-8 text-center text-slate-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
          {incidents.length === 0
            ? '기록된 사건이 없습니다.'
            : '해당하는 사건이 없습니다.'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((inc) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              query={query}
              returnTo="/incidents/all"
            />
          ))}
        </div>
      )}
    </div>
  )
}
