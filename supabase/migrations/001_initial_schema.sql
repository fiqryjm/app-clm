-- CLM Application Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CONTRACTS (main table)
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id                 VARCHAR(50) UNIQUE NOT NULL,
  contract_type               VARCHAR(10) NOT NULL CHECK (contract_type IN ('SALES', 'SUPPLIER')),
  contract_title              TEXT NOT NULL,
  cost_center                 VARCHAR(100),
  requisition_no              VARCHAR(100),
  date_request                DATE,
  date_entry                  DATE DEFAULT CURRENT_DATE,
  start_date                  DATE,
  end_date                    DATE,
  expiry_reminder_date        DATE,
  status                      VARCHAR(20) NOT NULL DEFAULT 'REQUEST'
                                CHECK (status IN ('REQUEST','DRAFT','ACTIVE','EXPIRED','TERMINATED')),
  counterpart_name            TEXT,
  counterpart_id              VARCHAR(100),
  address                     TEXT,
  phone                       VARCHAR(50),
  email                       VARCHAR(255),
  used_of_contract            TEXT,
  type_of_contract            VARCHAR(100),
  contract_brief_summary      TEXT,
  location_of_work            TEXT,
  bom_scope_of_work           TEXT,
  currency                    VARCHAR(10) NOT NULL DEFAULT 'IDR',
  owner_estimate              NUMERIC(20,2),
  total_contract_value        NUMERIC(20,2),
  end_user_name               VARCHAR(255),
  end_user_department         VARCHAR(255),
  approved_by                 VARCHAR(255),
  contract_manager            VARCHAR(255),
  contract_manager_department VARCHAR(255),
  company_approving_person    VARCHAR(255),
  counterpart_approving_person VARCHAR(255),
  company_representative      VARCHAR(255),
  counterpart_representative  VARCHAR(255),
  company_rep_phone           VARCHAR(50),
  company_rep_email           VARCHAR(255),
  counterpart_rep_phone       VARCHAR(50),
  counterpart_rep_email       VARCHAR(255),
  initial_contract_value      NUMERIC(20,2),
  total_variation_order       NUMERIC(20,2) DEFAULT 0,
  final_cost                  NUMERIC(20,2),
  initial_variation_budget    NUMERIC(20,2),
  total_variation_budget      NUMERIC(20,2) DEFAULT 0,
  final_budget                NUMERIC(20,2),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTRACT LINE ITEMS (Detail Cost/Budget Structure)
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_line_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id   UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_no       INTEGER NOT NULL,
  description   TEXT,
  contract_value NUMERIC(20,2),
  budget        NUMERIC(20,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VARIATION ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS variation_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_no         INTEGER NOT NULL,
  description     TEXT,
  value           NUMERIC(20,2),
  budget          NUMERIC(20,2),
  completion_date DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROGRESS PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS progress_payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id           UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_no               INTEGER NOT NULL,
  date                  DATE,
  budget                NUMERIC(20,2),
  contract_value        NUMERIC(20,2),
  progress_delivery_pct NUMERIC(5,2),
  cumulative_payment    NUMERIC(20,2),
  payment               NUMERIC(20,2),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MILESTONES (Overall Delivery Schedule)
-- ============================================================
CREATE TABLE IF NOT EXISTS milestones (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id             UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_no                 INTEGER NOT NULL,
  initial_deadline_date   DATE,
  actual_completion       DATE,
  milestones_description  TEXT,
  remarks                 TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTACHED DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS attached_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id   UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_no       INTEGER NOT NULL,
  document_type VARCHAR(50),
  description   TEXT,
  file_url      TEXT,
  file_name     TEXT,
  file_size     BIGINT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RISKS REGISTER
-- ============================================================
CREATE TABLE IF NOT EXISTS risks_register (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id        UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_no            INTEGER NOT NULL,
  issue              TEXT,
  likelihood_rating  INTEGER CHECK (likelihood_rating BETWEEN 1 AND 5),
  impact_rating      INTEGER CHECK (impact_rating BETWEEN 1 AND 5),
  overall_risk_score INTEGER GENERATED ALWAYS AS (likelihood_rating * impact_rating) STORED,
  mitigation         TEXT,
  proposed_solution  TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINAL DELIVERABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS final_deliverables (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id   UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_no       INTEGER NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_expiry ON contracts(expiry_reminder_date);
CREATE INDEX IF NOT EXISTS idx_line_items_contract ON contract_line_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_variation_orders_contract ON variation_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_progress_payments_contract ON progress_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestones_contract ON milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_documents_contract ON attached_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_risks_contract ON risks_register(contract_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_contract ON final_deliverables(contract_id);

-- ============================================================
-- Supabase Storage bucket for documents
-- ============================================================
-- Run this separately in Supabase dashboard > Storage:
-- Create bucket named "contract-documents" (public: false)

-- ============================================================
-- RLS Policies (disable for now, enable when auth is added)
-- ============================================================
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_line_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE variation_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE attached_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE risks_register DISABLE ROW LEVEL SECURITY;
ALTER TABLE final_deliverables DISABLE ROW LEVEL SECURITY;
