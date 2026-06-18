-- Estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- STRUTTURE SANITARIE
-- =============================================
CREATE TABLE structures (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('rsa', 'asl', 'ambulatorio', 'ospedale', 'privato')),
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  logo_url    TEXT,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROFILI UTENTE
-- =============================================
CREATE TABLE profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  structure_id  UUID REFERENCES structures(id) ON DELETE SET NULL,
  role          TEXT NOT NULL CHECK (role IN ('patient', 'caregiver', 'nurse', 'doctor', 'admin', 'super_admin')),
  full_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  -- Campi extra per ruolo paziente (da Memora)
  large_font_mode     BOOLEAN DEFAULT FALSE,
  motion_reduced      BOOLEAN DEFAULT FALSE,
  high_contrast_mode  BOOLEAN DEFAULT FALSE,
  emergency_contacts  JSONB DEFAULT '[]',  -- [{name, phone, relationship}]
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAZIENTI
-- =============================================
CREATE TABLE patients (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  structure_id            UUID REFERENCES structures(id) ON DELETE CASCADE NOT NULL,
  profile_id              UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name               TEXT NOT NULL,
  birth_date              DATE NOT NULL,
  gender                  TEXT CHECK (gender IN ('M', 'F', 'altro')),
  fiscal_code             TEXT,
  address                 TEXT,
  phone                   TEXT,
  room_number             TEXT,
  ward                    TEXT,
  admission_date          DATE,
  notes                   TEXT,
  allergies               TEXT[],
  chronic_conditions      TEXT[],
  blood_type              TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  is_active               BOOLEAN DEFAULT TRUE,
  -- Campi accessibilità (da Memora)
  large_font_mode         BOOLEAN DEFAULT FALSE,
  high_contrast_mode      BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RELAZIONE PAZIENTE ↔ CAREGIVER
-- =============================================
CREATE TABLE patient_caregivers (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  caregiver_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  relationship    TEXT,
  access_level    TEXT DEFAULT 'read' CHECK (access_level IN ('read', 'full')),
  consent_given   BOOLEAN DEFAULT FALSE,
  consent_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, caregiver_id)
);

-- =============================================
-- FARMACI E TERAPIA
-- =============================================
CREATE TABLE medications (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  prescribed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  active_principle TEXT,
  dosage          TEXT NOT NULL,
  route           TEXT,
  schedule        JSONB NOT NULL,  -- {"times": ["08:00", "14:00"], "days": "daily"}
  start_date      DATE NOT NULL,
  end_date        DATE,
  notes           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medication_logs (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medication_id   UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  scheduled_time  TIMESTAMPTZ NOT NULL,
  administered_at TIMESTAMPTZ,
  administered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'given', 'skipped', 'refused')),
  skip_reason     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARAMETRI VITALI
-- =============================================
CREATE TABLE vital_signs (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN (
                'blood_pressure_sys',
                'blood_pressure_dia',
                'heart_rate',
                'temperature',
                'oxygen_saturation',
                'blood_glucose',
                'weight',
                'height',
                'respiratory_rate'
              )),
  value       DECIMAL(8,2) NOT NULL,
  unit        TEXT NOT NULL,
  is_alert    BOOLEAN DEFAULT FALSE,
  notes       TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vital_thresholds (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  vital_type   TEXT NOT NULL,
  min_value    DECIMAL(8,2),
  max_value    DECIMAL(8,2),
  alert_roles  TEXT[] DEFAULT ARRAY['doctor'],
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DIARIO CLINICO
-- =============================================
CREATE TABLE clinical_notes (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  category    TEXT DEFAULT 'general' CHECK (category IN (
                'general', 'medical', 'nursing', 'psychological',
                'nutritional', 'physiotherapy', 'family_communication'
              )),
  content     TEXT NOT NULL,
  is_private  BOOLEAN DEFAULT FALSE,
  attachments TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- APPUNTAMENTI
-- =============================================
CREATE TABLE appointments (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id     UUID REFERENCES patients(id) ON DELETE CASCADE,
  structure_id   UUID REFERENCES structures(id) ON DELETE CASCADE,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  location       TEXT,
  appointment_at TIMESTAMPTZ NOT NULL,
  duration_min   INTEGER DEFAULT 30,
  status         TEXT DEFAULT 'scheduled' CHECK (status IN (
                   'scheduled', 'confirmed', 'completed', 'cancelled', 'missed'
                 )),
  reminder_sent  BOOLEAN DEFAULT FALSE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MOOD TRACKER (da Memora)
-- =============================================
CREATE TABLE mood_entries (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  mood        TEXT NOT NULL CHECK (mood IN ('felice', 'normale', 'triste', 'agitato', 'confuso')),
  notes       TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FEED MEMORIAE (da Memora) — bacheca ricordi condivisi
-- =============================================
CREATE TABLE memories (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('photo', 'text', 'audio')),
  content     TEXT,          -- testo oppure caption foto
  media_url   TEXT,          -- URL Supabase Storage (foto o audio)
  thumbnail_url TEXT,        -- thumbnail per foto
  duration_sec INTEGER,      -- durata audio in secondi
  is_pinned   BOOLEAN DEFAULT FALSE,
  likes       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Reazioni ai ricordi
CREATE TABLE memory_reactions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  memory_id   UUID REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '❤️',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

-- =============================================
-- MESSAGGISTICA (da entrambi)
-- =============================================
CREATE TABLE message_threads (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES structures(id) ON DELETE CASCADE NOT NULL,
  title        TEXT,
  is_group     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id    UUID REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id    UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  type         TEXT DEFAULT 'text' CHECK (type IN ('text', 'audio', 'image', 'system')),
  content      TEXT,          -- testo oppure trascrizione audio
  media_url    TEXT,          -- URL Supabase Storage per audio/immagini
  duration_sec INTEGER,       -- durata audio
  is_read      BOOLEAN DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REGISTRO ATTIVITÀ (da Memora)
-- =============================================
CREATE TABLE activity_log (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  performed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type   TEXT NOT NULL,   -- 'task_added', 'task_completed', 'mood_updated', 'memory_added', ecc.
  description   TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- =============================================
CREATE TABLE push_subscriptions (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- =============================================
-- PRESENZA ONLINE (da Memora)
-- =============================================
CREATE TABLE user_presence (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  is_online  BOOLEAN DEFAULT FALSE,
  last_seen  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOG (da CareLink) — IMMUTABILE
-- =============================================
CREATE TABLE audit_log (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  patient_id    UUID,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TRIGGER: updated_at automatico
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_structures_updated_at       BEFORE UPDATE ON structures       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at         BEFORE UPDATE ON profiles         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated_at         BEFORE UPDATE ON patients         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_medications_updated_at      BEFORE UPDATE ON medications      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clinical_notes_updated_at   BEFORE UPDATE ON clinical_notes   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at     BEFORE UPDATE ON appointments     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_memories_updated_at         BEFORE UPDATE ON memories         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
