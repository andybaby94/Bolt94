/*
# 학생 생활안전 관리 시스템 - 데이터베이스 스키마 생성

1. 새 테이블
- `students`: 학생 정보 (이름, 학년, 반, 번호)
- `incidents`: 사건 기록 (발생일시, 장소, 유형, 내용, 조치)
- `incident_students`: 사건-학생 다대다 관계 (역할 포함)

2. 보안
- 모든 테이블에 RLS 활성화
- 인증 없는 업무용 앱이므로 anon, authenticated 모두 CRUD 허용
- `USING (true)` 은 의도적으로 공유되는 단일 테넌트 데이터이므로 허용됨

3. 주요 설계
- students와 incidents는 다대다 관계 (incident_students 조인 테이블)
- role: actor(행동학생), victim(피해학생), witness(목격학생), other(기타)
- action_type: null(조치 없음), '1호', '2호', '3호', '4호', 또는 일반 지도 내용
- occurred_at: 사건 발생 시점 (created_at과 별도)
- 누적 통계 계산을 위해 role과 action_type을 별도 컬럼으로 저장
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade int NOT NULL,
  class_number int NOT NULL,
  student_number int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  location text NOT NULL DEFAULT '미지정',
  incident_type text NOT NULL DEFAULT '기타',
  description text NOT NULL DEFAULT '',
  action_type text,
  action_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incident_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'other',
  created_at timestamptz DEFAULT now(),
  UNIQUE (incident_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_incident_students_incident ON incident_students(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_students_student ON incident_students(student_id);
CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at ON incidents(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
CREATE POLICY "anon_select_incidents" ON incidents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_incidents" ON incidents;
CREATE POLICY "anon_insert_incidents" ON incidents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_incidents" ON incidents;
CREATE POLICY "anon_update_incidents" ON incidents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_incidents" ON incidents;
CREATE POLICY "anon_delete_incidents" ON incidents FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_incident_students" ON incident_students;
CREATE POLICY "anon_select_incident_students" ON incident_students FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_incident_students" ON incident_students;
CREATE POLICY "anon_insert_incident_students" ON incident_students FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_incident_students" ON incident_students;
CREATE POLICY "anon_update_incident_students" ON incident_students FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_incident_students" ON incident_students;
CREATE POLICY "anon_delete_incident_students" ON incident_students FOR DELETE
  TO anon, authenticated USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON incidents;
CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
