// Customer Wave & Order Management System
import { state } from './state.js';
import { showToast } from './toast.js';
import { updateUI, updateBuffsUI } from './ui.js';
import { renderOrderTicket, updateWorkflowButtons } from './workflow.js';
import { startRestCountdown } from './rest.js';
import { checkThiefEncounter, showSnackModal } from './events.js';
import { patchLocalSave } from './save-sync.js';

/**
 * Generate a local customer wave (Client-Authoritative)
 * Zero network requests, 0ms latency, runs at 60 FPS.
 */
export function generateLocalCustomerWave(options = {}) {
  const save = state.storeState ? (state.storeState.save || state.storeState) : {};
  const buffs = save.active_buffs || {};
  const chapter = Number(save.chapter || 1);
  const recipesDb = state.storeState?.recipes_db || {};
  
  let unlockedKeys = Array.isArray(save.recipes) ? save.recipes : ['tra_sua_truyen_thong'];
  unlockedKeys = unlockedKeys.filter(k => recipesDb[k]);
  if (unlockedKeys.length === 0) unlockedKeys = ['tra_sua_truyen_thong'];

  let waveSize = 1;
  const randWave = Math.random();
  if (options.isShipper) {
    waveSize = randWave < 0.35 ? 1 : (randWave < 0.70 ? 2 : 3);
  } else if (buffs.idol_viral) {
    waveSize = Math.floor(Math.random() * 4) + 6;
  } else if (chapter >= 3) {
    waveSize = Math.floor(Math.random() * 4) + 4;
  } else if (chapter >= 2) {
    waveSize = Math.floor(Math.random() * 3) + 2;
  } else {
    waveSize = randWave < 0.4 ? 1 : (randWave < 0.8 ? 2 : 3);
  }

  const customersList = (window.CUSTOMERS_LIST && window.CUSTOMERS_LIST.length > 0)
    ? window.CUSTOMERS_LIST
    : [
        { id: 1, type: 1, name: 'Học Sinh Bách Khoa', dialogues: ['Cho mình 1 ly trà sữa nhiều trân châu nhé!'], fav: ['tra_sua_truyen_thong'] },
        { id: 2, type: 2, name: 'Cô Mai Công Sở', dialogues: ['Làm cho cô 1 ly trà hoa lài ít ngọt nhé!'], fav: ['luc_tra_lai_suong_sao'] }
      ];

  const sugars = ['0%', '30%', '50%', '70%', '100%'];
  const ices = ['Nóng', 'Ít đá', 'Vừa đá', 'Đầy đá'];
  const toppingPool = ['tranchau_den', 'thach_la_dua', 'tranchau_duongden', 'dao_mieng', 'suong_sao'];

  const orders = [];
  for (let i = 0; i < waveSize; i++) {
    let cust = customersList[Math.floor(Math.random() * customersList.length)];
    if (options.isShipper) {
      const shipper = customersList.find(c => c.isShipper);
      if (shipper) cust = shipper;
      else cust = { id: 23, type: 23, name: 'Huy Shipper Bất Bại', isShipper: true, dialogues: ['Đơn app hỏa tốc nè chị ơi!'] };
    }

    const recipeId = unlockedKeys[Math.floor(Math.random() * unlockedKeys.length)];
    const recipe = recipesDb[recipeId] || { name: 'Trà Sữa Truyền Thống', basePrice: 25000, tea: 'den' };
    const sugar = sugars[Math.floor(Math.random() * sugars.length)];
    const ice = ices[Math.floor(Math.random() * ices.length)];

    const numTops = Math.random() < 0.45 ? 1 : (Math.random() < 0.75 ? 2 : 0);
    const shuffledTops = [...toppingPool].sort(() => 0.5 - Math.random());
    const orderToppings = shuffledTops.slice(0, numTops);

    const customPrices = save.custom_prices || {};
    let price = customPrices[recipeId] ? Number(customPrices[recipeId]) : (recipe.basePrice || 25000);
    if (orderToppings.length > 0) price += orderToppings.length * 7000;

    const dialogues = cust.dialogues || ['Cho mình 1 ly nha quán ơi!'];
    const quote = dialogues[Math.floor(Math.random() * dialogues.length)];

    orders.push({
      orderId: 'ORD-L' + Math.random().toString(36).substring(2, 8),
      customerType: cust.type || 1,
      customerName: cust.name || 'Khách Hàng',
      quote,
      isTiktoker: !!cust.isTiktoker,
      isShipper: !!cust.isShipper || !!options.isShipper,
      recipeId,
      recipeName: recipe.name,
      tea: recipe.tea || 'den',
      recipeDesc: recipe.desc || '',
      sugar,
      ice,
      toppings: orderToppings,
      price,
      originalPrice: price,
      patienceMs: 40000,
      expiresAt: Date.now() + 180000
    });
  }

  return orders;
}

