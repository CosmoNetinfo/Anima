# ANIMA — Technical Brief Completo per AI Developer
> Documento di specifiche tecniche per implementazione da zero  
> Autore: Daniele Spalletti (DanyWolf) — CosmoNetinfo — Giugno 2026  
> Versione: 1.0  
> **Documento riservato — non distribuire**

---

## ISTRUZIONI PER L'AI

Questo documento contiene **tutto il necessario** per sviluppare Anima da zero.
- Non fare assunzioni fuori da questo documento
- Se qualcosa non è specificato, chiedi prima di procedere
- Segui l'ordine delle fasi nella roadmap — non saltare fasi
- Inizia sempre dalla Fase 0
- Usa **sempre TypeScript** — nessun file `.js` nel progetto
- Rispetta esattamente lo stack definito nella sezione 2

---

## 1. Descrizione del Progetto

**Anima** è una Progressive Web App (PWA) per la gestione integrata della cura di pazienti affetti da Alzheimer e patologie correlate. Nasce dalla fusione di due progetti:

- **Memora** — app focalizzata su UX accessibile per pazienti Alzheimer, mood tracking, feed di ricordi condivisi (Memoriae), messaggistica vocale, SOS
- **CareLink** — gestionale clinico per strutture sanitarie (RSA, ASL): farmaci, parametri vitali, diario clinico, terapie, export PDF, audit log

Anima unisce le due anime: **l'interfaccia umana e rassicurante di Memora** con **la potenza clinica di CareLink**, in un'unica applicazione proprietaria.

**Target utenti:**
- Pazienti con Alzheimer (interfaccia semplificata, alto contrasto)
- Familiari / Caregiver (monitoraggio remoto, comunicazione)
- Infermieri (somministrazioni, parametri vitali, turni)
- Medici (fascicolo clinico, prescrizioni, analytics)
- Admin struttura (gestione utenti, audit, KPI)

**Infrastruttura:**
- Hosting: **Vercel**
- Database: **Supabase** (nuovo progetto dedicato, EU Frankfurt)
- Repository: **CosmoNetinfo/Anima** (GitHub, privato)

---

## 2. Stack Tecnologico — DEFINITIVO

```
Framework        Next.js 14 (App Router, TypeScript)
UI Components    shadcn/ui + Tailwind CSS v3
Animazioni       Framer Motion (per interfaccia paziente)
Database         Supabase (PostgreSQL, RLS)
Auth             Supabase Auth (email/password + magic link)
Storage          Supabase Storage (audio messaggi, foto ricordi, allegati)
Realtime         Supabase Realtime (chat, feed Memoriae, presenza)
State            Zustand
Grafici          Recharts
PDF Export       @react-pdf/renderer
Form             react-hook-form + zod
Date             date-fns (locale: it)
Icons            Lucide React
PWA              @ducanh2912/next-pwa
Web Push         web-push (VAPID)
Hosting          Vercel
Repo             GitHub privato (CosmoNetinfo/Anima)
```

