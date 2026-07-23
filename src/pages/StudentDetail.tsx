import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import {
  supabase,
  type Student,
  type IncidentWithStudents,
} from '@/lib/supabase';
import { IncidentCard } from '@/components/IncidentCard';
import { PageHeader } from '@/components/PageHeader';

type Stats = {
  total: number;
  actor: number;
  victim: number;
  witness: number;
  other: number;
  actions: Record<string, number>;
};

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'actor', label: '행동학생' },
  { value: 'victim', label: '피해학생' },
  { value: 'witness', label: '목격학생' },
];

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'none', label: '없음' },
  { value: '단순지도', label: '단순지도' },
  { value: '개별상담', label: '개별상담' },
  { value: '제1호-가목', label: '제1호-가목' },
  { value: '제1호-나목', label: '제1호-나목' },
  { value: '제2호-가목', label: '제2호-가목' },
  { value: '제2호-나목', label: '제2호-나목' },
];

const LEGACY_ACTION_MAP: Record<string, string> = {
  '1호': '제1호-가목',
  '2호': '제2호-가목',
  '3호': '제2호-나목',
};

function normalizeActionType(raw: string | null): string {
  if (raw === null || raw === '없음') return 'none';
  if (LEGACY_ACTION_MAP[raw]) return LEGACY_ACTION_MAP[raw];
  return raw;
}

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [incidents, setIncidents] = useState<IncidentWithStudents[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: s } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setStudent(s as Student | null);

      const { data: iStu } = await supabase
        .from('incident_students')
        .select('incident_id, role')
        .eq('student_id', id);

      const links = iStu ?? [];
      const incIds = links.map((l: { incident_id: string }) => l.incident_id);

      let incs: IncidentWithStudents[] = [];
      if (incIds.length > 0) {
        const { data: incData } = await supabase
          .from('incidents')
          .select('*, incident_students(*, student:students(*))')
          .in('id', incIds)
          .order('occurred_at', { ascending: false });
        incs = (incData ?? []) as IncidentWithStudents[];
      }
      setIncidents(incs);

      const s2: Stats = {
        total: links.length,
        actor: links.filter((l: { role: string }) => l.role === 'actor').length,
        victim: links.filter((l: { role: string }) => l.role === 'victim').length,
        witness: links.filter((l: { role: string }) => l.role === 'witness').length,
        other: links.filter((l: { role: string }) => l.role === 'other').length,
        actions: {},
      };
      for (const inc of incs) {
        if (inc.action_type) {
          s2.actions[inc.action_type] = (s2.actions[inc.action_type] ?? 0) + 1;
        }
      }
      setStats(s2);
      setLoading(false);
    })();
  }, [id]);

  const roleMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const inc of incidents) {
      for (const is of inc.incident_students ?? []) {
        if (is.student_id === id) {
          m.set(inc.id, is.role);
        }
      }
    }
    return m;
  }, [incidents, id]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (roleFilter !== 'all') {
        const role = roleMap.get(inc.id);
        if (role !== roleFilter) return false;
      }

      if (actionFilter !== 'all') {
        const normalized = normalizeActionType(inc.action_type);
        if (normalized !== actionFilter) return false;
      }

      if (searchKeyword.trim().length > 0) {
        const kw = searchKeyword.trim().toLowerCase();
        const desc = (inc.description ?? '').toLowerCase();
        const note = (inc.action_note ?? '').toLowerCase();
        if (!desc.includes(kw) && !note.includes(kw)) return false;
      }

      return true;
    });
  }, [incidents, roleFilter, actionFilter, searchKeyword, roleMap]);

  const hasActiveFilter = roleFilter !== 'all' || actionFilter !== 'all' || searchKeyword.trim().length > 0;

  function resetFilters() {
    setRoleFilter('all');
    setActionFilter('all');
    setSearchKeyword('');
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center text-sm text-gray-400">
        불러오는 중...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center text-sm text-gray-400">
        학생을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <PageHeader title="학생 상세" />

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
          <span className="text-sm text-gray-500">
            {student.grade}학년 {student.class_number}반 {student.student_number}번
          </span>
        </div>
      </div>

      {stats && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="전체 사건" value={stats.total} />
          <StatCard label="행동학생" value={stats.actor} color="text-red-600" />
          <StatCard label="피해학생" value={stats.victim} color="text-blue-600" />
          <StatCard label="목격학생" value={stats.witness} color="text-green-600" />
        </div>
      )}

      {stats && Object.keys(stats.actions).length > 0 && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium text-gray-500">조치 누적</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.actions).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: '#1e3a5f' }}
              >
                {type} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 관련 사건 기록 + 필터 */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          관련 사건 기록
          <span className="ml-1.5 text-gray-400">
            ({filteredIncidents.length}
            {hasActiveFilter && ` / ${incidents.length}`})
          </span>
        </h3>

        {/* 필터 영역 */}
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
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

          {/* 조치 유형 필터 */}
          <div className="mb-2">
            <p className="mb-1 text-xs font-medium text-gray-500">조치 유형</p>
            <div className="flex flex-wrap gap-1.5">
              {ACTION_FILTERS.map((f) => {
              const active = actionFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setActionFilter(f.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                  style={active ? { backgroundColor: '#1e3a5f' } : {}}
                >
                  {f.label}
                </button>
              );
              })}
            </div>
          </div>

          {/* 키워드 검색 */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="사건 내용 / 생활지도 내용 검색"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-navy-400"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 필터 초기화 */}
          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <X size={12} />
              필터 초기화
            </button>
          )}
        </div>

        {/* 필터링된 사건 목록 */}
        {filteredIncidents.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {hasActiveFilter ? '조건에 맞는 사건이 없습니다.' : '관련 사건 기록이 없습니다.'}
          </p>
        ) : (
          <div className="space-y-2.5">
            {filteredIncidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                highlightKeyword={searchKeyword}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
      <p className={`text-2xl font-bold ${color ?? 'text-gray-800'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}
