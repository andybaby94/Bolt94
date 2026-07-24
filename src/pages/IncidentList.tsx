import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase, type IncidentWithStudents, INCIDENT_TYPES } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';
import { IncidentCard } from '@/components/IncidentCard';

export function IncidentList() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('incidents')
        .select('*, incident_students(*, student:students(*))')
        .order('occurred_at', { ascending: false });
      setIncidents((data ?? []) as IncidentWithStudents[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = incidents;
    const kw = query.trim();
    if (kw) {
      result = result.filter(
        (i) =>
          i.description.toLowerCase().includes(kw.toLowerCase()) ||
          (i.action_note ?? '').toLowerCase().includes(kw.toLowerCase()) ||
          (i.location ?? '').toLowerCase().includes(kw.toLowerCase())
      );
    }
    if (typeFilter) {
      result = result.filter((i) => i.incident_type.includes(typeFilter));
    }
    return result;
  }, [incidents, query, typeFilter]);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <PageHeader title="전체 사건 조회" />

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사건 내용, 장소 검색"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setTypeFilter('')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            typeFilter === ''
              ? 'border-navy-600 bg-navy-600 text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          전체
        </button>
        {INCIDENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              typeFilter === t
                ? 'border-navy-600 bg-navy-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">기록된 사건이 없습니다.</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((inc) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              highlightKeyword={query.trim()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
