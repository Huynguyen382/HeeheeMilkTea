// Story Quest Tracker HUD Widget & Dynamic Milestone Watcher
import { state } from './state.js';
import { showToast } from './toast.js';

let isTrackerCollapsed = false;
try {
  if (typeof localStorage !== 'undefined') {
    isTrackerCollapsed = localStorage.getItem('heehee_quest_tracker_collapsed') === 'true';
  }
} catch (e) {}
const triggeredMilestones = new Set();

/**
 * Open Story modal directly switched to Quests or Album tab
 */
export function openStoryQuestsTab(chapterNum = null) {
  if (typeof window.openStoryModal === 'function') {
    const chap = chapterNum || state.storeState?.save?.chapter || 1;
    window.openStoryModal(0, chap);
    if (typeof window.switchStoryTab === 'function') {
      window.switchStoryTab('quests');
    } else {
      const tabQuests = document.getElementById('story-tab-quests');
      if (tabQuests) tabQuests.click();
    }
  }
}

/**
 * Determine the active primary quest objective for the current player state
 */
export function getActiveStoryQuest() {
  if (!state.storeState || !state.storeState.save) {
    return {
      chapter: 1,
      icon: '🎯',
      title: 'Khởi nghiệp vỉa hè',
      desc: 'Chuẩn bị quầy & đón khách đầu tiên',
      progressText: 'Đang tải...',
      pct: 0
    };
  }

  const save = state.storeState.save;
  const daily = state.storeState.daily_stats || {};
  const currentChapter = Math.min(5, Math.max(1, Number(save.chapter || 1)));

  let recipes = [];
  try {
    recipes = typeof save.recipes === 'string' ? JSON.parse(save.recipes) : (save.recipes || []);
  } catch (e) {
    recipes = ['tra_sua_truyen_thong'];
  }

  let upgrades = {};
  try {
    upgrades = typeof save.upgrades === 'string' ? JSON.parse(save.upgrades) : (save.upgrades || {});
  } catch (e) {
    upgrades = {};
  }

  let franchises = [];
  try {
    franchises = typeof save.franchises === 'string' ? JSON.parse(save.franchises) : (save.franchises || []);
  } catch (e) {
    franchises = [];
  }

  const money = Number(save.money !== undefined ? save.money : (save.cash || 0));
  const debt = Number(save.debt_remaining !== undefined ? save.debt_remaining : 3000000);

  // CHAPTER 1
  if (currentChapter === 1) {
    const ordersServed = Number(daily.orders_served || 0);
    if (ordersServed === 0 && money <= 200000) {
      return {
        chapter: 1,
        icon: '🧋',
        title: 'Đôi Bàn Tay Vàng: Giao ly trà sữa đầu tiên',
        desc: 'Chọn cốt trà, đường đá, topping và hoàn thành 1 ly giao cho khách.',
        progressText: '0/1 ly',
        pct: 0
      };
    }
    if (recipes.length < 2) {
      return {
        chapter: 1,
        icon: '📜',
        title: 'Mở Rộng Thực Đơn: Mua thêm công thức mới',
        desc: 'Vào [Nâng Cấp] để mua công thức món mới (Lục Trà Lài hoặc Sữa Tươi Hoàng Kim).',
        progressText: `${recipes.length}/2 món`,
        pct: 50
      };
    }
    if (debt > 2500000) {
      const paid = Math.max(0, 3000000 - debt);
      const pct = Math.min(100, Math.round((paid / 500000) * 100));
      return {
        chapter: 1,
        icon: '💸',
        title: 'Trút Bớt Gánh Nặng: Trả 500.000đ đầu tiên',
        desc: 'Bấm [Sổ Nợ] trả góp 500k cho Anh Bảnh để giảm áp lực.',
        progressText: `${paid.toLocaleString('vi-VN')}đ / 500k`,
        pct
      };
    }
    if (debt > 1500000) {
      const paid = Math.max(0, 3000000 - debt);
      const pct = Math.min(100, Math.round((paid / 3000000) * 100));
      return {
        chapter: 1,
        icon: '🎯',
        title: 'Nhiệm vụ: Trả nợ cho Anh Bảnh (Mốc 1.5M)',
        desc: 'Cày cuốc đạt mốc 1.500.000đ để khiến Anh Bảnh bất ngờ!',
        progressText: `${paid.toLocaleString('vi-VN')}đ / 3.000.000đ`,
        pct
      };
    }
    if (debt > 0) {
      const paid = Math.max(0, 3000000 - debt);
      const pct = Math.min(100, Math.round((paid / 3000000) * 100));
      return {
        chapter: 1,
        icon: '🏆',
        title: 'Nhiệm vụ: Trả sạch 3.000.000đ nợ Anh Bảnh',
        desc: 'Xóa sổ món nợ xe đẩy để chính thức làm chủ tiệm và mở Chương 2!',
        progressText: `${paid.toLocaleString('vi-VN')}đ / 3.000.000đ`,
        pct
      };
    }
    return {
      chapter: 1,
      icon: '🎉',
      title: 'Đã Sạch Nợ! Mở Khóa Chương 2 Ngay',
      desc: 'Nhấn vào [Sổ Nợ Anh Bảnh] để chính thức bước sang Chương 2: Góc Hẻm Sinh Viên!',
      progressText: '3.000.000đ / 3Tr (Hoàn tất)',
      pct: 100
    };
  }

  // CHAPTER 2
  if (currentChapter === 2) {
    const hasGenZ = recipes.includes('sua_tuoi_duong_den') || recipes.includes('tra_dao_cam_sa');
    if (!hasGenZ) {
      return {
        chapter: 2,
        icon: '🍹',
        title: 'Nhiệm vụ: Mở khóa Trà Đào Cam Sả / Đường Đen',
        desc: 'Vào [Nâng Cấp] sắm ngay hương vị Gen Z để đón bão sinh viên Bách Khoa.',
        progressText: '0/1 công thức',
        pct: 0
      };
    }
    if (!upgrades.tiktoker_ever_invited) {
      return {
        chapter: 2,
        icon: '📱',
        title: 'Bão Trending: Mời Tú TikToker ghé tiệm',
        desc: 'Book review TikTok để bùng nổ đơn hàng x3 doanh thu quán.',
        progressText: '0/1 lần',
        pct: 0
      };
    }
    if (!upgrades.active_pet) {
      return {
        chapter: 2,
        icon: '🐾',
        title: 'Người Bạn Đồng Hành: Nhận nuôi 1 Thú Cưng',
        desc: 'Nuôi Corgi, Mèo Chiêu Tài hoặc Capybara để tăng Tip và cảnh giới trộm cắp.',
        progressText: 'Chưa có',
        pct: 0
      };
    }
    if (!(save.thieves_caught && save.thieves_caught > 0)) {
      return {
        chapter: 2,
        icon: '🚨',
        title: 'Đội Trưởng An Ninh: Tóm 1 tên trộm áo đen',
        desc: 'Nhấp chuột nhanh tóm gọn tên trộm rình mò thú cưng của quán.',
        progressText: '0/1 tên',
        pct: 0
      };
    }
    if (money < 25000000) {
      const pct = Math.min(100, Math.round((money / 25000000) * 100));
      return {
        chapter: 2,
        icon: '⚔️',
        title: 'Cột Mốc 25 Triệu: Đối đầu Lão Ba Trâu Vàng',
        desc: 'Tích lũy 25 triệu đồng và sẵn sàng thẻ phòng thủ trước đòn bẩn của đối thủ.',
        progressText: `${(money / 1000000).toFixed(1)}Tr / 25Tr`,
        pct
      };
    }
    if (money < 50000000) {
      const pct = Math.min(100, Math.round((money / 50000000) * 100));
      return {
        chapter: 2,
        icon: '🏰',
        title: 'Bước Ra Phố Lớn: Tích lũy 50.000.000đ',
        desc: 'Tích lũy đủ vốn để thuê mặt bằng Flagship Store 2 Tầng tại Phố Đi Bộ.',
        progressText: `${(money / 1000000).toFixed(1)}Tr / 50Tr`,
        pct
      };
    }
    return {
      chapter: 2,
      icon: '🎉',
      title: 'Đủ 50Tr Vốn! Mở Khóa Chương 3 Phố Đi Bộ',
      desc: 'Bấm [Sổ Nợ / Chương] để khai trương Flagship Store 2 Tầng!',
      progressText: '50Tr / 50Tr (Hoàn tất)',
      pct: 100
    };
  }

  // CHAPTER 3
  if (currentChapter === 3) {
    const hasLuxury = recipes.includes('tra_sua_dat_vang') || recipes.includes('nitro_cold_brew');
    if (!hasLuxury) {
      return {
        chapter: 3,
        icon: '✨',
        title: 'Thực Đơn Thượng Lưu: Mở Trà Dát Vàng / Nitro',
        desc: 'Sắm công thức sang chảnh để phục vụ giới sành điệu Phố Đi Bộ.',
        progressText: '0/1 món',
        pct: 0
      };
    }
    if (!upgrades.staff_be_bap_manager) {
      return {
        chapter: 3,
        icon: '👩‍💼',
        title: 'Thăng Chức Bé Bắp lên Cửa Hàng Trưởng',
        desc: 'Tự động dập nắp ly 100% siêu tốc và tăng +25% doanh thu mọi đơn.',
        progressText: 'Chưa thăng chức',
        pct: 0
      };
    }
    if (!upgrades.staff_anh_lam_captain) {
      return {
        chapter: 3,
        icon: '🏍️',
        title: 'Thăng Chức Anh Lâm lên Đội Trưởng Logistics',
        desc: 'Chỉ huy hạm đội xe Wave và Dream tăng +35% doanh thu shipper.',
        progressText: 'Chưa thăng chức',
        pct: 0
      };
    }
    if (money < 100000000) {
      const pct = Math.min(100, Math.round((money / 100000000) * 100));
      return {
        chapter: 3,
        icon: '👑',
        title: 'Đế Chế Nhượng Quyền: Tích lũy 100 Triệu Đồng',
        desc: 'Tích lũy vốn để mở rộng thương hiệu toàn cầu sang Chương 4.',
        progressText: `${(money / 1000000).toFixed(1)}Tr / 100Tr`,
        pct
      };
    }
    return {
      chapter: 3,
      icon: '👑',
      title: 'Đủ 100Tr Vốn! Mở Khóa Chương 4 Toàn Cầu',
      desc: 'Bấm vào [Đế Chế] để mở Chi Nhánh Sài Gòn Nguyễn Huệ đầu tiên!',
      progressText: '100Tr / 100Tr (Hoàn tất)',
      pct: 100
    };
  }

  // CHAPTER 4
  if (currentChapter === 4) {
    if (!recipes.includes('matcha_kyoto_dat_bac')) {
      return {
        chapter: 4,
        icon: '🍵',
        title: 'Matcha Hoàng Gia: Mở Matcha Kyoto Dát Bạc',
        desc: 'Công thức trà danh giá chinh phục thực khách quốc tế.',
        progressText: '0/1 món',
        pct: 0
      };
    }
    const hasAuction = (save.auction_won_count && save.auction_won_count > 0) || (upgrades.auction_won && upgrades.auction_won > 0);
    if (!hasAuction) {
      return {
        chapter: 4,
        icon: '🔨',
        title: 'Sàn Đấu Giá: Thắng 1 mẻ Trà Cổ Thụ Tà Xùa',
        desc: 'Tranh đoạt mẻ trà quý trên Sàn Đấu Giá Quốc Tế trong mục [Đế Chế].',
        progressText: '0/1 mẻ',
        pct: 0
      };
    }
    const hasLvl2 = franchises.some(f => f.level >= 2);
    if (!hasLvl2) {
      return {
        chapter: 4,
        icon: '⭐',
        title: 'Nâng Cấp Chi Nhánh Nhượng Quyền Lên Cấp 2',
        desc: 'Nâng cấp chi nhánh để nhân đôi dòng tiền thụ động định kỳ.',
        progressText: 'Cấp 1/2',
        pct: 50
      };
    }
    if (money < 200000000) {
      const pct = Math.min(100, Math.round((money / 200000000) * 100));
      return {
        chapter: 4,
        icon: '🏆',
        title: 'Vua Trà Sữa Đô Thị: Tích lũy 200 Triệu Đồng',
        desc: 'Ghi tên vào Bảng Vàng Boba Tycoon Legend toàn cầu.',
        progressText: `${(money / 1000000).toFixed(1)}Tr / 200Tr`,
        pct
      };
    }
    return {
      chapter: 4,
      icon: '🌌',
      title: 'Đủ 200Tr! Đăng Quang Vua Trà Sữa Vũ Trụ (C5)',
      desc: 'Bấm [Đế Chế] để mở khóa Chương 5: Vương Triều Vũ Trụ rực rỡ!',
      progressText: '200Tr / 200Tr (Hoàn tất)',
      pct: 100
    };
  }

  // CHAPTER 5
  if (currentChapter >= 5) {
    if (save.cart_skin !== 'cosmic_coffee_cart') {
      return {
        chapter: 5,
        icon: '🌌',
        title: 'Siêu Xe Ngân Hà: Trang bị Skin Cosmic Cart',
        desc: 'Kích hoạt Skin Xe Đẩy Vũ Trụ Ngân Hà tỏa sáng rực rỡ.',
        progressText: 'Chưa trang bị',
        pct: 0
      };
    }
    const hasCosmicRecipe = recipes.includes('hong_tra_vuong_trieu_thap_cam') || recipes.includes('tra_sua_vu_tru_ngan_ha');
    if (!hasCosmicRecipe) {
      return {
        chapter: 5,
        icon: '💎',
        title: 'Tuyệt Phẩm Hoàng Gia: Mở Hồng Trà Vương Triều',
        desc: 'Sở hữu tuyệt phẩm trà đắt giá nhất vũ trụ.',
        progressText: '0/1 món',
        pct: 0
      };
    }
    if (franchises.length < 3) {
      return {
        chapter: 5,
        icon: '🌐',
        title: 'Đế Chế Toàn Thiên Hà: Mở 3 Chi Nhánh Quốc Tế',
        desc: 'Phủ sóng thương hiệu tại Sài Gòn, Tokyo, Seoul...',
        progressText: `${franchises.length}/3 chi nhánh`,
        pct: Math.min(100, Math.round((franchises.length / 3) * 100))
      };
    }
    if (money < 300000000) {
      const pct = Math.min(100, Math.round((money / 300000000) * 100));
      return {
        chapter: 5,
        icon: '👑',
        title: 'Huyền Thoại Bất Tử: Tích lũy 300.000.000đ',
        desc: 'Ngai Vàng Bất Diệt cho Nhà Sáng Lập vĩ đại nhất thiên hà.',
        progressText: `${(money / 1000000).toFixed(1)}Tr / 300Tr`,
        pct
      };
    }
    return {
      chapter: 5,
      icon: '👑',
      title: 'ĐẠI KẾT CỤC HOÀN MỸ: VUA TRÀ SỮA THIÊN HÀ!',
      desc: 'Tất cả nhân vật hội tụ trong Đêm Đại Tiệc Tri Ân Thiên Hà!',
      progressText: 'Đại Thành Tựu 👑',
      pct: 100
    };
  }

  return {
    chapter: currentChapter,
    icon: '🎯',
    title: 'Hành Trình Khởi Nghiệp HeeHee',
    desc: 'Phục vụ khách hàng và phát triển tiệm trà sữa.',
    progressText: 'Tiến độ',
    pct: 100
  };
}

