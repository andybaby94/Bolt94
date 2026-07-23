import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Student } from '../lib/types'
import {
  TIME_PERIODS,
  LOCATIONS,
  INCIDENT_TYPES,
  ACTION_TYPES,
  ROLE_LABELS,
  ROLE_COLORS,
} from '../lib/types'

interface SelectedStudent {
  student: Student
  role: string
}

export default function IncidentRecord() {
  const navigate = useNavigate()

  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date()
    const off = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - off).toISOString().slice(0, 16)
  })
  const [timePeriod, setTimePeriod] = useState('')
  const [location, setLocation] = useState('교실')
  const [incidentTypes, setIncidentTypes] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [actionType, setActionType] = useState('')
  const [actionNote, setActionNote] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [searchActive, setSearchActive] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>(
    [],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // search students
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setHighlightIndex(-1)
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .order('grade')
        .order('class_number')
        .order('student_number')
        .limit(10)
      if (!cancelled) {
        setSearchResults(data || [])
        setHighlightIndex(-1)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [searchQuery])

  function addStudent(student: Student, role = 'other') {
    if (selectedStudents.some((s) => s.student.id === student.id)) return
    setSelectedStudents([...selectedStudents, { student, role }])
    setSearchQuery('')
    setSearchResults([])
    setSearchActive(false)
    searchRef.current?.blur()
  }

  function removeStudent(id: string) {
    setSelectedStudents(
      selectedStudents.filter((s) => s.student.id !== id),
    )
  }

  function changeRole(id: string, role: string) {
    setSelectedStudents(
      selectedStudents.map((s) =>
        s.student.id === id ? { ...s, role } : s,
      ),
    )
  }

  function toggleType(t: string) {
    if (incidentTypes.includes(t)) {
      setIncidentTypes(incidentTypes.filter((x) => x !== t))
    } else {
      setIncidentTypes([...incidentTypes, t])
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (!searchActive || searchResults.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) =>
        i < searchResults.length - 1 ? i + 1 : 0,
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => (i > 0 ? i - 1 : searchResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < searchResults.length) {
        addStudent(searchResults[highlightIndex])
      } else if (searchResults.length === 1) {
        addStudent(searchResults[0])
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      setError('사건 내용을 입력해주세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const occurredDate = new Date(occurredAt).toISOString()
      const { data: incident, error: incError } = await supabase
        .from('incidents')
        .insert({
          occurred_at: occurredDate,
          location,
          incident_type: incidentTypes.join(', ') || '기타',
          description: description.trim(),
          action_type: actionType || null,
          action_note: actionNote.trim() || null,
          time_period: timePeriod || null,
        })
        .select()
        .single()

      if (incError) throw incError

      if (selectedStudents.length > 0) {
        const rows = selectedStudents.map((s) => ({
          incident_id: incident.id,
          student_id: s.student.id,
          role: s.role,
        }))
        const { error: istError } = await supabase
          .from('incident_students')
          .insert(rows)
        if (istError) throw istError
      }

      navigate('/')
    } catch (err) {
      console.error(err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-800">사건 기록</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 작성 일시 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            작성 일시
          </label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* 발생 시간대 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            발생 시간대
          </label>
          <div className="flex flex-wrap gap-2">
            {TIME_PERIODS.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setTimePeriod(timePeriod === tp ? '' : tp)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  timePeriod === tp
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>

        {/* 장소 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            장소
          </label>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  location === loc
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* 사건 유형 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            사건 유형 (중복 선택 가능)
          </label>
          <div className="flex flex-wrap gap-2">
            {INCIDENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  incidentTypes.includes(t)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 관련 학생 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            관련 학생
          </label>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchActive(true)
            }}
            onFocus={() => setSearchActive(true)}
            onBlur={() => setTimeout(() => setSearchActive(false), 200)}
            onKeyDown={handleSearchKeyDown}
            placeholder="학생 이름을 검색하세요"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {searchActive && searchResults.length > 0 && (
            <div className="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {searchResults.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addStudent(s)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition ${
                    i === highlightIndex
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-slate-400">
                    {s.grade}학년 {s.class_number}반 {s.student_number}번
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedStudents.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedStudents.map((s) => (
                <div
                  key={s.student.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800">
                      {s.student.name}
                    </span>
                    <select
                      value={s.role}
                      onChange={(e) => changeRole(s.student.id, e.target.value)}
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        ROLE_COLORS[s.role] || ROLE_COLORS.other
                      } bg-white`}
                    >
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStudent(s.student.id)}
                    className="text-sm text-slate-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 사건 내용 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            사건 내용
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="사건 내용을 입력하세요"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* 조치 유형 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            조치 유형
          </label>
          <div className="flex flex-wrap gap-2">
            {ACTION_TYPES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActionType(actionType === a ? '' : a)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  actionType === a
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* 생활지도 내용 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            생활지도 내용
          </label>
          <textarea
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            rows={3}
            placeholder="생활지도 내용을 입력하세요"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-600 transition hover:bg-slate-50"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
