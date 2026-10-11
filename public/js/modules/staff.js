/**
 * HeeHee Milk Tea - NPC Staff Management & Offline Idle Revenue UI Module
 * Roadmap: NPC_STAFF_OFFLINE_ROADMAP.md (5 TeaCoin/giờ, Mở khóa khi hoàn thành Chương 2)
 */

import { showToast } from './toast.js';
import { updateMoneyDisplay, updateTeaCoinDisplay, updateUI } from './ui.js';
import { state, RECIPE_TEA_MAP, TEA_INV_MAP } from './state.js';
import { updateMixingButtonsState, updateWorkflowButtons } from './workflow.js';
import { scheduleNextOrder, startNextOrderInQueue } from './order-manager.js';
import { syncGamePauseState } from './modal-sync.js';

let staffState = null;
let selectedNpcId = 'be_bap';
let selectedHours = 3;
let staffTimer = null;
let autoBrewTimer = null;
let autoBrewEnabled = localStorage.getItem('heehee_npc_autobrew') !== 'off';
let lastAutoStepTime = 0;
let autoBrewBusy = false;

function showModalEl(el) {
  if (!el) return;
  el.classList.add('active');
  el.style.display = 'flex';
  syncGamePauseState();
}

function hideModalEl(el) {
  if (!el) return;
  el.classList.remove('active');
  el.style.display = 'none';
  syncGamePauseState();
}

export function initStaffModule() {
  const btnStaffHeader = document.getElementById('btn-staff-header');
  const btnStaffMenu = document.getElementById('menu-btn-staff');
  const btnStaffFromUpgrades = document.getElementById('btn-open-staff-from-upgrades');
  const modalStaff = document.getElementById('modal-staff');
  const closeStaff = document.getElementById('close-staff');
  const modalOffline = document.getElementById('modal-staff-offline-summary');
  const closeOffline = document.getElementById('close-staff-offline-summary');
  const buffStaff = document.getElementById('buff-active-staff');

  if (btnStaffHeader) {
    btnStaffHeader.addEventListener('click', () => openStaffModal());
  }

  if (btnStaffMenu) {
    btnStaffMenu.addEventListener('click', () => {
      const menuModal = document.getElementById('modal-game-menu');
      hideModalEl(menuModal);
      openStaffModal();
    });
  }

  if (btnStaffFromUpgrades) {
    btnStaffFromUpgrades.addEventListener('click', () => {
      const modalUpgrades = document.getElementById('modal-upgrades');
      hideModalEl(modalUpgrades);
      openStaffModal();
    });
  }

  if (buffStaff) {
    buffStaff.addEventListener('click', () => openStaffModal());
  }

  if (closeStaff && modalStaff) {
    closeStaff.addEventListener('click', () => hideModalEl(modalStaff));
    modalStaff.addEventListener('click', (e) => {
      if (e.target === modalStaff) hideModalEl(modalStaff);
    });
  }

  if (closeOffline && modalOffline) {
    closeOffline.addEventListener('click', () => hideModalEl(modalOffline));
    modalOffline.addEventListener('click', (e) => {
      if (e.target === modalOffline) hideModalEl(modalOffline);
    });
  }

  window.checkStaffOnLoad = checkStaffOnLoad;
  window.openStaffModal = openStaffModal;

  // Khởi động đồng bộ trạng thái nhân viên lần đầu & kiểm tra offline claim
  checkStaffOnLoad();

  // Bắt đầu nhịp tim đếm ngược mỗi 10 giây
  if (staffTimer) clearInterval(staffTimer);
  staffTimer = setInterval(() => {
    refreshStaffHUDCountdown();
  }, 10000);

  // Khởi động Engine Pha Chế Tự Động Thời Gian Thực (Online Auto-Brew)
  if (autoBrewTimer) clearInterval(autoBrewTimer);
  autoBrewTimer = setInterval(() => {
    runOnlineAutoBrewTick();
  }, 550);
}

/**
 * Kiểm tra trạng thái nhân viên khi vừa tải trang hoặc đăng nhập
 */
export async function checkStaffOnLoad() {
  try {
    if (!window.API || !window.API.token || typeof window.API.getStaffStatus !== 'function') return;
    const res = await window.API.getStaffStatus();
    if (!res || res.error) return;
    staffState = res;
    window.staffState = res;

    // Cập nhật huy hiệu trên canvas & HUD
    syncStaffToStateAndCanvas(res.activeStaff);
    updateStaffHUD(res);

    // Nếu có tiền tích lũy từ ca làm offline: Tự động mở Modal Báo Cáo Kết Ca Offline!
    if (res.activeStaff && res.activeStaff.accumulatedMoney > 0) {
      setTimeout(() => {
        openOfflineSummaryModal(res.activeStaff);
      }, 900);
    }
  } catch (err) {
    // Không làm gián đoạn trò chơi nếu chưa đăng nhập
  }
}

/**
 * Đồng bộ dữ liệu nhân viên vào state và canvas để vẽ sprite trên đường phố & quầy pha chế
 */
