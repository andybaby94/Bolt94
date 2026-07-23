import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import {
  supabase,
  ROLE_LABELS,
  type IncidentWithStudents,
} from '@/lib/supabase';
import { formatDateTime } from '@/components/IncidentCard';

export function GuardianNotice() {
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
        .maybeSingle();
      setIncident(data as IncidentWithStudents | null);
      setLoading(false);
    })();
  }, [id]);

  function handlePrint() {
    window.print();
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
  const guardianStudents = students.filter(
    (is) => is.role === 'actor' || is.role === 'victim'
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <div className="no-print mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800">보호자 통지서</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <Printer size={16} />
          인쇄
        </button>
      </div>

      <div className="print-area rounded-xl border border-gray-200 bg-white p-8">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">학교생활 안내 통지서</h2>
          <p className="mt-1 text-sm text-gray-500">학부모님께 안내드립니다</p>
        </div>

        <div className="space-y-3 text-sm text-gray-800">
          <div className="flex">
            <span className="w-24 shrink-0 font-medium text-gray-500">발생 일시</span>
            <span>{formatDateTime(incident.occurred_at)}</span>
            {incident.time_period && (
              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {incident.time_period}
              </span>
            )}
          </div>
          <div className="flex">
            <span className="w-24 shrink-0 font-medium text-gray-500">발생 장소</span>
            <span>{incident.location}</span>
          </div>
          <div className="flex">
            <span className="w-24 shrink-0 font-medium text-gray-500">사건 유형</span>
            <span>{incident.incident_type}</span>
          </div>
          {incident.action_type && (
            <div className="flex">
              <span className="w-24 shrink-0 font-medium text-gray-500">조치 유형</span>
              <span>{incident.action_type}</span>
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="mb-1 text-sm font-medium text-gray-500">사건 내용</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {incident.description}
          </p>
        </div>

        {incident.action_note && (
          <div className="mt-5">
            <p className="mb-1 text-sm font-medium text-gray-500">생활지도 내용</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {incident.action_note}
            </p>
          </div>
        )}

        {guardianStudents.length > 0 && (
          <div className="mt-5">
            <p className="mb-1 text-sm font-medium text-gray-500">관련 학생</p>
            <div className="flex flex-wrap gap-1.5">
              {guardianStudents.map((is) => (
                <span
                  key={is.id}
                  className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                >
                  {is.student?.name ?? '?'} · {ROLE_LABELS[is.role] ?? is.role}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <div className="text-right text-sm text-gray-700">
            <p>20    년   월   일</p>
            <p className="mt-1">담임교사:            (인)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
