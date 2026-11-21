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

/**
 * Generate heartfelt, dynamic story diary reflections for HeeHee at the end of each shift
 */
function generateDailyStoryDiary({ day, chapter, orders, netProfit, debtRemaining, money }) {
  // 1. Chapter 1: Xe đẩy vỉa hè & món nợ 3 triệu
  if (chapter === 1) {
    if (debtRemaining <= 0) {
      return `Ôi hạnh phúc vỡ òa! Toàn bộ 3.000.000đ tiền nợ cho Anh Bảnh đã được trả sạch sành sanh! Chiếc xe đẩy này từ nay hoàn toàn thuộc về mình! Ngày mai chúng mình sẽ chính thức tiến vào Góc Hẻm Sinh Viên ĐH Bách Khoa!`;
    }
    if (debtRemaining <= 1500000) {
      return `Hôm nay tiệm phục vụ được ${orders} ly trà thơm phức. Sổ nợ báo chỉ còn ${debtRemaining.toLocaleString('vi-VN')}đ, chưa tới một nửa nữa thôi! Nhìn thấy ánh mắt khích lệ của Bé Bắp và Anh Lâm, mình tin chắc tự do đang ở ngay trước mắt.`;
    }
    if (day === 1) {
      return `Ngày đầu tiên khởi nghiệp với chiếc xe đẩy inox nhỏ ven đường... Đôi tay còn ngập ngừng khi kéo cần dập nắp, nhưng nghe tiếng khách khen trà sữa thơm bùi, mọi mệt nhọc đều tan biến. Ngày mai phải nỗ lực kiếm tiền trả nợ cho Anh Bảnh!`;
    }
    return `Góc phố thân thương hôm nay rộn ràng tiếng bình lắc hòa cùng tiếng xe cộ. Đã bán được ${orders} ly trà, tích lũy thêm được chút tiền gửi vào tài khoản. Cố lên HeeHee, từng bước nhỏ sẽ dẫn tới thành công lớn!`;
  }

  // 2. Chapter 2: Góc hẻm sinh viên & cạnh tranh
  if (chapter === 2) {
    if (money >= 45000000) {
      return `Gần gom đủ 50.000.000đ tiền vốn rồi! Giấc mơ mở cửa hàng trà sữa 2 tầng trên Phố Đi Bộ sắp thành hiện thực. Lão Ba tiệm Trâu Vàng giờ đây cũng nhìn tiệm mình bằng con mắt tôn trọng hơn rất nhiều.`;
    }
    if (netProfit > 200000) {
      return `Hôm nay bão sinh viên ghé quán! Bé Bắp dập nắp không ngơi tay, Anh Lâm phóng Wave chiến chở từng thùng trà mát lạnh tới giảng đường. Quán Trâu Vàng dù có chơi chiêu gì cũng không ngăn nổi tình cảm của các bạn trẻ!`;
    }
    return `Nhịp sống sinh viên Bách Khoa thật trẻ trung và tràn đầy năng lượng. Từng ly Trà Đào Cam Sả và Sữa Tươi Đường Đen trao đi là thêm những nụ cười rạng rỡ. HeeHee ngày một trưởng thành hơn trong việc làm chủ tiệm!`;
  }

  // 3. Chapter 3: Cửa hàng 2 tầng Phố Đi Bộ & Nông trại
  if (chapter === 3) {
    return `Ngồi trên ban công tầng 2 ngắm dòng người dạo phố dưới ánh đèn vàng lấp lánh, hương hoa sen Tây Hồ thoang thoảng dịu êm. Khách ngồi lại thưởng trà, cắn hạt hướng dương và chuyện trò rôm rả. Nguồn trà sạch Mộc Châu đã tạo nên linh hồn cho từng ly đồ uống!`;
  }

  // 4. Chapter 4: Đế chế nhượng quyền toàn cầu
  if (chapter === 4) {
    return `Hôm nay nhận được báo cáo doanh thu từ các chi nhánh Sài Gòn, Đà Nẵng, Tokyo và Seoul. Thương hiệu HeeHee đã thực sự sải cánh bay xa! Tinh hoa trà cổ thụ non sông Việt Nam đang được bạn bè năm châu nâng niu trân trọng.`;
  }

  // 5. Chapter 5: Vương triều vũ trụ
  return `Trạm Không Gian Ngân Hà tĩnh lặng nhìn xuống Trái Đất xanh ngọc tuyệt đẹp. Chiếc Siêu Xe Đẩy [Cosmic Coffee Cart] tỏa ánh cực quang tím thạch anh huyền diệu. Từ một giấc mơ vỉa hè nợ 3 triệu đến Nữ Hoàng Trà Sữa Vũ Trụ... cảm ơn cuộc đời, cảm ơn tất cả những ai đã tin yêu HeeHee!`;
}