function syncStaffToStateAndCanvas(activeStaff) {
  const currentChapter = Number(state.storeState?.save?.chapter || staffState?.currentChapter || 1);
  state.activeStaff = (currentChapter >= 3 && activeStaff && !activeStaff.expired) ? {
    ...activeStaff,
    autoBrewEnabled
  } : null;

  if (state.canvas) {
    state.canvas.activeStaff = state.activeStaff;
  }
  if (state.workstation) {
    state.workstation.activeStaff = state.activeStaff;
  }
}

/**
 * Tự động mua bổ sung nguyên liệu nếu kho hết khi NPC đang pha chế trực tuyến
 */
async function ensureIngredientsForAutoBrew(teaKey, toppings) {
  if (!state.storeState || !state.storeState.save || !window.API?.buyIngredients) return true;
  let inv = {};
  try {
    const raw = state.storeState.save.inventory;
    inv = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
  } catch (e) {
    inv = {};
  }

  const neededKeys = [];
  const teaInvKey = TEA_INV_MAP[teaKey] || 'tra_den';
  if ((inv[teaInvKey] !== undefined ? inv[teaInvKey] : 0) <= 0) {
    neededKeys.push(teaInvKey);
  }
  if ((inv['ly_nap'] !== undefined ? inv['ly_nap'] : 0) <= 0) {
    neededKeys.push('ly_nap');
  }
  for (const t of toppings) {
    if ((inv[t] !== undefined ? inv[t] : 0) <= 0) {
      neededKeys.push(t);
    }
  }

  if (neededKeys.length > 0) {
    try {
      const itemsToBuy = neededKeys.map(id => ({ id, quantity: 10 }));
      const res = await window.API.buyIngredients(itemsToBuy);
      if (res && res.success) {
        state.storeState.save.money = res.newMoney;
        state.storeState.save.inventory = res.inventory;
        updateUI();
      }
    } catch (e) {}
  }
  return true;
}

/**
 * Engine Pha Chế Tự Động Thời Gian Thực Khi Online (Roadmap I.2.1)
 * NPC tự động chọn cốt trà, đường, đá, topping -> Lắc bình -> Rót cốc -> Dập nắp -> Giao ly
 */
async function runOnlineAutoBrewTick() {
  if (autoBrewBusy) return;
  if (!autoBrewEnabled) return;
  if (Number(state.storeState?.save?.chapter || 1) < 3) return;
  if (!state.activeStaff || state.activeStaff.expired) return;
  if (state.isGamePaused) return;

  // Kiểm tra hết hạn ca trực theo thời gian thực
  const now = Date.now();
  if (state.activeStaff.expiresAt && now >= state.activeStaff.expiresAt) {
    checkStaffOnLoad();
    return;
  }

  // Nếu chưa có khách hiện tại ở quầy, tự động gọi khách tiếp theo trong hàng đợi hoặc tạo đợt khách mới
  if (!state.currentOrder) {
    if (state.orderQueue && state.orderQueue.length > 0) {
      startNextOrderInQueue();
    } else if (!state.nextOrderTimeout) {
      scheduleNextOrder(900);
    }
    return;
  }

  // Khoảng nghỉ giữa các thao tác của NPC (nhanh hơn nếu là Bot P-800 hoặc Anh Lâm)
  const npcId = state.activeStaff.npcId;
  const stepDelay = npcId === 'bot_p800' ? 400 : (npcId === 'anh_lam' ? 480 : 580);
  if (now - lastAutoStepTime < stepDelay) return;

  const order = state.currentOrder;
  const expectedTea = RECIPE_TEA_MAP[order.recipeId]?.teaId || order.tea || 'den';
  const expectedSugar = order.sugar || '50%';
  const expectedIce = order.ice || 'Vừa đá';
  const expectedToppings = Array.isArray(order.toppings) ? [...order.toppings] : [];

  const normExpectedTop = [...expectedToppings].sort().join(',');
  const normSelectedTop = [...(state.selectedToppings || [])].sort().join(',');

  autoBrewBusy = true;
  try {
    // Bước 0: Tự động chuẩn bị đúng Cốt Trà + Đường + Đá + Topping theo phiếu order
    if (
      state.selectedTea !== expectedTea ||
      state.selectedSugar !== expectedSugar ||
      state.selectedIce !== expectedIce ||
      normSelectedTop !== normExpectedTop
    ) {
      await ensureIngredientsForAutoBrew(expectedTea, expectedToppings);
      state.selectedTea = expectedTea;
      state.selectedSugar = expectedSugar;
      state.selectedIce = expectedIce;
      state.selectedToppings = [...expectedToppings];

      if (state.workstation) {
        state.workstation.setState(expectedTea, expectedSugar, expectedIce, expectedToppings, state.isShaken);
        state.workstation.triggerHandAction('pour_tea', expectedTea);
      }
      if (state.canvas) {
        state.canvas.setDrinkPreview({ tea: state.selectedTea, toppings: state.selectedToppings });
        state.canvas.staffActionText = '🍵 Đang phối trà...';
      }
      updateMixingButtonsState();
      updateWorkflowButtons();
      lastAutoStepTime = Date.now();
      return;
    }

    // Bước 1: Bấm [1. Lắc Bình]
    if (!state.isShaken) {
      updateWorkflowButtons();
      const btnShaker = document.getElementById('btn-shaker');
      if (btnShaker && !btnShaker.disabled) {
        if (state.canvas) state.canvas.staffActionText = '🍸 Đang lắc bình...';
        btnShaker.click();
        lastAutoStepTime = Date.now() + 600;
      }
      return;
    }

    // Bước 2: Bấm [2. Rót Cốc]
    if (state.isShaken && !state.isPoured) {
      const btnPour = document.getElementById('btn-pour-cup');
      if (btnPour && !btnPour.disabled) {
        if (state.canvas) state.canvas.staffActionText = '🧋 Đang rót cốc...';
        btnPour.click();
        lastAutoStepTime = Date.now() + 650;
      }
      return;
    }

    // Bước 3: Bấm [3. Dập Nắp]
    if (state.isPoured && !state.isSealed) {
      const btnSeal = document.getElementById('btn-seal-cup');
      if (btnSeal && !btnSeal.disabled) {
        if (state.canvas) state.canvas.staffActionText = '🖲️ Đang dập nắp...';
        btnSeal.click();
        lastAutoStepTime = Date.now() + 600;
      }
      return;
    }

    // Bước 4: Bấm [4. Giao Ly] (Đảm bảo thời gian pha >= 1000ms cho Anti-Cheat)
    if (state.isSealed) {
      const elapsed = Date.now() - (state.orderStartTime || 0);
      if (elapsed < 1000) return;
      const btnServe = document.getElementById('btn-serve');
      if (btnServe && !btnServe.disabled) {
        await ensureIngredientsForAutoBrew(expectedTea, expectedToppings);
        if (state.canvas) state.canvas.staffActionText = '✨ Giao ly!';
        btnServe.click();
        lastAutoStepTime = Date.now() + 450;
        setTimeout(() => {
          if (state.canvas) state.canvas.staffActionText = null;
        }, 1200);
      }
    }
  } finally {
    autoBrewBusy = false;
  }
}