export async function scheduleNextOrder(delay = 4000) {
  if (state.nextOrderTimeout) clearTimeout(state.nextOrderTimeout);
  if (state.isGamePaused) return;

  state.nextOrderTimeout = setTimeout(async () => {
    if (state.isGamePaused) return;
    if (state.currentOrder || (state.orderQueue && state.orderQueue.length > 0)) return;

    const save = state.storeState ? (state.storeState.save || state.storeState) : {};
    const now = Date.now();

    // Check rest condition locally
    if (save.rest_until_ts && now < save.rest_until_ts) {
      const isEndShift = save.active_buffs?.rest_reason === 'end_shift';
      startRestCountdown(save.rest_until_ts, isEndShift ? 'end_shift' : 'snack_sick');
      return;
    }

    // Local wave generation (zero network roundtrips)
    let generatedOrders = [];
    if (state.storeState && (state.storeState.recipes_db || state.storeState.save)) {
      generatedOrders = generateLocalCustomerWave();
    }

    // Fallback to server API if local store state not yet ready
    if (!generatedOrders || generatedOrders.length === 0) {
      const res = await window.API.getOrder();
      if (res && res.order && res.order.orders) {
        generatedOrders = res.order.orders;
      }
    }

    if (generatedOrders.length > 0) {
      state.totalWavePausedTime = 0;
      const pendingQueue = state.orderQueue.filter(o => o.orderId !== (state.currentOrder && state.currentOrder.orderId));
      state.orderQueue = [...pendingQueue, ...generatedOrders].slice(0, 14);

      const shipperOrders = state.orderQueue.filter(o => o.isShipper);
      if (shipperOrders.length > 0 && state.canvas) {
        const alreadyServed = state.canvas.motorbikeShipper?.active ? (state.canvas.motorbikeShipper.servedCount || 0) : 0;
        const batchTotal = alreadyServed + shipperOrders.length;
        shipperOrders.forEach((o, idx) => {
          o.shipperBatchIndex = alreadyServed + idx + 1;
          o.shipperBatchTotal = batchTotal;
        });
        if (!state.canvas.motorbikeShipper?.active) {
          state.canvas.spawnMotorbikeShipper(shipperOrders[0].orderId, shipperOrders.length);
        } else {
          state.canvas.motorbikeShipper.totalCount = batchTotal;
          state.canvas.motorbikeShipper.needsOrderFetch = false;
        }
      }

      if (state.canvas && state.canvas.setCustomerQueue) {
        state.canvas.setCustomerQueue(state.orderQueue);
      }
      if (!state.currentOrder) {
        startNextOrderInQueue();
      }
    } else {
      scheduleNextOrder(4000);
    }
  }, delay);
}

