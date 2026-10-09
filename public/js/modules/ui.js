// HUD, Stats & Main UI Controller
import { state } from './state.js';
import { updateMixingButtonsState } from './workflow.js';
import { renderTiktokerModal } from './events.js';
import { showToast } from './toast.js';
import { updateWeatherUI } from './weather.js';

// DOM Element cache
const elStoreName = document.getElementById('store-name');
const elStoreCode = document.getElementById('store-code');
const elMoney = document.getElementById('stat-money');
const elDebt = document.getElementById('stat-debt');
const elRep = document.getElementById('stat-rep');
const elDay = document.getElementById('stat-day');
const elChapter = document.getElementById('stat-chapter');
const elUserBadge = document.getElementById('user-badge');

const elCapEarned = document.getElementById('cap-earned');

// Update active buffs banner
export function updateBuffsUI(buffs) {
  const bar = document.getElementById('active-buffs-bar');
  const bTiktok = document.getElementById('buff-tiktoker');
  const bFlop = document.getElementById('buff-tiktoker-flop');
  const bPatience = document.getElementById('buff-patience');
  const bTip = document.getElementById('buff-tip');
  const bStealth = document.getElementById('buff-stealth');

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

  // Check stealth buff from canvas
  if (state.canvas && state.canvas.invisibilityRemaining > 0) {
    const secLeft = Math.ceil(state.canvas.invisibilityRemaining / 60);
    bStealth.style.display = 'inline-block';
    bStealth.innerText = `🔮 Ẩn Thân Kích Hoạt (${secLeft}s)`;
    hasAny = true;
  } else {
    if (bStealth) bStealth.style.display = 'none';
  }

  // Check sabotage penalty buff
  const bSabotage = document.getElementById('buff-sabotage');
  if (bSabotage) {
    if (buffs.sabotage) {
      const sab = buffs.sabotage;
      bSabotage.style.display = 'inline-block';
      if (sab.type === 'market_inspection') {
        bSabotage.innerHTML = `👮 <b>Quản Lý Thị Trường Niêm Phong</b> (${sab.waves} đợt: -60% Khách, -40% Tiền)`;
      } else {
        bSabotage.innerHTML = `📉 <b>Bị Bóc Phốt Mạng Xã Hội</b> (${sab.waves} đợt: -50% Khách, -30% Tiền)`;
      }
      hasAny = true;
    } else {
      bSabotage.style.display = 'none';
    }
  }

  // Check live event buff
  const bEvent = document.getElementById('buff-live-event');
  if (bEvent) {
    if (buffs.current_event && buffs.current_event.expires_at > Date.now()) {
      const secLeft = Math.max(0, Math.ceil((buffs.current_event.expires_at - Date.now()) / 1000));
      bEvent.style.display = 'inline-block';
      bEvent.innerHTML = `${buffs.current_event.icon || '🎪'} <b>${buffs.current_event.name}</b> (${secLeft}s)`;
      hasAny = true;
    } else {
      bEvent.style.display = 'none';
    }
  }

  bar.style.display = hasAny ? 'flex' : 'none';
}

