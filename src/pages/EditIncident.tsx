import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Check, AlertCircle } from 'lucide-react';
import {
  supabase,
  INCIDENT_TYPES,
  LOCATIONS,
  ACTION_TYPES_ROW1,
  ACTION_TYPES_ROW2,
  ROLES,
  ROLE_LABELS,
  TIME_PERIODS_ROW1,
  TIME_PERIODS_ROW2,
  PERIODS_WITH_BREAK,
  buildTimePeriod,
  parseTimePeriod,
  parseIncidentTypes,
  formatStudentInfo,
  type Student,
  type IncidentWithStudents,
} from '@/lib/supabase';
import { kstLocalToISO, isoToKSTLocal } from '@/lib/datetime';
import { PageHeader } from '@/components/PageHeader';
import { StudentSearchInput } from '@/components/StudentSearchInput';

type LinkedStudent = {
  student: Student;
  role: string;
};

const ROLE_ACTIVE_STYLES: Record<string, string> = {
  actor: 'border-red-200 bg-red-50 text-red-700',
  victim: 'border-blue-200 bg-blue-50 text-blue-700',
  witness: 'border-green-200 bg-green-50 text-green-700',
  other: 'border-gray-200 bg-gray-100 text-gray-700',
};

export function EditIncident() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [occurredAt, setOccurredAt] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [isBreak, setIsBreak] = useState(false);
  const [location, setLocation] = useState('교실');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [roleWarning, setRoleWarning] = useState(false);

  const canBreak = selectedPeriod !== null && PERIODS_WITH_BREAK.includes(selectedPeriod);

  useEffect(() => {
    if (!canBreak) setIsBreak(false);
  }, [canBreak]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .eq('id', id)
        .maybeSingle();
      const inc = data as IncidentWithStudents | null;
      if (!inc) {
        setLoading(false);
        return;
      }

      setOccurredAt(isoToKSTLocal(inc.occurred_at));
      const { period, isBreak: parsedBreak } = parseTimePeriod(inc.time_period);
      setSelectedPeriod(period);
      setIsBreak(parsedBreak);

      if (LOCATIONS.includes(inc.location)) {
        setLocation(inc.location);
      } else {
        setLocation('기타');
        setCustomLocation(inc.location);
      }

      setSelectedTypes(parseIncidentTypes(inc.incident_type));
      setDescription(inc.description);
      setActionType(inc.action_type);
      setActionNote(inc.action_note ?? '');

      const links = (inc.incident_students ?? []).filter((is) => is.student);
      setLinkedStudents(
        links.map((is) => ({
          student: is.student as Student,
          role: is.role,
        }))
      );

      setLoading(false);
    })();
  }, [id]);

  function addStudent(student: Student) {
    if (linkedStudents.some((ls) => ls.student.id === student.id)) return;
    setLinkedStudents([...linkedStudents, { student, role: '' }]);
    setRoleWarning(false);
  }

  function removeStudent(idx: number) {
    setLinkedStudents(linkedStudents.filter((_, i) => i !== idx));
  }

  function changeRole(idx: number, role: string) {
    setLinkedStudents(
      linkedStudents.map((ls, i) => (i === idx ? { ...ls, role } : ls))
    );
    setRoleWarning(false);
  }

  function toggleType(type: string) {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  }

  function toggleAction(type: string) {
    if (type === '없음') {
      setActionType(null);
      return;
    }
    setActionType(actionType === type ? null : type);
  }

  async function handleSubmit() {
    if (description.trim().length === 0 || !id) return;

    const unassigned = linkedStudents.some((ls) => !ls.role);
    if (unassigned) {
      setRoleWarning(true);
      return;
    }

    setSaving(true);

    const finalLocation = location === '기타' && customLocation.trim() ? customLocation.trim() : location;
    const timePeriod = buildTimePeriod(selectedPeriod, isBreak);
    const incidentType = selectedTypes.length > 0 ? selectedTypes.join(', ') : '기타';

    await supabase
      .from('incidents')
      .update({
        occurred_at: kstLocalToISO(occurredAt),
        location: finalLocation,
        incident_type: incidentType,
        description: description.trim(),
        action_type: actionType,
        action_note: actionNote.trim() || null,
        time_period: timePeriod,
      })
      .eq('id', id);

    await supabase.from('incident_students').delete().eq('incident_id', id);
    if (linkedStudents.length > 0) {
      await supabase.from('incident_students').insert(
        linkedStudents.map((ls) => ({
          incident_id: id,
          student_id: ls.student.id,
          role: ls.role,
        }))
      );
    }

    setSaving(false);
    navigate(`/incidents/${id}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center text-sm text-gray-400">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <PageHeader title="사건 수정" />

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">작성 일시</label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">발생 시간대</label>
          <div className="flex flex-wrap gap-1.5">
            {TIME_PERIODS_ROW1.map((p) => {
              const active = selectedPeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(active ? null : p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {TIME_PERIODS_ROW2.map((p) => {
              const active = selectedPeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(active ? null : p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <label
            className={`mt-2 flex items-center gap-2 text-xs ${
              canBreak ? 'text-gray-600' : 'text-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={isBreak}
              disabled={!canBreak}
              onChange={(e) => setIsBreak(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300"
            />
            쉬는시간
          </label>
          {selectedPeriod && (
            <p className="mt-1.5 text-xs text-gray-400">
              저장될 시간대: {buildTimePeriod(selectedPeriod, isBreak) ?? selectedPeriod}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">장소</label>
          <div className="flex flex-wrap gap-1.5">
            {LOCATIONS.map((l) => {
              const active = location === l;
              return (
                <button
                  key={l}
                  onClick={() => setLocation(l)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
          {location === '기타' && (
            <input
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="장소 직접 입력"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400"
            />
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">사건 유형 (복수 선택 가능)</label>
          <div className="flex flex-wrap gap-1.5">
            {INCIDENT_TYPES.map((t) => {
              const active = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
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

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">사건 내용</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="사건 내용을 입력하세요"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">지도·조치 유형</label>
          <div className="flex flex-wrap gap-1.5">
            {ACTION_TYPES_ROW1.map((a) => {
              const isNone = a === '없음';
              const active = isNone ? actionType === null : actionType === a;
              return (
                <button
                  key={a}
                  onClick={() => toggleAction(a)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                  style={active && !isNone ? { backgroundColor: '#1e3a5f' } : active && isNone ? { backgroundColor: '#6b7280' } : {}}
                >
                  {a}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ACTION_TYPES_ROW2.map((a) => {
              const active = actionType === a;
              return (
                <button
                  key={a}
                  onClick={() => toggleAction(a)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-navy-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                  style={active ? { backgroundColor: '#1e3a5f' } : {}}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">지도·조치 내용 (선택)</label>
          <textarea
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            rows={3}
            placeholder="지도·조치 내용을 입력하세요 (선택)"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">관련 학생</label>
          <StudentSearchInput
            onSelect={addStudent}
            placeholder="학생 이름 검색 후 Enter 또는 클릭하여 추가"
            excludeIds={linkedStudents.map((ls) => ls.student.id)}
          />

          {roleWarning && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle size={14} />
              역할이 선택되지 않은 학생이 있습니다. 역할을 선택해주세요.
            </div>
          )}

          {linkedStudents.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {linkedStudents.map((ls, idx) => (
                <div
                  key={`${ls.student.id}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm text-gray-800">
                      {ls.student.name}
                      <span className="ml-1 text-xs text-gray-400">
                        ({formatStudentInfo(ls.student)})
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {ROLES.map((r) => {
                        const active = ls.role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => changeRole(idx, r)}
                            className={`rounded-md border px-2 py-0.5 text-xs font-medium transition ${
                              active
                                ? ROLE_ACTIVE_STYLES[r]
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {ROLE_LABELS[r]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => removeStudent(idx)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || description.trim().length === 0}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <Check size={18} />
          {saving ? '저장 중...' : '수정 저장'}
        </button>
      </div>
    </div>
  );
}
