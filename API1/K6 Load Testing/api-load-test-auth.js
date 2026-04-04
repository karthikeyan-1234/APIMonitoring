import http from 'k6/http';
import { check, sleep } from 'k6';

// Keycloak Configuration
const KEYCLOAK_CONFIG = {
    url: 'http://host.docker.internal:8080',
    realm: 'master',
    clientId: 'api-app',
    clientSecret: 'RKjFPnewLSUQGJAh4FvHPZ5EPSJGD1zD',
    username: 'mail2karthikkn@gmail.com',
    password: 'Arjun123*'
};

// API Configuration
const API_CONFIG = {
    baseUrl: 'https://host.docker.internal:7030',
    endpoint: '/api/Product/GetProductsAsync'
};

// Global token storage
let authToken = null;
let tokenExpiry = null;

// Get token from Keycloak
function getKeycloakToken() {
    console.log('🔑 Requesting token from Keycloak...');
    
    const tokenUrl = `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
    
    const payload = {
        client_id: KEYCLOAK_CONFIG.clientId,
        client_secret: KEYCLOAK_CONFIG.clientSecret,
        username: KEYCLOAK_CONFIG.username,
        password: KEYCLOAK_CONFIG.password,
        grant_type: 'password',
        scope: 'openid'
    };
    
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    
    const response = http.post(tokenUrl, payload, { headers: headers });
    
    if (response.status === 200) {
        const tokenData = JSON.parse(response.body);
        authToken = tokenData.access_token;
        tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
        
        console.log(`✅ Token obtained. Expires in: ${tokenData.expires_in} seconds`);
        return authToken;
    } else {
        console.log(`❌ Failed to get token: ${response.status}`);
        console.log(`Response: ${response.body}`);
        return null;
    }
}

// Ensure token is valid
function ensureValidToken() {
    if (!authToken || Date.now() >= tokenExpiry - 10000) { // Refresh 10s before expiry
        console.log('🔄 Token expired or about to expire. Refreshing...');
        return getKeycloakToken();
    }
    return authToken;
}

// Setup - get initial token
export function setup() {
    console.log('='.repeat(60));
    console.log('🔐 SETUP: Getting authentication token');
    console.log('='.repeat(60));
    
    const token = getKeycloakToken();
    
    if (!token) {
        throw new Error('Failed to obtain authentication token');
    }
    
    // Verify token works
    const testResponse = http.get(`${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        insecureSkipTLSVerify: true,
    });
    
    if (testResponse.status !== 200) {
        console.log(`❌ Token verification failed: ${testResponse.status}`);
        console.log(`Response: ${testResponse.body}`);
        throw new Error('Token not valid for API');
    }
    
    console.log('✅ Token verified successfully');
    console.log('='.repeat(60));
    
    return { token: token };
}

// Test Configuration - FIXED: Removed invalid options
export let options = {
    // Simple load test
    stages: [
        { duration: '10s', target: 3 },
        { duration: '30s', target: 5 },
        { duration: '20s', target: 0 },
    ],
    
    // Required for HTTPS
    insecureSkipTLSVerify: true,
    
    // FIXED: Correct threshold syntax
    thresholds: {
        'http_req_failed': ['rate<0.1'],           // Less than 10% failures
        'http_req_duration': ['p(95)<2000'],       // 95% under 2 seconds
        'http_reqs{status:200}': ['count>10'],     // At least 10 successful requests
    },
    
    // Setup timeouts
    setupTimeout: '60s',
    teardownTimeout: '60s',
};

// Main test function
export default function (data) {
    // Get valid token
    const token = ensureValidToken();
    
    if (!token) {
        console.log('❌ No valid token available');
        return;
    }
    
    // Make authenticated request
    const response = http.get(`${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        insecureSkipTLSVerify: true,
        timeout: '10s',
        tags: {
            name: 'authenticated_request',
            endpoint: 'GetProductsAsync'
        }
    });
    
    // Validate response - FIXED: Simple checks without complex tag expressions
    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time acceptable': (r) => r.timings.duration < 3000,
        'has response body': (r) => r.body && r.body.length > 0,
    });
    
    // Log failures
    if (response.status !== 200) {
        console.log(`Request failed: ${response.status} - ${response.error}`);
    }
    
    // Think time
    sleep(1);
}

// Teardown
export function teardown(data) {
    console.log('='.repeat(60));
    console.log('🏁 TEST COMPLETE');
    console.log('='.repeat(60));
}