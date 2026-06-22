'use server'

import { createClient, getActiveRoleAndProfile } from '@/lib/supabase/server'
import { ClinicalNote } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Recupera le note cliniche per un paziente
 */
export async function getClinicalNotes(patientId: string) {
  try {
    const supabase = await createClient()

    const { user, profile, role } = await getActiveRoleAndProfile(supabase)
    if (!user) throw new Error('Non autenticato')
    if (!profile || !role) throw new Error('Profilo non trovato')

    let query = supabase
      .from('clinical_notes')
      .select(`
        *,
        author_profile:profiles!clinical_notes_author_id_fkey(full_name, role)
      `)
      .eq('patient_id', patientId)

    // Se l'utente è caregiver o paziente, non mostriamo le note private (is_private = false)
    const isStaff = ['admin', 'super_admin', 'doctor', 'nurse'].includes(role)
    if (!isStaff) {
      query = query.eq('is_private', false)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return { data: data as any[], error: null }
  } catch (error: any) {
    console.error('Errore getClinicalNotes:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Aggiunge una nota clinica
 */
export async function addClinicalNote(noteData: {
  patient_id: string
  category: 'general' | 'medical' | 'nursing' | 'psychological' | 'nutritional' | 'physiotherapy' | 'family_communication'
  content: string
  is_private: boolean
  attachments?: string[]
}) {
  try {
    const supabase = await createClient()

    const { user, profile, role } = await getActiveRoleAndProfile(supabase)
    if (!user) throw new Error('Non autenticato')
    if (!profile || !role) throw new Error('Profilo non trovato')

    // Solo staff clinico/admin può inserire note
    const isStaff = ['admin', 'super_admin', 'doctor', 'nurse'].includes(role)
    if (!isStaff) {
      throw new Error('Permessi insufficienti per aggiungere note cliniche')
    }

    const { data, error } = await supabase
      .from('clinical_notes')
      .insert({
        patient_id: noteData.patient_id,
        author_id: user.id,
        category: noteData.category,
        content: noteData.content,
        is_private: noteData.is_private,
        attachments: noteData.attachments || []
      })
      .select()
      .single()

    if (error) throw error

    // Logga l'attività nel diario di struttura
    await supabase.from('activity_log').insert({
      patient_id: noteData.patient_id,
      performed_by: user.id,
      action_type: 'clinical_note_added',
      description: `Aggiunta nota clinica (${noteData.category})`,
      metadata: { category: noteData.category, is_private: noteData.is_private }
    })

    revalidatePath(`/patients/${noteData.patient_id}/diary`)
    return { data: data as ClinicalNote, error: null }
  } catch (error: any) {
    console.error('Errore addClinicalNote:', error.message)
    return { data: null, error: error.message }
  }
}
