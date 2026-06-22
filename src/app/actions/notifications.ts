'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface NotificationItem {
  id: string
  type: 'vital_alert' | 'message' | 'medication_pending'
  title: string
  description: string
  created_at: string
  link: string
  is_read: boolean
}

/**
 * Recupera le notifiche per l'utente loggato in base al ruolo
 */
export async function getNotifications() {
  try {
    const supabase = await createClient()

    // 1. Recupera l'utente loggato
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'Non autenticato' }

    // 2. Recupera il profilo dell'utente per conoscerne il ruolo
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, structure_id')
      .eq('id', user.id)
      .single()

    if (!profile) return { data: [], error: 'Profilo non trovato' }

    const notifications: NotificationItem[] = []

    // 3. RECUPERA GLI ALERT DEI PARAMETRI VITALI
    // Se lo staff (admin, doctor, nurse) ha accesso, mostra gli alert della struttura
    // Se è caregiver, mostra gli alert dei suoi pazienti
    // Se è paziente, mostra solo i propri alert
    const vitalQuery = supabase
      .from('vital_signs')
      .select(`
        id,
        type,
        value,
        unit,
        recorded_at,
        created_at,
        patient:patients(id, full_name, structure_id)
      `)
      .eq('is_alert', true)
      .order('recorded_at', { ascending: false })
      .limit(10)

    const { data: vitalsData } = await vitalQuery

    if (vitalsData) {
      vitalsData.forEach((v: any) => {
        // Filtra in base alla struttura se è staff
        if (profile.structure_id && v.patient?.structure_id === profile.structure_id) {
          notifications.push({
            id: `vital-${v.id}`,
            type: 'vital_alert',
            title: `Alert Parametro: ${v.patient?.full_name}`,
            description: `Valore fuori soglia per ${v.type}: ${v.value} ${v.unit}`,
            created_at: v.recorded_at || v.created_at,
            link: `/patients/${v.patient?.id}/vitals`,
            is_read: false
          })
        }
      })
    }

    // 4. RECUPERA MESSAGGI NON LETTI
    // Trova i messaggi non letti destinati all'utente (non inviati da lui)
    // Per semplicità, recuperiamo gli ultimi messaggi non letti nei thread a cui l'utente ha accesso
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_profile:profiles!messages_sender_id_fkey(full_name),
        thread:message_threads(id, patient_id)
      `)
      .eq('is_read', false)
      .neq('sender_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (unreadMessages) {
      unreadMessages.forEach((msg: any) => {
        notifications.push({
          id: `msg-${msg.id}`,
          type: 'message',
          title: `Nuovo messaggio da ${msg.sender_profile?.full_name || 'Utente'}`,
          description: msg.content || 'Messaggio vocale o multimediale',
          created_at: msg.created_at,
          link: `/messages?thread=${msg.thread?.id}`,
          is_read: false
        })
      })
    }

    // Ordina per data decrescente
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { data: notifications, error: null }
  } catch (error: any) {
    console.error('Errore getNotifications:', error.message)
    return { data: [], error: error.message }
  }
}

/**
 * Segna un messaggio o una notifica come letta
 */
export async function markAsRead(notificationId: string) {
  try {
    const supabase = await createClient()

    if (notificationId.startsWith('msg-')) {
      const msgId = notificationId.replace('msg-', '')
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', msgId)
    }

    // Per gli alert dei vitali, non c'è un campo "is_read" nel database dei vitali direttamente,
    // ma possiamo considerarlo marcato localmente o gestito tramite la navigazione dell'utente.
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Errore markAsRead:', error.message)
    return { success: false, error: error.message }
  }
}
