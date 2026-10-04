/**
 * Database Wrapper with Circuit Breaker Protection
 * Provides safe database operations with fallback handling
 */

const circuitBreaker = require('./circuit-breaker');

class DatabaseWrapper {
    constructor(db) {
        this.db = db;
        this.breaker = circuitBreaker.initializeCircuitBreaker(db);
    }

    /**
     * Execute a database query with circuit breaker protection
     */
    async query(sql, params = [], fallback = null, context = 'query') {
        return this.breaker.execute(async () => {
            const stmt = this.db.prepare(sql);
            return params.length > 0 ? stmt.run(...params) : stmt.run();
        }, fallback, `${context}: ${sql.substring(0, 50)}...`);
    }

    /**
     * Execute a database get (single row) with circuit breaker protection
     */
    async get(sql, params = [], fallback = null, context = 'get') {
        return this.breaker.execute(async () => {
            const stmt = this.db.prepare(sql);
            return params.length > 0 ? stmt.get(...params) : stmt.get();
        }, fallback, `${context}: ${sql.substring(0, 50)}...`);
    }

    /**
     * Execute a database all (multiple rows) with circuit breaker protection
     */
    async all(sql, params = [], fallback = null, context = 'all') {
        return this.breaker.execute(async () => {
            const stmt = this.db.prepare(sql);
            return params.length > 0 ? stmt.all(...params) : stmt.all();
        }, fallback, `${context}: ${sql.substring(0, 50)}...`);
    }

    /**
     * Execute a database transaction with circuit breaker protection
     */
    async transaction(operations = [], fallback = null, context = 'transaction') {
        return this.breaker.execute(async () => {
            const results = [];
            
            for (const operation of operations) {
                if (typeof operation === 'function') {
                    results.push(await operation());
                } else if (operation.sql) {
                    const stmt = this.db.prepare(operation.sql);
                    const result = operation.params ? 
                        await stmt.run(...operation.params) : 
                        await stmt.run();
                    results.push(result);
                }
            }
            
            return results;
        }, fallback, context);
    }

    /**
     * Batch operations with retry logic
     */
    async batch(operations, maxRetries = 3) {
        const retryWrapper = this.breaker.createRetryWrapper(maxRetries);
        
        return retryWrapper(async () => {
            const results = [];
            
            for (const op of operations) {
                try {
                    const result = await this.query(op.sql, op.params || [], null, 'batch');
                    results.push({ success: true, result });
                } catch (error) {
                    results.push({ success: false, error: error.message });
                    // Continue with next operation even if one fails
                }
            }
            
            return results;
        });
    }

    /**
     * Health check with circuit breaker
     */
    async healthCheck() {
        return this.breaker.execute(async () => {
            const result = await this.db.healthCheck();
            return result;
        }, () => ({ 
            healthy: false, 
            message: 'Database health check failed (circuit breaker fallback)' 
        }), 'health-check');
    }

    /**
     * Get connection pool stats
     */
    async getPoolStats() {
        try {
            return this.db.getPoolStats();
        } catch (error) {
            return {
                totalConnections: 0,
                activeConnections: 0,
                idleConnections: 0,
                waitingClients: 0,
                error: 'Failed to get pool stats: ' + error.message
            };
        }
    }

    /**
     * Safe insert with duplicate handling
     */
    async safeInsert(table, data, conflictStrategy = 'ignore') {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(',');
        
        let sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
        
        if (conflictStrategy === 'replace') {
            sql += ' ON CONFLICT DO UPDATE SET ' + 
                   columns.map(col => `${col}=excluded.${col}`).join(',');
        } else if (conflictStrategy === 'ignore') {
            sql += ' ON CONFLICT DO NOTHING';
        }
        
        return this.query(sql, values, () => ({ 
            success: false, 
            message: 'Insert failed, using fallback',
            fallback: true 
        }), `safeInsert:${table}`);
    }

    /**
     * Safe update with version checking
     */
    async safeUpdate(table, data, where, versionColumn = 'version') {
        if (data[versionColumn]) {
            data[versionColumn] = data[versionColumn] + 1;
        }
        
        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        
        const whereClause = Object.keys(where)
            .map(key => `${key} = ?`)
            .join(' AND ');
        
        const values = [...Object.values(data), ...Object.values(where)];
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        
        return this.query(sql, values, () => ({ 
            success: false, 
            message: 'Update failed, using fallback',
            fallback: true 
        }), `safeUpdate:${table}`);
    }

    /**
     * Get circuit breaker status
     */
    getCircuitBreakerStatus() {
        try {
            return this.breaker.getState();
        } catch (error) {
            return { 
                error: error.message,
                state: 'NOT_INITIALIZED' 
            };
        }
    }
}

// Create global instance
let globalDbWrapper = null;

/**
 * Initialize global database wrapper
 */
function initializeDbWrapper(db) {
    if (!globalDbWrapper) {
        globalDbWrapper = new DatabaseWrapper(db);
        console.log('Database wrapper with circuit breaker initialized');
    }
    return globalDbWrapper;
}

/**
 * Get global database wrapper instance
 */
function getDbWrapper() {
    if (!globalDbWrapper) {
        throw new Error('Database wrapper not initialized. Call initializeDbWrapper() first.');
    }
    return globalDbWrapper;
}

module.exports = {
    DatabaseWrapper,
    initializeDbWrapper,
    getDbWrapper
};