**NON usare:**
- Firebase
- Redux
- Prisma
- Material UI o Ant Design
- Capacitor (non è un'app mobile nativa)
- Tauri (non è desktop)
- CSS vanilla (usare solo Tailwind)

---

## 3. Variabili d'Ambiente

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[progetto-anima].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Solo server-side, MAI esposta al client

# App
NEXT_PUBLIC_APP_URL=https://anima.vercel.app
NEXT_PUBLIC_APP_NAME=Anima

# Web Push (genera con: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJ...
VAPID_PRIVATE_KEY=xxx...
VAPID_SUBJECT=mailto:admin@anima.app

# Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://[progetto-anima].supabase.co/storage/v1
```

---

## 4. Schema Database Completo (PostgreSQL / Supabase)

### Migration 001 — Schema Principale

```sql
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
```

### Migration 002 — RLS (Row Level Security)

```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_structure_id()
RETURNS UUID AS $$
  SELECT structure_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_caregiver_of(p_patient_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM patient_caregivers
    WHERE patient_id = p_patient_id
    AND caregiver_id = auth.uid()
    AND consent_given = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_patient_self(p_patient_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM patients
    WHERE id = p_patient_id AND profile_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Utente vede il proprio profilo" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Staff vede profili della struttura" ON profiles
  FOR SELECT USING (
    get_user_role() IN ('admin', 'super_admin', 'doctor', 'nurse')
    AND structure_id = get_user_structure_id()
  );

CREATE POLICY "Utente aggiorna il proprio profilo" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admin inserisce profili" ON profiles
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'super_admin'));

-- PATIENTS
CREATE POLICY "Staff vede pazienti della struttura" ON patients
  FOR SELECT USING (
    get_user_role() IN ('admin', 'super_admin', 'doctor', 'nurse')
    AND structure_id = get_user_structure_id()
  );

CREATE POLICY "Paziente vede se stesso" ON patients
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Caregiver vede il proprio paziente" ON patients
  FOR SELECT USING (is_caregiver_of(id));

CREATE POLICY "Doctor/Admin gestisce pazienti" ON patients
  FOR ALL USING (
    get_user_role() IN ('admin', 'super_admin', 'doctor')
    AND structure_id = get_user_structure_id()
  );

-- MEDICATIONS
CREATE POLICY "Staff vede farmaci" ON medications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = medications.patient_id
      AND p.structure_id = get_user_structure_id()
      AND get_user_role() IN ('admin', 'super_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Paziente e caregiver vedono i farmaci" ON medications
  FOR SELECT USING (
    is_patient_self(patient_id) OR is_caregiver_of(patient_id)
  );

CREATE POLICY "Doctor prescrive farmaci" ON medications
  FOR ALL USING (
    get_user_role() IN ('admin', 'super_admin', 'doctor')
    AND EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND structure_id = get_user_structure_id())
  );

-- MEDICATION_LOGS
CREATE POLICY "Staff vede log somministrazioni" ON medication_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = medication_logs.patient_id
      AND p.structure_id = get_user_structure_id()
      AND get_user_role() IN ('admin', 'super_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Caregiver e paziente vedono i log" ON medication_logs
  FOR SELECT USING (
    is_patient_self(patient_id) OR is_caregiver_of(patient_id)
  );

CREATE POLICY "Staff inserisce log somministrazioni" ON medication_logs
  FOR INSERT WITH CHECK (
    get_user_role() IN ('nurse', 'doctor', 'admin', 'super_admin')
    AND EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND structure_id = get_user_structure_id())
  );

-- VITAL_SIGNS
CREATE POLICY "Staff vede parametri vitali" ON vital_signs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = vital_signs.patient_id
      AND p.structure_id = get_user_structure_id()
      AND get_user_role() IN ('admin', 'super_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Paziente e caregiver vedono i parametri" ON vital_signs
  FOR SELECT USING (
    is_patient_self(patient_id) OR is_caregiver_of(patient_id)
  );

CREATE POLICY "Staff inserisce parametri vitali" ON vital_signs
  FOR INSERT WITH CHECK (
    get_user_role() IN ('nurse', 'doctor', 'admin', 'super_admin')
    AND EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND structure_id = get_user_structure_id())
  );

-- CLINICAL_NOTES
CREATE POLICY "Staff vede note cliniche" ON clinical_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = clinical_notes.patient_id
      AND p.structure_id = get_user_structure_id()
      AND get_user_role() IN ('admin', 'super_admin', 'doctor', 'nurse')
    )
    AND (is_private = FALSE OR get_user_role() IN ('admin', 'super_admin', 'doctor'))
  );

CREATE POLICY "Caregiver vede note non private" ON clinical_notes
  FOR SELECT USING (
    is_caregiver_of(patient_id) AND is_private = FALSE
  );

CREATE POLICY "Staff inserisce note cliniche" ON clinical_notes
  FOR INSERT WITH CHECK (
    get_user_role() IN ('doctor', 'nurse', 'admin', 'super_admin')
    AND EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND structure_id = get_user_structure_id())
  );

-- MOOD_ENTRIES
CREATE POLICY "Staff vede umore" ON mood_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = mood_entries.patient_id
      AND p.structure_id = get_user_structure_id()
      AND get_user_role() IN ('admin', 'super_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Paziente e caregiver vedono umore" ON mood_entries
  FOR SELECT USING (
    is_patient_self(patient_id) OR is_caregiver_of(patient_id)
  );

CREATE POLICY "Paziente e staff inseriscono umore" ON mood_entries
  FOR INSERT WITH CHECK (
    is_patient_self(patient_id)
    OR get_user_role() IN ('nurse', 'doctor', 'caregiver', 'admin', 'super_admin')
  );

-- MEMORIES (Memoriae)
CREATE POLICY "Tutti gli utenti collegati vedono i ricordi" ON memories
  FOR SELECT USING (
    is_patient_self(patient_id)
    OR is_caregiver_of(patient_id)
    OR EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = memories.patient_id
      AND p.structure_id = get_user_structure_id()
    )
  );

CREATE POLICY "Utenti autorizzati aggiungono ricordi" ON memories
  FOR INSERT WITH CHECK (
    is_patient_self(patient_id)
    OR is_caregiver_of(patient_id)
    OR get_user_role() IN ('nurse', 'doctor', 'admin', 'super_admin')
  );

CREATE POLICY "Autore modifica il proprio ricordo" ON memories
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Autore o admin elimina ricordo" ON memories
  FOR DELETE USING (
    author_id = auth.uid()
    OR get_user_role() IN ('admin', 'super_admin')
  );

-- MEMORY_REACTIONS
CREATE POLICY "Utenti vedono le reazioni" ON memory_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memories m
      WHERE m.id = memory_reactions.memory_id
      AND (
        is_patient_self(m.patient_id)
        OR is_caregiver_of(m.patient_id)
        OR EXISTS (SELECT 1 FROM patients p WHERE p.id = m.patient_id AND p.structure_id = get_user_structure_id())
      )
    )
  );