/**
 * Update the HUD Story Quest Tracker Widget DOM
 */
export function updateHUDStoryQuestTracker() {
  const container = document.getElementById('hud-story-quest-tracker');
  if (!container) return;

  const q = getActiveStoryQuest();

  const iconEl = document.getElementById('tracker-icon-badge');
  const chapTagEl = document.getElementById('tracker-chap-tag');
  const titleEl = document.getElementById('tracker-objective');
  const progTagEl = document.getElementById('tracker-progress-tag');
  const barFillEl = document.getElementById('tracker-bar-fill');

  if (iconEl) iconEl.innerText = q.icon || '🎯';
  if (chapTagEl) chapTagEl.innerText = `Chương ${q.chapter}`;
  if (titleEl) titleEl.innerText = q.title;
  if (progTagEl) progTagEl.innerText = q.progressText;
  if (barFillEl) barFillEl.style.width = `${Math.min(100, Math.max(0, q.pct))}%`;

  if (isTrackerCollapsed) {
    container.classList.add('collapsed');
  } else {
    container.classList.remove('collapsed');
  }

  const toggleBtn = document.getElementById('btn-collapse-tracker');
  if (toggleBtn) {
    toggleBtn.innerText = isTrackerCollapsed ? '▸' : '▾';
  }
}