// Update HUD and stats
export function updateUI() {
  if (!state.storeState) return;
  const save = state.storeState.save;
  const daily = state.storeState.daily_stats || {};

  if (elStoreName) {
    elStoreName.innerHTML = `<span class="header-icon">🧋</span> <span class="store-name-text">${state.storeState.store_name}</span>`;
  }
  if (elStoreCode) elStoreCode.innerText = state.storeState.store_code;
  if (elUserBadge) elUserBadge.innerText = '👤 ' + (state.storeState.username || 'HeeHee');
  if (elMoney) elMoney.innerText = (save.money || 0).toLocaleString('vi-VN') + 'đ';
  const elTeaCoin = document.getElementById('stat-teacoin');
  if (elTeaCoin) elTeaCoin.innerText = (save.teacoin || 0).toLocaleString('vi-VN');
  if (elDebt) elDebt.innerText = (save.debt_remaining || 0).toLocaleString('vi-VN') + 'đ';
  if (elRep) elRep.innerText = (save.reputation !== undefined ? save.reputation.toFixed(1) : '5.0') + '⭐';
  if (elDay) elDay.innerText = save.day_in_game || 1;
  if (elChapter) elChapter.innerText = save.chapter || 1;

  // Low Reputation Warning (< 3.0⭐)
  const lowRepBanner = document.getElementById('low-rep-banner');
  if (lowRepBanner) {
    lowRepBanner.style.display = (save.reputation < 3.0) ? 'flex' : 'none';
  }
  if (elRep) {
    elRep.style.color = (save.reputation < 3.0) ? '#ff5555' : 'var(--gold)';
  }

  // Today Earnings & Time of Day badge
  if (elCapEarned) elCapEarned.innerText = (daily.earned_today || 0).toLocaleString('vi-VN') + 'đ';
  const elTimeBadge = document.getElementById('time-of-day-badge');
  if (elTimeBadge && state.canvas && state.canvas.getTimeOfDayLabel) {
    elTimeBadge.innerText = state.canvas.getTimeOfDayLabel();
  }

  // Update Dynamic Weather HUD badge & sync Canvas
  updateWeatherUI(state.storeState.weather);

  // Debt warning hint in HUD
  const hudDebtWrap = document.getElementById('hud-debt-wrap');
  if (hudDebtWrap) {
    if (save.debt_remaining === 0) {
      if (save.chapter === 1) {
        hudDebtWrap.innerHTML = `<span style="color: #50fa7b; margin-left: 6px;">(Đã sạch nợ 🎉)</span>`;
        hudDebtWrap.style.display = 'inline';
      } else {
        hudDebtWrap.style.display = 'none';
      }
    } else {
      hudDebtWrap.style.display = 'inline';
    }
  }

  // Sync Menu Modal stats
  const mMoney = document.getElementById('menu-stat-money');
  const mTeaCoin = document.getElementById('menu-stat-teacoin');
  const mDebt = document.getElementById('menu-stat-debt');
  const mRep = document.getElementById('menu-stat-rep');
  const mEarned = document.getElementById('menu-stat-earned');
  const mProg = document.getElementById('menu-stat-prog');
  const mName = document.getElementById('menu-store-name-text');

  if (mMoney) mMoney.innerText = (save.money || 0).toLocaleString('vi-VN') + 'đ';
  if (mTeaCoin) mTeaCoin.innerText = '🍵 ' + (save.teacoin || 0).toLocaleString('vi-VN');
  if (mDebt) {
    mDebt.innerText = (save.debt_remaining === 0) ? '0đ (Sạch nợ 🎉)' : (save.debt_remaining || 0).toLocaleString('vi-VN') + 'đ';
    mDebt.className = (save.debt_remaining === 0) ? 'm-stat-val text-green' : 'm-stat-val text-red';
  }
  if (mRep) mRep.innerText = (save.reputation !== undefined ? save.reputation.toFixed(1) : '5.0') + '⭐';
  if (mEarned) mEarned.innerText = (daily.earned_today || 0).toLocaleString('vi-VN') + 'đ';
  if (mProg) mProg.innerText = `Chương ${save.chapter || 1} · Ngày ${save.day_in_game || 1}`;
  if (mName) mName.innerText = state.storeState.store_name || 'Tiệm Trà Sữa HeeHee';

  // Check Daily Quests uncollected status for notification badges
  let hasClaimableQuest = false;
  const QUEST_TARGETS = {
    quest_checkin: 1,
    quest_serve_5: 5,
    quest_variety_2: 2,
    quest_friend_gift: 1,
    quest_patrol_vigilant: 1
  };
  if (save.daily_quests) {
    let dq = save.daily_quests;
    if (typeof dq === 'string') {
      try { dq = JSON.parse(dq); } catch (e) { dq = null; }
    }
    if (dq && dq.quests) {
      hasClaimableQuest = Object.entries(QUEST_TARGETS).some(([id, target]) => {
        const q = dq.quests[id];
        return q && (q.progress || 0) >= target && !q.claimed;
      });
      const allDone = Object.entries(QUEST_TARGETS).every(([id, target]) => {
        const q = dq.quests[id];
        return q && (q.progress || 0) >= target;
      });
      if (!hasClaimableQuest && allDone && !dq.allCompletedBonusClaimed) {
        hasClaimableQuest = true;
      }
    }
  }
  const questReadyBadge = document.getElementById('daily-quests-ready-badge');
  if (questReadyBadge) questReadyBadge.style.display = hasClaimableQuest ? 'block' : 'none';
  const hudQuestsBadge = document.getElementById('hud-quests-badge');
  if (hudQuestsBadge) hudQuestsBadge.style.display = hasClaimableQuest ? 'block' : 'none';

  // Notification alert on Menu buttons
  const hudMenuBadge = document.getElementById('hud-menu-badge');
  const navMenuBadge = document.getElementById('nav-menu-badge');
  const hasAlert = (save.reputation < 3.0) || (save.debt_remaining > 0 && save.day_in_game >= 5) || hasClaimableQuest;
  if (hudMenuBadge) hudMenuBadge.style.display = hasAlert ? 'block' : 'none';
  if (navMenuBadge) navMenuBadge.style.display = hasAlert ? 'block' : 'none';

  // In-game Clock & Night Patrol Status (7h00 - 22h30 operating hours)
  const elClockText = document.getElementById('game-clock-text');
  const elClockStatus = document.getElementById('game-clock-status');
  const elClockBadge = document.getElementById('game-clock-badge');
  if (state.canvas && state.canvas.getNightPatrolStatus) {
    const nStatus = state.canvas.getNightPatrolStatus();
    if (elClockText) elClockText.innerText = nStatus.timeStr;
    if (elClockStatus) {
      if (nStatus.isBusinessHours) {
        elClockStatus.innerText = '🟢 Giờ bán';
        if (elClockBadge) {
          elClockBadge.style.background = 'rgba(80, 250, 123, 0.15)';
          elClockBadge.style.borderColor = '#50fa7b';
          elClockBadge.style.color = '#50fa7b';
        }
      } else if (nStatus.isAmuletInvalid) {
        elClockStatus.innerText = `💀 Sau 1h: VÔ HIỆU (${nStatus.probability}%)`;
        if (elClockBadge) {
          elClockBadge.style.background = 'rgba(255, 71, 87, 0.25)';
          elClockBadge.style.borderColor = '#ff4757';
          elClockBadge.style.color = '#ff4757';
        }
      } else {
        elClockStatus.innerText = `🔴 Quá giờ (${nStatus.probability}%)`;
        if (elClockBadge) {
          elClockBadge.style.background = 'rgba(255, 165, 2, 0.2)';
          elClockBadge.style.borderColor = '#ffa502';
          elClockBadge.style.color = '#ffa502';
        }
      }
    }
  }

  // Scene Switcher Button label & styling
  const btnToggleScene = document.getElementById('btn-toggle-scene');
  const menuSceneTitle = document.getElementById('menu-scene-title');
  if (btnToggleScene && state.canvas) {
    const isUnlockedC2 = (save.chapter >= 2);
    if (!isUnlockedC2) {
      if (menuSceneTitle) {
        menuSceneTitle.innerText = '🏡 Phố Nhỏ Quê (Chương 2 🔒)';
      } else {
        btnToggleScene.innerText = '🏡 Phố Nhỏ (🔒)';
      }
      btnToggleScene.style.borderColor = '#636e72';
      btnToggleScene.style.color = '#b2bec3';
      btnToggleScene.style.opacity = '0.65';
      btnToggleScene.title = '🔒 Cần trả hết nợ cho Anh Bảnh để mở khóa Chương 2!';
    } else {
      const isHUST = (state.canvas.sceneSetting === 'hust');
      const sceneText = isHUST ? '🏛️ Bách Khoa' : '🏡 Phố Nhỏ Quê';
      if (menuSceneTitle) {
        menuSceneTitle.innerText = sceneText;
      } else {
        btnToggleScene.innerText = sceneText;
      }
      btnToggleScene.style.opacity = '1';
      btnToggleScene.style.borderColor = isHUST ? '#00cec9' : '#f1c40f';
      btnToggleScene.style.color = isHUST ? '#00cec9' : '#f1c40f';
      btnToggleScene.title = 'Chuyển đổi bối cảnh: Cổng Bách Khoa ↔ Phố Nhỏ Quê';
    }
  }

  // Active buffs
  updateBuffsUI(save.active_buffs);

  // TikToker Banner Button
  const btnInviteBanner = document.getElementById('btn-invite-tiktoker-banner');
  if (btnInviteBanner) {
    const buffs = save.active_buffs || {};
    const dailyB = buffs.tiktoker_daily || { day: save.day_in_game, count: 0, nextCost: 25000 };
    if (buffs.tiktoker_status === 'viral') {
      btnInviteBanner.style.display = 'none';
    } else if (dailyB.count >= 2) {
      btnInviteBanner.style.display = 'inline-block';
      btnInviteBanner.innerText = '📣 TikToker (2/2 lần)';
      btnInviteBanner.style.opacity = '0.6';
    } else if (dailyB.count === 0) {
      btnInviteBanner.style.display = 'inline-block';
      btnInviteBanner.innerText = '📣 Mời TikToker (25k)';
      btnInviteBanner.style.opacity = '1';
    } else {
      btnInviteBanner.style.display = 'inline-block';
      const costM = ((dailyB.nextCost || 2000000) / 1000000).toFixed(1);
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
  if (state.orderQueue && state.orderQueue.length > 1) {
    elQueueInd.style.display = 'block';
    const remainingNames = state.orderQueue.slice(1).map(o => o.customerName).join(' · ');
    elQueueText.innerText = `${state.orderQueue.length - 1}/14 khách đang chờ: ${remainingNames}`;
  } else {
    if (elQueueInd) elQueueInd.style.display = 'none';
  }

  // Sync Chapter, Invisibility Amulet & Collab Stalls to Canvas
  if (state.canvas) {
    state.canvas.setChapter(save.chapter || 1);
    const rawTalisman = save.upgrades ? save.upgrades.bua_an_than : 0;
    const talismanCount = typeof rawTalisman === 'number' ? rawTalisman : (rawTalisman ? 1 : 0);
    state.canvas.setHasAmulet(talismanCount > 0, talismanCount);
    if (save.upgrades) {
      state.canvas.setActivePet(save.upgrades.active_pet || null, !!save.upgrades.is_pet_stolen);
    }
    // Sync active collab partner carts to canvas
    if (state.canvas.setCollabs && state.storeState && state.storeState.collabs) {
      state.canvas.setCollabs(state.storeState.collabs.activeCollabs || []);
    }
  }

  // Debt Modal & Chapter Progression UI
  const debtSec = document.getElementById('chapter-2-unlock-section');
  const chap3Sec = document.getElementById('chapter-3-unlock-section');
  const debtPayControls = document.getElementById('debt-pay-controls');
  const navDebtBtn = document.getElementById('nav-debt');
  const menuDebtTitle = document.getElementById('menu-debt-title');
  if (save.debt_remaining === 0) {
    if (debtSec) debtSec.style.display = (save.chapter === 1) ? 'block' : 'none';
    if (debtPayControls) debtPayControls.style.display = 'none';

    const canUnlockChap3 = (save.chapter === 2 && (save.money || 0) >= 50000000);
    if (chap3Sec) chap3Sec.style.display = canUnlockChap3 ? 'block' : 'none';

    if (menuDebtTitle) {
      if (save.chapter === 1) menuDebtTitle.innerText = '🚀 Lên Chương 2';
      else if (canUnlockChap3) menuDebtTitle.innerText = '🏰 Lên Chương 3';
      else if (save.chapter === 2) menuDebtTitle.innerText = '🏆 Mục Tiêu 50Tr';
      else menuDebtTitle.innerText = '⭐ Flagship Store';
    } else if (navDebtBtn) {
      if (save.chapter === 1) {
        navDebtBtn.innerHTML = '🚀 Lên Chương 2';
        navDebtBtn.style.color = '#f1c40f';
      } else if (canUnlockChap3) {
        navDebtBtn.innerHTML = '🏰 Lên Chương 3';
        navDebtBtn.style.color = '#f4c430';
      } else if (save.chapter === 2) {
        navDebtBtn.innerHTML = '🏆 Mục Tiêu 50Tr';
        navDebtBtn.style.color = '#8be9fd';
      } else {
        navDebtBtn.innerHTML = '⭐ Flagship Store';
        navDebtBtn.style.color = '#50fa7b';
      }
    }
  } else {
    if (debtSec) debtSec.style.display = 'none';
    if (chap3Sec) chap3Sec.style.display = 'none';
    if (debtPayControls) debtPayControls.style.display = 'block';
    if (menuDebtTitle) {
      menuDebtTitle.innerText = '💰 Sổ Nợ Anh Bảnh';
    } else if (navDebtBtn) {
      navDebtBtn.innerHTML = '💰 Trả Nợ';
      navDebtBtn.style.color = '';
    }
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
  const rawTalisman = save.upgrades ? save.upgrades.bua_an_than : 0;
  const talismanCount = typeof rawTalisman === 'number' ? rawTalisman : (rawTalisman ? 1 : 0);

  const badgeTalisman = document.getElementById('talisman-capacity-badge');
  if (badgeTalisman) {
    badgeTalisman.innerText = `Túi: ${talismanCount}/3 tấm`;
    badgeTalisman.style.borderColor = talismanCount >= 3 ? '#50fa7b' : '#00cec9';
    badgeTalisman.style.color = talismanCount >= 3 ? '#50fa7b' : '#00cec9';
  }

  document.querySelectorAll('[data-buy-upgrade]').forEach(btn => {
    const upId = btn.getAttribute('data-buy-upgrade');

    // Handle Consumable Invisibility Talisman (Max 3)
    if (upId === 'bua_an_than') {
      if (talismanCount >= 3) {
        btn.disabled = true;
        btn.innerText = 'Đã Đầy Túi (3/3 Tấm) ✅';
        btn.style.background = '#4a5568';
        btn.style.color = '#fff';
      } else {
        btn.disabled = false;
        btn.innerText = talismanCount === 0 
          ? 'Mua Bùa Ẩn Thân (200.000đ)' 
          : `Mua Thêm (${talismanCount}/3 - 200.000đ)`;
        btn.style.background = '#00cec9';
        btn.style.color = '#111';
      }
      return;
    }

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
  if (state.canvas && state.canvas.setDrinkPreview) {
    state.canvas.setDrinkPreview({
      tea: state.selectedTea,
      toppings: state.selectedToppings
    });
  }

  // Update mixing buttons state according to inventory
  updateMixingButtonsState();
}

// Store code copy & Scene toggle initialization
export function initUIControls() {
  // Click store code to copy
  if (elStoreCode) {
    elStoreCode.style.cursor = 'pointer';
    elStoreCode.title = 'Nhấn để sao chép mã quán';
    elStoreCode.addEventListener('click', async () => {
      if (!state.storeState || !state.storeState.store_code) return;
      try {
        await navigator.clipboard.writeText(state.storeState.store_code);
        showToast('📋 Đã sao chép Mã Quán: ' + state.storeState.store_code, 2000);
      } catch {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = state.storeState.store_code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('📋 Đã sao chép Mã Quán: ' + state.storeState.store_code, 2000);
      }
    });
  }

  // Scene switcher button (Bách Khoa ↔ Phố Nhỏ Quê)
  const btnToggleScene = document.getElementById('btn-toggle-scene');
  if (btnToggleScene) {
    // Restore saved setting only if Chapter >= 2
    const savedSetting = localStorage.getItem('hyhy_scene_setting');
    const curChapter = state.storeState?.save?.chapter || 1;
    if (curChapter >= 2 && savedSetting && state.canvas && state.canvas.setSceneSetting) {
      state.canvas.setSceneSetting(savedSetting);
    } else if (state.canvas && state.canvas.setSceneSetting) {
      state.canvas.setSceneSetting('town');
    }

    btnToggleScene.addEventListener('click', () => {
      const save = state.storeState?.save;
      if (!save || (save.chapter || 1) < 2 || (save.debt_remaining || 0) > 0) {
        if (window.sound && window.sound.fail) window.sound.fail();
        showToast('🔒 Bối cảnh Bách Khoa bị khóa! Bạn phải trả hết sạch 3.000.000đ nợ mới có thể mở Chương 2!', 3500);
        return;
      }
      if (!state.canvas || !state.canvas.toggleSceneSetting) return;
      const newSetting = state.canvas.toggleSceneSetting();
      localStorage.setItem('hyhy_scene_setting', newSetting);
      if (window.sound) window.sound.bell();
      updateUI();
      const name = (newSetting === 'hust') 
        ? '🏛️ Cổng Parabol Đại học Bách Khoa Hà Nội' 
        : '🏡 Phố Nhỏ Quê Hương (Chương 1)';
      showToast(`📍 Bối cảnh chuyển sang: ${name}`, 3000);
    });
  }

  // Periodic clock badge updater
  setInterval(() => {
    if (state.canvas && state.canvas.getNightPatrolStatus) {
      const nStatus = state.canvas.getNightPatrolStatus();
      const elClockText = document.getElementById('game-clock-text');
      const elClockStatus = document.getElementById('game-clock-status');
      const elClockBadge = document.getElementById('game-clock-badge');
      if (elClockText) elClockText.innerText = nStatus.timeStr;
      if (elClockStatus) {
        if (nStatus.isBusinessHours) {
          elClockStatus.innerText = '🟢 Giờ bán';
          if (elClockBadge) {
            elClockBadge.style.background = 'rgba(80, 250, 123, 0.15)';
            elClockBadge.style.borderColor = '#50fa7b';
            elClockBadge.style.color = '#50fa7b';
          }
        } else if (nStatus.isAmuletInvalid) {
          elClockStatus.innerText = `💀 Sau 1h: VÔ HIỆU (${nStatus.probability}%)`;
          if (elClockBadge) {
            elClockBadge.style.background = 'rgba(255, 71, 87, 0.25)';
            elClockBadge.style.borderColor = '#ff4757';
            elClockBadge.style.color = '#ff4757';
          }
        } else {
          elClockStatus.innerText = `🔴 Quá giờ (${nStatus.probability}%)`;
          if (elClockBadge) {
            elClockBadge.style.background = 'rgba(255, 165, 2, 0.2)';
            elClockBadge.style.borderColor = '#ffa502';
            elClockBadge.style.color = '#ffa502';
          }
        }
      }
    }
  }, 1000);
}

