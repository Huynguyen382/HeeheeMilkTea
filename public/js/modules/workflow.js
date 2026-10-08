// 4-Step Barista Workflow & Mixing System
import { state, TOPPING_LABELS, TEA_LABELS, RECIPE_TEA_MAP, TEA_INV_MAP } from './state.js';
import { showToast } from './toast.js';
import { updateUI } from './ui.js';
import { scheduleNextOrder, startNextOrderInQueue, handleOrderTimeout } from './order-manager.js';
import { showJailModal } from './modals.js';

let elOrderSection = null;
let elBtnShaker = null;
let elBtnPourCup = null;
let elBtnSealCup = null;
let elBtnServe = null;

let elMixTea = null;
let elMixSugar = null;
let elMixIce = null;
let elMixTop = null;

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
    : 'Không lấy topping';

  const teaGuide = RECIPE_TEA_MAP[state.currentOrder.recipeId] || {
    teaId: state.currentOrder.tea || 'den',
    teaName: state.currentOrder.tea === 'thai_xanh' ? 'Thái Xanh' : (state.currentOrder.tea === 'sua_tuoi' ? 'Sữa Tươi' : (state.currentOrder.tea === 'lai' ? 'Lục Trà Lài' : (state.currentOrder.tea === 'olong_nuong' ? 'Ô Long Nướng' : 'Trà Đen Đậm'))),
    icon: '🍵',
    btnLabel: 'Trà'
  };

  const charObj = (typeof window.getCharacter === 'function')
    ? window.getCharacter(state.currentOrder.customerName || state.currentOrder.customerType)
    : null;
  const roleBadge = charObj && charObj.role
    ? `<span style="font-size: 0.72rem; background: #3b2d54; color: #f4c430; padding: 2px 7px; border-radius: 4px; margin-left: 6px; font-weight: bold; border: 1px solid #f4c43055; letter-spacing: 0.5px;">${charObj.role}</span>`
    : '';
  const isShipperOrder = !!(state.currentOrder.isShipper || state.currentOrder.orderId === state.canvas?.motorbikeShipper?.orderId);
  const shipperBadge = isShipperOrder
    ? `<span style="font-size: 0.72rem; background: #14532d; color: #86efac; padding: 2px 7px; border-radius: 4px; margin-left: 6px; font-weight: bold; border: 1px solid #22c55e; letter-spacing: 0.5px;">🛵 ĐƠN GIAO HÀNG HỎA TỐC</span>`
    : '';
  const orderBoxStyle = isShipperOrder
    ? 'border: 2px solid #22c55e; box-shadow: 0 0 12px rgba(34, 197, 94, 0.35);'
    : '';

  const neg = state.currentOrder.negotiation;
  let negotiationHtml = '';
  if (neg && neg.status === 'pending') {
    negotiationHtml = `
      <div id="negotiation-card" style="margin: 6px 0; background: linear-gradient(135deg, rgba(45, 20, 30, 0.95), rgba(30, 15, 25, 0.95)); border: 1.5px solid #ff79c6; border-radius: 6px; padding: 7px 9px; box-shadow: 0 2px 8px rgba(255, 121, 198, 0.25);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.82rem; font-weight: bold; color: #ff79c6;">💬 KHÁCH MẶC CẢ GIÁ!</span>
          <span style="font-size: 0.72rem; background: #e74c3c33; color: #ff7675; border: 1px solid #e74c3c; border-radius: 4px; padding: 1px 5px; font-weight: bold;">
            ${neg.isHighPriceHaggle ? 'Giá đặt cao' : 'Khách xin bớt'}
          </span>
        </div>
        <div style="font-size: 0.88rem; color: #ffeaa7; margin: 4px 0; font-style: italic; background: rgba(0, 0, 0, 0.35); padding: 5px 7px; border-radius: 4px; border-left: 3px solid #f1c40f;">
          "${neg.line}"
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; background: #160c18; padding: 3px 6px; border-radius: 4px; margin: 4px 0; font-size: 0.82rem;">
          <span>Giá quán đặt: <s style="color: #a4b0be;">${state.currentOrder.price.toLocaleString('vi-VN')}đ</s></span>
          <span>Khách xin trả: <b style="color: #2ecc71; font-size: 0.95rem;">${Number(neg.requestedPrice).toLocaleString('vi-VN')}đ</b></span>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 6px;">
          <button id="btn-accept-haggle" style="flex: 1; background: #27ae60; color: #fff; border: none; border-radius: 4px; padding: 6px 4px; font-size: 0.82rem; font-weight: bold; cursor: pointer; transition: 0.2s;" title="Đồng ý bán với giá khách đề nghị">
            ✅ Bớt Cho Khách (${Number(neg.requestedPrice).toLocaleString('vi-VN')}đ)
          </button>
          <button id="btn-refuse-haggle" style="flex: 1; background: #c0392b; color: #fff; border: none; border-radius: 4px; padding: 6px 4px; font-size: 0.82rem; font-weight: bold; cursor: pointer; transition: 0.2s;" title="Từ chối: 70% khách hủy đơn, 30% khách vẫn mua">
            ❌ Từ Chối (70% Hủy)
          </button>
        </div>
      </div>
    `;
  } else if (neg && neg.status === 'accepted') {
    negotiationHtml = `
      <div style="background: rgba(46, 204, 113, 0.15); border: 1px solid #2ecc71; border-radius: 4px; padding: 3px 6px; margin: 4px 0; font-size: 0.8rem; color: #2ecc71; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
        <span>🤝 Đã bớt giá theo thỏa thuận:</span>
        <b>${state.currentOrder.price.toLocaleString('vi-VN')}đ</b>
      </div>
    `;
  } else if (neg && neg.status === 'refused_stayed') {
    negotiationHtml = `
      <div style="background: rgba(241, 196, 15, 0.15); border: 1px solid #f1c40f; border-radius: 4px; padding: 3px 6px; margin: 4px 0; font-size: 0.8rem; color: #f1c40f; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
        <span>💪 Khách chấp nhận mua giá gốc:</span>
        <b>${state.currentOrder.price.toLocaleString('vi-VN')}đ</b>
      </div>
    `;
  }

  elOrderSection.innerHTML = `
    <div class="order-box" style="${orderBoxStyle}">
      <div class="order-header" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
        <span>👤 <b>${state.currentOrder.customerName}</b>${roleBadge}${shipperBadge}</span>
        <span style="color: #2e8b57; font-weight: bold;">+${state.currentOrder.price.toLocaleString('vi-VN')}đ</span>
      </div>
      <div style="font-style: italic; color: #ffffff; font-weight: 500; font-size: 0.95rem; margin: 3px 0 6px 0; background: #1c0e1a; border: 1px solid #57334d; border-left: 3px solid var(--gold); padding: 5px 8px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
        💬 "${state.currentOrder.quote || 'Pha chế ngon giùm mình nhé!'}"
      </div>
      ${negotiationHtml}
      <div style="font-weight: bold; font-size: 1.15rem; color: #8b4513;">
        🍹 ${state.currentOrder.recipeName}
      </div>
      <div style="background: rgba(80, 250, 123, 0.12); border: 1px dashed #50fa7b; border-radius: 6px; padding: 4px 8px; margin: 4px 0 6px 0; font-size: 0.88rem; display: flex; align-items: center; justify-content: space-between;">
        <span style="color: #ffb86c; font-weight: bold;">🍵 Cốt Trà Cần Chọn:</span>
        <span style="background: #1c0e1a; border: 1px solid #50fa7b; padding: 2px 7px; border-radius: 4px; font-weight: bold; color: #50fa7b;">
          ${teaGuide.icon} ${teaGuide.teaName}
        </span>
      </div>
      <div class="order-specs">
        <span class="spec-badge">Đường: <b>${state.currentOrder.sugar}</b></span>
        <span class="spec-badge">Đá: <b>${state.currentOrder.ice}</b></span>
        <span class="spec-badge" style="grid-column: 1 / -1; text-align: left;">Topping: <b>${orderToppingNames}</b></span>
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
          if (state.canvas) {
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
            // Advance to next order in queue
            const orderMgr = await import('./order-manager.js');
            if (state.orderQueue && state.orderQueue.length > 0) {
              state.orderQueue.shift();
            }
            orderMgr.startNextOrderInQueue();
          } else {
            showToast(`😅 Khách vẫn chịu mua! "${res.quote}"`, 4500);
            if (state.currentOrder.negotiation) {
              state.currentOrder.negotiation.status = 'refused_stayed';
            }
            if (state.canvas) {
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
      elBtnShaker.disabled = true;
      if (window.sound) window.sound.shake();
      if (state.canvas) state.canvas.setShaking(true);
      if (state.workstation) {
        state.workstation.triggerHandAction('shake');
        state.workstation.addFloatingText('🍸 LẮC ĐỀU BÌNH PHA CHẾ! ✨', '#bd93f9');
      }
      const txt = elBtnShaker.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Lắc...';

      setTimeout(() => {
        if (state.canvas) state.canvas.setShaking(false);
        state.isShaken = true;
        updateWorkflowButtons();
        showToast('✨ Đã lắc đều! Hãy bấm [2. Rót Cốc] để đổ vào ly.', 2400);
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
      elBtnPourCup.disabled = true;
      if (window.sound) window.sound.pour();
      if (state.workstation) {
        state.workstation.triggerHandAction('pour_cup');
        state.workstation.addFloatingText('🧋 RÓT TRÀ SỮA VÀO CỐC! ✨', '#f4c430');
      }
      const txt = elBtnPourCup.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Rót...';

      setTimeout(() => {
        state.isPoured = true;
        if (state.workstation) state.workstation.setCupState('filled');
        updateWorkflowButtons();
        showToast('✨ Đã rót đầy ly! Hãy bấm [3. Dập Nắp] để niêm phong miệng cốc.', 2500);
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
      elBtnSealCup.disabled = true;
      if (window.sound) window.sound.seal();
      if (state.workstation) {
        state.workstation.triggerHandAction('seal_cup');
        state.workstation.addFloatingText('🖲️ DẬP NẮP NIÊM PHONG! 🔒', '#50fa7b');
      }
      const txt = elBtnSealCup.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Dập...';

      setTimeout(() => {
        state.isSealed = true;
        if (state.workstation) state.workstation.setCupState('sealed');
        updateWorkflowButtons();
        showToast('🎉 Đã dập nắp hoàn chỉnh! Bấm [GIAO LY (SERVE)] cho khách nào!', 2600);
      }, 1100);
    });
  }

  // Step 4: Giao Ly (Serve Drink Action)
  if (elBtnServe) {
    elBtnServe.addEventListener('click', async () => {
      if (!state.currentOrder) return;
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

      let chosenRecipeId = 'tra_sua_truyen_thong';
      if (state.selectedTea === 'den') {
        if (state.currentOrder && state.currentOrder.recipeId === 'hong_tra_tac') {
          chosenRecipeId = 'hong_tra_tac';
        } else {
          chosenRecipeId = 'tra_sua_truyen_thong';
        }
      } else if (state.selectedTea === 'thai_xanh') chosenRecipeId = 'tra_thai_xanh';
      else if (state.selectedTea === 'sua_tuoi') chosenRecipeId = 'sua_tuoi_duong_den';
      else if (state.selectedTea === 'lai') chosenRecipeId = 'tra_dao_cam_sa';
      else if (state.selectedTea === 'olong_nuong') chosenRecipeId = 'tra_olong_nuong';

      if (window.sound) window.sound.bell();

      try {
        const res = await window.API.serveOrder(
          state.currentOrder.orderId,
          timeTaken,
          chosenRecipeId,
          state.selectedSugar,
          state.selectedIce,
          state.selectedToppings,
          state.totalWavePausedTime
        );

        if (res && res.isJailed) {
          showJailModal(res.jailReason);
          return;
        }

        if (res && res.success) {
          if (window.sound) window.sound.coin();
          clearInterval(state.orderTimerInterval);
          if (state.canvas) state.canvas.triggerSuccessEffects(res.payout);

          const collabExtra = res.collabBonus > 0 
            ? ` (+${res.collabBonusPercent}% Collab: ${res.activeCollabs} quán)` 
            : '';

          if (state.workstation) {
            state.workstation.triggerHandAction('serve');
            state.workstation.addFloatingText(`✨ +${res.payout.toLocaleString('vi-VN')}đ${collabExtra}!`, '#50fa7b');
          }

          const currentOrderObj = state.currentOrder;
          const isShipperOrder = !!(currentOrderObj && (currentOrderObj.isShipper || currentOrderObj.orderId === state.canvas?.motorbikeShipper?.orderId));

          if (isShipperOrder) {
            if (state.canvas && state.canvas.onShipperOrderServed) {
              state.canvas.onShipperOrderServed(currentOrderObj.orderId);
            }
            showToast(`📦 Đã giao trà sữa cho anh Shipper mang đi giao hỏa tốc! +${res.payout.toLocaleString('vi-VN')}đ${collabExtra}`, 4000);
          } else {
            showToast(`🎉 Giao thành công! Nhận +${res.payout.toLocaleString('vi-VN')}đ${collabExtra}`);
          }

          if (res.tiktokerViral) {
            setTimeout(() => {
              showToast(`🔥 VIDEO TIKTOK CỦA TÚ VIRAL TRIỆU VIEW! Lượng khách kéo đến nườm nượp!`, 6000);
            }, 800);
          }

          if (res.tiktokerGoalReached) {
            setTimeout(() => {
              if (window.sound) window.sound.coin();
              showToast(res.message || `🎉 CHÚC MỪNG! Quán đã đạt doanh thu gấp 3 LẦN vốn từ chiến dịch TikToker!`, 7000);
            }, 1200);
          }

          state.storeState = await window.API.getState();
          updateUI();

          state.orderQueue.shift();
          if (state.canvas && state.canvas.advanceQueue) {
            state.canvas.advanceQueue();
          }
          state.currentOrder = null;
          state.isShaken = false;
          state.isPoured = false;
          state.isSealed = false;
          if (state.workstation) {
            state.workstation.resetCup();
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
        } else {
          if (res && res.message) {
            showToast(`❌ ${res.message}`, 4000);
          }
          state.isShaken = false;
          state.isPoured = false;
          state.isSealed = false;
          if (state.workstation) state.workstation.resetCupState();
          updateWorkflowButtons();
          handleOrderTimeout();
        }
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
      if (window.sound) window.sound.pour();
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
        state.workstation.resetCup();
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

