'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patientSchema, PatientFormInput } from '@/lib/validators/patient'
import { Patient } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface PatientFormProps {
  initialData?: Patient | null
  onSubmit: (data: PatientFormInput) => Promise<{ success: boolean; data: unknown }>
  onCancel: () => void
}

export function PatientForm({ initialData, onSubmit, onCancel }: PatientFormProps) {
  // Converti gli array in stringhe separate da virgola per l'input semplificato dell'utente
  const defaultAllergiesString = initialData?.allergies?.join(', ') || ''
  const defaultConditionsString = initialData?.chronic_conditions?.join(', ') || ''

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      birth_date: initialData?.birth_date || '',
      gender: initialData?.gender || 'M',
      fiscal_code: initialData?.fiscal_code || '',
      room_number: initialData?.room_number || '',
      ward: initialData?.ward || '',
      admission_date: initialData?.admission_date || '',
      notes: initialData?.notes || '',
      allergies: initialData?.allergies || [],
      chronic_conditions: initialData?.chronic_conditions || [],
      blood_type: (initialData?.blood_type as PatientFormInput['blood_type']) || '',
      emergency_contact_name: initialData?.emergency_contact_name || '',
      emergency_contact_phone: initialData?.emergency_contact_phone || '',
      is_active: initialData?.is_active ?? true,
      large_font_mode: initialData?.large_font_mode ?? false,
      high_contrast_mode: initialData?.high_contrast_mode ?? false,
    },
  })

  const genderValue = watch('gender')
  const bloodTypeValue = watch('blood_type')

  const onFormSubmit = async (data: PatientFormInput) => {
    // Il submit si aspetta gli array di stringhe, che gestiamo direttamente nel submit handler di react-hook-form
    const response = await onSubmit(data)
    if (!response.success) {
      toast.error('Errore nel salvataggio dei dati.')
    }
  }

  // Helper per convertire la stringa di input in array
  const handleCommaSeparatedInput = (fieldName: 'allergies' | 'chronic_conditions', val: string) => {
    const list = val
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '')
    setValue(fieldName, list)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome Completo */}
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo</Label>
          <Input id="full_name" type="text" {...register('full_name')} placeholder="Es: Mario Rossi" />
          {errors.full_name && <p className="text-xs text-danger font-medium">{errors.full_name.message}</p>}
        </div>

        {/* Codice Fiscale */}
        <div className="space-y-2">
          <Label htmlFor="fiscal_code">Codice Fiscale</Label>
          <Input
            id="fiscal_code"
            type="text"
            className="uppercase"
            {...register('fiscal_code')}
            placeholder="Es: RSSMRA40A01F205X"
          />
          {errors.fiscal_code && <p className="text-xs text-danger font-medium">{errors.fiscal_code.message}</p>}
        </div>

        {/* Data di Nascita */}
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data di Nascita</Label>
          <Input id="birth_date" type="date" {...register('birth_date')} />
          {errors.birth_date && <p className="text-xs text-danger font-medium">{errors.birth_date.message}</p>}
        </div>

        {/* Genere */}
        <div className="space-y-2">
          <Label htmlFor="gender">Genere</Label>
          <Select value={genderValue} onValueChange={(val) => setValue('gender', val as 'M' | 'F' | 'altro')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona genere" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Maschio</SelectItem>
              <SelectItem value="F">Femmina</SelectItem>
              <SelectItem value="altro">Altro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reparto */}
        <div className="space-y-2">
          <Label htmlFor="ward">Reparto</Label>
          <Input id="ward" type="text" {...register('ward')} placeholder="Es: Alzheimer" />
          {errors.ward && <p className="text-xs text-danger font-medium">{errors.ward.message}</p>}
        </div>

        {/* Stanza */}
        <div className="space-y-2">
          <Label htmlFor="room_number">Numero Stanza</Label>
          <Input id="room_number" type="text" {...register('room_number')} placeholder="Es: 104" />
          {errors.room_number && <p className="text-xs text-danger font-medium">{errors.room_number.message}</p>}
        </div>

        {/* Data Ingresso */}
        <div className="space-y-2">
          <Label htmlFor="admission_date">Data di Ingresso</Label>
          <Input id="admission_date" type="date" {...register('admission_date')} />
          {errors.admission_date && <p className="text-xs text-danger font-medium">{errors.admission_date.message}</p>}
        </div>

        {/* Gruppo Sanguigno */}
        <div className="space-y-2">
          <Label htmlFor="blood_type">Gruppo Sanguigno</Label>
          <Select value={bloodTypeValue} onValueChange={(val) => setValue('blood_type', val as PatientFormInput['blood_type'])}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona gruppo" />
            </SelectTrigger>
            <SelectContent>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contatto Emergenza Nome */}
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Nome Contatto Emergenza</Label>
          <Input id="emergency_contact_name" type="text" {...register('emergency_contact_name')} placeholder="Es: Luigi Rossi" />
        </div>

        {/* Contatto Emergenza Telefono */}
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Telefono Contatto Emergenza</Label>
          <Input id="emergency_contact_phone" type="tel" {...register('emergency_contact_phone')} placeholder="Es: +39 333 1234567" />
        </div>

        {/* Allergie (separate da virgola) */}
        <div className="space-y-2">
          <Label htmlFor="allergies_input">Allergie (separate da virgola)</Label>
          <Input
            id="allergies_input"
            type="text"
            defaultValue={defaultAllergiesString}
            onChange={(e) => handleCommaSeparatedInput('allergies', e.target.value)}
            placeholder="Es: Penicillina, Lattosio"
          />
        </div>

        {/* Patologie Croniche (separate da virgola) */}
        <div className="space-y-2">
          <Label htmlFor="conditions_input">Patologie Croniche (separate da virgola)</Label>
          <Input
            id="conditions_input"
            type="text"
            defaultValue={defaultConditionsString}
            onChange={(e) => handleCommaSeparatedInput('chronic_conditions', e.target.value)}
            placeholder="Es: Diabete Tipo 2, Ipertensione"
          />
        </div>
      </div>

      {/* Note Cliniche Generali */}
      <div className="space-y-2">
        <Label htmlFor="notes">Note / Diario Clinico di Base</Label>
        <Textarea id="notes" rows={3} {...register('notes')} placeholder="Dettagli clinici utili del paziente..." />
      </div>

      {/* Toggles di Stato ed Accessibilità */}
      <div className="bg-muted/40 border border-border p-4 rounded-xl space-y-3">
        <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">Accesso e Stato</span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" {...register('is_active')} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
            <span>Paziente Attivo</span>
          </label>
        </div>
      </div>

      {/* Pulsanti invio/annulla */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annulla
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvataggio...' : 'Salva Paziente'}
        </Button>
      </div>
    </form>
  )
}
