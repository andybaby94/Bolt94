import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Pencil, Trash2, FileText, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StudentTag, ActionTag } from '@/components/Tags';
import {
  supabase,
  formatDateTime,
  type IncidentWithStudents,
} from '@/lib/supabase';

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromStudentId = (location.state as { fromStudentId?: string } | null)?.fromStudentId;
  const [incident, setIncident] = useState<IncidentWithStudents | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .eq('id', id)
        .single();
      setIncident(data as unknown as IncidentWithStudents);
      setLoading(false);
    })();
  }, [id]);

  async function handleDelete() {
    if (!id || !incident) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('incident_students').delete().eq('incident_id', id);
    await supabase.from('incidents').delete().eq('id', id);
    if (fromStudentId) {
      navigate(`/students/${fromStudentId}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="사건 상세" />
        <div className="p-8 text-center text-sm text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="사건 상세" />
        <div className="p-8 text-center text-sm text-gray-400">사건을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="사건 상세">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-navy-300 hover:text-navy-600"
        >
          <ArrowLeft size={16} />
          뒤로
        </button>
      </PageHeader>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-md bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-600">
              {incident.incident_type}
            </span>
            {incident.action_type && <ActionTag type={incident.action_type} />}
          </div>

          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-400">발생 일시</dt>
              <dd className="mt-0.5 text-sm text-gray-800">{formatDateTime(incident.occurred_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400">시간대</dt>
              <dd className="mt-0.5 text-sm text-gray-800">{incident.time_period ?? '미지정'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400">장소</dt>
              <dd className="mt-0.5 text-sm text-gray-800">{incident.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-400">사건 내용</dt>
              <dd className="mt-0.5 text-sm text-gray-800">{incident.description}</dd>
            </div>
            {incident.action_note && (
              <div>
                <dt className="text-xs font-medium text-gray-400">생활지도 내용</dt>
                <dd className="mt-0.5 text-sm text-gray-800">{incident.action_note}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4">
            <dt className="text-xs font-medium text-gray-400">관련 학생</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {incident.incident_students?.map((is) => (
                <StudentTag
                  key={is.id}
                  name={is.student?.name ?? '?'}
                  role={is.role}
                />
              ))}
            </dd>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() =>
                navigate(`/incidents/${incident.id}/edit`, {
                  state: { fromStudentId },
                })
              }
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-navy-300 hover:text-navy-600"
            >
              <Pencil size={16} />
              수정
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              삭제
            </button>
            <button
              onClick={() => navigate(`/incidents/${incident.id}/notice`)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-navy-300 hover:text-navy-600"
            >
              <FileText size={16} />
              보호자 통지서
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
