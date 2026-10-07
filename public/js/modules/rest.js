// Resting Countdown System (End Shift & Bellyache rest)
import { state } from './state.js';
import { showToast } from './toast.js';
import { updateUI } from './ui.js';
import { renderOrderTicket } from './workflow.js';
import { scheduleNextOrder } from './order-manager.js';

// Check real-world resting countdown (End Shift 2 minutes or Snack Bellyache 15 minutes)
export function checkRestStatus(save) {
  if (!save || !save.rest_until_ts) return false;
  const now = Date.now();
  if (now < save.rest_until_ts) {
    const buffs = save.active_buffs || {};
    const reason = buffs.rest_reason || 'snack_sick';
    startRestCountdown(save.rest_until_ts, reason);
    return true;
  }
  return false;
}

export function startRestCountdown(restUntil, reason = 'snack_sick') {
  state.isGamePaused = true;
  const overlay = document.getElementById('overlay-resting');
  const disp = document.getElementById('rest-timer-display');
  const iconEl = document.getElementById('rest-icon');
  const titleEl = document.getElementById('rest-title');
  const descEl = document.getElementById('rest-desc');
  const labelEl = document.getElementById('rest-timer-label');
  const boxEl = document.getElementById('rest-timer-box');
  const modalContent = document.getElementById('rest-modal-content');

  const isEndShift = reason === 'end_shift';

  if (iconEl) iconEl.innerText = isEndShift ? '🛌🌙☕✨' : '🤢💊🚽';
  if (titleEl) {
    titleEl.innerText = isEndShift 
      ? 'NGHỈ NGƠI SAU MỘT NGÀY LÀM VIỆC MỆT MỎI' 
      : 'HEEHEE ĐANG BỊ ĐAU BỤNG!';
    titleEl.style.color = isEndShift ? '#ffb86c' : '#ff5555';
  }
  if (descEl) {
    descEl.innerText = isEndShift
      ? 'Ca làm việc hôm nay đã kết thúc! HeeHee và đội ngũ phụ bếp đang dọn dẹp quán, chợp mắt nghỉ ngơi sau một ngày làm việc mệt mỏi để nạp lại năng lượng cho ngày mới!'
      : 'Do ăn đồ ăn vặt cay béo vỉa hè của anh Shipper, bụng dạ HeeHee đang sôi ùng ục! Bác sĩ bắt buộc phải tạm đóng quầy nghỉ ngơi hồi sức.';
  }
  if (labelEl) {
    labelEl.innerText = isEndShift ? 'THỜI GIAN NGHỈ NGƠI CÒN LẠI:' : 'THỜI GIAN MỞ LẠI QUẦY TRÀ SỮA:';
    labelEl.style.color = isEndShift ? '#bd93f9' : '#ffb86c';
  }
  if (boxEl) {
    boxEl.style.borderColor = isEndShift ? '#ffb86c' : '#ff5555';
  }
  if (modalContent) {
    modalContent.style.borderColor = isEndShift ? '#ffb86c' : '#ff5555';
    modalContent.style.background = isEndShift ? '#1e1425' : '#260c16';
  }

  if (overlay) overlay.style.display = 'flex';

  if (state.orderTimerInterval) clearInterval(state.orderTimerInterval);
  if (state.restTimerInterval) clearInterval(state.restTimerInterval);
  if (state.nextOrderTimeout) clearTimeout(state.nextOrderTimeout);

  state.currentOrder = null;
  state.orderQueue = [];
  if (state.canvas && state.canvas.setCustomerQueue) {
    state.canvas.setCustomerQueue([]);
  }
  renderOrderTicket();

  // Wire up Skip Rest (200.000đ) button
  const btnSkipRest = document.getElementById('btn-skip-rest');
  if (btnSkipRest) {
    btnSkipRest.onclick = async () => {
      const myMoney = (state.storeState && state.storeState.save) ? state.storeState.save.money : 0;
      if (myMoney < 200000) {
        if (window.sound) window.sound.fail();
        showToast(`❌ Bạn không đủ tiền! Cần 200.000đ để thức dậy ngay (Hiện có: ${myMoney.toLocaleString('vi-VN')}đ).`, 4500);
        return;
      }

      btnSkipRest.disabled = true;
      btnSkipRest.style.opacity = '0.6';
      try {
        const res = await window.API.skipRest();
        if (res && res.success) {
          clearInterval(state.restTimerInterval);
          state.restTimerInterval = null;
          state.isGamePaused = false;
          const ov = document.getElementById('overlay-resting');
          if (ov) ov.style.display = 'none';
          if (overlay) overlay.style.display = 'none';

          // Chuyển thời gian trong game tới 7h sáng để bắt đầu kinh doanh!
          if (state.canvas && state.canvas.setInGameTimeTo7AM) {
            state.canvas.setInGameTimeTo7AM();
          }

          if (window.sound) {
            window.sound.coin();
            setTimeout(() => window.sound.bell(), 300);
          }

          showToast(`⚡ ĐÃ CHI 200.000đ ĐỂ THỨC DẬY NGAY! Đã chuyển thời gian tới 7h00 sáng, quán bắt đầu mở cửa kinh doanh! 🎉`, 6000);

          state.storeState = await window.API.getState();
          updateUI();
          scheduleNextOrder(2000);
        } else {
          if (window.sound) window.sound.fail();
          showToast('❌ ' + ((res && (res.message || res.error)) || 'Không thể thức dậy lúc này'), 4000);
        }
      } catch (err) {
        console.error('Skip rest error:', err);
        showToast('❌ Có lỗi xảy ra khi thức dậy', 3000);
      } finally {
        btnSkipRest.disabled = false;
        btnSkipRest.style.opacity = '1';
      }
    };
  }

  function updateTimer() {
    const remainingSec = Math.max(0, Math.ceil((restUntil - Date.now()) / 1000));
    const m = Math.floor(remainingSec / 60).toString().padStart(2, '0');
    const s = (remainingSec % 60).toString().padStart(2, '0');
    if (disp) disp.innerText = `${m}:${s}`;

    if (remainingSec <= 0) {
      clearInterval(state.restTimerInterval);
      state.isGamePaused = false;
      if (overlay) overlay.style.display = 'none';

      // Tự động chuyển thời gian trong game tới 7h sáng để bắt đầu kinh doanh!
      if (state.canvas && state.canvas.setInGameTimeTo7AM) {
        state.canvas.setInGameTimeTo7AM();
      }

      if (window.sound) window.sound.bell();
      if (isEndShift) {
        const nextDay = state.storeState && state.storeState.save ? state.storeState.save.day_in_game : '';
        showToast(`🌅 Đã hoàn thành thời gian nghỉ ngơi! Thời gian đã chuyển tới 7h00 sáng Ngày ${nextDay}, quán bắt đầu mở cửa kinh doanh! ✨`, 5500);
      } else {
        showToast('🌅 Đã hoàn thành thời gian nghỉ ngơi! Thời gian chuyển tới 7h00 sáng, quán bắt đầu mở cửa đón khách! ✨', 5000);
      }
      updateUI();
      scheduleNextOrder(2000);
    }
  }

  updateTimer();
  state.restTimerInterval = setInterval(updateTimer, 1000);
}

