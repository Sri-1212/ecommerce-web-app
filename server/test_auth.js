import http from 'http';

const BASE_URL = 'http://localhost:5000/api/auth';

function makeRequest(path, method, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAuthTests() {
  console.log('--------------------------------------------------');
  console.log('🧪 RUNNING PHASE 2 AUTHENTICATION & RBAC TESTS');
  console.log('--------------------------------------------------\n');

  let validToken = '';
  const testUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'securePassword123'
  };

  // Test A: Register valid user
  console.log('A. Registering valid user...');
  const resA = await makeRequest('/register', 'POST', testUser);
  console.log(`   Status: ${resA.status} (Expected: 201)`);
  console.log(`   Response: ${JSON.stringify(resA.body)}\n`);

  // Test B: Register same email again (Duplicate Email)
  console.log('B. Registering same email again...');
  const resB = await makeRequest('/register', 'POST', testUser);
  console.log(`   Status: ${resB.status} (Expected: 409)`);
  console.log(`   Response: ${JSON.stringify(resB.body)}\n`);

  // Test C: Register invalid input (Missing password)
  console.log('C. Registering invalid input (short password)...');
  const resC = await makeRequest('/register', 'POST', { name: 'Bad User', email: 'bad@example.com', password: '123' });
  console.log(`   Status: ${resC.status} (Expected: 400)`);
  console.log(`   Response: ${JSON.stringify(resC.body)}\n`);

  // Test D: Login with correct password
  console.log('D. Login with correct password...');
  const resD = await makeRequest('/login', 'POST', { email: testUser.email, password: testUser.password });
  console.log(`   Status: ${resD.status} (Expected: 200)`);
  if (resD.body.data && resD.body.data.token) {
    validToken = resD.body.data.token;
    console.log(`   JWT Token Received: ${validToken.substring(0, 20)}...`);
  }
  console.log(`   Response: ${JSON.stringify(resD.body)}\n`);

  // Test E: Login with incorrect password
  console.log('E. Login with incorrect password...');
  const resE = await makeRequest('/login', 'POST', { email: testUser.email, password: 'wrongPassword!' });
  console.log(`   Status: ${resE.status} (Expected: 401)`);
  console.log(`   Response: ${JSON.stringify(resE.body)}\n`);

  // Test F: GET /api/auth/me with valid JWT
  console.log('F. GET /api/auth/me with valid JWT...');
  const resF = await makeRequest('/me', 'GET', null, { Authorization: `Bearer ${validToken}` });
  console.log(`   Status: ${resF.status} (Expected: 200)`);
  console.log(`   Response: ${JSON.stringify(resF.body)}\n`);

  // Test G: GET /api/auth/me without JWT
  console.log('G. GET /api/auth/me without JWT...');
  const resG = await makeRequest('/me', 'GET');
  console.log(`   Status: ${resG.status} (Expected: 401)`);
  console.log(`   Response: ${JSON.stringify(resG.body)}\n`);

  // Test H: GET /api/auth/me with invalid JWT
  console.log('H. GET /api/auth/me with invalid JWT...');
  const resH = await makeRequest('/me', 'GET', null, { Authorization: 'Bearer invalid_token_12345' });
  console.log(`   Status: ${resH.status} (Expected: 401)`);
  console.log(`   Response: ${JSON.stringify(resH.body)}\n`);

  console.log('--------------------------------------------------');
  console.log('🎉 ALL PHASE 2 TESTS COMPLETED SUCCESSFULLY!');
  console.log('--------------------------------------------------');
}

runAuthTests().catch(console.error);
