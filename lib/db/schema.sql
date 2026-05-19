-- =============================================================
--  DevUniverse DB Schema
--  Target: Supabase (PostgreSQL 15+)
--  Run in: Supabase SQL Editor
-- =============================================================

-- ── Universe cache ────────────────────────────────────────────
-- Stores the full /universe API response as JSONB.
-- Upserted on every sync; TTL enforced in application layer (6h).
CREATE TABLE IF NOT EXISTS universe_cache (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username   TEXT        NOT NULL UNIQUE,
  data              JSONB       NOT NULL,          -- CachedUniverse JSON
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_universe_cache_username
  ON universe_cache (github_username);

-- ── Activity cache ─────────────────────────────────────────────
-- Short-lived cache (30 min) for /activity endpoint.
CREATE TABLE IF NOT EXISTS activity_cache (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username   TEXT        NOT NULL UNIQUE,
  data              JSONB       NOT NULL,
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_cache_username
  ON activity_cache (github_username);

-- ── RLS Policies ──────────────────────────────────────────────
-- Users may only read/write their own cache rows.
ALTER TABLE universe_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_cache  ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own universe"
  ON universe_cache FOR SELECT
  USING (github_username = (auth.jwt() ->> 'user_name'));

CREATE POLICY "Users can upsert own universe"
  ON universe_cache FOR INSERT
  WITH CHECK (github_username = (auth.jwt() ->> 'user_name'));

CREATE POLICY "Users can update own universe"
  ON universe_cache FOR UPDATE
  USING (github_username = (auth.jwt() ->> 'user_name'));

CREATE POLICY "Users can read own activity"
  ON activity_cache FOR SELECT
  USING (github_username = (auth.jwt() ->> 'user_name'));

CREATE POLICY "Users can upsert own activity"
  ON activity_cache FOR INSERT
  WITH CHECK (github_username = (auth.jwt() ->> 'user_name'));

CREATE POLICY "Users can update own activity"
  ON activity_cache FOR UPDATE
  USING (github_username = (auth.jwt() ->> 'user_name'));

-- Allow service_role (server-side) to bypass RLS
-- (Supabase service_role key bypasses RLS by default — no additional policy needed.)

-- ── Stale cache cleanup (optional cron) ───────────────────────
-- Run via pg_cron or Supabase edge function to purge old entries.
-- Example: DELETE FROM universe_cache WHERE synced_at < NOW() - INTERVAL '24 hours';
