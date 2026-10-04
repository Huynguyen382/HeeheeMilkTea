// Main Game Application Controller
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = new GameCanvas('scene');
  
  // Game State
  let storeState = null;
  let orderQueue = [];
  let currentOrder = null;
  let orderTimerInterval = null;
  let restTimerInterval = null;
  let nextOrderTimeout = null;
  let isGamePaused = false;
  let pauseStartTime = 0;
  let totalWavePausedTime = 0;
  let orderStartTime = 0;
  
  // Mixing & Workflow Selection State
  let selectedTea = 'den';
  let selectedSugar = '50%';
  let selectedIce = 'Vừa đá';
  let selectedToppings = [];
  let isShaken = false;
  let isPoured = false;
  let isSealed = false;

  // DOM Elements
  const elStoreName = document.getElementById('store-name');
  const elStoreCode = document.getElementById('store-code');
  const elMoney = document.getElementById('stat-money');
  const elDebt = document.getElementById('stat-debt');
  const elRep = document.getElementById('stat-rep');
  const elDay = document.getElementById('stat-day');
  const elChapter = document.getElementById('stat-chapter');
  const elUserBadge = document.getElementById('user-badge');
  const elBtnLogout = document.getElementById('btn-logout');

  const elCapEarned = document.getElementById('cap-earned');
  const elCapMax = document.getElementById('cap-max');
  const elCapFill = document.getElementById('cap-progress-fill');
  const elOverloadWarning = document.getElementById('overload-warning');

  const elOrderSection = document.getElementById('order-content');
  const elBtnShaker = document.getElementById('btn-shaker');
  const elBtnPourCup = document.getElementById('btn-pour-cup');
  const elBtnSealCup = document.getElementById('btn-seal-cup');
  const elBtnServe = document.getElementById('btn-serve');
  const toast = document.getElementById('toast');

  // Auth Modal Elements
  const modalAuth = document.getElementById('modal-auth');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const authError = document.getElementById('auth-error');

  // Helper Toast Notification
  function showToast(msg, duration = 3000) {
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, duration);
  }

  // Centralized Modal & Pause State Controller
  function isAnyModalOpen() {
    return [...document.querySelectorAll('.modal-overlay')]
      .some(modal => modal.id !== 'modal-auth' && getComputedStyle(modal).display !== 'none');
  }

  function syncGamePauseState() {
    const modalOpen = isAnyModalOpen();
    const hasClass = document.body.classList.contains('modal-open');
    if (hasClass !== modalOpen) {
      document.body.classList.toggle('modal-open', modalOpen);
    }

    if (modalOpen) {
      if (!isGamePaused) {
        isGamePaused = true;
        pauseStartTime = Date.now();
        if (nextOrderTimeout) {
          clearTimeout(nextOrderTimeout);
          nextOrderTimeout = null;
        }
      }
    } else {
      if (isGamePaused) {
        // If rest overlay is active, startRestCountdown manages its own timer
        const overlayResting = document.getElementById('overlay-resting');
        if (overlayResting && getComputedStyle(overlayResting).display !== 'none') {
          return;
        }

        if (pauseStartTime > 0) {
          const pausedDuration = Date.now() - pauseStartTime;
          if (pausedDuration > 0) {
            orderStartTime += pausedDuration;
            totalWavePausedTime += pausedDuration;
          }
          pauseStartTime = 0;
        }
        isGamePaused = false;

        // If no active customer and queue empty, resume order scheduling
        if (!currentOrder && (!orderQueue || orderQueue.length === 0)) {
          scheduleNextOrder(1500);
        }
      }
    }
  }

  const modalObserver = new MutationObserver(syncGamePauseState);
  modalObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], subtree: true });
  syncGamePauseState();

  // Allow clicking modal backdrop to close non-critical modals
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && overlay.id !== 'modal-auth' && overlay.id !== 'overlay-resting' && overlay.id !== 'modal-jail') {
        overlay.style.display = 'none';
      }
    });
  });

  // 1. Initialize or Load Store
  async function initStore() {
    setupAuthEvents();

    if (API.token) {
      const res = await API.getMe();
      if (res && res.success && res.state) {
        storeState = res.state;
        modalAuth.style.display = 'none';
        updateUI();

        if (storeState.save && storeState.save.is_jailed === 1) {
          showJailModal(storeState.save.jail_reason);
          return;
        }

        if (checkRestStatus(storeState.save)) {
          return;
        }

        // Auto-show story for new player
        const storySeenKey = 'heehee_story_seen_' + (storeState.store_code || 'guest');
        if (!localStorage.getItem(storySeenKey)) {
          openStoryModal(0, storeState.save.chapter || 1);
          localStorage.setItem(storySeenKey, 'true');
        }

        scheduleNextOrder(1500);
        return;
      } else {
        // Token invalid or session expired: clear stored token
        API.token = null;
        localStorage.removeItem('hyhy_session_token');
      }
    }

    // No valid token: open Auth modal
    modalAuth.style.display = 'flex';
  }

  function setupAuthEvents() {
    // Switch to Login Tab
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabLogin.style.color = 'var(--gold)';
      tabLogin.style.borderBottom = '2px solid var(--gold)';
      tabRegister.classList.remove('active');
      tabRegister.style.color = 'var(--text-muted)';
      tabRegister.style.borderBottom = 'none';
      formLogin.style.display = 'flex';
      formRegister.style.display = 'none';
      authError.style.display = 'none';
    });

    // Switch to Register Tab
    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabRegister.style.color = 'var(--gold)';
      tabRegister.style.borderBottom = '2px solid var(--gold)';
      tabLogin.classList.remove('active');
      tabLogin.style.color = 'var(--text-muted)';
      tabLogin.style.borderBottom = 'none';
      formRegister.style.display = 'flex';
      formLogin.style.display = 'none';
      authError.style.display = 'none';
    });

    // Handle Login Submit
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      authError.style.display = 'none';
      const account = document.getElementById('login-account').value;
      const password = document.getElementById('login-password').value;

      const res = await API.authLogin(account, password);
      if (res && res.success) {
        sound.bell();
        storeState = res.state;
        modalAuth.style.display = 'none';
        showToast(res.message, 3500);
        updateUI();

        const storySeenKey = 'heehee_story_seen_' + (storeState.store_code || 'guest');
        if (!localStorage.getItem(storySeenKey)) {
          openStoryModal(0, storeState.save ? storeState.save.chapter : 1);
          localStorage.setItem(storySeenKey, 'true');
        }

        scheduleNextOrder(1500);
      } else {
        sound.fail();
        let errMsg = res.message || res.error || 'Đăng nhập không thành công!';
        if (errMsg.includes('không tồn tại')) {
          errMsg += ' (Nếu là người chơi mới, bạn hãy chọn tab "Đăng Ký Mới" hoặc nút "Chơi Ngay" bên dưới)';
        }
        authError.innerText = errMsg;
        authError.style.display = 'block';
      }
    });

    // Handle Register Submit
    // Quick Play (Chơi ngay với tài khoản khách)
    const btnQuickPlay = document.getElementById('btn-quick-play');
    if (btnQuickPlay) {
      btnQuickPlay.addEventListener('click', async () => {
        btnQuickPlay.disabled = true;
        btnQuickPlay.innerText = 'Đang Vào Quán... 🧋';
        try {
          const res = await API.login('Tiệm Trà Sữa HeeHee');
          if (res && (res.session_token || res.save)) {
            sound.bell();
            storeState = res;
            modalAuth.style.display = 'none';
            showToast('🎉 Chào mừng bạn đến với Tiệm Trà Sữa HeeHee!', 3500);
            updateUI();

            const storySeenKey = 'heehee_story_seen_' + (storeState.store_code || 'guest');
            if (!localStorage.getItem(storySeenKey)) {
              openStoryModal(0, storeState.save ? storeState.save.chapter : 1);
              localStorage.setItem(storySeenKey, 'true');
            }

            scheduleNextOrder(1500);
          } else {
            sound.fail();
            authError.innerText = res.error || res.message || 'Không thể tạo phiên chơi nhanh';
            authError.style.display = 'block';
            btnQuickPlay.disabled = false;
            btnQuickPlay.innerText = '⚡ Chơi Ngay (Không Cần Đăng Ký)';
          }
        } catch (err) {
          sound.fail();
          authError.innerText = 'Lỗi kết nối máy chủ!';
          authError.style.display = 'block';
          btnQuickPlay.disabled = false;
          btnQuickPlay.innerText = '⚡ Chơi Ngay (Không Cần Đăng Ký)';
        }
      });
    }

    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      authError.style.display = 'none';
      const username = document.getElementById('reg-username').value;
      const storeName = document.getElementById('reg-storename').value;
      const password = document.getElementById('reg-password').value;

      const res = await API.authRegister(username, password, storeName);
      if (res && res.success) {
        sound.coin();
        storeState = res.state;
        modalAuth.style.display = 'none';
        showToast(res.message, 4000);
        updateUI();

        const storySeenKey = 'heehee_story_seen_' + (storeState.store_code || 'guest');
        openStoryModal(0, 1);
        localStorage.setItem(storySeenKey, 'true');

        scheduleNextOrder(2500);
      } else {
        sound.fail();
        authError.innerText = res.message || 'Đăng ký không thành công!';
        authError.style.display = 'block';
      }
    });

    // Logout
    elBtnLogout.addEventListener('click', async () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi quán trà sữa không?')) {
        await API.authLogout();
        if (orderTimerInterval) clearInterval(orderTimerInterval);
        currentOrder = null;
        renderOrderTicket();
        modalAuth.style.display = 'flex';
        showToast('Đã đăng xuất an toàn.');
      }
    });
  }

  // Check real-world resting countdown (End Shift 2 minutes or Snack Bellyache 15 minutes)
  function checkRestStatus(save) {
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

  function startRestCountdown(restUntil, reason = 'snack_sick') {
    isGamePaused = true;
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

    if (orderTimerInterval) clearInterval(orderTimerInterval);
    if (restTimerInterval) clearInterval(restTimerInterval);
    if (nextOrderTimeout) clearTimeout(nextOrderTimeout);

    currentOrder = null;
    orderQueue = [];
    canvas.setCustomerQueue([]);
    renderOrderTicket();

    function updateTimer() {
      const remainingSec = Math.max(0, Math.ceil((restUntil - Date.now()) / 1000));
      const m = Math.floor(remainingSec / 60).toString().padStart(2, '0');
      const s = (remainingSec % 60).toString().padStart(2, '0');
      if (disp) disp.innerText = `${m}:${s}`;

      if (remainingSec <= 0) {
        clearInterval(restTimerInterval);
        isGamePaused = false;
        if (overlay) overlay.style.display = 'none';
        sound.bell();
        if (isEndShift) {
          const nextDay = storeState && storeState.save ? storeState.save.day_in_game : '';
          showToast(`🌅 Chào mừng Ngày ${nextDay}! HeeHee đã tràn đầy năng lượng, quán bắt đầu mở cửa đón khách!`, 5000);
        } else {
          showToast('✨ HeeHee đã khỏe lại rồi! Tiệm trà sữa mở cửa đón khách tiếp!', 4000);
        }
        scheduleNextOrder(2000);
      }
    }

    updateTimer();
    restTimerInterval = setInterval(updateTimer, 1000);
  }

  // Update active buffs banner
  function updateBuffsUI(buffs) {
    const bar = document.getElementById('active-buffs-bar');
    const bTiktok = document.getElementById('buff-tiktoker');
    const bFlop = document.getElementById('buff-tiktoker-flop');
    const bPatience = document.getElementById('buff-patience');
    const bTip = document.getElementById('buff-tip');

    if (!bar) return;
    if (!buffs) {
      bar.style.display = 'none';
      return;
    }

    let hasAny = false;
    if (buffs.tiktoker_status === 'viral') {
      bTiktok.style.display = 'inline-block';
      const earned = buffs.tiktoker_earned || 0;
      const target = buffs.tiktoker_target || (buffs.tiktoker_cost ? buffs.tiktoker_cost * 3 : 75000);
      const percent = Math.min(100, Math.round((earned / target) * 100));
      bTiktok.innerText = `🔥 Bão Khách TikToker (${percent}%: ${earned.toLocaleString('vi-VN')}đ / ${target.toLocaleString('vi-VN')}đ - x3 Vốn)`;
      bFlop.style.display = 'none';
      hasAny = true;
    } else if (buffs.tiktoker_status === 'flop') {
      bFlop.style.display = 'inline-block';
      bFlop.innerText = `📉 Bị Bóc Phốt (${buffs.tiktoker_waves || 1} đợt: Khách Vắng)`;
      bTiktok.style.display = 'none';
      hasAny = true;
    } else {
      bTiktok.style.display = 'none';
      bFlop.style.display = 'none';
    }

    if (buffs.patience_boost && buffs.patience_boost > 0) {
      bPatience.style.display = 'inline-block';
      bPatience.innerText = `⏱️ Khách Kiên Nhẫn +40% (${buffs.patience_boost} đơn)`;
      hasAny = true;
    } else {
      bPatience.style.display = 'none';
    }

    if (buffs.tip_bonus && buffs.tip_bonus > 0) {
      bTip.style.display = 'inline-block';
      bTip.innerText = `💰 Tip Thưởng +10% (${buffs.tip_bonus} đơn)`;
      hasAny = true;
    } else {
      bTip.style.display = 'none';
    }

    bar.style.display = hasAny ? 'flex' : 'none';
  }

  // Shipper Snack Invitation Modal
  function showSnackModal(snackEvent) {
    const modal = document.getElementById('modal-snack');
    document.getElementById('snack-icon').innerText = snackEvent.snackIcon || '🥡';
    document.getElementById('snack-title').innerText = snackEvent.snackName;
    document.getElementById('snack-quote').innerText = `"${snackEvent.offerQuote}"`;
    modal.style.display = 'flex';

    document.getElementById('btn-eat-snack').onclick = async () => {
      modal.style.display = 'none';
      const res = await API.snackDecision(true);
      if (res.outcome === 'good') {
        sound.coin();
        showToast(res.message, 5000);
        storeState = await API.getState();
        updateUI();
      } else if (res.outcome === 'bad') {
        sound.fail();
        showToast(res.message, 6000);
        storeState = await API.getState();
        updateUI();
        startRestCountdown(res.restUntil);
      }
    };

    document.getElementById('btn-refuse-snack').onclick = async () => {
      modal.style.display = 'none';
      const res = await API.snackDecision(false);
      showToast(res.message, 4000);
    };
  }

  // Update HUD and stats
  function updateUI() {
    if (!storeState) return;
    const save = storeState.save;
    const daily = storeState.daily_stats;

    elStoreName.innerHTML = `<span class="header-icon">🧋</span> <span class="store-name-text">${storeState.store_name}</span>`;
    elStoreCode.innerText = storeState.store_code;
    elUserBadge.innerText = '👤 ' + (storeState.username || 'HeeHee');
    elMoney.innerText = save.money.toLocaleString('vi-VN') + 'đ';
    elDebt.innerText = save.debt_remaining.toLocaleString('vi-VN') + 'đ';
    elRep.innerText = save.reputation.toFixed(1) + '⭐';
    elDay.innerText = save.day_in_game;
    elChapter.innerText = save.chapter;

    // Low Reputation Warning (< 3.0⭐)
    const lowRepBanner = document.getElementById('low-rep-banner');
    if (lowRepBanner) {
      lowRepBanner.style.display = (save.reputation < 3.0) ? 'flex' : 'none';
    }
    if (save.reputation < 3.0) {
      elRep.style.color = '#ff5555';
    } else {
      elRep.style.color = 'var(--gold)';
    }

    // Today Earnings (Unlimited) & Time of Day badge
    if (elCapEarned) elCapEarned.innerText = (daily.earned_today || 0).toLocaleString('vi-VN') + 'đ';
    const elTimeBadge = document.getElementById('time-of-day-badge');
    if (elTimeBadge && canvas && canvas.getTimeOfDayLabel) {
      elTimeBadge.innerText = canvas.getTimeOfDayLabel();
    }

    // Active buffs
    updateBuffsUI(save.active_buffs);

    // TikToker Banner Button
    const btnInviteBanner = document.getElementById('btn-invite-tiktoker-banner');
    if (btnInviteBanner) {
      const buffs = save.active_buffs || {};
      const daily = buffs.tiktoker_daily || { day: save.day_in_game, count: 0, nextCost: 25000 };
      if (buffs.tiktoker_status === 'viral') {
        btnInviteBanner.style.display = 'none';
      } else if (daily.count >= 2) {
        btnInviteBanner.style.display = 'inline-block';
        btnInviteBanner.innerText = '📣 TikToker (2/2 lần)';
        btnInviteBanner.style.opacity = '0.6';
      } else if (daily.count === 0) {
        btnInviteBanner.style.display = 'inline-block';
        btnInviteBanner.innerText = '📣 Mời TikToker (25k)';
        btnInviteBanner.style.opacity = '1';
      } else {
        btnInviteBanner.style.display = 'inline-block';
        const costM = ((daily.nextCost || 2000000) / 1000000).toFixed(1);
        btnInviteBanner.innerText = `📣 Mời TikToker (${costM}Tr)`;
        btnInviteBanner.style.opacity = '1';
      }
    }

    if (typeof renderTiktokerModal === 'function') {
      renderTiktokerModal();
    }

    // Queue Indicator
    const elQueueInd = document.getElementById('queue-indicator');
    const elQueueText = document.getElementById('queue-text');
    if (orderQueue && orderQueue.length > 1) {
      elQueueInd.style.display = 'block';
      const remainingNames = orderQueue.slice(1).map(o => o.customerName).join(' · ');
      elQueueText.innerText = `${orderQueue.length - 1} khách đang chờ sau: ${remainingNames}`;
    } else {
      elQueueInd.style.display = 'none';
    }

    // Sync Pet System State to Canvas & Shop UI
    if (save.upgrades) {
      canvas.setActivePet(save.upgrades.active_pet || null, !!save.upgrades.is_pet_stolen);
    }

    const petStolenBanner = document.getElementById('pet-stolen-banner');
    if (petStolenBanner) {
      petStolenBanner.style.display = (save.upgrades && save.upgrades.is_pet_stolen) ? 'block' : 'none';
      if (save.upgrades && save.upgrades.is_pet_stolen) {
        const petCosts = { corgi: 1800000, meo_tam_the: 3200000, capybara: 5500000 };
        const activePetKey = save.upgrades.active_pet;
        const petCost = activePetKey ? (petCosts[activePetKey] || 1800000) : 1800000;
        const ransomCost = save.upgrades.ransom_cost || Math.floor(petCost * 0.5);

        const btnRedeemShop = document.getElementById('btn-redeem-pet-shop');
        if (btnRedeemShop) {
          btnRedeemShop.innerText = `💰 Chuộc Lại Thú Cưng (${ransomCost.toLocaleString('vi-VN')}đ - 50%)`;
        }
        const btnRedeemModal = document.getElementById('btn-redeem-pet-modal');
        if (btnRedeemModal) {
          btnRedeemModal.innerText = `💰 Nộp Tiền Chuộc Bé Về (${ransomCost.toLocaleString('vi-VN')}đ - 50%)`;
        }
      }
    }

    // Update Upgrade, Pet & Recipe buttons in Upgrade Modal
    document.querySelectorAll('[data-buy-upgrade]').forEach(btn => {
      const upId = btn.getAttribute('data-buy-upgrade');
      const recId = upId.startsWith('recipe_') ? upId.replace('recipe_', '') : null;
      const isOwned = (save.upgrades && save.upgrades[upId]) || (recId && save.recipes && save.recipes.includes(recId));

      if (isOwned) {
        if (upId.startsWith('pet_')) {
          if (save.upgrades && save.upgrades.active_pet === upId) {
            btn.innerText = save.upgrades.is_pet_stolen ? 'Đang Bị Bắt Cóc 🚨' : 'Đang Giữ Quán 🐾';
          } else {
            btn.innerText = 'Đã Sở Hữu ✅';
          }
        } else if (upId.startsWith('recipe_')) {
          btn.innerText = 'Đã Thêm Vào Menu ✅';
          btn.style.background = '#27ae60';
        } else {
          btn.innerText = 'Đã Sở Hữu ✅';
        }
        btn.disabled = true;
      }
    });

    // Sync drink preview to canvas
    canvas.setDrinkPreview({
      tea: selectedTea,
      toppings: selectedToppings
    });
  }

  // 2. Customer Wave & Order Generation
  async function scheduleNextOrder(delay = 4000) {
    if (nextOrderTimeout) clearTimeout(nextOrderTimeout);
    if (isGamePaused) return;

    nextOrderTimeout = setTimeout(async () => {
      if (isGamePaused) return;
      if (currentOrder || (orderQueue && orderQueue.length > 0)) return;
      
      const res = await API.getOrder();
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

      // Wave with 1 to 4 customers
      if (res.order.orders && res.order.orders.length > 0) {
        totalWavePausedTime = 0;
        orderQueue = res.order.orders;
        canvas.setCustomerQueue(orderQueue);
        startNextOrderInQueue();
      } else {
        scheduleNextOrder(4000);
      }
    }, delay);
  }

  function startNextOrderInQueue() {
    if (!orderQueue || orderQueue.length === 0) {
      currentOrder = null;
      renderOrderTicket();
      updateUI();
      const save = storeState ? (storeState.save || storeState) : {};
      const buffs = save.active_buffs || {};
      const isViral = buffs.tiktoker_status === 'viral';
      const isBigCampaign = isViral && (buffs.tiktoker_cost || 0) >= 1000000;
      scheduleNextOrder(isBigCampaign ? 1200 : (isViral ? 2000 : 3000));
      return;
    }

    currentOrder = orderQueue[0];
    orderStartTime = Date.now();
    sound.bell();

    // Reset workflow state for new drink
    isShaken = false;
    isPoured = false;
    isSealed = false;
    if (workstation) workstation.resetCupState();
    updateWorkflowButtons();

    renderOrderTicket();
    updateUI();
    checkThiefEncounter();

    // Patience countdown
    const duration = currentOrder.patienceMs || 22000;
    const interval = 100;
    let elapsed = 0;

    if (orderTimerInterval) clearInterval(orderTimerInterval);
    orderTimerInterval = setInterval(() => {
      const timerFill = document.getElementById('order-timer-fill');
      if (isGamePaused) {
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
        if (remainingPct < 30) {
          timerFill.style.backgroundColor = '#d9383a';
        } else if (remainingPct < 60) {
          timerFill.style.backgroundColor = '#f4c430';
        }
      }

      if (elapsed >= duration) {
        clearInterval(orderTimerInterval);
        handleOrderTimeout();
      }
    }, interval);
  }

  async function handleOrderTimeout() {
    sound.fail();
    canvas.triggerFailEffects();
    const failedCust = currentOrder;
    const isTiktoker = failedCust ? !!failedCust.isTiktoker : false;

    showToast(`❌ Khách hàng [${failedCust ? failedCust.customerName : 'Khách'}] sốt ruột bỏ đi vì đợi quá lâu!`);

    if (failedCust) {
      const failRes = await API.reportOrderFail(failedCust.orderId, isTiktoker);
      if (failRes && failRes.tiktokerFlop) {
        showToast(failRes.message, 6000);
        storeState = await API.getState();
        updateUI();
      }
    }

    orderQueue.shift();
    currentOrder = null;
    isShaken = false;
    isPoured = false;
    isSealed = false;
    if (workstation) workstation.resetCupState();
    renderOrderTicket();
    updateWorkflowButtons();
    updateUI();

    setTimeout(() => {
      if (orderQueue.length > 0) {
        startNextOrderInQueue();
      } else {
        const save = storeState ? (storeState.save || storeState) : {};
        const buffs = save.active_buffs || {};
        const isViral = buffs.tiktoker_status === 'viral';
        const isBigCampaign = isViral && (buffs.tiktoker_cost || 0) >= 1000000;
        scheduleNextOrder(isBigCampaign ? 1500 : (isViral ? 2200 : 3500));
      }
    }, 1000);
  }

  // --- WORKFLOW 4-STEP MANAGEMENT: 1. LẮC BÌNH -> 2. RÓT CỐC -> 3. DẬP NẮP -> 4. GIAO LY ---
  function updateWorkflowButtons() {
    const hasOrder = !!currentOrder;

    // Step 1: 1. Lắc Bình
    if (!isShaken) {
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
    } else if (!isPoured) {
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
    } else if (!isSealed) {
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

  const TOPPING_LABELS = {
    tranchau_den: '⚫ Trân Châu Đen',
    thach_la_dua: '🍃 Thạch Lá Dứa',
    tranchau_duongden: '🍯 Đường Đen',
    dao_mieng: '🍑 Đào Miếng',
    cam_vang: '🍊 Cam Vàng',
    sa_tuoi: '🌱 Sả Tươi',
    suong_sao: '🍮 Sương Sáo'
  };

  const TEA_LABELS = {
    den: '🍵 Trà Đen Đậm',
    thai_xanh: '🌿 Thái Xanh',
    sua_tuoi: '🥛 Sữa Tươi',
    lai: '🌸 Lục Trà Lài',
    olong_nuong: '🔥 Ô Long Nướng'
  };

  const RECIPE_TEA_MAP = {
    tra_sua_truyen_thong: { teaId: 'den', teaName: 'Trà Đen Đậm', icon: '🍵', btnLabel: 'Trà Đen Đậm' },
    hong_tra_tac: { teaId: 'den', teaName: 'Trà Đen Đậm', icon: '🍊', btnLabel: 'Trà Đen Đậm' },
    tra_thai_xanh: { teaId: 'thai_xanh', teaName: 'Thái Xanh', icon: '🌿', btnLabel: 'Thái Xanh' },
    sua_tuoi_duong_den: { teaId: 'sua_tuoi', teaName: 'Sữa Tươi', icon: '🥛', btnLabel: 'Sữa Tươi' },
    tra_dao_cam_sa: { teaId: 'lai', teaName: 'Lục Trà Lài', icon: '🌸', btnLabel: 'Lục Trà Lài' },
    tra_olong_nuong: { teaId: 'olong_nuong', teaName: 'Ô Long Nướng', icon: '🔥', btnLabel: 'Ô Long Nướng' }
  };

  function renderOrderTicket() {
    updateWorkflowButtons();
    if (!currentOrder) {
      elOrderSection.innerHTML = `<div class="order-box no-order">Đang ngóng chờ khách hàng tiếp theo ghé quầy... 🧋</div>`;
      return;
    }

    const orderToppingNames = (currentOrder.toppings && currentOrder.toppings.length > 0)
      ? currentOrder.toppings.map(t => TOPPING_LABELS[t] || t).join(' + ')
      : 'Không lấy topping';

    const teaGuide = RECIPE_TEA_MAP[currentOrder.recipeId] || {
      teaId: currentOrder.tea || 'den',
      teaName: currentOrder.tea === 'thai_xanh' ? 'Thái Xanh' : (currentOrder.tea === 'sua_tuoi' ? 'Sữa Tươi' : (currentOrder.tea === 'lai' ? 'Lục Trà Lài' : (currentOrder.tea === 'olong_nuong' ? 'Ô Long Nướng' : 'Trà Đen Đậm'))),
      icon: '🍵',
      btnLabel: 'Trà'
    };

    elOrderSection.innerHTML = `
      <div class="order-box">
        <div class="order-header">
          <span>👤 <b>${currentOrder.customerName}</b></span>
          <span style="color: #2e8b57; font-weight: bold;">+${currentOrder.price.toLocaleString('vi-VN')}đ</span>
        </div>
        <div style="font-style: italic; color: #ffffff; font-weight: 500; font-size: 0.95rem; margin: 3px 0 6px 0; background: #1c0e1a; border: 1px solid #57334d; border-left: 3px solid var(--gold); padding: 5px 8px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
          💬 "${currentOrder.quote || 'Pha chế ngon giùm mình nhé!'}"
        </div>
        <div style="font-weight: bold; font-size: 1.15rem; color: #8b4513;">
          🍹 ${currentOrder.recipeName}
        </div>
        <div style="background: rgba(80, 250, 123, 0.12); border: 1px dashed #50fa7b; border-radius: 6px; padding: 4px 8px; margin: 4px 0 6px 0; font-size: 0.88rem; display: flex; align-items: center; justify-content: space-between;">
          <span style="color: #ffb86c; font-weight: bold;">🍵 Cốt Trà Cần Chọn:</span>
          <span style="background: #1c0e1a; border: 1px solid #50fa7b; padding: 2px 7px; border-radius: 4px; font-weight: bold; color: #50fa7b;">
            ${teaGuide.icon} ${teaGuide.teaName}
          </span>
        </div>
        <div class="order-specs">
          <span class="spec-badge">Đường: <b>${currentOrder.sugar}</b></span>
          <span class="spec-badge">Đá: <b>${currentOrder.ice}</b></span>
          <span class="spec-badge" style="grid-column: 1 / -1; text-align: left;">Topping: <b>${orderToppingNames}</b></span>
        </div>
        <div class="patience-timer-bg">
          <div id="order-timer-fill" class="patience-timer-fill"></div>
        </div>
      </div>
    `;
  }

  // 3. Mixing Station & First-Person Barista Workstation Handlers
  const elMixTea = document.getElementById('mix-tea-name');
  const elMixSugar = document.getElementById('mix-sugar-val');
  const elMixIce = document.getElementById('mix-ice-val');
  const elMixTop = document.getElementById('mix-topping-val');

  function updateCupMonitor() {
    const teaNames = {
      den: 'Trà Đen Đậm',
      thai_xanh: 'Thái Xanh',
      sua_tuoi: 'Sữa Tươi',
      lai: 'Lục Trà Lài',
      olong_nuong: 'Ô Long Nướng'
    };
    if (elMixTea) elMixTea.innerText = teaNames[selectedTea] || 'Trà';
    if (elMixSugar) elMixSugar.innerText = selectedSugar;
    if (elMixIce) elMixIce.innerText = selectedIce;
    if (elMixTop) elMixTop.innerText = `${selectedToppings.length} loại`;
  }

  function updateMixingButtonsState() {
    // Sync active tea buttons
    document.querySelectorAll('[data-tea]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tea') === selectedTea);
    });

    // Sync active sugar buttons & pills
    document.querySelectorAll('[data-sugar]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-sugar') === selectedSugar);
    });
    const sugarBadge = document.getElementById('sugar-badge');
    if (sugarBadge) {
      sugarBadge.innerText = selectedSugar === '100%' ? '100% (Đầy)' : `${selectedSugar} Đường`;
    }
    const btnAddSugar = document.getElementById('btn-add-sugar');
    if (btnAddSugar) {
      const isMaxSugar = selectedSugar === '100%';
      btnAddSugar.classList.toggle('max-reached', isMaxSugar);
      btnAddSugar.title = isMaxSugar ? 'Đã đạt tối đa 100% đường' : 'Thêm muỗng đường vào bình lắc';
    }

    // Sync active ice buttons & pills
    document.querySelectorAll('[data-ice]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-ice') === selectedIce);
    });
    const iceBadge = document.getElementById('ice-badge');
    if (iceBadge) {
      iceBadge.innerText = selectedIce === 'Đầy đá' ? 'Đầy đá (Đầy)' : selectedIce;
    }
    const btnAddIce = document.getElementById('btn-add-ice');
    if (btnAddIce) {
      const isMaxIce = selectedIce === 'Đầy đá';
      btnAddIce.classList.toggle('max-reached', isMaxIce);
      btnAddIce.title = isMaxIce ? 'Đã đầy đá tối đa' : 'Dùng kẹp gắp thêm đá vào bình lắc';
    }

    // Sync active topping buttons
    document.querySelectorAll('[data-topping]').forEach(b => {
      const topKey = b.getAttribute('data-topping');
      b.classList.toggle('active', selectedToppings.includes(topKey));
    });

    updateCupMonitor();
  }

  // Initialize Barista Workstation
  let workstation = null;
  const workstationCanvas = document.getElementById('workstation-canvas');
  if (workstationCanvas && typeof BaristaWorkstation !== 'undefined') {
    workstation = new BaristaWorkstation('workstation-canvas', (st) => {
      selectedTea = st.tea;
      selectedSugar = st.sugar;
      selectedIce = st.ice;
      selectedToppings = [...st.toppings];
      updateMixingButtonsState();
      canvas.setDrinkPreview({ tea: selectedTea, toppings: selectedToppings });
    });
  }

  // Step-by-step Sugar (+1 level per drop, max 100%)
  const btnAddSugar = document.getElementById('btn-add-sugar');
  if (btnAddSugar) {
    btnAddSugar.addEventListener('click', () => {
      const steps = ['0%', '30%', '50%', '70%', '100%'];
      const idx = steps.indexOf(selectedSugar);
      if (idx >= steps.length - 1 || selectedSugar === '100%') {
        if (typeof showToast === 'function') {
          showToast('⚠️ Độ ngọt đã đạt mức tối đa (100%)!', 'warning');
        }
        return;
      }
      sound.pour();
      if (workstation) {
        selectedSugar = workstation.nextSugarStep();
      } else {
        selectedSugar = steps[idx + 1];
      }
      updateMixingButtonsState();
    });
  }

  // Step-by-step Ice (+1 level per scoop/cube, max Đầy đá)
  const btnAddIce = document.getElementById('btn-add-ice');
  if (btnAddIce) {
    btnAddIce.addEventListener('click', () => {
      const steps = ['Nóng', 'Ít đá', 'Vừa đá', 'Đầy đá'];
      const idx = steps.indexOf(selectedIce);
      if (idx >= steps.length - 1 || selectedIce === 'Đầy đá') {
        if (typeof showToast === 'function') {
          showToast('⚠️ Lượng đá đã đạt mức tối đa (Đầy đá)!', 'warning');
        }
        return;
      }
      sound.ice();
      if (workstation) {
        selectedIce = workstation.nextIceStep();
      } else {
        selectedIce = steps[idx + 1];
      }
      updateMixingButtonsState();
    });
  }

  // Quick Reset Cup Button
  const btnResetCup = document.getElementById('btn-reset-cup');
  if (btnResetCup) {
    btnResetCup.addEventListener('click', () => {
      sound.bell();
      if (workstation) {
        workstation.resetCup();
      } else {
        selectedTea = 'den';
        selectedSugar = '0%';
        selectedIce = 'Nóng';
        selectedToppings = [];
      }
      isShaken = false;
      isPoured = false;
      isSealed = false;
      updateWorkflowButtons();
      updateMixingButtonsState();
      canvas.setDrinkPreview({ tea: selectedTea, toppings: selectedToppings });
    });
  }

  // Tea Selection Buttons
  document.querySelectorAll('[data-tea]').forEach(btn => {
    btn.addEventListener('click', () => {
      const teaKey = btn.getAttribute('data-tea');
      sound.pour();
      selectedTea = teaKey;
      if (workstation) {
        workstation.setTea(teaKey);
      }
      updateMixingButtonsState();
      canvas.setDrinkPreview({ tea: selectedTea, toppings: selectedToppings });
    });
  });

  // Direct Sugar Selection Buttons & Pills
  document.querySelectorAll('[data-sugar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-sugar');
      sound.pour();
      selectedSugar = val;
      if (workstation) {
        workstation.setSugar(val);
      }
      updateMixingButtonsState();
    });
  });

  // Direct Ice Selection Buttons & Pills
  document.querySelectorAll('[data-ice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-ice');
      sound.ice();
      selectedIce = val;
      if (workstation) {
        workstation.setIce(val);
      }
      updateMixingButtonsState();
    });
  });

  // Topping Toggles
  document.querySelectorAll('[data-topping]').forEach(btn => {
    btn.addEventListener('click', () => {
      const top = btn.getAttribute('data-topping');
      sound.pour();
      if (workstation) {
        workstation.toggleTopping(top);
      } else {
        if (selectedToppings.includes(top)) {
          selectedToppings = selectedToppings.filter(t => t !== top);
        } else {
          selectedToppings.push(top);
        }
      }
      updateMixingButtonsState();
      canvas.setDrinkPreview({ tea: selectedTea, toppings: selectedToppings });
    });
  });

  // --- 4-STEP WORKFLOW HANDLERS ---
  // Step 1: Lắc Bình Pha Chế
  if (elBtnShaker) {
    elBtnShaker.addEventListener('click', () => {
      if (elBtnShaker.disabled) return;
      elBtnShaker.disabled = true;
      sound.shake();
      canvas.setShaking(true);
      if (workstation) {
        workstation.triggerHandAction('shake');
        workstation.addFloatingText('🍸 LẮC ĐỀU BÌNH PHA CHẾ! ✨', '#bd93f9');
      }
      const txt = elBtnShaker.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Lắc...';

      setTimeout(() => {
        canvas.setShaking(false);
        isShaken = true;
        updateWorkflowButtons();
        showToast('✨ Đã lắc đều! Hãy bấm [2. Rót Cốc] để đổ vào ly.', 2400);
      }, 1100);
    });
  }

  // Step 2: Rót Trà Sữa Vào Cốc
  if (elBtnPourCup) {
    elBtnPourCup.addEventListener('click', () => {
      if (elBtnPourCup.disabled) return;
      if (!isShaken) {
        showToast('Hãy bấm [1. Lắc Bình] trước!');
        return;
      }
      elBtnPourCup.disabled = true;
      sound.pour();
      if (workstation) {
        workstation.triggerHandAction('pour_cup');
        workstation.addFloatingText('🧋 RÓT TRÀ SỮA VÀO CỐC! ✨', '#f4c430');
      }
      const txt = elBtnPourCup.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Rót...';

      setTimeout(() => {
        isPoured = true;
        if (workstation) workstation.setCupState('filled');
        updateWorkflowButtons();
        showToast('✨ Đã rót đầy ly! Hãy bấm [3. Dập Nắp] để niêm phong miệng cốc.', 2500);
      }, 1150);
    });
  }

  // Step 3: Dập Nắp Miệng Cốc
  if (elBtnSealCup) {
    elBtnSealCup.addEventListener('click', () => {
      if (elBtnSealCup.disabled) return;
      if (!isPoured) {
        showToast('Hãy bấm [2. Rót Cốc] trước!');
        return;
      }
      elBtnSealCup.disabled = true;
      sound.seal();
      if (workstation) {
        workstation.triggerHandAction('seal_cup');
        workstation.addFloatingText('🖲️ DẬP NẮP NIÊM PHONG! 🔒', '#50fa7b');
      }
      const txt = elBtnSealCup.querySelector('.wf-text');
      if (txt) txt.innerText = 'Đang Dập...';

      setTimeout(() => {
        isSealed = true;
        if (workstation) workstation.setCupState('sealed');
        updateWorkflowButtons();
        showToast('🎉 Đã dập nắp hoàn chỉnh! Bấm [GIAO LY (SERVE)] cho khách nào!', 2600);
      }, 1100);
    });
  }

  // Step 4: Giao Ly (Serve Drink Action)
  elBtnServe.addEventListener('click', async () => {
    if (!currentOrder) return;
    if (!isShaken) {
      showToast('Hãy bấm [1. Lắc Bình] để trộn đều nguyên liệu!');
      return;
    }
    if (!isPoured) {
      showToast('Hãy bấm [2. Rót Cốc] để đổ trà sữa vào cốc!');
      return;
    }
    if (!isSealed) {
      showToast('Hãy bấm [3. Dập Nắp] để niêm phong ly trước khi giao!');
      return;
    }
    // Kiểm tra topping với yêu cầu của khách
    const requiredToppings = currentOrder.toppings || [];
    const normRequired = [...requiredToppings].sort().join(',');
    const normSelected = [...selectedToppings].sort().join(',');

    if (normRequired !== normSelected) {
      sound.fail();
      elBtnServe.disabled = false;
      const reqNames = requiredToppings.length > 0 
        ? requiredToppings.map(t => TOPPING_LABELS[t] || t).join(' + ')
        : 'Không lấy topping';
      const curNames = selectedToppings.length > 0
        ? selectedToppings.map(t => TOPPING_LABELS[t] || t).join(' + ')
        : 'Không lấy topping';
      showToast(`⚠️ Topping chưa đúng! Khách gọi: [${reqNames}]. Bạn đang chọn: [${curNames}].`, 4000);
      return;
    }

    // Kiểm tra cốt trà với yêu cầu của món
    const expectedTea = RECIPE_TEA_MAP[currentOrder.recipeId]?.teaId || currentOrder.tea || 'den';
    if (selectedTea !== expectedTea) {
      sound.fail();
      elBtnServe.disabled = false;
      const expectedInfo = RECIPE_TEA_MAP[currentOrder.recipeId] || { teaName: 'Trà Đen Đậm', btnLabel: 'Trà Đen Đậm', icon: '🍵' };
      const curTeaName = TEA_LABELS[selectedTea] || selectedTea;
      showToast(`⚠️ Cốt trà chưa đúng! Món [${currentOrder.recipeName}] yêu cầu [${expectedInfo.icon} ${expectedInfo.teaName}]. Bạn đang chọn [${curTeaName}]. Hãy bấm chọn lại ở kệ 1!`, 4500);
      return;
    }

    elBtnServe.disabled = true;

    const timeTaken = Date.now() - orderStartTime;

    // Check recipe mapping from chosen tea
    let chosenRecipeId = 'tra_sua_truyen_thong';
    if (selectedTea === 'den') {
      if (currentOrder && currentOrder.recipeId === 'hong_tra_tac') {
        chosenRecipeId = 'hong_tra_tac';
      } else {
        chosenRecipeId = 'tra_sua_truyen_thong';
      }
    } else if (selectedTea === 'thai_xanh') chosenRecipeId = 'tra_thai_xanh';
    else if (selectedTea === 'sua_tuoi') chosenRecipeId = 'sua_tuoi_duong_den';
    else if (selectedTea === 'lai') chosenRecipeId = 'tra_dao_cam_sa';
    else if (selectedTea === 'olong_nuong') chosenRecipeId = 'tra_olong_nuong';

    sound.bell();

    try {
      const res = await API.serveOrder(
        currentOrder.orderId,
        timeTaken,
        chosenRecipeId,
        selectedSugar,
        selectedIce,
        selectedToppings,
        totalWavePausedTime
      );

      if (res && res.isJailed) {
        showJailModal(res.jailReason);
        return;
      }

      if (res && res.success) {
        sound.coin();
        clearInterval(orderTimerInterval);
        canvas.triggerSuccessEffects(res.payout);

        const collabExtra = res.collabBonus > 0 
          ? ` (+${res.collabBonusPercent}% Collab: ${res.activeCollabs} quán)` 
          : '';

        if (workstation) {
          workstation.triggerHandAction('serve');
          workstation.addFloatingText(`✨ +${res.payout.toLocaleString('vi-VN')}đ${collabExtra}!`, '#50fa7b');
        }

        showToast(`🎉 Giao thành công! Nhận +${res.payout.toLocaleString('vi-VN')}đ${collabExtra}`);

        if (res.tiktokerViral) {
          setTimeout(() => {
            showToast(`🔥 VIDEO TIKTOK CỦA TÚ VIRAL TRIỆU VIEW! Lượng khách kéo đến nườm nượp!`, 6000);
          }, 800);
        }

        if (res.tiktokerGoalReached) {
          setTimeout(() => {
            sound.coin();
            showToast(res.message || `🎉 CHÚC MỪNG! Quán đã đạt doanh thu gấp 3 LẦN vốn từ chiến dịch TikToker!`, 7000);
          }, 1200);
        }

        // Refresh store state
        storeState = await API.getState();
        updateUI();

        orderQueue.shift();
        currentOrder = null;
        isShaken = false;
        isPoured = false;
        isSealed = false;
        if (workstation) {
          workstation.resetCup();
        } else {
          selectedTea = 'den';
          selectedSugar = '50%';
          selectedIce = 'Vừa đá';
          selectedToppings = [];
        }
        updateMixingButtonsState();
        renderOrderTicket();
        updateWorkflowButtons();

        // Progress through wave or schedule next wave
        setTimeout(() => {
          if (orderQueue.length > 0) {
            startNextOrderInQueue();
          } else {
            const save = storeState ? (storeState.save || storeState) : {};
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
        isShaken = false;
        isPoured = false;
        isSealed = false;
        if (workstation) workstation.resetCupState();
        updateWorkflowButtons();
        handleOrderTimeout();
      }
    } catch (err) {
      console.error('Serve order error:', err);
      elBtnServe.disabled = false;
    }
  });

  // 5. Anti-cheat Punishment Modal
  function showJailModal(reason) {
    sound.siren();
    const modal = document.getElementById('modal-jail');
    document.getElementById('jail-reason-text').innerText = reason || 'Phát hiện can thiệp dữ liệu trái phép';
    modal.style.display = 'flex';
  }

  document.getElementById('btn-close-jail').addEventListener('click', async () => {
    const btn = document.getElementById('btn-close-jail');
    btn.disabled = true;
    btn.innerText = 'Đang nộp phạt & mở niêm phong...';

    try {
      const res = await API.acceptPenalty();
      if (res && res.success) {
        document.getElementById('modal-jail').style.display = 'none';
        if (res.state) {
          storeState = res.state;
          updateUI();
        }
        showToast('Đã nộp phạt 50.000.000đ cho Quản lý thị trường! Xe đẩy đã được gỡ niêm phong! 🧋', 4000);
        sound.coin();

        // Reset order queue & customer canvas
        orderQueue = [];
        currentOrder = null;
        renderOrderTicket();
        canvas.setCustomer(false);
        scheduleNextOrder(1500);
      } else {
        showToast(res.message || 'Có lỗi xảy ra khi nộp phạt!');
        document.getElementById('modal-jail').style.display = 'none';
        location.reload();
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối máy chủ!');
      document.getElementById('modal-jail').style.display = 'none';
      location.reload();
    } finally {
      btn.disabled = false;
      btn.innerText = 'Chấp Nhận Phạt & Làm Lại Từ Đầu';
    }
  });

  // 6. Navigation Modals: Collab, Debt, Upgrades, Recipes, Anti-cheat demo
  setupModals();

  function setupModals() {
    // Collab Modal System
    const modalCollab = document.getElementById('modal-collab');
    const navCollab = document.getElementById('nav-collab');
    const closeCollab = document.getElementById('close-collab');

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
    }

    async function renderCollabModal() {
      if (!storeState) return;
      const myCodeInput = document.getElementById('my-collab-code');
      if (myCodeInput) myCodeInput.value = storeState.store_code || '';

      try {
        const res = await API.getCollabs();
        if (!res || !res.success) return;

        const countDisp = document.getElementById('collab-count-disp');
        const boostDisp = document.getElementById('collab-boost-disp');
        if (countDisp) countDisp.innerText = `${res.activeCount}/3 Quán`;
        if (boostDisp) boostDisp.innerText = `📈 Đang tăng: +${res.bonusPercent}% Doanh Thu`;

        // 1. Incoming Requests
        const incomingContainer = document.getElementById('collab-incoming-list');
        const incomingBadge = document.getElementById('incoming-count-badge');
        if (incomingContainer) {
          if (res.incomingRequests && res.incomingRequests.length > 0) {
            if (incomingBadge) {
              incomingBadge.innerText = res.incomingRequests.length;
              incomingBadge.style.display = 'inline-block';
            }
            incomingContainer.innerHTML = res.incomingRequests.map(req => `
              <div style="background: rgba(80, 250, 123, 0.08); border: 1px solid #50fa7b; border-radius: 6px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: bold; color: #50fa7b;">${escapeHtml(req.store_name)}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">Mã: ${escapeHtml(req.store_code)}</div>
                </div>
                <div style="display: flex; gap: 4px;">
                  <button class="btn-action-sm btn-accept-collab" data-id="${req.id}" style="background: #50fa7b; color: #000; padding: 4px 10px; font-size: 0.82rem; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;">✓ Chấp nhận</button>
                  <button class="btn-action-sm btn-decline-collab" data-id="${req.id}" style="background: #ff5555; color: #fff; padding: 4px 8px; font-size: 0.82rem; border-radius: 4px; border: none; cursor: pointer;">✕ Từ chối</button>
                </div>
              </div>
            `).join('');
          } else {
            if (incomingBadge) incomingBadge.style.display = 'none';
            incomingContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Không có lời mời nào đang chờ.</div>';
          }
        }

        // 2. Active Collabs
        const activeContainer = document.getElementById('collab-active-list');
        if (activeContainer) {
          if (res.activeCollabs && res.activeCollabs.length > 0) {
            activeContainer.innerHTML = res.activeCollabs.map(item => `
              <div style="background: rgba(139, 233, 253, 0.08); border: 1px solid #8be9fd; border-radius: 6px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: bold; color: #8be9fd;">🤝 ${escapeHtml(item.partner_name)}</div>
                  <div style="font-size: 0.78rem; color: #50fa7b; font-weight: bold;">+10% Doanh Thu • Mã: ${escapeHtml(item.partner_code)}</div>
                </div>
                <button class="btn-action-sm btn-unlink-collab" data-id="${item.id}" style="background: #4a5568; color: #fff; padding: 4px 8px; font-size: 0.78rem; border-radius: 4px; border: none; cursor: pointer;">Hủy</button>
              </div>
            `).join('');
          } else {
            activeContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Chưa có đối tác nào. Hãy gửi mã quán cho bạn bè!</div>';
          }
        }

        // 3. Outgoing Requests
        const outgoingContainer = document.getElementById('collab-outgoing-list');
        if (outgoingContainer) {
          if (res.outgoingRequests && res.outgoingRequests.length > 0) {
            outgoingContainer.innerHTML = res.outgoingRequests.map(req => `
              <div style="background: rgba(255, 184, 108, 0.08); border: 1px solid #ffb86c; border-radius: 6px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: bold; color: #ffb86c;">📤 ${escapeHtml(req.store_name)}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">Đang chờ phản hồi... (Mã: ${escapeHtml(req.store_code)})</div>
                </div>
                <button class="btn-action-sm btn-cancel-collab" data-id="${req.id}" style="background: #6272a4; color: #fff; padding: 4px 8px; font-size: 0.78rem; border-radius: 4px; border: none; cursor: pointer;">Thu hồi</button>
              </div>
            `).join('');
          } else {
            outgoingContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Không có lời mời nào đang chờ phản hồi.</div>';
          }
        }
      } catch (err) {
        console.error('Error rendering collab modal:', err);
      }
    }

    if (navCollab) {
      navCollab.addEventListener('click', () => {
        renderCollabModal();
        if (modalCollab) modalCollab.style.display = 'flex';
      });
    }

    if (closeCollab) {
      closeCollab.addEventListener('click', () => {
        if (modalCollab) modalCollab.style.display = 'none';
      });
    }

    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        if (storeState && storeState.store_code) {
          navigator.clipboard.writeText(storeState.store_code);
          showToast('Đã sao chép Mã Quán vào bộ nhớ tạm! Gửi cho bạn bè để mời Collab nhé.');
        }
      });
    }

    const btnSubmitCollab = document.getElementById('btn-submit-collab');
    if (btnSubmitCollab) {
      btnSubmitCollab.addEventListener('click', async () => {
        const input = document.getElementById('friend-code-input');
        const friendCode = input ? input.value.trim() : '';
        if (!friendCode) return showToast('Vui lòng nhập mã quán bạn bè!');

        btnSubmitCollab.disabled = true;
        btnSubmitCollab.innerText = 'Đang gửi...';

        try {
          const res = await API.collab(friendCode);
          if (res && res.success) {
            sound.coin();
            showToast(res.message, 5000);
            if (input) input.value = '';
            renderCollabModal();
            storeState = await API.getState();
            updateUI();
          } else {
            showToast('❌ ' + (res.message || 'Không thể gửi lời mời Collab!'));
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối máy chủ!');
        } finally {
          btnSubmitCollab.disabled = false;
          btnSubmitCollab.innerText = '📨 Gửi Lời Mời';
        }
      });
    }

    // Modal action delegation (Accept, Decline, Unlink, Cancel)
    if (modalCollab) {
      modalCollab.addEventListener('click', async (e) => {
        const btnAccept = e.target.closest('.btn-accept-collab');
        if (btnAccept) {
          const id = btnAccept.getAttribute('data-id');
          btnAccept.disabled = true;
          try {
            const res = await API.acceptCollab(id);
            if (res && res.success) {
              sound.coin();
              showToast(res.message, 5000);
              renderCollabModal();
              storeState = await API.getState();
              updateUI();
            } else {
              showToast('❌ ' + (res.message || 'Lỗi khi chấp nhận lời mời!'));
              btnAccept.disabled = false;
            }
          } catch (err) {
            showToast('❌ Lỗi kết nối!');
            btnAccept.disabled = false;
          }
          return;
        }

        const btnDecline = e.target.closest('.btn-decline-collab');
        if (btnDecline) {
          const id = btnDecline.getAttribute('data-id');
          btnDecline.disabled = true;
          try {
            const res = await API.declineCollab(id);
            if (res && res.success) {
              showToast(res.message, 3500);
              renderCollabModal();
            } else {
              showToast('❌ ' + (res.message || 'Lỗi khi từ chối!'));
              btnDecline.disabled = false;
            }
          } catch (err) {
            showToast('❌ Lỗi kết nối!');
            btnDecline.disabled = false;
          }
          return;
        }

        const btnUnlink = e.target.closest('.btn-unlink-collab');
        if (btnUnlink) {
          if (!confirm('Bạn có chắc chắn muốn hủy liên minh với đối tác này không? Sau khi hủy bạn sẽ mất +10% doanh thu tương ứng.')) return;
          const id = btnUnlink.getAttribute('data-id');
          btnUnlink.disabled = true;
          try {
            const res = await API.cancelCollab(id);
            if (res && res.success) {
              showToast(res.message, 4000);
              renderCollabModal();
              storeState = await API.getState();
              updateUI();
            } else {
              showToast('❌ ' + (res.message || 'Lỗi khi hủy liên kết!'));
              btnUnlink.disabled = false;
            }
          } catch (err) {
            showToast('❌ Lỗi kết nối!');
            btnUnlink.disabled = false;
          }
          return;
        }

        const btnCancel = e.target.closest('.btn-cancel-collab');
        if (btnCancel) {
          const id = btnCancel.getAttribute('data-id');
          btnCancel.disabled = true;
          try {
            const res = await API.cancelCollab(id);
            if (res && res.success) {
              showToast(res.message, 3500);
              renderCollabModal();
            } else {
              showToast('❌ ' + (res.message || 'Lỗi khi thu hồi lời mời!'));
              btnCancel.disabled = false;
            }
          } catch (err) {
            showToast('❌ Lỗi kết nối!');
            btnCancel.disabled = false;
          }
          return;
        }
      });
    }

    // Debt Modal
    const modalDebt = document.getElementById('modal-debt');
    document.getElementById('nav-debt').addEventListener('click', () => {
      document.getElementById('debt-remaining-disp').innerText = storeState.save.debt_remaining.toLocaleString('vi-VN') + 'đ';
      modalDebt.style.display = 'flex';
    });
    document.getElementById('close-debt').addEventListener('click', () => { modalDebt.style.display = 'none'; });

    document.getElementById('btn-pay-500k').addEventListener('click', async () => {
      const res = await API.payDebt(500000);
      handleDebtResult(res);
    });

    document.getElementById('btn-pay-all-debt').addEventListener('click', async () => {
      const res = await API.payDebt(storeState.save.debt_remaining);
      handleDebtResult(res);
    });

    async function handleDebtResult(res) {
      if (res.success) {
        sound.coin();
        showToast(res.message, 4500);
        const oldChapter = storeState.save ? storeState.save.chapter : 1;
        storeState = await API.getState();
        updateUI();
        modalDebt.style.display = 'none';

        if (res.debt_remaining === 0 && oldChapter === 1) {
          setTimeout(() => {
            openStoryModal(0, 2);
          }, 800);
        }
      } else {
        showToast('❌ ' + res.message);
      }
    }

    // Upgrades Modal
    const modalUpgrades = document.getElementById('modal-upgrades');
    document.getElementById('nav-upgrades').addEventListener('click', () => {
      modalUpgrades.style.display = 'flex';
    });
    document.getElementById('close-upgrades').addEventListener('click', () => { modalUpgrades.style.display = 'none'; });

    document.querySelectorAll('[data-buy-upgrade]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const upId = btn.getAttribute('data-buy-upgrade');
        const res = await API.buyUpgrade(upId);
        if (res.success) {
          sound.coin();
          showToast(res.message);
          btn.innerText = upId.startsWith('recipe_') ? 'Đã Thêm Vào Menu ✅' : 'Đã Sở Hữu ✅';
          if (upId.startsWith('recipe_')) btn.style.background = '#27ae60';
          btn.disabled = true;
          storeState = await API.getState();
          updateUI();
        } else {
          showToast('❌ ' + res.message);
        }
      });
    });

    // Advance Day
    const btnAdvanceDay = document.getElementById('nav-advance-day');
    if (btnAdvanceDay) {
      btnAdvanceDay.addEventListener('click', () => {
        if (typeof openEndShiftModal === 'function') {
          openEndShiftModal();
        }
      });
    }

    // Test Anti-cheat Demo Button
    document.getElementById('nav-test-hack').addEventListener('click', async () => {
      if (confirm('CẢNH BÁO THỬ NGHIỆM: Bạn đang chuẩn bị kích hoạt giả lập HACK TIỀN CLIENT. Hệ thống Anti-cheat của server sẽ phát hiện và tịch thu quán. Bạn có muốn thử nghiệm không?')) {
        const res = await API.testTamper();
        if (res.isJailed) {
          showJailModal(res.message);
        }
      }
    });

    // Sound & Playlist Controller
    const btnNavSound = document.getElementById('nav-sound');
    function updateSoundButtonUI(status) {
      if (!btnNavSound) return;
      if (status && status.enabled && status.track) {
        btnNavSound.innerHTML = `🎵 ${status.track.name}`;
        btnNavSound.style.color = '#50fa7b';
      } else {
        btnNavSound.innerHTML = '🔇 Nhạc: Tắt';
        btnNavSound.style.color = 'var(--text-muted)';
      }
    }

    if (btnNavSound) {
      const initialTrack = sound.getCurrentTrack();
      if (sound.bgmEnabled && initialTrack) {
        updateSoundButtonUI({ enabled: true, track: initialTrack });
      } else {
        updateSoundButtonUI({ enabled: false, track: null });
      }

      sound.setTrackChangeCallback((newTrack) => {
        updateSoundButtonUI({ enabled: true, track: newTrack });
        showToast(`🎶 Đang phát: ${newTrack.icon} ${newTrack.name} (${newTrack.style})`, 3000);
      });

      btnNavSound.addEventListener('click', () => {
        const result = sound.cycleBGM();
        updateSoundButtonUI(result);
        if (result.enabled && result.track) {
          showToast(`🎵 Đổi bài: ${result.track.icon} ${result.track.name} (${result.track.style})`, 3000);
        } else {
          showToast('🔇 Đã tắt nhạc nền.', 2000);
        }
      });
    }

    // --- 7. PET SYSTEM & THIEF ENCOUNTER MECHANICS ---
    function checkThiefEncounter() {
      if (isGamePaused) return;
      if (!storeState || !storeState.save || !storeState.save.upgrades) return;
      const up = storeState.save.upgrades;
      if (!up.active_pet || up.is_pet_stolen) return;
      if (canvas.thief) return;

      // Thief appears when store is crowded (queue >= 2 or daily cap reached)
      const isCrowded = (orderQueue && orderQueue.length >= 2) || (storeState.daily_stats && storeState.daily_stats.is_overloaded);
      if (isCrowded && Math.random() < 0.65) {
        canvas.spawnThief();
        showToast('👀 Có kẻ lạ mặc đồ đen, đeo khẩu trang đang đi qua lại rình rập tiệm!', 4500);
      }
    }
    window.checkThiefEncounter = checkThiefEncounter;

    // Periodic thief spawn check when busy
    setInterval(checkThiefEncounter, 14000);

    // Canvas click / touch to catch thief
    const sceneCanvas = document.getElementById('scene');
    if (sceneCanvas) {
      let lastTapTime = 0;
      const onCanvasTap = async (clientX, clientY) => {
        const now = Date.now();
        if (now - lastTapTime < 300) return;
        lastTapTime = now;
        const rect = sceneCanvas.getBoundingClientRect();
        const clickX = (clientX - rect.left) * (360 / rect.width);
        const clickY = (clientY - rect.top) * (200 / rect.height);

        if (canvas.checkThiefClick(clickX, clickY)) {
          sound.coin();
          try {
            const res = await API.shooThief();
            if (res && res.success) {
              showToast(`⚡ BẮT ĐƯỢC TÊN TRỘM! Thưởng cảnh giác: +${res.reward.toLocaleString('vi-VN')}đ! 🎉`, 4500);
              storeState = await API.getState();
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
      sceneCanvas.addEventListener('click', (e) => {
        onCanvasTap(e.clientX, e.clientY);
      });
    }

    // Canvas Callback when Thief snatches pet
    canvas.onPetStolen = async () => {
      sound.fail();
      try {
        const res = await API.stealPet();
        if (res && res.success) {
          storeState = await API.getState();
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

    // Redeem Pet Handlers
    async function handleRedeemPet() {
      try {
        const res = await API.redeemPet();
        if (res && res.success) {
          sound.coin();
          showToast(res.message, 4500);
          const modalPetStolen = document.getElementById('modal-pet-stolen');
          if (modalPetStolen) modalPetStolen.style.display = 'none';
          storeState = await API.getState();
          updateUI();
        } else {
          showToast('❌ ' + (res.message || 'Không đủ tiền chuộc bé!'));
        }
      } catch (err) {
        console.error('Redeem pet error:', err);
        showToast('❌ Lỗi kết nối khi nộp tiền chuộc!');
      }
    }

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

    // --- 8. PROACTIVE TIKTOKER INVITATION MODAL ---
    const modalTiktoker = document.getElementById('modal-tiktoker');
    const navInviteTiktoker = document.getElementById('nav-invite-tiktoker');
    const btnInviteBanner = document.getElementById('btn-invite-tiktoker-banner');
    const closeTiktoker = document.getElementById('close-tiktoker');
    const btnConfirmInviteTiktoker = document.getElementById('btn-confirm-invite-tiktoker');

    function renderTiktokerModal() {
      if (!storeState) return;
      const save = storeState.save || storeState;
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

    // Expose for updateUI
    window.renderTiktokerModal = renderTiktokerModal;

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
          const res = await API.inviteTiktoker();
          if (res && res.success) {
            sound.coin();
            showToast(res.message, 5000);
            if (modalTiktoker) modalTiktoker.style.display = 'none';
            storeState = await API.getState();
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

    // --- 9. STORY & NARRATIVE GUIDED TUTORIAL SYSTEM ---
    const STORY_DATA = {
      1: {
        title: 'Chương 1: Xe Đẩy Vỉa Hè (Món Nợ 3 Triệu)',
        scenes: [
          {
            avatar: '🧋',
            speaker: 'HeeHee (Cô Chủ Nhỏ)',
            role: 'Khởi nghiệp vỉa hè',
            text: 'Chào bạn! Mình là HeeHee.\n\nSau nhiều năm ấp ủ ước mơ tự tay làm ra những ly trà sữa thơm ngon chuẩn vị nhất phố, mình đã gom góp hết số tiền tiết kiệm ít ỏi để mở tiệm trà sữa trên chiếc xe đẩy nhỏ này!\n\nNhưng đường đời không như là mơ... Để sắm được xe đẩy và bộ đồ nghề inox, mình đã phải vay một khoản tiền lớn!',
            hint: { icon: '🧋', text: 'Chào mừng bạn đến với Tiệm Trà Sữa HeeHee!' }
          },
          {
            avatar: '🕶️',
            speaker: 'Anh Bảnh (Chủ Nợ Khu Phố)',
            role: 'Đầu gấu đòi nợ',
            text: 'Này con bé! Chiếc xe đẩy inox và bộ máy dập nắp này là tao cho mày vay đúng 3.000.000đ tiền mặt!\n\nNhớ kỹ cho tao: Liệu mà cày cuốc bán buôn trả nợ dần. Sau 7 ngày mà chưa trả hết là tao cho đàn em kéo xe đi rã sắt vụn đấy! Đừng trách Anh Bảnh không nể nang!',
            hint: { icon: '⚠️', text: 'Mục tiêu tối thượng: Kiếm đủ tiền trả hết 3.000.000đ nợ cho Anh Bảnh!' }
          },
          {
            avatar: '🌽',
            speaker: 'Bé Bắp & Anh Lâm',
            role: 'Đồng đội trợ thủ',
            text: 'Chị HeeHee ơi đừng lo! Em là Bé Bắp, em sẽ đứng quầy phụ chị dập nắp ly và ghi vé đơn hàng!\n\nCòn anh là Anh Lâm Shipper, có đơn nào khách đặt mang đi anh sẽ phóng xe Wave ship hỏa tốc! Trà sữa của chị đậm đà thơm béo, nhất định tụi mình sẽ cày đủ tiền trả sạch nợ!',
            hint: { icon: '🤝', text: 'Bé Bắp và Anh Lâm sẽ sát cánh hỗ trợ bạn buôn bán mỗi ngày!' }
          },
          {
            avatar: '📋',
            speaker: 'Bé Bắp (Hướng Dẫn Viên)',
            role: 'Bước 1: Đón Đơn Hàng',
            text: 'Em chỉ chị cách phục vụ khách nha! Khi khách ghé quầy, vé gọi món sẽ xuất hiện:\n\n• 👤 Tên khách & Tiền thu: Khách trả tiền tương ứng với từng món.\n• 🍹 Tên món: Ban đầu tiệm có Trà Sữa Truyền Thống.\n• ⏱️ Thanh kiên nhẫn: Phải giao ly trước khi thanh màu xanh tụt hết kẻo khách giận bỏ đi (-⭐ đánh giá quán)!',
            hint: { icon: '👀', text: 'Bước 1: Luôn quan sát kỹ vé đơn hàng và thanh thời gian chờ của khách!' }
          },
          {
            avatar: '🍵',
            speaker: 'Bé Bắp (Hướng Dẫn Viên)',
            role: 'Bước 2: Quầy Pha Chế',
            text: 'Ngay bên dưới là Quầy Pha Chế:\n\n1. Cốt Trà: Bấm chọn đúng trà khách gọi: Trà Đen, Thái Xanh, Sữa Tươi, Lài, Ô Long.\n2. Đường & Đá: Chọn đúng % đường (0%, 30%, 50%...) và mức đá khách thích!\n3. Topping: Bấm chọn trân châu đen, thạch lá dứa, đường đen... (khách gọi món nào kèm topping đó).',
            hint: { icon: '🧋', text: 'Bước 2: Chọn đúng cốt trà + mức đường đá + topping theo yêu cầu.' }
          },
          {
            avatar: '🍸',
            speaker: 'Bé Bắp (Hướng Dẫn Viên)',
            role: 'Bước 3: Quy Trình 4 Bước Chuẩn Barista',
            text: 'Pha xong các nguyên liệu trong Bình Lắc:\n\n1. Nhấn [1. Lắc Bình 🍸] để hòa quyện cốt trà, đường đá và topping sánh mịn!\n2. Nhấn [2. Rót Cốc 🧋] để đổ trà sữa vào ly mang đi.\n3. Nhấn [3. Dập Nắp 🖲️] niêm phong màng nilon chuyên nghiệp.\n4. Nhấn [GIAO LY (SERVE) ✨] trao tận tay khách hàng!\n\nTing ting! Tiền thanh toán và tiền tip thưởng sẽ cộng ngay vào túi tiệm!',
            hint: { icon: '🍸', text: 'Quy trình 4 bước: 1. Lắc Bình ➔ 2. Rót Cốc ➔ 3. Dập Nắp ➔ 4. Giao Ly!' }
          },
          {
            avatar: '🛒',
            speaker: 'HeeHee (Cô Chủ Nhỏ)',
            role: 'Bước 4: Mở Rộng Quán',
            text: 'Khi có tiền lãi, đừng quên bấm vào [Nâng Cấp]:\n\n• 📜 Mua Công Thức Mới: Mua Hồng Trà Tắc, Thái Xanh, Đường Đen... để khách gọi được nhiều món xịn giá cao hơn!\n• 🐾 Nuôi Thú Cưng: Corgi tăng tip +20%, Mèo Chiêu Tài tăng +15% doanh thu, Capybara giúp khách kiên nhẫn +40%!\n• ⚠️ Cảnh giác kẻ trộm áo đen câu mất thú cưng khi quán đông!',
            hint: { icon: '💡', text: 'Bước 4: Nâng cấp máy móc, mở rộng Menu và nuôi thú cưng để làm giàu nhanh!' }
          },
          {
            avatar: '💰',
            speaker: 'HeeHee (Cô Chủ Nhỏ)',
            role: 'Mục Tiêu Trả Nợ & Lên Chương',
            text: 'Và điều quan trọng nhất: Hãy bấm vào nút [Trả Nợ] bất cứ khi nào có dư tiền mặt!\n\nTrả dần từng khoản 500.000đ hoặc gom đủ 3.000.000đ trả sạch nợ cho Anh Bảnh để xóa sổ nợ, chính thức làm chủ tiệm và MỞ KHÓA CHƯƠNG 2: GÓC HẺM SINH VIÊN!\n\nKhách hàng đầu tiên đang tới rồi, cùng chiến thôi nào!',
            hint: { icon: '🚀', text: 'Chúc bạn buôn may bán đắt và sớm trở thành Vua Trà Sữa!' }
          }
        ]
      },
      2: {
        title: 'Chương 2: Góc Hẻm Sinh Viên (Tự Do Khởi Nghiệp)',
        scenes: [
          {
            avatar: '🕶️',
            speaker: 'Anh Bảnh (Kính Nể)',
            role: 'Thanh lý sổ nợ',
            text: 'Khá lắm con bé! Tao thật không ngờ một đứa chân ướt chân ráo như mày lại trả đủ 3.000.000đ sòng phẳng đúng hẹn thế này!\n\nĐây, giấy nợ tao xé tại chỗ. Chiếc xe đẩy này từ nay chính thức thuộc về mày! Chúc mày buôn may bán đắt, tao đi đây!',
            hint: { icon: '🎉', text: 'Chúc mừng! Đã xóa sạch 3.000.000đ nợ và bước sang Chương 2!' }
          },
          {
            avatar: '🧋',
            speaker: 'HeeHee (Cô Chủ Quán)',
            role: 'Mở rộng thị trường',
            text: 'Yayyy! Chúng ta đã hoàn toàn sạch nợ rồi! Giờ đây mỗi đồng tiền kiếm được đều là lợi nhuận thực sự của chúng mình!\n\nBé Bắp ơi, phụ chị đẩy xe vào Góc Hẻm Sinh Viên cạnh trường đại học nào! Ở đây đông đảo bạn trẻ và sinh viên qua lại suốt ngày đêm!',
            hint: { icon: '🏫', text: 'Chương 2: Góc Hẻm Sinh Viên - Lượng khách đông đảo hơn!' }
          },
          {
            avatar: '🌽',
            speaker: 'Bé Bắp (Hào Hứng)',
            role: 'Menu đại học',
            text: 'Sinh viên cực mê các món hot trend như Sữa Tươi Trân Châu Đường Đen và Trà Đào Cam Sả chị ơi!\n\nChị mau vào mục [Nâng Cấp] để sắm ngay các công thức mới này nhé! Menu càng phong phú, doanh thu càng bùng nổ!',
            hint: { icon: '🍹', text: 'Mở khóa công thức Sữa Tươi Đường Đen & Trà Đào Cam Sả để đón bão sinh viên!' }
          }
        ]
      }
    };

    let storyChapter = 1;
    let storySceneIdx = 0;

    const modalStory = document.getElementById('modal-story');
    const closeStory = document.getElementById('close-story');
    const btnStoryHeader = document.getElementById('btn-story-header');
    const navStory = document.getElementById('nav-story');

    const tabDialogue = document.getElementById('story-tab-dialogue');
    const tabQuests = document.getElementById('story-tab-quests');
    const tabGuide = document.getElementById('story-tab-guide');

    const viewDialogue = document.getElementById('story-view-dialogue');
    const viewQuests = document.getElementById('story-view-quests');
    const viewGuide = document.getElementById('story-view-guide');

    const storyTitleEl = document.getElementById('story-chapter-title');
    const storyAvatarEl = document.getElementById('story-avatar');
    const storyNameEl = document.getElementById('story-speaker-name');
    const storyRoleEl = document.getElementById('story-speaker-role');
    const storyTextEl = document.getElementById('story-dialogue-text');
    const storyHintBox = document.getElementById('story-visual-hint');
    const storyHintIcon = document.getElementById('story-hint-icon');
    const storyHintText = document.getElementById('story-hint-text');

    const btnStoryPrev = document.getElementById('btn-story-prev');
    const btnStoryNext = document.getElementById('btn-story-next');
    const btnStoryReplay = document.getElementById('btn-story-replay');
    const storyStepIndicator = document.getElementById('story-step-indicator');
    const storyQuestList = document.getElementById('story-quest-list');

    window.openStoryModal = function(sceneIdx = 0, chapterNum = null) {
      if (chapterNum) {
        storyChapter = chapterNum;
      } else if (storeState && storeState.save && storeState.save.chapter) {
        storyChapter = storeState.save.chapter;
      } else {
        storyChapter = 1;
      }

      storySceneIdx = sceneIdx;
      switchStoryTab('dialogue');
      renderStoryScene(storySceneIdx);
      if (modalStory) modalStory.style.display = 'flex';
    };

    function closeStoryModal() {
      if (modalStory) modalStory.style.display = 'none';
    }

    function switchStoryTab(tabName) {
      [tabDialogue, tabQuests, tabGuide].forEach(t => t && t.classList.remove('active'));
      if (viewDialogue) viewDialogue.style.display = 'none';
      if (viewQuests) viewQuests.style.display = 'none';
      if (viewGuide) viewGuide.style.display = 'none';

      if (tabName === 'dialogue') {
        if (tabDialogue) tabDialogue.classList.add('active');
        if (viewDialogue) viewDialogue.style.display = 'flex';
      } else if (tabName === 'quests') {
        if (tabQuests) tabQuests.classList.add('active');
        if (viewQuests) viewQuests.style.display = 'block';
        renderStoryQuests();
      } else if (tabName === 'guide') {
        if (tabGuide) tabGuide.classList.add('active');
        if (viewGuide) viewGuide.style.display = 'block';
      }
    }

    function renderStoryScene(idx) {
      const chap = STORY_DATA[storyChapter] || STORY_DATA[1];
      const scenes = chap.scenes;
      if (idx < 0) idx = 0;
      if (idx >= scenes.length) idx = scenes.length - 1;
      storySceneIdx = idx;

      const sc = scenes[storySceneIdx];
      if (storyTitleEl) storyTitleEl.innerText = chap.title;
      if (storyAvatarEl) storyAvatarEl.innerText = sc.avatar || '🧋';
      if (storyNameEl) storyNameEl.innerText = sc.speaker || 'HeeHee';
      if (storyRoleEl) storyRoleEl.innerText = sc.role || 'Cô Chủ Nhỏ';
      if (storyTextEl) storyTextEl.innerHTML = sc.text.replace(/\n/g, '<br>');

      if (sc.hint && storyHintBox) {
        storyHintBox.style.display = 'flex';
        if (storyHintIcon) storyHintIcon.innerText = sc.hint.icon;
        if (storyHintText) storyHintText.innerText = sc.hint.text;
      } else if (storyHintBox) {
        storyHintBox.style.display = 'none';
      }

      if (storyStepIndicator) {
        storyStepIndicator.innerText = `${storySceneIdx + 1} / ${scenes.length}`;
      }

      if (btnStoryPrev) {
        btnStoryPrev.disabled = storySceneIdx === 0;
        btnStoryPrev.style.opacity = storySceneIdx === 0 ? '0.4' : '1';
      }

      if (btnStoryNext) {
        if (storySceneIdx === scenes.length - 1) {
          btnStoryNext.innerText = '🚀 BẮT ĐẦU PHA CHẾ NGAY!';
          btnStoryNext.style.background = 'linear-gradient(180deg, #50fa7b, #2e8b57)';
        } else {
          btnStoryNext.innerText = 'Tiếp tục ▶';
          btnStoryNext.style.background = 'linear-gradient(180deg, #f4c430, #b8860b)';
        }
      }

      if (sound && sound.talk) sound.talk(520);
    }

    function renderStoryQuests() {
      if (!storyQuestList || !storeState || !storeState.save) return;
      const save = storeState.save;
      const daily = storeState.daily_stats || {};
      const recipes = JSON.parse(save.recipes || '["tra_sua_truyen_thong"]');
      const upgrades = JSON.parse(save.upgrades || '{}');

      const quests = [
        {
          id: 'q1',
          icon: '🌟',
          title: 'Khởi Nghiệp Vỉa Hè',
          desc: 'Đăng ký tiệm & chuẩn bị quầy bán trà sữa.',
          reward: 'Vốn khởi điểm: 200.000đ',
          isDone: true
        },
        {
          id: 'q2',
          icon: '🍹',
          title: 'Đôi Bàn Tay Vàng',
          desc: 'Hoàn thành pha chế và giao ít nhất 1 ly trà sữa cho khách.',
          reward: 'Kinh nghiệm Barista',
          isDone: (daily.orders_served && daily.orders_served > 0) || save.money > 200000
        },
        {
          id: 'q3',
          icon: '🍊',
          title: 'Mở Rộng Thực Đơn',
          desc: 'Mua thêm ít nhất 1 công thức món mới trong mục [Nâng Cấp] (Hồng Trà Tắc, Thái Xanh...).',
          reward: 'Bán được món giá cao',
          isDone: recipes.length >= 2
        },
        {
          id: 'q4',
          icon: '💸',
          title: 'Trút Bớt Gánh Nặng',
          desc: 'Trả ít nhất 500.000đ nợ đầu tiên cho Anh Bảnh (Khoản nợ còn lại ≤ 2.500.000đ).',
          reward: 'Giảm áp lực đòi nợ',
          isDone: save.debt_remaining <= 2500000
        },
        {
          id: 'q5',
          icon: '📣',
          title: 'Lan Tỏa Tiếng Vang',
          desc: 'Đưa đánh giá quán lên trên 4.8⭐ hoặc book lịch mời Tú (TikToker 500k Followers).',
          reward: 'Cơn sốt khách ghé quầy',
          isDone: save.reputation >= 4.8 || !!upgrades.tiktoker_ever_invited
        },
        {
          id: 'q6',
          icon: '🐾',
          title: 'Vệ Sĩ Bốn Chân',
          desc: 'Nhận nuôi 1 thú cưng giữ quầy (Cún Corgi, Mèo Chiêu Tài hoặc Capybara).',
          reward: 'Buff tiền tip & kiên nhẫn',
          isDone: !!upgrades.active_pet
        },
        {
          id: 'q7',
          icon: '🤝',
          title: 'Liên Minh Bạn Hữu',
          desc: 'Ký kết Collab ít nhất 1 lần với mã quán của bạn bè để mở thêm hạn mức.',
          reward: '+Doanh số ngày',
          isDone: (daily.collab_count && daily.collab_count > 0)
        },
        {
          id: 'q8',
          icon: '🏆',
          title: 'Tự Do Khởi Nghiệp',
          desc: 'Trả hết sạch 3.000.000đ nợ cho Anh Bảnh và chính thức mở khóa Chương 2!',
          reward: 'Mở khóa Chương 2: Góc Hẻm Sinh Viên',
          isDone: save.debt_remaining === 0 || save.chapter >= 2
        }
      ];

      storyQuestList.innerHTML = quests.map(q => `
        <div class="quest-item ${q.isDone ? 'completed' : ''}">
          <div style="font-size: 1.6rem;">${q.icon}</div>
          <div class="quest-info">
            <div class="quest-title">${q.title}</div>
            <div class="quest-desc">${q.desc}</div>
            <div class="quest-reward">🎁 ${q.reward}</div>
          </div>
          <div class="quest-badge ${q.isDone ? 'done' : 'pending'}">
            ${q.isDone ? '✅ Hoàn thành' : 'Đang làm...'}
          </div>
        </div>
      `).join('');
    }

    if (btnStoryHeader) btnStoryHeader.addEventListener('click', () => window.openStoryModal());
    if (navStory) navStory.addEventListener('click', () => window.openStoryModal());
    if (closeStory) closeStory.addEventListener('click', () => closeStoryModal());

    if (tabDialogue) tabDialogue.addEventListener('click', () => switchStoryTab('dialogue'));
    if (tabQuests) tabQuests.addEventListener('click', () => switchStoryTab('quests'));
    if (tabGuide) tabGuide.addEventListener('click', () => switchStoryTab('guide'));

    if (btnStoryPrev) {
      btnStoryPrev.addEventListener('click', () => {
        if (storySceneIdx > 0) {
          renderStoryScene(storySceneIdx - 1);
        }
      });
    }

    if (btnStoryNext) {
      btnStoryNext.addEventListener('click', () => {
        const chap = STORY_DATA[storyChapter] || STORY_DATA[1];
        if (storySceneIdx < chap.scenes.length - 1) {
          renderStoryScene(storySceneIdx + 1);
        } else {
          closeStoryModal();
          showToast('🎉 Chúc HeeHee buôn may bán đắt!', 3000);
        }
      });
    }

    if (btnStoryReplay) {
      btnStoryReplay.addEventListener('click', () => {
        renderStoryScene(0);
      });
    }

    // --- DEV MODE CONTROLS (Ẩn mặc định cho người dùng) ---
    const urlParams = new URLSearchParams(window.location.search);
    let isDevMode = urlParams.get('dev') === '1' || urlParams.get('dev') === 'true' || urlParams.get('debug') === '1';
    if (isDevMode) {
      localStorage.setItem('heehee_dev_mode', 'true');
    } else {
      isDevMode = localStorage.getItem('heehee_dev_mode') === 'true';
    }

    function applyDevMode(active, notify = false) {
      if (active) {
        document.body.classList.add('dev-mode');
        localStorage.setItem('heehee_dev_mode', 'true');
        if (notify) showToast('🛠️ Đã bật Chế độ Dev (Sang ngày, Test cheat)', 3500);
      } else {
        document.body.classList.remove('dev-mode');
        localStorage.removeItem('heehee_dev_mode');
        if (notify) showToast('🔒 Đã ẩn Chế độ Dev (Về chế độ người chơi thường)', 3500);
      }
    }

    applyDevMode(isDevMode);

    // Bí mật: Bấm 5 lần vào tiêu đề quán để Bật/Tắt Dev Mode
    let titleClicks = 0;
    let titleTimer = null;
    const storeTitleEl = document.getElementById('store-name');
    if (storeTitleEl) {
      storeTitleEl.style.cursor = 'pointer';
      storeTitleEl.title = 'Tiệm Trà Sữa HeeHee';
      storeTitleEl.addEventListener('click', () => {
        titleClicks++;
        clearTimeout(titleTimer);
        titleTimer = setTimeout(() => { titleClicks = 0; }, 2000);
        if (titleClicks >= 5) {
          titleClicks = 0;
          const current = document.body.classList.contains('dev-mode');
          applyDevMode(!current, true);
          sound.bell();
        }
      });
    }

    // Phím tắt bàn phím: F2 hoặc Ctrl + Shift + D
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        const current = document.body.classList.contains('dev-mode');
        applyDevMode(!current, true);
        sound.bell();
      }
    });
  }

  // Click store code to copy
  if (elStoreCode) {
    elStoreCode.style.cursor = 'pointer';
    elStoreCode.title = 'Nhấn để sao chép mã quán';
    elStoreCode.addEventListener('click', async () => {
      if (!storeState || !storeState.store_code) return;
      try {
        await navigator.clipboard.writeText(storeState.store_code);
        showToast('📋 Đã sao chép Mã Quán: ' + storeState.store_code, 2000);
      } catch {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = storeState.store_code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('📋 Đã sao chép Mã Quán: ' + storeState.store_code, 2000);
      }
    });
  }

  // Time of Day badge click to toggle/cycle scenery
  const elTimeBadge = document.getElementById('time-of-day-badge');
  if (elTimeBadge) {
    const updateTimeBadge = () => {
      if (canvas && canvas.getTimeOfDayLabel) {
        elTimeBadge.innerText = canvas.getTimeOfDayLabel();
      }
    };
    updateTimeBadge();
    setInterval(updateTimeBadge, 3000); // Check every 3 seconds to tick smoothly with 2-hour cycle

    elTimeBadge.addEventListener('click', () => {
      if (canvas && canvas.cycleTimeOfDay) {
        const res = canvas.cycleTimeOfDay();
        updateTimeBadge();
        sound.bell();
        showToast(`🎨 Khung cảnh: ${res.label}`, 2500);
      }
    });
  }

  // --- PIXEL ART INGREDIENT RENDERER ---
  function drawIngredientPixelArt(canvas, ingId) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;

    const s = Math.floor(w / 16);
    ctx.fillStyle = '#221524';
    ctx.fillRect(0, 0, w, h);

    function px(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * s, y * s, s, s);
    }
    function rect(x, y, rw, rh, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * s, y * s, rw * s, rh * s);
    }

    switch (ingId) {
      case 'tra_den':
        rect(4, 5, 8, 8, '#593219');
        rect(5, 6, 6, 6, '#7c4322');
        rect(4, 4, 8, 2, '#422411');
        rect(6, 3, 4, 2, '#8b4513');
        rect(6, 5, 4, 1, '#f4c430');
        px(5, 6, '#f4c430'); px(10, 6, '#f4c430');
        px(7, 8, '#2fa364'); px(8, 8, '#2fa364'); px(8, 9, '#1e6840');
        break;
      case 'tra_thai_xanh':
        rect(4, 4, 8, 9, '#1e6840');
        rect(5, 5, 6, 7, '#2fa364');
        rect(6, 6, 4, 5, '#50fa7b');
        rect(6, 8, 4, 2, '#ffffff');
        rect(7, 10, 2, 1, '#ffffff');
        rect(4, 3, 8, 2, '#144c2d');
        rect(6, 2, 4, 1, '#f4c430');
        break;
      case 'sua_tuoi':
        rect(5, 3, 6, 11, '#dfe6e9');
        rect(6, 4, 4, 9, '#ffffff');
        rect(5, 2, 6, 2, '#74b9ff');
        rect(6, 1, 4, 1, '#0984e3');
        rect(6, 6, 2, 2, '#2d3436');
        rect(8, 9, 2, 2, '#2d3436');
        px(7, 7, '#74b9ff');
        break;
      case 'tra_lai':
        rect(4, 5, 8, 8, '#d4882b');
        rect(5, 6, 6, 6, '#f39c12');
        rect(5, 3, 6, 3, '#b7751c');
        px(8, 8, '#f1fa8c');
        px(8, 7, '#ffffff'); px(8, 9, '#ffffff');
        px(7, 8, '#ffffff'); px(9, 8, '#ffffff');
        px(6, 9, '#2fa364');
        break;
      case 'tra_olong':
        rect(4, 6, 8, 7, '#59341d');
        rect(5, 7, 6, 5, '#7a4828');
        rect(5, 5, 6, 2, '#3d2313');
        rect(6, 4, 4, 1, '#f4c430');
        px(6, 2, '#ced6e0'); px(7, 1, '#ced6e0'); px(9, 2, '#ced6e0');
        break;
      case 'tranchau_den':
        rect(3, 8, 10, 5, '#3c2436');
        rect(4, 9, 8, 4, '#57334d');
        px(5, 6, '#1f1620'); px(6, 6, '#483446');
        px(7, 5, '#1f1620'); px(8, 5, '#483446');
        px(9, 6, '#1f1620'); px(10, 6, '#483446');
        px(6, 7, '#1f1620'); px(8, 7, '#1f1620'); px(10, 7, '#1f1620');
        break;
      case 'thach_la_dua':
        rect(4, 7, 4, 4, '#2ed573');
        rect(5, 8, 2, 2, '#7bed9f');
        rect(8, 6, 4, 4, '#1e824c');
        rect(9, 7, 2, 2, '#2ed573');
        rect(6, 10, 4, 3, '#10ac84');
        px(9, 3, '#2ed573'); px(10, 4, '#2ed573'); px(11, 5, '#1e824c');
        break;
      case 'tranchau_duongden':
        rect(5, 5, 6, 8, '#5c3a21');
        rect(6, 6, 4, 6, '#874d28');
        rect(6, 3, 4, 3, '#3b2212');
        rect(6, 2, 4, 1, '#f4c430');
        px(8, 10, '#f4c430'); px(8, 12, '#f4c430'); px(7, 13, '#f4c430');
        break;
      case 'dao_mieng':
        rect(4, 5, 5, 8, '#ffa502');
        rect(5, 6, 3, 6, '#ff7f50');
        rect(8, 7, 4, 5, '#ffa502');
        rect(9, 8, 2, 3, '#ff6348');
        px(11, 6, '#2ed573');
        break;
      case 'cam_vang':
        rect(4, 4, 8, 8, '#ff9f43');
        rect(5, 5, 6, 6, '#feca57');
        rect(6, 6, 4, 4, '#ff9f43');
        px(4, 4, '#ee5253'); px(11, 4, '#ee5253'); px(4, 11, '#ee5253'); px(11, 11, '#ee5253');
        px(8, 2, '#10ac84'); px(9, 3, '#1dd1a1');
        break;
      case 'sa_tuoi':
        rect(5, 3, 3, 10, '#a8e6cf');
        rect(6, 2, 2, 11, '#1dd1a1');
        rect(8, 5, 3, 8, '#c8d6e5');
        rect(9, 4, 2, 9, '#10ac84');
        px(5, 2, '#2ed573'); px(8, 3, '#2ed573');
        break;
      case 'suong_sao':
        rect(4, 7, 4, 4, '#2f3542');
        rect(5, 8, 2, 2, '#57606f');
        rect(8, 6, 4, 4, '#1e272e');
        rect(9, 7, 2, 2, '#3d4b56');
        rect(6, 10, 4, 3, '#1e272e');
        px(6, 5, '#2ed573'); px(7, 6, '#2ed573');
        break;
      case 'ly_nap':
      default:
        rect(5, 4, 6, 9, '#74b9ff');
        rect(6, 5, 4, 7, '#ffffff');
        rect(4, 3, 8, 2, '#ff79c6');
        rect(5, 2, 6, 1, '#bd93f9');
        px(8, 0, '#f4c430'); px(7, 1, '#f4c430'); px(7, 2, '#f4c430');
        px(6, 10, '#2d3436'); px(7, 10, '#2d3436'); px(8, 10, '#2d3436');
        break;
    }
  }

  // --- WHOLESALE MARKET (CHỢ ĐẦU MỐI) SYSTEM ---
  const modalMarket = document.getElementById('modal-market');
  const btnNavMarket = document.getElementById('nav-market');
  const closeMarket = document.getElementById('close-market');
  const marketTabs = document.getElementById('market-tabs');
  const marketGrid = document.getElementById('market-items-grid');
  let currentMarketFilter = 'all';

  function renderMarketItems() {
    if (!marketGrid || !storeState) return;
    const inv = storeState.save ? (storeState.save.inventory || {}) : {};
    const money = storeState.save ? storeState.save.money : 0;
    const items = storeState.ingredients || [];

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
          const res = await API.buyIngredients([{ id, quantity: qty }]);
          if (res && res.success) {
            sound.coin();
            showToast(res.message, 3000);
            storeState = await API.getState();
            updateUI();
            renderMarketItems();
          } else {
            sound.fail();
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

  if (btnNavMarket) {
    btnNavMarket.addEventListener('click', () => {
      sound.bell();
      renderMarketItems();
      modalMarket.style.display = 'flex';
    });
  }

  if (closeMarket) {
    closeMarket.addEventListener('click', () => {
      modalMarket.style.display = 'none';
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

  // --- END OF SHIFT (KẾT CA) SYSTEM ---
  const modalEndShift = document.getElementById('modal-end-shift');
  const btnNavEndShift = document.getElementById('nav-end-shift');
  const closeEndShift = document.getElementById('close-end-shift');
  const shiftContent = document.getElementById('shift-summary-content');

  function openEndShiftModal() {
    if (!shiftContent || !storeState) return;

    // ⏸️ Tạm dừng game khi mở bảng Kết ca
    if (nextOrderTimeout) clearTimeout(nextOrderTimeout);

    const save = storeState.save || {};
    const daily = storeState.daily_stats || {};
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
          const res = await API.endShift();
          if (res && res.success) {
            sound.bell();
            modalEndShift.style.display = 'none';

            // Dọn sạch đơn hàng ca cũ
            if (orderTimerInterval) clearInterval(orderTimerInterval);
            if (nextOrderTimeout) clearTimeout(nextOrderTimeout);
            orderQueue = [];
            currentOrder = null;
            renderOrderTicket();
            canvas.setCustomerQueue([]);

            storeState = await API.getState();
            updateUI();
            showToast(`🌅 Kết ca Ngày ${res.previousDay} thành công! Lợi nhuận: ${res.netProfit >= 0 ? '+' : ''}${res.netProfit.toLocaleString('vi-VN')}đ`, 4000);

            // Bật thông báo nghỉ ngơi sau một ngày làm việc mệt mỏi (2 phút)
            if (res.resting && res.restUntil) {
              startRestCountdown(res.restUntil, res.restReason || 'end_shift');
            } else {
              isGamePaused = false;
              scheduleNextOrder(2500);
            }
          } else {
            sound.fail();
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

  if (btnNavEndShift) {
    btnNavEndShift.addEventListener('click', () => {
      sound.bell();
      openEndShiftModal();
    });
  }

  if (closeEndShift) {
    closeEndShift.addEventListener('click', () => {
      modalEndShift.style.display = 'none';
      isGamePaused = false;
      if (!currentOrder && (!orderQueue || orderQueue.length === 0)) {
        scheduleNextOrder(2000);
      }
    });
  }

  // Launch store!
  initStore();
});
