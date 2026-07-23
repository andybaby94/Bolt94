import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, FileText, ChevronRight } from 'lucide-react';
import { supabase, formatDateTime, type IncidentWithStudents } from '@/lib/supabase';
import { IncidentStudentsList } from '@/components/Tags';

export function Home() {
  const navigate = useNavigate();
  const [todayIncidents, setTodayIncidents] = useState<IncidentWithStudents[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [recent7Count, setRecent7Count] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: todayData }, { count: total }, { count: recent7 }] = await Promise.all([
        supabase
          .from('incidents')
          .select('*, incident_students(*, student:students(*))')
          .gte('occurred_at', todayStart)
          .order('occurred_at', { ascending: false }),
        supabase.from('incidents').select('*', { count: 'exact', head: true }),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).gte('occurred_at', sevenDaysAgo),
      ]);

      setTodayIncidents((todayData as unknown as IncidentWithStudents[]) ?? []);
      setTotalCount(total ?? 0);
      setRecent7Count(recent7 ?? 0);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-navy-700">학생생활지도시스템</h1>
          <button
            onClick={() => navigate('/incidents/new')}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <Plus size={16} />
            사건 기록
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => navigate('/students')}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-navy-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50">
              <Users size={24} className="text-navy-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-navy-700">학생 조회</p>
              <p className="text-xs text-gray-500">학생별 생활지도 기록을 확인할 수 있습니다.</p>
            </div>
            <ChevronRight size={20} className="text-gray-300 transition group-hover:text-navy-400" />
          </button>

          <button
            onClick={() => navigate('/incidents')}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-navy-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50">
              <FileText size={24} className="text-navy-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-navy-700">전체 사건 조회</p>
              <p className="text-xs text-gray-500">기록된 모든 사건을 확인하고 검색 및 필터링할 수 있습니다.</p>
              {!loading && (
                <p className="mt-1 text-xs text-gray-400">
                  최근 7일간 {recent7Count}개 · 전체 {totalCount}개
                </p>
              )}
            </div>
            <ChevronRight size={20} className="text-gray-300 transition group-hover:text-navy-400" />
          </button>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-base font-bold text-navy-700">오늘 기록한 사건</h2>
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
              불러오는 중...
            </div>
          ) : todayIncidents.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
              오늘 기록된 사건이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {todayIncidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="block w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-navy-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{inc.description}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDateTime(inc.occurred_at)} · {inc.location} · {inc.time_period ?? ''}
                      </p>
                    </div>
                    <span className="ml-2 rounded-md bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-600">
                      {inc.incident_type}
                    </span>
                  </div>
                  {inc.incident_students && inc.incident_students.length > 0 && (
                    <div className="mt-2">
                      <IncidentStudentsList students={inc.incident_students} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