export function startNextOrderInQueue() {
  if (!state.orderQueue || state.orderQueue.length === 0) {
    state.currentOrder = null;
    renderOrderTicket();
    updateUI();
    const save = state.storeState ? (state.storeState.save || state.storeState) : {};
    const buffs = save.active_buffs || {};
    const isViral = buffs.tiktoker_status === 'viral';
    const isBigCampaign = isViral && (buffs.tiktoker_cost || 0) >= 1000000;
    scheduleNextOrder(isBigCampaign ? 1200 : (isViral ? 2000 : 3000));
    return;
  }

  state.currentOrder = state.orderQueue[0];
  state.orderStartTime = Date.now();
  if (window.sound) window.sound.bell();

  // Reset workflow state for new drink
  state.isShaken = false;
  state.isPoured = false;
  state.isSealed = false;
  if (state.workstation) state.workstation.resetCupState();
  updateWorkflowButtons();

  renderOrderTicket();
  updateUI();
  checkThiefEncounter();

  // Patience countdown (base 40s + patience buffs)
  let duration = state.currentOrder.patienceMs || 40000;
  const interval = 100;
  let elapsed = 0;

  if (state.orderTimerInterval) clearInterval(state.orderTimerInterval);
  state.orderTimerInterval = setInterval(() => {
    const timerFill = document.getElementById('order-timer-fill');
    if (state.isGamePaused) {
      if (timerFill) timerFill.style.opacity = '0.5';
      return;
    }
    if (timerFill && timerFill.style.opacity === '0.5') {
      timerFill.style.opacity = '1';
    }

    elapsed += interval;
    const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
    if (timerFill) {
      timerFill.style.width = remainingPct + '%';
      if (remainingPct < 25) {
        timerFill.style.backgroundColor = '#d9383a';
      } else if (remainingPct < 55) {
        timerFill.style.backgroundColor = '#f4c430';
      } else {
        timerFill.style.backgroundColor = '#50fa7b';
      }
    }

    if (elapsed >= duration) {
      clearInterval(state.orderTimerInterval);
      handleOrderTimeout();
    }
  }, interval);
}

export async function handleOrderTimeout() {
  if (window.sound) window.sound.fail();
  if (state.canvas) state.canvas.triggerFailEffects();
  const failedCust = state.currentOrder;
  const isTiktoker = failedCust ? !!failedCust.isTiktoker : false;
  const isShipperOrder = !!(failedCust && (failedCust.isShipper || failedCust.orderId === state.canvas?.motorbikeShipper?.orderId));

  state.orderQueue.shift();
  if (state.canvas && state.canvas.advanceQueue) {
    state.canvas.advanceQueue();
  }

  const remainingShipperOrders = state.orderQueue.filter(o => o.isShipper).length;
  if (isShipperOrder && state.canvas && state.canvas.onShipperOrderFailed) {
    state.canvas.onShipperOrderFailed(failedCust.orderId, remainingShipperOrders);
  }

  showToast(`❌ Khách hàng [${failedCust ? failedCust.customerName : 'Khách'}] sốt ruột bỏ đi vì đợi quá lâu!`);

  if (failedCust) {
    const failRes = await window.API.reportOrderFail(failedCust.orderId, isTiktoker);
    if (failRes && failRes.tiktokerFlop) {
      showToast(failRes.message, 6000);
      if (state.storeState && state.storeState.save) {
        const curBuffs = state.storeState.save.active_buffs || {};
        curBuffs.tiktoker_status = 'flop';
        curBuffs.tiktoker_waves = 5;
        patchLocalSave({
          reputation: failRes.reputation !== undefined ? failRes.reputation : state.storeState.save.reputation,
          active_buffs: curBuffs
        });
      }
      updateUI();
    }
  }

  state.currentOrder = null;
  state.isShaken = false;
  state.isPoured = false;
  state.isSealed = false;
  if (state.workstation) state.workstation.resetCupState();
  renderOrderTicket();
  updateWorkflowButtons();
  updateUI();

  setTimeout(() => {
    if (state.orderQueue.length > 0) {
      startNextOrderInQueue();
    } else {
      const save = state.storeState ? (state.storeState.save || state.storeState) : {};
      const buffs = save.active_buffs || {};
      const isViral = buffs.tiktoker_status === 'viral';
      const isBigCampaign = isViral && (buffs.tiktoker_cost || 0) >= 1000000;
      scheduleNextOrder(isBigCampaign ? 1500 : (isViral ? 2200 : 3500));
    }
  }, 1000);
}

