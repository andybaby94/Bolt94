import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Student } from '../types'
import {
  UserPlus, Pencil, Ban, RotateCcw, Search, Users, ChevronLeft,
} from 'lucide-react'

interface StudentListProps {
  onEdit: (student: Student) => void
}

export default function StudentList({ onEdit }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all')
  const [confirmDeactivate, setConfirmDeactivate] = useState<Student | null>(null)
  const [confirmReactivate, setConfirmReactivate] = useState<Student | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('students')
      .select('*')
      .order('grade', { ascending: true })
      .order('class_number', { ascending: true })
      .order('student_number', { ascending: true })

    if (!showInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
    } else {
      setStudents(data || [])
    }
    setLoading(false)
  }, [showInactive])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleDeactivate = async (student: Student) => {
    setActionLoading(student.id)
    const { error: err } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', student.id)
    if (err) {
      setError(err.message)
    } else {
      setConfirmDeactivate(null)
      fetchStudents()
    }
    setActionLoading(null)
  }

  const handleReactivate = async (student: Student) => {
    setActionLoading(student.id)
    const { error: err } = await supabase
      .from('students')
      .update({ is_active: true })
      .eq('id', student.id)
    if (err) {
      setError(err.message)
    } else {
      setConfirmReactivate(null)
      fetchStudents()
    }
    setActionLoading(null)
  }

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.includes(search) ||
      `${s.grade}학년 ${s.class_number}반 ${s.student_number}번`.includes(search)
    const matchesGrade = filterGrade === 'all' || s.grade === filterGrade
    return matchesSearch && matchesGrade
  })

  const grades = [...new Set(students.map((s) => s.grade))].sort((a, b) => a - b)
  const activeCount = students.filter((s) => s.is_active).length
  const inactiveCount = students.filter((s) => !s.is_active).length

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">학생조회</h2>
          <p className="text-sm text-gray-500 mt-1">
            전체 {students.length}명 · 활성 {activeCount}명
            {inactiveCount > 0 && ` · 비활성 ${inactiveCount}명`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showInactive
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showInactive ? '활성만 보기' : '비활성 포함'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 학년/반/번호로 검색"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterGrade}
          onChange={(e) =>
            setFilterGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
          className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">전체 학년</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              {g}학년
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users className="w-12 h-12 mb-3" />
          <p className="text-sm">표시할 학생이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((student) => (
            <div
              key={student.id}
              className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                student.is_active
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      student.is_active
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{student.name}</span>
                      {!student.is_active && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                          비활성
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {student.grade}학년 {student.class_number}반 {student.student_number}번
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onEdit(student)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  수정
                </button>
                {student.is_active ? (
                  <button
                    onClick={() => setConfirmDeactivate(student)}
                    disabled={actionLoading === student.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    비활성화
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmReactivate(student)}
                    disabled={actionLoading === student.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-success-600 hover:bg-success-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    재활성화
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDeactivate && (
        <ConfirmDialog
          title="학생 비활성화"
          message={`'${confirmDeactivate.name}' 학생을 비활성화하시겠습니까?`}
          subMessage="비활성화된 학생은 목록에서 숨겨지지만, 기존 사건기록과 모든 관계는 그대로 유지됩니다. 언제든 다시 활성화할 수 있습니다."
          confirmText="비활성화"
          confirmColor="error"
          loading={actionLoading === confirmDeactivate.id}
          onConfirm={() => handleDeactivate(confirmDeactivate)}
          onCancel={() => setConfirmDeactivate(null)}
        />
      )}

      {confirmReactivate && (
        <ConfirmDialog
          title="학생 재활성화"
          message={`'${confirmReactivate.name}' 학생을 다시 활성화하시겠습니까?`}
          subMessage="활성화된 학생은 학생조회 목록에 다시 표시됩니다."
          confirmText="재활성화"
          confirmColor="success"
          loading={actionLoading === confirmReactivate.id}
          onConfirm={() => handleReactivate(confirmReactivate)}
          onCancel={() => setConfirmReactivate(null)}
        />
      )}
    </div>
  )
}

interface ConfirmDialogProps {
  title: string
  message: string
  subMessage?: string
  confirmText: string
  confirmColor: 'error' | 'success' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  title,
  message,
  subMessage,
  confirmText,
  confirmColor,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colorClasses = {
    error: 'bg-error-600 hover:bg-error-700',
    success: 'bg-success-600 hover:bg-success-700',
    primary: 'bg-primary-600 hover:bg-primary-700',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-1">{message}</p>
        {subMessage && <p className="text-xs text-gray-500 mt-2">{subMessage}</p>}
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${colorClasses[confirmColor]}`}
          >
            {loading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
