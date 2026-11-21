const fs = require('fs');
const assert = require('assert');

// Mock browser globals for test environment
if (typeof global.localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

async function testStoryAndGameplay() {
  console.log('=== STARTING DEEP QA & VERIFICATION TEST ===\n');

  // 1. Check story-data.js module
  const storyDataModule = await import('../../public/js/modules/story-data.js');
  const { STORY_DATA, STORY_MILESTONES } = storyDataModule;

  assert(STORY_DATA, 'STORY_DATA not exported!');
  assert(STORY_MILESTONES, 'STORY_MILESTONES not exported!');

  console.log('✓ 1. STORY_DATA and STORY_MILESTONES imported successfully');

  // Check 5 chapters
  for (let c = 1; c <= 5; c++) {
    const chap = STORY_DATA[c];
    assert(chap, `Chapter ${c} is missing in STORY_DATA!`);
    assert(chap.title, `Chapter ${c} title is missing!`);
    assert(Array.isArray(chap.scenes) && chap.scenes.length > 0, `Chapter ${c} has no scenes!`);
    console.log(`✓ 2.${c} Chapter ${c} verified: "${chap.title}" (${chap.scenes.length} scenes)`);
  }

  // Check 5 milestones
  assert.strictEqual(STORY_MILESTONES.length, 5, `Expected 5 milestones, found ${STORY_MILESTONES.length}`);

  const expectedMilestones = [
    {
      id: 'c1_milestone_1_5m',
      chapter: 1,
      sceneIdx: 8,
      badgeName: '🏅 Trượng Nghĩa Phố Cũ',
      speaker: 'Anh Bảnh'
    },
    {
      id: 'c2_milestone_25m',
      chapter: 2,
      sceneIdx: 7,
      badgeName: '🛡️ Bản Lĩnh Doanh Nhân',
      speaker: 'Lão Ba'
    },
    {
      id: 'c3_milestone_moc_chau',
      chapter: 3,
      sceneIdx: 5,
      badgeName: '🌱 Nông Trại Đồi Chè 5⭐',
      speaker: 'Bé Bắp & Anh Lâm'
    },
    {
      id: 'c4_milestone_auction',
      chapter: 4,
      sceneIdx: 5,
      badgeName: '🏆 Vang Danh Trà Cổ Thụ',
      speaker: 'Chủ Tịch HeeHee'
    },
    {
      id: 'c5_milestone_grand_epilogue',
      chapter: 5,
      sceneIdx: 6,
      badgeName: '👑 Vua Trà Sữa Vũ Trụ',
      speaker: 'Đại Gia Đình Tiệm Trà Sữa HeeHee'
    }
  ];

  for (const exp of expectedMilestones) {
    const m = STORY_MILESTONES.find(item => item.id === exp.id);
    assert(m, `Milestone ${exp.id} not found in STORY_MILESTONES!`);
    assert.strictEqual(m.chapter, exp.chapter);
    assert.strictEqual(m.sceneIdx, exp.sceneIdx);
    assert.strictEqual(m.badgeName, exp.badgeName);

    // Verify scene details in STORY_DATA
    const chap = STORY_DATA[m.chapter];
    const sc = chap.scenes[m.sceneIdx];
    assert(sc, `Scene ${m.sceneIdx} missing in Chapter ${m.chapter}!`);
    assert.strictEqual(sc.id, exp.id, `Scene id mismatch! Expected ${exp.id}, got ${sc.id}`);
    assert.strictEqual(sc.isMilestone, true, `Scene ${exp.id} must be flagged isMilestone`);
    assert(sc.milestoneTitle, `Scene ${exp.id} missing milestoneTitle`);
    assert(sc.speaker.includes(exp.speaker), `Scene ${exp.id} speaker unexpected: ${sc.speaker}`);
    assert(sc.avatar, `Scene ${exp.id} missing avatar`);
    assert(sc.hint && sc.hint.text, `Scene ${exp.id} missing hint text`);
    assert(sc.text && sc.text.length > 50, `Scene ${exp.id} text too short`);

    console.log(`✓ 3. Verified Milestone [${m.id}]: "${sc.milestoneTitle}" | Scene ${m.sceneIdx} | Badge: ${m.badgeName}`);
  }

  // Check checkUnlocked predicate functions
  const m1 = STORY_MILESTONES.find(m => m.id === 'c1_milestone_1_5m');
  assert.strictEqual(m1.checkUnlocked({ chapter: 1, debt_remaining: 2000000 }), false);
  assert.strictEqual(m1.checkUnlocked({ chapter: 1, debt_remaining: 1500000 }), true);
  assert.strictEqual(m1.checkUnlocked({ chapter: 1, debt_remaining: 1000000 }), true);
  assert.strictEqual(m1.checkUnlocked({ chapter: 2, debt_remaining: 0 }), true);

  const m2 = STORY_MILESTONES.find(m => m.id === 'c2_milestone_25m');
  assert.strictEqual(m2.checkUnlocked({ chapter: 2, money: 20000000 }), false);
  assert.strictEqual(m2.checkUnlocked({ chapter: 2, money: 25000000 }), true);
  assert.strictEqual(m2.checkUnlocked({ chapter: 2, money: 35000000 }), true);
  assert.strictEqual(m2.checkUnlocked({ chapter: 3, money: 5000000 }), true);

  const m3 = STORY_MILESTONES.find(m => m.id === 'c3_milestone_moc_chau');
  assert.strictEqual(m3.checkUnlocked({ chapter: 3, money: 20000000, upgrades: '{}' }), false);
  assert.strictEqual(m3.checkUnlocked({ chapter: 3, money: 20000000, upgrades: '{"staff_be_bap_manager": true}' }), true);
  assert.strictEqual(m3.checkUnlocked({ chapter: 3, money: 20000000, upgrades: '{"staff_anh_lam_captain": true}' }), true);
  assert.strictEqual(m3.checkUnlocked({ chapter: 3, money: 60000000, upgrades: '{}' }), true);
  assert.strictEqual(m3.checkUnlocked({ chapter: 4 }), true);

  const m4 = STORY_MILESTONES.find(m => m.id === 'c4_milestone_auction');
  assert.strictEqual(m4.checkUnlocked({ chapter: 4, money: 50000000, auction_won_count: 0 }), false);
  assert.strictEqual(m4.checkUnlocked({ chapter: 4, money: 50000000, auction_won_count: 1 }), true);
  assert.strictEqual(m4.checkUnlocked({ chapter: 4, money: 120000000 }), true);
  assert.strictEqual(m4.checkUnlocked({ chapter: 5 }), true);

  const m5 = STORY_MILESTONES.find(m => m.id === 'c5_milestone_grand_epilogue');
  assert.strictEqual(m5.checkUnlocked({ chapter: 4 }), false);
  assert.strictEqual(m5.checkUnlocked({ chapter: 5 }), true);

  console.log('✓ 4. All milestone checkUnlocked predicates verified');

  // 4. Test Story Tracker logic from story-tracker.js
  const trackerModule = await import('../../public/js/modules/story-tracker.js');
  const { getActiveStoryQuest } = trackerModule;
  const { state } = await import('../../public/js/modules/state.js');

  // Test C1 start
  state.storeState = { save: { chapter: 1, money: 200000, debt_remaining: 3000000, recipes: '["tra_sua_truyen_thong"]' }, daily_stats: { orders_served: 0 } };
  let q = getActiveStoryQuest();
  assert.strictEqual(q.chapter, 1);
  assert(q.title.includes('Giao ly trà sữa đầu tiên') || q.title.includes('Đôi Bàn Tay Vàng'));

  // Test C1 need recipes
  state.storeState.daily_stats.orders_served = 2;
  q = getActiveStoryQuest();
  assert(q.title.includes('Mở Rộng Thực Đơn'));

  // Test C1 mid debt (1.5M milestone target)
  state.storeState.save.recipes = '["tra_sua_truyen_thong", "luc_tra_lai"]';
  state.storeState.save.debt_remaining = 2000000;
  q = getActiveStoryQuest();
  assert(q.title.includes('1.5M') || q.title.includes('Anh Bảnh'));

  // Test C1 debt clean
  state.storeState.save.debt_remaining = 0;
  q = getActiveStoryQuest();
  assert(q.title.includes('Đã Sạch Nợ') || q.pct === 100);

  // Test C2
  state.storeState.save.chapter = 2;
  state.storeState.save.money = 5000000;
  state.storeState.save.recipes = '["tra_sua_truyen_thong"]';
  q = getActiveStoryQuest();
  assert.strictEqual(q.chapter, 2);
  assert(q.title.includes('Trà Đào Cam Sả') || q.title.includes('Đường Đen'));

  // Test C3
  state.storeState.save.chapter = 3;
  state.storeState.save.recipes = '["tra_sua_truyen_thong", "tra_sua_dat_vang"]';
  state.storeState.save.upgrades = '{}';
  q = getActiveStoryQuest();
  assert.strictEqual(q.chapter, 3);
  assert(q.title.includes('Bé Bắp') || q.title.includes('Cửa Hàng Trưởng'));

  // Test C4
  state.storeState.save.chapter = 4;
  state.storeState.save.recipes = '["tra_sua_truyen_thong", "matcha_kyoto_dat_bac"]';
  state.storeState.save.auction_won_count = 0;
  state.storeState.save.franchises = '[]';
  q = getActiveStoryQuest();
  assert.strictEqual(q.chapter, 4);
  assert(q.title.includes('Đấu Giá') || q.title.includes('Trà Cổ Thụ'));

  // Test C5
  state.storeState.save.chapter = 5;
  state.storeState.save.cart_skin = 'cosmic_coffee_cart';
  state.storeState.save.recipes = '["tra_sua_vu_tru_ngan_ha"]';
  state.storeState.save.franchises = '[{"id":"sg"},{"id":"hn"},{"id":"tokyo"}]';
  state.storeState.save.money = 350000000;
  q = getActiveStoryQuest();
  assert.strictEqual(q.chapter, 5);
  assert(q.title.includes('ĐẠI KẾT CỤC') || q.title.includes('VUA TRÀ SỮA THIÊN HÀ'));

  console.log('✓ 5. Main Story Quest Tracker dynamic objective states verified for all 5 chapters');

  // 5. Check index.html DOM structure
  const html = fs.readFileSync('public/index.html', 'utf8');
  const requiredDomIds = [
    'hud-story-quest-tracker',
    'hud-quest-tracker-click-area',
    'tracker-icon-badge',
    'tracker-chap-tag',
    'tracker-objective',
    'tracker-progress-tag',
    'tracker-bar-fill',
    'btn-collapse-tracker',
    'story-tab-album',
    'story-view-album',
    'story-album-list',
    'story-album-unlocked-count',
    'modal-staff-certificate',
    'cert-avatar',
    'cert-badge-tag',
    'cert-recipient-name',
    'cert-promoted-title',
    'cert-text-content',
    'cert-perks-list',
    'cert-quote-text',
    'cert-ref-no',
    'btn-close-certificate'
  ];

  for (const id of requiredDomIds) {
    assert(html.includes(`id="${id}"`), `DOM element id="${id}" missing from index.html!`);
  }
  console.log(`✓ 6. All ${requiredDomIds.length} required UI DOM elements verified in public/index.html`);

  // 6. Check style.css
  const css = fs.readFileSync('public/css/style.css', 'utf8');
  const requiredSelectors = [
    '.hud-story-tracker',
    '.hud-story-tracker.collapsed',
    '.tracker-inner',
    '.tracker-icon-badge',
    '.tracker-body',
    '.tracker-bar-wrap',
    '.tracker-bar-fill',
    '.staff-cert-modal-content',
    '.cert-outer-frame',
    '.cert-inner-border',
    '.cert-header',
    '.cert-profile-section',
    '.cert-avatar',
    '.cert-red-seal',
    '.btn-cert-accept'
  ];

  for (const sel of requiredSelectors) {
    assert(css.includes(sel), `CSS selector "${sel}" missing from style.css!`);
  }
  console.log(`✓ 7. All ${requiredSelectors.length} required CSS selectors verified in public/css/style.css`);

  // 7. Check compiled bundles
  const minJs = fs.readFileSync('public/dist/game.min.js', 'utf8');
  const minCss = fs.readFileSync('public/dist/game.min.css', 'utf8');

  assert(minJs.includes('c1_milestone_1_5m'), 'game.min.js missing milestone IDs');
  assert(minJs.includes('modal-staff-certificate'), 'game.min.js missing certificate logic');
  assert(minJs.includes('hud-story-quest-tracker'), 'game.min.js missing quest tracker logic');
  assert(minCss.includes('hud-story-tracker'), 'game.min.css missing hud tracker style');
  assert(minCss.includes('staff-cert-modal-content'), 'game.min.css missing certificate style');

  console.log('✓ 8. Compiled bundles in public/dist/ verified');

  console.log('\n=============================================================');
  console.log(' ALL DEEP QA VERIFICATIONS PASSED SUCCESSFULLY (8/8)! ');
  console.log('=============================================================\n');
}

testStoryAndGameplay().catch(err => {
  console.error('\n❌ QA Verification Failed:', err);
  process.exit(1);
});
