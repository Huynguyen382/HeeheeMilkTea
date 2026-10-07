// Wholesale Market (Chợ Đầu Mối) System
import { state } from './state.js';
import { drawIngredientPixelArt } from './pixel-art.js';
import { updateUI } from './ui.js';
import { showToast } from './toast.js';

let modalMarket = null;
let btnNavMarket = null;
let closeMarket = null;
let marketTabs = null;
let marketGrid = null;
let currentMarketFilter = 'all';

export function renderMarketItems() {
  if (!marketGrid || !state.storeState) return;
  const inv = state.storeState.save ? (state.storeState.save.inventory || {}) : {};
  const money = state.storeState.save ? state.storeState.save.money : 0;
  const items = state.storeState.ingredients || [];

  const filtered = items.filter(it => {
    if (currentMarketFilter === 'all') return true;
    return it.category === currentMarketFilter;
  });

  marketGrid.innerHTML = filtered.map(item => {
    const stock = inv[item.id] || 0;
    const isLow = stock < 5;
    return `
      <div class="market-card">
        <div class="market-card-top">
          <canvas class="market-pixel-canvas" id="canvas-ing-${item.id}" width="44" height="44"></canvas>
          <div class="market-item-info">
            <div class="market-item-title">${item.icon} ${item.name}</div>
            <div class="market-item-desc">${item.desc}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <span class="market-price-tag">${item.price.toLocaleString('vi-VN')}đ / ${item.unit}</span>
              <span class="market-stock-badge ${isLow ? 'low-stock' : ''}">Kho: <b>${stock}</b> ${item.unit}</span>
            </div>
          </div>
        </div>
        <div class="market-buy-actions">
          <button class="btn-market-buy" data-buy-id="${item.id}" data-buy-qty="5" ${money < item.price * 5 ? 'disabled' : ''}>
            +5 (${(item.price * 5).toLocaleString('vi-VN')}đ)
          </button>
          <button class="btn-market-buy" data-buy-id="${item.id}" data-buy-qty="10" ${money < item.price * 10 ? 'disabled' : ''}>
            +10 (${(item.price * 10).toLocaleString('vi-VN')}đ)
          </button>
          <button class="btn-market-buy" data-buy-id="${item.id}" data-buy-qty="20" ${money < item.price * 20 ? 'disabled' : ''}>
            +20 (${(item.price * 20).toLocaleString('vi-VN')}đ)
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Draw pixel art on every canvas
  filtered.forEach(item => {
    const cvs = document.getElementById(`canvas-ing-${item.id}`);
    if (cvs) drawIngredientPixelArt(cvs, item.id);
  });

  // Attach buy listeners
  marketGrid.querySelectorAll('.btn-market-buy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-buy-id');
      const qty = parseInt(btn.getAttribute('data-buy-qty'), 10);
      btn.disabled = true;

      try {
        const res = await window.API.buyIngredients([{ id, quantity: qty }]);
        if (res && res.success) {
          if (window.sound) window.sound.coin();
          showToast(res.message, 3000);
          state.storeState = await window.API.getState();
          updateUI();
          renderMarketItems();
        } else {
          if (window.sound) window.sound.fail();
          showToast('❌ ' + (res.message || 'Không đủ tiền nhập hàng!'), 3000);
          btn.disabled = false;
        }
      } catch (err) {
        console.error('Buy error:', err);
        btn.disabled = false;
      }
    });
  });
}

export function initMarket() {
  modalMarket = document.getElementById('modal-market');
  btnNavMarket = document.getElementById('nav-market');
  closeMarket = document.getElementById('close-market');
  marketTabs = document.getElementById('market-tabs');
  marketGrid = document.getElementById('market-items-grid');

  if (btnNavMarket) {
    btnNavMarket.addEventListener('click', () => {
      if (window.sound) window.sound.bell();
      renderMarketItems();
      if (modalMarket) modalMarket.style.display = 'flex';
    });
  }

  if (closeMarket) {
    closeMarket.addEventListener('click', () => {
      if (modalMarket) modalMarket.style.display = 'none';
    });
  }

  if (marketTabs) {
    marketTabs.querySelectorAll('.story-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        marketTabs.querySelectorAll('.story-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMarketFilter = btn.getAttribute('data-market-filter') || 'all';
        renderMarketItems();
      });
    });
  }
}

