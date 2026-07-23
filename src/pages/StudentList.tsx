import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { supabase, type Student } from '@/lib/supabase';

export function StudentList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('grade')
        .order('class_number')
        .order('student_number');
      setStudents((data ?? []) as Student[]);
      setLoading(false);
    })();
  }, []);

  const filtered = query.trim()
    ? students.filter((s) => s.name.includes(query.trim()))
    : students;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">학생 조회</h1>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="학생 이름 검색"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
        />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">학생이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/students/${s.id}`)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-gray-300 hover:shadow-sm"
            >
              <span className="text-sm font-medium text-gray-800">{s.name}</span>
              <span className="text-xs text-gray-500">
                {s.grade}학년 {s.class_number}반 {s.student_number}번
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
