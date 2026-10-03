// Main Game Application Controller
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = new GameCanvas('scene');
  
  // Game State
  let storeState = null;
  let orderQueue = [];
  let currentOrder = null;
  let orderTimerInterval = null;
  let restTimerInterval = null;
  let orderStartTime = 0;
  
  // Mixing Selection State
  let selectedTea = 'den';
  let selectedSugar = '50%';
  let selectedIce = 'Vừa đá';
  let selectedToppings = [];
  let isShaken = false;

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
  const elBtnServe = document.getElementById('btn-serve');
  const elBtnShaker = document.getElementById('btn-shaker');
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
        authError.innerText = res.message || 'Đăng nhập không thành công!';
        authError.style.display = 'block';
      }
    });

    // Handle Register Submit
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

  // Check 15-minute real-world resting countdown
  function checkRestStatus(save) {
    if (!save || !save.rest_until_ts) return false;
    const now = Date.now();
    if (now < save.rest_until_ts) {
      startRestCountdown(save.rest_until_ts);
      return true;
    }
    return false;
  }

  function startRestCountdown(restUntil) {
    const overlay = document.getElementById('overlay-resting');
    const disp = document.getElementById('rest-timer-display');
    overlay.style.display = 'flex';

    if (orderTimerInterval) clearInterval(orderTimerInterval);
    if (restTimerInterval) clearInterval(restTimerInterval);

    currentOrder = null;
    orderQueue = [];
    canvas.setCustomerQueue([]);
    renderOrderTicket();

    function updateTimer() {
      const remainingSec = Math.max(0, Math.ceil((restUntil - Date.now()) / 1000));
      const m = Math.floor(remainingSec / 60).toString().padStart(2, '0');
      const s = (remainingSec % 60).toString().padStart(2, '0');
      disp.innerText = `${m}:${s}`;

      if (remainingSec <= 0) {
        clearInterval(restTimerInterval);
        overlay.style.display = 'none';
        showToast('✨ HeeHee đã khỏe lại rồi! Tiệm trà sữa mở cửa đón khách tiếp!', 4000);
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
      bTiktok.innerText = `🔥 TikTok Viral (${buffs.tiktoker_waves || 1} đợt: x2.5 Khách)`;
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

    // Daily Cap Progress
    elCapEarned.innerText = daily.earned_today.toLocaleString('vi-VN') + 'đ';
    elCapMax.innerText = daily.effective_cap.toLocaleString('vi-VN') + 'đ';

    const pct = Math.min(100, Math.floor((daily.earned_today / daily.effective_cap) * 100));
    elCapFill.style.width = pct + '%';

    if (daily.is_overloaded) {
      elCapFill.classList.add('overloaded');
      elOverloadWarning.style.display = 'block';
    } else {
      elCapFill.classList.remove('overloaded');
      elOverloadWarning.style.display = 'none';
    }

    // Active buffs
    updateBuffsUI(save.active_buffs);

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
    setTimeout(async () => {
      if (currentOrder || (orderQueue && orderQueue.length > 0)) return;
      
      const res = await API.getOrder();
      if (!res || !res.order) {
        scheduleNextOrder(4500);
        return;
      }

      if (res.order.resting) {
        startRestCountdown(res.order.restUntil);
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
      scheduleNextOrder(3000);
      return;
    }

    currentOrder = orderQueue[0];
    orderStartTime = Date.now();
    sound.bell();

    renderOrderTicket();
    updateUI();
    checkThiefEncounter();

    // Patience countdown
    const duration = currentOrder.patienceMs || 22000;
    const interval = 100;
    let elapsed = 0;

    if (orderTimerInterval) clearInterval(orderTimerInterval);
    orderTimerInterval = setInterval(() => {
      elapsed += interval;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      const timerFill = document.getElementById('order-timer-fill');
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
    renderOrderTicket();
    updateUI();

    setTimeout(() => {
      if (orderQueue.length > 0) {
        startNextOrderInQueue();
      } else {
        scheduleNextOrder(3500);
      }
    }, 1000);
  }

  function renderOrderTicket() {
    if (!currentOrder) {
      elOrderSection.innerHTML = `<div class="order-box no-order">Đang ngóng chờ khách hàng tiếp theo ghé quầy... 🧋</div>`;
      elBtnServe.disabled = true;
      return;
    }

    elBtnServe.disabled = false;
    elOrderSection.innerHTML = `
      <div class="order-box">
        <div class="order-header">
          <span>👤 <b>${currentOrder.customerName}</b></span>
          <span style="color: #2e8b57; font-weight: bold;">+${currentOrder.price.toLocaleString('vi-VN')}đ</span>
        </div>
        <div style="font-style: italic; color: #ffb86c; font-size: 0.92rem; margin: 3px 0 6px 0; background: rgba(0,0,0,0.3); padding: 4px 6px; border-radius: 4px;">
          💬 "${currentOrder.quote || 'Pha chế ngon giùm mình nhé!'}"
        </div>
        <div style="font-weight: bold; font-size: 1.15rem; color: #8b4513;">
          🍹 ${currentOrder.recipeName}
        </div>
        <div class="order-specs">
          <span class="spec-badge">Đường: <b>${currentOrder.sugar}</b></span>
          <span class="spec-badge">Đá: <b>${currentOrder.ice}</b></span>
          <span class="spec-badge">Topping: <b>${currentOrder.toppings.length ? currentOrder.toppings.join(', ') : 'Không'}</b></span>
        </div>
        <div class="patience-timer-bg">
          <div id="order-timer-fill" class="patience-timer-fill"></div>
        </div>
      </div>
    `;
  }

  // 3. Mixing Station Selection Handlers
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

  document.querySelectorAll('[data-tea]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tea]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTea = btn.getAttribute('data-tea');
      sound.pour();
      canvas.setDrinkPreview({ tea: selectedTea, toppings: selectedToppings });
      updateCupMonitor();
    });
  });

  document.querySelectorAll('[data-sugar]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-sugar]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSugar = btn.getAttribute('data-sugar');
      sound.pour();
      updateCupMonitor();
    });
  });

  document.querySelectorAll('[data-ice]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-ice]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedIce = btn.getAttribute('data-ice');
      sound.ice();
      updateCupMonitor();
    });
  });

  document.querySelectorAll('[data-topping]').forEach(btn => {
    btn.addEventListener('click', () => {
      const top = btn.getAttribute('data-topping');
      if (selectedToppings.includes(top)) {
        selectedToppings = selectedToppings.filter(t => t !== top);
        btn.classList.remove('active');
      } else {
        selectedToppings.push(top);
        btn.classList.add('active');
      }
      sound.pour();
      canvas.setDrinkPreview({ tea: selectedTea, toppings: selectedToppings });
      updateCupMonitor();
    });
  });

  // Shaker action
  elBtnShaker.addEventListener('click', () => {
    sound.shake();
    isShaken = true;
    canvas.setShaking(true);
    elBtnShaker.innerText = 'Đang Lắc... 🥤';
    setTimeout(() => { 
      canvas.setShaking(false);
      elBtnShaker.innerText = 'Đã Lắc Xong ✨'; 
    }, 800);
    setTimeout(() => { elBtnShaker.innerText = 'Lắc Shaker 🥤'; }, 1800);
  });

  // 4. Serve Drink Action
  elBtnServe.addEventListener('click', async () => {
    if (!currentOrder) return;
    elBtnServe.disabled = true;

    const timeTaken = Date.now() - orderStartTime;

    // Check recipe mapping from chosen tea
    let chosenRecipeId = 'tra_sua_truyen_thong';
    if (selectedTea === 'den' && selectedToppings.length === 0) chosenRecipeId = 'hong_tra_tac';
    else if (selectedTea === 'thai_xanh') chosenRecipeId = 'tra_thai_xanh';
    else if (selectedTea === 'sua_tuoi') chosenRecipeId = 'sua_tuoi_duong_den';
    else if (selectedTea === 'lai') chosenRecipeId = 'tra_dao_cam_sa';
    else if (selectedTea === 'olong_nuong') chosenRecipeId = 'tra_olong_nuong';

    sound.seal();

    const res = await API.serveOrder(
      currentOrder.orderId,
      timeTaken,
      chosenRecipeId,
      selectedSugar,
      selectedIce
    );

    if (res.isJailed) {
      showJailModal(res.jailReason);
      return;
    }

    if (res.success) {
      sound.coin();
      clearInterval(orderTimerInterval);
      canvas.triggerSuccessEffects(res.payout);

      showToast(`🎉 Giao thành công! Nhận +${res.payout.toLocaleString('vi-VN')}đ`);

      if (res.tiktokerViral) {
        setTimeout(() => {
          showToast(`🔥 VIDEO TIKTOK CỦA TÚ VIRAL TRIỆU VIEW! Lượng khách kéo đến nườm nượp!`, 6000);
        }, 800);
      }

      if (res.isOverloaded) {
        showToast(`🛑 ĐÃ CHẠM HẠN MỨC DOANH SỐ HÔM NAY! Quán chuyển sang chế độ phục vụ cầm chừng.`, 4500);
      }

      // Refresh store state
      storeState = await API.getState();
      updateUI();

      orderQueue.shift();
      currentOrder = null;
      renderOrderTicket();

      // Progress through wave or schedule next wave
      setTimeout(() => {
        if (orderQueue.length > 0) {
          startNextOrderInQueue();
        } else {
          const delay = res.isOverloaded ? 10000 : 3500;
          scheduleNextOrder(delay);
        }
      }, 1200);
    } else {
      handleOrderTimeout();
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
    // Collab Modal
    const modalCollab = document.getElementById('modal-collab');
    document.getElementById('nav-collab').addEventListener('click', () => {
      document.getElementById('my-collab-code').value = storeState.store_code;
      modalCollab.style.display = 'flex';
    });
    document.getElementById('close-collab').addEventListener('click', () => { modalCollab.style.display = 'none'; });

    document.getElementById('btn-copy-code').addEventListener('click', () => {
      navigator.clipboard.writeText(storeState.store_code);
      showToast('Đã sao chép Mã Quán vào bộ nhớ tạm!');
    });

    document.getElementById('btn-submit-collab').addEventListener('click', async () => {
      const friendCode = document.getElementById('friend-code-input').value;
      if (!friendCode) return showToast('Vui lòng nhập mã quán bạn bè!');

      const res = await API.collab(friendCode);
      if (res.success) {
        sound.coin();
        showToast(res.message, 4000);
        storeState = await API.getState();
        updateUI();
        modalCollab.style.display = 'none';
      } else {
        showToast('❌ ' + res.message);
      }
    });

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
    document.getElementById('nav-advance-day').addEventListener('click', async () => {
      if (confirm('Bạn có muốn kết thúc ngày bán hàng này để chuyển sang ngày mới trong game?')) {
        const res = await API.advanceDay();
        if (res.success) {
          sound.bell();
          showToast(res.message, 4000);
          storeState = await API.getState();
          updateUI();
        }
      }
    });

    // Test Anti-cheat Demo Button
    document.getElementById('nav-test-hack').addEventListener('click', async () => {
      if (confirm('CẢNH BÁO THỬ NGHIỆM: Bạn đang chuẩn bị kích hoạt giả lập HACK TIỀN CLIENT. Hệ thống Anti-cheat của server sẽ phát hiện và tịch thu quán. Bạn có muốn thử nghiệm không?')) {
        const res = await API.testTamper();
        if (res.isJailed) {
          showJailModal(res.message);
        }
      }
    });

    // Sound Toggle
    document.getElementById('nav-sound').addEventListener('click', () => {
      const isPlaying = sound.toggleBGM();
      document.getElementById('nav-sound').innerText = isPlaying ? '🎵 Nhạc: Bật' : '🔇 Nhạc: Tắt';
    });

    // --- 7. PET SYSTEM & THIEF ENCOUNTER MECHANICS ---
    function checkThiefEncounter() {
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

    // Canvas click to catch thief
    const sceneCanvas = document.getElementById('scene');
    if (sceneCanvas) {
      sceneCanvas.addEventListener('click', async (e) => {
        const rect = sceneCanvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (360 / rect.width);
        const clickY = (e.clientY - rect.top) * (200 / rect.height);

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

    if (navInviteTiktoker) {
      navInviteTiktoker.addEventListener('click', () => {
        if (modalTiktoker) modalTiktoker.style.display = 'flex';
      });
    }

    if (btnInviteBanner) {
      btnInviteBanner.addEventListener('click', () => {
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
            // Schedule immediate arrival of Tú (TikToker)!
            scheduleNextOrder(1200);
          } else {
            showToast('❌ ' + (res.message || 'Không thể mời TikToker lúc này!'));
          }
        } catch (err) {
          console.error('Invite tiktoker error:', err);
          showToast('❌ Lỗi kết nối khi gửi lời mời!');
        } finally {
          btnConfirmInviteTiktoker.disabled = false;
          btnConfirmInviteTiktoker.innerText = '🚀 Book Tú TikToker Ghé Quán (25.000đ)';
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
            avatar: '🥤',
            speaker: 'Bé Bắp (Hướng Dẫn Viên)',
            role: 'Bước 3: Lắc Shaker & Giao Ly',
            text: 'Pha xong các nguyên liệu trong ly:\n\n1. Nhấn nút [Lắc Shaker 🥤] để hòa tan cốt trà và đường đá sánh mịn thơm ngát!\n2. Nhấn nút [GIAO LY (SERVE) ✨] để trao tận tay khách!\n\nTing ting! Tiền thanh toán và tiền tip thưởng sẽ cộng ngay vào túi tiệm!',
            hint: { icon: '✨', text: 'Bước 3: Lắc Shaker -> Bấm GIAO LY (SERVE) nhận tiền liền tay!' }
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

  // Launch store!
  initStore();
});
