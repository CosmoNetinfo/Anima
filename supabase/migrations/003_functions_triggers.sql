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
