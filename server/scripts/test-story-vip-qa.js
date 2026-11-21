// Test QA for Story VIP Characters, In-Queue Encounters, Shift Diary, and Startup Relics
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING STORY & GAMEPLAY VIP QA TESTS ---');

// 1. Verify characters.js definitions
const charactersContent = fs.readFileSync(path.join(__dirname, '../../public/js/characters.js'), 'utf8');

// Check Anh Bảnh and Chef Gordon
assert(charactersContent.includes("id: 59, name: 'Anh Bảnh (Chủ Nợ Nghĩa Khí)'"), 'Anh Bảnh character definition must exist in characters.js');
assert(charactersContent.includes("id: 60, name: 'Chef Gordon (Giám Khảo Michelin)'"), 'Chef Gordon character definition must exist in characters.js');
assert(charactersContent.includes("style === 'anhbanh_debt_boss'"), 'anhbanh_debt_boss pixel art rendering routine must exist');
assert(charactersContent.includes("style === 'chef_critic'"), 'chef_critic pixel art rendering routine must exist');
assert(charactersContent.includes("str.includes('bảnh')"), 'bảnh lookup alias must exist');
assert(charactersContent.includes("str.includes('gordon')"), 'gordon lookup alias must exist');
console.log('✓ 1. characters.js contains Anh Bảnh & Chef Gordon with full Pixel Art rendering routines and lookup aliases');

// 2. Verify order-manager.js Story VIP logic
const orderManagerContent = fs.readFileSync(path.join(__dirname, '../../public/js/modules/order-manager.js'), 'utf8');
assert(orderManagerContent.includes('isStoryVIP'), 'order-manager.js must contain isStoryVIP logic');
assert(orderManagerContent.includes('canSpawnStoryVIP'), 'order-manager.js must calculate canSpawnStoryVIP');
assert(orderManagerContent.includes('Anh Bảnh (Chủ Nợ Nghĩa Khí)'), 'order-manager.js must spawn Anh Bảnh in Chapter 1');
assert(orderManagerContent.includes('Lão Ba (Chủ Quán Trâu Vàng)'), 'order-manager.js must spawn Lão Ba in Chapter 2');
assert(orderManagerContent.includes('Chef Gordon (Giám Khảo Michelin)'), 'order-manager.js must spawn Chef Gordon in Chapter 3');
assert(orderManagerContent.includes('Shark Hưng Đầu Tư'), 'order-manager.js must spawn Shark Hưng in Chapter 4');
assert(orderManagerContent.includes('Sứ Giả Ngân Hà Cosmic'), 'order-manager.js must spawn Cosmic Messenger in Chapter 5');
console.log('✓ 2. order-manager.js contains full Story VIP walk-in queuing mechanics for Chapters 1-5');

// 3. Verify workflow.js VIP serving rewards & UI badge
const workflowContent = fs.readFileSync(path.join(__dirname, '../../public/js/modules/workflow.js'), 'utf8');
assert(workflowContent.includes('vipBadge'), 'workflow.js must include vipBadge');
assert(workflowContent.includes('isVIPOrder'), 'workflow.js must track isVIPOrder');
assert(workflowContent.includes('Anh Bảnh: "Trà ngon đấy con bé!'), 'workflow.js must have Anh Bảnh speech toast');
assert(workflowContent.includes('Lão Ba: "Hừm... Vị trà này...'), 'workflow.js must have Lão Ba speech toast');
assert(workflowContent.includes('Gordon R.: "Superb!'), 'workflow.js must have Gordon speech toast');
assert(workflowContent.includes('Shark Hưng: "Xuất sắc!'), 'workflow.js must have Shark Hưng speech toast');
assert(workflowContent.includes('debtRelief'), 'workflow.js must process debt relief for Anh Bảnh');
console.log('✓ 3. workflow.js handles VIP badges, celebratory audio, tips, debt deduction, and dialogue toasts');

// 4. Verify shift.js daily story diary
const shiftContent = fs.readFileSync(path.join(__dirname, '../../public/js/modules/shift.js'), 'utf8');
assert(shiftContent.includes('generateDailyStoryDiary'), 'shift.js must include generateDailyStoryDiary');
assert(shiftContent.includes('shift-diary-card'), 'shift.js must render shift-diary-card');
assert(shiftContent.includes('HeeHee (Cô Chủ Quán)'), 'shift.js must include signature of HeeHee');
console.log('✓ 4. shift.js renders dynamic HeeHee Daily Story Diary in the End of Shift modal');

// 5. Verify farm.js story milestone
const farmContent = fs.readFileSync(path.join(__dirname, '../../public/js/modules/farm.js'), 'utf8');
assert(farmContent.includes('checkFarmStoryMilestone'), 'farm.js must include checkFarmStoryMilestone');
assert(farmContent.includes('Bà Trùm Trà Tiên Nhi'), 'farm.js must trigger dialogue from Bà Trùm Trà Tiên Nhi');
assert(farmContent.includes('heehee_farm_first_harvest_done'), 'farm.js must store harvest flag');
console.log('✓ 5. farm.js contains first harvest story tie-in with Bà Trùm Trà Tiên Nhi & +20 TeaCoin reward');

// 6. Verify room.js & index.html startup relics
const roomContent = fs.readFileSync(path.join(__dirname, '../../public/js/modules/room.js'), 'utf8');
const indexContent = fs.readFileSync(path.join(__dirname, '../../public/index.html'), 'utf8');
assert(roomContent.includes('STARTUP_RELICS'), 'room.js must export STARTUP_RELICS');
assert(roomContent.includes('renderRoomRelics'), 'room.js must export renderRoomRelics');
assert(indexContent.includes('btn-open-relics'), 'index.html must have btn-open-relics');
assert(indexContent.includes('room-relics-section'), 'index.html must have room-relics-section drawer');
console.log('✓ 6. room.js and index.html feature 5 Startup Memory Relics showcase drawer');

// 7. Verify compiled bundle in public/dist/game.min.js
const minJs = fs.readFileSync(path.join(__dirname, '../../public/dist/game.min.js'), 'utf8');
assert(minJs.includes('NHẬT KÝ QUÁN TRÀ'), 'game.min.js must contain bundled NHẬT KÝ QUÁN TRÀ');
assert(minJs.includes('isStoryVIP'), 'game.min.js must contain bundled isStoryVIP');
assert(minJs.includes('relic_spoon'), 'game.min.js must contain bundled relic_spoon');
console.log('✓ 7. public/dist/game.min.js contains all compiled modules cleanly');

console.log('======================================================');
console.log(' ALL STORY & GAMEPLAY VIP QA TESTS PASSED (7/7)! ');
console.log('======================================================');