CREATE POLICY "Utenti gestiscono le proprie reazioni" ON memory_reactions
  FOR ALL USING (user_id = auth.uid());

-- MESSAGES
CREATE POLICY "Staff vede messaggi della struttura" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = messages.thread_id
      AND mt.structure_id = get_user_structure_id()
      AND get_user_role() IN ('admin', 'super_admin', 'doctor', 'nurse')
    )
  );

CREATE POLICY "Caregiver e paziente vedono i propri messaggi" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = messages.thread_id
      AND (is_caregiver_of(mt.patient_id) OR is_patient_self(mt.patient_id))
    )
  );

CREATE POLICY "Utenti autenticati inviano messaggi" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- PUSH_SUBSCRIPTIONS
CREATE POLICY "Utente gestisce le proprie subscription" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- USER_PRESENCE
CREATE POLICY "Tutti vedono la presenza" ON user_presence
  FOR SELECT USING (TRUE);

CREATE POLICY "Utente aggiorna la propria presenza" ON user_presence
  FOR ALL USING (user_id = auth.uid());

-- AUDIT_LOG
CREATE POLICY "Admin legge audit log" ON audit_log
  FOR SELECT USING (
    get_user_role() IN ('admin', 'super_admin')
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = audit_log.user_id AND structure_id = get_user_structure_id()
    )
  );
```

### Migration 003 — Funzioni e Trigger

```sql
-- Trigger: alert automatico parametri vitali
CREATE OR REPLACE FUNCTION check_vital_thresholds()
RETURNS TRIGGER AS $$
DECLARE
  threshold RECORD;
BEGIN
  SELECT * INTO threshold FROM vital_thresholds
  WHERE vital_type = NEW.type
  AND (patient_id = NEW.patient_id OR patient_id IS NULL)
  AND (structure_id = (SELECT structure_id FROM patients WHERE id = NEW.patient_id))
  ORDER BY patient_id NULLS LAST
  LIMIT 1;

  IF threshold IS NOT NULL THEN
    IF (threshold.min_value IS NOT NULL AND NEW.value < threshold.min_value)
    OR (threshold.max_value IS NOT NULL AND NEW.value > threshold.max_value) THEN
      NEW.is_alert = TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_vital_alert
  BEFORE INSERT ON vital_signs
  FOR EACH ROW EXECUTE FUNCTION check_vital_thresholds();

