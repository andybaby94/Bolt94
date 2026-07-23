import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { supabase, formatStudentLabel, type Student } from '@/lib/supabase';

export function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('*').order('grade').order('class_number').order('student_number');
      setStudents((data as Student[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="학생 조회" subtitle="학생을 선택하여 생활지도 기록을 확인하세요." />

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="학생 이름 검색"
            className="flex-1 text-sm outline-none"
          />
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            {search ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/students/${s.id}`)}
                className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-navy-300 hover:shadow-md"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{formatStudentLabel(s)}</p>
                </div>
                <ChevronRight size={20} className="text-gray-300 transition group-hover:text-navy-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
