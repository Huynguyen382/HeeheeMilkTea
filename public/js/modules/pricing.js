import { state, TOPPING_LABELS, TEA_LABELS } from './state.js';
import { showToast } from './toast.js';
import { updateUI } from './ui.js';

export function getRiskInfo(currentPrice, basePrice) {
  const ratio = currentPrice / basePrice;
  if (ratio <= 1.0) {
    return {
      text: '🟢 Giá chuẩn • Khách không mặc cả',
      bg: 'rgba(46, 204, 113, 0.15)',
      border: '#2ecc71',
      color: '#2ecc71'
    };
  } else if (ratio <= 1.2) {
    const pct = Math.round((ratio - 1) * 100);
    return {
      text: `🟡 Hơi cao (+${pct}%) • 35% khách mặc cả`,
      bg: 'rgba(241, 196, 15, 0.15)',
      border: '#f1c40f',
      color: '#f1c40f'
    };
  } else if (ratio <= 1.5) {
    const pct = Math.round((ratio - 1) * 100);
    return {
      text: `🟠 Khá chát (+${pct}%) • 65% khách mặc cả`,
      bg: 'rgba(230, 126, 34, 0.15)',
      border: '#e67e22',
      color: '#e67e22'
    };
  } else {
    const pct = Math.round((ratio - 1) * 100);
    return {
      text: `🔴 Quá đắt (+${pct}%) • 90% mặc cả (70% hủy nếu từ chối)`,
      bg: 'rgba(231, 76, 60, 0.2)',
      border: '#e74c3c',
      color: '#ff7675'
    };
  }
}

