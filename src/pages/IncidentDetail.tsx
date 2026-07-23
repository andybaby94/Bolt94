import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import {
  supabase,
  type IncidentWithStudents,
} from '@/lib/supabase';
import { formatDateTime } from '@/components/IncidentCard';
import { StudentTag, ActionTag } from '@/components/Tags';
import { PageHeader } from '@/components/PageHeader';

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromStudentId = (location.state as { fromStudentId?: string } | null)?.fromStudentId;
  const [incident, setIncident] = useState<IncidentWithStudents | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .eq('id', id)
        .maybeSingle();
      setIncident(data as IncidentWithStudents | null);
      setLoading(false);
    })();
  }, [id]);

  async function handleDelete() {
    if (!incident) return;
    setDeleting(true);
    await supabase.from('incidents').delete().eq('id', incident.id);
    setDeleting(false);
    navigate('/');
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center text-sm text-gray-400">
        불러오는 중...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center text-sm text-gray-400">
        사건을 찾을 수 없습니다.
      </div>
    );
  }

  const students = incident.incident_students ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <PageHeader title="사건 상세" />

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">{formatDateTime(incident.occurred_at)}</span>
          {incident.time_period && (
            <>
              <span>·</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
                {incident.time_period}
              </span>
            </>
          )}
          <span>·</span>
          <span>{incident.location}</span>
          <span>·</span>
          <span>{incident.incident_type}</span>
          {incident.action_type && <ActionTag type={incident.action_type} />}
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {incident.description}
        </p>

        {incident.action_note && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500">생활지도 내용</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {incident.action_note}
            </p>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-gray-500">관련 학생</p>
          <div className="flex flex-wrap gap-1.5">
            {students.map((is) => (
              <button
                key={is.id}
                onClick={() => navigate(`/students/${is.student_id}`)}
              >
                <StudentTag
                  name={is.student?.name ?? '?'}
                  role={is.role}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() =>
            navigate(`/incidents/${incident.id}/edit`, {
              state: { fromStudentId },
            })
          }
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Pencil size={16} />
          수정
        </button>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-3 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 size={16} />
          삭제
        </button>
      </div>

      <button
        onClick={() => navigate(`/incidents/${incident.id}/notice`)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <FileText size={16} />
        보호자 통지서 보기
      </button>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6">
            <h2 className="text-base font-bold text-gray-800">
              이 사건 기록을 삭제하시겠습니까?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              삭제된 사건 기록은 복구할 수 없습니다.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
