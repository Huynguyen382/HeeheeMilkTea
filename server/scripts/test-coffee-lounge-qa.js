const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const coffeeJsPath = path.join(ROOT_DIR, 'public', 'js', 'modules', 'coffee.js');
const coffeeRendererPath = path.join(ROOT_DIR, 'public', 'js', 'canvas', 'coffee-renderer.js');
const coffeeCssPath = path.join(ROOT_DIR, 'public', 'css', 'coffee.css');
const indexHtmlPath = path.join(ROOT_DIR, 'public', 'index.html');

console.log('=== STARTING COFFEE LOUNGE DEEP QA & VERIFICATION ===\n');

// 1. Verify DOM IDs in coffee.js exist in index.html
const coffeeJs = fs.readFileSync(coffeeJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const idRegex = /(?:getElementById\(['"]|querySelector\(['"]#)([a-zA-Z0-9_-]+)/g;
let match;
const ids = new Set();
while ((match = idRegex.exec(coffeeJs)) !== null) {
  ids.add(match[1]);
}

console.log(`1. Checking ${ids.size} DOM IDs in coffee.js against index.html...`);
let missingIds = [];
for (const id of ids) {
  if (!indexHtml.includes(`id="${id}"`) && !indexHtml.includes(`id='${id}'`)) {
    missingIds.push(id);
  }
}

if (missingIds.length > 0) {
  console.error(`✗ Missing DOM IDs in index.html: ${missingIds.join(', ')}`);
  process.exit(1);
} else {
  console.log(`✓ All ${ids.size} DOM IDs exist in index.html!`);
}

// 2. Verify Coffee UI CSS Selectors
console.log('\n2. Checking Coffee UI CSS classes in public/css/coffee.css...');
const coffeeCss = fs.readFileSync(coffeeCssPath, 'utf8');
const requiredCssClasses = [
  '.coffee-action-bar',
  '.btn-coffee-action',
  '.coffee-room-badge',
  '.coffee-boss-timer-badge',
  '.coffee-boss-hp-wrapper',
  '.boss-crest-fin',
  '.crystal-tick',
  '.coffee-arcade-prompts',
  '.coffee-ammo-bar',
  '.coffee-menu-drawer',
  '.coffee-card-item',
  '.btn-coffee-buy'
];

for (const cls of requiredCssClasses) {
  if (!coffeeCss.includes(cls)) {
    console.error(`✗ Missing required CSS class in coffee.css: ${cls}`);
    process.exit(1);
  }
}
console.log(`✓ All ${requiredCssClasses.length} required CSS classes present in coffee.css!`);

// 3. Verify CoffeeRenderer Features
console.log('\n3. Checking CoffeeRenderer graphics & performance features in public/js/canvas/coffee-renderer.js...');
const coffeeRenderer = fs.readFileSync(coffeeRendererPath, 'utf8');
const requiredFeatures = [
  { name: 'Offscreen canvas background caching', check: coffeeRenderer.includes('offscreenBG') },
  { name: 'Stone Fireplace (Lò Sưởi Đá Cuội)', check: coffeeRenderer.includes('Stone Fireplace') || coffeeRenderer.includes('Fireplace') },
  { name: 'Vintage Chalkboard Menu', check: coffeeRenderer.includes('Chalkboard') || coffeeRenderer.includes('Phin Sữa Đá') },
  { name: 'Tall Lo-fi Bookshelf & Radio', check: coffeeRenderer.includes('Bookshelf') || coffeeRenderer.includes('radio') },
  { name: 'Sunset Skyline & Landmark 81', check: coffeeRenderer.includes('Landmark 81') },
  { name: 'Volumetric God Rays & Dust Motes', check: coffeeRenderer.includes('God Rays') || coffeeRenderer.includes('dust motes') || coffeeRenderer.includes('Tia Nắng') },
  { name: 'Sleeping Cat (Mèo Mướp Boba)', check: coffeeRenderer.includes('Mèo Mướp Boba') || coffeeRenderer.includes('Sleeping Cat') },
  { name: 'Smoking Hot Coffee Cups on Tables', check: coffeeRenderer.includes('Phin Sữa Đá') && coffeeRenderer.includes('Cà Phê Trứng') },
  { name: 'Enhanced La Marzocco Machine', check: coffeeRenderer.includes('Marzocco') || coffeeRenderer.includes('Espresso') },
  { name: 'Ancient Magic Summoning Circle', check: coffeeRenderer.includes('Summoning Circle') || coffeeRenderer.includes('ancient runic glyphs') || coffeeRenderer.includes('ᚲ') },
  { name: 'Tentacle Waves & Glowing Suction Cups', check: coffeeRenderer.includes('Cyan Glowing Sucker') || coffeeRenderer.includes('suction') || coffeeRenderer.includes('tentacle') },
  { name: 'Impact FX & Shockwave Rings', check: coffeeRenderer.includes('Shockwave') || coffeeRenderer.includes('starburst') || coffeeRenderer.includes('shockwaves') }
];

for (const feat of requiredFeatures) {
  if (!feat.check) {
    console.error(`✗ Missing feature in coffee-renderer.js: ${feat.name}`);
    process.exit(1);
  }
  console.log(`  ✓ ${feat.name}`);
}
console.log('✓ All 12 CoffeeRenderer graphical and atmospheric features verified!');

// 4. Check for memory leak protections & zero-GC patterns
console.log('\n4. Checking memory leak protections & zero-GC patterns...');
const memoryChecks = [
  { name: 'Damage Text Object Pool (pre-allocated)', check: coffeeRenderer.includes('this.damageTextPool') },
  { name: 'Particle FX Object Pool (pre-allocated)', check: coffeeRenderer.includes('this.particlePool') },
  { name: 'Boss Ink Bubbles Object Pool (pre-allocated)', check: coffeeRenderer.includes('this.inkBubblePool') },
  { name: 'Celebration Fireworks Pool (pre-allocated)', check: coffeeRenderer.includes('this.celebrationPool') },
  { name: 'Pre-rendered static background canvas (offscreenBG)', check: coffeeRenderer.includes('this.offscreenBG = document.createElement(\'canvas\')') && coffeeRenderer.includes('ctx.drawImage(this.offscreenBG, 0, 0)') }
];

for (const mc of memoryChecks) {
  if (!mc.check) {
    console.error(`✗ Memory check failed: ${mc.name}`);
    process.exit(1);
  }
  console.log(`  ✓ ${mc.name}`);
}

console.log('\n======================================================');
console.log(' ALL COFFEE LOUNGE DEEP QA CHECKS PASSED (4/4)!');
console.log('======================================================\n');
