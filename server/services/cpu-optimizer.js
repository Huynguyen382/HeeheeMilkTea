/**
 * CPU Optimization Utilities for Game Server
 * Optimizes Math.random, JSON parsing, crypto operations for high-throughput
 */

const crypto = require('crypto');

/**
 * Fast random number generator using Xorshift128+
 * More efficient than Math.random() for high-frequency calls
 */
class FastRandom {
    constructor(seed = Date.now()) {
        this.seed = BigInt(seed);
        this.state0 = BigInt(this.seed);
        this.state1 = BigInt(this.seed ^ 0x1234567890ABCDEFn);
    }

    // Xorshift128+ algorithm
    next() {
        let x = this.state0;
        const y = this.state1;
        this.state0 = y;
        x ^= x << 23n;
        this.state1 = x ^ y ^ (x >> 17n) ^ (y >> 26n);
        return Number((this.state1 + y) & 0xFFFFFFFFFFFFFn) / 0x10000000000000;
    }

    // Generate random integer in range [min, max]
    int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    // Weighted random selection
    weightedChoice(weights) {
        const total = weights.reduce((sum, w) => sum + w, 0);
        const r = this.next() * total;
        let cumulative = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (r <= cumulative) return i;
        }
        return weights.length - 1;
    }
}

/**
 * JSON parsing optimization with caching
 */
class JsonOptimizer {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 1000;
    }

    parseWithCache(jsonString, key = null) {
        if (!jsonString) return null;
        
        // Try cache first
        if (key && this.cache.has(key)) {
            return this.cache.get(key);
        }

        try {
            // Fast path for simple arrays/objects
            if (jsonString.startsWith('[') || jsonString.startsWith('{')) {
                const result = JSON.parse(jsonString);
                
                // Cache if key provided
                if (key) {
                    if (this.cache.size >= this.maxCacheSize) {
                        // Remove oldest entry (first inserted)
                        const firstKey = this.cache.keys().next().value;
                        this.cache.delete(firstKey);
                    }
                    this.cache.set(key, result);
                }
                return result;
            }
        } catch (e) {
            console.warn('JSON parse error:', e.message, 'string:', jsonString.substring(0, 50));
        }
        return null;
    }

    clearCache() {
        this.cache.clear();
    }
}

/**
 * Batch ID generator for orders
 * Creates IDs in batches to reduce crypto.randomBytes overhead
 */
class BatchIdGenerator {
    constructor(batchSize = 100) {
        this.batchSize = batchSize;
        this.idPool = [];
        this.refillPool();
    }

    refillPool() {
        const buffer = crypto.randomBytes(this.batchSize * 4); // 4 bytes per ID
        for (let i = 0; i < this.batchSize; i++) {
            const hex = buffer.slice(i * 4, (i + 1) * 4).toString('hex');
            this.idPool.push(`ORD-${hex}`);
        }
    }

    next() {
        if (this.idPool.length === 0) {
            this.refillPool();
        }
        return this.idPool.pop();
    }

    generateBatch(count) {
        if (count > this.idPool.length) {
            this.refillPool();
        }
        const result = this.idPool.slice(-count);
        this.idPool.length -= count;
        return result;
    }
}

/**
 * Pre-computed probability distributions for faster random decisions
 */
class ProbabilityDistributions {
    constructor() {
        this.distributions = {
            // Wave size distributions based on conditions
            waveSize: {
                viral_big: [0, 0, 0.1, 0.6, 0.3], // 0:1, 1:2, 2:3, 3:4, 4:5 customers (normalized)
                viral_small: [0, 0.3, 0.35, 0.35, 0],
                flop: [0.8, 0.2, 0, 0, 0],
                low_reputation: [1, 0, 0, 0, 0],
                normal: [0.35, 0.35, 0.20, 0.10, 0]
            },
            
            // Topping count distributions by customer type
            toppingCount: {
                elder: [0.4, 0.6, 0, 0], // 0, 1, 2, 3 toppings
                tiktoker: [0, 0, 0.45, 0.55],
                gymmer: [0.3, 0.5, 0.2, 0],
                normal: [0.12, 0.43, 0.35, 0.10]
            },
            
            // Sugar preferences
            sugars: ['0%', '30%', '50%', '70%', '100%'],
            
            // Ice preferences  
            ices: ['Nóng', 'Ít đá', 'Vừa đá', 'Đầy đá']
        };
    }

