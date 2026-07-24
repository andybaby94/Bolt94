import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  supabase,
  type IncidentWithStudents,
  INCIDENT_TYPES,
  ROLES,
  ROLE_LABELS,
} from '@/lib/supabase';
import { isTodayKST } from '@/lib/datetime';
import { PageHeader } from '@/components/PageHeader';
import { IncidentCard } from '@/components/IncidentCard';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function isWithinDaysKST(iso: string, days: number): boolean {
  const kst = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const startOfToday = Date.UTC(
    nowKst.getUTCFullYear(),
    nowKst.getUTCMonth(),
    nowKst.getUTCDate(),
  );
  const incidentDay = Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate(),
  );
  return startOfToday - incidentDay < days * 24 * 60 * 60 * 1000;
}

type PeriodFilter = 'all' | 'today' | '7d' | '30d';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'today', label: '오늘' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
];

export function IncidentList() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .order('occurred_at', { ascending: false });
      setIncidents((data ?? []) as IncidentWithStudents[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = incidents;
    const kw = query.trim().toLowerCase();
    if (kw) {
      result = result.filter(
        (i) =>
          i.description.toLowerCase().includes(kw) ||
          (i.action_note ?? '').toLowerCase().includes(kw) ||
          (i.location ?? '').toLowerCase().includes(kw) ||
          (i.incident_students ?? []).some((is) =>
            (is.student?.name ?? '').toLowerCase().includes(kw),
          ),
      );
    }
    if (typeFilter) {
      result = result.filter((i) => i.incident_type.includes(typeFilter));
    }
    if (periodFilter !== 'all') {
      result = result.filter((i) => {
        if (periodFilter === 'today') return isTodayKST(i.occurred_at);
        if (periodFilter === '7d') return isWithinDaysKST(i.occurred_at, 7);
        return isWithinDaysKST(i.occurred_at, 30);
      });
    }
    if (roleFilter) {
      result = result.filter((i) =>
        (i.incident_students ?? []).some((is) => is.role === roleFilter),
      );
    }
    return result;
  }, [incidents, query, typeFilter, periodFilter, roleFilter]);

  const isFiltered =
    query.trim() !== '' ||
    typeFilter !== '' ||
    periodFilter !== 'all' ||
    roleFilter !== '';

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <PageHeader title="전체 사건 조회" />

      <p className="mb-3 text-xs text-gray-500">
        전체 {incidents.length}개
        {isFiltered ? ` · 검색 결과 ${filtered.length}개` : ''}
      </p>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사건 내용, 장소, 학생 이름 검색"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
        />
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriodFilter(periodFilter === p.value ? 'all' : p.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              periodFilter === p.value
                ? 'border-navy-600 bg-navy-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        <button
          onClick={() => setTypeFilter('')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            typeFilter === ''
              ? 'border-navy-600 bg-navy-600 text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          전체
        </button>
        {INCIDENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              typeFilter === t
                ? 'border-navy-600 bg-navy-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setRoleFilter('')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            roleFilter === ''
              ? 'border-navy-600 bg-navy-600 text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          전체
        </button>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              roleFilter === r
                ? 'border-navy-600 bg-navy-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">기록된 사건이 없습니다.</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((inc) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              highlightKeyword={query.trim()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
