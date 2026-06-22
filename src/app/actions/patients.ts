'use server'

import { createClient, getActiveRoleAndProfile } from '@/lib/supabase/server'
import { patientSchema, PatientFormInput } from '@/lib/validators/patient'
import { Patient } from '@/types'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

/**
 * Recupera la lista dei pazienti filtrata e cercata
 */
export async function getPatients(search?: string, ward?: string, showInactive = false) {
  try {
    const supabase = await createClient()

    // RLS farà in modo che gli utenti vedano solo i pazienti della propria struttura o associati
    let query = supabase
      .from('patients')
      .select('*')
      .order('full_name', { ascending: true })

    if (!showInactive) {
      query = query.eq('is_active', true)
    }

    if (ward && ward !== 'all') {
      query = query.eq('ward', ward)
    }

    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as Patient[], error: null }
  } catch (error: any) {
    console.error('Errore getPatients:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Recupera i dettagli di un singolo paziente
 */
export async function getPatientById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as Patient, error: null }
  } catch (error: any) {
    console.error('Errore getPatientById:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Crea un nuovo paziente
 */
export async function createPatient(input: PatientFormInput) {
  try {
    const supabase = await createClient()

    // Recupera il profilo dell'utente loggato per prendere la structure_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { data: profile } = await supabase
      .from('profiles')
      .select('structure_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.structure_id) {
      throw new Error('Utente non associato a nessuna struttura')
    }

    // Validazione input
    const validated = patientSchema.parse(input)

    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...validated,
        structure_id: profile.structure_id,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/patients')
    return { data: data as Patient, error: null }
  } catch (error: any) {
    console.error('Errore createPatient:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Aggiorna un paziente esistente
 */
export async function updatePatient(id: string, input: PatientFormInput) {
  try {
    const supabase = await createClient()

    // Validazione input
    const validated = patientSchema.parse(input)

    const { data, error } = await supabase
      .from('patients')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/patients')
    revalidatePath(`/patients/${id}/overview`)
    return { data: data as Patient, error: null }
  } catch (error: any) {
    console.error('Errore updatePatient:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Disattiva logicamente o elimina un paziente
 */
export async function deletePatient(id: string) {
  try {
    const supabase = await createClient()

    // Disattivazione logica per preservare lo storico clinico (CareLink best practice)
    const { data, error } = await supabase
      .from('patients')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/patients')
    revalidatePath(`/patients/${id}/overview`)
    return { data: data as Patient, error: null }
  } catch (error: any) {
    console.error('Errore deletePatient:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Ottiene il paziente associato all'utente corrente (paziente o caregiver)
 */
export async function getCurrentUserPatient() {
  try {
    const supabase = await createClient()

    const { user, profile, role } = await getActiveRoleAndProfile(supabase)
    if (!user) return { data: null, error: 'Non autenticato' }
    if (!profile) return { data: null, error: 'Profilo non trovato' }

    if (role === 'patient') {
      const cookieStore = await cookies()
      const overridePatientId = cookieStore.get('anima-override-patient-id')?.value
      if (overridePatientId) {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', overridePatientId)
          .maybeSingle()
        if (!error && data) return { data: data as Patient, error: null }
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (error) throw error
      
      // Fallback for debug/override mode if no actual patient is linked to current user
      if (!data && process.env.NODE_ENV === 'development') {
        const { data: firstPatient } = await supabase
          .from('patients')
          .select('*')
          .limit(1)
          .maybeSingle()
        if (firstPatient) return { data: firstPatient as Patient, error: null }
      }

      return { data: data as Patient | null, error: null }
    } else if (role === 'caregiver') {
      const { data, error } = await supabase
        .from('patient_caregivers')
        .select('patients(*)')
        .eq('caregiver_id', user.id)
        .maybeSingle()

      if (error) throw error
      const patient = data ? (data as any).patients : null
      return { data: patient as Patient | null, error: null }
    }

    return { data: null, error: 'Ruolo non associato direttamente ad un paziente specifico' }
  } catch (error: any) {
    console.error('Errore getCurrentUserPatient:', error.message)
    return { data: null, error: error.message }
  }
}
