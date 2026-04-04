import http from 'k6/http';
import { check, sleep } from 'k6';

// CRITICAL: Use 'export let options' and include insecureSkipTLSVerify
export let options = {
    // Load test scenario - 4.5 minute test
    stages: [
        { duration: '30s', target: 10 },   // Ramp up to 10 users
        { duration: '1m', target: 10 },    // Stay at 10 users
        { duration: '30s', target: 20 },   // Ramp up to 20 users
        { duration: '2m', target: 20 },    // Stay at 20 users
        { duration: '30s', target: 0 },    // Ramp down to 0
    ],
    
    // REQUIRED for self-signed certificates
    insecureSkipTLSVerify: true,
    
    // Performance thresholds
    thresholds: {
        'http_req_failed': ['rate<0.01'],     // Less than 1% failures
        'http_req_duration': ['p(95)<1000'],  // 95% under 1 second
        'http_reqs': ['count>1000'],          // At least 1000 requests
    },
    
    // Setup timeouts
    setupTimeout: '60s',
    teardownTimeout: '60s',
};

export default function () {
    // Request configuration
    const params = {
        // Also include here for safety
        insecureSkipTLSVerify: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'k6-load-test',
        },
        timeout: '30s',
        tags: {
            endpoint: 'GetProductsAsync',
            test_type: 'load_test',
        },
    };
    
    // Make the request
    const response = http.get('https://host.docker.internal:7030/api/Product/GetProductsAsync', params);
    
    // Validate response
    check(response, {
        '✅ Status is 200': (r) => r.status === 200,
        '✅ Response time < 2s': (r) => r.timings.duration < 2000,
        '✅ Has response data': (r) => r.body && r.body.length > 0,
    });
    
    // Random think time between 0.5-2 seconds
    sleep(Math.random() * 1.5 + 0.5);
}

// Optional setup function
export function setup() {
    console.log('🚀 Starting load test against: https://localhost:7030');
    console.log('⏱️  Test duration: ~4.5 minutes');
    console.log('👥 Virtual users: 10-20 (ramping)');
    console.log('📊 Testing endpoint: /api/Product/GetProductsAsync');
    return { startTime: new Date().toISOString() };
}

// Optional teardown function
export function teardown(data) {
    console.log('🏁 Test completed at: ' + new Date().toISOString());
    console.log('⏰ Test started at: ' + data.startTime);
}