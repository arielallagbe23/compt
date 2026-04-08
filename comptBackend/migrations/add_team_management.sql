DO $$
BEGIN

-- ── Profil utilisateur ──
EXECUTE 'ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name  VARCHAR(100)';
EXECUTE 'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name   VARCHAR(100)';
EXECUTE 'ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title   VARCHAR(100)';

-- ── Invitations ──
EXECUTE '
CREATE TABLE IF NOT EXISTS invitations (
  id           SERIAL PRIMARY KEY,
  invited_by   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email        VARCHAR(255) NOT NULL,
  role         VARCHAR(50)  NOT NULL
                 CHECK (role IN (''CEO'', ''associe'', ''comptable'', ''employe'')),
  token        TEXT UNIQUE NOT NULL,
  status       VARCHAR(20)  DEFAULT ''pending''
                 CHECK (status IN (''pending'', ''accepted'', ''expired'')),
  expires_at   TIMESTAMP NOT NULL,
  accepted_at  TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
)';

-- ── Membres d''entreprise ──
EXECUTE '
CREATE TABLE IF NOT EXISTS company_members (
  id            SERIAL PRIMARY KEY,
  company_id    INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  invited_by    INTEGER NOT NULL REFERENCES users(id),
  role          VARCHAR(50) NOT NULL
                  CHECK (role IN (''CEO'', ''associe'', ''comptable'', ''employe'')),
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, user_id)
)';

-- ── Insérer le CEO comme membre de ses entreprises existantes ──
EXECUTE '
INSERT INTO company_members (company_id, user_id, invited_by, role)
SELECT c.id, c.owner_id, c.owner_id, ''CEO''
FROM companies c
ON CONFLICT (company_id, user_id) DO NOTHING
';

END $$;
