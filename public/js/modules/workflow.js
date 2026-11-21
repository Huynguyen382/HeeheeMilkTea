// 4-Step Barista Workflow & Mixing System
import { state, TOPPING_LABELS, TEA_LABELS, RECIPE_TEA_MAP, TEA_INV_MAP } from './state.js';
import { showToast } from './toast.js';
import { updateUI } from './ui.js';
import { scheduleNextOrder, startNextOrderInQueue, handleOrderTimeout } from './order-manager.js';
import { showJailModal } from './modals.js';
import { patchLocalSave, queueServedOrder } from './save-sync.js';

let elOrderSection = null;
let elBtnShaker = null;
let elBtnPourCup = null;
let elBtnSealCup = null;
let elBtnServe = null;

let elMixTea = null;
let elMixSugar = null;
let elMixIce = null;
let elMixTop = null;

// Tactile Web Vibration API helper for mobile ergonomics
function triggerHaptic(ms = 10) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch (_) {
    // Ignore on unsupported devices
  }
}

// Step indicators and button states
export function updateWorkflowButtons() {
  const hasOrder = !!state.currentOrder;

  // Step 1: 1. Lắc Bình
  if (!state.isShaken) {
    if (elBtnShaker) {
      elBtnShaker.disabled = !hasOrder;
      elBtnShaker.classList.toggle('ready-step', hasOrder);
      elBtnShaker.classList.remove('completed-step');
      const txt = elBtnShaker.querySelector('.wf-text');
      if (txt) txt.innerText = '1. Lắc Bình';
      const ico = elBtnShaker.querySelector('.wf-icon');
      if (ico) ico.innerText = '🍸';
    }
    if (elBtnPourCup) {
      elBtnPourCup.disabled = true;
      elBtnPourCup.classList.remove('ready-step', 'completed-step');
      const txt = elBtnPourCup.querySelector('.wf-text');
      if (txt) txt.innerText = '2. Rót Cốc';
      const ico = elBtnPourCup.querySelector('.wf-icon');
      if (ico) ico.innerText = '🧋';
    }
    if (elBtnSealCup) {
      elBtnSealCup.disabled = true;
      elBtnSealCup.classList.remove('ready-step', 'completed-step');
      const txt = elBtnSealCup.querySelector('.wf-text');
      if (txt) txt.innerText = '3. Dập Nắp';
      const ico = elBtnSealCup.querySelector('.wf-icon');
      if (ico) ico.innerText = '🖲️';
    }
    if (elBtnServe) {
      elBtnServe.disabled = true;
      elBtnServe.classList.remove('ready-step');
    }
  } else if (!state.isPoured) {
    // Step 2: 2. Rót Cốc
    if (elBtnShaker) {
      elBtnShaker.disabled = false;
      elBtnShaker.classList.remove('ready-step');
      elBtnShaker.classList.add('completed-step');
      const txt = elBtnShaker.querySelector('.wf-text');
      if (txt) txt.innerText = '✓ Đã Lắc';
      const ico = elBtnShaker.querySelector('.wf-icon');
      if (ico) ico.innerText = '✅';
    }
    if (elBtnPourCup) {
      elBtnPourCup.disabled = !hasOrder;
      elBtnPourCup.classList.toggle('ready-step', hasOrder);
      elBtnPourCup.classList.remove('completed-step');
      const txt = elBtnPourCup.querySelector('.wf-text');
      if (txt) txt.innerText = '2. Rót Cốc';
      const ico = elBtnPourCup.querySelector('.wf-icon');
      if (ico) ico.innerText = '🧋';
    }
    if (elBtnSealCup) {
      elBtnSealCup.disabled = true;
      elBtnSealCup.classList.remove('ready-step', 'completed-step');
      const txt = elBtnSealCup.querySelector('.wf-text');
      if (txt) txt.innerText = '3. Dập Nắp';
      const ico = elBtnSealCup.querySelector('.wf-icon');
      if (ico) ico.innerText = '🖲️';
    }
    if (elBtnServe) {
      elBtnServe.disabled = true;
      elBtnServe.classList.remove('ready-step');
    }
  } else if (!state.isSealed) {
    // Step 3: 3. Dập Nắp
    if (elBtnShaker) {
      elBtnShaker.disabled = true;
      elBtnShaker.classList.remove('ready-step');
      elBtnShaker.classList.add('completed-step');
      const txt = elBtnShaker.querySelector('.wf-text');
      if (txt) txt.innerText = '✓ Đã Lắc';
      const ico = elBtnShaker.querySelector('.wf-icon');
      if (ico) ico.innerText = '✅';
    }
    if (elBtnPourCup) {
      elBtnPourCup.disabled = true;
      elBtnPourCup.classList.remove('ready-step');
      elBtnPourCup.classList.add('completed-step');
      const txt = elBtnPourCup.querySelector('.wf-text');
      if (txt) txt.innerText = '✓ Đã Rót';
      const ico = elBtnPourCup.querySelector('.wf-icon');
      if (ico) ico.innerText = '✅';
    }
    if (elBtnSealCup) {
      elBtnSealCup.disabled = !hasOrder;
      elBtnSealCup.classList.toggle('ready-step', hasOrder);
      elBtnSealCup.classList.remove('completed-step');
      const txt = elBtnSealCup.querySelector('.wf-text');
      if (txt) txt.innerText = '3. Dập Nắp';
      const ico = elBtnSealCup.querySelector('.wf-icon');
      if (ico) ico.innerText = '🖲️';
    }
    if (elBtnServe) {
      elBtnServe.disabled = true;
      elBtnServe.classList.remove('ready-step');
    }
  } else {
    // Step 4: GIAO LY (SERVE)
    if (elBtnShaker) {
      elBtnShaker.disabled = true;
      elBtnShaker.classList.remove('ready-step');
      elBtnShaker.classList.add('completed-step');
    }
    if (elBtnPourCup) {
      elBtnPourCup.disabled = true;
      elBtnPourCup.classList.remove('ready-step');
      elBtnPourCup.classList.add('completed-step');
    }
    if (elBtnSealCup) {
      elBtnSealCup.disabled = true;
      elBtnSealCup.classList.remove('ready-step');
      elBtnSealCup.classList.add('completed-step');
      const txt = elBtnSealCup.querySelector('.wf-text');
      if (txt) txt.innerText = '✓ Đã Dập';
      const ico = elBtnSealCup.querySelector('.wf-icon');
      if (ico) ico.innerText = '✅';
    }
    if (elBtnServe) {
      elBtnServe.disabled = !hasOrder;
      elBtnServe.classList.toggle('ready-step', hasOrder);
    }
  }
}

