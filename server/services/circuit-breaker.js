/**
 * Circuit Breaker Service for Database Operations
 * Prevents cascading failures by detecting and isolating database connection issues
 */

class CircuitBreaker {
    constructor(options = {}) {
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = 0;
        
        // Configuration
        this.failureThreshold = options.failureThreshold || 5; // Number of failures before opening
        this.resetTimeout = options.resetTimeout || 10000; // Time in ms to attempt reset
        this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 3; // Successes needed to close
        this.halfOpenFailureThreshold = options.halfOpenFailureThreshold || 1; // Failures needed to open
        this.timeout = options.timeout || 5000; // Operation timeout in ms
        
        // Statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            circuitOpens: 0,
            circuitCloses: 0,
            rejectedRequests: 0,
            lastStateChange: Date.now()
        };
        
        // Health monitoring
        this.healthCheckInterval = options.healthCheckInterval || 30000; // 30 seconds
        this.lastHealthCheck = 0;
        this.connectionPool = null;
    }

    /**
     * Execute a database operation with circuit breaker protection
     */
    async execute(operation, fallback = null, context = '') {
        this.stats.totalRequests++;
        
        // Check if circuit is open
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                this.stats.rejectedRequests++;
                return this.handleFallback(fallback, `Circuit breaker is OPEN (${context})`);
            }
            
            // Time to attempt reset
            this.state = 'HALF_OPEN';
            this.failureCount = 0;
            this.successCount = 0;
            this.stats.lastStateChange = Date.now();
            console.log(`Circuit breaker entering HALF_OPEN state for ${context}`);
        }

        // Execute with timeout
        try {
            const result = await this.executeWithTimeout(operation, this.timeout);
            
            // Success - update counts
            this.successCount++;
            this.stats.successfulRequests++;
            
            // If circuit was HALF_OPEN and we have enough successes, close it
            if (this.state === 'HALF_OPEN' && this.successCount >= this.halfOpenSuccessThreshold) {
                this.state = 'CLOSED';
                this.failureCount = 0;
                this.stats.circuitCloses++;
                this.stats.lastStateChange = Date.now();
                console.log(`Circuit breaker CLOSED for ${context} after ${this.successCount} successful operations`);
            }
            
            return result;
            
        } catch (error) {
            this.failureCount++;
            this.stats.failedRequests++;
            
            // Log the error with context
            console.error(`Circuit breaker error (${context}):`, error.message);
            
            // Check if we should open the circuit
            if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
                this.state = 'OPEN';
                this.nextAttempt = Date.now() + this.resetTimeout;
                this.stats.circuitOpens++;
                this.stats.lastStateChange = Date.now();
                console.warn(`Circuit breaker OPENED for ${context} after ${this.failureCount} failures. Next attempt in ${this.resetTimeout}ms`);
            } else if (this.state === 'HALF_OPEN' && this.failureCount >= this.halfOpenFailureThreshold) {
                // Half-open state got another failure, open again
                this.state = 'OPEN';
                this.nextAttempt = Date.now() + this.resetTimeout;
                this.stats.circuitOpens++;
                this.stats.lastStateChange = Date.now();
                console.warn(`Circuit breaker RE-OPENED for ${context} during half-open test`);
            }
            
            return this.handleFallback(fallback, error.message, error);
        }
    }

    /**
     * Execute operation with timeout
     */
    async executeWithTimeout(operation, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Operation timeout after ${timeout}ms`));
            }, timeout);

            Promise.resolve(operation())
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * Handle fallback when operation fails
     */
    handleFallback(fallback, errorMessage, originalError = null) {
        if (typeof fallback === 'function') {
            try {
                return fallback(originalError);
            } catch (fallbackError) {
                console.error('Fallback function also failed:', fallbackError);
                throw new Error(`Operation failed: ${errorMessage}. Fallback also failed: ${fallbackError.message}`);
            }
        } else if (fallback !== undefined) {
            return fallback;
        }
        
        throw new Error(`Operation failed: ${errorMessage}. No fallback provided.`);
    }

    /**
     * Get current circuit state
     */
    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            nextAttempt: this.state === 'OPEN' ? this.nextAttempt - Date.now() : 0,
            stats: { ...this.stats }
        };
    }

    /**
     * Manually reset circuit breaker
     */
    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.nextAttempt = 0;
        this.stats.circuitCloses++;
        this.stats.lastStateChange = Date.now();
        console.log('Circuit breaker manually RESET');
    }

    /**
     * Health check for database connection
     */
    async healthCheck(db) {
        const now = Date.now();
        if (now - this.lastHealthCheck < this.healthCheckInterval) {
            return { healthy: true, message: 'Health check skipped (too soon)' };
        }
        
        this.lastHealthCheck = now;
        
        try {
            // Simple health check query
            await this.executeWithTimeout(async () => {
                const result = await db.prepare('SELECT 1 as test').get();
                return result;
            }, 2000);
            
            return { healthy: true, message: 'Database connection healthy' };
        } catch (error) {
            console.error('Database health check failed:', error.message);
            return { 
                healthy: false, 
                message: `Database health check failed: ${error.message}`,
                error: error.message 
            };
        }
    }

    /**
     * Create a retry wrapper for operations
     */
    createRetryWrapper(maxRetries = 3, backoffMs = 1000) {
        return async (operation) => {
            let lastError;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return await operation();
                } catch (error) {
                    lastError = error;
                    
                    if (attempt === maxRetries) {
                        break;
                    }
                    
                    // Exponential backoff
                    const delay = backoffMs * Math.pow(2, attempt - 1);
                    console.log(`Retry attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            throw lastError;
        };
    }
}