-- Funzione: soglie di default per struttura
CREATE OR REPLACE FUNCTION insert_default_thresholds(p_structure_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO vital_thresholds (structure_id, vital_type, min_value, max_value) VALUES
    (p_structure_id, 'blood_pressure_sys', 90, 180),
    (p_structure_id, 'blood_pressure_dia', 60, 110),
    (p_structure_id, 'heart_rate', 45, 120),
    (p_structure_id, 'temperature', 35.5, 38.5),
    (p_structure_id, 'oxygen_saturation', 92, NULL),
    (p_structure_id, 'blood_glucose', 70, 250);
END;
$$ LANGUAGE plpgsql;

-- Funzione helper: ruolo utente
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

### Migration 004 — Supabase Realtime

```sql
-- Abilita Realtime per le tabelle che ne hanno bisogno
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE memories;
ALTER PUBLICATION supabase_realtime ADD TABLE memory_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE mood_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE vital_signs;
ALTER PUBLICATION supabase_realtime ADD TABLE medication_logs;
```

### Migration 005 — Bucket Storage

```sql
-- Creare via Supabase Dashboard o API:
-- Bucket: "memories"       (foto e audio ricordi Memoriae) — PUBLIC
-- Bucket: "avatars"        (foto profilo utenti) — PUBLIC
-- Bucket: "attachments"    (allegati note cliniche e messaggi) — PRIVATE
-- Bucket: "audio-messages" (messaggi vocali chat) — PRIVATE
```

---

## 5. Struttura Directory del Progetto

```
anima/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx              # Login email/password
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Layout principale con sidebar/bottom nav
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              # Home dashboard (per ruolo)
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx              # Lista pazienti
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # Redirect a /overview
│   │   │   │       ├── overview/
│   │   │   │       │   └── page.tsx      # Panoramica paziente
│   │   │   │       ├── medications/
│   │   │   │       │   └── page.tsx      # Terapia e farmaci
│   │   │   │       ├── vitals/
│   │   │   │       │   └── page.tsx      # Parametri vitali
│   │   │   │       ├── diary/
│   │   │   │       │   └── page.tsx      # Diario clinico
│   │   │   │       ├── appointments/
│   │   │   │       │   └── page.tsx      # Agenda appuntamenti
│   │   │   │       └── memories/
│   │   │   │           └── page.tsx      # Feed Memoriae (da Memora)
│   │   │   ├── mood/
│   │   │   │   └── page.tsx              # Mood Tracker (da Memora)
│   │   │   ├── memoriae/
│   │   │   │   └── page.tsx              # Feed globale ricordi
│   │   │   ├── messages/
│   │   │   │   └── page.tsx              # Messaggistica
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx              # Agenda condivisa
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx              # Dashboard admin
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx          # Gestione utenti
│   │   │   │   └── audit/
│   │   │   │       └── page.tsx          # Audit log
│   │   │   └── settings/
│   │   │       └── page.tsx              # Impostazioni profilo + accessibilità
│   │   ├── actions/                      # Server Actions
│   │   │   ├── patients.ts
│   │   │   ├── medications.ts
│   │   │   ├── vitals.ts
│   │   │   ├── mood.ts
│   │   │   ├── memories.ts
│   │   │   ├── messages.ts
│   │   │   └── users.ts
│   │   ├── api/
│   │   │   ├── push/
│   │   │   │   ├── subscribe/route.ts
│   │   │   │   └── send/route.ts
│   │   │   └── export/
│   │   │       └── patient/[id]/route.ts # Export PDF fascicolo
│   │   ├── layout.tsx                    # Root layout + metadata PWA
│   │   ├── page.tsx                      # Landing / redirect
│   │   └── manifest.ts                   # PWA manifest
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx               # Sidebar desktop 220px
│   │   │   ├── BottomNav.tsx             # Nav mobile fissa
│   │   │   ├── Topbar.tsx                # Header mobile
│   │   │   └── MainLayout.tsx            # Wrapper layout completo
│   │   ├── patients/
│   │   │   ├── PatientCard.tsx           # Card lista (desktop: tabella, mobile: card)
│   │   │   ├── PatientHeader.tsx         # Header fascicolo paziente
│   │   │   ├── PatientSearch.tsx
│   │   │   ├── PatientForm.tsx
│   │   │   └── PatientTabSwitcher.tsx
│   │   ├── medications/
│   │   │   ├── MedicationList.tsx
│   │   │   ├── MedicationForm.tsx
│   │   │   ├── MedicationLogItem.tsx
│   │   │   └── MedicationBadge.tsx
│   │   ├── vitals/
│   │   │   ├── VitalSignCard.tsx         # Card singolo parametro vitale
│   │   │   ├── VitalSignForm.tsx
│   │   │   ├── VitalSignChart.tsx        # Recharts LineChart
│   │   │   └── VitalAlertBadge.tsx
│   │   ├── mood/                         # DA MEMORA
│   │   │   ├── MoodPicker.tsx            # Pulsante selezione umore (grande, touch-friendly)
│   │   │   ├── MoodCard.tsx              # Card umore paziente
│   │   │   └── MoodChart.tsx             # Recharts grafico storico umore
│   │   ├── memories/                     # DA MEMORA
│   │   │   ├── MemoryFeed.tsx            # Feed scrollabile ricordi
│   │   │   ├── MemoryCard.tsx            # Card singolo ricordo
│   │   │   ├── MemoryUploader.tsx        # Upload foto/audio/testo
│   │   │   ├── AudioPlayer.tsx           # Player audio messaggi vocali
│   │   │   ├── AudioRecorder.tsx         # Registrazione audio (da Memora)
│   │   │   └── MemoryReactions.tsx       # Reazioni emoji ai ricordi
│   │   ├── sos/                          # DA MEMORA
│   │   │   └── SOSButton.tsx             # Pulsante SOS floating (visibile sempre)
│   │   ├── messages/
│   │   │   ├── ThreadList.tsx
│   │   │   ├── ChatView.tsx
│   │   │   ├── MessageBubble.tsx         # Supporta text + audio
│   │   │   ├── MessageInput.tsx          # Input testo + pulsante registrazione audio
│   │   │   └── AudioMessagePlayer.tsx
│   │   ├── diary/
│   │   │   ├── ClinicalNoteCard.tsx
│   │   │   ├── ClinicalNoteForm.tsx
│   │   │   └── ClinicalNoteFilter.tsx
│   │   ├── appointments/
│   │   │   ├── AppointmentCard.tsx
│   │   │   └── AppointmentForm.tsx
│   │   ├── admin/
│   │   │   ├── InviteUserForm.tsx
│   │   │   ├── UserTable.tsx
│   │   │   └── AuditLogTable.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPatient.tsx      # Vista paziente (da Memora)
│   │   │   ├── DashboardCaregiver.tsx    # Vista caregiver
│   │   │   ├── DashboardNurse.tsx        # Vista infermiere
│   │   │   ├── DashboardDoctor.tsx       # Vista medico
│   │   │   └── DashboardAdmin.tsx        # Vista admin
│   │   ├── debug/
│   │   │   └── DebugConsole.tsx          # Console debug (solo dev)
│   │   └── ui/
│   │       ├── StatusBadge.tsx           # Badge stato (pending/given/skipped...)
│   │       ├── RoleBadge.tsx             # Badge ruolo utente
│   │       ├── StatusDot.tsx             # Pallino stato (verde/ambra/rosso)
│   │       ├── KpiCard.tsx               # Card KPI dashboard
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDialog.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   ├── server.ts                 # Server client (SSR)
│   │   │   └── admin.ts                  # Service role client (solo server-side)
│   │   ├── hooks/
│   │   │   ├── useUser.ts                # Utente corrente + ruolo
│   │   │   ├── usePatient.ts
│   │   │   ├── useMedications.ts
│   │   │   ├── useVitals.ts
│   │   │   ├── useMood.ts                # Hook mood tracker
│   │   │   ├── useMemories.ts            # Hook feed Memoriae
│   │   │   ├── useMessages.ts            # Hook messaggistica + Realtime
│   │   │   ├── usePresence.ts            # Hook presenza online
│   │   │   └── usePushNotifications.ts
│   │   ├── stores/
│   │   │   ├── appStore.ts               # Store globale (Zustand)
│   │   │   └── debugStore.ts             # Store debug console
│   │   ├── validators/
│   │   │   ├── patient.ts                # Zod schemas
│   │   │   ├── medication.ts
│   │   │   ├── vital.ts
│   │   │   ├── mood.ts
│   │   │   ├── memory.ts
│   │   │   └── message.ts
│   │   └── utils/
│   │       ├── date.ts                   # date-fns helpers (locale IT)
│   │       ├── roles.ts                  # Permission checks
│   │       ├── pdf.ts                    # PDF generation helpers
│   │       └── audio.ts                  # Audio recording helpers
│   ├── types/
│   │   └── index.ts                      # TypeScript interfaces complete
│   └── middleware.ts                     # Auth guard Next.js
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_functions_triggers.sql
│       ├── 004_realtime.sql
│       └── 005_storage_buckets.sql
├── public/
│   └── icons/                            # PWA icons (192, 512, maskable)
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

---

## 6. Tipi TypeScript (types/index.ts)

```typescript
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
  created_at: string
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
  room_number?: string
  ward?: string
  admission_date?: string
  allergies?: string[]
  chronic_conditions?: string[]
  blood_type?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  large_font_mode: boolean
  high_contrast_mode: boolean
  is_active: boolean
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
  is_active: boolean
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
}

