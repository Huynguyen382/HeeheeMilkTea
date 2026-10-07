// Story & Narrative Guided Tutorial System
import { state } from './state.js';
import { STORY_DATA } from './story-data.js';
import { showToast } from './toast.js';

let storyChapter = 1;
let storySceneIdx = 0;

let modalStory = null;
let closeStory = null;
let btnStoryHeader = null;
let navStory = null;

let tabDialogue = null;
let tabQuests = null;
let tabGuide = null;

let viewDialogue = null;
let viewQuests = null;
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

export function openStoryModal(sceneIdx = 0, chapterNum = null) {
  const currentChapter = state.storeState?.save?.chapter || 1;
  const debt = state.storeState?.save?.debt_remaining ?? 3000000;

  if (chapterNum && chapterNum >= 2) {
    if (currentChapter < 2 && debt > 0) {
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
  switchStoryTab('dialogue');
  renderStoryScene(storySceneIdx);
  if (modalStory) modalStory.style.display = 'flex';
}

export function closeStoryModal() {
  if (modalStory) modalStory.style.display = 'none';
}

export function switchStoryTab(tabName) {
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

export function renderStoryScene(idx) {
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

  if (window.sound && window.sound.talk) window.sound.talk(520);
}

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
  const money = save.money !== undefined ? save.money : (save.cash || 0);
  const debt = save.debt_remaining !== undefined ? save.debt_remaining : 3000000;

  let quests = [];

  if (currentChapter === 1) {
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
        isDone: (daily.orders_served && daily.orders_served > 0) || money > 200000,
        progressText: (daily.orders_served > 0 || money > 200000) ? '1/1 ly' : '0/1 ly'
      },
      {
        id: 'q3', icon: '🍊', title: 'Mở Rộng Thực Đơn',
        desc: 'Mua thêm ít nhất 1 công thức món mới trong mục [Nâng Cấp].',
        reward: 'Bán được món giá cao',
        isDone: recipes.length >= 2,
        progressText: `${recipes.length}/2 món`
      },
      {
        id: 'q4', icon: '💸', title: 'Trút Bớt Gánh Nặng',
        desc: 'Trả ít nhất 500.000đ nợ đầu tiên cho Anh Bảnh.',
        reward: 'Giảm áp lực đòi nợ',
        isDone: debt <= 2500000,
        progressText: debt <= 2500000 ? 'Đã trả' : 'Chưa trả'
      },
      {
        id: 'q5', icon: '🏆', title: 'Tự Do Khởi Nghiệp',
        desc: 'Trả hết sạch 3.000.000đ nợ cho Anh Bảnh để mở khóa Chương 2!',
        reward: 'Mở khóa Chương 2',
        isDone: debt === 0 || currentChapter >= 2,
        progressText: `${(3000000 - debt).toLocaleString('vi-VN')}đ / 3Tr`
      }
    ];
  } else if (currentChapter >= 2) {
    const targetMoney = 50000000; // Mục tiêu Endgame Chương 2
    quests = [
      {
        id: 'c2_q1', icon: '📦', title: 'Bài Toán Chi Phí',
        desc: 'Đạt doanh thu 80.000đ/ngày để bù đắp chi phí mặt bằng khi Kết Ca.',
        reward: 'Kỹ năng quản lý tài chính',
        isDone: (daily.earned_today || 0) >= 80000,
        progressText: `${(daily.earned_today || 0).toLocaleString('vi-VN')}đ / 80k`
      },
      {
        id: 'c2_q2', icon: '🍹', title: 'Hương Vị Gen Z',
        desc: 'Sở hữu công thức Sữa Tươi Đường Đen hoặc Trà Đào Cam Sả.',
        reward: 'Thu hút khách sành điệu',
        isDone: recipes.includes('sua_tuoi_duong_den') || recipes.includes('tra_dao_cam_sa'),
        progressText: (recipes.includes('sua_tuoi_duong_den') || recipes.includes('tra_dao_cam_sa')) ? 'Đã có' : 'Chưa mở khóa'
      },
      {
        id: 'c2_q3', icon: '📱', title: 'Bão Trending',
        desc: 'Bỏ vốn đầu tư book Tú TikToker ghé quán ít nhất 1 lần.',
        reward: 'Doanh thu bùng nổ x3',
        isDone: !!upgrades.tiktoker_ever_invited,
        progressText: upgrades.tiktoker_ever_invited ? 'Đã Viral' : '0/1 lần'
      },
      {
        id: 'c2_q4', icon: '🐾', title: 'Người Bạn Đồng Hành',
        desc: 'Nhận nuôi 1 Thú Cưng để buff chỉ số và báo động trộm cắp.',
        reward: 'An ninh + Buff Tip',
        isDone: !!upgrades.active_pet,
        progressText: upgrades.active_pet ? 'Đã nhận nuôi' : 'Chưa có'
      },
      {
        id: 'c2_q5', icon: '🚨', title: 'Đội Trưởng An Ninh',
        desc: 'Phản xạ nhanh nhấp chuột tóm gọn 1 tên trộm áo đen.',
        reward: '+10.000đ & Kỷ niệm chương',
        isDone: (save.thieves_caught && save.thieves_caught > 0),
        progressText: `${save.thieves_caught || 0}/1 tên`
      },
      {
        id: 'c2_q6', icon: '🤝', title: 'Liên Minh Bền Vững',
        desc: 'Kết nối Collab thành công với ít nhất 1 mã quán của đối tác.',
        reward: '+10% Doanh thu',
        isDone: (daily.collab_count && daily.collab_count > 0) || (save.active_collabs && save.active_collabs > 0),
        progressText: `${daily.collab_count || save.active_collabs || 0}/1 đối tác`
      },
      {
        id: 'c2_q7', icon: '🏰', title: 'Bước Ra Phố Lớn (Endgame)',
        desc: 'Tích lũy đủ 50.000.000đ tiền mặt để thuê mặt bằng ở Phố Thương Mại.',
        reward: 'Mở rộng thương hiệu',
        isDone: money >= targetMoney,
        progressText: `${(money / 1000000).toFixed(1)}Tr / 50Tr`
      }
    ];
  }

  storyQuestList.innerHTML = quests.map(q => {
    let pct = 0;
    if (q.isDone) {
      pct = 100;
    } else if (q.id === 'q5' && currentChapter === 1) {
      pct = Math.min(100, Math.max(0, ((3000000 - debt) / 3000000) * 100));
    } else if (q.id === 'c2_q7') {
      pct = Math.min(100, Math.max(0, (money / 50000000) * 100));
    } else if (q.id === 'c2_q1') {
      pct = Math.min(100, Math.max(0, ((daily.earned_today || 0) / 80000) * 100));
    }

    const progressBarHtml = (q.id === 'q5' || q.id === 'c2_q7' || q.id === 'c2_q1') ? `
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

export function initStory() {
  modalStory = document.getElementById('modal-story');
  closeStory = document.getElementById('close-story');
  btnStoryHeader = document.getElementById('btn-story-header');
  navStory = document.getElementById('nav-story');

  tabDialogue = document.getElementById('story-tab-dialogue');
  tabQuests = document.getElementById('story-tab-quests');
  tabGuide = document.getElementById('story-tab-guide');

  viewDialogue = document.getElementById('story-view-dialogue');
  viewQuests = document.getElementById('story-view-quests');
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

  // Attach global for backwards compatibility
  window.openStoryModal = openStoryModal;

  if (btnStoryHeader) btnStoryHeader.addEventListener('click', () => openStoryModal());
  if (navStory) navStory.addEventListener('click', () => openStoryModal());
  if (closeStory) closeStory.addEventListener('click', () => closeStoryModal());

  if (tabDialogue) tabDialogue.addEventListener('click', () => switchStoryTab('dialogue'));
  if (tabQuests) tabQuests.addEventListener('click', () => switchStoryTab('quests'));
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

