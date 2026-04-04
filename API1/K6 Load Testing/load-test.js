import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '15s', target: 40 },
        { duration: '30s',  target: 40 },
        { duration: '15s', target: 200 },
        { duration: '30s',  target: 200 },
        { duration: '15s', target: 400 },
        { duration: '1m',  target: 400 },
        { duration: '30s', target: 0 },
    ],
    insecureSkipTLSVerify: true,
    thresholds: {
        'http_req_failed':   ['rate<0.05'],
        'http_req_duration': ['p(95)<2000'],
        'http_reqs':         ['count>1000'],
    },
};

/**
 * IMPORTANT:
 * If running from Docker → use host.docker.internal
 * If running locally → use kong-proxy.local
 */
const BASE = __ENV.BASE_URL || 'http://host.docker.internal/WeatherForecast';

export default function () {
    const roll = Math.random();
    let res;

    if (roll < 0.40) {
        // 40% — Happy path (read-heavy)
        res = http.get(`${BASE}/GetWeatherForecast`, {
            tags: { endpoint: 'GetWeatherForecast' }
        });

        check(res, {
            'GetWeatherForecast status 200': (r) => r.status === 200,
            'GetWeatherForecast < 2s':       (r) => r.timings.duration < 2000,
        });

    } else if (roll < 0.65) {
        // 25% — Write path
        res = http.post(`${BASE}/AddOrder`, JSON.stringify({
            productId: 1,
            quantity: 2
        }), {
            headers: { 'Content-Type': 'application/json' },
            tags: { endpoint: 'AddOrder' }
        });

        check(res, {
            'AddOrder status 200': (r) => r.status === 200,
        });

    } else if (roll < 0.80) {
        // 15% — Client errors
        res = http.get(`${BASE}/SimulateBadRequest`, {
            tags: { endpoint: 'SimulateBadRequest' }
        });

        check(res, {
            'BadRequest handled': (r) => r.status === 200 || r.status === 400,
        });

    } else if (roll < 0.92) {
        // 12% — Server errors
        res = http.get(`${BASE}/SimulateServerError`, {
            tags: { endpoint: 'SimulateServerError' }
        });

        check(res, {
            'ServerError handled': (r) => r.status === 200 || r.status === 500,
        });

    } else {
        // 8% — Expensive endpoint
        res = http.get(`${BASE}/SimulateMemoryPressure`, {
            timeout: '10s',
            tags: { endpoint: 'SimulateMemoryPressure' }
        });

        check(res, {
            'MemoryPressure status 200': (r) => r.status === 200,
        });
    }

    // Simulate real user think time
    sleep(Math.random() * 1.5 + 0.5);
}

export function setup() {
    console.log('🚀 LOAD TEST starting');
    console.log('Target: 100 concurrent users');
    console.log('Duration: ~6 minutes');
    console.log(`Base URL: ${BASE}`);
    return { startTime: new Date().toISOString() };
}

export function teardown(data) {
    console.log('🏁 LOAD TEST complete');
    console.log('Started: ' + data.startTime);
    console.log('Ended:   ' + new Date().toISOString());
}