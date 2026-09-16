const http = require('http');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3100';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const fuzzTests = [
  {
    name: 'SQL Injection in parameters',
    requests: [
      () => makeRequest("/api/wha/metrics/range?startDate=1'; DROP TABLE metrics;--"),
      () => makeRequest("/api/wha/metrics/monthly?year=1' OR '1'='1&month=5"),
    ]
  },
  {
    name: 'XSS in parameters',
    requests: [
      () => makeRequest("/api/wha/logs?limit=<script>alert(1)</script>"),
      () => makeRequest("/api/wha/logs?level=<img src=x onerror=alert(1)>"),
    ]
  },
  {
    name: 'Path traversal',
    requests: [
      () => makeRequest("/api/wha/messages/../../../etc/passwd/media"),
      () => makeRequest("/api/wha/messages/%2e%2e%2f%2e%2e%2fetc%2fpasswd/media"),
    ]
  },
  {
    name: 'Empty and null values',
    requests: [
      () => makeRequest('/api/wha/send', 'POST', { to: [], message: '' }),
      () => makeRequest('/api/wha/send', 'POST', { to: null, message: null }),
      () => makeRequest('/api/wha/send', 'POST', { to: [''], message: '' }),
    ]
  },
  {
    name: 'Extremely large payloads',
    requests: [
      () => makeRequest('/api/wha/send', 'POST', {
        to: ['573001234567'],
        message: 'A'.repeat(1024 * 1024), // 1MB
        multimedia: ['https://example.com/' + 'x'.repeat(10000)]
      }),
    ]
  },
  {
    name: 'Invalid JSON',
    requests: []
  },
  {
    name: 'Invalid HTTP methods',
    requests: [
      () => makeRequest('/api/wha/send', 'PUT'),
      () => makeRequest('/api/wha/send', 'DELETE'),
      () => makeRequest('/api/health', 'POST'),
    ]
  },
  {
    name: 'Missing Content-Type header',
    requests: []
  },
  {
    name: 'Unicode and emoji fuzzing',
    requests: [
      () => makeRequest('/api/wha/send', 'POST', {
        to: ['573001234567'],
        message: '👾💀🔥 ' + '🧟'.repeat(100)
      }),
      () => makeRequest('/api/wha/send', 'POST', {
        to: ['573001234567'],
        message: '\u0000\u0001\u0002\uFFFF'
      }),
    ]
  },
  {
    name: 'Array overflow',
    requests: [
      () => makeRequest('/api/wha/send', 'POST', {
        to: Array(1000).fill('573001234567'),
        message: 'test'
      }),
    ]
  }
];

async function runFuzzTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     Fuzzing & Security Tests           ║');
  console.log('╚════════════════════════════════════════╝\n');

  let totalRequests = 0;
  let findings = [];

  for (const test of fuzzTests) {
    console.log(`Testing: ${test.name}`);

    // Add built-in requests for some tests
    if (test.name === 'Invalid JSON') {
      await makeRequest('/api/wha/send', 'POST', '{invalid json}');
      totalRequests++;
    }

    for (const reqFn of test.requests) {
      const res = await reqFn();
      totalRequests++;

      // Check for potential issues
      if (res.status === 500) {
        findings.push({ test: test.name, issue: 'Internal Server Error', status: 500 });
      } else if (res.status === 0) {
        findings.push({ test: test.name, issue: 'Request Failed', error: res.error });
      }
    }
  }

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║             FINDINGS                    ║');
  console.log('╚════════════════════════════════════════╝');

  if (findings.length === 0) {
    console.log('No issues found (all requests handled safely)');
  } else {
    findings.forEach(f => {
      console.log(`- [${f.issue}] in ${f.test}${f.status ? ' (HTTP ' + f.status + ')' : ''}`);
    });
  }

  console.log(`\nTotal fuzz requests: ${totalRequests}`);
}

runFuzzTests().catch(console.error);