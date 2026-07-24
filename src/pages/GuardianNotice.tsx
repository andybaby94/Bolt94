import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import {
  supabase,
  ROLE_LABELS,
  parseIncidentTypes,
  type IncidentWithStudents,
} from '@/lib/supabase';
import { formatDateKST } from '@/lib/datetime';
import { PageHeader } from '@/components/PageHeader';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const FAMILY_GUIDANCE_BASE =
  '학교에서는 학생이 자신의 행동을 돌아보고 바람직한 학교생활을 할 수 있도록 지도하였습니다. 가정에서도 이번 일을 계기로 자녀와 함께 상황을 돌아보고, 비슷한 상황에서 적절하게 행동할 수 있는 방법에 대해 이야기해 주시기 바랍니다.';

const FAMILY_GUIDANCE_BY_TYPE: Record<string, string> = {
  '수업·학습 방해':
    '특히 수업 시간의 올바른 참여 태도와 다른 친구의 학습을 존중하는 태도에 대해 가정에서도 함께 이야기해 주시기 바랍니다.',
  '신체적 행동':
    '신체적 행동 대신 자신의 감정을 말로 표현하고, 갈등 상황에서 적절한 방법으로 해결하거나 필요할 경우 교사에게 도움을 요청하도록 지도해 주시기 바랍니다.',
  '언어적 행동':
    '상대방의 마음을 생각하고 존중하는 언어를 사용하도록 가정에서도 함께 지도해 주시기 바랍니다.',
  '규칙·질서 위반':
    '학교생활에서 지켜야 할 기본적인 규칙과 공동체의 질서를 준수하는 태도를 가정에서도 함께 이야기해 주시기 바랍니다.',
  '기타': '',
};

function getKstDateBoundaries() {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const dayOfWeek = nowKst.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayKst = new Date(nowKst);
  mondayKst.setUTCDate(nowKst.getUTCDate() - mondayOffset);
  mondayKst.setUTCHours(0, 0, 0, 0);
  const weekStartEpoch = mondayKst.getTime() - KST_OFFSET_MS;
  const monthStartKst = new Date(Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth(), 1));
  const monthStartEpoch = monthStartKst.getTime() - KST_OFFSET_MS;
  return { weekStartEpoch, monthStartEpoch };
}

function formatKoreanDateKST(): string {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  return `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
}

type ActorCounts = Record<string, { weekly: number; monthly: number }>;

export function GuardianNotice() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentWithStudents | null>(null);
  const [loading, setLoading] = useState(true);
  const [actorCounts, setActorCounts] = useState<ActorCounts>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .eq('id', id)
        .maybeSingle();
      const incidentData = data as IncidentWithStudents | null;
      setIncident(incidentData);
      setLoading(false);

      if (incidentData) {
        const actorStudents = (incidentData.incident_students ?? []).filter(
          (is) => is.role === 'actor',
        );
        if (actorStudents.length > 0) {
          const { weekStartEpoch, monthStartEpoch } = getKstDateBoundaries();
          const counts: ActorCounts = {};
          await Promise.all(
            actorStudents.map(async (is) => {
              const { data: actorIncidents } = await supabase
                .from('incident_students')
                .select('incident:incidents(occurred_at)')
                .eq('student_id', is.student_id)
                .eq('role', 'actor');
              const items = (actorIncidents ?? []) as unknown as {
                incident: { occurred_at: string }[];
              }[];
              let weekly = 0;
              let monthly = 0;
              for (const item of items) {
                const incident = item.incident?.[0];
                if (!incident) continue;
                const epoch = new Date(incident.occurred_at).getTime();
                if (epoch >= weekStartEpoch) weekly++;
                if (epoch >= monthStartEpoch) monthly++;
              }
              counts[is.student_id] = { weekly, monthly };
            }),
          );
          setActorCounts(counts);
        }
      }
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
    (is) => is.role === 'actor' || is.role === 'victim',
  );
  const actorStudents = students.filter((is) => is.role === 'actor');

  const typeAdditions = parseIncidentTypes(incident.incident_type)
    .map((t) => FAMILY_GUIDANCE_BY_TYPE[t])
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <div className="no-print">
        <PageHeader
          title="보호자 통지서"
          rightSlot={
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <Printer size={16} />
              인쇄
            </button>
          }
        />
      </div>

      <div className="print-area rounded-xl border border-gray-200 bg-white p-8">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">학교생활 안내 통지서</h2>
          <p className="mt-1 text-sm text-gray-500">학부모님께 안내드립니다</p>
        </div>

        <div className="space-y-3 text-sm text-gray-800">
          <div className="flex">
            <span className="w-24 shrink-0 font-medium text-gray-500">발생 일시</span>
            <span>{formatDateKST(incident.occurred_at)}</span>
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
              <span className="w-24 shrink-0 font-medium text-gray-500">지도·조치 유형</span>
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
            <p className="mb-1 text-sm font-medium text-gray-500">지도·조치 내용</p>
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

        {actorStudents.length > 0 && (
          <div className="mt-5">
            <p className="mb-1 text-sm font-medium text-gray-500">최근 행동 기록</p>
            <div className="text-sm text-gray-800">
              {actorStudents.map((is) => (
                <div key={is.id}>
                  {actorStudents.length > 1 && (
                    <span className="font-medium">{is.student?.name ?? '?'}: </span>
                  )}
                  이번 주: {actorCounts[is.student_id]?.weekly ?? 0}회 · 이번 달:{' '}
                  {actorCounts[is.student_id]?.monthly ?? 0}회
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-1 text-sm font-medium text-gray-500">가정 협조 안내</p>
          <div className="space-y-2 text-sm leading-relaxed text-gray-800">
            <p>{FAMILY_GUIDANCE_BASE}</p>
            {typeAdditions.length > 0 && <p>{typeAdditions.join(' ')}</p>}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-1 text-sm font-medium text-gray-500">학부모 확인 및 가정 지도</p>
          <p className="text-sm leading-relaxed text-gray-800">
            위 내용을 확인하였으며, 가정에서도 자녀와 함께 이번 일을 이야기하고 지도하였습니다.
          </p>
          <div className="mt-2 space-y-1 text-sm text-gray-800">
            <p>□ 자녀와 함께 이번 일을 이야기하고 지도하였습니다.</p>
            <p>□ 앞으로 같은 일이 발생하지 않도록 주의하도록 지도하겠습니다.</p>
            <p>□ 기타: __________________________</p>
          </div>
          <p className="mt-3 text-sm text-gray-800">
            학부모 성명: __________________ (서명)
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="text-right text-sm text-gray-700">
            <p>{formatKoreanDateKST()}</p>
            <p className="mt-1">담임교사:            (인)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
