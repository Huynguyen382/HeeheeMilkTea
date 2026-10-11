/**
 * HeeHee Milk Tea - Đế Chế Nhượng Quyền & Sàn Đấu Giá Quý Hiếm
 * UI Module: Quản lý chuỗi chi nhánh toàn cầu, thu tiền thụ động, đấu giá mẻ trà cổ thụ.
 */

import { showToast } from './toast.js';
import { updateMoneyDisplay } from './ui.js';
import { state } from './state.js';

let franchiseState = null;
let activeTab = 'branches'; // 'branches' | 'auction' | 'leaderboard'
let royaltiesInterval = null;

/**
 * Khởi tạo Franchise Module
 */
export function initFranchiseModule() {
  const btnFranchiseHeader = document.getElementById('btn-franchise-header');
  const btnFranchiseMenu = document.getElementById('menu-btn-franchise');
  const modalFranchise = document.getElementById('modal-franchise');
  const closeFranchise = document.getElementById('close-franchise');
  const btnCollect = document.getElementById('btn-collect-royalties');
  const btnUnlockC4 = document.getElementById('btn-unlock-chapter-4');

  if (btnFranchiseHeader) {
    btnFranchiseHeader.addEventListener('click', () => openFranchiseModal());
  }

  if (btnFranchiseMenu) {
    btnFranchiseMenu.addEventListener('click', () => {
      const menuModal = document.getElementById('modal-game-menu');
      if (menuModal) {
        menuModal.classList.remove('active');
        menuModal.style.display = 'none';
      }
      openFranchiseModal();
    });
  }

  if (closeFranchise) {
    closeFranchise.addEventListener('click', () => closeFranchiseModal());
  }

  if (btnCollect) {
    btnCollect.addEventListener('click', () => handleCollectRoyalties());
  }

  if (btnUnlockC4) {
    btnUnlockC4.addEventListener('click', () => handleUnlockChapter4());
  }

  // Setup tab switches
  document.querySelectorAll('.franchise-nav-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      const tabTarget = e.currentTarget.dataset.tab;
      switchFranchiseTab(tabTarget);
    });
  });
}

/**
 * Mở modal Đế Chế Nhượng Quyền
 */
export async function openFranchiseModal() {
  const currentChapter = Number(state.storeState?.save?.chapter || 1);
  if (currentChapter < 4) {
    showToast('🔒 Đế Chế Nhượng Quyền chỉ mở khóa khi bạn đạt Chương 4!', 3200);
    return;
  }

  const modal = document.getElementById('modal-franchise');
  if (!modal) return;

  modal.classList.add('active');
  modal.style.display = 'flex';
  await refreshFranchiseData();

  if (royaltiesInterval) clearInterval(royaltiesInterval);
  royaltiesInterval = setInterval(() => {
    updateAccumulatedRoyaltiesDisplay();
  }, 3000);
}

/**
 * Đóng modal
 */
export function closeFranchiseModal() {
  const modal = document.getElementById('modal-franchise');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }

  if (royaltiesInterval) {
    clearInterval(royaltiesInterval);
    royaltiesInterval = null;
  }
}

/**
 * Chuyển tab
 */
function switchFranchiseTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.franchise-nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.franchise-tab-pane').forEach(pane => {
    pane.style.display = pane.id === `tab-${tabName}` ? 'block' : 'none';
  });
}

/**
 * Tải lại dữ liệu từ server
 */
export async function refreshFranchiseData() {
  try {
    const res = await window.API.getFranchise();
    if (!res || res.error) {
      showToast(res?.error || 'Không thể tải dữ liệu nhượng quyền!', 'warning');
      return;
    }

    franchiseState = res;
    renderFranchiseHUD();
    renderBranchesGrid();
    renderAuctionGrid();
    renderLeaderboard();
  } catch (err) {
    console.error('refreshFranchiseData error:', err);
  }
}

/**
 * Cập nhật thanh HUD số liệu
 */
function renderFranchiseHUD() {
  if (!franchiseState) return;

  const moneyEl = document.getElementById('franchise-stat-money');
  const netWorthEl = document.getElementById('franchise-stat-networth');
  const branchesCountEl = document.getElementById('franchise-stat-branches');
  const pendingAmountEl = document.getElementById('franchise-stat-pending');
  const btnCollect = document.getElementById('btn-collect-royalties');
  const bannerChapter4 = document.getElementById('franchise-c4-unlock-banner');

  if (moneyEl) moneyEl.textContent = `${(franchiseState.money || 0).toLocaleString('vi-VN')}đ`;
  if (netWorthEl) netWorthEl.textContent = `${(franchiseState.netWorth || 0).toLocaleString('vi-VN')}đ`;
  if (branchesCountEl) branchesCountEl.textContent = `${franchiseState.ownedCount || 0}/4 chi nhánh`;
  if (pendingAmountEl) pendingAmountEl.textContent = `${(franchiseState.totalPendingRoyalties || 0).toLocaleString('vi-VN')}đ`;

  if (btnCollect) {
    btnCollect.disabled = (franchiseState.totalPendingRoyalties || 0) <= 0;
  }

  // Show Chapter 4 unlock banner if in Chapter 3
  if (bannerChapter4) {
    if (franchiseState.chapter === 3) {
      bannerChapter4.style.display = 'flex';
    } else {
      bannerChapter4.style.display = 'none';
    }
  }
}

