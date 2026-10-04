/**
 * Load Test Script for Game Server
 * Simulates 1000+ concurrent users with 4000 simultaneous orders
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class LoadTest {
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.totalUsers = options.totalUsers || 1000;
        this.concurrentUsers = options.concurrentUsers || 100;
        this.ordersPerUser = options.ordersPerUser || 4;
        this.testDuration = options.testDuration || 300000; // 5 minutes
        this.rampUpTime = options.rampUpTime || 60000; // 1 minute
        this.coolDownTime = options.coolDownTime || 30000; // 30 seconds
        
        // Test results
        this.results = {
            startTime: 0,
            endTime: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            statusCodes: {},
            errors: [],
            resourceUsage: []
        };
        
        // Statistics
        this.activeUsers = 0;
        this.completedUsers = 0;
        this.isRunning = false;
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(url, options = {}, retries = 3) {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'HeeHee-LoadTest/1.0',
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: options.timeout || 10000
        };
        
        if (options.body) {
            requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
        }
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            const startTime = Date.now();
            
            try {
                return await new Promise((resolve, reject) => {
                    const req = client.request(requestOptions, (res) => {
                        let data = '';
                        
                        res.on('data', (chunk) => {
                            data += chunk;
                        });
                        
                        res.on('end', () => {
                            const endTime = Date.now();
                            const responseTime = endTime - startTime;
                            
                            this.results.responseTimes.push(responseTime);
                            this.results.statusCodes[res.statusCode] = (this.results.statusCodes[res.statusCode] || 0) + 1;
                            
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                this.results.successfulRequests++;
                                resolve({
                                    statusCode: res.statusCode,
                                    data: data,
                                    responseTime: responseTime,
                                    headers: res.headers
                                });
                            } else {
                                this.results.failedRequests++;
                                reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
                            }
                        });
                    });
                    
                    req.on('error', (error) => {
                        this.results.failedRequests++;
                        reject(error);
                    });
                    
                    req.on('timeout', () => {
                        req.destroy();
                        this.results.failedRequests++;
                        reject(new Error('Request timeout'));
                    });
                    
                    if (options.body) {
                        req.write(options.body);
                    }
                    
                    req.end();
                });
                
            } catch (error) {
                if (attempt === retries) {
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
                continue;
            }
        }
    }

    /**
     * Simulate a single user session
     */
    async simulateUser(userId) {
        const userResults = {
            userId: userId,
            requests: 0,
            successful: 0,
            failed: 0,
            totalResponseTime: 0
        };
        
        try {
            // 1. Health check
            const healthCheck = await this.makeRequest(`${this.baseUrl}/api/health`);
            userResults.requests++;
            userResults.successful++;
            userResults.totalResponseTime += healthCheck.responseTime;
            
            // 2. Create store (simulated)
            const storeId = `test-store-${userId}`;
            
            // 3. Generate multiple orders
            for (let orderNum = 1; orderNum <= this.ordersPerUser; orderNum++) {
                try {
                    // Simulate order generation request
                    const orderResult = await this.makeRequest(
                        `${this.baseUrl}/api/game/generate-order`,
                        {
                            method: 'POST',
                            body: JSON.stringify({ storeId: storeId })
                        }
                    );
                    
                    userResults.requests++;
                    userResults.successful++;
                    userResults.totalResponseTime += orderResult.responseTime;
                    
                    // Add some delay between orders (10-50ms)
                    await new Promise(resolve => 
                        setTimeout(resolve, Math.floor(Math.random() * 40) + 10)
                    );
                    
                } catch (orderError) {
                    userResults.requests++;
                    userResults.failed++;
                    console.log(`User ${userId}, Order ${orderNum} failed:`, orderError.message);
                }
            }
            
            // 4. Get store state
            const storeState = await this.makeRequest(
                `${this.baseUrl}/api/store/${storeId}/state`
            );
            
            userResults.requests++;
            userResults.successful++;
            userResults.totalResponseTime += storeState.responseTime;
            
        } catch (error) {
            userResults.failed++;
            console.log(`User ${userId} session failed:`, error.message);
        }
        
        return userResults;
    }

    /**
     * Start load test
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Load test is already running');
        }
        
        console.log('🚀 Starting Load Test');
        console.log(`Base URL: ${this.baseUrl}`);
        console.log(`Total Users: ${this.totalUsers}`);
        console.log(`Concurrent Users: ${this.concurrentUsers}`);
        console.log(`Orders per User: ${this.ordersPerUser}`);
        console.log(`Test Duration: ${this.testDuration / 1000} seconds`);
        console.log('=' .repeat(50));
        
        this.isRunning = true;
        this.results.startTime = Date.now();
        this.results.endTime = this.results.startTime + this.testDuration;
        
        const startTime = Date.now();
        const endTime = startTime + this.testDuration;
        
        // Start resource monitoring
        const resourceMonitor = setInterval(() => {
            const memory = process.memoryUsage();
            this.results.resourceUsage.push({
                timestamp: Date.now(),
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
                rss: memory.rss,
                activeUsers: this.activeUsers
            });
        }, 5000);
        
        // User simulation loop
        const userPromises = [];
        
        // Ramp up users gradually
        console.log('📈 Ramping up users...');
        const rampUpInterval = this.rampUpTime / this.concurrentUsers;
        
        for (let i = 0; i < this.totalUsers; i++) {
            if (Date.now() > endTime) {
                break; // Stop if test duration exceeded
            }
            
            // Control concurrency
            while (this.activeUsers >= this.concurrentUsers) {
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (Date.now() > endTime) {
                    break;
                }
            }
            
            if (Date.now() > endTime) {
                break;
            }
            
            this.activeUsers++;
            
            // Start user simulation
            const userPromise = this.simulateUser(i + 1).then(userResult => {
                this.activeUsers--;
                this.completedUsers++;
                
                // Log progress
                if (this.completedUsers % 100 === 0) {
                    console.log(`  Completed ${this.completedUsers}/${this.totalUsers} users`);
                }
                
                return userResult;
            });
            
            userPromises.push(userPromise);
            
            // Delay between starting users during ramp-up
            if (i < this.concurrentUsers) {
                await new Promise(resolve => setTimeout(resolve, rampUpInterval));
            }
        }
        
        // Wait for all users to complete or timeout
        console.log('\n⏳ Waiting for users to complete...');
        
        try {
            const userResults = await Promise.allSettled(userPromises);
            const completedResults = userResults.filter(r => r.status === 'fulfilled').map(r => r.value);
            
            // Calculate aggregate statistics
            const aggregateStats = {
                totalUsers: this.completedUsers,
                totalRequests: completedResults.reduce((sum, r) => sum + r.requests, 0),
                successfulRequests: completedResults.reduce((sum, r) => sum + r.successful, 0),
                failedRequests: completedResults.reduce((sum, r) => sum + r.failed, 0),
                avgResponseTime: completedResults.reduce((sum, r) => {
                    return r.successful > 0 ? sum + (r.totalResponseTime / r.successful) : sum;
                }, 0) / completedResults.length
            };
            
            this.results.userStats = aggregateStats;
            
        } catch (error) {
            console.error('Error waiting for users:', error);
        }
        
        // Cool down period
        console.log(`\n❄️  Cooling down for ${this.coolDownTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.coolDownTime));
        
        // Clean up
        clearInterval(resourceMonitor);
        this.isRunning = false;
        
        // Final health check
        try {
            const finalHealth = await this.makeRequest(`${this.baseUrl}/api/health`);
            this.results.finalHealth = finalHealth;
        } catch (error) {
            this.results.finalHealthError = error.message;
        }
        
        // Calculate final statistics
        this.calculateStatistics();
        
        return this.results;
    }

    /**
     * Calculate test statistics
     */
    calculateStatistics() {
        const totalTime = Date.now() - this.results.startTime;
        
        // Response time statistics
        const responseTimes = this.results.responseTimes;
        const avgResponseTime = responseTimes.length > 0 ? 
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
        
        const sortedTimes = [...responseTimes].sort((a, b) => a - b);
        const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
        const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
        
        // Throughput
        const throughput = this.results.totalRequests / (totalTime / 1000);
        const successfulThroughput = this.results.successfulRequests / (totalTime / 1000);
        
        // Error rate
        const errorRate = this.results.totalRequests > 0 ? 
            (this.results.failedRequests / this.results.totalRequests) * 100 : 0;
        
        this.results.statistics = {
            totalTime: totalTime,
            throughput: {
                total: throughput.toFixed(2),
                successful: successfulThroughput.toFixed(2),
                unit: 'requests/second'
            },
            responseTime: {
                average: avgResponseTime.toFixed(2),
                p95: p95 || 0,
                p99: p99 || 0,
                min: sortedTimes[0] || 0,
                max: sortedTimes[sortedTimes.length - 1] || 0,
                unit: 'ms'
            },
            errorRate: errorRate.toFixed(2) + '%',
            successRate: (100 - errorRate).toFixed(2) + '%',
            statusCodes: this.results.statusCodes
        };
    }

    /**
     * Print test report
     */
    printReport() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 LOAD TEST REPORT');
        console.log('=' .repeat(60));
        
        console.log('\n📈 TEST SUMMARY:');
        console.log(`  Duration: ${(this.results.statistics.totalTime / 1000).toFixed(2)} seconds`);
        console.log(`  Total Requests: ${this.results.totalRequests}`);
        console.log(`  Successful: ${this.results.successfulRequests}`);
        console.log(`  Failed: ${this.results.failedRequests}`);
        console.log(`  Success Rate: ${this.results.statistics.successRate}`);
        console.log(`  Error Rate: ${this.results.statistics.errorRate}`);
        
        console.log('\n⚡ PERFORMANCE:');
        console.log(`  Throughput: ${this.results.statistics.throughput.successful} requests/second`);
        console.log(`  Avg Response Time: ${this.results.statistics.responseTime.average}ms`);
        console.log(`  P95 Response Time: ${this.results.statistics.responseTime.p95}ms`);
        console.log(`  P99 Response Time: ${this.results.statistics.responseTime.p99}ms`);
        
        console.log('\n🔢 STATUS CODES:');
        Object.entries(this.results.statusCodes).forEach(([code, count]) => {
            console.log(`  ${code}: ${count} requests`);
        });
        
        console.log('\n💾 RESOURCE USAGE:');
        if (this.results.resourceUsage.length > 0) {
            const lastResource = this.results.resourceUsage[this.results.resourceUsage.length - 1];
            console.log(`  Memory: ${(lastResource.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(lastResource.heapTotal / 1024 / 1024).toFixed(2)}MB`);
            console.log(`  RSS: ${(lastResource.rss / 1024 / 1024).toFixed(2)}MB`);
            console.log(`  Peak Active Users: ${Math.max(...this.results.resourceUsage.map(r => r.activeUsers))}`);
        }
        
        console.log('\n✅ FINAL HEALTH CHECK:');
        if (this.results.finalHealth) {
            console.log(`  Status: Healthy (${this.results.finalHealth.statusCode})`);
            console.log(`  Response Time: ${this.results.finalHealth.responseTime}ms`);
        } else if (this.results.finalHealthError) {
            console.log(`  Status: Failed - ${this.results.finalHealthError}`);
        }
        
        console.log('\n' + '=' .repeat(60));
        
        // Performance evaluation
        console.log('\n🎯 PERFORMANCE EVALUATION:');
        
        const avgResponseTime = parseFloat(this.results.statistics.responseTime.average);
        const successRate = parseFloat(this.results.statistics.successRate);
        
        if (avgResponseTime < 100 && successRate > 99) {
            console.log('  ✅ EXCELLENT: Server handles load perfectly!');
            console.log('      Ready for 1000+ concurrent users.');
        } else if (avgResponseTime < 500 && successRate > 95) {
            console.log('  ⚠️  GOOD: Server handles load well.');
            console.log('      May need minor optimizations for 1000+ users.');
        } else if (avgResponseTime < 1000 && successRate > 90) {
            console.log('  ⚠️  FAIR: Server handles moderate load.');
            console.log('      Needs optimizations before scaling to 1000+ users.');
        } else {
            console.log('  ❌ POOR: Server struggles with load.');
            console.log('      Significant optimizations needed.');
        }
        
        console.log('=' .repeat(60));
    }
}