/**
 * Cập nhật nút bấm HUD & Thanh trạng thái
 */
export function updateStaffHUD(data) {
  const btnStaffHeader = document.getElementById('btn-staff-header');
  const btnStaffIcon = document.getElementById('btn-staff-icon');
  const btnStaffLabel = document.getElementById('btn-staff-label');
  const hudBadge = document.getElementById('hud-staff-badge');
  const buffActiveStaff = document.getElementById('buff-active-staff');
  const buffStaffName = document.getElementById('buff-staff-name');
  const buffStaffTime = document.getElementById('buff-staff-time');
  const buffStaffMoney = document.getElementById('buff-staff-money');

  const menuBtnStaff = document.getElementById('menu-btn-staff');
  const sectionStaffDelegation = document.getElementById('section-staff-delegation');
  const menuTitle = document.getElementById('menu-staff-title');
  const menuDesc = document.getElementById('menu-staff-desc');

  if (!data) return;

  // 1. Kiểm tra trạng thái khóa (Chương 1 & 2): Ẩn hoàn toàn nút thuê NPC cho đến khi tới Chương 3
  if (!data.isUnlocked) {
    if (btnStaffHeader) btnStaffHeader.style.display = 'none';
    if (menuBtnStaff) menuBtnStaff.style.display = 'none';
    if (sectionStaffDelegation) sectionStaffDelegation.style.display = 'none';
    if (buffActiveStaff) buffActiveStaff.style.display = 'none';
    if (hudBadge) hudBadge.style.display = 'none';
    return;
  }

  // 2. Trạng thái đã mở khóa (Chương 3+)
  const hourlyRate = Number(data.hourlyRate || 10);
  if (btnStaffHeader) {
    btnStaffHeader.style.display = 'flex';
    btnStaffHeader.style.opacity = '1';
    btnStaffHeader.title = `Thuê Nhân Viên Trực Quầy & Doanh Thu Offline (${hourlyRate} TC/h)`;
  }
  if (menuBtnStaff) menuBtnStaff.style.display = 'flex';
  if (sectionStaffDelegation) sectionStaffDelegation.style.display = 'block';
  if (btnStaffIcon) btnStaffIcon.innerText = '🧑‍🍳';
  if (btnStaffLabel) btnStaffLabel.innerText = 'Nhân Viên';
  if (menuTitle) menuTitle.innerText = '🧑‍🍳 Thuê Nhân Viên Trực Quầy';
  if (menuDesc) menuDesc.innerText = `Pha chế tự động & Doanh thu offline (${hourlyRate} TC/h)`;

  // 3. Hiển thị ca đang trực hoặc tiền chờ nhận
  if (data.activeStaff) {
    const s = data.activeStaff;
    if (hudBadge) {
      hudBadge.style.display = 'block';
      hudBadge.innerText = s.accumulatedMoney > 0 ? '💰' : '✓';
    }
    if (buffActiveStaff) {
      buffActiveStaff.style.display = 'inline-flex';
      if (buffStaffName) buffStaffName.innerText = s.name;
      if (buffStaffTime) buffStaffTime.innerText = s.expired ? 'Hết ca' : s.remainingTimeFormatted;
      if (buffStaffMoney) buffStaffMoney.innerText = `+${(s.accumulatedMoney || 0).toLocaleString('vi-VN')}đ`;
    }
  } else {
    if (hudBadge) hudBadge.style.display = 'none';
    if (buffActiveStaff) buffActiveStaff.style.display = 'none';
  }
}