/**
 * Initialize Tracker events & storage
 */
export function initHUDStoryQuestTracker() {
  const container = document.getElementById('hud-story-quest-tracker');
  const clickArea = document.getElementById('hud-quest-tracker-click-area');
  const toggleBtn = document.getElementById('btn-collapse-tracker');

  if (clickArea) {
    clickArea.addEventListener('click', (e) => {
      // If clicking toggle button, let toggle handle it
      if (e.target.closest('#btn-collapse-tracker')) return;
      openStoryQuestsTab();
    });
  }

  if (toggleBtn && container) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isTrackerCollapsed = !isTrackerCollapsed;
      localStorage.setItem('heehee_quest_tracker_collapsed', isTrackerCollapsed ? 'true' : 'false');
      updateHUDStoryQuestTracker();
    });
  }

  // Restore milestones from local storage
  try {
    const storeCode = state.storeState?.store_code || 'default';
    const saved = localStorage.getItem(`heehee_milestones_${storeCode}`);
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) list.forEach(id => triggeredMilestones.add(id));
    }
  } catch (e) {}

  updateHUDStoryQuestTracker();
}

/**
 * Check and trigger dynamic milestone cutscenes automatically
 */
export function checkDynamicMilestones() {
  if (!state.storeState || !state.storeState.save) return;
  const save = state.storeState.save;
  const currentChapter = Number(save.chapter || 1);
  const money = Number(save.money !== undefined ? save.money : (save.cash || 0));
  const debt = Number(save.debt_remaining !== undefined ? save.debt_remaining : 3000000);

  let upgrades = {};
  try {
    upgrades = typeof save.upgrades === 'string' ? JSON.parse(save.upgrades) : (save.upgrades || {});
  } catch (e) {
    upgrades = {};
  }

  const storeCode = state.storeState?.store_code || 'default';

  function triggerMilestone(id, toastMsg, callback) {
    if (triggeredMilestones.has(id)) return;
    triggeredMilestones.add(id);

    try {
      localStorage.setItem(`heehee_milestones_${storeCode}`, JSON.stringify(Array.from(triggeredMilestones)));
    } catch (e) {}

    // Play celebration sound
    if (window.sound && typeof window.sound.celebration === 'function') {
      window.sound.celebration();
    } else if (window.sound && typeof window.sound.bossVictory === 'function') {
      window.sound.bossVictory();
    }

    // Show celebration Toast
    showToast(toastMsg, 5000);

    // Call cutscene trigger if registered
    setTimeout(() => {
      if (typeof window.triggerMilestoneCutscene === 'function') {
        window.triggerMilestoneCutscene(id);
      } else if (typeof callback === 'function') {
        callback();
      }
    }, 600);
  }

  // 1. Chapter 1 Milestone 1.5M: Debt remaining <= 1.5M
  if (currentChapter === 1 && debt <= 1500000 && debt > 0) {
    triggerMilestone(
      'c1_milestone_1_5m',
      '🌟 CỘT MỐC 1.5 TRIỆU: Anh Bảnh ghé quầy kiểm tra và bất ngờ!',
      () => {
        if (typeof window.openStoryModal === 'function') window.openStoryModal(8, 1);
      }
    );
  }

  // 2. Chapter 1 Milestone Sạch Nợ: Debt == 0
  if (currentChapter === 1 && debt === 0) {
    triggerMilestone(
      'c1_milestone_debt_zero',
      '🎉 CỘT MỐC VÀNG: Trả sạch toàn bộ 3.000.000đ nợ! Chiếc xe đẩy vỉa hè nay chính thức là của bạn!',
      () => {
        if (typeof window.openStoryModal === 'function') window.openStoryModal(0, 2);
      }
    );
  }

  // 3. Chapter 2 Milestone 25M: Revenue/Money >= 25M
  if (currentChapter === 2 && money >= 25000000) {
    triggerMilestone(
      'c2_milestone_25m',
      '⚔️ CỘT MỐC 25 TRIỆU: Lão Ba Trâu Vàng bắt đầu hoảng sợ và tung đòn hiểm!',
      () => {
        if (typeof window.openStoryModal === 'function') window.openStoryModal(7, 2);
      }
    );
  }

  // 4. Chapter 3 Milestone Mộc Châu: Promoted staff or money >= 60M
  if (currentChapter === 3 && (upgrades.staff_be_bap_manager || upgrades.staff_anh_lam_captain || money >= 60000000)) {
    triggerMilestone(
      'c3_milestone_moc_chau',
      '🍃 CỘT MỐC: Bước Ngoặt Khai Phá Nông Trại Đồi Chè Mộc Châu!',
      () => {
        if (typeof window.openStoryModal === 'function') window.openStoryModal(5, 3);
      }
    );
  }

  // 5. Chapter 4 Milestone Auction: Auction won or money >= 120M
  const hasAuctionWon = (save.auction_won_count && save.auction_won_count > 0) || (upgrades.auction_won && upgrades.auction_won > 0);
  if (currentChapter === 4 && (hasAuctionWon || money >= 120000000)) {
    triggerMilestone(
      'c4_milestone_auction',
      '🔨 CỘT MỐC QUỐC TẾ: Đại Chiến Đấu Giá Trà Cổ Thụ Tà Xùa!',
      () => {
        if (typeof window.openStoryModal === 'function') window.openStoryModal(5, 4);
      }
    );
  }

  // 6. Chapter 5 Grand Epilogue: Money >= 200M or Endgame
  if (currentChapter >= 5 && money >= 200000000) {
    triggerMilestone(
      'c5_milestone_grand_epilogue',
      '👑 ĐẠI KẾT CỤC THIÊN HÀ: Đại Tiệc Tri Ân Toàn Vũ Trụ (Grand Epilogue)!',
      () => {
        if (typeof window.openStoryModal === 'function') window.openStoryModal(6, 5);
      }
    );
  }
}
