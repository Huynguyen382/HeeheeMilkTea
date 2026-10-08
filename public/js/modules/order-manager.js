// Customer Wave & Order Management System
import { state } from './state.js';
import { showToast } from './toast.js';
import { updateUI, updateBuffsUI } from './ui.js';
import { renderOrderTicket, updateWorkflowButtons } from './workflow.js';
import { startRestCountdown } from './rest.js';
import { checkThiefEncounter, showSnackModal } from './events.js';

export async function scheduleNextOrder(delay = 4000) {
  if (state.nextOrderTimeout) clearTimeout(state.nextOrderTimeout);
  if (state.isGamePaused) return;

  state.nextOrderTimeout = setTimeout(async () => {
    if (state.isGamePaused) return;
    if (state.currentOrder || (state.orderQueue && state.orderQueue.length > 0)) return;

    const res = await window.API.getOrder();
    if (!res || !res.order) {
      scheduleNextOrder(4500);
      return;
    }

    if (res.order.resting) {
      startRestCountdown(res.order.restUntil, res.order.restReason || 'snack_sick');
      return;
    }

    if (res.order.isOverloaded) {
      showToast('🛑 Quán đang chạm hạn mức! Khách hàng vãng lai thưa thớt...', 4000);
      scheduleNextOrder(12000);
      return;
    }

    if (res.order.isLowReputation) {
      showToast(res.order.message || '⚠️ Đánh giá tiệm < 3⭐! Khách hàng e ngại chất lượng, lượng khách giảm 50%... Hãy chủ động mời TikToker review để kéo lại sao!', 5000);
      scheduleNextOrder(9000);
      return;
    }

    // Update active buffs if returned
    if (res.order.activeBuffs) {
      updateBuffsUI(res.order.activeBuffs);
    }

    // Shipper snack offer event
    if (res.order.snackEvent) {
      showSnackModal(res.order.snackEvent);
    }

    // Wave with up to 14 customers queueing
    if (res.order.orders && res.order.orders.length > 0) {
      state.totalWavePausedTime = 0;
      // Keep unserved pending orders and append new ones up to max 14 customers
      const pendingQueue = state.orderQueue.filter(o => o.orderId !== (state.currentOrder && state.currentOrder.orderId));
      state.orderQueue = [...pendingQueue, ...res.order.orders].slice(0, 14);

      const shipperOrder = res.order.orders.find(o => o.isShipper);
      if (shipperOrder && state.canvas && !state.canvas.motorbikeShipper?.active) {
        state.canvas.spawnMotorbikeShipper(shipperOrder.orderId);
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

  // Patience countdown with dynamic tolerance & grace extensions
  let duration = state.currentOrder.patienceMs || 45000;
  const interval = 100;
  let elapsed = 0;
  let graceCount = 0;
  const MAX_GRACE = 2; // Up to 2 extensions

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
      // Kiểm tra xem người chơi đã bắt đầu pha chế chưa
      const isBrewing = state.isShaken || state.isPoured || state.isSealed;

      // Trường hợp 1: Đang tích cực pha chế (đã lắc/rót/dập nắp)
      if (isBrewing) {
        if (graceCount < MAX_GRACE) {
          graceCount++;
          elapsed = Math.floor(duration * 0.4); // Hồi lại 60% thanh thời gian
          showToast(`⏳ [${state.currentOrder ? state.currentOrder.customerName : 'Khách'}] thấy bạn đang pha chế nên vui vẻ đợi thêm! ✨`, 3500);
          return;
        } else {
          // Đã gia hạn 2 lần, giữ lại 20% thanh thời gian cho đến khi giao ly
          elapsed = Math.floor(duration * 0.8);
          return;
        }
      }

      // Trường hợp 2: Chưa bắt đầu pha chế
      if (graceCount < 1) {
        graceCount++;
        const willWait = Math.random() < 0.80; // 80% kiên nhẫn chờ
        if (willWait) {
          elapsed = Math.floor(duration * 0.45); // Hồi lại 55% thời gian
          const waitQuotes = [
            `"Chị HeeHee cứ từ từ làm nha, em đợi thêm xíu được mà! 🥰"`,
            `"Quán đông quá hả em? Không sao, anh chờ được, làm ngon giùm anh! 🍵"`,
            `"HeeHee ráng lên nha! Thấy bạn cẩn thận vậy mình càng háo hức uống thử! ✨"`,
            `"Bác đứng ngắm phố phường hóng mát, cháu cứ pha thong thả cho chuẩn vị nghen! 🍃"`,
            `"Tụi em đang đứng check-in chụp hình quán đẹp quá nè, chị cứ làm từ từ nha! 📸"`
          ];
          const quote = waitQuotes[Math.floor(Math.random() * waitQuotes.length)];
          showToast(`⏳ [${state.currentOrder ? state.currentOrder.customerName : 'Khách'}]: ${quote}`, 4500);
          const elQuote = document.getElementById('order-dialogue');
          if (elQuote) elQuote.innerText = quote;
          return;
        }
      }

      // Khách thực sự vội mới bỏ đi
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

  if (isShipperOrder && state.canvas && state.canvas.onShipperOrderFailed) {
    state.canvas.onShipperOrderFailed(failedCust.orderId);
  }

  showToast(`❌ Khách hàng [${failedCust ? failedCust.customerName : 'Khách'}] sốt ruột bỏ đi vì đợi quá lâu!`);

  if (failedCust) {
    const failRes = await window.API.reportOrderFail(failedCust.orderId, isTiktoker);
    if (failRes && failRes.tiktokerFlop) {
      showToast(failRes.message, 6000);
      state.storeState = await window.API.getState();
      updateUI();
    }
  }

  state.orderQueue.shift();
  if (state.canvas && state.canvas.advanceQueue) {
    state.canvas.advanceQueue();
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
    const res = await window.API.getOrder(true);
    if (!res || !res.order) return null;

    if (res.order.resting) {
      startRestCountdown(res.order.restUntil, res.order.restReason || 'snack_sick');
      return null;
    }

    const newOrders = res.order.orders || [];
    if (newOrders.length === 0) return null;

    const shipperOrder = newOrders[0];
    shipperOrder.isShipper = true;

    if (state.canvas && state.canvas.motorbikeShipper) {
      state.canvas.motorbikeShipper.orderId = shipperOrder.orderId;
    }

    showToast('🛵 Shipper Huy đã tới quầy nhận đơn giao hàng hỏa tốc! 📦', 4500);
    if (window.sound) window.sound.bell();

    if (!state.currentOrder) {
      state.orderQueue = [shipperOrder, ...state.orderQueue].slice(0, 14);
      if (state.canvas && state.canvas.setCustomerQueue) {
        state.canvas.setCustomerQueue(state.orderQueue);
      }
      startNextOrderInQueue();
    } else {
      const currentId = state.currentOrder.orderId;
      const currIdx = state.orderQueue.findIndex(o => o.orderId === currentId);
      if (currIdx !== -1) {
        state.orderQueue.splice(currIdx + 1, 0, shipperOrder);
      } else {
        state.orderQueue.push(shipperOrder);
      }
      state.orderQueue = state.orderQueue.slice(0, 14);
      if (state.canvas && state.canvas.setCustomerQueue) {
        state.canvas.setCustomerQueue(state.orderQueue);
      }
      updateUI();
    }

    return shipperOrder;
  } catch (err) {
    console.error('Failed to handle shipper order arrival:', err);
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.handleShipperOrderArrival = handleShipperOrderArrival;
}