export function renderOrderTicket() {
  updateWorkflowButtons();
  if (!elOrderSection) elOrderSection = document.getElementById('order-content');
  if (!elOrderSection) return;

  if (!state.currentOrder) {
    elOrderSection.innerHTML = `<div class="order-box no-order">Đang ngóng chờ khách hàng tiếp theo ghé quầy... 🧋</div>`;
    return;
  }

  const orderToppingNames = (state.currentOrder.toppings && state.currentOrder.toppings.length > 0)
    ? state.currentOrder.toppings.map(t => TOPPING_LABELS[t] || t).join(' + ')
    : 'Không topping';

  const teaGuide = RECIPE_TEA_MAP[state.currentOrder.recipeId] || {
    teaId: state.currentOrder.tea || 'den',
    teaName: state.currentOrder.tea === 'thai_xanh' ? 'Thái Xanh' : (state.currentOrder.tea === 'sua_tuoi' ? 'Sữa Tươi' : (state.currentOrder.tea === 'lai' ? 'Lục Trà Lài' : (state.currentOrder.tea === 'olong_nuong' ? 'Ô Long Nướng' : 'Trà Đen Đậm'))),
    icon: '🍵',
    btnLabel: 'Trà'
  };

  const charObj = (typeof window.getCharacter === 'function')
    ? window.getCharacter(state.currentOrder.customerName || state.currentOrder.customerType)
    : null;
  const isVIPOrder = !!state.currentOrder.isStoryVIP;
  const vipBadge = isVIPOrder
    ? `<span style="font-size: 0.72rem; background: linear-gradient(90deg, #f59e0b, #ef4444); color: #fff; padding: 2px 7px; border-radius: 4px; margin-left: 6px; font-weight: bold; border: 1px solid #fde047; box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);">${state.currentOrder.vipRole || '👑 VIP CỐT TRUYỆN'}</span>`
    : '';

  const roleBadge = charObj && charObj.role && !isVIPOrder
    ? `<span style="font-size: 0.68rem; background: #3b2d54; color: #f4c430; padding: 1px 5px; border-radius: 3px; margin-left: 4px; font-weight: bold; border: 1px solid #f4c43055;">${charObj.role}</span>`
    : '';
  const isShipperOrder = !!(state.currentOrder.isShipper || state.currentOrder.orderId === state.canvas?.motorbikeShipper?.orderId);
  const ms = state.canvas?.motorbikeShipper;
  const shipperTotal = state.currentOrder.shipperBatchTotal || (ms && ms.totalCount) || 1;
  const shipperIdx = state.currentOrder.shipperBatchIndex || Math.min(shipperTotal, ((ms && ms.servedCount) || 0) + 1);
  const shipperBadgeText = shipperTotal > 1 ? `🛵 HỎA TỐC (${shipperIdx}/${shipperTotal} ĐƠN)` : '🛵 HỎA TỐC';
  const shipperBadge = isShipperOrder
    ? `<span style="font-size: 0.68rem; background: #14532d; color: #86efac; padding: 1px 5px; border-radius: 3px; margin-left: 4px; font-weight: bold; border: 1px solid #22c55e;">${shipperBadgeText}</span>`
    : '';
  const orderBoxStyle = isVIPOrder
    ? 'border: 2px solid #f59e0b; box-shadow: 0 0 14px rgba(245, 158, 11, 0.45); background: linear-gradient(180deg, rgba(30, 20, 45, 0.95), rgba(20, 10, 30, 0.95));'
    : (isShipperOrder
      ? 'border: 1.5px solid #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);'
      : '');

  let negotiationHtml = '';
  const neg = state.currentOrder.negotiation;
  if (neg && neg.status === 'pending') {
    negotiationHtml = `
      <div style="background: rgba(241, 196, 15, 0.15); border: 1.5px solid #f1c40f; border-radius: 6px; padding: 6px 8px; margin: 4px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; font-weight: bold; color: #f1c40f; font-size: 0.8rem;">
          <span>💬 KHÁCH MẶC CẢ GIÁ!</span>
          <span style="color: #ff7675; font-size: 0.72rem;">Xin bớt -${(neg.discountAmount || 0).toLocaleString('vi-VN')}đ</span>
        </div>
        <div style="font-size: 0.82rem; color: #ffeaa7; margin: 3px 0; font-style: italic; background: rgba(0, 0, 0, 0.35); padding: 4px 6px; border-radius: 4px; border-left: 3px solid #f1c40f;">
          "${neg.line || 'Bớt cho mình tí xíu nhé quán ơi!'}"
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; background: #160c18; padding: 3px 6px; border-radius: 4px; margin: 3px 0; font-size: 0.8rem;">
          <span>Giá quán đặt: <s style="color: #a4b0be;">${state.currentOrder.price.toLocaleString('vi-VN')}đ</s></span>
          <span>Khách xin trả: <b style="color: #2ecc71; font-size: 0.88rem;">${Number(neg.requestedPrice).toLocaleString('vi-VN')}đ</b></span>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 5px;">
          <button id="btn-accept-haggle" style="flex: 1; background: #27ae60; color: #fff; border: none; border-radius: 4px; padding: 6px 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: 0.2s;" title="Đồng ý bán với giá khách đề nghị">
            ✅ Bớt Cho Khách (${Number(neg.requestedPrice).toLocaleString('vi-VN')}đ)
          </button>
          <button id="btn-refuse-haggle" style="flex: 1; background: #c0392b; color: #fff; border: none; border-radius: 4px; padding: 6px 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: 0.2s;" title="Từ chối bớt giá (khách có thể hủy đơn)">
            ❌ Từ Chối Bớt Giá
          </button>
        </div>
      </div>
    `;
  } else if (neg && neg.status === 'accepted') {
    negotiationHtml = `
      <div style="background: rgba(46, 204, 113, 0.15); border: 1px solid #2ecc71; border-radius: 4px; padding: 3px 6px; margin: 3px 0; font-size: 0.78rem; color: #2ecc71; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
        <span>🤝 Đã bớt giá theo thỏa thuận:</span>
        <b>${state.currentOrder.price.toLocaleString('vi-VN')}đ</b>
      </div>
    `;
  } else if (neg && neg.status === 'refused_stayed') {
    negotiationHtml = `
      <div style="background: rgba(241, 196, 15, 0.15); border: 1px solid #f1c40f; border-radius: 4px; padding: 3px 6px; margin: 3px 0; font-size: 0.78rem; color: #f1c40f; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
        <span>💪 Khách chấp nhận mua giá gốc:</span>
        <b>${state.currentOrder.price.toLocaleString('vi-VN')}đ</b>
      </div>
    `;
  }

  elOrderSection.innerHTML = `
    <div class="order-box" style="${orderBoxStyle}">
      <div class="order-header" style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
        <span style="min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">👤 <b>${state.currentOrder.customerName}</b>${vipBadge}${roleBadge}${shipperBadge}</span>
        <span style="color: #2e8b57; font-weight: bold; flex-shrink: 0;">+${state.currentOrder.price.toLocaleString('vi-VN')}đ</span>
      </div>
      <div id="order-dialogue" style="font-style: italic; color: #f1fa8c; font-size: 0.78rem; margin: 1px 0; background: #1c0e1a; border-left: 2.5px solid var(--gold); padding: 1px 6px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${(state.currentOrder.quote || '').replace(/"/g, '&quot;')}">
        💬 "${state.currentOrder.quote || 'Pha chế ngon giùm mình nhé!'}"
      </div>
      ${negotiationHtml}
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; flex-wrap: wrap;">
        <span style="font-weight: bold; font-size: 0.94rem; color: #8b4513;">🍹 ${state.currentOrder.recipeName}</span>
        <span style="background: #1c0e1a; border: 1px solid #50fa7b; padding: 1px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: bold; color: #50fa7b;">
          ${teaGuide.icon} Cốt: ${teaGuide.teaName}
        </span>
      </div>
      <div class="order-specs">
        <span class="spec-badge">Đường: <b>${state.currentOrder.sugar}</b></span>
        <span class="spec-badge">Đá: <b>${state.currentOrder.ice}</b></span>
        <span class="spec-badge">Topping: <b>${orderToppingNames}</b></span>
      </div>
      <div class="patience-timer-bg">
        <div id="order-timer-fill" class="patience-timer-fill"></div>
      </div>
    </div>
  `;

  // Attach negotiation button handlers
  const btnAccept = document.getElementById('btn-accept-haggle');
  if (btnAccept) {
    btnAccept.onclick = async () => {
      btnAccept.disabled = true;
      btnAccept.innerText = 'Đang xử lý...';
      try {
        const res = await window.API.negotiateOrder(state.currentOrder.orderId, true);
        if (res && res.success) {
          showToast(res.quote || '✅ Đã đồng ý bớt giá cho khách!', 4000);
          state.currentOrder.price = res.newPrice;
          if (state.currentOrder.negotiation) {
            state.currentOrder.negotiation.status = 'accepted';
          }
          if (state.canvas && state.canvas.floatingTexts) {
            state.canvas.floatingTexts.push({
              text: '🤝 Bớt giá!',
              x: 185,
              y: 75,
              alpha: 1.0,
              color: '#2ecc71'
            });
          }
          renderOrderTicket();
        } else {
          btnAccept.disabled = false;
          btnAccept.innerText = '✅ Bớt Cho Khách';
          showToast(res?.message || 'Có lỗi xảy ra', 3000);
        }
      } catch (err) {
        btnAccept.disabled = false;
        console.error(err);
      }
    };
  }

  const btnRefuse = document.getElementById('btn-refuse-haggle');
  if (btnRefuse) {
    btnRefuse.onclick = async () => {
      btnRefuse.disabled = true;
      btnRefuse.innerText = 'Đang xử lý...';
      try {
        const res = await window.API.negotiateOrder(state.currentOrder.orderId, false);
        if (res && res.success) {
          if (res.cancelled) {
            showToast(`❌ Khách hủy đơn! "${res.quote}"`, 5000);
            if (state.canvas && state.canvas.cancelCustomer) {
              state.canvas.cancelCustomer(res.quote);
            }
            if (state.orderTimerInterval) clearInterval(state.orderTimerInterval);
            if (state.orderQueue && state.orderQueue.length > 0) {
              state.orderQueue.shift();
            }
            if (state.canvas && state.canvas.advanceQueue) {
              state.canvas.advanceQueue();
            }
            startNextOrderInQueue();
          } else {
            showToast(`😅 Khách vẫn chịu mua! "${res.quote}"`, 4500);
            if (state.currentOrder.negotiation) {
              state.currentOrder.negotiation.status = 'refused_stayed';
            }
            if (state.canvas && state.canvas.floatingTexts) {
              state.canvas.floatingTexts.push({
                text: '✨ Vẫn mua!',
                x: 185,
                y: 75,
                alpha: 1.0,
                color: '#f1c40f'
              });
            }
            renderOrderTicket();
          }
        } else {
          btnRefuse.disabled = false;
          btnRefuse.innerText = '❌ Từ Chối';
          showToast(res?.message || 'Có lỗi xảy ra', 3000);
        }
      } catch (err) {
        btnRefuse.disabled = false;
        console.error(err);
      }
    };
  }
}