    getWaveSize(rng, condition) {
        const dist = this.distributions.waveSize[condition] || this.distributions.waveSize.normal;
        const r = rng.next();
        let cumulative = 0;
        for (let i = 0; i < dist.length; i++) {
            cumulative += dist[i];
            if (r <= cumulative) return i + 1; // Wave size is 1-indexed
        }
        return 1;
    }

    getToppingCount(rng, customerType) {
        let dist;
        if (customerType === 5) dist = this.distributions.toppingCount.elder;
        else if (customerType === 'tiktoker') dist = this.distributions.toppingCount.tiktoker;
        else if (customerType === 6) dist = this.distributions.toppingCount.gymmer;
        else dist = this.distributions.toppingCount.normal;

        const r = rng.next();
        let cumulative = 0;
        for (let i = 0; i < dist.length; i++) {
            cumulative += dist[i];
            if (r <= cumulative) return i;
        }
        return 0;
    }

    getRandomSugar(rng) {
        return this.distributions.sugars[rng.int(0, this.distributions.sugars.length - 1)];
    }

    getRandomIce(rng) {
        return this.distributions.ices[rng.int(0, this.distributions.ices.length - 1)];
    }
}

/**
 * Object pooling for frequently created objects
 */
class ObjectPool {
    constructor(factory, reset = () => {}, initialSize = 100) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
        
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.factory();
    }

    release(obj) {
        this.reset(obj);
        this.pool.push(obj);
    }
}

// Create global instances for reuse
const fastRandom = new FastRandom();
const jsonOptimizer = new JsonOptimizer();
const idGenerator = new BatchIdGenerator(100);
const probabilityDistributions = new ProbabilityDistributions();

// Order object pool (pre-allocated to reduce GC pressure)
const orderPool = new ObjectPool(
    () => ({
        orderId: '',
        customerType: 0,
        customerName: '',
        quote: '',
        isTiktoker: false,
        isShipper: false,
        recipeId: '',
        recipeName: '',
        sugar: '',
        ice: '',
        toppings: [],
        price: 0,
        originalPrice: 0,
        negotiation: null,
        patienceMs: 0,
        expiresAt: 0,
        isOverloaded: false
    }),
    (obj) => {
        obj.orderId = '';
        obj.customerType = 0;
        obj.customerName = '';
        obj.quote = '';
        obj.isTiktoker = false;
        obj.isShipper = false;
        obj.recipeId = '';
        obj.recipeName = '';
        obj.sugar = '';
        obj.ice = '';
        obj.toppings.length = 0;
        obj.price = 0;
        obj.originalPrice = 0;
        obj.negotiation = null;
        obj.patienceMs = 0;
        obj.expiresAt = 0;
        obj.isOverloaded = false;
    },
    200
);

module.exports = {
    FastRandom,
    JsonOptimizer,
    BatchIdGenerator,
    ProbabilityDistributions,
    ObjectPool,
    
    // Global instances for convenience
    fastRandom,
    jsonOptimizer,
    idGenerator,
    probabilityDistributions,
    orderPool,
    
    // Helper functions
    getWaveCondition(activeBuffs, reputation, isInvitedTiktoker) {
        if (activeBuffs.tiktoker_status === 'viral') {
            const isBigCampaign = (activeBuffs.tiktoker_cost || 0) >= 1000000;
            return isBigCampaign ? 'viral_big' : 'viral_small';
        }
        if (activeBuffs.tiktoker_status === 'flop') return 'flop';
        if (reputation < 3.0 && !isInvitedTiktoker) return 'low_reputation';
        return 'normal';
    },
    
    // Optimized random quote selection
    getRandomQuote(quotes, rng) {
        return quotes[rng.int(0, quotes.length - 1)];
    },
    
    // Optimized customer selection
    findCustomerByType(customers, type) {
        for (let i = 0; i < customers.length; i++) {
            if (customers[i].type === type) return customers[i];
        }
        return customers[0];
    },
    
    // Performance monitoring
    performance: {
        mathRandomCalls: 0,
        jsonParseCalls: 0,
        cryptoCalls: 0,
        
        reset() {
            this.mathRandomCalls = 0;
            this.jsonParseCalls = 0;
            this.cryptoCalls = 0;
        },
        
        getStats() {
            return {
                mathRandomCalls: this.mathRandomCalls,
                jsonParseCalls: this.jsonParseCalls,
                cryptoCalls: this.cryptoCalls
            };
        }
    }
};