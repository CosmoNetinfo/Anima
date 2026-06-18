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
