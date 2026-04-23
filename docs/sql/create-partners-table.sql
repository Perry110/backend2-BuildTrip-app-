-- PostgreSQL DDL for partner management relation:
-- users (1) -> (1) partners (1) -> (n) places

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by UUID NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_partners_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_partners_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_reviewed_at ON partners(reviewed_at);

-- Link places -> partner owner.
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS partner_id UUID;

ALTER TABLE places
  ADD CONSTRAINT fk_places_partner
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_places_partner_id ON places(partner_id);

-- Recommended: set NOT NULL only after backfilling legacy rows.
-- ALTER TABLE places ALTER COLUMN partner_id SET NOT NULL;
