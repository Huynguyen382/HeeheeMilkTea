const path = require('path');
const fs = require('fs');

let pgPool = null;
let sqliteDb = null;
const isPg = !!process.env.DATABASE_URL;

// Function to convert '?' placeholders to '$1', '$2', ... for PostgreSQL
function toPgSql(sql) {
  let idx = 1;
  return sql.replace(/\?/g, () => '$' + idx++);
}

const db = {
  isPostgres: isPg,

  async init() {
    if (process.env.DATABASE_URL) {
      console.log('Connecting to Neon PostgreSQL database...');
      const { Pool, types } = require('pg');
      // Ensure BIGINT (int8) is parsed as JavaScript Number
      types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));

      // Optimized connection pool for free tier scaling
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        // Free tier optimized settings
        max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10, // Reduced for free tier
        min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 2,
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 5000, // Fail fast if can't connect
        maxUses: 1000, // Recycle connections periodically
        // Statement timeout for long-running queries (5 seconds)
        statement_timeout: 5000
      });

      // Handle pool errors
      pgPool.on('error', (err) => {
        console.error('[DB Pool Error]', err.message);
      });

      // Test connection
      const client = await pgPool.connect();
      try {
        console.log('Successfully connected to Neon PostgreSQL!');
        // Initialize schema for PostgreSQL
        await client.query(`
          CREATE TABLE IF NOT EXISTS stores (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password_hash TEXT,
            store_code TEXT UNIQUE NOT NULL,
            store_name TEXT NOT NULL,
            session_token TEXT,
            created_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS game_saves (
            store_id INTEGER PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
            chapter INTEGER DEFAULT 1,
            day_in_game INTEGER DEFAULT 1,
            money BIGINT DEFAULT 200000,
            debt_remaining BIGINT DEFAULT 3000000,
            reputation REAL DEFAULT 5.0,
            upgrades TEXT DEFAULT '{}',
            recipes TEXT DEFAULT '["tra_sua_truyen_thong"]',
            inventory TEXT DEFAULT '{"tea":50,"milk":50,"pearls":50,"cups":50}',
            save_hash TEXT,
            is_jailed INTEGER DEFAULT 0,
            jail_reason TEXT,
            updated_at TEXT,
            rest_until_ts BIGINT DEFAULT 0,
            active_buffs TEXT DEFAULT '{}',
            properties TEXT DEFAULT '{}',
            decorations TEXT DEFAULT '[]'
          );

          CREATE TABLE IF NOT EXISTS daily_stats (
            id SERIAL PRIMARY KEY,
            store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            real_date TEXT NOT NULL,
            earned_today BIGINT DEFAULT 0,
            orders_served BIGINT DEFAULT 0,
            shift_orders BIGINT DEFAULT 0,
            shift_earned BIGINT DEFAULT 0,
            shift_ingredient_cost BIGINT DEFAULT 0,
            shift_tips BIGINT DEFAULT 0,
            collab_count INTEGER DEFAULT 0,
            is_overloaded INTEGER DEFAULT 0,
            last_active_ts BIGINT DEFAULT 0,
            UNIQUE(store_id, real_date)
          );

          CREATE TABLE IF NOT EXISTS collabs (
            id SERIAL PRIMARY KEY,
            host_store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            friend_store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            collab_date TEXT NOT NULL,
          status TEXT DEFAULT 'accepted',
          created_at TEXT,
            UNIQUE(host_store_id, friend_store_id, collab_date)
          );

          CREATE TABLE IF NOT EXISTS active_orders (
            id TEXT PRIMARY KEY,
            store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            recipe_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            sugar TEXT NOT NULL,
            ice TEXT NOT NULL,
             toppings TEXT NOT NULL,
             price INTEGER NOT NULL,
             original_price INTEGER,
             negotiation TEXT,
             created_at BIGINT NOT NULL,
            expires_at BIGINT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            store_id INTEGER,
            event_type TEXT NOT NULL,
            detail TEXT,
            logged_at TEXT NOT NULL
          );
         `);
         await client.query(`
           ALTER TABLE active_orders ADD COLUMN IF NOT EXISTS original_price INTEGER;
           ALTER TABLE active_orders ADD COLUMN IF NOT EXISTS negotiation TEXT;
           ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS properties TEXT DEFAULT '{}';
           ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS decorations TEXT DEFAULT '[]';
           ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS rest_until_ts BIGINT DEFAULT 0;
           ALTER TABLE game_saves ADD COLUMN IF NOT EXISTS active_buffs TEXT DEFAULT '{}';
           ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS orders_served BIGINT DEFAULT 0;
           ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS shift_orders BIGINT DEFAULT 0;
           ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS shift_earned BIGINT DEFAULT 0;
           ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS shift_ingredient_cost BIGINT DEFAULT 0;
           ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS shift_tips BIGINT DEFAULT 0;
           ALTER TABLE collabs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';
           ALTER TABLE collabs ADD COLUMN IF NOT EXISTS created_at TEXT;
         `);
         console.log('Neon PostgreSQL schema initialized successfully.');
      } finally {
        client.release();
      }
    } else {
      // Local fallback to SQLite
      console.log('No DATABASE_URL found. Initializing local SQLite database...');
      const { DatabaseSync } = require('node:sqlite');
      const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'hyhy_game.db');
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      sqliteDb = new DatabaseSync(dbPath);
      sqliteDb.exec(`
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

      try { sqliteDb.exec('ALTER TABLE stores ADD COLUMN username TEXT;'); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE stores ADD COLUMN password_hash TEXT;'); } catch (e) {}
      try { sqliteDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_username ON stores(username);'); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE game_saves ADD COLUMN rest_until_ts INTEGER DEFAULT 0;'); } catch (e) {}
      try { sqliteDb.exec("ALTER TABLE game_saves ADD COLUMN active_buffs TEXT DEFAULT '{}';"); } catch (e) {}
      try { sqliteDb.exec("ALTER TABLE game_saves ADD COLUMN properties TEXT DEFAULT '{}';"); } catch (e) {}
      try { sqliteDb.exec("ALTER TABLE game_saves ADD COLUMN decorations TEXT DEFAULT '[]';"); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE active_orders ADD COLUMN original_price INTEGER;'); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE active_orders ADD COLUMN negotiation TEXT;'); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE daily_stats ADD COLUMN orders_served INTEGER DEFAULT 0;'); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE daily_stats ADD COLUMN shift_orders INTEGER DEFAULT 0;'); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE daily_stats ADD COLUMN shift_earned INTEGER DEFAULT 0;'); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE daily_stats ADD COLUMN shift_ingredient_cost INTEGER DEFAULT 0;'); } catch (e) {}
      try { sqliteDb.exec('ALTER TABLE daily_stats ADD COLUMN shift_tips INTEGER DEFAULT 0;'); } catch (e) {}
      try { sqliteDb.exec("ALTER TABLE collabs ADD COLUMN status TEXT DEFAULT 'accepted';"); } catch (e) {}
      try { sqliteDb.exec("ALTER TABLE collabs ADD COLUMN created_at TEXT;"); } catch (e) {}

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS game_saves (
          store_id INTEGER PRIMARY KEY,
          chapter INTEGER DEFAULT 1,
          day_in_game INTEGER DEFAULT 1,
          money INTEGER DEFAULT 200000,
          debt_remaining INTEGER DEFAULT 3000000,
          reputation REAL DEFAULT 5.0,
          upgrades TEXT DEFAULT '{}',
          recipes TEXT DEFAULT '["tra_sua_truyen_thong"]',
          inventory TEXT DEFAULT '{"tea":50,"milk":50,"pearls":50,"cups":50}',
          save_hash TEXT,
          is_jailed INTEGER DEFAULT 0,
          jail_reason TEXT,
          updated_at TEXT,
          rest_until_ts INTEGER DEFAULT 0,
          active_buffs TEXT DEFAULT '{}',
          FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS daily_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          store_id INTEGER NOT NULL,
          real_date TEXT NOT NULL,
          earned_today INTEGER DEFAULT 0,
          orders_served INTEGER DEFAULT 0,
          shift_orders INTEGER DEFAULT 0,
          shift_earned INTEGER DEFAULT 0,
          shift_ingredient_cost INTEGER DEFAULT 0,
          shift_tips INTEGER DEFAULT 0,
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
          status TEXT DEFAULT 'accepted',
          created_at TEXT,
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
           original_price INTEGER,
           negotiation TEXT,
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
      console.log('Local SQLite database initialized successfully at:', dbPath);
    }
  },

  // Prepared statement cache for PostgreSQL
  _statementCache: new Map(),
  
  async get(sql, ...params) {
    const flatParams = params.flat();
    if (pgPool) {
      const pgSql = toPgSql(sql);
      try {
        const res = await pgPool.query({
          text: pgSql,
          values: flatParams
        });
        return res.rows[0] || null;
      } catch (err) {
        console.error('[DB GET Error]', err.message, 'SQL:', pgSql);
        throw err;
      }
    } else {
      return sqliteDb.prepare(sql).get(...flatParams) || null;
    }
  },

  async all(sql, ...params) {
    const flatParams = params.flat();
    if (pgPool) {
      const pgSql = toPgSql(sql);
      try {
        const res = await pgPool.query({
          text: pgSql,
          values: flatParams
        });
        return res.rows;
      } catch (err) {
        console.error('[DB ALL Error]', err.message, 'SQL:', pgSql);
        throw err;
      }
    } else {
      return sqliteDb.prepare(sql).all(...flatParams);
    }
  },

  async run(sql, ...params) {
    const flatParams = params.flat();
    if (pgPool) {
      let pgSql = toPgSql(sql);
      const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING *';
      }
      
      try {
        const res = await pgPool.query({
          text: pgSql,
          values: flatParams
        });
        const row = res.rows && res.rows[0];
        const rowId = row ? (row.id ?? row.store_id ?? Object.values(row)[0] ?? null) : null;
        return {
          lastInsertRowid: rowId,
          changes: res.rowCount,
          rowCount: res.rowCount
        };
      } catch (err) {
        console.error('[DB RUN Error]', err.message, 'SQL:', pgSql);
        throw err;
      }
    } else {
      return sqliteDb.prepare(sql).run(...flatParams);
    }
  },

  // Batch operations for performance
  async batch(queries) {
    if (!Array.isArray(queries) || queries.length === 0) {
      return [];
    }
    
    if (pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        const results = [];
        for (const { sql, params } of queries) {
          const pgSql = toPgSql(sql);
          const res = await client.query(pgSql, params || []);
          results.push(res);
        }
        await client.query('COMMIT');
        return results;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // SQLite batch
      const results = [];
      for (const { sql, params } of queries) {
        const stmt = sqliteDb.prepare(sql);
        results.push(stmt.run(...(params || [])));
      }
      return results;
    }
  },

  // Get store state with all related data in one query (optimized)
  async getStoreStateOptimized(storeId) {
    // Return null to let getStoreState use robust individual queries with self-healing & in-memory caching
    return null;
  },

  async exec(sql) {
    if (pgPool) {
      return await pgPool.query(sql);
    } else {
      return sqliteDb.exec(sql);
    }
  },

  prepare(sql) {
    return {
      get: (...params) => db.get(sql, ...params),
      all: (...params) => db.all(sql, ...params),
      run: (...params) => db.run(sql, ...params)
    };
  },

  // Database health and monitoring
  async healthCheck() {
    if (pgPool) {
      try {
        const start = Date.now();
        await pgPool.query('SELECT 1');
        const latency = Date.now() - start;
        
        return {
          status: 'healthy',
          type: 'postgresql',
          latency_ms: latency,
          pool: {
            totalCount: pgPool.totalCount || 0,
            idleCount: pgPool.idleCount || 0,
            waitingCount: pgPool.waitingCount || 0
          }
        };
      } catch (err) {
        return {
          status: 'unhealthy',
          type: 'postgresql',
          error: err.message
        };
      }
    } else {
      try {
        const start = Date.now();
        sqliteDb.prepare('SELECT 1').get();
        const latency = Date.now() - start;
        
        return {
          status: 'healthy',
          type: 'sqlite',
          latency_ms: latency
        };
      } catch (err) {
        return {
          status: 'unhealthy',
          type: 'sqlite',
          error: err.message
        };
      }
    }
  },

  // Get connection pool statistics
  getPoolStats() {
    if (pgPool) {
      return {
        total: pgPool.totalCount || 0,
        idle: pgPool.idleCount || 0,
        waiting: pgPool.waitingCount || 0
      };
    }
    return null;
  },

  // Clear statement cache
  clearCache() {
    this._statementCache.clear();
  }
};

module.exports = db;