export function openPricingModal() {
  const modal = document.getElementById('modal-pricing');
  if (!modal) return;

  const container = document.getElementById('pricing-recipes-list');
  if (!container) return;

  const save = state.storeState?.save || {};
  const upgrades = save.upgrades || {};
  const rawUnlocked = Array.isArray(save.recipes) ? save.recipes : ['tra_sua_truyen_thong'];
  const customPrices = save.custom_prices || {};
  const recipesDb = state.storeState?.recipes_db || {};
  const upgradesDb = state.storeState?.upgrades_db || {};

  container.innerHTML = '';

  const allKeys = Object.keys(recipesDb);
  if (allKeys.length === 0) allKeys.push('tra_sua_truyen_thong');

  const isRecipeUnlocked = (key) => {
    if (key === 'tra_sua_truyen_thong') return true;
    return !!(upgrades[`recipe_${key}`] || rawUnlocked.includes(key));
  };

  const unlockedKeys = allKeys.filter(k => isRecipeUnlocked(k));
  const lockedKeys = allKeys.filter(k => !isRecipeUnlocked(k));

  // Summary bar
  const summaryBar = document.createElement('div');
  summaryBar.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #160c18; border: 1px solid #57334d; border-radius: 6px; padding: 8px 12px; font-size: 0.85rem;';
  summaryBar.innerHTML = `
    <span style="color: #dfe6e9;">🍹 Đã mở khóa: <b style="color: #50fa7b;">${unlockedKeys.length}/${allKeys.length} món</b></span>
    <span style="color: #dfe6e9;">💰 Tiền mặt: <b style="color: #f1c40f;">${(save.money || 0).toLocaleString('vi-VN')}đ</b></span>
  `;
  container.appendChild(summaryBar);

  // Section 1 Header: Unlocked Recipes
  const unlockedHeader = document.createElement('div');
  unlockedHeader.style.cssText = 'font-weight: bold; color: #50fa7b; font-size: 0.92rem; margin-top: 4px;';
  unlockedHeader.innerText = `✅ MÓN ĐANG MỞ BÁN (${unlockedKeys.length} món) — Tùy chỉnh giá bán:`;
  container.appendChild(unlockedHeader);

  unlockedKeys.forEach(key => {
    const recipe = recipesDb[key] || {
      id: key,
      name: 'Trà Sữa Truyền Thống',
      icon: '🧋',
      basePrice: 32000,
      tea: 'den',
      toppings: ['tranchau_den']
    };

    const currentPrice = customPrices[key] ? Number(customPrices[key]) : recipe.basePrice;
    const risk = getRiskInfo(currentPrice, recipe.basePrice);
    const teaLabel = TEA_LABELS[recipe.tea] || '🍵 Trà Đen Đậm';
    const topLabel = (recipe.toppings && recipe.toppings.length > 0)
      ? recipe.toppings.map(t => TOPPING_LABELS[t] || t).join(' + ')
      : 'Không topping';

    const card = document.createElement('div');
    card.className = 'pricing-card';
    card.setAttribute('data-recipe-id', key);
    card.style.cssText = 'background: #251323; border: 1px solid #2ecc71; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div>
          <span style="font-size: 1.02rem; font-weight: bold; color: #f1c40f;">${recipe.icon || '🧋'} ${recipe.name}</span>
          <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 2px;">
            Cốt: <b style="color: #50fa7b;">${teaLabel}</b> • Topping: <b style="color: #8be9fd;">${topLabel}</b>
          </div>
          <div style="font-size: 0.8rem; color: #a4b0be; margin-top: 2px;">
            Giá thị trường niêm yết: <b style="color: #55efc4;">${recipe.basePrice.toLocaleString('vi-VN')}đ</b>
          </div>
        </div>
        <div id="risk-badge-${key}" style="font-size: 0.72rem; padding: 3px 6px; border-radius: 4px; font-weight: bold; text-align: right; background: ${risk.bg}; border: 1px solid ${risk.border}; color: ${risk.color}; white-space: nowrap;">
          ${risk.text}
        </div>
      </div>
      
      <div style="display: flex; align-items: center; justify-content: space-between; background: #160c18; padding: 6px 10px; border-radius: 6px; border: 1px solid #3d2138;">
        <span style="font-size: 0.86rem; color: #ffeaa7;">Giá bán quán đặt:</span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn-price-step" data-step="-1000" data-recipe="${key}" style="background: #341f30; border: 1px solid #7d446f; color: #fff; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1.1rem; line-height: 1;">-</button>
          <input type="number" id="input-price-${key}" class="pricing-input" data-recipe="${key}" data-base="${recipe.basePrice}" value="${currentPrice}" step="1000" min="20000" max="200000" style="width: 85px; text-align: center; font-weight: bold; color: #f1c40f; background: #110813; border: 1px solid #f1c40f; border-radius: 4px; padding: 4px; font-size: 0.95rem;">
          <span style="font-size: 0.85rem; color: #a4b0be;">đ</span>
          <button class="btn-price-step" data-step="1000" data-recipe="${key}" style="background: #341f30; border: 1px solid #7d446f; color: #fff; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1.1rem; line-height: 1;">+</button>
        </div>
      </div>

      <div style="display: flex; gap: 4px; justify-content: flex-end; flex-wrap: wrap;">
        <button class="btn-price-preset" data-pct="1.0" data-recipe="${key}" style="font-size: 0.72rem; padding: 2px 6px; background: #2d182a; border: 1px solid #57334d; color: #bdc3c7; border-radius: 3px; cursor: pointer;">Chuẩn (0%)</button>
        <button class="btn-price-preset" data-pct="1.15" data-recipe="${key}" style="font-size: 0.72rem; padding: 2px 6px; background: #2d182a; border: 1px solid #57334d; color: #bdc3c7; border-radius: 3px; cursor: pointer;">+15%</button>
        <button class="btn-price-preset" data-pct="1.3" data-recipe="${key}" style="font-size: 0.72rem; padding: 2px 6px; background: #2d182a; border: 1px solid #57334d; color: #bdc3c7; border-radius: 3px; cursor: pointer;">+30%</button>
        <button class="btn-price-preset" data-pct="1.6" data-recipe="${key}" style="font-size: 0.72rem; padding: 2px 6px; background: #2d182a; border: 1px solid #57334d; color: #bdc3c7; border-radius: 3px; cursor: pointer;">+60%</button>
      </div>
    `;

    container.appendChild(card);
  });

  // Section 2: Locked Recipes (Player must pay money to unlock)
  if (lockedKeys.length > 0) {
    const lockedHeader = document.createElement('div');
    lockedHeader.style.cssText = 'font-weight: bold; color: #ff7675; font-size: 0.92rem; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #57334d;';
    lockedHeader.innerText = `🔒 MÓN ĐANG KHÓA (${lockedKeys.length} món) — Mua công thức để mở bán:`;
    container.appendChild(lockedHeader);

    lockedKeys.forEach(key => {
      const recipe = recipesDb[key];
      if (!recipe) return;

      const upgradeKey = recipe.upgradeId || `recipe_${key}`;
      const upg = upgradesDb[upgradeKey] || {};
      const unlockCost = recipe.unlockCost || upg.cost || 250000;
      const canAfford = (save.money || 0) >= unlockCost;
      const teaLabel = TEA_LABELS[recipe.tea] || '🍵 Trà Đen Đậm';
      const topLabel = (recipe.toppings && recipe.toppings.length > 0)
        ? recipe.toppings.map(t => TOPPING_LABELS[t] || t).join(' + ')
        : 'Không topping';

      const card = document.createElement('div');
      card.className = 'pricing-card locked-recipe-card';
      card.setAttribute('data-recipe-id', key);
      card.style.cssText = 'background: rgba(22, 12, 24, 0.85); border: 1px solid #63395b; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <div>
            <span style="font-size: 1.0rem; font-weight: bold; color: #dfe6e9;">🔒 ${recipe.icon || '🧋'} ${recipe.name}</span>
            <div style="font-size: 0.78rem; color: #a4b0be; margin-top: 2px;">
              Cốt: <b style="color: #ffb86c;">${teaLabel}</b> • Topping: <b style="color: #8be9fd;">${topLabel}</b>
            </div>
            <div style="font-size: 0.8rem; color: #a4b0be; margin-top: 2px;">
              Giá bán niêm yết khi mở: <b style="color: #55efc4;">${recipe.basePrice.toLocaleString('vi-VN')}đ/ly</b>
            </div>
          </div>
          <span style="font-size: 0.72rem; padding: 3px 7px; border-radius: 4px; font-weight: bold; background: rgba(231, 76, 60, 0.18); border: 1px solid #e74c3c; color: #ff7675; white-space: nowrap;">
            🔒 Đang Khóa
          </span>
        </div>
        <div style="font-size: 0.78rem; color: #95a5a6; line-height: 1.35;">
          ${recipe.desc || ''}
        </div>
        <button class="btn-buy-recipe-in-menu" data-upgrade="${upgradeKey}" style="width: 100%; padding: 8px 12px; border-radius: 5px; border: none; font-weight: bold; font-size: 0.88rem; cursor: pointer; background: ${canAfford ? 'linear-gradient(135deg, #f39c12, #d35400)' : '#4a5568'}; color: #fff;">
          🔓 Mua Công Thức Mở Khóa (${unlockCost.toLocaleString('vi-VN')}đ)
        </button>
      `;

      container.appendChild(card);
    });
  }

  // Attach Buy Recipe buttons inside Menu Modal
  container.querySelectorAll('.btn-buy-recipe-in-menu').forEach(btn => {
    btn.addEventListener('click', async () => {
      const upId = btn.getAttribute('data-upgrade');
      if (!upId) return;
      btn.disabled = true;
      const oldText = btn.innerText;
      btn.innerText = 'Đang mở khóa công thức...';
      try {
        const res = await window.API.buyUpgrade(upId);
        if (res && res.success) {
          if (window.sound && window.sound.coin) window.sound.coin();
          showToast(res.message || '🎉 Đã mở khóa công thức mới vào Menu!', 3500);
          state.storeState = await window.API.getState();
          updateUI();
          openPricingModal();
        } else {
          if (window.sound && window.sound.fail) window.sound.fail();
          showToast('❌ ' + (res?.message || 'Không thể mua công thức này!'), 3500);
          btn.disabled = false;
          btn.innerText = oldText;
        }
      } catch (err) {
        console.error('Buy recipe error:', err);
        showToast('❌ Lỗi kết nối máy chủ khi mua công thức!', 3000);
        btn.disabled = false;
        btn.innerText = oldText;
      }
    });
  });

  // Attach dynamic input listeners
  container.querySelectorAll('.pricing-input').forEach(input => {
    input.addEventListener('input', () => {
      const recId = input.getAttribute('data-recipe');
      const base = Number(input.getAttribute('data-base')) || 15000;
      const val = Number(input.value) || base;
      updateRiskDisplay(recId, val, base);
    });
  });

  // Attach stepper buttons (+ / - 1.000đ)
  container.querySelectorAll('.btn-price-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const recId = btn.getAttribute('data-recipe');
      const step = Number(btn.getAttribute('data-step')) || 1000;
      const input = document.getElementById(`input-price-${recId}`);
      if (!input) return;
      const base = Number(input.getAttribute('data-base')) || 15000;
      let val = (Number(input.value) || base) + step;
      val = Math.max(5000, Math.min(200000, val));
      input.value = val;
      updateRiskDisplay(recId, val, base);
    });
  });

  // Attach preset percentage buttons
  container.querySelectorAll('.btn-price-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const recId = btn.getAttribute('data-recipe');
      const pct = Number(btn.getAttribute('data-pct')) || 1.0;
      const input = document.getElementById(`input-price-${recId}`);
      if (!input) return;
      const base = Number(input.getAttribute('data-base')) || 15000;
      const val = Math.round((base * pct) / 1000) * 1000;
      input.value = val;
      updateRiskDisplay(recId, val, base);
    });
  });

  if (window.sound && window.sound.pop) window.sound.pop();
  modal.style.display = 'flex';
}