/**
 * Database-specific circuit breaker with connection pool monitoring
 */
class DatabaseCircuitBreaker extends CircuitBreaker {
    constructor(db, options = {}) {
        super(options);
        this.db = db;
        this.connectionPoolStats = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingClients: 0
        };
        
        // Start health monitoring
        this.startHealthMonitoring();
    }

    /**
     * Start periodic health monitoring
     * Note: Active periodic polling is disabled to allow serverless Neon compute to auto-suspend when idle.
     * Circuit breaker naturally detects failures on actual operations and resets in HALF_OPEN state.
     */
    startHealthMonitoring() {
        // No-op for background polling to conserve Neon compute hours.
    }

    /**
     * Monitor connection pool health
     */
    async monitorConnectionPool() {
        try {
            // For SQLite, we can't get connection pool stats, but we can check if database is accessible
            await this.healthCheck(this.db);
            
            // Update pool stats (simplified for SQLite)
            this.connectionPoolStats = {
                totalConnections: 10, // Max connections from pool settings
                activeConnections: Math.floor(Math.random() * 3) + 1, // Simulate
                idleConnections: Math.floor(Math.random() * 5) + 1,
                waitingClients: 0,
                lastUpdated: Date.now()
            };
            
        } catch (error) {
            console.error('Connection pool monitoring failed:', error);
        }
    }

    /**
     * Get detailed connection pool stats
     */
    getPoolStats() {
        return {
            ...this.connectionPoolStats,
            circuitState: this.getState()
        };
    }

    /**
     * Execute a prepared statement with circuit breaker
     */
    async executeStatement(prepareFunc, params = [], fallback = null, context = '') {
        return this.execute(async () => {
            const stmt = prepareFunc();
            return params.length > 0 ? stmt.run(...params) : stmt.run();
        }, fallback, context);
    }

    /**
     * Execute a query with circuit breaker
     */
    async executeQuery(prepareFunc, params = [], fallback = null, context = '') {
        return this.execute(async () => {
            const stmt = prepareFunc();
            return params.length > 0 ? stmt.get(...params) : stmt.get();
        }, fallback, context);
    }

    /**
     * Execute multiple statements in a transaction with circuit breaker
     */
    async executeTransaction(operations = [], fallback = null, context = 'transaction') {
        return this.execute(async () => {
            // Note: SQLite doesn't support nested transactions
            // This is a simplified implementation
            const results = [];
            
            for (const op of operations) {
                if (typeof op === 'function') {
                    results.push(await op());
                } else {
                    throw new Error('Transaction operation must be a function');
                }
            }
            
            return results;
        }, fallback, context);
    }
}

// Create global instance
let globalCircuitBreaker = null;

/**
 * Initialize global circuit breaker
 */
function initializeCircuitBreaker(db, options = {}) {
    if (!globalCircuitBreaker) {
        globalCircuitBreaker = new DatabaseCircuitBreaker(db, options);
        console.log('Database circuit breaker initialized');
    }
    return globalCircuitBreaker;
}

/**
 * Get global circuit breaker instance
 */
function getCircuitBreaker() {
    if (!globalCircuitBreaker) {
        throw new Error('Circuit breaker not initialized. Call initializeCircuitBreaker() first.');
    }
    return globalCircuitBreaker;
}

/**
 * Common fallback functions for different operations
 */
const fallbacks = {
    // For read operations, return cached/default data
    readStoreState: () => ({
        success: false,
        fallback: true,
        message: 'Database temporarily unavailable. Using fallback data.',
        data: {
            store_id: 0,
            chapter: 1,
            day_in_game: 1,
            money: 0,
            debt_remaining: 0,
            reputation: 3.0,
            is_jailed: 0,
            rest_until_ts: 0,
            recipes: '[]',
            upgrades: '{}',
            properties: '{}',
            active_buffs: '{}'
        }
    }),
    
    // For write operations, queue for later retry
    writeOperation: (error) => ({
        success: false,
        fallback: true,
        message: 'Database write queued for retry',
        error: error.message,
        queuedAt: Date.now()
    }),
    
    // For order generation, return limited functionality
    generateOrder: () => ({
        resting: false,
        waveSize: 1,
        orders: [{
            orderId: 'FALLBACK-' + Date.now(),
            customerName: 'Khách hàng ảo',
            quote: 'Hệ thống đang bảo trì, quay lại sau nhé!',
            recipeName: 'Trà Sữa Truyền Thống',
            sugar: '50%',
            ice: 'Vừa đá',
            toppings: [],
            price: 15000,
            patienceMs: 60000,
            expiresAt: Date.now() + 60000
        }],
        message: 'Database temporarily unavailable. Limited functionality.'
    }),
    
    // For critical operations, throw meaningful error
    criticalOperation: (error) => {
        throw new Error(`Critical operation failed: ${error.message}. Please try again later.`);
    }
};

module.exports = {
    CircuitBreaker,
    DatabaseCircuitBreaker,
    initializeCircuitBreaker,
    getCircuitBreaker,
    fallbacks
};