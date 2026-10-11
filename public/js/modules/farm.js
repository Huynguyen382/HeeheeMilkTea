/**
 * HeeHee Milk Tea - Nông Trại Chè Mộc Châu & Xưởng Chế Biến Thủ Công
 * UI Module: Gieo trồng, tưới nước, bón phân, thu hoạch, chế biến siro & trân châu organic.
 */

import { showToast } from './toast.js';
import { updateMoneyDisplay, updateTeaCoinDisplay } from './ui.js';
import { state } from './state.js';

let farmState = null;
let farmInterval = null;
let activeTab = 'farm-plots'; // 'farm-plots' | 'farm-craft' | 'farm-storage'
let selectedPlotForPlanting = null;

/**
 * Khởi tạo Farm UI Module
 */
export function initFarmModule() {
  const btnFarmHeader = document.getElementById('btn-farm-header');
  const btnFarmMenu = document.getElementById('menu-btn-farm');
  const modalFarm = document.getElementById('modal-farm');
  const closeFarm = document.getElementById('close-farm');

  if (btnFarmHeader) {
    btnFarmHeader.addEventListener('click', () => openFarmModal());
  }

  if (btnFarmMenu) {
    btnFarmMenu.addEventListener('click', () => {
      const menuModal = document.getElementById('modal-game-menu');
      if (menuModal) {
        menuModal.classList.remove('active');
        menuModal.style.display = 'none';
      }
      openFarmModal();
    });
  }

  if (closeFarm) {
    closeFarm.addEventListener('click', () => closeFarmModal());
  }

  // Setup tab switches
  document.querySelectorAll('.farm-nav-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      const tabTarget = e.currentTarget.dataset.tab;
      switchFarmTab(tabTarget);
    });
  });

  // Harvest all button
  const btnHarvestAll = document.getElementById('btn-farm-harvest-all');
  if (btnHarvestAll) {
    btnHarvestAll.addEventListener('click', () => handleHarvestAll());
  }

  // Close planting selection dialog
  const closePlantDialog = document.getElementById('close-plant-dialog');
  if (closePlantDialog) {
    closePlantDialog.addEventListener('click', () => {
      const dialog = document.getElementById('dialog-plant-crop');
      if (dialog) dialog.style.display = 'none';
    });
  }
}

/**
 * Mở modal Nông Trại Mộc Châu
 */
export async function openFarmModal() {
  const currentChapter = Number(state.storeState?.save?.chapter || 1);
  if (currentChapter < 3) {
    showToast('🔒 Nông Trại Chè Mộc Châu chỉ mở khóa khi bạn đạt Chương 3!', 3200);
    return;
  }

  const modal = document.getElementById('modal-farm');
  if (!modal) return;

  modal.classList.add('active');
  modal.style.display = 'flex';
  await refreshFarmData();

  // Bắt đầu interval cập nhật thanh tiến trình sinh trưởng mỗi giây
  if (farmInterval) clearInterval(farmInterval);
  farmInterval = setInterval(() => {
    updatePlotCountdowns();
  }, 1000);
}

/**
 * Đóng modal Nông Trại
 */
export function closeFarmModal() {
  const modal = document.getElementById('modal-farm');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }

  const plantDialog = document.getElementById('dialog-plant-crop');
  if (plantDialog) plantDialog.style.display = 'none';

  if (farmInterval) {
    clearInterval(farmInterval);
    farmInterval = null;
  }
}

/**
 * Chuyển tab trong Nông Trại
 */
function switchFarmTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.farm-nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.farm-tab-pane').forEach(pane => {
    pane.style.display = pane.id === `tab-${tabName}` ? 'block' : 'none';
  });
}

/**
 * Tải lại toàn bộ dữ liệu nông trại từ server
 */
export async function refreshFarmData() {
  try {
    const res = await window.API.getFarm();
    if (!res || res.error) {
      showToast(res?.error || 'Không thể tải dữ liệu Nông Trại Mộc Châu!', 'warning');
      return;
    }

    farmState = res;
    renderFarmHUD();
    renderPlotsGrid();
    renderCraftRecipes();
    renderRawMaterialsStorage();
    renderSeedDialogCatalog();
    checkFarmBadge();
  } catch (err) {
    console.error('refreshFarmData error:', err);
  }
}

