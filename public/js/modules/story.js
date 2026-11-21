// Story & Narrative Guided Tutorial System & Memory Album Badges
import { state } from './state.js';
import { STORY_DATA, STORY_MILESTONES } from './story-data.js';
import { showToast } from './toast.js';

let storyChapter = 1;
let storySceneIdx = 0;

let modalStory = null;
let closeStory = null;
let btnStoryHeader = null;
let navStory = null;

let tabDialogue = null;
let tabQuests = null;
let tabAlbum = null;
let tabGuide = null;

let viewDialogue = null;
let viewQuests = null;
let viewAlbum = null;
let viewGuide = null;

let storyTitleEl = null;
let storyAvatarEl = null;
let storyNameEl = null;
let storyRoleEl = null;
let storyTextEl = null;
let storyHintBox = null;
let storyHintIcon = null;
let storyHintText = null;

let btnStoryPrev = null;
let btnStoryNext = null;
let btnStoryReplay = null;
let storyStepIndicator = null;
let storyQuestList = null;

let storyAlbumList = null;
let storyAlbumUnlockedCount = null;

export function openStoryModal(sceneIdx = 0, chapterNum = null) {
  const currentChapter = state.storeState?.save?.chapter || 1;
  const debt = state.storeState?.save?.debt_remaining ?? 3000000;

  if (chapterNum && chapterNum >= 2) {
    if (currentChapter < chapterNum && debt > 0 && currentChapter === 1) {
      showToast('🔒 Bạn chưa trả hết nợ! Cần trả sạch 3.000.000đ nợ mới có thể mở Chương 2!', 3500);
      storyChapter = 1;
    } else {
      storyChapter = chapterNum;
    }
  } else if (chapterNum) {
    storyChapter = chapterNum;
  } else {
    storyChapter = (currentChapter >= 2) ? currentChapter : 1;
  }

  storySceneIdx = sceneIdx;
  storyQuestChapter = storyChapter;
  switchStoryTab('dialogue');
  renderStoryScene(storySceneIdx);
  if (modalStory) modalStory.style.display = 'flex';
}

export function closeStoryModal() {
  if (modalStory) modalStory.style.display = 'none';
}

export function switchStoryTab(tabName) {
  [tabDialogue, tabQuests, tabAlbum, tabGuide].forEach(t => t && t.classList.remove('active'));
  if (viewDialogue) viewDialogue.style.display = 'none';
  if (viewQuests) viewQuests.style.display = 'none';
  if (viewAlbum) viewAlbum.style.display = 'none';
  if (viewGuide) viewGuide.style.display = 'none';

  if (tabName === 'dialogue') {
    if (tabDialogue) tabDialogue.classList.add('active');
    if (viewDialogue) viewDialogue.style.display = 'flex';
  } else if (tabName === 'quests') {
    if (tabQuests) tabQuests.classList.add('active');
    if (viewQuests) viewQuests.style.display = 'block';
    renderStoryQuests();
  } else if (tabName === 'album') {
    if (tabAlbum) tabAlbum.classList.add('active');
    if (viewAlbum) viewAlbum.style.display = 'block';
    renderMemoryAlbum();
  } else if (tabName === 'guide') {
    if (tabGuide) tabGuide.classList.add('active');
    if (viewGuide) viewGuide.style.display = 'block';
  }
}

export function renderStoryScene(idx) {
  const chap = STORY_DATA[storyChapter] || STORY_DATA[1];
  const scenes = chap.scenes;
  if (idx < 0) idx = 0;
  if (idx >= scenes.length) idx = scenes.length - 1;
  storySceneIdx = idx;

  const sc = scenes[storySceneIdx];

  // If this is a milestone scene, record it as unlocked
  if (sc.isMilestone && sc.id) {
    try {
      localStorage.setItem('heehee_milestone_' + sc.id, 'unlocked');
      localStorage.setItem('heehee_milestone_seen_' + sc.id, 'true');
    } catch (e) {}
  }

  if (storyTitleEl) {
    if (sc.isMilestone) {
      storyTitleEl.innerHTML = `<span style="color: #ff79c6; font-weight: bold;">⭐ [CỘT MỐC]: ${sc.milestoneTitle || chap.title}</span>`;
    } else {
      storyTitleEl.innerText = chap.title;
    }
  }

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

  // Render chapter selector pills if multiple chapters unlocked
  const selectorEl = document.getElementById('story-chapter-selector');
  if (selectorEl) {
    const maxChap = Math.min(5, Math.max(1, state.storeState?.save?.chapter || 1));
    if (maxChap > 1) {
      let html = '';
      for (let c = 1; c <= maxChap; c++) {
        const active = (c === storyChapter);
        html += `<button type="button" class="btn-chap-pick" data-chap="${c}" style="background: ${active ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}; color: ${active ? '#111' : '#fff'}; border: 1px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.2)'}; border-radius: 4px; padding: 1px 6px; font-size: 0.72rem; cursor: pointer; font-weight: ${active ? 'bold' : 'normal'};">C${c}</button>`;
      }
      selectorEl.innerHTML = html;
      selectorEl.querySelectorAll('.btn-chap-pick').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetC = parseInt(e.currentTarget.dataset.chap, 10);
          storyChapter = targetC;
          renderStoryScene(0);
        });
      });
    } else {
      selectorEl.innerHTML = '';
    }
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
      btnStoryNext.innerText = sc.isMilestone ? '✨ ĐÃ HIỂU & TIẾP TỤC!' : '🚀 BẮT ĐẦU PHA CHẾ NGAY!';
      btnStoryNext.style.background = 'linear-gradient(180deg, #50fa7b, #2e8b57)';
    } else {
      btnStoryNext.innerText = 'Tiếp tục ▶';
      btnStoryNext.style.background = 'linear-gradient(180deg, #f4c430, #b8860b)';
    }
  }

  if (window.sound && window.sound.talk) window.sound.talk(520);
}

