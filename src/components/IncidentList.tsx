import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  Incident, IncidentWithStudents, Student, IncidentRole,
  ROLE_LABELS, ROLE_COLORS, ACTION_TYPES, INCIDENT_TYPES, TIME_PERIODS,
} from '../types'
import {
  Plus, X, MapPin, Clock, FileText, Trash2, Search, AlertCircle,
} from 'lucide-react'

export default function IncidentList() {
  const [incidents, setIncidents] = useState<IncidentWithStudents[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<IncidentWithStudents | null>(null)

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('incidents')
      .select(`
        *,
        incident_students (
          id,
          role,
          student:students (*)
        )
      `)
      .order('occurred_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setIncidents((data || []) as unknown as IncidentWithStudents[])
    }
    setLoading(false)
  }, [])

  const fetchStudents = useCallback(async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('grade')
      .order('class_number')
      .order('student_number')
    setStudents(data || [])
  }, [])

  useEffect(() => {
    fetchIncidents()
    fetchStudents()
  }, [fetchIncidents, fetchStudents])

  const handleDelete = async (incident: IncidentWithStudents) => {
    const { error: err1 } = await supabase
      .from('incident_students')
      .delete()
      .eq('incident_id', incident.id)
    if (err1) {
      setError(err1.message)
      return
    }
    const { error: err2 } = await supabase
      .from('incidents')
      .delete()
      .eq('id', incident.id)
    if (err2) {
      setError(err2.message)
    } else {
      setConfirmDelete(null)
      fetchIncidents()
    }
  }

  const filtered = incidents.filter((inc) => {
    const text = `${inc.description} ${inc.incident_type} ${inc.location} ${inc.action_type || ''}`
    const studentNames = inc.incident_students?.map((is) => is.student?.name || '').join(' ')
    return (text + ' ' + studentNames).toLowerCase().includes(search.toLowerCase())
  })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">사건기록</h2>
          <p className="text-sm text-gray-500 mt-1">총 {incidents.length}건의 사건기록</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          사건 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
          {error}
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="사건 내용, 학생 이름, 조치 유형으로 검색"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-3" />
          <p className="text-sm">표시할 사건기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((incident) => (
            <div
              key={incident.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-md">
                    {incident.incident_type}
                  </span>
                  {incident.action_type && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-accent-50 text-accent-700 rounded-md">
                      조치: {incident.action_type}
                    </span>
                  )}
                  {incident.time_period && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                      {incident.time_period}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setConfirmDelete(incident)}
                  className="p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-gray-800 mb-3 leading-relaxed">{incident.description}</p>

              {incident.incident_students && incident.incident_students.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {incident.incident_students.map((is) => (
                    <span
                      key={is.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border ${ROLE_COLORS[is.role]}`}
                    >
                      <span className="font-medium">{ROLE_LABELS[is.role]}</span>
                      <span>{is.student?.name || '알 수 없음'}</span>
                      {is.student && (
                        <span className="opacity-60">
                          ({is.student.grade}-{is.student.class_number}-{is.student.student_number})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(incident.occurred_at)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {incident.location}
                </span>
                {incident.action_note && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {incident.action_note}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <IncidentForm
          students={students}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            fetchIncidents()
          }}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">사건기록 삭제</h3>
            <p className="text-sm text-gray-700 mb-1">이 사건기록을 삭제하시겠습니까?</p>
            <p className="text-xs text-gray-500 mt-2">
              삭제 시 이 사건에 연결된 행동학생·피해학생·목격학생 관계도 함께 삭제됩니다.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface IncidentFormProps {
  students: Student[]
  onClose: () => void
  onSaved: () => void
}

function IncidentForm({ students, onClose, onSaved }: IncidentFormProps) {
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16),
  )
  const [location, setLocation] = useState('교실')
  const [incidentType, setIncidentType] = useState<string>(INCIDENT_TYPES[0])
  const [description, setDescription] = useState('')
  const [actionType, setActionType] = useState<string>('')
  const [actionNote, setActionNote] = useState('')
  const [timePeriod, setTimePeriod] = useState<string>('')
  const [linkedStudents, setLinkedStudents] = useState<
    { studentId: string; role: IncidentRole }[]
  >([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedRole, setSelectedRole] = useState<IncidentRole>('actor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addStudentLink = () => {
    if (!selectedStudent) return
    if (linkedStudents.some((ls) => ls.studentId === selectedStudent && ls.role === selectedRole)) return
    setLinkedStudents([...linkedStudents, { studentId: selectedStudent, role: selectedRole }])
    setSelectedStudent('')
  }

  const removeStudentLink = (idx: number) => {
    setLinkedStudents(linkedStudents.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!description.trim()) {
      setError('사건 내용을 입력해주세요.')
      return
    }

    setLoading(true)

    const incidentPayload: Partial<Incident> = {
      occurred_at: new Date(occurredAt).toISOString(),
      location: location || '미지정',
      incident_type: incidentType,
      description: description.trim(),
      action_type: actionType || null,
      action_note: actionNote.trim() || null,
      time_period: timePeriod || null,
    }

    const { data: incidentData, error: incidentErr } = await supabase
      .from('incidents')
      .insert(incidentPayload)
      .select()
      .single()

    if (incidentErr || !incidentData) {
      setError(incidentErr?.message || '사건 생성 실패')
      setLoading(false)
      return
    }

    if (linkedStudents.length > 0) {
      const links = linkedStudents.map((ls) => ({
        incident_id: incidentData.id,
        student_id: ls.studentId,
        role: ls.role,
      }))
      const { error: linkErr } = await supabase
        .from('incident_students')
        .insert(links)
      if (linkErr) {
        setError(linkErr.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">사건 추가</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">발생 일시</label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">장소</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 교실, 복도, 운동장"
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">사건 유형</label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">시간대</label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">선택 안함</option>
              {TIME_PERIODS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">사건 내용</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="사건 내용을 상세히 입력해주세요"
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">조치 유형</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">선택 안함</option>
                {ACTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">조치 내용</label>
              <input
                type="text"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="조치 내용"
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              관련 학생 (행동·피해·목격)
            </label>
            <div className="flex gap-2">
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">학생 선택</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.grade}-{s.class_number}-{s.student_number})
                  </option>
                ))}
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as IncidentRole)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="actor">행동학생</option>
                <option value="victim">피해학생</option>
                <option value="witness">목격학생</option>
                <option value="other">기타</option>
              </select>
              <button
                type="button"
                onClick={addStudentLink}
                disabled={!selectedStudent}
                className="px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {linkedStudents.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {linkedStudents.map((ls, idx) => {
                  const student = students.find((s) => s.id === ls.studentId)
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border ${ROLE_COLORS[ls.role]}`}
                    >
                      {ROLE_LABELS[ls.role]}: {student?.name || '?'}
                      <button
                        type="button"
                        onClick={() => removeStudentLink(idx)}
                        className="ml-1 hover:text-error-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '저장 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