/**
 * Cập nhật số tiền nhượng quyền thụ động thời gian thực
 */
function updateAccumulatedRoyaltiesDisplay() {
  if (!franchiseState || !franchiseState.franchises) return;

  let totalPending = 0;
  franchiseState.franchises.forEach(f => {
    if (f.isOwned) {
      totalPending += (f.accumulated || 0);
    }
  });

  const pendingAmountEl = document.getElementById('franchise-stat-pending');
  if (pendingAmountEl) {
    pendingAmountEl.textContent = `${totalPending.toLocaleString('vi-VN')}đ`;
  }
  const btnCollect = document.getElementById('btn-collect-royalties');
  if (btnCollect) {
    btnCollect.disabled = totalPending <= 0;
  }
}

/**
 * Render danh sách chi nhánh
 */
function renderBranchesGrid() {
  const grid = document.getElementById('branches-grid');
  if (!grid || !franchiseState || !franchiseState.franchises) return;

  grid.innerHTML = franchiseState.franchises.map(loc => {
    return `
      <div class="branch-card ${loc.isOwned ? 'branch-active' : ''}">
        <div class="branch-top-row">
          <div class="branch-icon-box" style="background: ${loc.color}22; border-color: ${loc.color};">
            <span>${loc.icon}</span>
          </div>
          <div class="branch-title-col">
            <div class="branch-name-title">${loc.name}</div>
            <div class="branch-location-sub">${loc.location}</div>
          </div>
          ${loc.isOwned ? `
            <span class="branch-level-badge">⭐ Cấp ${loc.level}</span>
          ` : `
            <span class="crop-badge-pill" style="border-color: ${loc.color}; color: ${loc.color};">${loc.badge}</span>
          `}
        </div>

        <div class="branch-desc-text">${loc.desc}</div>

        <div class="branch-stats-box">
          <span>Doanh thu thụ động: <b class="branch-stat-val">+${(loc.ratePerMinute * (1 + (loc.level - 1) * 0.35)).toLocaleString('vi-VN')}đ/phút</b></span>
          ${loc.isOwned ? `
            <span>Tích lũy: <b class="branch-stat-val">${(loc.accumulated || 0).toLocaleString('vi-VN')}đ</b></span>
          ` : `
            <span>Vốn mở: <b style="color: #fdcb6e;">${loc.cost.toLocaleString('vi-VN')}đ</b></span>
          `}
        </div>

        <div class="branch-footer-row">
          ${loc.isOwned ? `
            <button class="btn-branch-action btn-branch-upgrade" ${loc.canUpgrade ? '' : 'disabled'} onclick="window.franchiseModule.handleUpgrade('${loc.id}')">
              ${loc.level >= 5 ? '⭐ Cấp Tối Đa (Max 5)' : `⚡ Nâng Cấp (${loc.nextUpgradeCost.toLocaleString('vi-VN')}đ)`}
            </button>
          ` : `
            <button class="btn-branch-action" ${loc.canBuy ? '' : 'disabled'} onclick="window.franchiseModule.handleOpen('${loc.id}')">
              ${loc.canBuy ? `👑 Mở Chi Nhánh (${loc.cost.toLocaleString('vi-VN')}đ)` : 'Thiếu Vốn Đầu Tư'}
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Sàn Đấu Giá
 */
function renderAuctionGrid() {
  const grid = document.getElementById('auction-grid');
  if (!grid || !franchiseState || !franchiseState.auctionItems) return;

  grid.innerHTML = franchiseState.auctionItems.map(item => {
    return `
      <div class="auction-card ${item.isOwned ? 'auction-won' : ''}">
        <div class="auction-top">
          <div class="auction-icon-box" style="background: ${item.color}22; border-color: ${item.color};">
            <span>${item.icon}</span>
          </div>
          <div class="auction-title-col">
            <div class="auction-name-title">${item.name}</div>
            <span class="auction-badge-pill" style="background: ${item.color}22; color: ${item.color}; border: 1px solid ${item.color};">${item.badge}</span>
          </div>
          ${item.isOwned ? `<span class="won-badge">✓ ĐÃ SỞ HỮU</span>` : ''}
        </div>

        <div class="auction-desc-text">${item.desc}</div>

        <div class="auction-bid-row">
          <div>
            <div style="font-size: 0.72rem; color: #a4b0be;">Giá thầu khởi điểm:</div>
            <div class="auction-price-tag">${item.startingBid.toLocaleString('vi-VN')}đ</div>
          </div>
          ${!item.isOwned ? `
            <button class="btn-auction-bid" ${item.canBid ? '' : 'disabled'} onclick="window.franchiseModule.handleBid('${item.id}')">
              🔨 Đặt Giá Thầu
            </button>
          ` : `
            <span style="font-size: 0.8rem; color: #2ed573; font-weight: bold;">✨ Đang Kích Hoạt Hào Quang</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Bảng Xếp Hạng
 */
function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list-body');
  if (!container || !franchiseState || !franchiseState.leaderboard) return;

  container.innerHTML = franchiseState.leaderboard.map(competitor => {
    const isPlayer = competitor.isPlayer;
    let rankColor = '';
    if (competitor.rank === 1) rankColor = 'rank-1';
    else if (competitor.rank === 2) rankColor = 'rank-2';
    else if (competitor.rank === 3) rankColor = 'rank-3';

    return `
      <tr class="${isPlayer ? 'row-player' : ''}">
        <td><span class="rank-badge ${rankColor}">#${competitor.rank}</span></td>
        <td>
          <b style="${isPlayer ? 'color: #fdcb6e;' : ''}">${competitor.name}</b>
          <div style="font-size: 0.72rem; color: #a4b0be;">${competitor.owner}</div>
        </td>
        <td style="color: #2ed573; font-weight: 800;">${competitor.netWorth.toLocaleString('vi-VN')}đ</td>
        <td><b>${competitor.branches}</b> cơ sở</td>
        <td><span style="color: #f1c40f;">${competitor.rep}⭐</span></td>
        <td><span class="crop-badge-pill" style="border-color: #fdcb6e; color: #fdcb6e;">${competitor.badge}</span></td>
      </tr>
    `;
  }).join('');
}

/**
 * Xử lý mở chi nhánh
 */
export async function handleOpen(franchiseId) {
  try {
    const res = await window.API.openFranchise(franchiseId);
    if (!res || res.error) {
      showToast(res?.error || 'Không thể mở chi nhánh!', 'warning');
      return;
    }

    showToast(res.message, 'success');
    window.sound?.bell?.();
    if (res.money !== undefined) updateMoneyDisplay(res.money);
    if (res.recipes && state.storeState) {
      state.storeState.save.recipes = res.recipes;
    }
    await refreshFranchiseData();
  } catch (err) {
    console.error('handleOpen error:', err);
    showToast('Lỗi khi mở chi nhánh!', 'danger');
  }
}

/**
 * Xử lý nâng cấp chi nhánh
 */
export async function handleUpgrade(franchiseId) {
  try {
    const res = await window.API.upgradeFranchise(franchiseId);
    if (!res || res.error) {
      showToast(res?.error || 'Không thể nâng cấp chi nhánh!', 'warning');
      return;
    }

    showToast(res.message, 'success');
    window.sound?.coin?.();
    if (res.money !== undefined) updateMoneyDisplay(res.money);
    await refreshFranchiseData();
  } catch (err) {
    console.error('handleUpgrade error:', err);
    showToast('Lỗi khi nâng cấp!', 'danger');
  }
}

/**
 * Xử lý thu tiền nhượng quyền thụ động
 */
export async function handleCollectRoyalties() {
  try {
    const res = await window.API.collectFranchiseRoyalties();
    if (!res || res.error) {
      showToast(res?.error || 'Không thể thu tiền nhượng quyền!', 'warning');
      return;
    }

    window.sound?.coin?.();
    showToast(res.message, 'success');
    if (res.money !== undefined) updateMoneyDisplay(res.money);
    await refreshFranchiseData();
  } catch (err) {
    console.error('handleCollectRoyalties error:', err);
    showToast('Lỗi khi thu tiền!', 'danger');
  }
}

/**
 * Xử lý đấu giá
 */
export async function handleBid(itemId) {
  try {
    const res = await window.API.bidAuction(itemId);
    if (!res || res.error) {
      showToast(res?.error || 'Không thể đặt giá thầu!', 'warning');
      return;
    }

    window.sound?.gavel?.();
    showToast(res.message, 'success');
    if (res.money !== undefined) updateMoneyDisplay(res.money);
    await refreshFranchiseData();
  } catch (err) {
    console.error('handleBid error:', err);
    showToast('Lỗi khi đấu giá!', 'danger');
  }
}

/**
 * Xử lý mở khóa Chương 4
 */
export async function handleUnlockChapter4() {
  try {
    const res = await window.API.unlockChapter4();
    if (!res || res.error) {
      showToast(res?.error || 'Không thể mở khóa Chương 4!', 'warning');
      return;
    }

    window.sound?.bell?.();
    showToast(res.message, 'success');
    if (res.money !== undefined) updateMoneyDisplay(res.money);
    if (state.storeState) {
      state.storeState.save.chapter = 4;
      if (res.recipes) state.storeState.save.recipes = res.recipes;
    }
    if (state.canvas) {
      state.canvas.setChapter(4);
      state.canvas.setSceneSetting('franchise');
    }
    try { localStorage.setItem('hyhy_scene_setting', 'franchise'); } catch (e) {}
    if (typeof window.updateUI === 'function') {
      window.updateUI();
    }
    await refreshFranchiseData();
  } catch (err) {
    console.error('handleUnlockChapter4 error:', err);
    showToast('Lỗi khi mở khóa Chương 4!', 'danger');
  }
}

// Gán instance vào window
window.franchiseModule = {
  handleOpen,
  handleUpgrade,
  handleBid,
  handleCollectRoyalties,
  handleUnlockChapter4
};