/**
 * Kiểm tra huy hiệu thông báo nông trại trên header HUD
 */
export function checkFarmBadge() {
  const badge = document.getElementById('hud-farm-badge');
  if (!badge || !farmState || !farmState.plots) return;

  const now = Date.now();
  const readyPlots = farmState.plots.filter(p => p.cropId && (p.isReady || now >= p.readyAt));

  if (readyPlots.length > 0) {
    badge.textContent = readyPlots.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Hiển thị thanh thông tin Nông Trại (Stats Header)
 */
function renderFarmHUD() {
  if (!farmState) return;

  const moneyEl = document.getElementById('farm-stat-money');
  const teaCoinEl = document.getElementById('farm-stat-teacoin');
  const harvestCountEl = document.getElementById('farm-stat-harvests');
  const organicBadgeEl = document.getElementById('farm-stat-organic-badge');

  if (moneyEl) moneyEl.textContent = `${(farmState.money || 0).toLocaleString('vi-VN')}đ`;
  if (teaCoinEl) teaCoinEl.textContent = `🍵 ${farmState.teacoin || 0}`;
  if (harvestCountEl) harvestCountEl.textContent = `${farmState.harvestCount || 0} vụ`;

  if (organicBadgeEl) {
    if (farmState.organicSignatureCups > 0) {
      organicBadgeEl.innerHTML = `🍃 <b>Signature Organic 5⭐:</b> Còn <b>${farmState.organicSignatureCups}</b> ly (+40% giá bán)!`;
      organicBadgeEl.style.display = 'inline-flex';
    } else {
      organicBadgeEl.innerHTML = `🌱 Chưa kích hoạt Organic 5⭐ (Hãy chế biến ở Xưởng)`;
      organicBadgeEl.style.display = 'inline-flex';
    }
  }

  // Cập nhật nút thu hoạch tất cả
  const btnHarvestAll = document.getElementById('btn-farm-harvest-all');
  if (btnHarvestAll && farmState.plots) {
    const readyCount = farmState.plots.filter(p => p.crop && p.isReady).length;
    if (readyCount > 0) {
      btnHarvestAll.style.display = 'inline-flex';
      btnHarvestAll.innerHTML = `🧺 Thu Hoạch Tất Cả (${readyCount})`;
    } else {
      btnHarvestAll.style.display = 'none';
    }
  }
}

/**
 * Render 6 ô đất trồng trọt
 */
function renderPlotsGrid() {
  const grid = document.getElementById('farm-plots-grid');
  if (!grid || !farmState || !farmState.plots) return;

  grid.innerHTML = farmState.plots.map(plot => {
    if (!plot.crop) {
      // Ô đất trống
      return `
        <div class="farm-plot-card plot-empty" data-plot-id="${plot.id}">
          <div class="plot-number-tag">Ô đất #${plot.id}</div>
          <div class="plot-empty-visual">
            <span class="plot-icon-soil">🟫</span>
            <div class="plot-empty-title">Đất Màu Mỡ</div>
            <div class="plot-empty-hint">Sẵn sàng gieo hạt</div>
          </div>
          <button class="btn-farm-action btn-plot-plant" onclick="window.farmModule.openPlantDialog(${plot.id})">
            🌱 Gieo Hạt Giống
          </button>
        </div>
      `;
    }

    // Ô đất đang có cây
    const crop = plot.crop;
    const isReady = plot.isReady;

    let growthStageIcon = '🌱';
    let stageText = 'Mầm non mới nhú';
    if (isReady) {
      growthStageIcon = '✨ ' + crop.icon;
      stageText = 'Chín rộ · Thu hoạch ngay!';
    } else if (plot.progressPercent >= 60) {
      growthStageIcon = '🌿 ' + crop.icon;
      stageText = 'Trĩu cành xanh tốt';
    } else if (plot.progressPercent >= 25) {
      growthStageIcon = '🌱 ' + crop.icon;
      stageText = 'Đang phát triển';
    }

    return `
      <div class="farm-plot-card ${isReady ? 'plot-ready' : 'plot-growing'}" id="plot-card-${plot.id}" data-plot-id="${plot.id}">
        <div class="plot-header-row">
          <span class="plot-number-tag">Ô đất #${plot.id}</span>
          <span class="crop-badge-pill" style="border-color: ${crop.color}; color: ${crop.color};">${crop.badge}</span>
        </div>

        <div class="plot-crop-visual">
          <div class="crop-visual-icon ${isReady ? 'glow-harvest' : ''}">${growthStageIcon}</div>
          <div class="crop-name-title">${crop.name}</div>
          <div class="crop-stage-desc">${stageText}</div>
        </div>

        <div class="plot-progress-section">
          <div class="plot-progress-bar-bg">
            <div class="plot-progress-fill ${isReady ? 'fill-ready' : ''}" id="plot-fill-${plot.id}" style="width: ${plot.progressPercent}%;"></div>
          </div>
          <div class="plot-timer-row">
            <span class="plot-percent-text" id="plot-pct-${plot.id}">${plot.progressPercent}%</span>
            <span class="plot-countdown-text" id="plot-cnt-${plot.id}">${isReady ? 'SẴN SÀNG!' : `${plot.remainingSeconds}s còn lại`}</span>
          </div>
        </div>

        <div class="plot-actions-row">
          ${isReady ? `
            <button class="btn-farm-action btn-plot-harvest" onclick="window.farmModule.handleHarvest(${plot.id})">
              🧺 Thu Hoạch Ngay!
            </button>
          ` : `
            <button class="btn-farm-action btn-plot-water" onclick="window.farmModule.handleWater(${plot.id})" title="Tưới nước suối khoáng (-35% TG)">
              💧 Tưới Nước
            </button>
            <button class="btn-farm-action btn-plot-fertilize" onclick="window.farmModule.handleFertilize(${plot.id})" title="Bón phân trùn quế (Chín ngay)">
              ⚡ Bón Phân
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Cập nhật đếm ngược thời gian thực cho các ô đất
 */
function updatePlotCountdowns() {
  if (!farmState || !farmState.plots) return;

  const now = Date.now();
  let needRefresh = false;

  farmState.plots.forEach(plot => {
    if (!plot.cropId || !plot.crop) return;

    const remainingMs = Math.max(0, plot.readyAt - now);
    const isReady = remainingMs === 0;

    const fillEl = document.getElementById(`plot-fill-${plot.id}`);
    const pctEl = document.getElementById(`plot-pct-${plot.id}`);
    const cntEl = document.getElementById(`plot-cnt-${plot.id}`);

    if (isReady && !plot.isReady) {
      plot.isReady = true;
      needRefresh = true;
    }

    const totalDurationMs = (plot.crop.growthSeconds || 60) * 1000;
    const elapsedMs = Math.max(0, now - plot.plantedAt);
    const pct = isReady ? 100 : Math.min(99, Math.floor((elapsedMs / totalDurationMs) * 100));

    if (fillEl) fillEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (cntEl) cntEl.textContent = isReady ? 'SẴN SÀNG!' : `${Math.ceil(remainingMs / 1000)}s còn lại`;
  });

  if (needRefresh) {
    renderPlotsGrid();
    renderFarmHUD();
    checkFarmBadge();
  }
}

/**
 * Render danh mục hạt giống trong popup chọn gieo hạt
 */
function renderSeedDialogCatalog() {
  const container = document.getElementById('plant-crop-list');
  if (!container || !farmState || !farmState.cropsCatalog) return;

  container.innerHTML = farmState.cropsCatalog.map(crop => {
    const canAfford = (farmState.money || 0) >= crop.seedCost;
    return `
      <div class="seed-option-card ${canAfford ? '' : 'seed-disabled'}">
        <div class="seed-icon-box" style="background: ${crop.color}22; border-color: ${crop.color};">
          <span>${crop.icon}</span>
        </div>
        <div class="seed-info-col">
          <div class="seed-name-title">${crop.name}</div>
          <div class="seed-subname-desc">${crop.desc}</div>
          <div class="seed-meta-row">
            <span class="seed-cost-pill">💰 ${crop.seedCost.toLocaleString('vi-VN')}đ</span>
            <span class="seed-time-pill">⏱️ ${crop.growthSeconds}s lớn</span>
            <span class="seed-badge-pill">${crop.badge}</span>
          </div>
        </div>
        <button class="btn-farm-action btn-seed-buy" ${canAfford ? '' : 'disabled'} onclick="window.farmModule.handlePlantCrop('${crop.id}')">
          ${canAfford ? '🌱 Gieo Ngay' : 'Thiếu Tiền'}
        </button>
      </div>
    `;
  }).join('');
}

/**
 * Mở popup chọn cây gieo hạt
 */
export function openPlantDialog(plotId) {
  selectedPlotForPlanting = plotId;
  const dialog = document.getElementById('dialog-plant-crop');
  const title = document.getElementById('plant-dialog-plot-title');
  if (title) title.textContent = `Gieo Hạt Giống Vào Ô Đất #${plotId}`;
  if (dialog) dialog.style.display = 'flex';
}

/**
 * Xử lý gieo hạt
 */
export async function handlePlantCrop(cropId) {
  if (!selectedPlotForPlanting) return;

  try {
    const res = await window.API.plantFarm(selectedPlotForPlanting, cropId);
    if (!res || res.error) {
      showToast(res?.error || 'Không thể gieo hạt!', 'warning');
      return;
    }

    showToast(res.message, 'success');
    window.sound?.coin?.();
    const dialog = document.getElementById('dialog-plant-crop');
    if (dialog) dialog.style.display = 'none';

    if (res.money !== undefined) updateMoneyDisplay(res.money);
    await refreshFarmData();
  } catch (err) {
    console.error('handlePlantCrop error:', err);
    showToast('Lỗi khi gieo hạt giống!', 'danger');
  }
}

/**
 * Xử lý tưới nước
 */
export async function handleWater(plotId) {
  try {
    const res = await window.API.waterFarm(plotId);
    if (!res || res.error) {
      showToast(res?.error || 'Không thể tưới nước!', 'warning');
      return;
    }

    window.sound?.waterDrop?.();
    showToast(res.message, 'info');
    await refreshFarmData();
  } catch (err) {
    console.error('handleWater error:', err);
    showToast('Lỗi khi tưới nước!', 'danger');
  }
}

/**
 * Xử lý bón phân (làm chín ngay)
 */
export async function handleFertilize(plotId) {
  const useTeaCoin = (farmState.teacoin || 0) >= 1;
  const confirmMsg = useTeaCoin
    ? 'Dùng 1 TeaCoin bón phân hữu cơ để cây chín rộ ngay lập tức?'
    : 'Dùng 10.000đ tiền mặt bón phân hữu cơ để cây chín rộ ngay lập tức?';

  if (!confirm(confirmMsg)) return;

  try {
    const res = await window.API.fertilizeFarm(plotId, useTeaCoin);
    if (!res || res.error) {
      showToast(res?.error || 'Không thể bón phân!', 'warning');
      return;
    }

    window.sound?.waterDrop?.();
    showToast(res.message, 'success');
    if (res.money !== undefined) updateMoneyDisplay(res.money);
    if (res.teacoin !== undefined) updateTeaCoinDisplay(res.teacoin);
    await refreshFarmData();
  } catch (err) {
    console.error('handleFertilize error:', err);
    showToast('Lỗi khi bón phân!', 'danger');
  }
}

/**
 * Xử lý thu hoạch 1 ô đất
 */
export async function handleHarvest(plotId) {
  try {
    const res = await window.API.harvestFarm(plotId);
    if (!res || res.error) {
      showToast(res?.error || 'Không thể thu hoạch!', 'warning');
      return;
    }

    window.sound?.harvest?.();
    showToast(res.message, 'success');
    if (res.inventory && state.storeState) {
      state.storeState.save.inventory = res.inventory;
    }
    await refreshFarmData();
  } catch (err) {
    console.error('handleHarvest error:', err);
    showToast('Lỗi khi thu hoạch!', 'danger');
  }
}

/**
 * Xử lý thu hoạch toàn bộ ô đất đã chín
 */
export async function handleHarvestAll() {
  try {
    const res = await window.API.harvestAllFarm();
    if (!res || res.error) {
      showToast(res?.error || 'Không thể thu hoạch tất cả!', 'warning');
      return;
    }

    window.sound?.harvest?.();
    showToast(res.message, 'success');
    if (res.inventory && state.storeState) {
      state.storeState.save.inventory = res.inventory;
    }
    await refreshFarmData();
  } catch (err) {
    console.error('handleHarvestAll error:', err);
    showToast('Lỗi khi thu hoạch tất cả!', 'danger');
  }
}

/**
 * Render danh sách công thức chế biến trong xưởng thủ công
 */
function renderCraftRecipes() {
  const container = document.getElementById('farm-craft-recipes-list');
  if (!container || !farmState || !farmState.craftCatalog) return;

  container.innerHTML = farmState.craftCatalog.map(recipe => {
    const reqHtml = Object.entries(recipe.requires).map(([matId, reqQty]) => {
      const info = farmState.rawMaterialInfo?.[matId] || { name: matId, icon: '🌿' };
      const owned = farmState.rawMaterials?.[matId] || 0;
      const isEnough = owned >= reqQty;
      return `
        <span class="craft-mat-pill ${isEnough ? 'mat-enough' : 'mat-missing'}">
          ${info.icon} ${info.name}: <b>${owned}/${reqQty}</b>
        </span>
      `;
    }).join('');

    const produceHtml = Object.entries(recipe.produce).map(([ingId, qty]) => {
      return `<span class="craft-reward-pill">+${qty} ${ingId}</span>`;
    }).join(' ');

    return `
      <div class="craft-recipe-card ${recipe.canCraft ? 'recipe-ready' : 'recipe-locked'}">
        <div class="craft-card-top">
          <div class="craft-icon-badge">${recipe.icon}</div>
          <div class="craft-title-col">
            <div class="craft-name-title">${recipe.name}</div>
            <div class="craft-desc-text">${recipe.desc}</div>
          </div>
          <span class="craft-tag-pill">${recipe.badge}</span>
        </div>

        <div class="craft-mats-row">
          <span class="craft-row-label">Nguyên liệu cần:</span>
          ${reqHtml}
        </div>

        <div class="craft-footer-row">
          <div class="craft-rewards-preview">
            <span class="craft-reward-label">Thưởng:</span>
            ${produceHtml}
            <span class="craft-reward-buff">🍃 +${recipe.organicBuffCups} ly Organic (+40%)</span>
          </div>
          <button class="btn-farm-action btn-craft-submit" ${recipe.canCraft ? '' : 'disabled'} onclick="window.farmModule.handleCraftRecipe('${recipe.id}')">
            ${recipe.canCraft ? '🍳 Bắt Đầu Chế Biến' : 'Thiếu Nguyên Liệu'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Xử lý chế biến công thức
 */
export async function handleCraftRecipe(recipeId) {
  try {
    const res = await window.API.craftFarm(recipeId);
    if (!res || res.error) {
      showToast(res?.error || 'Không thể chế biến công thức!', 'warning');
      return;
    }

    showToast(res.message, 'success');
    window.sound?.craft?.();
    if (res.inventory && state.storeState) {
      state.storeState.save.inventory = res.inventory;
    }
    await refreshFarmData();
  } catch (err) {
    console.error('handleCraftRecipe error:', err);
    showToast('Lỗi khi chế biến!', 'danger');
  }
}

/**
 * Render kho nông sản thô
 */
function renderRawMaterialsStorage() {
  const container = document.getElementById('farm-storage-materials-grid');
  if (!container || !farmState || !farmState.rawMaterials) return;

  const rawInfo = farmState.rawMaterialInfo || {};
  container.innerHTML = Object.entries(farmState.rawMaterials).map(([matId, qty]) => {
    const info = rawInfo[matId] || { name: matId, icon: '🌿', color: '#00cec9' };
    return `
      <div class="storage-mat-card" style="border-color: ${info.color}44;">
        <div class="storage-mat-icon" style="background: ${info.color}22;">${info.icon}</div>
        <div class="storage-mat-name">${info.name}</div>
        <div class="storage-mat-qty" style="color: ${info.color};">${qty} phần</div>
      </div>
    `;
  }).join('');
}

// Gán instance vào window để inline onclick hoạt động trơn tru
window.farmModule = {
  openPlantDialog,
  handlePlantCrop,
  handleWater,
  handleFertilize,
  handleHarvest,
  handleHarvestAll,
  handleCraftRecipe
};

