import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Options: defines the load test shape
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up: 0 to 50 virtual users (VUs)
    { duration: '1m', target: 200 },   // Load: Sustained 200 VUs
    { duration: '30s', target: 0 },    // Ramp-down: back to 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
    http_req_duration: ['p(95)<100'],  // 95% of requests must complete under 100ms
  },
};

// Replace with your target shortcode URL for load testing
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:8080/abc123';

export default function () {
  // We set redirects to 0 because we want to measure the latency of our redirection endpoint
  // without tracing the target site's response time.
  const res = http.get(TARGET_URL, { redirects: 0 });
  
  check(res, {
    'status is 302': (r) => r.status === 302,
  });
  
  // Throttle slightly to simulate real users
  sleep(0.1);
}
