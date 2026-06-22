'use server'

import { createClient } from '@/lib/supabase/server'
import { VitalSign, VitalType } from '@/types'
import { revalidatePath } from 'next/cache'

// Definisce le soglie standard di default per ciascun parametro
const DEFAULT_THRESHOLDS: Record<VitalType, { min?: number; max?: number; unit: string }> = {
  blood_pressure_sys: { min: 90, max: 140, unit: 'mmHg' },
  blood_pressure_dia: { min: 60, max: 90, unit: 'mmHg' },
  heart_rate: { min: 50, max: 100, unit: 'bpm' },
  temperature: { min: 35.5, max: 37.5, unit: '°C' },
  oxygen_saturation: { min: 92, max: 100, unit: '%' },
  blood_glucose: { min: 70, max: 140, unit: 'mg/dL' },
  weight: { min: 40, max: 150, unit: 'kg' },
  height: { unit: 'cm' },
  respiratory_rate: { min: 12, max: 22, unit: 'atti/min' }
}

/**
 * Recupera le misurazioni dei parametri vitali
 */
export async function getVitalSigns(patientId: string, type?: VitalType, days = 30) {
  try {
    const supabase = await createClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabase
      .from('vital_signs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    if (error) throw error
    return { data: data as VitalSign[], error: null }
  } catch (error: any) {
    console.error('Errore getVitalSigns:', error.message)
    return { data: null, error: error.message }
  }
}

/**
 * Inserisce una nuova misurazione e controlla se supera le soglie impostando is_alert
 */
export async function addVitalSign(vitalData: {
  patient_id: string
  type: VitalType
  value: number
  notes?: string
}) {
  try {
    const supabase = await createClient()

    // Controllo utente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    // Trova le soglie per questa struttura o paziente se esistono, altrimenti usa i default
    const { data: threshold } = await supabase
      .from('vital_thresholds')
      .select('*')
      .eq('vital_type', vitalData.type)
      .or(`patient_id.eq.${vitalData.patient_id},structure_id.is.null`)
      .maybeSingle()

    const limits = threshold || DEFAULT_THRESHOLDS[vitalData.type]
    const unit = DEFAULT_THRESHOLDS[vitalData.type]?.unit || ''

    let is_alert = false
    if (limits) {
      const min = limits.min_value !== undefined ? Number(limits.min_value) : limits.min
      const max = limits.max_value !== undefined ? Number(limits.max_value) : limits.max
      if (min !== undefined && vitalData.value < min) is_alert = true
      if (max !== undefined && vitalData.value > max) is_alert = true
    }

    const { data, error } = await supabase
      .from('vital_signs')
      .insert({
        patient_id: vitalData.patient_id,
        recorded_by: user.id,
        type: vitalData.type,
        value: vitalData.value,
        unit,
        is_alert,
        notes: vitalData.notes || null,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Se c'è un alert, inseriamo un log e avvisiamo
    if (is_alert) {
      await supabase.from('activity_log').insert({
        patient_id: vitalData.patient_id,
        performed_by: user.id,
        action_type: 'vital_sign_alert',
        description: `ALERT: Parametro ${vitalData.type} fuori soglia (${vitalData.value} ${unit})`,
        metadata: { type: vitalData.type, value: vitalData.value }
      })
    }

    revalidatePath(`/patients/${vitalData.patient_id}/vitals`)
    return { data: data as VitalSign, error: null }
  } catch (error: any) {
    console.error('Errore addVitalSign:', error.message)
    return { data: null, error: error.message }
  }
}
