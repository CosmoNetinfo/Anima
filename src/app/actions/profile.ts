'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Aggiorna le preferenze di accessibilità del profilo dell'utente loggato
 */
export async function updateProfileAccessibilitySettings(settings: {
  large_font_mode: boolean
  high_contrast_mode: boolean
  motion_reduced: boolean
}) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        large_font_mode: settings.large_font_mode,
        high_contrast_mode: settings.high_contrast_mode,
        motion_reduced: settings.motion_reduced,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/settings')
    return { data, error: null }
  } catch (error: any) {
    console.error('Errore updateProfileAccessibilitySettings:', error.message)
    return { data: null, error: error.message }
  }
}
