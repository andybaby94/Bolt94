import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { IncidentStudentsList } from '@/components/Tags';
import {
  supabase,
  formatDateTime,
  INCIDENT_TYPES,
  type IncidentWithStudents,
} from '@/lib/supabase';

type DateFilter = 'all' | 'today' | '7days' | '30days';

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function AllIncidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .order('occurred_at', { ascending: false });
      setIncidents((data as unknown as IncidentWithStudents[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return incidents.filter((inc) => {
      if (typeFilter !== 'all' && inc.incident_type !== typeFilter) return false;

      const occurred = new Date(inc.occurred_at);
      if (dateFilter === 'today' && occurred < todayStart) return false;
      if (dateFilter === '7days' && occurred < sevenDaysAgo) return false;
      if (dateFilter === '30days' && occurred < thirtyDaysAgo) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const inDesc = inc.description.toLowerCase().includes(q);
        const inAction = (inc.action_note ?? '').toLowerCase().includes(q);
        const inActionType = (inc.action_type ?? '').toLowerCase().includes(q);
        if (!inDesc && !inAction && !inActionType) return false;
      }
      return true;
    });
  }, [incidents, search, typeFilter, dateFilter]);

  const dateFilters: { value: DateFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'today', label: '오늘' },
    { value: '7days', label: '최근 7일' },
    { value: '30days', label: '최근 30일' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="전체 사건 조회" subtitle="기록된 모든 사건을 검색하고 필터링할 수 있습니다." />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="사건 내용, 생활지도 내용 검색"
            className="flex-1 text-sm outline-none"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {dateFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setDateFilter(f.value)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  dateFilter === f.value
                    ? 'border-navy-600 bg-navy-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                typeFilter === 'all'
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              전체 유형
            </button>
            {INCIDENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  typeFilter === t
                    ? 'border-navy-600 bg-navy-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-3 text-xs text-gray-400">{filtered.length}개의 사건</p>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            {search || typeFilter !== 'all' || dateFilter !== 'all'
              ? '검색/필터 조건에 맞는 사건이 없습니다.'
              : '기록된 사건이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inc) => (
              <button
                key={inc.id}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                className="block w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-navy-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      <Highlight text={inc.description} query={search} />
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateTime(inc.occurred_at)} · {inc.location} · {inc.time_period ?? ''}
                    </p>
                    {inc.action_note && (
                      <p className="mt-1 text-xs text-gray-500">
                        생활지도: <Highlight text={inc.action_note} query={search} />
                      </p>
                    )}
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
  );
}
