import { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { supabase, formatStudentInfo, type Student } from '@/lib/supabase';

export function StudentSearchInput({
  onSelect,
  placeholder = '학생 이름 검색',
  excludeIds = [],
}: {
  onSelect: (student: Student) => void;
  placeholder?: string;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((value: string) => {
    if (value.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }
    supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${value.trim()}%`)
      .limit(10)
      .then(({ data }) => {
        const filtered = (data ?? [] as Student[]).filter(
          (s) => !excludeIds.includes(s.id)
        ) as Student[];
        setResults(filtered);
        setShowResults(true);
        setHighlightIdx(0);
      });
  }, [excludeIds]);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 150);
  }

  function selectStudent(s: Student) {
    onSelect(s);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setHighlightIdx(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showResults || results.length === 0) {
      if (e.key === 'Escape') {
        setShowResults(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectStudent(results[highlightIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowResults(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setShowResults(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
      />
      {showResults && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.map((s, idx) => (
            <button
              key={s.id}
              onMouseEnter={() => setHighlightIdx(idx)}
              onClick={() => selectStudent(s)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                idx === highlightIdx
                  ? 'bg-navy-50 text-navy-800'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-800">{s.name}</span>
              <span className="text-xs text-gray-500">
                {formatStudentInfo(s)}
              </span>
            </button>
          ))}
        </div>
      )}
      {showResults && results.length === 0 && query.trim().length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 shadow-lg">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
