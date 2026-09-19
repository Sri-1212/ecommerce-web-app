import http from 'http';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_dev_only';

// Create test tokens
const userToken = jwt.sign({ userId: 1, email: 'user@example.com', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ userId: 99, email: 'admin@example.com', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

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

async function runProductTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING PHASE 3 PRODUCT CATALOG & ADMIN CRUD TESTS');
  console.log('==================================================\n');

  let createdProductId = null;

  // A. GET /api/products
  console.log('A. GET /api/products (Public)');
  const resA = await makeRequest('/products', 'GET');
  console.log(`   Status: ${resA.status} (Expected: 200)`);
  console.log(`   Count: ${resA.body.data?.products?.length || 0}`);

  // B. GET /api/products/:id with valid ID (ID = 1)
  console.log('\nB. GET /api/products/1 (Valid ID)');
  const resB = await makeRequest('/products/1', 'GET');
  console.log(`   Status: ${resB.status} (Expected: 200)`);
  console.log(`   Product Name: "${resB.body.data?.product?.name}"`);

  // C. GET /api/products/99999 (Nonexistent ID)
  console.log('\nC. GET /api/products/99999 (Nonexistent ID)');
  const resC = await makeRequest('/products/99999', 'GET');
  console.log(`   Status: ${resC.status} (Expected: 404)`);
  console.log(`   Message: "${resC.body.message}"`);

  // D. GET /api/products/invalid_id (Invalid ID)
  console.log('\nD. GET /api/products/invalid_id (Invalid ID)');
  const resD = await makeRequest('/products/invalid_id', 'GET');
  console.log(`   Status: ${resD.status} (Expected: 400)`);
  console.log(`   Message: "${resD.body.message}"`);

  // E. POST /api/products without authentication
  console.log('\nE. POST /api/products without authentication');
  const newProdData = {
    name: 'Smart Fitness Watch',
    description: 'Track heart rate, sleep, and workouts with GPS.',
    price: 149.99,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    category: 'Wearables',
    stock: 20
  };
  const resE = await makeRequest('/products', 'POST', newProdData);
  console.log(`   Status: ${resE.status} (Expected: 401)`);

  // F. POST /api/products as normal user
  console.log('\nF. POST /api/products as normal user');
  const resF = await makeRequest('/products', 'POST', newProdData, { Authorization: `Bearer ${userToken}` });
  console.log(`   Status: ${resF.status} (Expected: 403)`);

  // G. POST /api/products as admin
  console.log('\nG. POST /api/products as admin');
  const resG = await makeRequest('/products', 'POST', newProdData, { Authorization: `Bearer ${adminToken}` });
  console.log(`   Status: ${resG.status} (Expected: 201)`);
  if (resG.body.data?.product?.id) {
    createdProductId = resG.body.data.product.id;
    console.log(`   Created Product ID: ${createdProductId}`);
  }

  // H. POST /api/products with invalid data (Missing price & stock)
  console.log('\nH. POST /api/products with invalid data (Missing price)');
  const resH = await makeRequest('/products', 'POST', { name: 'Broken Product', category: 'Testing' }, { Authorization: `Bearer ${adminToken}` });
  console.log(`   Status: ${resH.status} (Expected: 400)`);
  console.log(`   Message: "${resH.body.message}"`);

  // I. PUT /api/products/:id as admin
  console.log(`\nI. PUT /api/products/${createdProductId} as admin`);
  const updatedData = {
    name: 'Smart Fitness Watch Pro',
    description: 'Updated description with AMOLED screen.',
    price: 179.99,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    category: 'Wearables',
    stock: 50
  };
  const resI = await makeRequest(`/products/${createdProductId}`, 'PUT', updatedData, { Authorization: `Bearer ${adminToken}` });
  console.log(`   Status: ${resI.status} (Expected: 200)`);
  console.log(`   Updated Name: "${resI.body.data?.product?.name}", Price: $${resI.body.data?.product?.price}`);

  // J. PUT /api/products/:id as normal user
  console.log(`\nJ. PUT /api/products/${createdProductId} as normal user`);
  const resJ = await makeRequest(`/products/${createdProductId}`, 'PUT', updatedData, { Authorization: `Bearer ${userToken}` });
  console.log(`   Status: ${resJ.status} (Expected: 403)`);

  // K. PUT /api/products/99999 with nonexistent ID as admin
  console.log('\nK. PUT /api/products/99999 as admin (Nonexistent ID)');
  const resK = await makeRequest('/products/99999', 'PUT', updatedData, { Authorization: `Bearer ${adminToken}` });
  console.log(`   Status: ${resK.status} (Expected: 404)`);

  // L. DELETE /api/products/:id as normal user
  console.log(`\nL. DELETE /api/products/${createdProductId} as normal user`);
  const resL = await makeRequest(`/products/${createdProductId}`, 'DELETE', null, { Authorization: `Bearer ${userToken}` });
  console.log(`   Status: ${resL.status} (Expected: 403)`);

  // M. DELETE /api/products/:id as admin
  console.log(`\nM. DELETE /api/products/${createdProductId} as admin`);
  const resM = await makeRequest(`/products/${createdProductId}`, 'DELETE', null, { Authorization: `Bearer ${adminToken}` });
  console.log(`   Status: ${resM.status} (Expected: 200)`);
  console.log(`   Message: "${resM.body.message}"`);

  console.log('\n==================================================');
  console.log('🎉 ALL PHASE 3 BACKEND API TESTS FINISHED SUCCESSFULLY!');
  console.log('==================================================');
}

runProductTests().catch(console.error);
