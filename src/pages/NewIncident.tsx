import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StudentSearchInput } from '@/components/StudentSearchInput';
import { ROLE_STYLES } from '@/components/Tags';
import {
  supabase,
  kstLocalToISO,
  isoToKstLocal,
  buildTimePeriod,
  LOCATIONS,
  INCIDENT_TYPES,
  ACTION_TYPES,
  TIME_PERIODS,
  BREAKABLE_PERIODS,
  ROLES,
  ROLE_LABELS,
  formatStudentLabel,
  type Student,
} from '@/lib/supabase';

type LinkedStudent = {
  student: Student;
  role: string;
};

export function NewIncident() {
  const navigate = useNavigate();
  const [occurredAt, setOccurredAt] = useState(isoToKstLocal(new Date().toISOString()));
  const [location, setLocation] = useState('교실');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<string>('단순지도');
  const [actionNote, setActionNote] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [isBreak, setIsBreak] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [roleWarning, setRoleWarning] = useState(false);

  const canBreak = selectedPeriod !== null && BREAKABLE_PERIODS.includes(selectedPeriod);

  useEffect(() => {
    if (!canBreak) setIsBreak(false);
  }, [canBreak]);

  function addStudent(student: Student) {
    setLinkedStudents((prev) => {
      if (prev.some((ls) => ls.student.id === student.id)) return prev;
      return [...prev, { student, role: '' }];
    });
  }

  function removeStudent(idx: number) {
    setLinkedStudents((prev) => prev.filter((_, i) => i !== idx));
  }

  function changeRole(idx: number, role: string) {
    setLinkedStudents((prev) => prev.map((ls, i) => (i === idx ? { ...ls, role } : ls)));
  }

  function toggleType(t: string) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  async function handleSubmit() {
    if (description.trim().length === 0) return;
    const unassigned = linkedStudents.some((ls) => !ls.role);
    if (unassigned) {
      setRoleWarning(true);
      return;
    }

    setSaving(true);
    setSaveError(false);

    const finalLocation = location === '기타' && customLocation.trim() ? customLocation.trim() : location;
    const timePeriod = buildTimePeriod(selectedPeriod, isBreak);
    const incidentType = selectedTypes.length > 0 ? selectedTypes.join(', ') : '기타';

    const { data: incData, error: incError } = await supabase
      .from('incidents')
      .insert({
        occurred_at: kstLocalToISO(occurredAt),
        location: finalLocation,
        incident_type: incidentType,
        description: description.trim(),
        action_type: actionType,
        action_note: actionNote.trim() || null,
        time_period: timePeriod,
      })
      .select()
      .single();

    if (incError) {
      setSaving(false);
      setSaveError(true);
      return;
    }

    if (linkedStudents.length > 0) {
      const { error: linkError } = await supabase.from('incident_students').insert(
        linkedStudents.map((ls) => ({
          incident_id: incData.id,
          student_id: ls.student.id,
          role: ls.role,
        })),
      );
      if (linkError) {
        setSaving(false);
        setSaveError(true);
        return;
      }
    }

    setSaving(false);
    navigate(`/incidents/${incData.id}`, { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="새 사건 기록" subtitle="사건 정보를 입력해주세요." />

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-gray-400">발생 일시</label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-gray-400">시간대</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TIME_PERIODS.map((p) => {
              const active = selectedPeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
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
          <label className={`mt-3 flex items-center gap-2 text-sm ${canBreak ? 'text-gray-600' : 'text-gray-300'}`}>
            <input
              type="checkbox"
              checked={isBreak}
              disabled={!canBreak}
              onChange={(e) => setIsBreak(e.target.checked)}
              className="rounded"
            />
            쉬는시간
          </label>
          {selectedPeriod && (
            <p className="mt-2 text-xs text-gray-400">
              저장될 시간대: {buildTimePeriod(selectedPeriod, isBreak) ?? selectedPeriod}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-gray-400">장소</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {LOCATIONS.map((l) => {
              const active = location === l;
              return (
                <button
                  key={l}
                  onClick={() => setLocation(l)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
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
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="장소 직접 입력"
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-gray-400">사건 유형 (복수 선택 가능)</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {INCIDENT_TYPES.map((t) => {
              const active = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
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

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-gray-400">사건 내용</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="사건 내용을 입력해주세요."
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-gray-400">조치 유형</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ACTION_TYPES.map((t) => {
              const active = actionType === t;
              return (
                <button
                  key={t}
                  onClick={() => setActionType(t)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
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
          <textarea
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="생활지도 내용 (선택)"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-gray-400">관련 학생</label>
          <div className="mt-2">
            <StudentSearchInput onSelect={addStudent} excludeIds={linkedStudents.map((ls) => ls.student.id)} />
          </div>
          {linkedStudents.length > 0 && (
            <div className="mt-3 space-y-2">
              {linkedStudents.map((ls, idx) => (
                <div key={ls.student.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="flex-1 text-sm text-gray-700">{formatStudentLabel(ls.student)}</span>
                  <div className="flex gap-1">
                    {ROLES.map((r) => {
                      const active = ls.role === r;
                      const activeStyle = ROLE_STYLES[r] ?? ROLE_STYLES.other;
                      return (
                        <button
                          key={r}
                          onClick={() => changeRole(idx, r)}
                          className={`rounded-md border px-2 py-0.5 text-xs font-medium transition ${
                            active
                              ? activeStyle
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {ROLE_LABELS[r]}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => removeStudent(idx)} className="text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {roleWarning && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle size={14} />
              역할이 선택되지 않은 학생이 있습니다. 역할을 선택해주세요.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving || description.trim().length === 0}
            className="flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <Check size={18} />
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300"
          >
            취소
          </button>
          {saveError && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle size={14} />
              저장 중 오류가 발생했습니다. 다시 시도해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
