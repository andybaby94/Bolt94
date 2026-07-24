/*
# Add gender column and make optional student fields nullable

1. Changes to `students` table:
   - Add `gender` column (text, nullable) — stores '남' or '여' or null
   - Make `grade` nullable (was NOT NULL) — grade is optional
   - Make `class_number` nullable (was NOT NULL) — class is optional
   - Make `student_number` nullable (was NOT NULL) — student number is optional
2. Security
   - No RLS policy changes. Existing policies remain intact.
3. Important notes
   - `is_active` column already exists (boolean, default true) — reused for soft delete
   - No data loss: existing rows keep their values; new columns default to NULL
   - No tables created or dropped
*/

ALTER TABLE students ADD COLUMN IF NOT EXISTS gender text;

ALTER TABLE students ALTER COLUMN grade DROP NOT NULL;
ALTER TABLE students ALTER COLUMN class_number DROP NOT NULL;
ALTER TABLE students ALTER COLUMN student_number DROP NOT NULL;
