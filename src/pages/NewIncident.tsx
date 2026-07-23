import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Plus } from 'lucide-react';
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
  type Student,
} from '@/lib/supabase';
import { nowKSTLocal, kstLocalToISO } from '@/lib/datetime';

type LinkedStudent = {
  student: Student;
  role: string;
};

export function NewIncident() {
  const navigate = useNavigate();
  const [occurredAt, setOccurredAt] = useState(nowKSTLocal());
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [isBreak, setIsBreak] = useState(false);
  const [location, setLocation] = useState('교실');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['수업방해']);
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [saving, setSaving] = useState(false);

  const canBreak = selectedPeriod !== null && PERIODS_WITH_BREAK.includes(selectedPeriod);

  useEffect(() => {
    if (!canBreak) setIsBreak(false);
  }, [canBreak]);

  async function handleStudentSearch(value: string) {
    setStudentQuery(value);
    if (value.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const { data } = await supabase
      .from('students')
      .select('*')
      .ilike('name', `%${value.trim()}%`)
      .limit(10);
    setSearchResults((data ?? []) as Student[]);
    setShowResults(true);
  }

  function addStudent(student: Student, role: string) {
    if (linkedStudents.some((ls) => ls.student.id === student.id && ls.role === role)) return;
    setLinkedStudents([...linkedStudents, { student, role }]);
    setStudentQuery('');
    setSearchResults([]);
    setShowResults(false);
  }

  function removeStudent(idx: number) {
    setLinkedStudents(linkedStudents.filter((_, i) => i !== idx));
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
    if (description.trim().length === 0) return;
    setSaving(true);

    const finalLocation = location === '기타' && customLocation.trim() ? customLocation.trim() : location;
    const timePeriod = buildTimePeriod(selectedPeriod, isBreak);
    const incidentType = selectedTypes.length > 0 ? selectedTypes.join(', ') : '기타';

    const { data: inc } = await supabase
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

    if (inc && linkedStudents.length > 0) {
      await supabase.from('incident_students').insert(
        linkedStudents.map((ls) => ({
          incident_id: inc.id,
          student_id: ls.student.id,
          role: ls.role,
        }))
      );
    }

    setSaving(false);
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">새 사건 기록</h1>
      </div>

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
          <label className="mb-1.5 block text-xs font-medium text-gray-500">조치 유형</label>
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
          <label className="mb-1.5 block text-xs font-medium text-gray-500">생활지도 내용 (선택)</label>
          <textarea
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            rows={3}
            placeholder="생활지도 내용을 입력하세요 (선택)"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">관련 학생</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={studentQuery}
              onChange={(e) => handleStudentSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              placeholder="학생 이름 검색"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-navy-400"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {searchResults.map((s) => (
                  <div key={s.id} className="border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm font-medium text-gray-800">{s.name}</span>
                      <span className="text-xs text-gray-500">
                        {s.grade}학년 {s.class_number}반 {s.student_number}번
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 px-4 pb-2">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          onClick={() => addStudent(s, r)}
                          className="rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          {ROLE_LABELS[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {linkedStudents.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {linkedStudents.map((ls, idx) => (
                <div
                  key={`${ls.student.id}-${ls.role}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <span className="text-sm text-gray-800">
                    {ls.student.name} · {ROLE_LABELS[ls.role]}
                    <span className="ml-1 text-xs text-gray-400">
                      ({ls.student.grade}학년 {ls.student.class_number}반 {ls.student.student_number}번)
                    </span>
                  </span>
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
          <Plus size={18} />
          {saving ? '저장 중...' : '사건 기록 저장'}
        </button>
      </div>
    </div>
  );
}
