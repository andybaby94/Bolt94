import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { supabase, formatStudentLabel, type Student } from '@/lib/supabase';

export function StudentSearchInput({
  onSelect,
  excludeIds = [],
}: {
  onSelect: (student: Student) => void;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .ilike('name', `%${query.trim()}%`)
        .limit(10);
      if (data) {
        setResults(data.filter((s) => !excludeIds.includes(s.id)));
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, excludeIds]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="학생 이름 검색"
          className="flex-1 text-sm outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s);
                setQuery('');
                setResults([]);
                setShowResults(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              {formatStudentLabel(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