/**
 * Cập nhật đếm ngược thời gian ca làm việc
 */
function refreshStaffHUDCountdown() {
  if (!staffState || !staffState.activeStaff) return;
  const s = staffState.activeStaff;
  const now = Date.now();
  if (s.expiresAt && s.expiresAt > now) {
    const diff = s.expiresAt - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    s.remainingTimeFormatted = `${h}h ${m}m`;
    const buffStaffTime = document.getElementById('buff-staff-time');
    if (buffStaffTime) buffStaffTime.innerText = s.remainingTimeFormatted;
  }
}

/**
 * Mở Modal Quản Lý Nhân Viên
 */
export async function openStaffModal() {
  const modalStaff = document.getElementById('modal-staff');
  if (!modalStaff) return;

  try {
    const res = await window.API.getStaffStatus();
    if (!res || res.error) {
      throw new Error(res?.error || 'Không thể tải trạng thái nhân viên');
    }
    staffState = res;
    window.staffState = res;
    updateStaffHUD(res);
    syncStaffToStateAndCanvas(res.activeStaff);
    if (!res.isUnlocked) {
      showToast('🔒 Tính năng thuê NPC chỉ mở khi bạn đạt Chương 3!', 3200);
      return;
    }
    renderStaffModalContent(res);
    showModalEl(modalStaff);
  } catch (err) {
    showToast('❌ Không thể tải thông tin nhân viên: ' + err.message, 3500);
  }
}

/**
 * Render nội dung Modal Quản Lý Nhân Viên
 */
