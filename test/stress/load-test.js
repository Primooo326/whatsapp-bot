const http = require('http');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3100';
const TARGET_PHONE = process.env.TEST_PHONE || '573001234567';

const results = {
  total: 0,
  success: 0,
  errors: 0,
  statusCodes: {}
};

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        results.total++;
        const status = res.statusCode;
        results.statusCodes[status] = (results.statusCodes[status] || 0) + 1;

        if (status >= 200 && status < 400) {
          results.success++;
        } else {
          results.errors++;
        }

        resolve({ status, body: data });
      });
    });

    req.on('error', (err) => {
      results.total++;
      results.errors++;
      console.error(`Request error: ${err.message}`);
      resolve({ status: 0, error: err.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testHealth() {
  console.log('\n=== Test: Health Check (100 petitions) ===');
  const start = Date.now();

  for (let i = 0; i < 100; i++) {
    await makeRequest('/api/health');
  }

  console.log(`Time: ${Date.now() - start}ms`);
  console.log(`Results:`, results.statusCodes);
}

async function testSendMessages(concurrency = 10, total = 50) {
  console.log(`\n=== Test: Send Messages (${total} petitions, ${concurrency} concurrent) ===`);

  const start = Date.now();
  let completed = 0;

  const promises = [];
  for (let i = 0; i < total; i++) {
    const promise = makeRequest('/api/wha/send', 'POST', {
      to: [TARGET_PHONE],
      message: `Stress test message ${i}`
    }).then(() => {
      completed++;
      if (completed % 10 === 0) {
        console.log(`Progress: ${completed}/${total}`);
      }
    });
    promises.push(promise);

    if (promises.length >= concurrency) {
      await Promise.race(promises);
      promises.splice(0, promises.length - concurrency + 1);
    }
  }

  await Promise.all(promises);

  console.log(`Time: ${Date.now() - start}ms`);
  console.log(`Results:`, results.statusCodes);
}

async function testInvalidPayload() {
  console.log('\n=== Test: Invalid Payload Fuzzing ===');

  const payloads = [
    { to: null, message: 'test' },
    { to: [], message: 'test' },
    { to: [123], message: 'test' },
    { message: 'no destination' },
    { to: ['test'], multimedia: 123 },
    { to: ['test'], tags: 'not-array' },
    { to: ['test'], message: 'a'.repeat(10000) },
  ];

  for (const payload of payloads) {
    const res = await makeRequest('/api/wha/send', 'POST', payload);
    console.log(`Payload: ${JSON.stringify(payload).substring(0, 50)}... => Status: ${res.status}`);
  }
}

async function testMetricsEndpoints() {
  console.log('\n=== Test: Metrics Endpoints (50 petitions) ===');
  const start = Date.now();

  for (let i = 0; i < 50; i++) {
    await makeRequest('/api/wha/metrics');
    await makeRequest('/api/wha/metrics/range?startDate=2026-01-01&endDate=2026-01-31');
    await makeRequest('/api/wha/metrics/monthly?year=2026&month=5');
  }

  console.log(`Time: ${Date.now() - start}ms`);
  console.log(`Results:`, results.statusCodes);
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     WhatsApp Bot Stress Tests          ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`Target: ${API_BASE}`);

  try {
    await testHealth();
    await testMetricsEndpoints();
    await testInvalidPayload();
    await testSendMessages(5, 20);

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║             SUMMARY                    ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Total requests: ${results.total}`);
    console.log(`Success: ${results.success}`);
    console.log(`Errors: ${results.errors}`);
    console.log('Status codes:', results.statusCodes);

  } catch (err) {
    console.error('Test error:', err);
  }
}

runAllTests();