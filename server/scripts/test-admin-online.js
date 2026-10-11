const assert = require('assert');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = ''; // Local SQLite for test

const db = require('../models/db');
const collabService = require('../services/game/collab.service');
const liveSync = require('../services/live-sync.service');

async function runTests() {
  console.log('--- STARTING ADMIN ONLINE PRESENCE TESTS ---');

  // 1. Database Init
  await db.init();
  assert(db, 'DB instance should exist');
  console.log('✓ 1. Database connected successfully');

  // 2. Create / Get a test store
  const testStoreName = 'Tiệm Test Online ' + Date.now();
  const testStoreCode = 'TEST_ON_' + Math.floor(Math.random() * 10000);
  const now = new Date().toISOString();
  await db.run(
    'INSERT INTO stores (username, store_code, store_name, created_at) VALUES (?, ?, ?, ?)',
    'user_' + Date.now(), testStoreCode, testStoreName, now
  );
  const store = await db.get('SELECT * FROM stores WHERE store_code = ?', testStoreCode);
  const testStoreId = store.id;
  assert(testStoreId, 'Test store should be created');
  console.log(`✓ 2. Created test store (ID: ${testStoreId}, Code: ${testCode = testStoreCode})`);

  // 3. Initially without heartbeat, store should not be online
  const initialOnline = collabService.isStoreOnline(testStoreId);
  const initialSse = liveSync.isStoreSSEConnected(testStoreId);
  assert(!initialOnline, 'Store should not be online initially');
  assert(!initialSse, 'Store should not have SSE initially');
  console.log('✓ 3. Verified store is initially offline');

  // 4. Record heartbeat
  collabService.recordStoreHeartbeat(testStoreId);
  assert(collabService.isStoreOnline(testStoreId), 'Store should be online after recording heartbeat');
  const hbTime = collabService.getStoreHeartbeatTime(testStoreId);
  assert(hbTime && Date.now() - hbTime < 1000, 'Heartbeat timestamp should be recent');
  console.log('✓ 4. Verified heartbeat tracking: store is online');

  // 5. Test SSE registration
  let streamClosed = false;
  let sentData = [];
  const mockRes = {
    write: (chunk) => sentData.push(chunk),
    on: (evt, cb) => {
      if (evt === 'close') {
        mockRes.closeCb = cb;
      }
    }
  };

  liveSync.registerSSE(testStoreId, mockRes);
  assert(liveSync.isStoreSSEConnected(testStoreId), 'Store should have active SSE connection');
  const sseStoreIds = liveSync.getActiveSSEStoreIds();
  assert(sseStoreIds.includes(Number(testStoreId)), 'getActiveSSEStoreIds should include testStoreId');
  console.log('✓ 5. Verified SSE stream presence tracking');

  // 6. Test SSE disconnect
  if (mockRes.closeCb) mockRes.closeCb();
  assert(!liveSync.isStoreSSEConnected(testStoreId), 'Store SSE should be disconnected after close event');
  console.log('✓ 6. Verified SSE disconnection cleanup');

  // 7. Verify presence helper logic used in admin routes
  function getStorePresence(storeId) {
    const sid = Number(storeId);
    const n = Date.now();
    const isSse = liveSync.isStoreSSEConnected(sid);
    const lastActive = collabService.getStoreHeartbeatTime(sid);
    const isHeartbeat = !!(lastActive && (n - lastActive < 60000));
    const isOnline = isSse || isHeartbeat;
    const idleSeconds = lastActive ? Math.max(0, Math.floor((n - lastActive) / 1000)) : (isSse ? 0 : null);

    return {
      is_online: isOnline,
      last_active_at: lastActive,
      idle_seconds: idleSeconds,
      connection_type: isSse ? 'sse' : (isHeartbeat ? 'heartbeat' : 'offline')
    };
  }

  const presence = getStorePresence(testStoreId);
  assert(presence.is_online === true, 'Presence is_online should be true');
  assert(presence.connection_type === 'heartbeat', 'Connection type should be heartbeat');
  assert(presence.idle_seconds !== null && presence.idle_seconds <= 2, 'Idle seconds should be <= 2s');
  console.log(`✓ 7. Verified presence payload: is_online = true, conn = ${presence.connection_type}, idle = ${presence.idle_seconds}s`);

  // 8. Re-test with active SSE connection
  const mockRes2 = { write: () => {}, on: (evt, cb) => { mockRes2.closeCb = cb; } };
  liveSync.registerSSE(testStoreId, mockRes2);
  const presenceSse = getStorePresence(testStoreId);
  assert(presenceSse.is_online === true, 'Presence should be online with SSE');
  assert(presenceSse.connection_type === 'sse', 'Connection type should be sse');
  console.log('✓ 8. Verified priority connection_type: "sse"');
  if (mockRes2.closeCb) mockRes2.closeCb();

  console.log('\n======================================================');
  console.log(' ALL ADMIN ONLINE PRESENCE TESTS PASSED (8/8)! ');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