export interface VitalSign {
  id: string
  patient_id: string
  recorded_by?: string
  type: VitalType
  value: number
  unit: string
  is_alert: boolean
  recorded_at: string
}

export interface MoodEntry {
  id: string
  patient_id: string
  recorded_by?: string
  mood: MoodType
  notes?: string
  recorded_at: string
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
  profiles?: Profile
  memory_reactions?: MemoryReaction[]
}

export interface MemoryReaction {
  id: string
  memory_id: string
  user_id: string
  emoji: string
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
  profiles?: Profile
}

export interface Appointment {
  id: string
  patient_id?: string
  structure_id?: string
  title: string
  description?: string
  location?: string
  appointment_at: string
  duration_min: number
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'missed'
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
  created_at: string
  profiles?: Profile
}

export interface MessageThread {
  id: string
  patient_id?: string
  structure_id: string
  title?: string
  is_group: boolean
  created_at: string
  patients?: Patient
  messages?: Message[]
}
```

---

## 7. Client Supabase

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

// lib/supabase/admin.ts — SOLO SERVER-SIDE, MAI importare dal client
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

---

## 8. Middleware Auth

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) { response.cookies.set({ name, value, ...options }) },
        remove(name, options) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|api).*)'],
}
```

---

## 9. Hook useUser

```typescript
// lib/hooks/useUser.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useUser() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('*, structures(*)')
        .eq('id', user.id)
        .single()

      // Auto-healing: crea profilo se mancante
      if (!data) {
        await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.email?.split('@')[0] ?? 'Utente',
          role: 'caregiver',
        })
      }

      setProfile(data)
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const isRole = (...roles: string[]) => profile ? roles.includes(profile.role) : false
  const isPatient = () => isRole('patient')
  const isCaregiver = () => isRole('caregiver')
  const isNurse = () => isRole('nurse')
  const isDoctor = () => isRole('doctor')
  const isAdmin = () => isRole('admin', 'super_admin')
  const isStaff = () => isRole('admin', 'super_admin', 'doctor', 'nurse')
  const canEdit = () => isStaff()

  return { profile, loading, isRole, isPatient, isCaregiver, isNurse, isDoctor, isAdmin, isStaff, canEdit }
}
```

---

## 10. Design System Anima

### Filosofia
Anima ha **due anime visive**:
1. **Interfaccia Paziente** — rassicurante, alto contrasto, font grandi, pochi elementi, colori caldi. Eredita da Memora.
2. **Interfaccia Staff/Clinica** — professionale, densa di informazioni, clinica. Eredita da CareLink.

### Palette colori principali (Tailwind)

```typescript
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: '#7C3AED',    // violet-600 — colore Anima (diverso da CareLink sky e Memora)
    light: '#EDE9FE',      // violet-100
    foreground: '#FFFFFF',
  },
  clinical: {
    DEFAULT: '#0EA5E9',    // sky-500 — per sezioni cliniche
    light: '#F0F9FF',
    foreground: '#FFFFFF',
  },
  warm: {
    DEFAULT: '#F59E0B',    // amber-500 — per interfaccia paziente
    light: '#FFFBEB',
    foreground: '#FFFFFF',
  },
  success: '#22C55E',
  danger:  '#EF4444',
  alert:   '#F59E0B',
}
```

