const assert = require('assert');
const express = require('express');

const adminRoutes = require('../routes/admin.routes');

async function testAdminLogin() {
  console.log('--- TESTING ADMIN LOGIN FLOW ---');
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);

  const server = app.listen(9876);

  async function postJson(url, body) {
    const res = await fetch(`http://localhost:9876${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return { status: res.status, body: data };
  }

  async function getWithAuth(url, token) {
    const res = await fetch(`http://localhost:9876${url}`, {
      headers: { 'x-admin-key': token }
    });
    const data = await res.json();
    return { status: res.status, body: data };
  }

  // Test 1: Login with default admin / admin123
  const res1 = await postJson('/api/admin/login', { username: 'admin', password: 'admin123' });
  assert.strictEqual(res1.status, 200, 'Login with admin / admin123 should return 200');
  assert.strictEqual(res1.body.success, true, 'Login should succeed');
  assert(res1.body.token, 'Should return token');
  console.log('✓ 1. Login with "admin" / "admin123" succeeded! Token:', res1.body.token);

  // Test 2: Verify with the returned token
  const resVerify = await getWithAuth('/api/admin/verify', res1.body.token);
  assert.strictEqual(resVerify.status, 200, 'Verify should return 200 with admin123 token');
  assert.strictEqual(resVerify.body.success, true, 'Verify should succeed');
  console.log('✓ 2. Token verification succeeded!');

  // Test 3: Login with alternate huytestadmin123
  const res2 = await postJson('/api/admin/login', { username: 'admin', password: 'huytestadmin123' });
  assert.strictEqual(res2.status, 200, 'Login with admin / huytestadmin123 should return 200');
  assert.strictEqual(res2.body.success, true);
  console.log('✓ 3. Login with "admin" / "huytestadmin123" succeeded!');

  // Test 4: Login with wrong password should fail
  const resFail = await postJson('/api/admin/login', { username: 'admin', password: 'wrongpassword' });
  assert.strictEqual(resFail.status, 401, 'Login with wrong password should return 401');
  assert.strictEqual(resFail.body.success, false);
  console.log('✓ 4. Login with wrong password correctly rejected (401)');

  server.close();

  console.log('\n=============================================');
  console.log(' ALL ADMIN LOGIN TESTS PASSED SUCCESSFULLY! ');
  console.log('=============================================\n');
}

testAdminLogin().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
