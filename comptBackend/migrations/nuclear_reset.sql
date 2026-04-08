DO $$
BEGIN

-- ── SUPPRESSION TOTALE ──
EXECUTE 'DROP TABLE IF EXISTS transactions CASCADE';
EXECUTE 'DROP TABLE IF EXISTS companies CASCADE';
EXECUTE 'DROP TABLE IF EXISTS users CASCADE';

-- ── USERS ──
EXECUTE '
CREATE TABLE users (
  id                   SERIAL PRIMARY KEY,
  email                VARCHAR(255) UNIQUE NOT NULL,
  password             TEXT NOT NULL,
  is_admin             BOOLEAN DEFAULT false,
  is_super_admin       BOOLEAN DEFAULT false,
  status               VARCHAR(20) DEFAULT ''pending''
                         CHECK (status IN (''pending'', ''approved'', ''active'', ''rejected'')),
  verification_token   TEXT,
  token_expires_at     TIMESTAMP,
  verified_at          TIMESTAMP,
  approved_at          TIMESTAMP,
  approved_by          INTEGER,
  rejected_at          TIMESTAMP,
  rejection_reason     TEXT,
  created_at           TIMESTAMP DEFAULT NOW()
)';

-- ── COMPANIES ──
EXECUTE '
CREATE TABLE companies (
  id                SERIAL PRIMARY KEY,
  owner_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  type              VARCHAR(100),
  legal_status      VARCHAR(100),
  sector            VARCHAR(100),
  ifu               VARCHAR(100) UNIQUE,
  rccm              VARCHAR(100),
  registration_date DATE,
  city              VARCHAR(100),
  created_at        TIMESTAMP DEFAULT NOW()
)';

-- ── TRANSACTIONS ──
EXECUTE '
CREATE TABLE transactions (
  id             SERIAL PRIMARY KEY,
  company_id     INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type           VARCHAR(10) NOT NULL CHECK (type IN (''recette'', ''depense'')),
  amount         NUMERIC(18, 6) NOT NULL,
  currency       VARCHAR(10) NOT NULL,
  description    TEXT,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMP DEFAULT NOW(),
  sender_name    TEXT,
  sender_phone   TEXT,
  receiver_name  TEXT,
  receiver_phone TEXT,
  from_address   TEXT,
  to_address     TEXT,
  tx_hash        TEXT,
  network        TEXT,
  aml_score      SMALLINT CHECK (aml_score BETWEEN 0 AND 100)
)';

-- ── SUPER ADMIN (arielallagbe15@gmail.com / C0mpt$Bj#Ar13l!) ──
EXECUTE '
INSERT INTO users (email, password, is_super_admin, is_admin, status)
VALUES (
  ''arielallagbe15@gmail.com'',
  ''$2b$12$vdMNOV5aVOTeIXP2YYAYCOF53/8EKyW./XkUCS6MmP6sIAh1n1zcW'',
  true,
  true,
  ''active''
)';

END $$;