export function updateCupMonitor() {
  if (!elMixTea) elMixTea = document.getElementById('mix-tea-name');
  if (!elMixSugar) elMixSugar = document.getElementById('mix-sugar-val');
  if (!elMixIce) elMixIce = document.getElementById('mix-ice-val');
  if (!elMixTop) elMixTop = document.getElementById('mix-topping-val');

  const teaNames = {
    den: 'Trà Đen Đậm',
    thai_xanh: 'Thái Xanh',
    sua_tuoi: 'Sữa Tươi',
    lai: 'Lục Trà Lài',
    olong_nuong: 'Ô Long Nướng'
  };
  if (elMixTea) elMixTea.innerText = teaNames[state.selectedTea] || 'Trà';
  if (elMixSugar) elMixSugar.innerText = state.selectedSugar;
  if (elMixIce) elMixIce.innerText = state.selectedIce;
  if (elMixTop) elMixTop.innerText = `${state.selectedToppings.length} loại`;
}

export function updateMixingButtonsState() {
  const rawInv = state.storeState?.save?.inventory;
  let inv = {};
  try {
    inv = typeof rawInv === 'string' ? JSON.parse(rawInv) : (rawInv || {});
  } catch (e) {
    inv = {};
  }

  // Auto-switch selectedTea if current tea is out of stock
  const currentTeaInvKey = TEA_INV_MAP[state.selectedTea] || 'tra_den';
  const currentTeaStock = inv[currentTeaInvKey] !== undefined ? inv[currentTeaInvKey] : 0;
  if (currentTeaStock <= 0) {
    const availableTea = Object.keys(TEA_INV_MAP).find(k => (inv[TEA_INV_MAP[k]] !== undefined ? inv[TEA_INV_MAP[k]] : 0) > 0);
    if (availableTea && availableTea !== state.selectedTea) {
      state.selectedTea = availableTea;
      if (state.workstation) state.workstation.setTea(availableTea);
      if (state.canvas) state.canvas.setDrinkPreview({ tea: state.selectedTea, toppings: state.selectedToppings });
    }
  }

  // Auto-remove out-of-stock toppings from selectedToppings
  if (state.selectedToppings.length > 0) {
    const validToppings = state.selectedToppings.filter(t => (inv[t] !== undefined ? inv[t] : 0) > 0);
    if (validToppings.length !== state.selectedToppings.length) {
      state.selectedToppings = validToppings;
      if (state.workstation) state.workstation.initCupContents();
      if (state.canvas) state.canvas.setDrinkPreview({ tea: state.selectedTea, toppings: state.selectedToppings });
    }
  }

  // Sync active tea buttons & check inventory
  document.querySelectorAll('[data-tea]').forEach(b => {
    if (!b.dataset.baseText) b.dataset.baseText = b.innerText.trim();
    const teaKey = b.getAttribute('data-tea');
    const invKey = TEA_INV_MAP[teaKey];
    const stock = inv[invKey] !== undefined ? inv[invKey] : 0;
    const isOutOfStock = stock <= 0;

    b.classList.toggle('active', teaKey === state.selectedTea && !isOutOfStock);
    b.disabled = isOutOfStock;
    b.classList.toggle('out-of-stock', isOutOfStock);

    if (isOutOfStock) {
      b.innerText = `${b.dataset.baseText} (Hết)`;
      b.title = `❌ Hết nguyên liệu ${b.dataset.baseText}! Hãy vào Chợ Đầu Mối để mua thêm`;
    } else {
      b.innerText = `${b.dataset.baseText} (${stock})`;
      b.title = `Còn ${stock} phần trong kho`;
    }
  });

  // Sync active sugar buttons & pills
  document.querySelectorAll('[data-sugar]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-sugar') === state.selectedSugar);
  });
  const sugarBadge = document.getElementById('sugar-badge');
  if (sugarBadge) {
    sugarBadge.innerText = state.selectedSugar === '100%' ? '100% (Đầy)' : `${state.selectedSugar} Đường`;
  }
  const btnAddSugar = document.getElementById('btn-add-sugar');
  if (btnAddSugar) {
    const isMaxSugar = state.selectedSugar === '100%';
    btnAddSugar.classList.toggle('max-reached', isMaxSugar);
    btnAddSugar.title = isMaxSugar ? 'Đã đạt tối đa 100% đường' : 'Thêm muỗng đường vào bình lắc';
  }

  // Sync active ice buttons & pills
  document.querySelectorAll('[data-ice]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-ice') === state.selectedIce);
  });
  const iceBadge = document.getElementById('ice-badge');
  if (iceBadge) {
    iceBadge.innerText = state.selectedIce === 'Đầy đá' ? 'Đầy đá (Đầy)' : state.selectedIce;
  }
  const btnAddIce = document.getElementById('btn-add-ice');
  if (btnAddIce) {
    const isMaxIce = state.selectedIce === 'Đầy đá';
    btnAddIce.classList.toggle('max-reached', isMaxIce);
    btnAddIce.title = isMaxIce ? 'Đã đầy đá tối đa' : 'Dùng kẹp gắp thêm đá vào bình lắc';
  }

  // Sync active topping buttons & check inventory
  document.querySelectorAll('[data-topping]').forEach(b => {
    if (!b.dataset.baseText) b.dataset.baseText = b.innerText.trim();
    const topKey = b.getAttribute('data-topping');
    const stock = inv[topKey] !== undefined ? inv[topKey] : 0;
    const isOutOfStock = stock <= 0;

    b.classList.toggle('active', state.selectedToppings.includes(topKey) && !isOutOfStock);
    b.disabled = isOutOfStock;
    b.classList.toggle('out-of-stock', isOutOfStock);

    if (isOutOfStock) {
      b.innerText = `${b.dataset.baseText} (Hết)`;
      b.title = `❌ Hết nguyên liệu ${b.dataset.baseText}! Hãy vào Chợ Đầu Mối để mua thêm`;
    } else {
      b.innerText = `${b.dataset.baseText} (${stock})`;
      b.title = `Còn ${stock} phần trong kho`;
    }
  });

  updateCupMonitor();
}

