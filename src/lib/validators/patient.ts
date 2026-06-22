import { z } from 'zod'

export const patientSchema = z.object({
  full_name: z.string().min(3, 'Il nome completo deve contenere almeno 3 caratteri'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La data di nascita deve essere nel formato AAAA-MM-GG'),
  gender: z.enum(['M', 'F', 'altro']).optional(),
  fiscal_code: z.string().regex(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i, 'Codice Fiscale non valido').optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
  room_number: z.string().min(1, 'Inserisci il numero di stanza').optional().or(z.literal('')),
  ward: z.string().min(1, 'Inserisci il reparto').optional().or(z.literal('')),
  admission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La data di ingresso deve essere nel formato AAAA-MM-GG').optional().or(z.literal('')),
  notes: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  chronic_conditions: z.array(z.string()).default([]),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']).optional().or(z.literal('')),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  is_active: z.boolean().default(true),
  large_font_mode: z.boolean().default(false),
  high_contrast_mode: z.boolean().default(false),
})

export type PatientFormInput = z.infer<typeof patientSchema>