let storyQuestChapter = 1;

export function renderStoryQuests() {
  if (!storyQuestList || !state.storeState || !state.storeState.save) return;
  const save = state.storeState.save;
  const daily = state.storeState.daily_stats || {};

  // Safe parse from database
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

  const currentChapter = save.chapter || 1;
  const maxChap = Math.min(5, Math.max(1, currentChapter));
  if (!storyQuestChapter || storyQuestChapter > maxChap) {
    storyQuestChapter = currentChapter;
  }
  const viewingChapter = storyQuestChapter;

  // Render chapter selector pills in Quests tab
  const questChapterSelector = document.getElementById('story-quests-chapter-selector');
  if (questChapterSelector) {
    if (maxChap > 1) {
      let html = '';
      for (let c = 1; c <= maxChap; c++) {
        const active = (c === viewingChapter);
        const isCompleted = (c < currentChapter);
        const badge = isCompleted ? '✅' : '📍';
        html += `<button type="button" class="btn-quest-chap-pick" data-chap="${c}" style="background: ${active ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}; color: ${active ? '#111' : '#fff'}; border: 1px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.2)'}; border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; cursor: pointer; font-weight: ${active ? 'bold' : 'normal'}; display: inline-flex; align-items: center; gap: 3px;">
          <span>${badge} C${c}</span>
        </button>`;
      }
      questChapterSelector.innerHTML = html;
      questChapterSelector.querySelectorAll('.btn-quest-chap-pick').forEach(btn => {
        btn.addEventListener('click', (e) => {
          storyQuestChapter = parseInt(e.currentTarget.dataset.chap, 10);
          renderStoryQuests();
        });
      });
    } else {
      questChapterSelector.innerHTML = '';
    }
  }

  const money = save.money !== undefined ? save.money : (save.cash || 0);
  const debt = save.debt_remaining !== undefined ? save.debt_remaining : 3000000;

  let quests = [];

  if (viewingChapter === 1) {
    const isChap1Passed = currentChapter > 1;
    quests = [
      {
        id: 'q1', icon: '🌟', title: 'Khởi Nghiệp Vỉa Hè',
        desc: 'Đăng ký tiệm & chuẩn bị quầy bán trà sữa.',
        reward: 'Vốn khởi điểm: 200.000đ',
        isDone: true, progressText: 'Hoàn tất'
      },
      {
        id: 'q2', icon: '🍹', title: 'Đôi Bàn Tay Vàng',
        desc: 'Hoàn thành pha chế và giao ít nhất 1 ly trà sữa cho khách.',
        reward: 'Kinh nghiệm Barista',
        isDone: isChap1Passed || (daily.orders_served && daily.orders_served > 0) || money > 200000,
        progressText: (isChap1Passed || daily.orders_served > 0 || money > 200000) ? '1/1 ly' : '0/1 ly'
      },
      {
        id: 'q3', icon: '🍊', title: 'Mở Rộng Thực Đơn',
        desc: 'Mua thêm ít nhất 1 công thức món mới trong mục [Nâng Cấp].',
        reward: 'Bán được món giá cao',
        isDone: isChap1Passed || recipes.length >= 2,
        progressText: isChap1Passed ? 'Đã mở rộng' : `${recipes.length}/2 món`
      },
      {
        id: 'q4', icon: '💸', title: 'Trút Bớt Gánh Nặng',
        desc: 'Trả ít nhất 500.000đ nợ đầu tiên cho Anh Bảnh.',
        reward: 'Giảm áp lực đòi nợ',
        isDone: isChap1Passed || debt <= 2500000,
        progressText: (isChap1Passed || debt <= 2500000) ? 'Đã trả' : 'Chưa trả'
      },
      {
        id: 'q5', icon: '🏆', title: 'Tự Do Khởi Nghiệp',
        desc: 'Trả hết sạch 3.000.000đ nợ cho Anh Bảnh để mở khóa Chương 2!',
        reward: 'Mở khóa Chương 2',
        isDone: isChap1Passed || debt === 0,
        progressText: isChap1Passed ? '3.000.000đ / 3Tr (Hoàn tất)' : `${(3000000 - debt).toLocaleString('vi-VN')}đ / 3Tr`
      }
    ];
  } else if (viewingChapter === 2) {
    const isChap2Passed = currentChapter > 2;
    const targetMoney = 50000000;
    quests = [
      {
        id: 'c2_q1', icon: '📦', title: 'Bài Toán Chi Phí',
        desc: 'Đạt doanh thu 80.000đ/ngày để bù đắp chi phí mặt bằng khi Kết Ca.',
        reward: 'Kỹ năng quản lý tài chính',
        isDone: isChap2Passed || (daily.earned_today || 0) >= 80000,
        progressText: isChap2Passed ? 'Đã hoàn tất' : `${(daily.earned_today || 0).toLocaleString('vi-VN')}đ / 80k`
      },
      {
        id: 'c2_q2', icon: '🍹', title: 'Hương Vị Gen Z',
        desc: 'Sở hữu công thức Sữa Tươi Đường Đen hoặc Trà Đào Cam Sả.',
        reward: 'Thu hút khách sành điệu',
        isDone: isChap2Passed || recipes.includes('sua_tuoi_duong_den') || recipes.includes('tra_dao_cam_sa'),
        progressText: (isChap2Passed || recipes.includes('sua_tuoi_duong_den') || recipes.includes('tra_dao_cam_sa')) ? 'Đã có' : 'Chưa mở khóa'
      },
      {
        id: 'c2_q3', icon: '📱', title: 'Bão Trending',
        desc: 'Bỏ vốn đầu tư book Tú TikToker ghé quán ít nhất 1 lần.',
        reward: 'Doanh thu bùng nổ x3',
        isDone: isChap2Passed || !!upgrades.tiktoker_ever_invited,
        progressText: (isChap2Passed || upgrades.tiktoker_ever_invited) ? 'Đã Viral' : '0/1 lần'
      },
      {
        id: 'c2_q4', icon: '🐾', title: 'Người Bạn Đồng Hành',
        desc: 'Nhận nuôi 1 Thú Cưng để buff chỉ số và báo động trộm cắp.',
        reward: 'An ninh + Buff Tip',
        isDone: isChap2Passed || !!upgrades.active_pet,
        progressText: (isChap2Passed || upgrades.active_pet) ? 'Đã nhận nuôi' : 'Chưa có'
      },
      {
        id: 'c2_q5', icon: '🚨', title: 'Đội Trưởng An Ninh',
        desc: 'Phản xạ nhanh nhấp chuột tóm gọn 1 tên trộm áo đen.',
        reward: '+10.000đ & Kỷ niệm chương',
        isDone: isChap2Passed || (save.thieves_caught && save.thieves_caught > 0),
        progressText: isChap2Passed ? 'Đã hoàn tất' : `${save.thieves_caught || 0}/1 tên`
      },
      {
        id: 'c2_q6', icon: '🤝', title: 'Liên Minh Bền Vững',
        desc: 'Kết nối Collab thành công với ít nhất 1 mã quán của đối tác.',
        reward: '+10% Doanh thu',
        isDone: isChap2Passed || (daily.collab_count && daily.collab_count > 0) || (save.active_collabs && save.active_collabs > 0),
        progressText: isChap2Passed ? 'Đã hợp tác' : `${daily.collab_count || save.active_collabs || 0}/1 đối tác`
      },
      {
        id: 'c2_q_sabotage', icon: '⚔️', title: 'Thương Trường Khốc Liệt',
        desc: 'Sở hữu hoặc sử dụng Thẻ Hãm Hại (Bóc Phốt / QLTT) lên một quán đối thủ.',
        reward: 'Áp đảo thị phần',
        isDone: isChap2Passed || !!(upgrades.sabotage_used_count && upgrades.sabotage_used_count > 0) || !!(upgrades.the_boc_phot && upgrades.the_boc_phot > 0) || !!(upgrades.the_quan_ly_thi_truong && upgrades.the_quan_ly_thi_truong > 0),
        progressText: (isChap2Passed || (upgrades.sabotage_used_count && upgrades.sabotage_used_count > 0)) ? 'Đã tấn công' : ((upgrades.the_boc_phot || upgrades.the_quan_ly_thi_truong) ? 'Đã sắm thẻ' : '0/1 lần')
      },
      {
        id: 'c2_q7', icon: '🏰', title: 'Bước Ra Phố Lớn (Endgame)',
        desc: 'Tích lũy đủ 50.000.000đ tiền mặt để thuê mặt bằng ở Phố Thương Mại.',
        reward: 'Mở rộng thương hiệu',
        isDone: isChap2Passed || money >= targetMoney,
        progressText: isChap2Passed ? '50Tr / 50Tr (Hoàn tất)' : `${(money / 1000000).toFixed(1)}Tr / 50Tr`
      }
    ];
  } else if (viewingChapter === 3) {
    const isChap3Passed = currentChapter > 3;
    const targetC3Money = 100000000;
    quests = [
      {
        id: 'c3_q1', icon: '🏛️', title: 'Khai Trương Flagship Store',
        desc: 'Phục vụ ít nhất 1 lượt khách ghé tiệm tại Phố Đi Bộ.',
        reward: 'Danh tiếng Đô Thị',
        isDone: true,
        progressText: 'Hoàn tất'
      },
      {
        id: 'c3_q2', icon: '✨', title: 'Thực Đơn Thượng Lưu',
        desc: 'Mở khóa Trà Sữa Dát Vàng hoặc Nitro Cold Brew.',
        reward: 'Giá bán cực khủng',
        isDone: isChap3Passed || recipes.includes('tra_sua_dat_vang') || recipes.includes('nitro_cold_brew'),
        progressText: (isChap3Passed || recipes.includes('tra_sua_dat_vang') || recipes.includes('nitro_cold_brew')) ? 'Đã sở hữu' : 'Chưa có'
      },
      {
        id: 'c3_q3', icon: '🌽', title: 'Cửa Hàng Trưởng Bé Bắp',
        desc: 'Nâng cấp Bé Bắp lên chức Cửa Hàng Trưởng để tự động dập nắp ly.',
        reward: 'Tự động dập nắp 100%',
        isDone: isChap3Passed || !!upgrades.staff_be_bap_manager,
        progressText: (isChap3Passed || upgrades.staff_be_bap_manager) ? 'Đã thăng chức' : 'Chưa thăng chức'
      },
      {
        id: 'c3_q4', icon: '🛵', title: 'Đội Trưởng Logistics Anh Lâm',
        desc: 'Nâng cấp Anh Lâm lên Đội Trưởng Logistics điều phối hạm đội xe.',
        reward: '+35% Doanh thu ship',
        isDone: isChap3Passed || !!upgrades.staff_anh_lam_captain,
        progressText: (isChap3Passed || upgrades.staff_anh_lam_captain) ? 'Đã thăng chức' : 'Chưa thăng chức'
      },
      {
        id: 'c3_q5', icon: '🎤', title: 'Thần Tượng Triệu View',
        desc: 'Sở hữu hoặc sử dụng Thẻ Hợp Đồng Idol Triệu View thu hút bão khách.',
        reward: 'Khách kéo đến nghẹt phố',
        isDone: isChap3Passed || !!(upgrades.the_idol_trieu_view && upgrades.the_idol_trieu_view > 0) || !!upgrades.idol_viral_used,
        progressText: (isChap3Passed || upgrades.the_idol_trieu_view || upgrades.idol_viral_used) ? 'Đã kích hoạt' : 'Chưa có'
      },
      {
        id: 'c3_q6', icon: '👑', title: 'Đế Chế Nhượng Quyền (Endgame C3)',
        desc: 'Tích lũy 100.000.000đ vốn đầu tư để tiến tới Nhượng Quyền Toàn Cầu.',
        reward: 'Mở khóa Chương 4',
        isDone: isChap3Passed || money >= targetC3Money,
        progressText: isChap3Passed ? '100Tr / 100Tr (Hoàn tất)' : `${(money / 1000000).toFixed(1)}Tr / 100Tr`
      }
    ];
  } else if (viewingChapter === 4) {
    let franchises = [];
    try {
      franchises = typeof save.franchises === 'string' ? JSON.parse(save.franchises) : (save.franchises || []);
    } catch (e) {
      franchises = [];
    }
    const isChap4Passed = currentChapter > 4;
    const targetC4Money = 200000000;
    quests = [
      {
        id: 'c4_q1', icon: '🌐', title: 'Chi Nhánh Sài Gòn Hoa Lệ',
        desc: 'Sở hữu chi nhánh Sài Gòn Nguyễn Huệ đầu tiên.',
        reward: 'Thu tiền nhượng quyền thụ động',
        isDone: franchises.some(f => f.id === 'sg_nguyen_hue') || true,
        progressText: 'Hoàn tất'
      },
      {
        id: 'c4_q2', icon: '🍵', title: 'Công Thức Matcha Thượng Hạng',
        desc: 'Mở khóa công thức Matcha Kyoto Dát Bạc.',
        reward: 'Món trà hoàng gia',
        isDone: isChap4Passed || recipes.includes('matcha_kyoto_dat_bac'),
        progressText: (isChap4Passed || recipes.includes('matcha_kyoto_dat_bac')) ? 'Đã sở hữu' : 'Chưa mở khóa'
      },
      {
        id: 'c4_q3', icon: '🔨', title: 'Sàn Đấu Giá Trà Cổ Thụ',
        desc: 'Tham gia đấu giá ít nhất 1 mẻ trà quý trên Sàn Đấu Giá Quốc Tế.',
        reward: 'Hào quang bảo vật',
        isDone: isChap4Passed || !!(save.auction_won_count && save.auction_won_count > 0) || !!(upgrades.auction_won && upgrades.auction_won > 0),
        progressText: (isChap4Passed || save.auction_won_count || upgrades.auction_won) ? 'Đã sở hữu báu vật' : '0/1 mẻ'
      },
      {
        id: 'c4_q4', icon: '⭐', title: 'Nâng Cấp Chi Nhánh 5 Sao',
        desc: 'Nâng cấp ít nhất 1 chi nhánh nhượng quyền lên Cấp 2 trở lên.',
        reward: '+100% Doanh thu thụ động',
        isDone: isChap4Passed || franchises.some(f => f.level >= 2),
        progressText: (isChap4Passed || franchises.some(f => f.level >= 2)) ? 'Đã đạt' : 'Cấp 1/2'
      },
      {
        id: 'c4_q5', icon: '👑', title: 'Vua Trà Sữa Đô Thị (Endgame Toàn Cầu)',
        desc: 'Tích lũy 200.000.000đ tài sản để ghi tên vào Bảng Vàng Boba Tycoon Legend.',
        reward: 'Vua Trà Sữa Bất Bại 🏆',
        isDone: isChap4Passed || money >= targetC4Money,
        progressText: isChap4Passed ? '200Tr / 200Tr (Hoàn tất)' : `${(money / 1000000).toFixed(1)}Tr / 200Tr`
      }
    ];
  } else if (viewingChapter >= 5) {
    let franchises = [];
    try {
      franchises = typeof save.franchises === 'string' ? JSON.parse(save.franchises) : (save.franchises || []);
    } catch (e) {
      franchises = [];
    }
    const targetC5Money = 300000000;
    quests = [
      {
        id: 'c5_q1', icon: '👑', title: 'Đăng Quang Nữ Hoàng Vũ Trụ',
        desc: 'Bước lên ngai vàng Vua Trà Sữa Vũ Trụ và hoàn thành đại nghiệp.',
        reward: '+500 TeaCoin Hoàng Gia',
        isDone: currentChapter >= 5,
        progressText: currentChapter >= 5 ? 'Đã đăng quang 👑' : 'Chưa đạt'
      },
      {
        id: 'c5_q2', icon: '🌌', title: 'Siêu Xe Đẩy Ngân Hà',
        desc: 'Trang bị Skin Xe Đẩy Vũ Trụ Ngân Hà (Cosmic Coffee Cart) tỏa sáng rực rỡ.',
        reward: 'Hào quang ánh sao',
        isDone: save.cart_skin === 'cosmic_coffee_cart' || currentChapter >= 5,
        progressText: (save.cart_skin === 'cosmic_coffee_cart' || currentChapter >= 5) ? 'Đã trang bị' : 'Chưa có'
      },
      {
        id: 'c5_q3', icon: '💎', title: 'Tuyệt Phẩm Hoàng Gia',
        desc: 'Sở hữu công thức Hồng Trà Vương Triều Thập Cẩm hoặc Trà Sữa Ngân Hà.',
        reward: 'Đỉnh cao ẩm thực',
        isDone: recipes.includes('hong_tra_vuong_trieu_thap_cam') || recipes.includes('tra_sua_vu_tru_ngan_ha'),
        progressText: (recipes.includes('hong_tra_vuong_trieu_thap_cam') || recipes.includes('tra_sua_vu_tru_ngan_ha')) ? 'Đã mở khóa' : 'Chưa có'
      },
      {
        id: 'c5_q4', icon: '⭐', title: 'Đế Chế Toàn Thiên Hà',
        desc: 'Mở rộng ít nhất 3 chi nhánh nhượng quyền (Sài Gòn, Đà Nẵng, Tokyo...).',
        reward: 'Dòng tiền bất tận',
        isDone: franchises.length >= 3,
        progressText: `${franchises.length}/3 chi nhánh`
      },
      {
        id: 'c5_q5', icon: '🏆', title: 'Huyền Thoại Bất Tử (Eternal Legend)',
        desc: 'Tích lũy 300.000.000đ tài sản ròng và giữ vững 5.0⭐ uy tín đỉnh cao.',
        reward: 'Ngai Vàng Bất Diệt 👑',
        isDone: money >= targetC5Money,
        progressText: `${(money / 1000000).toFixed(1)}Tr / 300Tr`
      }
    ];
  }

  storyQuestList.innerHTML = quests.map(q => {
    let pct = 0;
    if (q.isDone) {
      pct = 100;
    } else if (q.id === 'q5' && viewingChapter === 1) {
      pct = Math.min(100, Math.max(0, ((3000000 - debt) / 3000000) * 100));
    } else if (q.id === 'c2_q7') {
      pct = Math.min(100, Math.max(0, (money / 50000000) * 100));
    } else if (q.id === 'c3_q6') {
      pct = Math.min(100, Math.max(0, (money / 100000000) * 100));
    } else if (q.id === 'c4_q5') {
      pct = Math.min(100, Math.max(0, (money / 200000000) * 100));
    } else if (q.id === 'c5_q5') {
      pct = Math.min(100, Math.max(0, (money / 300000000) * 100));
    } else if (q.id === 'c2_q1') {
      pct = Math.min(100, Math.max(0, ((daily.earned_today || 0) / 80000) * 100));
    }

    const progressBarHtml = (q.id === 'q5' || q.id === 'c2_q7' || q.id === 'c3_q6' || q.id === 'c4_q5' || q.id === 'c5_q5' || q.id === 'c2_q1') ? `
      <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.4); border-radius: 4px; margin-top: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #f4c430, #ff9f43); transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 8px rgba(244,196,48,0.5);"></div>
      </div>
    ` : '';

    const bgStyle = q.isDone ? 'rgba(80, 250, 123, 0.08)' : 'rgba(30, 20, 37, 0.6)';
    const borderStyle = q.isDone ? '1px solid #50fa7b' : '1px solid #4a2635';
    const iconFilter = q.isDone ? 'none' : 'grayscale(0.7) opacity(0.8)';
    const titleColor = q.isDone ? '#50fa7b' : '#ffb86c';

    return `
    <div class="quest-item" style="background: ${bgStyle}; border: ${borderStyle}; border-radius: 10px; padding: 14px; margin-bottom: 12px; display: flex; gap: 14px; align-items: stretch; transition: all 0.3s ease;">
      <div style="font-size: 2.2rem; min-width: 45px; text-align: center; filter: ${iconFilter}; display: flex; align-items: center; justify-content: center;">
        ${q.icon}
      </div>
      <div class="quest-info" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div class="quest-title" style="font-weight: 700; font-size: 1.1rem; color: ${titleColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${q.title}</div>
        <div class="quest-desc" style="color: #cbd5e1; font-size: 0.85rem; margin-top: 5px; line-height: 1.45;">${q.desc}</div>
        <div style="margin-top: 8px;">
          <span class="quest-reward" style="color: #f4c430; font-size: 0.75rem; font-weight: 700; background: rgba(244, 196, 48, 0.15); border: 1px solid rgba(244, 196, 48, 0.3); padding: 3px 8px; border-radius: 6px;">
            🎁 ${q.reward}
          </span>
        </div>
        ${progressBarHtml}
      </div>
      <div class="quest-status" style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center; min-width: 85px;">
        <div class="quest-badge" style="white-space: nowrap; font-size: 0.75rem; padding: 5px 10px; border-radius: 12px; font-weight: bold; background: ${q.isDone ? '#50fa7b' : '#334155'}; color: ${q.isDone ? '#000' : '#cbd5e1'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${q.isDone ? '✅ Đã Xong' : '⏳ Đang làm'}
        </div>
        <div style="font-size: 0.8rem; color: ${q.isDone ? '#50fa7b' : '#8be9fd'}; margin-top: 8px; font-family: monospace; font-weight: bold;">
          ${q.progressText}
        </div>
      </div>
    </div>
    `;
  }).join('');
}

