// Special Events: Thief, Pet, Police Patrol, TikToker Invite & Shipper Snack
import { state } from './state.js';
import { showToast } from './toast.js';
import { updateUI } from './ui.js';
import { scheduleNextOrder } from './order-manager.js';
import { startRestCountdown } from './rest.js';

// --- 1. THIEF ENCOUNTER & PET SYSTEM ---
export function checkThiefEncounter() {
  if (state.isGamePaused) return;
  if (!state.storeState || !state.storeState.save || !state.storeState.save.upgrades) return;
  const up = state.storeState.save.upgrades;
  if (!up.active_pet || up.is_pet_stolen) return;
  if (state.canvas && state.canvas.thief) return;

  // Thief appears when store is crowded (queue >= 2 or daily cap reached)
  const isCrowded = (state.orderQueue && state.orderQueue.length >= 2) || 
    (state.storeState.daily_stats && state.storeState.daily_stats.is_overloaded);
  if (isCrowded && Math.random() < 0.65) {
    if (state.canvas && state.canvas.spawnThief) {
      state.canvas.spawnThief();
      showToast('👀 Có kẻ lạ mặc đồ đen, đeo khẩu trang đang đi qua lại rình rập tiệm!', 4500);
    }
  }
}

// Global hook
window.checkThiefEncounter = checkThiefEncounter;

// Redeem Pet Handlers
export async function handleRedeemPet() {
  try {
    const res = await window.API.redeemPet();
    if (res && res.success) {
      if (window.sound) window.sound.coin();
      showToast(res.message, 4500);
      const modalPetStolen = document.getElementById('modal-pet-stolen');
      if (modalPetStolen) modalPetStolen.style.display = 'none';
      state.storeState = await window.API.getState();
      updateUI();
    } else {
      showToast('❌ ' + (res.message || 'Không đủ tiền chuộc bé!'));
    }
  } catch (err) {
    console.error('Redeem pet error:', err);
    showToast('❌ Lỗi kết nối khi nộp tiền chuộc!');
  }
}

// --- 2. TIKTOKER INVITATION MODAL ---
export function renderTiktokerModal() {
  if (!state.storeState) return;
  const save = state.storeState.save || state.storeState;
  const buffs = save.active_buffs || {};
  const currentDay = save.day_in_game || 1;
  let daily = buffs.tiktoker_daily;
  if (!daily || daily.day !== currentDay) {
    daily = { day: currentDay, count: 0, nextCost: 25000 };
  }

  const quotaDisplay = document.getElementById('tiktoker-quota-display');
  const costDisplay = document.getElementById('tiktoker-cost-display');
  const tierDesc = document.getElementById('tiktoker-tier-desc');
  const benefitDesc = document.getElementById('tiktoker-benefit-desc');
  const btnConfirmInviteTiktoker = document.getElementById('btn-confirm-invite-tiktoker');

  const count = daily.count || 0;
  const cost = count === 0 ? 25000 : (daily.nextCost || 2000000);
  const targetRevenue = cost * 3;

  if (quotaDisplay) {
    quotaDisplay.innerText = `${count}/2 lần (Ngày ${currentDay})`;
  }

  if (costDisplay) {
    costDisplay.innerText = `${cost.toLocaleString('vi-VN')}đ`;
  }

  if (tierDesc) {
    if (count === 0) {
      tierDesc.innerText = '🎁 Lần 1 trong ngày: Gói ưu đãi trải nghiệm đặc biệt dành cho quán mới!';
      tierDesc.style.color = '#bd93f9';
    } else if (count === 1) {
      tierDesc.innerText = '🔥 Lần 2 trong ngày: Chiến dịch Viral VIP quy mô lớn (2 - 5 triệu đ)!';
      tierDesc.style.color = '#ffb86c';
    } else {
      tierDesc.innerText = `🛑 Đã đạt giới hạn tối đa 2 lần mời TikToker trong Ngày ${currentDay}! Hãy kết ca sang ngày mới để đặt tiếp.`;
      tierDesc.style.color = '#ff5555';
    }
  }

  if (benefitDesc) {
    benefitDesc.innerHTML = `🌟 <b>Cam kết hoàn vốn 300%:</b> Đợt khách nườm nượp kéo đến liên tục cho đến khi quán kiếm được gấp 3 lần vốn bỏ ra <b>(${targetRevenue.toLocaleString('vi-VN')}đ)</b>!`;
  }

  if (btnConfirmInviteTiktoker) {
    if (buffs.tiktoker_status === 'viral') {
      btnConfirmInviteTiktoker.disabled = true;
      btnConfirmInviteTiktoker.innerText = '🔥 Đang trong cơn sốt TikToker Viral!';
      btnConfirmInviteTiktoker.style.background = '#4a5568';
    } else if (count >= 2) {
      btnConfirmInviteTiktoker.disabled = true;
      btnConfirmInviteTiktoker.innerText = `Đã hết lượt hôm nay (${count}/2 lần)`;
      btnConfirmInviteTiktoker.style.background = '#4a5568';
    } else if ((save.money !== undefined ? save.money : save.cash) < cost) {
      btnConfirmInviteTiktoker.disabled = true;
      btnConfirmInviteTiktoker.innerText = `Không đủ tiền (${cost.toLocaleString('vi-VN')}đ)`;
      btnConfirmInviteTiktoker.style.background = '#4a5568';
    } else {
      btnConfirmInviteTiktoker.disabled = false;
      btnConfirmInviteTiktoker.innerText = `🚀 Book Tú TikToker Ghé Quán (${cost.toLocaleString('vi-VN')}đ)`;
      btnConfirmInviteTiktoker.style.background = 'linear-gradient(135deg, #ff79c6, #bd93f9)';
    }
  }
}

