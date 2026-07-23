import { supabase } from './supabase'
import type { IncidentWithStudents } from './types'

export async function fetchIncidentsWithStudents(): Promise<
  IncidentWithStudents[]
> {
  const { data, error } = await supabase
    .from('incidents')
    .select(
      '*, incident_students(*, student:students(*))',
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as IncidentWithStudents[]
}

export async function fetchIncidentById(
  id: string,
): Promise<IncidentWithStudents | null> {
  const { data, error } = await supabase
    .from('incidents')
    .select(
      '*, incident_students(*, student:students(*))',
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data as IncidentWithStudents
}

export async function fetchIncidentsByStudentId(
  studentId: string,
): Promise<IncidentWithStudents[]> {
  const { data: istudents, error: istError } = await supabase
    .from('incident_students')
    .select('incident_id')
    .eq('student_id', studentId)

  if (istError) throw istError
  if (!istudents || istudents.length === 0) return []

  const incidentIds = istudents.map((is) => is.incident_id)
  const { data, error } = await supabase
    .from('incidents')
    .select(
      '*, incident_students(*, student:students(*))',
    )
    .in('id', incidentIds)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as IncidentWithStudents[]
}

export async function deleteIncident(id: string): Promise<void> {
  const { error: istError } = await supabase
    .from('incident_students')
    .delete()
    .eq('incident_id', id)
  if (istError) throw istError

  const { error } = await supabase.from('incidents').delete().eq('id', id)
  if (error) throw error
}
