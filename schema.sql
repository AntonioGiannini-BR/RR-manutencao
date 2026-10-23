-- PostgreSQL schema for RR Aeronaves inventory.
CREATE TABLE IF NOT EXISTS rr_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rr_parts (
  id UUID PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity INTEGER NOT NULL DEFAULT 5 CHECK (min_quantity >= 0),
  location TEXT,
  manufacturer TEXT,
  price NUMERIC(12,2) CHECK (price IS NULL OR price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES rr_users(id)
);
CREATE TABLE IF NOT EXISTS rr_transactions (
  id UUID PRIMARY KEY,
  part_id UUID NOT NULL REFERENCES rr_parts(id) ON DELETE RESTRICT,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  quantity_returned INTEGER NOT NULL DEFAULT 0 CHECK (quantity_returned >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','returned')),
  user_id UUID NOT NULL REFERENCES rr_users(id),
  user_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  returned_at TIMESTAMPTZ,
  CHECK (quantity_returned <= quantity)
);
CREATE INDEX IF NOT EXISTS rr_transactions_created_at_idx ON rr_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS rr_parts_name_idx ON rr_parts(name);

-- Keep a single bootstrap administrator account.
CREATE UNIQUE INDEX IF NOT EXISTS rr_one_admin_idx ON rr_users(role) WHERE role = 'admin';
