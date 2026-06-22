'use server'

import { createClient } from '@/lib/supabase/server'
import { Appointment } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Recupera la lista degli appuntamenti
 */
export async function getAppointments(patientId?: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    const { data: profile } = await supabase
      .from('profiles')
      .select('structure_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.structure_id) throw new Error('Struttura non configurata')

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(full_name)
      `)
      .eq('structure_id', profile.structure_id)

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data, error } = await query.order('appointment_at', { ascending: true })
    if (error) throw error

    return { data: data as any[], error: null }
  } catch (error: any) {
    console.error('Errore getAppointments:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Crea un nuovo appuntamento
 */
export async function createAppointment(appData: {
  patient_id?: string
  title: string
  description?: string
  location?: string
  appointment_at: string
  duration_min?: number
  notes?: string
}) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    const { data: profile } = await supabase
      .from('profiles')
      .select('structure_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.structure_id) throw new Error('Struttura non configurata')

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: appData.patient_id || null,
        structure_id: profile.structure_id,
        created_by: user.id,
        title: appData.title,
        description: appData.description || null,
        location: appData.location || null,
        appointment_at: appData.appointment_at,
        duration_min: appData.duration_min || 30,
        status: 'scheduled',
        notes: appData.notes || null
      })
      .select()
      .single()

    if (error) throw error

    if (appData.patient_id) {
      revalidatePath(`/patients/${appData.patient_id}/appointments`)
    }
    revalidatePath('/calendar')
    return { data: data as Appointment, error: null }
  } catch (error: any) {
    console.error('Errore createAppointment:', error.message)
    return { data: null, error: error.message }
  }
}