function renderStaffModalContent(data) {
  const container = document.getElementById('staff-modal-body');
  if (!container) return;

  const hourlyRate = Number(data.hourlyRate || 10);

  // TRƯỜNG HỢP 1: BỊ KHÓA TIẾN TRÌNH (CHƯƠNG 1 & 2)
  if (!data.isUnlocked) {
    const curMoney = data.currentMoney || 0;
    const goalMoney = data.chapterGoalMoney || 50000000;
    const pct = Math.min(100, Math.round((curMoney / goalMoney) * 100));

    container.innerHTML = `
      <div class="staff-locked-container">
        <div class="staff-locked-badge">🔒 MỞ KHÓA Ở CHƯƠNG 3</div>
        <div class="staff-locked-title">Yêu Cầu Mở Khóa Chương 3</div>
        <div class="staff-locked-desc">
          Người chơi cần mở khóa <b>Chương 3 (Cửa Hàng Flagship Phố Đi Bộ)</b> mới có thể thuê NPC làm việc và trực quầy tự động!
        </div>
        <div class="staff-progress-box">
          <div class="staff-progress-label">
            <span>Tiến độ tích lũy mở Chương 3:</span>
            <span>${curMoney.toLocaleString('vi-VN')}đ / ${goalMoney.toLocaleString('vi-VN')}đ (${pct}%)</span>
          </div>
          <div class="staff-progress-bar-bg">
            <div class="staff-progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      </div>

      <div style="font-weight: bold; color: #b2bec3; margin: 14px 0 8px 0;">Ứng Viên Tiềm Năng (Khóa Xem Trước):</div>
      <div class="staff-candidates-grid">
        ${data.candidates.map(c => `
          <div class="candidate-card is-locked">
            <div class="candidate-header">
              <div class="staff-avatar-circle">${c.avatar}</div>
              <div class="candidate-name-box">
                <h4>${c.name}</h4>
                <span>${c.role}</span>
              </div>
            </div>
            <div class="candidate-trait">✨ <b>${c.trait}:</b> ${c.desc}</div>
            <div class="candidate-quote">"${c.quote}"</div>
            <div class="candidate-footer">
              <span class="candidate-rate">🔒 ${hourlyRate} TeaCoin/giờ</span>
              <button class="btn-hire-select" disabled>Chưa Mở</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    return;
  }

  // TRƯỜNG HỢP 2: ĐÃ MỞ KHÓA
  let activeShiftHtml = '';
  if (data.activeStaff) {
    const s = data.activeStaff;
    activeShiftHtml = `
      <div class="staff-active-shift-card">
        <div class="staff-active-top">
          <div class="staff-active-identity">
            <div class="staff-avatar-circle">${s.avatar}</div>
            <div class="staff-active-meta">
              <h4>${s.name} <span style="font-size: 0.75rem; background: #2ecc71; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold;">ĐANG TRỰC QUẦY</span></h4>
              <span>${s.role} • ${hourlyRate} TeaCoin/giờ</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: #b2bec3;">Thời gian còn lại:</div>
            <b style="color: #ffeaa7; font-size: 1.1rem;" id="modal-staff-countdown">${s.expired ? 'Đã hết ca' : s.remainingTimeFormatted}</b>
          </div>
        </div>

        <div class="staff-live-stats">
          <div class="staff-stat-unit">
            <span class="label">🍵 Ly offline chờ nhận:</span>
            <span class="val">${(s.accumulatedCups || 0)} ly</span>
          </div>
          <div class="staff-stat-unit">
            <span class="label">💰 Doanh thu offline:</span>
            <span class="val" style="color: #55efc4;">+${(s.accumulatedMoney || 0).toLocaleString('vi-VN')}đ</span>
          </div>
          <div class="staff-stat-unit">
            <span class="label">🤖 Tự động pha (Online):</span>
            <span class="val" style="color: ${autoBrewEnabled ? '#50fa7b' : '#ff7675'};">${autoBrewEnabled ? 'ĐANG BẬT ⚡' : 'ĐANG TẮT'}</span>
          </div>
          <div class="staff-stat-unit">
            <span class="label">🔄 Tự động gia hạn:</span>
            <span class="val" style="color: ${s.autoRenew ? '#50fa7b' : '#ff7675'};">${s.autoRenew ? 'BẬT' : 'TẮT'}</span>
          </div>
        </div>

        <div class="staff-active-actions" style="flex-wrap: wrap;">
          ${s.accumulatedMoney > 0 ? `
            <button class="btn-action-wide" id="btn-modal-claim-staff" style="flex: 2; min-width: 180px; background: linear-gradient(135deg, #00b894, #00cec9); color: #000; font-weight: bold;">
              💚 Nhận Doanh Thu (+${(s.accumulatedMoney || 0).toLocaleString('vi-VN')}đ)
            </button>
          ` : ''}
          <button class="btn-action-wide" id="btn-modal-toggle-autobrew" style="flex: 1; min-width: 150px; background: ${autoBrewEnabled ? '#0984e3' : '#636e72'};">
            🤖 Tự Động Pha: ${autoBrewEnabled ? 'BẬT' : 'TẮT'}
          </button>
          <button class="btn-action-wide" id="btn-modal-extend-staff" style="flex: 1; background: #6c5ce7;">
            🔄 Gia Hạn (+1h)
          </button>
          <button class="btn-action-wide" id="btn-modal-terminate-staff" style="flex: 1; background: #d63031;">
            ⏹️ Nghỉ Ca Sớm
          </button>
        </div>
      </div>
    `;
  }

  const currentTeaCoin = Number(data.teacoin ?? state.storeState?.save?.teacoin ?? 0);

  container.innerHTML = `
    ${activeShiftHtml}

    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 8px;">
      <h3 style="margin: 0; color: #ffeaa7;">🧑‍🍳 Danh Sách Ứng Viên Barista (${hourlyRate} TeaCoin/giờ)</h3>
      <div style="font-weight: bold; color: #00cec9;">Số dư: 🍵 <span id="staff-modal-teacoin">${currentTeaCoin}</span> TeaCoin</div>
    </div>

    <!-- Duration Selector -->
    <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
      <div style="font-size: 0.82rem; color: #dfe6e9; margin-bottom: 6px;">Chọn thời lượng ca làm việc:</div>
      <div class="duration-selector-row">
        <div class="duration-pill ${selectedHours === 1 ? 'active' : ''}" data-hours="1">1 Giờ (${1 * hourlyRate} TC)</div>
        <div class="duration-pill ${selectedHours === 3 ? 'active' : ''}" data-hours="3">3 Giờ (${3 * hourlyRate} TC)</div>
        <div class="duration-pill ${selectedHours === 8 ? 'active' : ''}" data-hours="8">8 Giờ (${8 * hourlyRate} TC)</div>
        <div class="duration-pill ${selectedHours === 24 ? 'active' : ''}" data-hours="24">24 Giờ (${24 * hourlyRate} TC)</div>
      </div>
      <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #dfe6e9; cursor: pointer; margin-top: 6px;">
        <input type="checkbox" id="chk-auto-renew" style="accent-color: #6c5ce7; width: 16px; height: 16px;">
        <span>Tự động gia hạn ca làm khi hết giờ (nếu tài khoản còn đủ TeaCoin)</span>
      </label>
    </div>

    <div class="staff-candidates-grid">
      ${data.candidates.map(c => `
        <div class="candidate-card ${selectedNpcId === c.id ? 'selected' : ''}" data-card-npc="${c.id}" style="${selectedNpcId === c.id ? 'border-color: #00cec9; box-shadow: 0 0 10px rgba(0,206,201,0.3);' : ''}">
          <div class="candidate-header">
            <div class="staff-avatar-circle">${c.avatar}</div>
            <div class="candidate-name-box">
              <h4>${c.name}</h4>
              <span>${c.role}</span>
            </div>
          </div>
          <div class="candidate-trait">✨ <b>${c.trait}:</b> ${c.desc}</div>
          <div class="candidate-quote">"${c.quote}"</div>
          <div class="candidate-footer">
            <span class="candidate-rate">⚡ ${c.baseRate} ly/h • <span class="hire-cost-label">${selectedHours * hourlyRate} TC (${selectedHours}h)</span></span>
            <button class="btn-hire-select btn-hire-action" data-npc="${c.id}">
              ${data.activeStaff?.npcId === c.id && !data.activeStaff?.expired ? `Đang Trực (Thuê +${selectedHours}h)` : `Thuê (${selectedHours * hourlyRate} TC)`}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Gắn sự kiện cho các nút trong modal
  setupStaffModalEvents(data);
}

