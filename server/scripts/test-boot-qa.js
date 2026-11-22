/**
 * Boot & Fast-Loading QA Verification Test
 * 
 * Tests:
 * 1. public/index.html tag depth & structure
 * 2. public/dist/game.min.js and game.min.css integrity
 * 3. Client modules boot logic & error boundaries
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== [QA TEST: Boot & Loading Sequence] ===\n');

// 1. Verify HTML Structure
console.log('1. Checking public/index.html structure...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../../public/index.html'), 'utf8');

let divDepth = 0;
let hasNegativeDivDepth = false;
indexHtml.split('\n').forEach((line, idx) => {
  const opens = (line.match(/<div(\s|>|$)/gi) || []).length;
  const closes = (line.match(/<\/div>/gi) || []).length;
  divDepth += opens - closes;
  if (divDepth < 0 && !hasNegativeDivDepth) {
    hasNegativeDivDepth = true;
    console.error(`  [FAIL] Negative div depth at line ${idx + 1}: ${line.trim()}`);
  }
});

assert.strictEqual(divDepth, 0, 'index.html div depth must be balanced (0)');
assert.strictEqual(hasNegativeDivDepth, false, 'index.html must never have negative div depth');
console.log('  [PASS] index.html div depth is perfectly balanced (0).');

// Verify critical DOM elements exist in HTML
const requiredElements = [
  'id="game-container"',
  'id="modal-auth"',
  'id="form-login"',
  'id="form-register"',
  'id="btn-quick-play"',
  'id="modal-coffee-lounge"',
  'id="coffee-stage-canvas"',
  'id="toast"'
];

requiredElements.forEach(el => {
  assert(indexHtml.includes(el), `index.html must include element ${el}`);
});
console.log('  [PASS] All critical boot DOM containers exist in HTML.');

// 2. Verify Bundled Assets
console.log('\n2. Checking public/dist bundles...');
const bundleJsPath = path.join(__dirname, '../../public/dist/game.min.js');
const bundleCssPath = path.join(__dirname, '../../public/dist/game.min.css');

assert(fs.existsSync(bundleJsPath), 'public/dist/game.min.js must exist');
assert(fs.existsSync(bundleCssPath), 'public/dist/game.min.css must exist');

const bundleJs = fs.readFileSync(bundleJsPath, 'utf8');
const bundleCss = fs.readFileSync(bundleCssPath, 'utf8');

assert(bundleJs.length > 50000, 'game.min.js must be populated');
assert(bundleCss.length > 10000, 'game.min.css must be populated');
console.log(`  [PASS] game.min.js (${(bundleJs.length / 1024).toFixed(1)} KB) and game.min.css (${(bundleCss.length / 1024).toFixed(1)} KB) verified.`);

// 3. Verify Offline & Cold Start Resilience Logic
console.log('\n3. Verifying boot fallback logic in auth.js and save-sync.js...');
const authJs = fs.readFileSync(path.join(__dirname, '../../public/js/modules/auth.js'), 'utf8');
const saveSyncJs = fs.readFileSync(path.join(__dirname, '../../public/js/modules/save-sync.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../../public/js/app.js'), 'utf8');

assert(authJs.includes('loadLocalGameState'), 'auth.js must call loadLocalGameState for fast local-first boot');
assert(authJs.includes('hasActiveLocalSession'), 'auth.js must track local session to prevent auth modal flash');
assert(authJs.includes('Promise.race'), 'auth.js must have a timeout on getMe to prevent boot hangs');
assert(saveSyncJs.includes('latest'), 'save-sync.js must save and look up latest state key');
assert(appJs.includes('safeInit'), 'app.js must use safeInit error boundaries during bootstrap');
console.log('  [PASS] Boot error boundaries, timeout protections, and local-first fallbacks present.');

console.log('\n=== ALL QA BOOT CHECKS PASSED SUCCESSFULLY! ===\n');
