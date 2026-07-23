import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { IncidentWithStudents } from '../lib/types'
import { fetchIncidentsWithStudents } from '../lib/incidents'
import { isToday } from '../lib/format'
import IncidentCard from '../components/IncidentCard'

export default function Home() {
  const [todayIncidents, setTodayIncidents] = useState<IncidentWithStudents[]>(
    [],
  )
  const [total, setTotal] = useState(0)
  const [recent7, setRecent7] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const all = await fetchIncidentsWithStudents()
        if (cancelled) return
        setTodayIncidents(all.filter((i) => isToday(i.created_at)))

        const now = Date.now()
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
        setTotal(all.length)
        setRecent7(
          all.filter((i) => new Date(i.created_at).getTime() >= sevenDaysAgo)
            .length,
        )
      } catch (e) {
        console.error('Failed to load incidents', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel('incidents-home')
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">학생생활지도기록부</h1>
        <p className="mt-1 text-sm text-primary-50">
          학생 생활지도 사건을 기록하고 관리합니다.
        </p>
      </div>

      {/* 오늘 기록한 사건 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            오늘 기록한 사건
          </h2>
          <Link
            to="/incidents/new"
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            + 사건 기록
          </Link>
        </div>
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            불러오는 중...
          </div>
        ) : todayIncidents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
            오늘 기록한 사건이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {todayIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </section>

      {/* 메뉴 */}
      <section className="grid gap-3 sm:grid-cols-2">
        {/* 학생 조회 */}
        <Link
          to="/students"
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl">
            👥
          </div>
          <div>
            <div className="font-bold text-slate-800 group-hover:text-primary-700">
              학생 조회
            </div>
            <div className="text-sm text-slate-500">
              학생별 생활지도 기록을 확인할 수 있습니다.
            </div>
          </div>
        </Link>

        {/* 전체 사건 조회 */}
        <Link
          to="/incidents/all"
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl">
            📋
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-800 group-hover:text-primary-700">
              전체 사건 조회
            </div>
            <div className="text-sm text-slate-500">
              기록된 모든 사건을 확인하고 검색할 수 있습니다.
            </div>
            <div className="mt-1 text-xs font-medium text-slate-400">
              최근 7일간 {recent7}개 · 전체 {total}개
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
