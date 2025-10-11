#!/usr/bin/env node

/**
 * Migration Verification Script
 * Tests that the Cloudflare Workers deployment is working correctly
 */

const https = require('https');
const http = require('http');

// Configuration
const TEST_TIMEOUT = 10000; // 10 seconds
let baseUrl = process.argv[2] || 'http://localhost:8787';

// Remove trailing slash
baseUrl = baseUrl.replace(/\/$/, '');

console.log('🧪 Cloudflare Workers Migration Verification');
console.log('='.repeat(50));
console.log(`Testing endpoint: ${baseUrl}`);
console.log('');

// Test endpoints
const tests = [
  {
    name: 'Health Check',
    path: '/api',
    method: 'GET',
    expectedStatus: 200,
    validate: (data) => {
      return data.status && data.version;
    }
  },
  {
    name: 'Stats Endpoint',
    path: '/api?action=stats',
    method: 'GET',
    expectedStatus: 200,
    validate: (data) => {
      return data.success !== undefined;
    }
  },
  {
    name: 'Sports API',
    path: '/api/sports?action=live_scores&sport=football&league=nfl',
    method: 'GET',
    expectedStatus: 200,
    validate: (data) => {
      return data.success !== undefined;
    }
  },
  {
    name: 'Contest Stats',
    path: '/api/stats',
    method: 'GET',
    expectedStatus: 200,
    validate: (data) => {
      return data.success !== undefined;
    }
  },
  {
    name: 'CORS Headers',
    path: '/api',
    method: 'OPTIONS',
    expectedStatus: 200,
    validateHeaders: (headers) => {
      return headers['access-control-allow-origin'] === '*';
    }
  }
];

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Migration-Verification-Script'
      },
      timeout: TEST_TIMEOUT
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`Testing: ${test.name.padEnd(30)}`);
    
    try {
      const url = baseUrl + test.path;
      const response = await makeRequest(url, test.method);

      // Check status code
      if (response.status !== test.expectedStatus) {
        console.log(`❌ FAILED`);
        console.log(`  Expected status ${test.expectedStatus}, got ${response.status}`);
        failed++;
        continue;
      }

      // Validate response data
      if (test.validate && !test.validate(response.data)) {
        console.log(`❌ FAILED`);
        console.log(`  Response validation failed`);
        console.log(`  Response:`, JSON.stringify(response.data, null, 2));
        failed++;
        continue;
      }

      // Validate headers
      if (test.validateHeaders && !test.validateHeaders(response.headers)) {
        console.log(`❌ FAILED`);
        console.log(`  Header validation failed`);
        failed++;
        continue;
      }

      console.log(`✅ PASSED`);
      passed++;

    } catch (error) {
      console.log(`❌ FAILED`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  console.log('');
  console.log('='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('');

  if (failed === 0) {
    console.log('✨ All tests passed! Migration successful! ✨');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set environment variables in Cloudflare dashboard');
    console.log('2. Deploy to production: npm run deploy:production');
    console.log('3. Update your frontend to use the new Worker URL');
    return 0;
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure the worker is running (npm run dev)');
    console.log('2. Check environment variables are set correctly');
    console.log('3. Review the logs for errors');
    console.log('4. See CLOUDFLARE-DEPLOYMENT.md for more help');
    return 1;
  }
}

// Main execution
console.log('Starting tests in 2 seconds...');
console.log('');

setTimeout(async () => {
  const exitCode = await runTests();
  process.exit(exitCode);
}, 2000);