/**
 * Gắn listeners cho tương tác trong Staff Modal
 */
function setupStaffModalEvents(data) {
  const hourlyRate = Number(data.hourlyRate || 10);

  // Chọn số giờ -> cập nhật luôn số TeaCoin hiển thị trên các nút Thuê
  document.querySelectorAll('.duration-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.duration-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedHours = parseInt(pill.getAttribute('data-hours'), 10) || 1;
      const cost = selectedHours * hourlyRate;
      document.querySelectorAll('.hire-cost-label').forEach(el => {
        el.innerText = `${cost} TC (${selectedHours}h)`;
      });
      document.querySelectorAll('.btn-hire-action').forEach(btn => {
        const npcId = btn.getAttribute('data-npc');
        const isCurrent = data.activeStaff?.npcId === npcId && !data.activeStaff?.expired;
        btn.innerText = isCurrent ? `Đang Trực (Thuê +${selectedHours}h)` : `Thuê (${cost} TC)`;
      });
    });
  });

  // Chọn thẻ ứng viên
  document.querySelectorAll('.candidate-card[data-card-npc]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-hire-action')) return;
      selectedNpcId = card.getAttribute('data-card-npc') || 'be_bap';
      document.querySelectorAll('.candidate-card[data-card-npc]').forEach(c => {
        const isSel = c.getAttribute('data-card-npc') === selectedNpcId;
        c.classList.toggle('selected', isSel);
        c.style.borderColor = isSel ? '#00cec9' : '';
        c.style.boxShadow = isSel ? '0 0 10px rgba(0,206,201,0.3)' : '';
      });
    });
  });

  // Bật / Tắt tự động pha chế Online
  const btnToggleAuto = document.getElementById('btn-modal-toggle-autobrew');
  if (btnToggleAuto) {
    btnToggleAuto.addEventListener('click', () => {
      autoBrewEnabled = !autoBrewEnabled;
      localStorage.setItem('heehee_npc_autobrew', autoBrewEnabled ? 'on' : 'off');
      if (state.activeStaff) state.activeStaff.autoBrewEnabled = autoBrewEnabled;
      showToast(autoBrewEnabled
        ? '🤖 Đã BẬT chế độ NPC tự động pha chế & giao ly trực tiếp tại quầy!'
        : '✋ Đã TẮT tự động pha chế. Bạn có thể tự tay pha chế cùng nhân viên!', 3200);
      renderStaffModalContent(staffState || data);
    });
  }

  // Thuê nhân viên bằng TeaCoin
  document.querySelectorAll('.btn-hire-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const npcId = btn.getAttribute('data-npc');
      selectedNpcId = npcId;
      const autoRenew = !!document.getElementById('chk-auto-renew')?.checked;
      const totalCost = selectedHours * hourlyRate;
      const currentTeaCoin = Number(data.teacoin ?? state.storeState?.save?.teacoin ?? 0);

      if (currentTeaCoin < totalCost) {
        if (window.sound && typeof window.sound.fail === 'function') window.sound.fail();
        showToast(`⚠️ Bạn cần ${totalCost} TeaCoin để thuê ${selectedHours} giờ (Hiện có: ${currentTeaCoin} TeaCoin)!`, 3500);
        return;
      }

      btn.disabled = true;
      btn.innerText = 'Đang ký...';

      try {
        const res = await window.API.hireStaff(npcId, selectedHours, autoRenew);
        if (!res || res.error || !res.success) {
          throw new Error(res?.error || res?.message || 'Không thể ký hợp đồng thuê nhân viên');
        }

        // Bật ngay chế độ tự động làm việc khi vừa thuê NPC
        autoBrewEnabled = true;
        localStorage.setItem('heehee_npc_autobrew', 'on');

        if (window.sound && typeof window.sound.coin === 'function') window.sound.coin();
        showToast(res.message, 4000);

        // Khấu trừ & đồng bộ TeaCoin ngay lập tức trên HUD và state
        if (res.teacoin !== undefined) {
          data.teacoin = res.teacoin;
          if (state.storeState && state.storeState.save) {
            state.storeState.save.teacoin = res.teacoin;
          }
          updateTeaCoinDisplay(res.teacoin);
        }
        if (state.storeState && state.storeState.save && res.newMoney !== undefined) {
          state.storeState.save.money = res.newMoney;
          updateMoneyDisplay(res.newMoney);
        }

        // Đồng bộ ngay NPC vào quầy hàng trên Street Canvas & Workstation Canvas
        const hiredStaff = res.activeStaff || res.contract;
        if (hiredStaff) {
          syncStaffToStateAndCanvas(hiredStaff);
        }
        await checkStaffOnLoad();
        updateUI();

        // Đóng modal để người chơi thấy ngay NPC đứng trực tiếp tại quầy hàng & tự động làm việc
        const modalStaff = document.getElementById('modal-staff');
        hideModalEl(modalStaff);

        const hiredName = hiredStaff?.name || res.npc?.name || 'Nhân viên';
        if (state.canvas && Array.isArray(state.canvas.floatingTexts)) {
          state.canvas.floatingTexts.push({
            text: `🧑‍🍳 ${hiredName} đã vào quầy trực (-${totalCost} TeaCoin)! ✨`,
            x: 92,
            y: 58,
            alpha: 1.0,
            color: '#55efc4'
          });
        }
        if (state.workstation && typeof state.workstation.addFloatingText === 'function') {
          state.workstation.addFloatingText(`🧑‍🍳 ${hiredName}: Bắt đầu ca trực tự động!`, '#55efc4');
        }

        // Kích hoạt ngay khách hàng tiếp theo nếu quầy đang trống để NPC bắt tay vào làm việc luôn
        if (!state.currentOrder) {
          if (state.orderQueue && state.orderQueue.length > 0) {
            startNextOrderInQueue();
          } else {
            scheduleNextOrder(500);
          }
        }
      } catch (err) {
        if (window.sound && typeof window.sound.fail === 'function') window.sound.fail();
        showToast('❌ Thuê thất bại: ' + err.message, 4000);
        btn.disabled = false;
        btn.innerText = `Thuê (${selectedHours * hourlyRate} TC)`;
      }
    });
  });

  // Nhận tiền tích lũy
  const btnClaim = document.getElementById('btn-modal-claim-staff');
  if (btnClaim) {
    btnClaim.addEventListener('click', async () => {
      btnClaim.disabled = true;
      btnClaim.innerText = 'Đang nhận...';
      try {
        const res = await window.API.claimOfflineStaff();
        if (!res || res.error || !res.success) {
          throw new Error(res?.error || res?.message || 'Chưa có doanh thu để nhận');
        }
        if (window.sound && typeof window.sound.bell === 'function') window.sound.bell();
        showToast(res.message, 4500);
        if (state.storeState && state.storeState.save) {
          if (res.newMoney !== undefined) state.storeState.save.money = res.newMoney;
          if (res.newReputation !== undefined) state.storeState.save.reputation = res.newReputation;
          updateUI();
        } else {
          updateMoneyDisplay(res.newMoney);
        }
        await openStaffModal();
      } catch (err) {
        showToast('❌ Nhận thất bại: ' + err.message, 3500);
        btnClaim.disabled = false;
      }
    });
  }

  // Gia hạn thêm 1 giờ
  const btnExtend = document.getElementById('btn-modal-extend-staff');
  if (btnExtend) {
    btnExtend.addEventListener('click', async () => {
      const currentTeaCoin = Number(data.teacoin ?? state.storeState?.save?.teacoin ?? 0);
      if (currentTeaCoin < hourlyRate) {
        showToast(`⚠️ Cần ${hourlyRate} TeaCoin để gia hạn 1 giờ!`, 3000);
        return;
      }
      btnExtend.disabled = true;
      try {
        const res = await window.API.extendStaff(1);
        if (!res || res.error || !res.success) {
          throw new Error(res?.error || res?.message || 'Gia hạn thất bại');
        }
        if (window.sound && typeof window.sound.coin === 'function') window.sound.coin();
        showToast(res.message, 3500);
        if (res.teacoin !== undefined) {
          if (state.storeState && state.storeState.save) {
            state.storeState.save.teacoin = res.teacoin;
          }
          updateTeaCoinDisplay(res.teacoin);
        }
        if (res.activeStaff) {
          syncStaffToStateAndCanvas(res.activeStaff);
        }
        await openStaffModal();
      } catch (err) {
        showToast('❌ Gia hạn thất bại: ' + err.message, 3500);
        btnExtend.disabled = false;
      }
    });
  }

  // Nghỉ ca sớm
  const btnTerminate = document.getElementById('btn-modal-terminate-staff');
  if (btnTerminate) {
    btnTerminate.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc chắn muốn cho nhân viên nghỉ ca sớm? Các giờ trọn vẹn chưa dùng sẽ được hoàn trả TeaCoin.')) return;
      btnTerminate.disabled = true;
      try {
        const res = await window.API.terminateStaff();
        if (!res || res.error || !res.success) {
          throw new Error(res?.error || res?.message || 'Không thể kết thúc ca');
        }
        showToast(res.message, 4000);
        if (res.teacoin !== undefined) {
          if (state.storeState && state.storeState.save) {
            state.storeState.save.teacoin = res.teacoin;
          }
          updateTeaCoinDisplay(res.teacoin);
        }
        if (state.storeState && state.storeState.save && res.newMoney !== undefined) {
          state.storeState.save.money = res.newMoney;
          updateMoneyDisplay(res.newMoney);
        }
        syncStaffToStateAndCanvas(null);
        await openStaffModal();
      } catch (err) {
        showToast('❌ Lỗi: ' + err.message, 3500);
        btnTerminate.disabled = false;
      }
    });
  }
}