export function openEndShiftModal() {
  if (!shiftContent) shiftContent = document.getElementById('shift-summary-content');
  if (!modalEndShift) modalEndShift = document.getElementById('modal-end-shift');
  if (!shiftContent || !state.storeState) return;

  // Tạm dừng game khi mở bảng Kết ca
  state.isGamePaused = true;
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

  const diaryText = generateDailyStoryDiary({
    day,
    chapter: Number(save.chapter || 1),
    orders,
    netProfit,
    debtRemaining: Number(save.debt_remaining !== undefined ? save.debt_remaining : 3000000),
    money: Number(save.money || 0)
  });

  shiftContent.innerHTML = `
    <div class="shift-receipt">
      <div class="receipt-header">
        <div class="receipt-title">📋 HÓA ĐƠN KẾT CA (NGÀY ${day})</div>
        <div class="receipt-subtitle">Tiệm Trà Sữa HeeHee • Kết Thúc Ca Làm Việc</div>
      </div>

      <div style="background: rgba(80, 250, 123, 0.12); border: 1px dashed #50fa7b; border-radius: 8px; padding: 8px; font-size: 0.88rem; color: #50fa7b; text-align: center; margin-bottom: 10px; line-height: 1.4;">
        🌅 <b>Sẵn sàng sang ca mới:</b> Sau khi xác nhận kết ca, tiệm sẽ quyết toán doanh thu và lập tức bắt đầu ngày mới lúc <b>7h00 sáng</b>!
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

      <!-- HeeHee's Daily Story Diary Card -->
      <div class="shift-diary-card" style="background: rgba(255, 230, 150, 0.08); border: 1px solid rgba(241, 196, 15, 0.4); border-radius: 8px; padding: 10px 12px; margin: 12px 0 8px 0; text-align: left; position: relative; box-shadow: inset 0 0 10px rgba(0,0,0,0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-weight: bold; color: #f1c40f; font-size: 0.88rem; display: flex; align-items: center; gap: 5px;">
            📖 <span>NHẬT KÝ QUÁN TRÀ</span>
          </span>
          <span style="font-size: 0.75rem; color: #a4b0be; font-style: italic;">Ngày thứ ${day}</span>
        </div>
        <div style="font-size: 0.84rem; color: #f5f6fa; line-height: 1.5; font-style: italic; border-left: 2.5px solid #f1c40f; padding-left: 8px;">
          "${diaryText}"
        </div>
        <div style="text-align: right; margin-top: 6px; font-size: 0.78rem; color: #e1b12c; font-weight: bold;">
          ✍️ Ký tên: HeeHee (Cô Chủ Quán)
        </div>
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
          btnConfirm.innerText = `🌅 XÁC NHẬN KẾT CA ➔ SANG NGÀY ${day + 1}`;
        }
      } catch (err) {
        console.error('End shift error:', err);
        btnConfirm.disabled = false;
        btnConfirm.innerText = `🌅 XÁC NHẬN KẾT CA ➔ SANG NGÀY ${day + 1}`;
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

