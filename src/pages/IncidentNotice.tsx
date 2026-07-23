import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  supabase,
  formatDateTime,
  formatDate,
  type IncidentWithStudents,
  type Student,
} from '@/lib/supabase';

export function IncidentNotice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="보호자 통지서" />
        <div className="p-8 text-center text-sm text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="보호자 통지서" />
        <div className="p-8 text-center text-sm text-gray-400">사건을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const actor = incident.incident_students?.find((is) => is.role === 'actor');
  const actorStudent = actor?.student as Student | undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="보호자 통지서">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-navy-300 hover:text-navy-600"
        >
          <ArrowLeft size={16} />
          뒤로
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-navy-300 hover:text-navy-600"
        >
          <Printer size={16} />
          인쇄
        </button>
      </PageHeader>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-navy-700">학생생활지도 보호자 통지서</h1>
          </div>

          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 w-32">학생명</th>
                <td className="px-4 py-3 text-gray-800">{actorStudent?.name ?? ''}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">학년/반/번호</th>
                <td className="px-4 py-3 text-gray-800">
                  {actorStudent ? `${actorStudent.grade}학년 ${actorStudent.class_number}반 ${actorStudent.student_number}번` : ''}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">발생일시</th>
                <td className="px-4 py-3 text-gray-800">{formatDateTime(incident.occurred_at)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">시간대</th>
                <td className="px-4 py-3 text-gray-800">{incident.time_period ?? '미지정'}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">장소</th>
                <td className="px-4 py-3 text-gray-800">{incident.location}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">사건 유형</th>
                <td className="px-4 py-3 text-gray-800">{incident.incident_type}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">사건 내용</th>
                <td className="px-4 py-3 text-gray-800">{incident.description}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">조치 유형</th>
                <td className="px-4 py-3 text-gray-800">{incident.action_type ?? ''}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500">생활지도 내용</th>
                <td className="px-4 py-3 text-gray-800">{incident.action_note ?? ''}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 text-right text-sm text-gray-600">
            <p>{formatDate(incident.occurred_at)}</p>
            <p className="mt-1">생활지도 담당교사</p>
          </div>
        </div>
      </div>
    </div>
  );
}
