import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users, AlertCircle, TrendingDown, Activity,
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalIncidents: 0,
    recentIncidents: 0,
  })
  const [recentIncidents, setRecentIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [{ count: totalStudents }, { count: activeStudents }, { count: totalIncidents }] =
        await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('incidents').select('*', { count: 'exact', head: true }),
        ])

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { count: recentIncidents } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', sevenDaysAgo.toISOString())

      const { data: recent } = await supabase
        .from('incidents')
        .select(`
          *,
          incident_students (
            id, role,
            student:students (*)
          )
        `)
        .order('occurred_at', { ascending: false })
        .limit(5)

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalIncidents: totalIncidents || 0,
        recentIncidents: recentIncidents || 0,
      })
      setRecentIncidents((recent || []) as any[])
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const cards = [
    {
      label: '전체 학생',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-primary-50 text-primary-600',
    },
    {
      label: '활성 학생',
      value: stats.activeStudents,
      icon: Activity,
      color: 'bg-success-50 text-success-600',
    },
    {
      label: '전체 사건기록',
      value: stats.totalIncidents,
      icon: AlertCircle,
      color: 'bg-warning-50 text-warning-600',
    },
    {
      label: '최근 7일 사건',
      value: stats.recentIncidents,
      icon: TrendingDown,
      color: 'bg-error-50 text-error-600',
    },
  ]

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">대시보드</h2>
      <p className="text-sm text-gray-500 mb-6">학생안전관리 현황을 한눈에 확인하세요.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">최근 사건기록</h3>
        {recentIncidents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            최근 사건기록이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {recentIncidents.map((inc: any) => (
              <div
                key={inc.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-50 text-primary-700 rounded">
                    {inc.incident_type}
                  </span>
                  {inc.action_type && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-accent-50 text-accent-700 rounded">
                      {inc.action_type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800 line-clamp-2">{inc.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(inc.occurred_at).toLocaleDateString('ko-KR')} · {inc.location}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
