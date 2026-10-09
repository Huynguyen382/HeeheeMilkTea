// End of Shift (Kết Ca) System
import { state } from './state.js';
import { showToast } from './toast.js';
import { updateUI } from './ui.js';
import { renderOrderTicket } from './workflow.js';
import { startRestCountdown } from './rest.js';
import { scheduleNextOrder } from './order-manager.js';

let modalEndShift = null;
let btnNavEndShift = null;
let closeEndShift = null;
let shiftContent = null;

export function openEndShiftModal() {
  if (!shiftContent) shiftContent = document.getElementById('shift-summary-content');
  if (!modalEndShift) modalEndShift = document.getElementById('modal-end-shift');
  if (!shiftContent || !state.storeState) return;

  // Tạm dừng game khi mở bảng Kết ca
  if (state.nextOrderTimeout) clearTimeout(state.nextOrderTimeout);

  const save = state.storeState.save || {};
  const daily = state.storeState.daily_stats || {};
  const day = save.day_in_game || 1;
  const orders = daily.shift_orders || daily.orders_served || 0;
  const gross = daily.shift_earned || daily.earned_today || 0;
  const ingCost = daily.shift_ingredient_cost || 0;
  const rent = save.chapter === 1 ? 20000 : 80000;
  const totalCosts = rent + ingCost;
  const netProfit = gross - totalCosts;

  let evalComment = '🌟 Ca bán hàng bận rộn! Chăm chỉ tích lũy để sớm trả sạch nợ!';
  if (netProfit > 200000) {
    evalComment = '🔥 Đỉnh nóc kịch trần! Quán đông nườm nượp, lợi nhuận rực rỡ!';
  } else if (netProfit <= 0) {
    evalComment = '⚠️ Doanh thu chưa bù đủ chi phí mặt bằng! Hãy chuẩn bị kỹ cho ca tới nhé!';
  }

  shiftContent.innerHTML = `
    <div class="shift-receipt">
      <div class="receipt-header">
        <div class="receipt-title">📋 HÓA ĐƠN KẾT CA (NGÀY ${day})</div>
        <div class="receipt-subtitle">Tiệm Trà Sữa HeeHee • Kết Thúc Ca Làm Việc</div>
      </div>

      <div style="background: rgba(80, 250, 123, 0.12); border: 1px dashed #50fa7b; border-radius: 8px; padding: 8px; font-size: 0.88rem; color: #50fa7b; text-align: center; margin-bottom: 10px; line-height: 1.4;">
        ⏸️ <b>Game đang tạm dừng:</b> Sau khi xác nhận kết ca, nhân vật sẽ nghỉ ngơi thư giãn <b>2 phút</b> sau một ngày làm việc mệt mỏi!
      </div>

      <div class="receipt-section">
        <div style="font-weight: bold; color: var(--gold); margin-bottom: 2px;">💰 DOANH THU CA:</div>
        <div class="receipt-row">
          <span>🧋 Số ly đã phục vụ:</span>
          <span><b>${orders}</b> ly</span>
        </div>
        <div class="receipt-row bold">
          <span>💵 Doanh thu bán hàng:</span>
          <span style="color: #50fa7b;">+${gross.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-section">
        <div style="font-weight: bold; color: #ff79c6; margin-bottom: 2px;">🧾 CHI PHÍ VẬN HÀNH:</div>
        <div class="receipt-row">
          <span>🏠 Tiền mặt bằng (${save.chapter === 1 ? 'Xe đẩy vỉa hè' : 'Mặt bằng sinh viên'}):</span>
          <span style="color: #ff5555;">-${rent.toLocaleString('vi-VN')}đ</span>
        </div>
        <div class="receipt-row">
          <span>📦 Chi phí nguyên liệu tiêu hao:</span>
          <span style="color: #ffb86c;">-${ingCost.toLocaleString('vi-VN')}đ</span>
        </div>
        <div class="receipt-row bold">
          <span>Tổng chi phí ca:</span>
          <span style="color: #ff5555;">-${totalCosts.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-net-profit ${netProfit < 0 ? 'loss' : ''}">
        <span>LỢI NHUẬN RÒNG:</span>
        <span>${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString('vi-VN')}đ</span>
      </div>

      <div class="receipt-evaluation">
        ${evalComment}
      </div>

      <div style="margin-top: 6px;">
        <button class="btn-action-wide" id="btn-confirm-end-shift" style="width: 100%; font-size: 1.15rem; background: linear-gradient(180deg, #50fa7b, #2e8b57);">
          🌅 XÁC NHẬN KẾT CA ➔ SANG NGÀY ${day + 1}
        </button>
      </div>
    </div>
  `;

  const btnConfirm = document.getElementById('btn-confirm-end-shift');
  if (btnConfirm) {
    btnConfirm.addEventListener('click', async () => {
      btnConfirm.disabled = true;
      btnConfirm.innerText = 'Đang quyết toán & sang ca mới...';
      try {
        const res = await window.API.endShift();
        if (res && res.success) {
          if (window.sound) window.sound.bell();
          if (modalEndShift) modalEndShift.style.display = 'none';

          // Dọn sạch đơn hàng ca cũ
          if (state.orderTimerInterval) clearInterval(state.orderTimerInterval);
          if (state.nextOrderTimeout) clearTimeout(state.nextOrderTimeout);
          state.orderQueue = [];
          state.currentOrder = null;
          renderOrderTicket();
          if (state.canvas && state.canvas.setCustomerQueue) {
            state.canvas.setCustomerQueue([]);
          }

          state.storeState = await window.API.getState();
          updateUI();
          showToast(`🌅 Kết ca Ngày ${res.previousDay} thành công! Đã bắt đầu Ngày ${res.day_in_game} tươi sáng!`, 4000);

          // Chuyển ngay thời gian trong game tới 7h00 sáng để bắt đầu ca mới đón bình minh
          if (state.canvas && typeof state.canvas.setInGameTimeTo7AM === 'function') {
            state.canvas.setInGameTimeTo7AM();
          }

          // Đảm bảo đóng overlay nghỉ ngơi và tiếp tục nhận đơn hàng
          const overlayResting = document.getElementById('overlay-resting');
          if (overlayResting) overlayResting.style.display = 'none';

          state.isGamePaused = false;
          scheduleNextOrder(2000);
        } else {
          if (window.sound) window.sound.fail();
          showToast('❌ ' + (res.message || 'Không thể kết ca'));
          btnConfirm.disabled = false;
        }
      } catch (err) {
        console.error('End shift error:', err);
        btnConfirm.disabled = false;
      }
    });
  }

  modalEndShift.style.display = 'flex';
}

export function initShift() {
  modalEndShift = document.getElementById('modal-end-shift');
  btnNavEndShift = document.getElementById('nav-end-shift');
  closeEndShift = document.getElementById('close-end-shift');
  shiftContent = document.getElementById('shift-summary-content');

  if (btnNavEndShift) {
    btnNavEndShift.addEventListener('click', () => {
      if (window.sound) window.sound.bell();
      openEndShiftModal();
    });
  }

  if (closeEndShift) {
    closeEndShift.addEventListener('click', () => {
      if (modalEndShift) modalEndShift.style.display = 'none';
      state.isGamePaused = false;
      if (!state.currentOrder && (!state.orderQueue || state.orderQueue.length === 0)) {
        scheduleNextOrder(2000);
      }
    });
  }
}

