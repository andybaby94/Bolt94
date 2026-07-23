import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ActionTag } from '@/components/Tags';
import {
  supabase,
  formatDateTime,
  ROLE_LABELS,
  ROLE_STYLES,
  type Student,
  type IncidentWithStudents,
} from '@/lib/supabase';

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'actor', label: '행동학생' },
  { value: 'victim', label: '피해학생' },
  { value: 'witness', label: '목격학생' },
  { value: 'other', label: '기타' },
];

type StudentIncident = IncidentWithStudents & {
  incident_students: { id: string; role: string; student: Student }[];
};

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [incidents, setIncidents] = useState<StudentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: s } = await supabase.from('students').select('*').eq('id', id).single();
      setStudent(s as Student);

      const { data: incData } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .in(
          'id',
          (
            await supabase.from('incident_students').select('incident_id').eq('student_id', id)
          ).data?.map((r) => r.incident_id) ?? [],
        )
        .order('occurred_at', { ascending: false });

      setIncidents((incData as unknown as StudentIncident[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  const roleStats = useMemo(() => {
    const stats: Record<string, number> = { actor: 0, victim: 0, witness: 0, other: 0 };
    for (const inc of incidents) {
      for (const is of inc.incident_students) {
        if (is.student?.id === id && stats[is.role] !== undefined) {
          stats[is.role]++;
        }
      }
    }
    return stats;
  }, [incidents, id]);

  const actionCount = useMemo(() => {
    const set = new Set<string>();
    for (const inc of incidents) {
      if (inc.action_type) {
        for (const is of inc.incident_students) {
          if (is.student?.id === id) {
            set.add(inc.id);
            break;
          }
        }
      }
    }
    return set.size;
  }, [incidents, id]);

  const filteredIncidents = useMemo(() => {
    if (roleFilter === 'all') return incidents;
    return incidents.filter((inc) =>
      inc.incident_students.some((is) => is.student?.id === id && is.role === roleFilter),
    );
  }, [incidents, roleFilter, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="학생 상세" />
        <div className="p-8 text-center text-sm text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="학생 상세" />
        <div className="p-8 text-center text-sm text-gray-400">학생을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title={student.name} subtitle={`${student.grade}학년 ${student.class_number}반 ${student.student_number}번`}>
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-navy-300 hover:text-navy-600"
        >
          <ArrowLeft size={16} />
          목록
        </button>
      </PageHeader>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-gray-400">전체 사건</p>
            <p className="mt-1 text-2xl font-bold text-navy-700">{incidents.length}</p>
          </div>
          {ROLE_FILTERS.slice(1).map((r) => (
            <div key={r.value} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400">{r.label}</p>
              <p className="mt-1 text-2xl font-bold text-navy-700">{roleStats[r.value] ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">조치 누적 횟수</p>
          <p className="mt-1 text-2xl font-bold text-navy-700">{actionCount}</p>
        </div>

        <div className="mb-4">
          <h2 className="mb-3 text-base font-bold text-navy-700">관련 사건 기록</h2>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {ROLE_FILTERS.map((r) => {
              const active = roleFilter === r.value;
              const activeStyle = ROLE_STYLES[r.value] ?? 'border-navy-600 bg-navy-600 text-white';
              return (
                <button
                  key={r.value}
                  onClick={() => setRoleFilter(r.value)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? activeStyle
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
              관련 사건 기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((inc) => {
                const myRole = inc.incident_students.find((is) => is.student?.id === id)?.role;
                return (
                  <button
                    key={inc.id}
                    onClick={() =>
                      navigate(`/incidents/${inc.id}`, {
                        state: { fromStudentId: id },
                      })
                    }
                    className="block w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-navy-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{inc.description}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDateTime(inc.occurred_at)} · {inc.location} · {inc.time_period ?? ''}
                        </p>
                      </div>
                      <div className="ml-2 flex items-center gap-1.5">
                        {myRole && (
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[myRole] ?? ROLE_STYLES.other}`}
                          >
                            {ROLE_LABELS[myRole] ?? myRole}
                          </span>
                        )}
                        <span className="rounded-md bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-600">
                          {inc.incident_type}
                        </span>
                      </div>
                    </div>
                    {inc.action_type && (
                      <div className="mt-2">
                        <ActionTag type={inc.action_type} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
