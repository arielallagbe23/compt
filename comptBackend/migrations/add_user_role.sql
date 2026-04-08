DO $$
BEGIN
  EXECUTE 'ALTER TABLE users ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) DEFAULT ''ceo'' CHECK (user_role IN (''ceo'', ''associe'', ''comptable'', ''employe''))';
  -- Mettre les users existants en ceo par défaut
  EXECUTE 'UPDATE users SET user_role = ''ceo'' WHERE user_role IS NULL';
END $$;