// Workstation Initialization
export function initWorkstation() {
  const workstationCanvas = document.getElementById('workstation-canvas');
  if (workstationCanvas && typeof window.BaristaWorkstation !== 'undefined') {
    state.workstation = new window.BaristaWorkstation('workstation-canvas', (st) => {
      state.selectedTea = st.tea;
      state.selectedSugar = st.sugar;
      state.selectedIce = st.ice;
      state.selectedToppings = [...st.toppings];
      updateMixingButtonsState();
      if (state.canvas) {
        state.canvas.setDrinkPreview({ tea: state.selectedTea, toppings: state.selectedToppings });
      }
    });
  }
}

// Attach all workflow, button clicks & serve drink logic
export function initWorkflow() {
  elOrderSection = document.getElementById('order-content');
  elBtnShaker = document.getElementById('btn-shaker');
  elBtnPourCup = document.getElementById('btn-pour-cup');
  elBtnSealCup = document.getElementById('btn-seal-cup');
  elBtnServe = document.getElementById('btn-serve');

  elMixTea = document.getElementById('mix-tea-name');
  elMixSugar = document.getElementById('mix-sugar-val');
  elMixIce = document.getElementById('mix-ice-val');
  elMixTop = document.getElementById('mix-topping-val');

  // Step 1: Lắc Bình Pha Chế
  if (elBtnShaker) {
    elBtnShaker.addEventListener('click', () => {
      if (elBtnShaker.disabled) return;
      triggerHaptic(15);
      elBtnShaker.disabled = true;
      if (window.sound) window.sound.shake();
      if (state.canvas) state.canvas.setShaking(true);
      if (state.workstation) {
        state.workstation.triggerHandAction('shake');
      }
      const txt = elBtnShaker.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Lắc...';

      setTimeout(() => {
        if (state.canvas) state.canvas.setShaking(false);
        state.isShaken = true;
        updateWorkflowButtons();
      }, 1100);
    });
  }

  // Step 2: Rót Trà Sữa Vào Cốc
  if (elBtnPourCup) {
    elBtnPourCup.addEventListener('click', () => {
      if (elBtnPourCup.disabled) return;
      if (!state.isShaken) {
        showToast('Hãy bấm [1. Lắc Bình] trước!');
        return;
      }
      triggerHaptic(12);
      elBtnPourCup.disabled = true;
      if (window.sound) {
        window.sound.pour();
        // ASMR Torch Flame trigger if customer ordered Crème Brûlée drink
        const isBrulee = state.currentOrder?.recipeId === 'tra_sua_kem_kho_bong' || 
          (state.workstation && typeof state.workstation.isBruleeRecipe === 'function' && state.workstation.isBruleeRecipe());
        if (isBrulee && typeof window.sound.torchFlame === 'function') {
          setTimeout(() => window.sound.torchFlame(), 450);
        }
      }
      if (state.workstation) {
        state.workstation.triggerHandAction('pour_cup');
      }
      const txt = elBtnPourCup.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Rót...';

      setTimeout(() => {
        state.isPoured = true;
        if (state.workstation) state.workstation.setCupState('filled');
        updateWorkflowButtons();
      }, 1150);
    });
  }

  // Step 3: Dập Nắp Miệng Cốc
  if (elBtnSealCup) {
    elBtnSealCup.addEventListener('click', () => {
      if (elBtnSealCup.disabled) return;
      if (!state.isPoured) {
        showToast('Hãy bấm [2. Rót Cốc] trước!');
        return;
      }
      triggerHaptic(15);
      elBtnSealCup.disabled = true;
      if (window.sound) window.sound.seal();
      if (state.workstation) {
        state.workstation.triggerHandAction('seal_cup');
      }
      const txt = elBtnSealCup.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Dập...';

      setTimeout(() => {
        state.isSealed = true;
        if (state.workstation) state.workstation.setCupState('sealed');
        updateWorkflowButtons();
      }, 1100);
    });
  }

  // Step 4: Giao Ly (Serve Drink Action)
  if (elBtnServe) {
    elBtnServe.addEventListener('click', async () => {
      if (!state.currentOrder) return;
      triggerHaptic(18);
      if (!state.isShaken) {
        showToast('Hãy bấm [1. Lắc Bình] để trộn đều nguyên liệu!');
        return;
      }
      if (!state.isPoured) {
        showToast('Hãy bấm [2. Rót Cốc] để đổ trà sữa vào cốc!');
        return;
      }
      if (!state.isSealed) {
        showToast('Hãy bấm [3. Dập Nắp] để niêm phong ly trước khi giao!');
        return;
      }

      // Check topping match
      const requiredToppings = state.currentOrder.toppings || [];
      const normRequired = [...requiredToppings].sort().join(',');
      const normSelected = [...state.selectedToppings].sort().join(',');

      if (normRequired !== normSelected) {
        if (window.sound) window.sound.fail();
        elBtnServe.disabled = false;
        const reqNames = requiredToppings.length > 0 
          ? requiredToppings.map(t => TOPPING_LABELS[t] || t).join(' + ')
          : 'Không lấy topping';
        const curNames = state.selectedToppings.length > 0
          ? state.selectedToppings.map(t => TOPPING_LABELS[t] || t).join(' + ')
          : 'Không lấy topping';
        showToast(`⚠️ Topping chưa đúng! Khách gọi: [${reqNames}]. Bạn đang chọn: [${curNames}].`, 4000);
        return;
      }

      // Check tea match
      const expectedTea = RECIPE_TEA_MAP[state.currentOrder.recipeId]?.teaId || state.currentOrder.tea || 'den';
      if (state.selectedTea !== expectedTea) {
        if (window.sound) window.sound.fail();
        elBtnServe.disabled = false;
        const expectedInfo = RECIPE_TEA_MAP[state.currentOrder.recipeId] || { teaName: 'Trà Đen Đậm', btnLabel: 'Trà Đen Đậm', icon: '🍵' };
        const curTeaName = TEA_LABELS[state.selectedTea] || state.selectedTea;
        showToast(`⚠️ Cốt trà chưa đúng! Món [${state.currentOrder.recipeName}] yêu cầu [${expectedInfo.icon} ${expectedInfo.teaName}]. Bạn đang chọn [${curTeaName}]. Hãy bấm chọn lại ở kệ 1!`, 4500);
        return;
      }

      // Check stock
      const rawInv = state.storeState?.save?.inventory;
      let inv = {};
      try {
        inv = typeof rawInv === 'string' ? JSON.parse(rawInv) : (rawInv || {});
      } catch (e) {
        inv = {};
      }
      const teaInvKey = TEA_INV_MAP[state.selectedTea] || 'tra_den';
      if ((inv[teaInvKey] !== undefined ? inv[teaInvKey] : 0) <= 0) {
        if (window.sound) window.sound.fail();
        elBtnServe.disabled = false;
        showToast('❌ Cốt trà này đã hết trong kho! Vui lòng vào Chợ Đầu Mối để mua thêm!', 4000);
        return;
      }
      if ((inv['ly_nap'] !== undefined ? inv['ly_nap'] : 20) <= 0) {
        if (window.sound) window.sound.fail();
        elBtnServe.disabled = false;
        showToast('❌ Kho đã hết [Thùng Ly & Màng Dập Nắp]! Vui lòng vào Chợ Đầu Mối để mua thêm!', 4000);
        return;
      }
      for (const t of state.selectedToppings) {
        if ((inv[t] !== undefined ? inv[t] : 0) <= 0) {
          if (window.sound) window.sound.fail();
          elBtnServe.disabled = false;
          showToast(`❌ Topping [${TOPPING_LABELS[t] || t}] đã hết trong kho! Vui lòng vào Chợ Đầu Mối để mua thêm!`, 4000);
          return;
        }
      }

      elBtnServe.disabled = true;
      const timeTaken = Date.now() - state.orderStartTime;

      let chosenRecipeId = state.currentOrder?.recipeId || 'tra_sua_truyen_thong';
      if (state.selectedTea !== expectedTea) {
        if (state.selectedTea === 'den') chosenRecipeId = 'tra_sua_truyen_thong';
        else if (state.selectedTea === 'thai_xanh') chosenRecipeId = 'tra_thai_xanh';
        else if (state.selectedTea === 'sua_tuoi') chosenRecipeId = 'sua_tuoi_duong_den';
        else if (state.selectedTea === 'lai') chosenRecipeId = 'tra_dao_cam_sa';
        else if (state.selectedTea === 'olong_nuong') chosenRecipeId = 'tra_olong_nuong';
      }

      if (window.sound) window.sound.bell();

      try {
        // Local-first calculation & immediate response (0ms latency, zero server blocking)
      const save = state.storeState?.save || {};
      const customPrices = save.custom_prices || {};
      const recipesDb = state.storeState?.recipes_db || {};
      const recipeDef = recipesDb[chosenRecipeId] || { basePrice: 25000 };
      const rawPrice = customPrices[chosenRecipeId] ? Number(customPrices[chosenRecipeId]) : (recipeDef.basePrice || 25000);
      const toppingBonus = (state.selectedToppings || []).length * 7000;
      let calculatedPayout = rawPrice + toppingBonus;

      // Collab bonus check
      let collabBonusPercent = 0;
      if (state.canvas?.activeCollabs) {
        collabBonusPercent = Math.min(3, state.canvas.activeCollabs.length || 0) * 10;
        calculatedPayout += Math.round(rawPrice * (collabBonusPercent / 100));
      }

      // Deduct inventory ingredients locally
      let curInv = save.inventory;
      if (typeof curInv === 'string') {
        try { curInv = JSON.parse(curInv); } catch(e) { curInv = {}; }
      }
      if (curInv && typeof curInv === 'object') {
        const teaKey = TEA_INV_MAP[state.selectedTea] || 'tra_den';
        if (curInv[teaKey] !== undefined) curInv[teaKey] = Math.max(0, curInv[teaKey] - 1);
        if (curInv['ly_nap'] !== undefined) curInv['ly_nap'] = Math.max(0, curInv['ly_nap'] - 1);
        (state.selectedToppings || []).forEach(top => {
          if (curInv[top] !== undefined) curInv[top] = Math.max(0, curInv[top] - 1);
        });
      }

      const isVIPOrder = !!(state.currentOrder && state.currentOrder.isStoryVIP);
      if (isVIPOrder && state.currentOrder.vipTip) {
        calculatedPayout += Number(state.currentOrder.vipTip);
      }

      let newDebt = save.debt_remaining !== undefined ? save.debt_remaining : 3000000;
      if (isVIPOrder && state.currentOrder.debtRelief && save.chapter === 1 && newDebt > 0) {
        const relief = Math.min(newDebt, Number(state.currentOrder.debtRelief));
        newDebt = Math.max(0, newDebt - relief);
      }

      let newTeaCoin = save.teacoin || 0;
      if (isVIPOrder && state.currentOrder.vipTeaCoin) {
        newTeaCoin += Number(state.currentOrder.vipTeaCoin);
      }

      const newMoney = (Number(save.money) || 0) + calculatedPayout;
      const newRep = Math.min(5.0, (Number(save.reputation) || 4.0) + (isVIPOrder ? 0.05 : 0.02));

      patchLocalSave({
        money: newMoney,
        debt_remaining: newDebt,
        teacoin: newTeaCoin,
        reputation: newRep,
        inventory: curInv
      });

      if (state.storeState && state.storeState.daily_stats) {
        state.storeState.daily_stats.earned_today = (Number(state.storeState.daily_stats.earned_today) || 0) + calculatedPayout;
        state.storeState.daily_stats.orders_served = (Number(state.storeState.daily_stats.orders_served) || 0) + 1;
      }

      // Queue for background batch sync (zero API calls during active mixing!)
      queueServedOrder({
        orderId: state.currentOrder.orderId,
        timeTaken,
        recipeId: chosenRecipeId,
        sugar: state.selectedSugar,
        ice: state.selectedIce,
        toppings: state.selectedToppings,
        clientPayout: calculatedPayout,
        servedAt: Date.now()
      });

      if (window.sound) window.sound.coin();
      clearInterval(state.orderTimerInterval);
      if (state.canvas) state.canvas.triggerSuccessEffects(calculatedPayout);

      const collabExtra = collabBonusPercent > 0 
        ? ` (+${collabBonusPercent}% Collab)` 
        : '';

      if (state.workstation) {
        state.workstation.triggerHandAction('serve');
        state.workstation.addFloatingText(`✨ +${calculatedPayout.toLocaleString('vi-VN')}đ${collabExtra}!`, '#50fa7b');
      }

      const currentOrderObj = state.currentOrder;
      const isShipperOrder = !!(currentOrderObj && (currentOrderObj.isShipper || currentOrderObj.orderId === state.canvas?.motorbikeShipper?.orderId));
      const isAutoStaffActive = !!(state.activeStaff && !state.activeStaff.expired);

      state.orderQueue.shift();
      if (state.canvas && state.canvas.advanceQueue) {
        state.canvas.advanceQueue();
      }

      if (isVIPOrder) {
        if (window.sound && typeof window.sound.bell === 'function') window.sound.bell();
        const vipTip = Number(currentOrderObj.vipTip || 0);
        let vipSpeechToast = '';
        const custName = currentOrderObj.customerName || '';

        if (custName.includes('Bảnh')) {
          const relief = Math.min(save.debt_remaining || 0, Number(currentOrderObj.debtRelief || 100000));
          const debtNote = (save.chapter === 1 && relief > 0) ? ` Giảm ngay -${relief.toLocaleString('vi-VN')}đ tiền nợ!` : '';
          vipSpeechToast = `🕶️ Anh Bảnh: "Trà ngon đấy con bé! Đậm đà chuẩn chỉ. Tao boa thêm +${vipTip.toLocaleString('vi-VN')}đ!${debtNote}"`;
        } else if (custName.includes('Lão Ba')) {
          vipSpeechToast = `🦹‍♂️ Lão Ba: "Hừm... Vị trà này... sao lại thơm và trân châu lại mềm dẻo thế này?! Lần này ta chịu phục! +${vipTip.toLocaleString('vi-VN')}đ Tip"`;
        } else if (custName.includes('Gordon')) {
          vipSpeechToast = `🌟 Gordon R.: "Superb! Trà sữa đạt chuẩn nghệ thuật 5 sao Michelin! +${vipTip.toLocaleString('vi-VN')}đ Tip"`;
        } else if (custName.includes('Shark')) {
          vipSpeechToast = `🦈 Shark Hưng: "Xuất sắc! Tôi sẽ đẩy mạnh đầu tư mở chuỗi nhượng quyền! +${vipTip.toLocaleString('vi-VN')}đ Tip"`;
        } else {
          vipSpeechToast = `🌌 Sứ Giả Ngân Hà: "Vương triều trà sữa vũ trụ vạn tuế! +${vipTip.toLocaleString('vi-VN')}đ & +${currentOrderObj.vipTeaCoin || 10} TeaCoin!"`;
        }

        if (state.canvas && state.canvas.floatingTexts) {
          state.canvas.floatingTexts.push({
            text: `👑 VIP +${vipTip.toLocaleString('vi-VN')}đ!`,
            x: 185,
            y: 65,
            alpha: 1.0,
            color: '#f1c40f'
          });
        }
        showToast(vipSpeechToast, 4500);
      } else if (isShipperOrder) {
        const remainingShipperOrders = state.orderQueue.filter(o => o.isShipper).length;
        if (state.canvas && state.canvas.onShipperOrderServed) {
          state.canvas.onShipperOrderServed(currentOrderObj.orderId, remainingShipperOrders);
        }
        if (!isAutoStaffActive) {
          const ms = state.canvas?.motorbikeShipper;
          const totalCount = ms?.totalCount || 1;
          const servedCount = ms?.servedCount || 1;
          if (remainingShipperOrders > 0) {
            showToast(`📦 Đã giao đơn ${servedCount}/${totalCount} cho Shipper (còn ${remainingShipperOrders} đơn)! +${calculatedPayout.toLocaleString('vi-VN')}đ${collabExtra}`, 1900);
          } else if (totalCount > 1) {
            showToast(`🛵 Đã giao đủ ${servedCount}/${totalCount} đơn — Shipper đi giao hàng! +${calculatedPayout.toLocaleString('vi-VN')}đ${collabExtra}`, 2200);
          } else {
            showToast(`📦 Đã giao đơn — Shipper đi giao hàng! +${calculatedPayout.toLocaleString('vi-VN')}đ${collabExtra}`, 1800);
          }
        }
      } else if (!isAutoStaffActive) {
        showToast(`🎉 Giao thành công! +${calculatedPayout.toLocaleString('vi-VN')}đ${collabExtra}`, 1800);
      }

      updateUI();

      state.currentOrder = null;
      state.isShaken = false;
      state.isPoured = false;
      state.isSealed = false;
          if (state.workstation) {
            state.workstation.resetCup(false);
          } else {
            state.selectedTea = 'den';
            state.selectedSugar = '50%';
            state.selectedIce = 'Vừa đá';
            state.selectedToppings = [];
          }
          updateMixingButtonsState();
          renderOrderTicket();
          updateWorkflowButtons();

          setTimeout(() => {
            if (state.orderQueue.length > 0) {
              startNextOrderInQueue();
            } else {
              const save = state.storeState ? (state.storeState.save || state.storeState) : {};
              const buffs = save.active_buffs || {};
              const isViral = buffs.tiktoker_status === 'viral';
              const isBigCampaign = isViral && (buffs.tiktoker_cost || 0) >= 1000000;
              const nextDelay = isBigCampaign ? 1200 : (isViral ? 2000 : 3000);
              scheduleNextOrder(nextDelay);
            }
          }, 1200);
      } catch (err) {
        console.error('Serve order error:', err);
        elBtnServe.disabled = false;
      }
    });
  }

  // Step-by-step Sugar (+1 level per drop, max 100%)
  const btnAddSugar = document.getElementById('btn-add-sugar');
  if (btnAddSugar) {
    btnAddSugar.addEventListener('click', () => {
      const steps = ['0%', '30%', '50%', '70%', '100%'];
      const idx = steps.indexOf(state.selectedSugar);
      if (idx >= steps.length - 1 || state.selectedSugar === '100%') {
        showToast('⚠️ Độ ngọt đã đạt mức tối đa (100%)!');
        return;
      }
      if (window.sound) {
        if (typeof window.sound.syrupPump === 'function') window.sound.syrupPump();
        else window.sound.pour();
      }
      if (state.workstation) {
        state.selectedSugar = state.workstation.nextSugarStep();
      } else {
        state.selectedSugar = steps[idx + 1];
      }
      updateMixingButtonsState();
    });
  }

  // Step-by-step Ice (+1 level per scoop/cube, max Đầy đá)
  const btnAddIce = document.getElementById('btn-add-ice');
  if (btnAddIce) {
    btnAddIce.addEventListener('click', () => {
      const steps = ['Nóng', 'Ít đá', 'Vừa đá', 'Đầy đá'];
      const idx = steps.indexOf(state.selectedIce);
      if (idx >= steps.length - 1 || state.selectedIce === 'Đầy đá') {
        showToast('⚠️ Lượng đá đã đạt mức tối đa (Đầy đá)!');
        return;
      }
      if (window.sound) window.sound.ice();
      if (state.workstation) {
        state.selectedIce = state.workstation.nextIceStep();
      } else {
        state.selectedIce = steps[idx + 1];
      }
      updateMixingButtonsState();
    });
  }

  // Quick Reset Cup Button
  const btnResetCup = document.getElementById('btn-reset-cup');
  if (btnResetCup) {
    btnResetCup.addEventListener('click', () => {
      if (window.sound) window.sound.bell();
      if (state.workstation) {
        state.workstation.resetCup(true);
      } else {
        state.selectedTea = 'den';
        state.selectedSugar = '0%';
        state.selectedIce = 'Nóng';
        state.selectedToppings = [];
      }
      state.isShaken = false;
      state.isPoured = false;
      state.isSealed = false;
      updateWorkflowButtons();
      updateMixingButtonsState();
      if (state.canvas) state.canvas.setDrinkPreview({ tea: state.selectedTea, toppings: state.selectedToppings });
    });
  }

  // Tea Selection Buttons
  document.querySelectorAll('[data-tea]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled || btn.classList.contains('out-of-stock')) {
        if (window.sound && window.sound.fail) window.sound.fail();
        showToast('❌ Cốt trà này đã hết trong kho! Vui lòng vào Chợ Đầu Mối để nhập thêm!', 3500);
        return;
      }
      const teaKey = btn.getAttribute('data-tea');
      triggerHaptic(10);
      if (window.sound) window.sound.pour();
      state.selectedTea = teaKey;
      if (state.workstation) {
        state.workstation.setTea(teaKey);
      }
      updateMixingButtonsState();
      if (state.canvas) state.canvas.setDrinkPreview({ tea: state.selectedTea, toppings: state.selectedToppings });
    });
  });

  // Direct Sugar Selection Buttons & Pills
  document.querySelectorAll('[data-sugar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-sugar');
      triggerHaptic(8);
      if (window.sound) window.sound.pour();
      state.selectedSugar = val;
      if (state.workstation) {
        state.workstation.setSugar(val);
      }
      updateMixingButtonsState();
    });
  });

  // Direct Ice Selection Buttons & Pills
  document.querySelectorAll('[data-ice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-ice');
      triggerHaptic(8);
      if (window.sound) window.sound.ice();
      state.selectedIce = val;
      if (state.workstation) {
        state.workstation.setIce(val);
      }
      updateMixingButtonsState();
    });
  });

  // Topping Toggles
  document.querySelectorAll('[data-topping]').forEach(btn => {
    btn.addEventListener('click', () => {
      const top = btn.getAttribute('data-topping');
      if (btn.disabled || btn.classList.contains('out-of-stock')) {
        if (state.selectedToppings.includes(top)) {
          triggerHaptic(8);
          state.selectedToppings = state.selectedToppings.filter(t => t !== top);
          if (state.workstation) state.workstation.toggleTopping(top);
          updateMixingButtonsState();
          if (state.canvas) state.canvas.setDrinkPreview({ tea: state.selectedTea, toppings: state.selectedToppings });
          return;
        }
        if (window.sound && window.sound.fail) window.sound.fail();
        showToast('❌ Topping này đã hết trong kho! Vui lòng vào Chợ Đầu Mối để nhập thêm!', 3500);
        return;
      }
      triggerHaptic(10);
      if (window.sound) window.sound.pour();
      if (state.workstation) {
        state.workstation.toggleTopping(top);
      } else {
        if (state.selectedToppings.includes(top)) {
          state.selectedToppings = state.selectedToppings.filter(t => t !== top);
        } else {
          state.selectedToppings.push(top);
        }
      }
      updateMixingButtonsState();
      if (state.canvas) state.canvas.setDrinkPreview({ tea: state.selectedTea, toppings: state.selectedToppings });
    });
  });
}