function updateRiskDisplay(recipeId, currentPrice, basePrice) {
  const badge = document.getElementById(`risk-badge-${recipeId}`);
  if (!badge) return;
  const risk = getRiskInfo(currentPrice, basePrice);
  badge.innerText = risk.text;
  badge.style.background = risk.bg;
  badge.style.borderColor = risk.border;
  badge.style.color = risk.color;
}

export function closePricingModal() {
  const modal = document.getElementById('modal-pricing');
  if (modal) modal.style.display = 'none';
}

export async function savePricing() {
  const container = document.getElementById('pricing-recipes-list');
  if (!container) return;

  const btnSave = document.getElementById('btn-save-pricing');
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerText = 'Đang lưu...';
  }

  const customPrices = {};
  container.querySelectorAll('.pricing-input').forEach(input => {
    const recId = input.getAttribute('data-recipe');
    const val = Number(input.value);
    if (recId && !isNaN(val) && val >= 5000) {
      customPrices[recId] = val;
    }
  });

  try {
    const res = await window.API.setCustomPrices(customPrices);
    if (res && res.success) {
      if (state.storeState && state.storeState.save) {
        state.storeState.save.custom_prices = res.customPrices;
      }
      showToast('✅ Đã lưu bảng giá trà sữa thành công!', 3500);
      if (window.sound && window.sound.bell) window.sound.bell();
      closePricingModal();
    } else {
      showToast(res?.error || res?.message || 'Có lỗi xảy ra khi lưu bảng giá', 4000);
    }
  } catch (err) {
    console.error('Error saving pricing:', err);
    showToast('Lỗi kết nối máy chủ khi lưu bảng giá', 3000);
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerText = '💾 Lưu Bảng Giá Mới';
    }
  }
}

