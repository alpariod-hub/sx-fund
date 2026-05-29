-- ══════════════════════════════════════════════════════════════════════════════
-- SX Fund — PostgreSQL schema migration
-- Run:  psql -U sx_fund -d sx_fund -f deploy/migrate.sql
-- ══════════════════════════════════════════════════════════════════════════════

-- Enums -----------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE asset_type      AS ENUM ('trade_receivable','forward_contract');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_status    AS ENUM ('active','matured','defaulted','pending');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tranche_type     AS ENUM ('DROP','TIN');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tranche_priority AS ENUM ('senior','junior');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE oracle_event_type AS ENUM (
    'contract_signed','prepayment_confirmed','goods_shipped',
    'goods_received','payment_received','maturity'
  );
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE oracle_event_status AS ENUM ('pending','confirmed','failed');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE investor_type      AS ENUM ('institutional','crypto','family_office','individual');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE interested_tranche AS ENUM ('DROP','TIN','both');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE workspace_role   AS ENUM ('owner','legal','finance','tech','all');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE workspace_status AS ENUM ('empty','in_progress','done');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS assets (
  id                  SERIAL PRIMARY KEY,
  token_id            TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  asset_type          asset_type NOT NULL,
  description         TEXT,
  originator          TEXT NOT NULL,
  issuer              TEXT NOT NULL,
  buyer               TEXT NOT NULL,
  commodity           TEXT,
  underlying_currency TEXT NOT NULL,
  loan_currency       TEXT NOT NULL,
  principal           NUMERIC(18,2) NOT NULL,
  ltv                 NUMERIC(5,2)  NOT NULL,
  loan_amount         NUMERIC(18,2) NOT NULL,
  term                TEXT NOT NULL,
  yield_min           NUMERIC(5,2)  NOT NULL,
  yield_max           NUMERIC(5,2)  NOT NULL,
  default_penalty     NUMERIC(5,2)  NOT NULL,
  collateral          TEXT NOT NULL,
  documents_ipfs      TEXT,
  status              asset_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tranches (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  type        tranche_type NOT NULL,
  allocation  NUMERIC(5,2) NOT NULL,
  yield_min   NUMERIC(5,2) NOT NULL,
  yield_max   NUMERIC(5,2) NOT NULL,
  priority    tranche_priority NOT NULL,
  description TEXT NOT NULL,
  tvl         NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS oracle_events (
  id         SERIAL PRIMARY KEY,
  asset_id   INTEGER NOT NULL REFERENCES assets(id),
  event_type oracle_event_type NOT NULL,
  status     oracle_event_status NOT NULL DEFAULT 'pending',
  tx_hash    TEXT,
  notes      TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investor_inquiries (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  company           TEXT,
  investor_type     investor_type NOT NULL,
  interested_tranche interested_tranche NOT NULL,
  message           TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_entries (
  id          SERIAL PRIMARY KEY,
  field_key   TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL,
  role        workspace_role NOT NULL DEFAULT 'all',
  label       TEXT NOT NULL,
  hint        TEXT,
  value       TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  status      workspace_status NOT NULL DEFAULT 'empty',
  updated_by  TEXT DEFAULT '',
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
