-- ============================================================
-- AssetBLOCK RPC Functions for Supabase
-- Run this in the Supabase SQL Editor AFTER creating tables.
-- These handle complex JOIN queries that can't be done with
-- the Supabase query builder alone.
-- ============================================================

-- ============================================================
-- Get all contracts for a user (as creator, signer, or destination)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_contracts(
  user_key TEXT,
  status_filter TEXT DEFAULT NULL,
  lim INTEGER DEFAULT 20,
  off INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  creator_public_key TEXT,
  escrow_public_key TEXT,
  escrow_secret_encrypted TEXT,
  title TEXT,
  description TEXT,
  amount TEXT,
  asset_code TEXT,
  asset_issuer TEXT,
  destination TEXT,
  dest_asset_code TEXT,
  dest_asset_issuer TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.id, c.creator_public_key, c.escrow_public_key,
    c.escrow_secret_encrypted, c.title, c.description, c.amount,
    c.asset_code, c.asset_issuer, c.destination, c.dest_asset_code,
    c.dest_asset_issuer, c.status, c.created_at, c.updated_at
  FROM contracts c
  LEFT JOIN signers s ON s.contract_id = c.id
  WHERE (c.creator_public_key = user_key OR s.public_key = user_key OR c.destination = user_key)
    AND (status_filter IS NULL OR c.status = status_filter)
  ORDER BY c.created_at DESC
  LIMIT lim OFFSET off;
END;
$$;

-- ============================================================
-- Get all transactions for a user's contracts
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_transactions(
  user_key TEXT,
  type_filter TEXT DEFAULT NULL,
  lim INTEGER DEFAULT 30,
  off INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  contract_id TEXT,
  tx_hash TEXT,
  type TEXT,
  status TEXT,
  amount TEXT,
  details TEXT,
  created_at TIMESTAMPTZ,
  contract_title TEXT,
  contract_creator TEXT,
  contract_destination TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.id, t.contract_id, t.tx_hash, t.type, t.status,
    t.amount, t.details, t.created_at,
    c.title AS contract_title,
    c.creator_public_key AS contract_creator,
    c.destination AS contract_destination
  FROM transactions t
  JOIN contracts c ON c.id = t.contract_id
  LEFT JOIN signers s ON s.contract_id = c.id
  WHERE (c.creator_public_key = user_key OR s.public_key = user_key OR c.destination = user_key)
    AND (type_filter IS NULL OR t.type = type_filter)
  ORDER BY t.created_at DESC
  LIMIT lim OFFSET off;
END;
$$;
