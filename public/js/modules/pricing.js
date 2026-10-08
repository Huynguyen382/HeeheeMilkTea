// Milk Tea Pricing & NPC Negotiation Management Module
import { state } from './state.js';
import { showToast } from './toast.js';

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
  const unlocked = save.recipes || ['tra_sua_truyen_thong'];
  const customPrices = save.custom_prices || {};
  const recipesDb = state.storeState?.recipes_db || {};

  container.innerHTML = '';

  const recipeKeys = Object.keys(recipesDb).filter(k => unlocked.includes(k));
  if (recipeKeys.length === 0) recipeKeys.push('tra_sua_truyen_thong');

  recipeKeys.forEach(key => {
    const recipe = recipesDb[key] || {
      id: key,
      name: 'Trà Sữa Truyền Thống',
      basePrice: 15000,
      tea: 'den'
    };

    const currentPrice = customPrices[key] ? Number(customPrices[key]) : recipe.basePrice;
    const risk = getRiskInfo(currentPrice, recipe.basePrice);

    const card = document.createElement('div');
    card.className = 'pricing-card';
    card.setAttribute('data-recipe-id', key);
    card.style.cssText = 'background: #251323; border: 1px solid #4a2b45; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div>
          <span style="font-size: 1.05rem; font-weight: bold; color: #f1c40f;">🧋 ${recipe.name}</span>
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
          <input type="number" id="input-price-${key}" class="pricing-input" data-recipe="${key}" data-base="${recipe.basePrice}" value="${currentPrice}" step="1000" min="5000" max="200000" style="width: 85px; text-align: center; font-weight: bold; color: #f1c40f; background: #110813; border: 1px solid #f1c40f; border-radius: 4px; padding: 4px; font-size: 0.95rem;">
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
