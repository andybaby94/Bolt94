/*
# Add soft delete (is_active) column to students table

## Purpose
This migration adds an `is_active` boolean column to the `students` table to support
soft-delete (deactivation) instead of physical deletion. This ensures that when a student
is deactivated, all their past incident records (actor/victim/witness relationships via
`incident_students`) and related action records remain intact and queryable.

## Changes
1. **students table** — add column:
   - `is_active` (boolean, NOT NULL, DEFAULT true): when false, the student is deactivated
     and hidden from the default student list, but all related incident records are preserved.

2. **No changes** to:
   - `incidents` table
   - `incident_students` table
   - Any existing RLS policies
   - Any existing data

## Security
- No RLS policy changes. Existing policies already allow anon+authenticated CRUD on all tables.
- The `is_active` column is readable and writable through existing UPDATE policies.

## Important notes
1. All 15 existing students will get `is_active = true` by default — no data changes.
2. The column is additive only — no existing columns or relationships are modified.
3. Deactivation is done via UPDATE (set is_active = false), never DELETE, so foreign key
   constraints to `incident_students` are never violated.
*/

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