// Handle shipper arrival at counter: actually places a delivery order
export async function handleShipperOrderArrival() {
  if (state.isGamePaused) return null;
  if (state.orderQueue && state.orderQueue.length >= 14) return null;

  try {
    let newOrders = [];
    if (state.storeState && (state.storeState.recipes_db || state.storeState.save)) {
      newOrders = generateLocalCustomerWave({ isShipper: true });
    }
    if (!newOrders || newOrders.length === 0) {
      const res = await window.API.getOrder(true);
      if (res && res.order && res.order.orders) {
        newOrders = res.order.orders;
      }
    }
    if (!newOrders || newOrders.length === 0) return null;

    newOrders.forEach(o => { o.isShipper = true; });

    if (window.sound) window.sound.bell();

    if (!state.currentOrder) {
      state.orderQueue = [...newOrders, ...state.orderQueue].slice(0, 14);
    } else {
      const currentId = state.currentOrder.orderId;
      const currIdx = state.orderQueue.findIndex(o => o.orderId === currentId);
      if (currIdx !== -1) {
        state.orderQueue.splice(currIdx + 1, 0, ...newOrders);
      } else {
        state.orderQueue.push(...newOrders);
      }
      state.orderQueue = state.orderQueue.slice(0, 14);
    }

    const shipperOrdersInQueue = state.orderQueue.filter(o => o.isShipper);
    const count = shipperOrdersInQueue.length;
    shipperOrdersInQueue.forEach((o, idx) => {
      o.shipperBatchIndex = idx + 1;
      o.shipperBatchTotal = count;
      if (o.quote && count > 1) {
        o.quote = o.quote.replace(/\[Ly \d+\/\d+\]/, `[Ly ${idx + 1}/${count}]`);
      }
    });

    if (state.canvas && state.canvas.motorbikeShipper && count > 0) {
      state.canvas.motorbikeShipper.orderId = shipperOrdersInQueue[0].orderId;
      state.canvas.motorbikeShipper.totalCount = count;
      state.canvas.motorbikeShipper.servedCount = 0;
      state.canvas.motorbikeShipper.needsOrderFetch = false;
      state.canvas.motorbikeShipper.bubble = count > 1 
        ? `🛵 Anh Lâm: Đơn app ${count} ly hỏa tốc nha quán!` 
        : `🛵 Anh Lâm: Cho anh lấy đơn ship hỏa tốc!`;
    }

    if (state.canvas && state.canvas.setCustomerQueue) {
      state.canvas.setCustomerQueue(state.orderQueue);
    }

    if (!state.currentOrder) {
      startNextOrderInQueue();
    } else {
      updateUI();
    }

    return shipperOrdersInQueue[0] || null;
  } catch (err) {
    console.error('Failed to handle shipper order arrival:', err);
    return null;
  }
}

/**
 * Instantly insert an order (e.g. Admin NPC summon or special wave) into front or top of queue
 */
export function insertCustomOrderIntoQueue(customOrder) {
  if (!customOrder) return;

  const orders = customOrder.orders && customOrder.orders.length > 0 ? customOrder.orders : [customOrder];

  if (!state.currentOrder) {
    state.orderQueue = [...orders, ...state.orderQueue].slice(0, 14);
    if (state.canvas && state.canvas.setCustomerQueue) {
      state.canvas.setCustomerQueue(state.orderQueue);
    }
    startNextOrderInQueue();
  } else {
    // Insert immediately right behind current order so it appears next
    state.orderQueue.splice(1, 0, ...orders);
    state.orderQueue = state.orderQueue.slice(0, 14);
    if (state.canvas && state.canvas.setCustomerQueue) {
      state.canvas.setCustomerQueue(state.orderQueue);
    }
    updateUI();
  }
}

if (typeof window !== 'undefined') {
  window.handleShipperOrderArrival = handleShipperOrderArrival;
  window.insertCustomOrderIntoQueue = insertCustomOrderIntoQueue;
}

