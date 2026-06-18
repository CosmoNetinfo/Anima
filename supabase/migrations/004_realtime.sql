-- Abilita Realtime per le tabelle che ne hanno bisogno
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE memories;
ALTER PUBLICATION supabase_realtime ADD TABLE memory_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE mood_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE vital_signs;
ALTER PUBLICATION supabase_realtime ADD TABLE medication_logs;