### Font
- **Plus Jakarta Sans** (Google Fonts) — pesi 300/400/500/600/700/800
- Import in `layout.tsx` e `globals.css`

### Layout responsive

```
Desktop   (≥1024px): Sidebar 220px fissa + main content
Tablet    (768-1023px): Sidebar drawer overlay + hamburger
Mobile    (<768px):  Sidebar nascosta + Bottom Nav 64px + Topbar 56px
```

### Regola interfaccia paziente
Quando `profile.role === 'patient'` o `patient.large_font_mode === true`:
- Font size aumentato (`text-xl` per testo normale, `text-2xl` per titoli)
- Bottoni grandi min-height 56px
- Meno elementi per schermata (massimo 3-4 azioni visibili)
- Colori caldi (amber/warm) invece di freddi (sky/violet)
- Animazioni Framer Motion morbide (a meno che `motion_reduced === true`)
- SOS Button sempre visibile (fixed bottom-right, `z-50`)

### Componenti base obbligatori

**StatusBadge:**
```typescript
// Varianti: 'pending'|'given'|'skipped'|'refused'|'scheduled'|'completed'|'cancelled'|'alert'|'ok'
// Background: colore + "20" (hex, ~12% opacità)
// Testo: colore pieno, 11px, fontWeight 600, padding 2px 8px, borderRadius 20px
```

**RoleBadge:**
```typescript
// Varianti: patient|caregiver|nurse|doctor|admin|super_admin
// Etichette italiane: Paziente|Caregiver|Infermiere|Medico|Admin|Super Admin
```

**StatusDot:**
```typescript
// Cerchio 10×10px, borderRadius 50%
// Verde #22c55e → ok | Ambra #f59e0b → alert | Rosso #ef4444 → urgente
```

**MoodEmoji:**
```typescript
// felice → 😊 | normale → 😐 | triste → 😢 | agitato → 😰 | confuso → 😕
// Pulsanti grandi (64×64px) per vista paziente
```

**SOSButton:**
```typescript
// Position: fixed, bottom: 20px, right: 20px, z-index: 9999
// Solo per ruolo 'patient'
// Background: #EF4444, testo bianco, testo "SOS", icona telefono
// Size: 64×64px, borderRadius 50%
// Animazione: pulse continuo
// OnClick: apre modal con lista emergency_contacts del profilo
```

---

## 11. Schermate Principali — Specifiche

### Login (`/login`)
- Logo Anima centrato + tagline "Cura che connette"
- Form: email + password
- Link "Magic link"
- Sfondo gradient violet-50 → white
- NO registrazione pubblica (solo invito admin)

### Dashboard Paziente
- Saluto personalizzato con nome + ora del giorno
- Card grande "Come ti senti oggi?" → MoodPicker
- Card "La tua agenda" → massimo 3 attività del giorno
- Card "Ricordi recenti" → ultimi 2 dal feed Memoriae
- SOS Button sempre visibile
- Font aumentato, colori warm/amber

### Dashboard Caregiver
- Header con nome del paziente seguito
- Card umore paziente (con storico settimanale mini-chart)
- Card farmaci del giorno (panoramica somministrazioni)
- Card "Ultimi parametri vitali" con alert badge
- Card "Messaggi non letti" dalla struttura
- Feed Memoriae anteprima

### Dashboard Infermiere
- KPI: pazienti attivi, farmaci da somministrare, alert parametri, messaggi
- Lista "Farmaci da somministrare" con pulsante "✓ Somministra" / "✗ Salta"
- Lista "Pazienti da monitorare" (quelli con alert)
- Accesso rapido a parametri vitali

### Dashboard Medico
- Identico infermiere + accesso note private
- Alert parametri fuori soglia in evidenza
- Analytics umore (grafico settimanale per tutti i pazienti)

### Dashboard Admin
- KPI struttura: pazienti, staff, messaggi, alert
- Ultimi accessi (audit log preview)
- Link rapidi: invita utente, aggiungi paziente, impostazioni

### Fascicolo Paziente (`/patients/[id]`)
**PatientHeader fisso:**
- Avatar 64×64px con iniziali
- Nome, età, stanza, reparto
- Badge patologie, allergie
- StatusDot (ok/alert/urgente)
- Bottoni: "Export PDF", "Messaggio famiglia"

**Tabs:**
1. Panoramica — anagrafica, allergie, patologie, contatti emergenza
2. Terapia — farmaci attivi + log somministrazioni
3. Parametri Vitali — form + griglia + grafici Recharts
4. Diario Clinico — note con categoria e filtro privacy
5. Appuntamenti — lista + form
6. Memoriae — feed ricordi del paziente (foto/audio/testo)

