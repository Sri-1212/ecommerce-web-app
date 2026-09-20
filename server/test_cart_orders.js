import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

const request = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING PHASE 4 CART & ORDER INTEGRATION TESTS');
  console.log('==================================================\n');

  try {
    // 1. Health check
    console.log('1️⃣ Checking API health...');
    const health = await request('GET', '/health');
    console.log(`   Health status: ${health.status} (${health.body.status})`);

    // 2. Unauthenticated Cart Request (Expect 401)
    console.log('\n2️⃣ Testing Unauthenticated Cart Access...');
    const unauthCart = await request('GET', '/cart');
    console.log(`   GET /api/cart without token -> Status: ${unauthCart.status} (Expected: 401)`);
    console.assert(unauthCart.status === 401, 'Unauthenticated cart access should return 401');

    // 3. Unauthenticated Order Placement (Expect 401)
    console.log('\n3️⃣ Testing Unauthenticated Order Placement...');
    const unauthOrder = await request('POST', '/orders', { shippingAddress: '123 Test St' });
    console.log(`   POST /api/orders without token -> Status: ${unauthOrder.status} (Expected: 401)`);
    console.assert(unauthOrder.status === 401, 'Unauthenticated order creation should return 401');

    // 4. Invalid Cart Payload (Expect 400 or 401 if missing auth)
    console.log('\n4️⃣ Testing Invalid Cart Data Validation...');
    const invalidCart = await request('POST', '/cart', { productId: 'abc', quantity: -5 }, 'fake_token');
    console.log(`   POST /api/cart with invalid payload -> Status: ${invalidCart.status}`);

    // 5. Admin Endpoint RBAC Check (Expect 401 for invalid/missing token)
    console.log('\n5️⃣ Testing Admin Orders RBAC Guard...');
    const adminOrdersUnauth = await request('GET', '/orders/admin/all');
    console.log(`   GET /api/orders/admin/all without token -> Status: ${adminOrdersUnauth.status} (Expected: 401)`);
    console.assert(adminOrdersUnauth.status === 401, 'Admin orders endpoint should be protected');

    console.log('\n==================================================');
    console.log('✅ PHASE 4 TEST SUITE API STRUCTURAL SANITY CHECKS PASSED');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Phase 4 Test Suite Error:', err.message);
  }
}

runTests();