// Global hook
window.renderTiktokerModal = renderTiktokerModal;

// --- 3. SHIPPER SNACK INVITATION MODAL ---
export function showSnackModal(snackEvent) {
  const modal = document.getElementById('modal-snack');
  if (!modal) return;
  const snackIcon = document.getElementById('snack-icon');
  const snackTitle = document.getElementById('snack-title');
  const snackQuote = document.getElementById('snack-quote');
  if (snackIcon) snackIcon.innerText = snackEvent.snackIcon || '🥡';
  if (snackTitle) snackTitle.innerText = snackEvent.snackName;
  if (snackQuote) snackQuote.innerText = `"${snackEvent.offerQuote}"`;
  modal.style.display = 'flex';

  const btnEat = document.getElementById('btn-eat-snack');
  if (btnEat) {
    btnEat.onclick = async () => {
      modal.style.display = 'none';
      const res = await window.API.snackDecision(true);
      if (res.outcome === 'good') {
        if (window.sound) window.sound.coin();
        showToast(res.message, 5000);
        state.storeState = await window.API.getState();
        updateUI();
      } else if (res.outcome === 'bad') {
        if (window.sound) window.sound.fail();
        showToast(res.message, 6000);
        state.storeState = await window.API.getState();
        updateUI();
        startRestCountdown(res.restUntil);
      }
    };
  }

  const btnRefuse = document.getElementById('btn-refuse-snack');
  if (btnRefuse) {
    btnRefuse.onclick = async () => {
      modal.style.display = 'none';
      const res = await window.API.snackDecision(false);
      showToast(res.message, 4000);
    };
  }
}