### Feed Memoriae (`/memoriae` o `/patients/[id]/memories`)
- Layout: masonry o feed verticale
- Card ricordo: foto/testo/audio con avatar autore, data, reazioni emoji
- Upload: pulsante "+" fisso → scegli tipo (foto/testo/audio)
- Player audio inline (waveform se possibile, altrimenti controls standard)
- Reazioni: click emoji → salva su DB
- Pulsante "Fissa" (is_pinned) per ricordi speciali

### Mood Tracker (`/mood`)
- Solo per paziente / caregiver
- MoodPicker: 5 pulsanti grandi con emoji e label
- Campo note opzionale
- Storico: Recharts AreaChart ultimi 30 giorni
- Analytics medico: vedere storico multi-paziente

### Messaggistica (`/messages`)
- Lista thread (sinistra su desktop, unica su mobile)
- Chat a bolle: violet = struttura, grigio = famiglia
- Tipo messaggio: testo + audio
- AudioRecorder: pulsante microfono → registra → invia
- Realtime: Supabase Realtime subscription
- Badge non letti

---

## 12. Funzionalità Audio (da Memora)

### Registrazione audio messaggi
```typescript
// lib/utils/audio.ts
export async function startRecording(): Promise<MediaRecorder> { ... }
export async function stopRecording(recorder: MediaRecorder): Promise<Blob> { ... }
export async function uploadAudio(blob: Blob, bucket: string, path: string): Promise<string> { ... }
// Upload su Supabase Storage bucket 'audio-messages'
```

### Upload Supabase Storage
```typescript
// Per audio messaggi: bucket 'audio-messages' (privato)
// Per foto Memoriae: bucket 'memories' (pubblico)
// Per avatar: bucket 'avatars' (pubblico)
// Per allegati note cliniche: bucket 'attachments' (privato)
```

---

## 13. Export PDF Fascicolo

```typescript
// app/api/export/patient/[id]/route.ts
// Usa @react-pdf/renderer
// Contenuto PDF:
//   - Header: nome paziente, data nascita, struttura, data export
//   - Sezione: Anagrafica completa
//   - Sezione: Allergie e Patologie croniche
//   - Sezione: Terapia attiva (farmaci + orari)
//   - Sezione: Parametri vitali (ultimi 30 giorni, tabella)
//   - Sezione: Diario clinico (note non private)
//   - Sezione: Appuntamenti futuri
//   - Footer: "Generato da Anima — [data] — uso riservato"
```

---

## 14. PWA Configuration

```typescript
// next.config.mjs
import withPWA from '@ducanh2912/next-pwa'

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: { disableDevLogs: true },
})({
  reactStrictMode: true,
  images: {
    domains: ['[progetto-anima].supabase.co'],
  },
})

// app/manifest.ts
export default function manifest() {
  return {
    name: 'Anima',
    short_name: 'Anima',
    description: 'Cura che connette — gestione integrata per pazienti Alzheimer',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F5F3FF',
    theme_color: '#7C3AED',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

---

## 15. Comandi Setup Iniziale

```bash
# 1. Crea il progetto Next.js
npx create-next-app@latest anima \
  --typescript \
  --tailwind \
  --app \
  --import-alias="@/*"
cd anima

# 2. Installa dipendenze principali
npm install @supabase/supabase-js @supabase/ssr
npm install @ducanh2912/next-pwa
npm install web-push
npm install recharts
npm install react-hook-form zod @hookform/resolvers
npm install zustand
npm install date-fns
npm install lucide-react
npm install @react-pdf/renderer
npm install framer-motion
npm install @types/web-push --save-dev

# 3. Installa shadcn/ui
npx shadcn@latest init
# Opzioni: Default style, Slate color, CSS variables YES
npx shadcn@latest add button card input label badge dialog sheet tabs avatar select textarea toast

# 4. Crea progetto Supabase (dashboard Supabase)
# - Regione: eu-central-1 (Frankfurt)
# - Nome: anima
# - Copia URL e chiavi in .env.local

# 5. Esegui migrazioni in ordine
# (dalla Supabase SQL Editor, incolla 001 → 002 → 003 → 004)

# 6. Crea bucket Storage (Supabase Dashboard → Storage):
# - memories (pubblico)
# - avatars (pubblico)
# - audio-messages (privato)
# - attachments (privato)

# 7. Genera chiavi VAPID per push notifications
npx web-push generate-vapid-keys
# Copia i valori in .env.local

