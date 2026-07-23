import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { supabase, type IncidentWithStudents, type Student } from '@/lib/supabase';
import { isTodayKST } from '@/lib/datetime';
import { IncidentCard } from '@/components/IncidentCard';

function isToday(iso: string): boolean {
  return isTodayKST(iso);
}

export function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [todayIncidents, setTodayIncidents] = useState<IncidentWithStudents[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<IncidentWithStudents[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from('incidents')
      .select('*, incident_students(*, student:students(*))')
      .order('occurred_at', { ascending: false })
      .limit(30);
    const all = (data ?? []) as IncidentWithStudents[];
    setTodayIncidents(all.filter((i) => isToday(i.occurred_at)));
    setRecentIncidents(all);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const { data } = await supabase
      .from('students')
      .select('*')
      .ilike('name', `%${value.trim()}%`)
      .limit(10);
    setResults((data ?? []) as Student[]);
    setShowResults(true);
  }

  function selectStudent(s: Student) {
    setQuery('');
    setShowResults(false);
    setResults([]);
    navigate(`/students/${s.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="학생 이름 검색"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
          />
        </div>
        {showResults && results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {results.map((s) => (
              <button
                key={s.id}
                onClick={() => selectStudent(s)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="text-xs text-gray-500">
                  {s.grade}학년 {s.class_number}반 {s.student_number}번
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/incidents/new')}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-semibold text-white transition"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <Plus size={18} />
        새 사건 기록
      </button>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          오늘 기록한 사건
          <span className="ml-1.5 text-gray-400">({todayIncidents.length})</span>
        </h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : todayIncidents.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">오늘 기록한 사건이 없습니다.</p>
        ) : (
          <div className="space-y-2.5">
            {todayIncidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onClick={() => navigate(`/incidents/${inc.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          최근 기록한 사건
        </h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : recentIncidents.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">기록된 사건이 없습니다.</p>
        ) : (
          <div className="space-y-2.5">
            {recentIncidents.slice(0, 10).map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onClick={() => navigate(`/incidents/${inc.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <button
          onClick={() => navigate('/students')}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-gray-700 transition hover:border-gray-300"
        >
          학생 조회
          <ChevronRight size={18} className="text-gray-400" />
        </button>
      </section>
    </div>
  );
}
