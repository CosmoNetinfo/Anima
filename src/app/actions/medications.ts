'use server'

import { createClient, getActiveRoleAndProfile } from '@/lib/supabase/server'
import { Medication, MedicationLog } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Recupera le terapie attive e storiche per un paziente
 */
export async function getMedications(patientId: string, activeOnly = true) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) throw error
    return { data: data as Medication[], error: null }
  } catch (error: any) {
    console.error('Errore getMedications:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Prescrive un nuovo farmaco (Solo Doctor)
 */
export async function createMedication(data: Omit<Medication, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = await createClient()

    const { user, profile, role } = await getActiveRoleAndProfile(supabase)
    if (!user) throw new Error('Utente non autenticato')

    if (!profile || role !== 'doctor') {
      throw new Error('Solo i medici possono prescrivere farmaci')
    }

    const { data: newMed, error } = await supabase
      .from('medications')
      .insert({
        ...data,
        prescribed_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/patients/${data.patient_id}/medications`)
    return { data: newMed as Medication, error: null }
  } catch (error: any) {
    console.error('Errore createMedication:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Recupera lo storico somministrazioni per un giorno specifico
 */
export async function getMedicationLogs(patientId: string, dateStr: string) {
  try {
    const supabase = await createClient()

    const startOfDay = `${dateStr}T00:00:00.000Z`
    const endOfDay = `${dateStr}T23:59:59.999Z`

    const { data, error } = await supabase
      .from('medication_logs')
      .select(`
        *,
        administered_by_profile:profiles!medication_logs_administered_by_fkey(full_name)
      `)
      .eq('patient_id', patientId)
      .gte('scheduled_time', startOfDay)
      .lte('scheduled_time', endOfDay)
      .order('scheduled_time', { ascending: true })

    if (error) throw error
    return { data: data as any[], error: null }
  } catch (error: any) {
    console.error('Errore getMedicationLogs:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Registra una somministrazione (Given, Skipped, Refused)
 */
export async function logMedicationAdministration(logData: {
  medication_id: string
  patient_id: string
  scheduled_time: string
  status: 'given' | 'skipped' | 'refused'
  skip_reason?: string
  notes?: string
}) {
  try {
    const supabase = await createClient()

    // Controllo utente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    // Controlla se esiste già un log per questo orario per non duplicare
    const { data: existing } = await supabase
      .from('medication_logs')
      .select('id')
      .eq('medication_id', logData.medication_id)
      .eq('scheduled_time', logData.scheduled_time)
      .maybeSingle()

    let res
    if (existing) {
      res = await supabase
        .from('medication_logs')
        .update({
          status: logData.status,
          skip_reason: logData.skip_reason || null,
          notes: logData.notes || null,
          administered_at: new Date().toISOString(),
          administered_by: user.id,
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      res = await supabase
        .from('medication_logs')
        .insert({
          medication_id: logData.medication_id,
          patient_id: logData.patient_id,
          scheduled_time: logData.scheduled_time,
          status: logData.status,
          skip_reason: logData.skip_reason || null,
          notes: logData.notes || null,
          administered_at: new Date().toISOString(),
          administered_by: user.id,
        })
        .select()
        .single()
    }

    if (res.error) throw res.error

    // Inseriamo un record nel registro attività della struttura
    await supabase.from('activity_log').insert({
      patient_id: logData.patient_id,
      performed_by: user.id,
      action_type: 'medication_administered',
      description: `Farmaco registrato come ${logData.status}`,
      metadata: { medication_id: logData.medication_id, status: logData.status }
    })

    revalidatePath(`/patients/${logData.patient_id}/medications`)
    return { data: res.data as MedicationLog, error: null }
  } catch (error: any) {
    console.error('Errore logMedicationAdministration:', error.message)
    return { data: null, error: error.message }
  }
}
