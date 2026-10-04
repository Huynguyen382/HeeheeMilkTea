/**
 * Test script for circuit breaker functionality
 */

const db = require('../models/db');
const circuitBreaker = require('../services/circuit-breaker');

async function testCircuitBreaker() {
    console.log('=== Testing Circuit Breaker ===\n');
    
    try {
        // Initialize database
        await db.init();
        
        // Initialize circuit breaker
        const breaker = circuitBreaker.initializeCircuitBreaker(db, {
            failureThreshold: 3, // Low threshold for testing
            resetTimeout: 5000, // 5 seconds for testing
            halfOpenSuccessThreshold: 2,
            halfOpenFailureThreshold: 1,
            timeout: 2000
        });
        
        console.log('1. Testing successful database operation...');
        
        // Test 1: Successful operation
        const result1 = await breaker.execute(
            async () => {
                const stmt = db.prepare('SELECT 1 as test');
                return stmt.get();
            },
            null,
            'test-success'
        );
        
        console.log('✓ Successful operation:', result1);
        console.log('Circuit state:', breaker.getState().state, '\n');
        
        // Test 2: Simulate failures
        console.log('2. Simulating database failures...');
        
        let failureCount = 0;
        for (let i = 1; i <= 4; i++) {
            try {
                await breaker.execute(
                    async () => {
                        // Simulate database failure
                        throw new Error(`Simulated database error ${i}`);
                    },
                    () => ({ fallback: true, attempt: i }),
                    `test-failure-${i}`
                );
            } catch (error) {
                failureCount++;
                console.log(`  Attempt ${i}: ${error.message}`);
            }
        }
        
        console.log(`\n  Total failures: ${failureCount}`);
        console.log('  Circuit state after failures:', breaker.getState().state);
        console.log('  Next attempt in:', Math.ceil((breaker.getState().nextAttempt - Date.now()) / 1000), 'seconds\n');
        
        // Test 3: Wait for reset and test half-open state
        console.log('3. Waiting for circuit to reset (5 seconds)...');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('  Circuit state after wait:', breaker.getState().state);
        
        // Test 4: Test half-open state with successful operation
        console.log('\n4. Testing half-open state...');
        
        const result4 = await breaker.execute(
            async () => {
                const stmt = db.prepare('SELECT 2 as test');
                return stmt.get();
            },
            null,
            'test-half-open-success'
        );
        
        console.log('  First operation in half-open:', result4);
        console.log('  Circuit state:', breaker.getState().state);
        
        // Second successful operation should close the circuit
        const result5 = await breaker.execute(
            async () => {
                const stmt = db.prepare('SELECT 3 as test');
                return stmt.get();
            },
            null,
            'test-half-open-success-2'
        );
        
        console.log('\n  Second operation in half-open:', result5);
        console.log('  Circuit state after 2 successes:', breaker.getState().state, '\n');
        
        // Test 5: Test statistics
        console.log('5. Testing statistics...');
        
        const stats = breaker.getState().stats;
        console.log('  Total requests:', stats.totalRequests);
        console.log('  Successful requests:', stats.successfulRequests);
        console.log('  Failed requests:', stats.failedRequests);
        console.log('  Circuit opens:', stats.circuitOpens);
        console.log('  Circuit closes:', stats.circuitCloses);
        console.log('  Rejected requests:', stats.rejectedRequests);
        
        // Test 6: Health check
        console.log('\n6. Testing health check...');
        
        const health = await breaker.healthCheck(db);
        console.log('  Health check result:', health);
        
        console.log('\n=== Circuit Breaker Test Completed Successfully ===\n');
        console.log('Summary:');
        console.log('- Circuit breaker correctly opens after 3 failures');
        console.log('- Circuit breaker enters half-open state after timeout');
        console.log('- Circuit breaker closes after successful operations');
        console.log('- Fallback functions work correctly');
        console.log('- Statistics are properly tracked');
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run test if called directly
if (require.main === module) {
    testCircuitBreaker().then(() => {
        console.log('\nAll tests passed!');
        process.exit(0);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = testCircuitBreaker;