// Check if a milestone is unlocked in save or localStorage
export function isMilestoneUnlocked(milestoneId, save = null) {
  if (!save) save = state.storeState?.save || {};
  try {
    if (typeof localStorage !== 'undefined') {
      if (localStorage.getItem('heehee_milestone_' + milestoneId) === 'unlocked' ||
          localStorage.getItem('heehee_milestone_seen_' + milestoneId) === 'true') {
        return true;
      }
    }
  } catch (e) {}
  const m = STORY_MILESTONES.find(item => item.id === milestoneId);
  if (m && typeof m.checkUnlocked === 'function') {
    const passed = m.checkUnlocked(save);
    if (passed) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('heehee_milestone_' + milestoneId, 'unlocked');
        }
      } catch (e) {}
      return true;
    }
  }
  return false;
}

// Render Memory Album Badges & Replay Buttons
export function renderMemoryAlbum() {
  if (!storyAlbumList) storyAlbumList = document.getElementById('story-album-list');
  if (!storyAlbumList) return;
  if (!storyAlbumUnlockedCount) storyAlbumUnlockedCount = document.getElementById('story-album-unlocked-count');

  const save = state.storeState?.save || {};
  let unlockedCount = 0;

  const html = STORY_MILESTONES.map(m => {
    const isUnlocked = isMilestoneUnlocked(m.id, save);
    if (isUnlocked) unlockedCount++;

    const borderStyle = isUnlocked ? '1px solid #ff79c6' : '1px solid #4a2635';
    const bgStyle = isUnlocked ? 'linear-gradient(135deg, rgba(255, 121, 198, 0.12), rgba(34, 18, 32, 0.85))' : 'rgba(25, 14, 24, 0.6)';
    const iconFilter = isUnlocked ? 'none' : 'grayscale(1) opacity(0.5)';
    const statusBadge = isUnlocked
      ? '<span style="background: #50fa7b; color: #111; font-weight: bold; font-size: 0.72rem; padding: 2px 7px; border-radius: 10px;">🏅 ĐÃ MỞ KHÓA</span>'
      : '<span style="background: #44475a; color: #cbd5e1; font-weight: bold; font-size: 0.72rem; padding: 2px 7px; border-radius: 10px;">🔒 CHƯA ĐẠT</span>';

    const actionBtn = isUnlocked
      ? `<button type="button" class="btn-replay-milestone" data-milestone-id="${m.id}" data-chap="${m.chapter}" data-scene="${m.sceneIdx}" style="background: linear-gradient(180deg, #ff79c6, #bd93f9); color: #111; border: none; border-radius: 6px; padding: 5px 10px; font-size: 0.82rem; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(255,121,198,0.3); transition: transform 0.15s ease;">
          <span>🎬 Xem Lại Cắt Cảnh</span>
        </button>`
      : `<span style="font-size: 0.75rem; color: #6272a4; font-style: italic;">Chưa thể xem lại</span>`;

    return `
      <div class="album-badge-card" style="background: ${bgStyle}; border: ${borderStyle}; border-radius: 10px; padding: 12px; display: flex; gap: 12px; align-items: center; box-shadow: ${isUnlocked ? '0 3px 10px rgba(255, 121, 198, 0.15)' : 'none'};">
        <div style="font-size: 2.2rem; min-width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); filter: ${iconFilter};">
          ${m.badgeIcon}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
            <div style="font-weight: bold; font-size: 0.95rem; color: ${isUnlocked ? '#ff79c6' : '#94a3b8'};">
              ${m.badgeName}
            </div>
            <div>${statusBadge}</div>
          </div>
          <div style="font-size: 0.84rem; color: ${isUnlocked ? '#f1fa8c' : '#64748b'}; font-weight: 600; margin-top: 2px;">
            ${m.title}
          </div>
          <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 4px; line-height: 1.35;">
            ${m.badgeDesc}
          </div>
          <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
            <span style="font-size: 0.73rem; color: #50fa7b; background: rgba(80, 250, 123, 0.1); border: 1px solid rgba(80, 250, 123, 0.25); padding: 2px 6px; border-radius: 4px;">
              🎁 ${m.reward}
            </span>
            <div>${actionBtn}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  storyAlbumList.innerHTML = html;
  if (storyAlbumUnlockedCount) {
    storyAlbumUnlockedCount.innerText = `${unlockedCount} / ${STORY_MILESTONES.length}`;
  }

  // Bind replay buttons to jump straight to cutscenes
  storyAlbumList.querySelectorAll('.btn-replay-milestone').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const chap = parseInt(btn.dataset.chap, 10);
      const scene = parseInt(btn.dataset.scene, 10);
      openStoryModal(scene, chap);
      if (window.sound && window.sound.bell) window.sound.bell();
    });
  });
}

// Trigger a specific milestone cutscene automatically (e.g. from gameplay events)
export function triggerMilestoneCutscene(milestoneId, force = true) {
  const m = STORY_MILESTONES.find(item => item.id === milestoneId);
  if (!m) {
    console.warn('Unknown milestoneId:', milestoneId);
    return false;
  }

  const seenKey = 'heehee_milestone_seen_' + milestoneId;
  let alreadySeen = false;
  try {
    if (typeof localStorage !== 'undefined') {
      alreadySeen = localStorage.getItem(seenKey) === 'true';
    }
  } catch (e) {}

  if (alreadySeen && !force) {
    return false;
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(seenKey, 'true');
      localStorage.setItem('heehee_milestone_' + milestoneId, 'unlocked');
    }
  } catch (e) {}

  if (window.sound) {
    if (typeof window.sound.celebration === 'function') {
      window.sound.celebration();
    } else if (typeof window.sound.bossVictory === 'function') {
      window.sound.bossVictory();
    } else if (typeof window.sound.bell === 'function') {
      window.sound.bell();
    }
  }

  showToast(`🎉 MỞ KHÓA HỒI ỨC: ${m.title}! Nhận huy hiệu ${m.badgeName}!`, 4500);
  openStoryModal(m.sceneIdx, m.chapter);
  return true;
}

// Direct jump to milestone cutscene
export function openStoryModalAtMilestone(milestoneId) {
  const m = STORY_MILESTONES.find(item => item.id === milestoneId);
  if (m) {
    openStoryModal(m.sceneIdx, m.chapter);
  }
}

// Check newly unlocked milestones based on current save
export function checkAndUnlockMilestones() {
  const save = state.storeState?.save;
  if (!save) return [];
  const newlyUnlocked = [];

  STORY_MILESTONES.forEach(m => {
    const seenKey = 'heehee_milestone_seen_' + m.id;
    let isSeen = false;
    try {
      if (typeof localStorage !== 'undefined') {
        isSeen = localStorage.getItem(seenKey) === 'true';
      }
    } catch (e) {}
    if (!isSeen && m.checkUnlocked(save)) {
      newlyUnlocked.push(m);
    }
  });

  return newlyUnlocked;
}

export function getStoryMilestones() {
  return STORY_MILESTONES;
}

export function initStory() {
  modalStory = document.getElementById('modal-story');
  closeStory = document.getElementById('close-story');
  btnStoryHeader = document.getElementById('btn-story-header');
  navStory = document.getElementById('nav-story');

  tabDialogue = document.getElementById('story-tab-dialogue');
  tabQuests = document.getElementById('story-tab-quests');
  tabAlbum = document.getElementById('story-tab-album');
  tabGuide = document.getElementById('story-tab-guide');

  viewDialogue = document.getElementById('story-view-dialogue');
  viewQuests = document.getElementById('story-view-quests');
  viewAlbum = document.getElementById('story-view-album');
  viewGuide = document.getElementById('story-view-guide');

  storyTitleEl = document.getElementById('story-chapter-title');
  storyAvatarEl = document.getElementById('story-avatar');
  storyNameEl = document.getElementById('story-speaker-name');
  storyRoleEl = document.getElementById('story-speaker-role');
  storyTextEl = document.getElementById('story-dialogue-text');
  storyHintBox = document.getElementById('story-visual-hint');
  storyHintIcon = document.getElementById('story-hint-icon');
  storyHintText = document.getElementById('story-hint-text');

  btnStoryPrev = document.getElementById('btn-story-prev');
  btnStoryNext = document.getElementById('btn-story-next');
  btnStoryReplay = document.getElementById('btn-story-replay');
  storyStepIndicator = document.getElementById('story-step-indicator');
  storyQuestList = document.getElementById('story-quest-list');

  storyAlbumList = document.getElementById('story-album-list');
  storyAlbumUnlockedCount = document.getElementById('story-album-unlocked-count');

  // Attach global functions for backwards compatibility and cross-module calls
  window.openStoryModal = openStoryModal;
  window.triggerMilestoneCutscene = triggerMilestoneCutscene;
  window.openStoryModalAtMilestone = openStoryModalAtMilestone;
  window.isMilestoneUnlocked = isMilestoneUnlocked;
  window.checkAndUnlockMilestones = checkAndUnlockMilestones;
  window.renderMemoryAlbum = renderMemoryAlbum;
  window.getStoryMilestones = getStoryMilestones;

  if (btnStoryHeader) btnStoryHeader.addEventListener('click', () => openStoryModal());
  if (navStory) navStory.addEventListener('click', () => openStoryModal());
  if (closeStory) closeStory.addEventListener('click', () => closeStoryModal());

  if (tabDialogue) tabDialogue.addEventListener('click', () => switchStoryTab('dialogue'));
  if (tabQuests) tabQuests.addEventListener('click', () => switchStoryTab('quests'));
  if (tabAlbum) tabAlbum.addEventListener('click', () => switchStoryTab('album'));
  if (tabGuide) tabGuide.addEventListener('click', () => switchStoryTab('guide'));

  const tabDailyQuests = document.getElementById('story-tab-daily-quests');
  if (tabDailyQuests) {
    tabDailyQuests.addEventListener('click', () => {
      closeStoryModal();
      if (typeof window.openDailyQuestsModal === 'function') {
        window.openDailyQuestsModal();
      } else {
        const m = document.getElementById('modal-daily-quests');
        if (m) m.style.display = 'flex';
      }
    });
  }

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
}
