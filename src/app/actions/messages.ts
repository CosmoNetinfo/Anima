'use server'

import { createClient, getActiveRoleAndProfile } from '@/lib/supabase/server'
import { Message, MessageThread } from '@/types'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

/**
 * Ottiene la lista dei thread di messaggistica visibili per l'utente loggato
 */
export async function getThreads() {
  try {
    const supabase = await createClient()

    const { user, profile, role } = await getActiveRoleAndProfile(supabase)
    if (!user) throw new Error('Non autenticato')
    if (!profile || !role) throw new Error('Profilo non trovato')

    let query = supabase
      .from('message_threads')
      .select(`
        *,
        patient:patients(full_name)
      `)
      .eq('structure_id', profile.structure_id)

    // Se l'utente è un paziente o un caregiver, limitiamo ai thread associati a quel paziente
    if (role === 'patient') {
      const cookieStore = await cookies()
      const overridePatientId = cookieStore.get('anima-override-patient-id')?.value
      let pId = overridePatientId

      if (!pId) {
        const { data: patientData } = await supabase
          .from('patients')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle()
        pId = patientData?.id
      }

      if (!pId && process.env.NODE_ENV === 'development') {
        const { data: firstPatient } = await supabase
          .from('patients')
          .select('id')
          .limit(1)
          .maybeSingle()
        pId = firstPatient?.id
      }

      if (pId) {
        query = query.eq('patient_id', pId)
      } else {
        return { data: [], error: null }
      }
    } else if (role === 'caregiver') {
      const { data: relations } = await supabase
        .from('patient_caregivers')
        .select('patient_id')
        .eq('caregiver_id', user.id)

      const patientIds = relations?.map(r => r.patient_id) || []
      if (patientIds.length > 0) {
        query = query.in('patient_id', patientIds)
      } else {
        return { data: [], error: null }
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return { data: data as any[], error: null }
  } catch (error: any) {
    console.error('Errore getThreads:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Ottiene tutti i messaggi per un thread specifico
 */
export async function getMessages(threadId: string) {
  try {
    const supabase = await createClient()

    // Segna i messaggi non letti nel thread come letti per l'utente loggato
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .neq('sender_id', user.id)
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey(full_name, role, avatar_url)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: data as any[], error: null }
  } catch (error: any) {
    console.error('Errore getMessages:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Invia un messaggio all'interno di un thread
 */
export async function sendMessage(messageData: {
  thread_id: string
  type?: 'text' | 'audio' | 'image' | 'system'
  content?: string
  media_url?: string
  duration_sec?: number
}) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: messageData.thread_id,
        sender_id: user.id,
        type: messageData.type || 'text',
        content: messageData.content || null,
        media_url: messageData.media_url || null,
        duration_sec: messageData.duration_sec || null,
        is_read: false
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/messages')
    return { data: data as Message, error: null }
  } catch (error: any) {
    console.error('Errore sendMessage:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Crea un nuovo thread per comunicare con la famiglia o con lo staff clinico
 */
export async function createMessageThread(patientId: string, title: string) {
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
      .from('message_threads')
      .insert({
        patient_id: patientId,
        structure_id: profile.structure_id,
        title,
        is_group: true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/messages')
    return { data: data as MessageThread, error: null }
  } catch (error: any) {
    console.error('Errore createMessageThread:', error.message)
    return { data: null, error: error.message }
  }
}