/**
 * Mở Modal Báo Cáo Doanh Thu Offline Tích Lũy Khi Đăng Nhập Lại (Roadmap V.2)
 */
export function openOfflineSummaryModal(activeStaff) {
  const modalOffline = document.getElementById('modal-staff-offline-summary');
  if (!modalOffline || !activeStaff || !activeStaff.accumulatedMoney) return;

  const avatar = activeStaff.avatar || '🧑‍🍳';
  const name = activeStaff.name || 'Bé Bắp';
  const cups = activeStaff.accumulatedCups || 0;
  const money = (activeStaff.accumulatedMoney || 0).toLocaleString('vi-VN');
  const workedTime = activeStaff.workedTimeFormatted || `${activeStaff.hoursHired || 1} giờ 00 phút`;
  const teacoinSpent = activeStaff.teacoinSpent || ((activeStaff.hoursHired || 1) * 10);
  const repGain = (activeStaff.reputationGain || (activeStaff.npcId === 'co_mai' ? 0.2 : 0.1)).toFixed(1);

  const container = document.getElementById('staff-offline-summary-body');
  if (container) {
    container.innerHTML = `
      <div class="offline-hero-avatar">${avatar}</div>
      <h2 style="color: #55efc4; margin: 4px 0;">🎉 BÁO CÁO KẾT CA TRỰC QUẦY!</h2>
      <p style="color: #dfe6e9; font-size: 0.92rem; margin: 0 0 12px 0;">
        Trong lúc bạn vắng mặt, <b>${name} (${activeStaff.role || 'Barista'})</b> đã chăm chỉ trực quầy và pha chế phục vụ khách hàng!
      </p>

      <div class="offline-summary-stats">
        <div class="offline-stat-row">
          <span>⏱️ Thời gian trực quầy:</span>
          <b>${workedTime}</b>
        </div>
        <div class="offline-stat-row">
          <span>🍵 Tổng số ly trà đã pha:</span>
          <b>${cups} ly ${cups >= 25 ? '🔥 (Kỷ lục ca!)' : ''}</b>
        </div>
        <div class="offline-stat-row">
          <span>🪙 Chi phí thuê tiêu hao:</span>
          <b style="color: #00cec9;">${teacoinSpent} TeaCoin (Đã thanh toán)</b>
        </div>
        <div class="offline-stat-row">
          <span>⭐ Điểm danh tiếng tích lũy:</span>
          <b style="color: #ffeaa7;">+${repGain} ⭐</b>
        </div>
        <div class="offline-stat-row total-money">
          <span>💰 Tổng doanh thu kiếm được:</span>
          <b>+${money} VNĐ</b>
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
        <button id="btn-offline-claim-now" class="btn-action-wide" style="flex: 2; min-width: 210px; background: linear-gradient(135deg, #00b894, #55efc4); color: #000; font-weight: bold; font-size: 0.98rem;">
          💚 NHẬN DOANH THU & TIẾP TỤC CA MỚI
        </button>
        <button id="btn-offline-extend-now" class="btn-action-wide" style="flex: 1; min-width: 130px; background: #6c5ce7; font-size: 0.9rem;">
          🔄 GIA HẠN THÊM GIỜ
        </button>
      </div>
    `;

    const btnClaim = document.getElementById('btn-offline-claim-now');
    if (btnClaim) {
      btnClaim.addEventListener('click', async () => {
        btnClaim.disabled = true;
        btnClaim.innerText = 'Đang nhận...';
        try {
          const res = await window.API.claimOfflineStaff();
          if (!res || res.error || !res.success) {
            throw new Error(res?.error || res?.message || 'Chưa có doanh thu để nhận');
          }
          if (window.sound && typeof window.sound.bell === 'function') window.sound.bell();
          showToast(res.message, 4500);
          if (state.storeState && state.storeState.save) {
            if (res.newMoney !== undefined) state.storeState.save.money = res.newMoney;
            if (res.newReputation !== undefined) state.storeState.save.reputation = res.newReputation;
            updateUI();
          } else {
            updateMoneyDisplay(res.newMoney);
          }
          hideModalEl(modalOffline);
          checkStaffOnLoad();
        } catch (err) {
          showToast('❌ Nhận thất bại: ' + err.message, 3500);
          btnClaim.disabled = false;
        }
      });
    }

    const btnExtend = document.getElementById('btn-offline-extend-now');
    if (btnExtend) {
      btnExtend.addEventListener('click', () => {
        hideModalEl(modalOffline);
        openStaffModal();
      });
    }
  }

  showModalEl(modalOffline);
}

