import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import {
  supabase,
  INCIDENT_TYPES,
  type IncidentWithStudents,
} from '@/lib/supabase';
import { isTodayKST } from '@/lib/datetime';
import { IncidentCard } from '@/components/IncidentCard';
import { PageHeader } from '@/components/PageHeader';

const PERIOD_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'today', label: '오늘' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
];

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'actor', label: '행동학생' },
  { value: 'victim', label: '피해학생' },
  { value: 'witness', label: '목격학생' },
  { value: 'other', label: '기타' },
];

function isWithinDays(iso: string, days: number): boolean {
  const now = Date.now();
  const t = new Date(iso).getTime();
  return now - t <= days * 24 * 60 * 60 * 1000;
}

export function AllIncidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentWithStudents[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .order('occurred_at', { ascending: false });
      setIncidents((data ?? []) as IncidentWithStudents[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (periodFilter !== 'all') {
        if (periodFilter === 'today') {
          if (!isTodayKST(inc.occurred_at)) return false;
        } else if (periodFilter === '7d') {
          if (!isWithinDays(inc.occurred_at, 7)) return false;
        } else if (periodFilter === '30d') {
          if (!isWithinDays(inc.occurred_at, 30)) return false;
        }
      }

      if (typeFilter !== 'all') {
        const types = inc.incident_type
          .split(', ')
          .map((t) => t.trim())
          .filter(Boolean);
        if (!types.includes(typeFilter)) return false;
      }

      if (roleFilter !== 'all') {
        const hasRole = (inc.incident_students ?? []).some(
          (is) => is.role === roleFilter
        );
        if (!hasRole) return false;
      }

      if (searchKeyword.trim().length > 0) {
        const kw = searchKeyword.trim().toLowerCase();
        const desc = (inc.description ?? '').toLowerCase();
        const note = (inc.action_note ?? '').toLowerCase();
        const studentNames = (inc.incident_students ?? [])
          .map((is) => is.student?.name ?? '')
          .join(' ')
          .toLowerCase();
        if (
          !desc.includes(kw) &&
          !note.includes(kw) &&
          !studentNames.includes(kw)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, periodFilter, typeFilter, roleFilter, searchKeyword]);

  const hasActiveFilter =
    periodFilter !== 'all' ||
    typeFilter !== 'all' ||
    roleFilter !== 'all' ||
    searchKeyword.trim().length > 0;

  function resetFilters() {
    setPeriodFilter('all');
    setTypeFilter('all');
    setRoleFilter('all');
    setSearchKeyword('');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <PageHeader title="전체 사건 조회" />

      {/* 검색 */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="사건 내용 / 생활지도 내용 / 학생 이름 검색"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
        />
        {searchKeyword && (
          <button
            onClick={() => setSearchKeyword('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 필터 영역 */}
      <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
        {/* 기간 필터 */}
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-gray-500">기간</p>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_FILTERS.map((f) => {
              const active = periodFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setPeriodFilter(f.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 사건 유형 필터 */}
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-gray-500">사건 유형</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                typeFilter === 'all'
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              전체
            </button>
            {INCIDENT_TYPES.map((t) => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(active ? 'all' : t)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* 역할 필터 */}
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-gray-500">역할</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_FILTERS.map((f) => {
              const active = roleFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setRoleFilter(f.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 필터 초기화 */}
        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <X size={12} />
            필터 초기화
          </button>
        )}
      </div>

      {/* 결과 헤더 */}
      <p className="mb-2 text-sm font-semibold text-gray-700">
        전체 사건
        <span className="ml-1.5 text-gray-400">
          ({filtered.length}
          {hasActiveFilter && ` / ${incidents.length}`})
        </span>
      </p>

      {/* 사건 목록 */}
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          {hasActiveFilter ? '조건에 맞는 사건이 없습니다.' : '기록된 사건이 없습니다.'}
        </p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((inc) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              highlightKeyword={searchKeyword}
            />
          ))}
        </div>
      )}
    </div>
  );
}
