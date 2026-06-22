'use server'

import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Ottiene tutti i profili utente della struttura del gestore
 */
export async function getUsers() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('structure_id, role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      throw new Error('Accesso negato: solo gli amministratori possono gestire gli utenti')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('structure_id', adminProfile.structure_id)
      .order('full_name', { ascending: true })

    if (error) throw error
    return { data: data as Profile[], error: null }
  } catch (error: any) {
    console.error('Errore getUsers:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Aggiorna il ruolo o lo stato attivo di un profilo utente
 */
export async function updateProfile(profileId: string, updates: { role: string; is_active: boolean }) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      throw new Error('Solo gli amministratori possono modificare i profili')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: updates.role,
        is_active: updates.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin')
    return { data, error: null }
  } catch (error: any) {
    console.error('Errore updateProfile:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Ottiene il registro degli audit log
 */
export async function getAuditLogs() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      throw new Error('Solo gli amministratori possono esaminare i log')
    }

    const { data, error } = await supabase
      .from('audit_log')
      .select(`
        *,
        profile:profiles(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return { data: data as any[], error: null }
  } catch (error: any) {
    console.error('Errore getAuditLogs:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Invita un utente creando un profilo fittizio per simularne l'invito
 */
export async function inviteUser(email: string, fullName: string, role: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('structure_id, role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      throw new Error('Solo gli amministratori possono invitare utenti')
    }

    // Nota: in un ambiente reale si utilizzerebbe supabase.auth.admin.inviteUserByEmail()
    // Per finalità dimostrative nel PWA mockiamo inserendo direttamente una riga nel database profiles
    // Generiamo un ID fittizio (UUID casuale) per l'utente non ancora loggato
    const fakeUserId = crypto.randomUUID()

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: fakeUserId,
        structure_id: adminProfile.structure_id,
        role,
        full_name: fullName,
        is_active: true,
        large_font_mode: false,
        motion_reduced: false,
        high_contrast_mode: false,
        emergency_contacts: []
      })
      .select()
      .single()

    if (error) throw error

    // Scrivi nell'audit log
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'user_invited',
      resource_type: 'profile',
      resource_id: fakeUserId,
      metadata: { invited_email: email, role }
    })

    revalidatePath('/admin')
    return { data, error: null }
  } catch (error: any) {
    console.error('Errore inviteUser:', error.message)
    return { data: null, error: error.message }
  }
}
