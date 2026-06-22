'use server'

import { createClient } from '@/lib/supabase/server'
import { Memory, MemoryReaction } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Recupera la bacheca dei ricordi per un paziente
 */
export async function getMemories(patientId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('memories')
      .select(`
        *,
        author_profile:profiles!memories_author_id_fkey(full_name, avatar_url, role),
        reactions:memory_reactions(
          id,
          emoji,
          user_id,
          profile:profiles(full_name)
        )
      `)
      .eq('patient_id', patientId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as any[], error: null }
  } catch (error: any) {
    console.error('Errore getMemories:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Crea un nuovo ricordo (testo, foto, audio)
 */
export async function createMemory(memoryData: {
  patient_id: string
  type: 'photo' | 'text' | 'audio'
  content?: string
  media_url?: string
  duration_sec?: number
}) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    const { data, error } = await supabase
      .from('memories')
      .insert({
        patient_id: memoryData.patient_id,
        author_id: user.id,
        type: memoryData.type,
        content: memoryData.content || null,
        media_url: memoryData.media_url || null,
        duration_sec: memoryData.duration_sec || null,
        is_pinned: false,
        likes: 0
      })
      .select()
      .single()

    if (error) throw error

    // Logga nel diario attività della struttura
    await supabase.from('activity_log').insert({
      patient_id: memoryData.patient_id,
      performed_by: user.id,
      action_type: 'memory_added',
      description: `Nuovo ricordo aggiunto (${memoryData.type})`,
      metadata: { type: memoryData.type }
    })

    revalidatePath(`/patients/${memoryData.patient_id}/memories`)
    revalidatePath('/memoriae')
    return { data: data as Memory, error: null }
  } catch (error: any) {
    console.error('Errore createMemory:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Gestisce l'aggiunta o rimozione di una reazione emoji a un ricordo
 */
export async function toggleReaction(memoryId: string, emoji: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    // Controlla se l'utente ha già reagito con questa emoji
    const { data: existing } = await supabase
      .from('memory_reactions')
      .select('id')
      .eq('memory_id', memoryId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle()

    if (existing) {
      // Rimuovi reazione
      const { error } = await supabase
        .from('memory_reactions')
        .delete()
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Inserisci reazione
      const { error } = await supabase
        .from('memory_reactions')
        .insert({
          memory_id: memoryId,
          user_id: user.id,
          emoji
        })

      if (error) throw error
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Errore toggleReaction:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Upload di un file (foto o audio) convertito in base64 tramite Server Action
 */
export async function uploadMemoryFile(base64Data: string, fileName: string, contentType: string) {
  try {
    const supabase = await createClient()

    // Converte la stringa base64 in buffer
    const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64')

    const { data, error } = await supabase.storage
      .from('memories')
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      })

    if (error) throw error

    // Genera URL pubblico
    const { data: { publicUrl } } = supabase.storage
      .from('memories')
      .getPublicUrl(fileName)

    return { publicUrl, error: null }
  } catch (error: any) {
    console.error('Errore uploadMemoryFile:', error.message)
    return { publicUrl: null, error: error.message }
  }
}
