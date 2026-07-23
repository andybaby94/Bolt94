import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Student } from '../types'
import { X } from 'lucide-react'

interface StudentFormProps {
  student: Student | null
  onClose: () => void
  onSaved: () => void
}

export default function StudentForm({ student, onClose, onSaved }: StudentFormProps) {
  const isEdit = !!student
  const [name, setName] = useState(student?.name || '')
  const [grade, setGrade] = useState(student?.grade?.toString() || '')
  const [classNumber, setClassNumber] = useState(student?.class_number?.toString() || '')
  const [studentNumber, setStudentNumber] = useState(student?.student_number?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    if (!grade || !classNumber || !studentNumber) {
      setError('학년, 반, 번호를 모두 입력해주세요.')
      return
    }

    const payload = {
      name: name.trim(),
      grade: Number(grade),
      class_number: Number(classNumber),
      student_number: Number(studentNumber),
    }

    setLoading(true)
    let err: { message: string } | null = null

    if (isEdit && student) {
      const res = await supabase.from('students').update(payload).eq('id', student.id)
      err = res.error
    } else {
      const res = await supabase.from('students').insert({ ...payload, is_active: true })
      err = res.error
    }

    if (err) {
      setError(err.message)
    } else {
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? '학생 정보 수정' : '학생 추가'}
          </h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="학생 이름"
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">학년</label>
              <input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="예: 3"
                min={1}
                max={6}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">반</label>
              <input
                type="number"
                value={classNumber}
                onChange={(e) => setClassNumber(e.target.value)}
                placeholder="예: 2"
                min={1}
                max={20}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">번호</label>
              <input
                type="number"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="예: 15"
                min={1}
                max={99}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
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
              {loading ? '저장 중...' : isEdit ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