export function resetDefaultPricing() {
  const container = document.getElementById('pricing-recipes-list');
  if (!container) return;

  container.querySelectorAll('.pricing-input').forEach(input => {
    const recId = input.getAttribute('data-recipe');
    const base = Number(input.getAttribute('data-base')) || 15000;
    input.value = base;
    updateRiskDisplay(recId, base, base);
  });
  showToast('Đã đặt lại về giá thị trường niêm yết. Nhấn "Lưu Bảng Giá" để xác nhận!', 3000);
}

export function initPricing() {
  const btnClose = document.getElementById('close-pricing');
  if (btnClose) btnClose.addEventListener('click', closePricingModal);

  const btnSave = document.getElementById('btn-save-pricing');
  if (btnSave) btnSave.addEventListener('click', savePricing);

  const btnReset = document.getElementById('btn-reset-default-pricing');
  if (btnReset) btnReset.addEventListener('click', resetDefaultPricing);

  // HUD top header button
  const btnPricingHeader = document.getElementById('btn-pricing-header');
  if (btnPricingHeader) btnPricingHeader.addEventListener('click', openPricingModal);

  // Menu button
  const btnMenuPricing = document.getElementById('menu-btn-pricing');
  if (btnMenuPricing) {
    btnMenuPricing.addEventListener('click', () => {
      const modalMenu = document.getElementById('modal-game-menu');
      if (modalMenu) modalMenu.style.display = 'none';
      openPricingModal();
    });
  }

  // Modal overlay click outside
  const modal = document.getElementById('modal-pricing');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closePricingModal();
    });
  }
}