# 8. Avvia in locale
npm run dev
```

---

## 16. Roadmap di Sviluppo — Ordine Obbligatorio

### FASE 0 — Setup e Auth *(inizia qui)*
1. Setup progetto con tutte le dipendenze (sezione 15)
2. Supabase: crea progetto, esegui migrazioni 001→004, crea bucket storage
3. Implementa `lib/supabase/client.ts`, `server.ts`, `admin.ts`
4. Implementa `middleware.ts` (auth redirect)
5. Implementa pagina `/login` con form email/password + magic link
6. Implementa hook `useUser.ts` con auto-healing profilo
7. Implementa layout principale con sidebar desktop e bottom nav mobile
8. Implementa componenti base: `StatusBadge`, `RoleBadge`, `StatusDot`, `KpiCard`
9. Implementa `DebugConsole` (pulsante 🐛 visibile solo in dev)
10. Testa login/logout per tutti i 6 ruoli

### FASE 1 — Gestione Pazienti
1. Pagina `/patients` — lista con tabella desktop + card mobile, ricerca, filtri
2. Pagina `/patients/[id]/overview` — fascicolo con PatientHeader + tabs
3. Form aggiunta/modifica paziente
4. Componente `PatientHeader` completo

### FASE 2 — Farmaci e Somministrazioni
1. Tab Terapia: lista farmaci attivi con schedule
2. Form aggiunta farmaco (solo doctor)
3. Log somministrazioni con pulsanti "✓ Somministra" / "✗ Salta" + dialog motivo
4. Storico somministrazioni con filtro data

### FASE 3 — Parametri Vitali
1. Form inserimento parametro vitale con 9 tipi
2. Griglia ultime misurazioni (card per tipo, rosso/ambra se is_alert)
3. Recharts LineChart con selezione tipo e range (7gg / 30gg / 3 mesi)

### FASE 4 — Mood Tracker *(da Memora)*
1. MoodPicker con 5 stati e emoji grandi
2. Salvataggio su DB + storico
3. MoodChart (Recharts AreaChart, 30 giorni)
4. Vista medico: analytics umore multi-paziente

### FASE 5 — Feed Memoriae *(da Memora)*
1. MemoryFeed con card foto/testo/audio
2. Upload foto (Supabase Storage bucket 'memories')
3. Registrazione audio (AudioRecorder) + upload
4. Player audio inline (AudioPlayer)
5. Reazioni emoji (memory_reactions)
6. Realtime: nuovi ricordi via Supabase Realtime

### FASE 6 — Messaggistica
1. Lista thread messaggi
2. ChatView con bolle (testo + audio)
3. AudioRecorder integrato nell'input messaggi
4. Realtime con Supabase Realtime subscription
5. Badge messaggi non letti

### FASE 7 — Dashboard per Ruolo
1. DashboardPatient (vista semplificata con MoodPicker + SOSButton)
2. DashboardCaregiver
3. DashboardNurse (farmaci da somministrare + pazienti da monitorare)
4. DashboardDoctor
5. DashboardAdmin con KPI struttura

### FASE 8 — Diario Clinico + Appuntamenti
1. Tab Diario Clinico: lista note con filtri categoria/privacy
2. Form aggiunta nota
3. Tab Appuntamenti: lista + form
4. Agenda condivisa struttura

### FASE 9 — SOS Button *(da Memora)*
1. SOSButton floating (solo ruolo patient)
2. Modal con lista emergency_contacts del profilo
3. Azione click: tel: link per chiamata diretta

### FASE 10 — Export PDF + PWA + Push
1. Export PDF fascicolo completo (@react-pdf/renderer)
2. Configurazione PWA completa (manifest + service worker)
3. Push notifications (VAPID): farmaci in sospeso, messaggi non letti, alert parametri

### FASE 11 — Admin Panel
1. Gestione utenti (invito via magic link, modifica ruolo, disattivazione)
2. Audit log con filtri (utente, data, azione)
3. Dashboard KPI struttura
4. Impostazioni soglie parametri vitali per struttura

### FASE 12 — Accessibilità *(da Memora)*
1. Toggle `large_font_mode` nelle impostazioni profilo paziente
2. Toggle `high_contrast_mode`
3. Toggle `motion_reduced` (disabilita animazioni Framer Motion)
4. Applicare le preferenze globalmente via CSS class sul `<body>`

---

## 17. Note Importanti per l'AI Developer

1. **Ogni componente in TypeScript** — nessuna eccezione
2. **Nessun `any`** — usare i tipi definiti nella sezione 6
3. **Server Actions per le mutazioni** — non chiamare Supabase direttamente dal client per INSERT/UPDATE/DELETE quando possibile
4. **RLS è attiva** — non bypassarla mai lato client; usare `admin.ts` (service role) solo nelle Server Actions server-side
5. **Framer Motion solo per interfaccia paziente** — non ovunque, per performance
6. **Recharts wrappato in `'use client'`** — è una libreria client-only
7. **Audio recording** — richiedere permesso microfono prima di registrare
8. **Upload audio/foto** — sempre su Supabase Storage, mai come blob in DB
9. **Realtime** — usare `useEffect` cleanup per unsubscribe da canali Supabase
10. **Accessibilità** — tutti i pulsanti devono avere `aria-label`, tutti i form `label`
11. **Mobile first** — ogni componente deve funzionare su schermo 375px prima di pensare al desktop
12. **Date in italiano** — usare sempre `date-fns` con `{ locale: it }` per format

---

*ANIMA_BRIEF.md — v1.0 — Daniele Spalletti (DanyWolf) — CosmoNetinfo — Giugno 2026*  
*Documento riservato — uso interno*
