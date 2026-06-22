export type UserRole = 'patient' | 'caregiver' | 'nurse' | 'doctor' | 'admin' | 'super_admin'
export type MoodType = 'felice' | 'normale' | 'triste' | 'agitato' | 'confuso'
export type MessageType = 'text' | 'audio' | 'image' | 'system'
export type MemoryType = 'photo' | 'text' | 'audio'
export type VitalType =
  | 'blood_pressure_sys' | 'blood_pressure_dia'
  | 'heart_rate' | 'temperature'
  | 'oxygen_saturation' | 'blood_glucose'
  | 'weight' | 'height' | 'respiratory_rate'

export interface Structure {
  id: string
  name: string
  type: 'rsa' | 'asl' | 'ambulatorio' | 'ospedale' | 'privato'
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  settings?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export interface Profile {
  id: string
  structure_id: string
  role: UserRole
  full_name: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  large_font_mode: boolean
  motion_reduced: boolean
  high_contrast_mode: boolean
  emergency_contacts: EmergencyContact[]
  structures?: Structure
  created_at?: string
  updated_at?: string
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface Patient {
  id: string
  structure_id: string
  profile_id?: string
  full_name: string
  birth_date: string
  gender?: 'M' | 'F' | 'altro'
  fiscal_code?: string
  address?: string
  phone?: string
  room_number?: string
  ward?: string
  admission_date?: string
  notes?: string
  allergies?: string[]
  chronic_conditions?: string[]
  blood_type?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  large_font_mode: boolean
  high_contrast_mode: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Medication {
  id: string
  patient_id: string
  prescribed_by?: string
  name: string
  active_principle?: string
  dosage: string
  route?: string
  schedule: { times: string[]; days: string }
  start_date: string
  end_date?: string
  notes?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface MedicationLog {
  id: string
  medication_id: string
  patient_id: string
  scheduled_time: string
  administered_at?: string
  administered_by?: string
  status: 'pending' | 'given' | 'skipped' | 'refused'
  skip_reason?: string
  notes?: string
  created_at?: string
  administered_by_profile?: {
    full_name: string
  }
}

export interface VitalSign {
  id: string
  patient_id: string
  recorded_by?: string
  type: VitalType
  value: number
  unit: string
  is_alert: boolean
  notes?: string
  recorded_at: string
  created_at?: string
}

export interface MoodEntry {
  id: string
  patient_id: string
  recorded_by?: string
  mood: MoodType
  notes?: string
  recorded_at: string
  created_at?: string
  profiles?: Profile
}

export interface Memory {
  id: string
  patient_id: string
  author_id: string
  type: MemoryType
  content?: string
  media_url?: string
  thumbnail_url?: string
  duration_sec?: number
  is_pinned: boolean
  likes: number
  created_at: string
  updated_at?: string
  profiles?: Profile
  memory_reactions?: MemoryReaction[]
  author_profile?: { full_name: string; avatar_url?: string; role: string }
  reactions?: MemoryReaction[]
}

export interface MemoryReaction {
  id: string
  memory_id: string
  user_id: string
  emoji: string
  created_at?: string
  profiles?: Profile
}

export interface ClinicalNote {
  id: string
  patient_id: string
  author_id: string
  category: 'general' | 'medical' | 'nursing' | 'psychological' | 'nutritional' | 'physiotherapy' | 'family_communication'
  content: string
  is_private: boolean
  attachments?: string[]
  created_at: string
  updated_at?: string
  profiles?: Profile
  author_profile?: {
    full_name: string
    role: string
  }
}

export interface Appointment {
  id: string
  patient_id?: string
  structure_id?: string
  created_by?: string
  title: string
  description?: string
  location?: string
  appointment_at: string
  duration_min: number
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'missed'
  reminder_sent?: boolean
  notes?: string
  created_at?: string
  updated_at?: string
  patient?: Patient
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  type: MessageType
  content?: string
  media_url?: string
  duration_sec?: number
  is_read: boolean
  read_at?: string
  created_at: string
  profiles?: Profile
  sender_profile?: {
    full_name: string
    role: string
    avatar_url?: string
  }
}

export interface MessageThread {
  id: string
  patient_id?: string
  structure_id: string
  title?: string
  is_group: boolean
  created_at: string
  patients?: Patient
  patient?: Patient
  messages?: Message[]
}
