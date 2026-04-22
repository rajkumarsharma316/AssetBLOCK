-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  public_key TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payment contracts
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  creator_public_key TEXT NOT NULL,
  escrow_public_key TEXT,
  escrow_secret_encrypted TEXT,
  title TEXT NOT NULL,
  description TEXT,
  amount TEXT NOT NULL,
  asset_code TEXT DEFAULT 'XLM',
  asset_issuer TEXT,
  destination TEXT NOT NULL,
  dest_asset_code TEXT,
  dest_asset_issuer TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','funded','active','completed','expired','cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (creator_public_key) REFERENCES users(public_key)
);

-- Conditions attached to contracts
CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('time','approval','oracle')),
  logic_operator TEXT DEFAULT 'AND' CHECK(logic_operator IN ('AND','OR')),
  logic_group INTEGER DEFAULT 0,
  params TEXT NOT NULL,
  is_met INTEGER DEFAULT 0,
  met_at TEXT,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Multi-sig signers for contracts
CREATE TABLE IF NOT EXISTS signers (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  has_signed INTEGER DEFAULT 0,
  signed_at TEXT,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Transaction history
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  tx_hash TEXT,
  type TEXT NOT NULL CHECK(type IN ('escrow_create','fund','release','refund','path_payment')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','submitted','confirmed','failed')),
  amount TEXT,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_public_key TEXT NOT NULL,
  contract_id TEXT,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_public_key) REFERENCES users(public_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_creator ON contracts(creator_public_key);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_conditions_contract ON conditions(contract_id);
CREATE INDEX IF NOT EXISTS idx_signers_contract ON signers(contract_id);
CREATE INDEX IF NOT EXISTS idx_transactions_contract ON transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_public_key);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  description TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