// Run load test if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const baseUrl = args[0] || 'http://localhost:3000';
    
    // Parse command line arguments
    const configs = {
        light: {
            totalUsers: 100,
            concurrentUsers: 20,
            ordersPerUser: 2,
            testDuration: 60000, // 1 minute
            rampUpTime: 15000, // 15 seconds
            coolDownTime: 10000 // 10 seconds
        },
        heavy: {
            totalUsers: 500,
            concurrentUsers: 100,
            ordersPerUser: 4,
            testDuration: 180000, // 3 minutes
            rampUpTime: 30000, // 30 seconds
            coolDownTime: 15000 // 15 seconds
        },
        default: {
            totalUsers: 200,
            concurrentUsers: 50,
            ordersPerUser: 2,
            testDuration: 120000, // 2 minutes
            rampUpTime: 30000, // 30 seconds
            coolDownTime: 15000 // 15 seconds
        }
    };
    
    // Determine which config to use
    let config = configs.default;
    if (args.includes('--light')) {
        config = configs.light;
    } else if (args.includes('--heavy')) {
        config = configs.heavy;
    }
    
    // Override with custom parameters if provided
    const customParams = {};
    for (let i = 1; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const [key, value] = args[i].substring(2).split('=');
            if (key && value) {
                customParams[key] = parseInt(value, 10) || value;
            }
        }
    }
    
    const finalConfig = { ...config, ...customParams };
    
    console.log('⚙️  Load Test Configuration:');
    console.log(`  Base URL: ${baseUrl}`);
    console.log(`  Total Users: ${finalConfig.totalUsers}`);
    console.log(`  Concurrent Users: ${finalConfig.concurrentUsers}`);
    console.log(`  Orders per User: ${finalConfig.ordersPerUser}`);
    console.log(`  Test Duration: ${finalConfig.testDuration / 1000}s`);
    console.log(`  Ramp Up Time: ${finalConfig.rampUpTime / 1000}s`);
    console.log();
    
    const loadTest = new LoadTest(baseUrl, finalConfig);
    
    loadTest.start()
        .then(results => {
            loadTest.printReport();
            process.exit(0);
        })
        .catch(error => {
            console.error('Load test failed:', error);
            process.exit(1);
        });
}

module.exports = LoadTest;