// Initialize Canvas tap, Police callbacks & TikToker modal listeners
export function initEvents() {
  const sceneCanvas = document.getElementById('scene');
  if (sceneCanvas && state.canvas) {
    const onCanvasTap = async (clientX, clientY) => {
      const rect = sceneCanvas.getBoundingClientRect();
      const canvasVirtualWidth = state.canvas.width || 720;
      const canvasVirtualHeight = state.canvas.height || 200;
      const clickX = (clientX - rect.left) * (canvasVirtualWidth / rect.width);
      const clickY = (clientY - rect.top) * (canvasVirtualHeight / rect.height);

      // 1. Check Invisibility Amulet click
      if (state.canvas.checkAmuletClick) {
        const amuletRes = state.canvas.checkAmuletClick(clickX, clickY);
        if (amuletRes) {
          if (window.sound) window.sound.coin();
          if (amuletRes.invalidAfter1AM) {
            showToast('💀 ĐÃ QUÁ 1H SÁNG! Bùa ẩn thân đã mất linh nghiệm, không thể kích hoạt! Hãy đóng cửa (kết ca) ngay!', 5000);
            return;
          }
          if (amuletRes.empty) {
            showToast('❌ Bạn đã hết Bùa Ẩn Thân! Hãy vào Cửa Hàng Nâng Cấp để mua thêm (tối đa 3 tấm).', 4000);
            return;
          }
          if (amuletRes.consumed) {
            const policeAlert = document.getElementById('police-patrol-alert');
            if (policeAlert) policeAlert.style.display = 'none';
            try {
              const res = await window.API.useTalisman();
              if (res && res.success) {
                state.storeState = await window.API.getState();
                updateUI();
                showToast(`🔮 ĐÃ DÙNG 1 BÙA ẨN THÂN (Còn ${res.talismanCount}/3 tấm)! Cả quán tàng hình 60s để né cảnh sát!`, 4500);
              } else {
                showToast('❌ ' + (res?.message || 'Lỗi khi kích hoạt bùa!'));
              }
            } catch (err) {
              console.error('Use talisman error:', err);
            }
            return;
          }
          if (amuletRes.isInvisible === false) {
            showToast('👁️ Đã chủ động hủy tàng hình!', 2500);
            return;
          }
          return;
        }
      }

      // 2. Check Thief Click
      if (state.canvas.checkThiefClick && state.canvas.checkThiefClick(clickX, clickY)) {
        if (window.sound) window.sound.coin();
        try {
          const res = await window.API.shooThief();
          if (res && res.success) {
            showToast(`⚡ NÉM DÉP TỔ ONG TRÚNG ĐẦU TÊN TRỘM! Thưởng cảnh giác: +${(res.reward || 10000).toLocaleString('vi-VN')}đ! 🎉`, 4500);
            state.storeState = await window.API.getState();
            updateUI();
          }
        } catch (err) {
          console.error('Shoo thief error:', err);
        }
      }
    };

    sceneCanvas.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      onCanvasTap(e.clientX, e.clientY);
    });
  }

  // Police Patrol Event Callbacks on Canvas
  if (state.canvas) {
    state.canvas.onPoliceWarning = (secLeft, prob) => {
      const policeAlert = document.getElementById('police-patrol-alert');
      const policeTimer = document.getElementById('police-alert-timer');
      const policeProb = document.getElementById('police-alert-prob');
      const policeTitle = document.getElementById('police-alert-title');
      if (state.canvas.isInvisible) {
        if (policeAlert) policeAlert.style.display = 'none';
        return;
      }
      if (policeAlert) policeAlert.style.display = 'block';
      if (policeTimer) policeTimer.innerText = secLeft;
      if (policeProb && prob !== undefined) policeProb.innerText = `${prob}%`;
      const nStatus = state.canvas.getNightPatrolStatus ? state.canvas.getNightPatrolStatus() : null;
      if (policeTitle && nStatus) {
        policeTitle.innerText = nStatus.isAmuletInvalid ? '💀 ĐÃ QUÁ 1H - BÙA VÔ HIỆU!' : '🚨 CÔNG AN ĐI TUẦN!';
      }
    };

    state.canvas.onPolicePassed = () => {
      const policeAlert = document.getElementById('police-patrol-alert');
      if (policeAlert) policeAlert.style.display = 'none';
      showToast('👮 Cảnh sát trật tự đã đi qua! Quán an toàn tuyệt đối nhờ Bùa Ẩn Thân! 🎉', 4000);
    };

    state.canvas.onPoliceCaught = async (fineAmount, isInvalidAfter1AM, isFined = false) => {
      const policeAlert = document.getElementById('police-patrol-alert');
      if (policeAlert) policeAlert.style.display = 'none';

      if (!isFined) {
        // 90% trường hợp: Chỉ nhắc nhở, KHÔNG phạt tiền
        if (window.sound && window.sound.bell) window.sound.bell();
        showToast('👮 CÔNG AN NHẮC NHỞ: Tổ công tác nhắc quán thu dọn bàn ghế xe đẩy gọn gàng. Lần này CHỈ NHẮC NHỞ (Không phạt tiền)! Hãy chú ý nhé!', 6000);
        return;
      }

      // 10% trường hợp: Lập biên bản xử phạt tiền thật sự
      if (window.sound && window.sound.fail) window.sound.fail();
      try {
        const res = await window.API.policeFine();
        if (res && res.success) {
          if (res.isFined) {
            const actualF = res.fineAmount || fineAmount || 500000;
            showToast(`🚨 [10% XÁC SUẤT PHẠT] Tổ tuần tra đã lập biên bản xử phạt ${actualF.toLocaleString('vi-VN')}đ do vi phạm trật tự vỉa hè!`, 7000);
          } else {
            showToast(res.message || '👮 CÔNG AN NHẮC NHỞ: Lần này bạn không bị phạt tiền!', 5000);
          }
          state.storeState = await window.API.getState();
          updateUI();
        }
      } catch (err) {
        console.error('Police fine error:', err);
      }
    };

    // Canvas Callback when Thief snatches pet
    state.canvas.onPetStolen = async () => {
      if (window.sound) window.sound.fail();
      try {
        const res = await window.API.stealPet();
        if (res && res.success) {
          state.storeState = await window.API.getState();
          updateUI();
          const modalPetStolen = document.getElementById('modal-pet-stolen');
          if (modalPetStolen) modalPetStolen.style.display = 'flex';
          const rCost = res.ransomCost || 900000;
          showToast(`🚨 KẺ GIAN ĐÃ CÂU MẤT THÚ CƯNG! Tiền chuộc: ${rCost.toLocaleString('vi-VN')}đ (50% giá mua)!`, 6000);
        }
      } catch (err) {
        console.error('Steal pet error:', err);
      }
    };
  }

  // Pet Redeem modal button listeners
  const btnRedeemModal = document.getElementById('btn-redeem-pet-modal');
  if (btnRedeemModal) btnRedeemModal.addEventListener('click', handleRedeemPet);

  const btnRedeemShop = document.getElementById('btn-redeem-pet-shop');
  if (btnRedeemShop) btnRedeemShop.addEventListener('click', handleRedeemPet);

  const btnClosePetStolen = document.getElementById('btn-close-pet-stolen');
  if (btnClosePetStolen) {
    btnClosePetStolen.addEventListener('click', () => {
      const modalPetStolen = document.getElementById('modal-pet-stolen');
      if (modalPetStolen) modalPetStolen.style.display = 'none';
    });
  }

  // Periodic thief spawn check when busy
  setInterval(checkThiefEncounter, 14000);

  // TikToker modal listeners
  const modalTiktoker = document.getElementById('modal-tiktoker');
  const navInviteTiktoker = document.getElementById('nav-invite-tiktoker');
  const btnInviteBanner = document.getElementById('btn-invite-tiktoker-banner');
  const closeTiktoker = document.getElementById('close-tiktoker');
  const btnConfirmInviteTiktoker = document.getElementById('btn-confirm-invite-tiktoker');

  if (navInviteTiktoker) {
    navInviteTiktoker.addEventListener('click', () => {
      renderTiktokerModal();
      if (modalTiktoker) modalTiktoker.style.display = 'flex';
    });
  }

  if (btnInviteBanner) {
    btnInviteBanner.addEventListener('click', () => {
      renderTiktokerModal();
      if (modalTiktoker) modalTiktoker.style.display = 'flex';
    });
  }

  if (closeTiktoker) {
    closeTiktoker.addEventListener('click', () => {
      if (modalTiktoker) modalTiktoker.style.display = 'none';
    });
  }

  if (btnConfirmInviteTiktoker) {
    btnConfirmInviteTiktoker.addEventListener('click', async () => {
      btnConfirmInviteTiktoker.disabled = true;
      btnConfirmInviteTiktoker.innerText = 'Đang gửi lời mời... 📱';
      try {
        const res = await window.API.inviteTiktoker();
        if (res && res.success) {
          if (window.sound) window.sound.coin();
          showToast(res.message, 5000);
          if (modalTiktoker) modalTiktoker.style.display = 'none';
          state.storeState = await window.API.getState();
          updateUI();
          renderTiktokerModal();
          // Schedule immediate arrival of Tú (TikToker)!
          scheduleNextOrder(1000);
        } else {
          showToast('❌ ' + (res.message || 'Không thể mời TikToker lúc này!'));
          renderTiktokerModal();
        }
      } catch (err) {
        console.error('Invite tiktoker error:', err);
        showToast('❌ Lỗi kết nối khi gửi lời mời!');
        renderTiktokerModal();
      }
    });
  }

  // Scene quick nav & drag-to-scroll controls
  const sceneWrapper = document.getElementById('scene-wrapper');
  const btnSceneMain = document.getElementById('btn-scene-main');
  const btnSceneCollabs = document.getElementById('btn-scene-collabs');

  if (sceneWrapper) {
    if (btnSceneMain) {
      btnSceneMain.addEventListener('click', (e) => {
        e.stopPropagation();
        sceneWrapper.scrollTo({ left: 0, behavior: 'smooth' });
      });
    }

    if (btnSceneCollabs) {
      btnSceneCollabs.addEventListener('click', (e) => {
        e.stopPropagation();
        sceneWrapper.scrollTo({ left: sceneWrapper.scrollWidth - sceneWrapper.clientWidth, behavior: 'smooth' });
      });
    }

    // Mouse drag-to-scroll on desktop
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    sceneWrapper.addEventListener('mousedown', (e) => {
      if (e.target.closest('#scene-nav-controls')) return;
      isDown = true;
      startX = e.pageX - sceneWrapper.offsetLeft;
      scrollLeft = sceneWrapper.scrollLeft;
    });

    sceneWrapper.addEventListener('mouseleave', () => {
      isDown = false;
    });

    sceneWrapper.addEventListener('mouseup', () => {
      isDown = false;
    });

    sceneWrapper.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - sceneWrapper.offsetLeft;
      const walk = (x - startX) * 1.5;
      sceneWrapper.scrollLeft = scrollLeft - walk;
    });
  }
}

