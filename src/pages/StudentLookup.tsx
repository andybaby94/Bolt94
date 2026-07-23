import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Student } from '../lib/types'

export default function StudentLookup() {
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('grade')
        .order('class_number')
        .order('student_number')
      if (!error) setStudents(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">학생 조회</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="학생 이름을 검색하세요"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      {loading ? (
        <div className="py-8 text-center text-slate-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/students/${s.id}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 font-bold text-primary-600">
                {s.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-slate-800">{s.name}</div>
                <div className="text-xs text-slate-400">
                  {s.grade}학년 {s.class_number}반 {s.student_number}번
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
