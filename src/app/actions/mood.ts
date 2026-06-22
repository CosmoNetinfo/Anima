'use server'

import { createClient } from '@/lib/supabase/server'
import { MoodEntry, MoodType } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Recupera lo storico dell'umore di un paziente
 */
export async function getMoodEntries(patientId: string, days = 30) {
  try {
    const supabase = await createClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('patient_id', patientId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (error) throw error
    return { data: data as MoodEntry[], error: null }
  } catch (error: any) {
    console.error('Errore getMoodEntries:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Aggiunge un record dello stato d'animo (da Memora)
 */
export async function addMoodEntry(vitalData: {
  patient_id: string
  mood: MoodType
  notes?: string
}) {
  try {
    const supabase = await createClient()

    // Controllo utente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { data, error } = await supabase
      .from('mood_entries')
      .insert({
        patient_id: vitalData.patient_id,
        recorded_by: user.id,
        mood: vitalData.mood,
        notes: vitalData.notes || null,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Logga l'attività nel bacheca attività
    await supabase.from('activity_log').insert({
      patient_id: vitalData.patient_id,
      performed_by: user.id,
      action_type: 'mood_logged',
      description: `Umore registrato come ${vitalData.mood}`,
      metadata: { mood: vitalData.mood }
    })

    revalidatePath('/dashboard')
    revalidatePath('/mood')
    return { data: data as MoodEntry, error: null }
  } catch (error: any) {
    console.error('Errore addMoodEntry:', error.message)
    return { data: null, error: error.message }
  }
}
