const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'hyhy_game.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    store_code TEXT UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    session_token TEXT,
    created_at TEXT NOT NULL
  );
`);

// Safe column migrations if table already existed
try {
  db.exec('ALTER TABLE stores ADD COLUMN username TEXT;');
} catch (e) {}
try {
  db.exec('ALTER TABLE stores ADD COLUMN password_hash TEXT;');
} catch (e) {}
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_username ON stores(username);');
} catch (e) {}
try {
  db.exec('ALTER TABLE game_saves ADD COLUMN rest_until_ts INTEGER DEFAULT 0;');
} catch (e) {}
try {
  db.exec("ALTER TABLE game_saves ADD COLUMN active_buffs TEXT DEFAULT '{}';");
} catch (e) {}

db.exec(`

  CREATE TABLE IF NOT EXISTS game_saves (
    store_id INTEGER PRIMARY KEY,
    chapter INTEGER DEFAULT 1,
    day_in_game INTEGER DEFAULT 1,
    money INTEGER DEFAULT 200000,
    debt_remaining INTEGER DEFAULT 3000000,
    reputation REAL DEFAULT 5.0,
    upgrades TEXT DEFAULT '{}',
    recipes TEXT DEFAULT '["tra_sua_truyen_thong","hong_tra_tac","tra_thai_xanh"]',
    inventory TEXT DEFAULT '{"tea":50,"milk":50,"pearls":50,"cups":50}',
    save_hash TEXT,
    is_jailed INTEGER DEFAULT 0,
    jail_reason TEXT,
    updated_at TEXT,
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    real_date TEXT NOT NULL,
    earned_today INTEGER DEFAULT 0,
    collab_count INTEGER DEFAULT 0,
    is_overloaded INTEGER DEFAULT 0,
    last_active_ts INTEGER DEFAULT 0,
    UNIQUE(store_id, real_date),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS collabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_store_id INTEGER NOT NULL,
    friend_store_id INTEGER NOT NULL,
    collab_date TEXT NOT NULL,
    UNIQUE(host_store_id, friend_store_id, collab_date),
    FOREIGN KEY(host_store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY(friend_store_id) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS active_orders (
    id TEXT PRIMARY KEY,
    store_id INTEGER NOT NULL,
    recipe_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    sugar TEXT NOT NULL,
    ice TEXT NOT NULL,
    toppings TEXT NOT NULL,
    price INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER,
    event_type TEXT NOT NULL,
    detail TEXT,
    logged_at TEXT NOT NULL
  );
`);

console.log('Database initialized successfully at:', dbPath);

module.exports = db;
