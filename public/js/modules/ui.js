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

  // Check active weather buff
  const bWeather = document.getElementById('buff-weather');
  if (bWeather && bWeather.style.display !== 'none') {
    hasAny = true;
  }

  bar.style.display = hasAny ? 'flex' : 'none';
}

export function updateMoneyDisplay(amount) {
  if (state.storeState && state.storeState.save) {
    state.storeState.save.money = amount;
  }
  const formatted = (amount || 0).toLocaleString('vi-VN') + 'đ';
  const elM = document.getElementById('stat-money');
  if (elM) elM.innerText = formatted;
  const mMoney = document.getElementById('menu-stat-money');
  if (mMoney) mMoney.innerText = formatted;
}

export function updateTeaCoinDisplay(amount) {
  if (state.storeState && state.storeState.save) {
    state.storeState.save.teacoin = amount;
  }
  const formatted = (amount || 0).toLocaleString('vi-VN');
  const elTeaCoin = document.getElementById('stat-teacoin');
  if (elTeaCoin) elTeaCoin.innerText = formatted;
  const mTeaCoin = document.getElementById('menu-stat-teacoin');
  if (mTeaCoin) mTeaCoin.innerText = formatted;
}

if (typeof window !== 'undefined') {
  window.updateMoneyDisplay = updateMoneyDisplay;
  window.updateTeaCoinDisplay = updateTeaCoinDisplay;
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

  // Sync Chapter, Invisibility Amulet & Collab Stalls to Canvas FIRST so scene state is accurate
  if (state.canvas) {
    state.canvas.setChapter(save.chapter || 1);
    const rawTalisman = save.upgrades ? save.upgrades.bua_an_than : 0;
    const talismanCount = typeof rawTalisman === 'number' ? rawTalisman : (rawTalisman ? 1 : 0);
    state.canvas.setHasAmulet(talismanCount > 0, talismanCount);
    if (save.upgrades) {
      state.canvas.setActivePet(save.upgrades.active_pet || null, !!save.upgrades.is_pet_stolen);
    }
    // Sync active NPC staff standing at counter (strictly from active TeaCoin contract)
    if (state.activeStaff && !state.activeStaff.expired) {
      state.canvas.activeStaff = state.activeStaff;
    } else {
      state.canvas.activeStaff = null;
    }
    if (state.workstation) {
      state.workstation.activeStaff = state.canvas.activeStaff;
    }
    // Sync active collab partner carts to canvas
    if (state.canvas.setCollabs && state.storeState && state.storeState.collabs) {
      state.canvas.setCollabs(state.storeState.collabs.activeCollabs || []);
    }
  }

  // Scene Switcher HUD Badge & Menu Button label/styling
  const btnToggleScene = document.getElementById('btn-toggle-scene');
  const menuSceneTitle = document.getElementById('menu-scene-title');
  const menuSceneIcon = document.getElementById('menu-scene-icon');
  const elSceneBadge = document.getElementById('scene-badge');
  if (state.canvas) {
    const chap = Number(save.chapter) || 1;
    const curScene = (typeof state.canvas.getEffectiveScene === 'function')
      ? state.canvas.getEffectiveScene()
      : (state.canvas.sceneSetting || 'town');
    const unlockedCount = (typeof state.canvas.getUnlockedScenes === 'function')
      ? state.canvas.getUnlockedScenes().length
      : (chap >= 4 ? 5 : chap === 3 ? 4 : chap === 2 ? 2 : 1);

    const sceneMetaMap = {
      town: {
        icon: '🏡',
        badgeText: '🏡 Phố Cổ',
        menuTitle: '🏡 Phố Cổ Hà Nội (C1)',
        color: '#f1c40f',
        bg: 'rgba(241, 196, 15, 0.16)'
      },
      hust: {
        icon: '🏛️',
        badgeText: '🏛️ Bách Khoa',
        menuTitle: '🏛️ ĐH Bách Khoa (C2)',
        color: '#00cec9',
        bg: 'rgba(0, 206, 201, 0.16)'
      },
      walking_street: {
        icon: '🏰',
        badgeText: '🏰 Phố Đi Bộ',
        menuTitle: '🏰 Phố Đi Bộ (C3)',
        color: '#2ecc71',
        bg: 'rgba(46, 204, 113, 0.16)'
      },
      moc_chau: {
        icon: '🌱',
        badgeText: '🌱 Mộc Châu',
        menuTitle: '🌱 Đồi Chè Mộc Châu (C3)',
        color: '#55efc4',
        bg: 'rgba(85, 239, 196, 0.16)'
      },
      franchise: {
        icon: '👑',
        badgeText: '👑 Sài Gòn',
        menuTitle: '👑 Đại Lộ Sài Gòn (C4)',
        color: '#e056fd',
        bg: 'rgba(224, 86, 253, 0.18)'
      }
    };

    const meta = sceneMetaMap[curScene] || sceneMetaMap.town;

    if (elSceneBadge) {
      elSceneBadge.innerText = meta.badgeText;
      elSceneBadge.style.borderColor = meta.color;
      elSceneBadge.style.color = meta.color;
      elSceneBadge.style.background = meta.bg;
      elSceneBadge.title = `Bối cảnh hiện tại: ${meta.menuTitle} — Nhấn để mở bảng chọn bối cảnh (${unlockedCount}/5 đã mở)`;
    }

    if (btnToggleScene) {
      if (menuSceneIcon) menuSceneIcon.innerText = meta.icon;
      if (menuSceneTitle) {
        menuSceneTitle.innerText = meta.menuTitle;
      } else {
        btnToggleScene.innerText = meta.menuTitle;
      }
      const mDesc = btnToggleScene.querySelector('.m-desc');
      if (mDesc) {
        mDesc.innerText = chap < 2
          ? `Đã mở 1/5 bối cảnh • Bấm để xem danh sách`
          : `Nhấn để chọn nhanh (${unlockedCount}/5 bối cảnh đã mở)`;
      }
      btnToggleScene.style.opacity = '1';
      btnToggleScene.style.borderColor = meta.color;
      btnToggleScene.style.color = meta.color;
      btnToggleScene.title = `Bối cảnh hiện tại: ${meta.menuTitle}. Nhấn để mở bảng chọn bối cảnh!`;
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

  // Debt Modal & Chapter Progression UI
  const debtSec = document.getElementById('chapter-2-unlock-section');
  const chap3Sec = document.getElementById('chapter-3-unlock-section');
  const chap4Sec = document.getElementById('chapter-4-unlock-section');
  const debtPayControls = document.getElementById('debt-pay-controls');
  const navDebtBtn = document.getElementById('nav-debt');
  const menuDebtTitle = document.getElementById('menu-debt-title');
  if (save.debt_remaining === 0) {
    if (debtSec) debtSec.style.display = (save.chapter === 1) ? 'block' : 'none';
    if (debtPayControls) debtPayControls.style.display = 'none';

    const canUnlockChap3 = (save.chapter === 2 && (save.money || 0) >= 50000000);
    if (chap3Sec) chap3Sec.style.display = canUnlockChap3 ? 'block' : 'none';

    const canUnlockChap4 = (save.chapter === 3 && (save.money || 0) >= 100000000);
    if (chap4Sec) chap4Sec.style.display = canUnlockChap4 ? 'block' : 'none';

    if (menuDebtTitle) {
      if (save.chapter === 1) menuDebtTitle.innerText = '🚀 Lên Chương 2';
      else if (canUnlockChap3) menuDebtTitle.innerText = '🏰 Lên Chương 3';
      else if (save.chapter === 2) menuDebtTitle.innerText = '🏆 Mục Tiêu 50Tr';
      else if (canUnlockChap4) menuDebtTitle.innerText = '👑 Lên Chương 4';
      else if (save.chapter === 3) menuDebtTitle.innerText = '👑 Mục Tiêu 100Tr';
      else menuDebtTitle.innerText = '👑 Đế Chế Toàn Cầu';
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
      } else if (canUnlockChap4) {
        navDebtBtn.innerHTML = '👑 Lên Chương 4';
        navDebtBtn.style.color = '#fdcb6e';
      } else if (save.chapter === 3) {
        navDebtBtn.innerHTML = '👑 Mục Tiêu 100Tr';
        navDebtBtn.style.color = '#fdcb6e';
      } else {
        navDebtBtn.innerHTML = '👑 Đế Chế Toàn Cầu';
        navDebtBtn.style.color = '#fdcb6e';
      }
    }
  }

  // Auto-refresh staff status if unlocked condition is met
  const isStaffEligible = ((save.chapter || 1) >= 3) || ((save.chapter || 1) >= 2 && (save.money || 0) >= 50000000);
  if (isStaffEligible && window.staffState && !window.staffState.isUnlocked && typeof window.checkStaffOnLoad === 'function') {
    window.checkStaffOnLoad();
  }

  if (save.debt_remaining > 0) {
    if (debtSec) debtSec.style.display = 'none';
    if (chap3Sec) chap3Sec.style.display = 'none';
    if (chap4Sec) chap4Sec.style.display = 'none';
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

export const SCENE_CATALOG = [
  {
    id: 'town',
    icon: '🏡',
    shortName: 'Phố Cổ',
    name: 'Phố Cổ Hà Nội',
    chapter: 1,
    color: '#f1c40f',
    bgTint: 'rgba(241, 196, 15, 0.14)',
    desc: 'Góc vỉa hè phố cổ sầm uất, nơi khởi nguồn chiếc xe đẩy trà sữa Hyhy.',
    unlockHint: 'Mở sẵn từ Chương 1'
  },
  {
    id: 'hust',
    icon: '🏛️',
    shortName: 'Bách Khoa',
    name: 'Cổng Parabol ĐH Bách Khoa',
    chapter: 2,
    color: '#00cec9',
    bgTint: 'rgba(0, 206, 201, 0.14)',
    desc: 'Thiên đường sinh viên Bách - Kinh - Xây tấp nập giờ tan tầm.',
    unlockHint: 'Mở khóa ở Chương 2 (Sau khi trả hết sạch 3.000.000đ nợ)'
  },
  {
    id: 'walking_street',
    icon: '🏰',
    shortName: 'Phố Đi Bộ',
    name: 'Flagship Phố Đi Bộ Hồ Gươm',
    chapter: 3,
    color: '#2ecc71',
    bgTint: 'rgba(46, 204, 113, 0.14)',
    desc: 'Cửa hàng Flagship 2 tầng mặt tiền trung tâm phố đi bộ nhộn nhịp.',
    unlockHint: 'Mở khóa ở Chương 3 (Đạt cột mốc vốn 50.000.000đ)'
  },
  {
    id: 'moc_chau',
    icon: '🌱',
    shortName: 'Mộc Châu',
    name: 'Đồi Chè Trái Tim Mộc Châu',
    chapter: 3,
    color: '#55efc4',
    bgTint: 'rgba(85, 239, 196, 0.14)',
    desc: 'Không gian cao nguyên đồi chè xanh mướt & nông trại trà Organic 5⭐.',
    unlockHint: 'Mở khóa ở Chương 3 (Cùng Nông Trại Chè Mộc Châu)'
  },
  {
    id: 'franchise',
    icon: '👑',
    shortName: 'Sài Gòn',
    name: 'Đại Lộ Sài Gòn & Nhượng Quyền',
    chapter: 4,
    color: '#e056fd',
    bgTint: 'rgba(224, 86, 253, 0.14)',
    desc: 'Tòa tháp thương mại rực rỡ ánh đèn neon giữa trung tâm đại lộ.',
    unlockHint: 'Mở khóa ở Chương 4 (Đạt cột mốc vốn 100.000.000đ)'
  }
];

export function renderSceneSelectorModal() {
  const listEl = document.getElementById('scene-selector-list');
  if (!listEl) return;

  const save = state.storeState?.save || {};
  const chap = Number(save.chapter) || 1;
  const curScene = (state.canvas && typeof state.canvas.getEffectiveScene === 'function')
    ? state.canvas.getEffectiveScene()
    : (state.canvas?.sceneSetting || 'town');

  listEl.innerHTML = SCENE_CATALOG.map(scene => {
    const isUnlocked = chap >= scene.chapter;
    const isActive = isUnlocked && curScene === scene.id;

    const borderColor = isActive ? scene.color : (isUnlocked ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)');
    const bgStyle = isActive
      ? `linear-gradient(135deg, ${scene.bgTint}, rgba(255,255,255,0.06))`
      : (isUnlocked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.28)');
    const opacity = isUnlocked ? '1' : '0.6';
    const cursor = isUnlocked ? 'pointer' : 'not-allowed';

    let statusBadge = '';
    if (isActive) {
      statusBadge = `<span style="background: ${scene.color}; color: #111; font-weight: 800; font-size: 0.76rem; padding: 4px 10px; border-radius: 20px; white-space: nowrap; box-shadow: 0 0 10px ${scene.color}66;">✓ Đang hiển thị</span>`;
    } else if (isUnlocked) {
      statusBadge = `<span style="background: rgba(255,255,255,0.1); border: 1px solid ${scene.color}; color: ${scene.color}; font-weight: bold; font-size: 0.76rem; padding: 4px 10px; border-radius: 20px; white-space: nowrap;">Chọn ngay ▶</span>`;
    } else {
      statusBadge = `<span style="background: rgba(255, 85, 85, 0.15); border: 1px solid #ff5555; color: #ff7675; font-weight: bold; font-size: 0.74rem; padding: 3px 8px; border-radius: 20px; white-space: nowrap;">🔒 Chương ${scene.chapter}</span>`;
    }

    return `
      <div class="scene-option-card" data-scene-id="${scene.id}" data-unlocked="${isUnlocked ? '1' : '0'}"
           style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: 10px; border: ${isActive ? '2px' : '1px'} solid ${borderColor}; background: ${bgStyle}; opacity: ${opacity}; cursor: ${cursor}; transition: transform 0.12s ease, border-color 0.15s ease;">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
          <div style="font-size: 1.9rem; line-height: 1; flex-shrink: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 8px; border: 1px solid ${isUnlocked ? scene.color : 'rgba(255,255,255,0.1)'};">
            ${scene.icon}
          </div>
          <div style="min-width: 0;">
            <div style="font-weight: 800; font-size: 0.95rem; color: ${isUnlocked ? scene.color : '#b2bec3'}; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span>${scene.name}</span>
              <span style="font-size: 0.7rem; padding: 1px 6px; border-radius: 4px; background: rgba(255,255,255,0.08); color: #dfe6e9;">Chương ${scene.chapter}</span>
            </div>
            <div style="font-size: 0.8rem; color: #dfe6e9; margin-top: 2px; line-height: 1.35;">
              ${isUnlocked ? scene.desc : `<span style="color: #fab1a0;">🔒 ${scene.unlockHint}</span>`}
            </div>
          </div>
        </div>
        <div style="flex-shrink: 0;">
          ${statusBadge}
        </div>
      </div>
    `;
  }).join('');

  // Sync Time-of-Day buttons inside modal
  const customTod = state.canvas ? state.canvas.customTimeOfDay : null;
  const activeTimeKey = customTod || 'auto';
  const timeModeLabel = document.getElementById('scene-time-mode-label');
  if (timeModeLabel && state.canvas) {
    timeModeLabel.innerText = customTod
      ? `🎨 Cố định: ${state.canvas.getTimeOfDayLabel ? state.canvas.getTimeOfDayLabel() : customTod}`
      : `⏱️ Tự động theo giờ quán (${state.canvas.getTimeOfDayLabel ? state.canvas.getTimeOfDayLabel() : ''})`;
  }

  document.querySelectorAll('#scene-time-selector-btns .btn-scene-time').forEach(btn => {
    const tKey = btn.getAttribute('data-time');
    const isSelected = tKey === activeTimeKey;
    btn.style.transform = isSelected ? 'scale(1.04)' : 'scale(1)';
    btn.style.boxShadow = isSelected ? '0 0 8px rgba(241, 196, 15, 0.5)' : 'none';
    btn.style.fontWeight = isSelected ? '800' : '600';
    btn.style.opacity = isSelected ? '1' : '0.72';
  });
}

export function openSceneSelectorModal() {
  const modal = document.getElementById('modal-scene-selector');
  if (!modal) return;
  if (window.sound && window.sound.pop) window.sound.pop();
  renderSceneSelectorModal();
  modal.style.display = 'flex';
}

// Store code copy & Scene Selector initialization
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

  // Open Scene Selector Modal from both Top HUD #scene-badge and Game Menu #btn-toggle-scene
  const btnToggleScene = document.getElementById('btn-toggle-scene');
  const elSceneBadge = document.getElementById('scene-badge');
  const modalSceneSelector = document.getElementById('modal-scene-selector');
  const closeSceneSelector = document.getElementById('close-scene-selector');
  const sceneSelectorList = document.getElementById('scene-selector-list');
  const sceneTimeBtns = document.getElementById('scene-time-selector-btns');

  if (btnToggleScene) {
    btnToggleScene.addEventListener('click', () => {
      openSceneSelectorModal();
    });
  }

  if (elSceneBadge) {
    elSceneBadge.addEventListener('click', () => {
      openSceneSelectorModal();
    });
  }

  if (closeSceneSelector && modalSceneSelector) {
    closeSceneSelector.addEventListener('click', () => {
      modalSceneSelector.style.display = 'none';
    });
    modalSceneSelector.addEventListener('click', (e) => {
      if (e.target === modalSceneSelector) modalSceneSelector.style.display = 'none';
    });
  }

  // Handle direct 1-click scene card selection
  if (sceneSelectorList) {
    sceneSelectorList.addEventListener('click', (e) => {
      const card = e.target.closest('.scene-option-card');
      if (!card) return;
      const sceneId = card.getAttribute('data-scene-id');
      const isUnlocked = card.getAttribute('data-unlocked') === '1';
      const sceneInfo = SCENE_CATALOG.find(s => s.id === sceneId);

      if (!isUnlocked) {
        if (window.sound && window.sound.fail) window.sound.fail();
        showToast(`🔒 ${sceneInfo ? sceneInfo.unlockHint : 'Bối cảnh này chưa mở khóa!'}`, 3500);
        return;
      }

      if (state.canvas && typeof state.canvas.setSceneSetting === 'function') {
        state.canvas.setSceneSetting(sceneId);
      }
      if (window.sound && window.sound.bell) window.sound.bell();
      updateUI();
      renderSceneSelectorModal();
      if (sceneInfo) {
        showToast(`📍 Đã chuyển sang bối cảnh: ${sceneInfo.icon} ${sceneInfo.name}`, 2500);
      }
    });
  }

  // Handle direct 1-click Time-of-Day lighting selection inside Scene Selector Modal
  if (sceneTimeBtns) {
    sceneTimeBtns.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-scene-time');
      if (!btn || !state.canvas) return;
      const timeVal = btn.getAttribute('data-time');
      state.canvas.customTimeOfDay = (timeVal === 'auto') ? null : timeVal;
      if (window.sound && window.sound.pop) window.sound.pop();
      const elTimeBadge = document.getElementById('time-of-day-badge');
      if (elTimeBadge && state.canvas.getTimeOfDayLabel) {
        elTimeBadge.innerText = state.canvas.getTimeOfDayLabel();
      }
      renderSceneSelectorModal();
      const modeNames = {
        auto: '🔄 Tự động theo đồng hồ quán',
        morning: '🌅 Buổi Sáng Bình Minh',
        noon: '☀️ Buổi Trưa Nắng Ấm',
        afternoon: '🌇 Buổi Chiều Hoàng Hôn',
        night: '🌙 Buổi Tối Lung Linh'
      };
      showToast(`🎨 Khung giờ bối cảnh: ${modeNames[timeVal] || timeVal}`, 2200);
    });
  }

  // Also allow clicking #time-of-day-badge on top HUD to quickly cycle time-of-day lighting
  const elTimeOfDayBadge = document.getElementById('time-of-day-badge');
  if (elTimeOfDayBadge) {
    elTimeOfDayBadge.addEventListener('click', () => {
      if (!state.canvas || typeof state.canvas.cycleTimeOfDay !== 'function') return;
      const res = state.canvas.cycleTimeOfDay();
      if (window.sound && window.sound.pop) window.sound.pop();
      elTimeOfDayBadge.innerText = state.canvas.getTimeOfDayLabel();
      showToast(`🌅 Khung cảnh: ${res.label}`, 2200);
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


