import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase, type Student } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';

export function StudentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [gender, setGender] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      const s = data as Student | null;
      if (s) {
        setName(s.name);
        setGrade(s.grade != null ? String(s.grade) : '');
        setClassNumber(s.class_number != null ? String(s.class_number) : '');
        setStudentNumber(s.student_number != null ? String(s.student_number) : '');
        setGender(s.gender ?? '');
      }
      setLoading(false);
    })();
  }, [id]);

  async function handleSubmit() {
    if (name.trim().length === 0) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      grade: grade.trim() ? Number(grade) : null,
      class_number: classNumber.trim() ? Number(classNumber) : null,
      student_number: studentNumber.trim() ? Number(studentNumber) : null,
      gender: gender || null,
    };

    if (isEdit && id) {
      await supabase.from('students').update(payload).eq('id', id);
      navigate(`/students/${id}`);
    } else {
      const { data } = await supabase
        .from('students')
        .insert(payload)
        .select()
        .single();
      const newStudent = data as Student | null;
      navigate(newStudent ? `/students/${newStudent.id}` : '/students');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center text-sm text-gray-400">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      <PageHeader title={isEdit ? '학생 수정' : '학생 등록'} />

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">이름 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">학년</label>
          <input
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="학년 (선택)"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">반</label>
          <input
            type="number"
            value={classNumber}
            onChange={(e) => setClassNumber(e.target.value)}
            placeholder="반 (선택)"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">번호</label>
          <input
            type="number"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            placeholder="번호 (선택)"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">성별</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setGender(gender === '남' ? '' : '남')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                gender === '남'
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              남
            </button>
            <button
              onClick={() => setGender(gender === '여' ? '' : '여')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                gender === '여'
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              여
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || name.trim().length === 0}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <Check size={18} />
          {saving ? '저장 중...' : isEdit ? '수정 저장' : '학생 등록'}
        </button>
      </div>
    </div>
  );
}
