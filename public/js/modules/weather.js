/**
 * Dynamic Weather Client Controller
 * Updates Weather HUD badge, syncs canvas weather, and displays weather forecast modal
 */

import { state } from './state.js';
import { showToast } from './toast.js';
import { syncRoomWeather } from './room.js';

let elWeatherBadge = null;
let elBuffWeather = null;
let modalWeatherInfo = null;

export function initWeatherModule() {
  elWeatherBadge = document.getElementById('weather-badge');
  elBuffWeather = document.getElementById('buff-weather');
  modalWeatherInfo = document.getElementById('modal-weather-info');

  if (elWeatherBadge) {
    elWeatherBadge.addEventListener('click', () => openWeatherModal());
  }

  if (elBuffWeather) {
    elBuffWeather.addEventListener('click', () => openWeatherModal());
  }

  const btnClose = document.getElementById('close-weather-info');
  if (btnClose && modalWeatherInfo) {
    btnClose.addEventListener('click', () => {
      modalWeatherInfo.style.display = 'none';
    });
  }

  // Button test lightning strike inside modal
  const btnTestLightning = document.getElementById('btn-test-lightning');
  if (btnTestLightning) {
    btnTestLightning.addEventListener('click', () => {
      if (state.canvas && typeof state.canvas.triggerLightning === 'function') {
        state.canvas.triggerLightning();
        showToast('⚡ Sấm sét giông bão giật chớp lóe sáng rền vang!', 2500);
      }
    });
  }

  // Quick Weather preview switchers inside modal
  const testBtns = document.querySelectorAll('.btn-weather-pill');
  testBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const wId = btn.getAttribute('data-weather');
      if (!wId) return;

      try {
        if (window.API && typeof window.API.changeWeather === 'function') {
          const res = await window.API.changeWeather(wId);
          if (res && res.weather) {
            updateWeatherUI(res.weather);
            openWeatherModal(); // Refresh modal content
            showToast(`🌤️ Đã đổi thời tiết sang: ${res.weather.icon} ${res.weather.name}!`, 3000);
            return;
          }
        }
      } catch (e) {
        console.warn('API changeWeather error, using local fallback:', e);
      }

      // Local fallback preview
      const previewMap = {
        sunny: { id: 'sunny', name: 'Nắng Vàng Rực Rỡ', icon: '☀️', desc: 'Trời quang đãng nắng ấm chan hòa. Khách dạo phố đông đúc ghé quầy +25%!' },
        rainy: { id: 'rainy', name: 'Mưa Rào Tí Tách', icon: '🌧️', desc: 'Mưa rơi tí tách, mặt đường ướt bóng đèn. Khách kiên nhẫn +40%!' },
        stormy: { id: 'stormy', name: 'Giông Bão Sấm Sét', icon: '⛈️', desc: 'Sấm sét giật chớp lóe sáng rền vang! Đơn ship xe máy bùng nổ +60%, tip +25%!' },
        cloudy: { id: 'cloudy', name: 'Trời Râm Mát Mẻ', icon: '⛅', desc: 'Tầng mây xám bạc che mát dịu phố phường, sương mù là đà trôi ngang tầm mắt.' },
        windy: { id: 'windy', name: 'Gió Mùa Vi Vu', icon: '🍃', desc: 'Gió mát thổi qua hàng cây, cánh hoa rơi lượn bay. Khách mua mang đi +15%!' }
      };
      const wObj = previewMap[wId] || previewMap.sunny;
      if (!state.storeState) state.storeState = {};
      state.storeState.weather = wObj;
      updateWeatherUI(wObj);
      openWeatherModal();
      showToast(`🌤️ Đã áp dụng hiệu ứng: ${wObj.icon} ${wObj.name}!`, 3000);
    });
  });
}

/**
 * Update weather badge and sync with canvas & HUD buffs
 */
export function updateWeatherUI(weather) {
  if (!weather && state.storeState && state.storeState.weather) {
    weather = state.storeState.weather;
  }
  if (!weather) {
    weather = { id: 'sunny', name: 'Nắng Vàng', icon: '☀️' };
  }

  if (state.storeState) {
    state.storeState.weather = weather;
    if (state.storeState.save && state.storeState.save.active_buffs) {
      state.storeState.save.active_buffs.weather = weather;
    }
  }

  // Sync street canvas
  if (state.canvas && typeof state.canvas.setWeather === 'function') {
    state.canvas.setWeather(weather);
  }

  // Sync Room Window with live weather
  try {
    if (typeof syncRoomWeather === 'function') {
      syncRoomWeather(weather);
    }
  } catch (e) {}

  // Update HUD badge
  if (!elWeatherBadge) {
    elWeatherBadge = document.getElementById('weather-badge');
  }

  if (elWeatherBadge) {
    elWeatherBadge.innerHTML = `${weather.icon} ${weather.name}`;
    elWeatherBadge.className = 'time-badge'; // reset

    if (weather.id === 'stormy') {
      elWeatherBadge.classList.add('weather-badge-stormy', 'stormy');
      elWeatherBadge.title = '⛈️ Giông Bão Sấm Sét - Khách gọi ship hỏa tốc cực mạnh (+60%), tip +25%!';
    } else if (weather.id === 'rainy') {
      elWeatherBadge.classList.add('weather-badge-rainy');
      elWeatherBadge.title = '🌧️ Mưa Rào - Khách trú mưa kiên nhẫn chờ đợi (+40%)!';
    } else if (weather.id === 'cloudy') {
      elWeatherBadge.classList.add('weather-badge-cloudy');
      elWeatherBadge.title = '⛅ Trời Râm - Thời tiết mát dịu, khách ghé đều (+10%)!';
    } else if (weather.id === 'windy') {
      elWeatherBadge.classList.add('weather-badge-windy');
      elWeatherBadge.title = '🍃 Gió Mùa - Gió vi vu hoa lá rơi bay, mua mang đi (+15%)!';
    } else {
      elWeatherBadge.classList.add('weather-badge-sunny');
      elWeatherBadge.title = '☀️ Nắng Vàng Rực Rỡ - Khách dạo phố đông đúc (+25%)!';
    }
  }

  // Update Active Buffs Bar Weather Pill
  if (!elBuffWeather) {
    elBuffWeather = document.getElementById('buff-weather');
  }
  const elBuffBar = document.getElementById('active-buffs-bar');

  if (elBuffWeather) {
    const elBuffText = document.getElementById('buff-weather-text');
    let buffSummary = '';
    let buffStyle = '';

    if (weather.id === 'stormy') {
      buffSummary = '⛈️ Giông Bão (+60% Ship, +25% Tip)';
      buffStyle = 'background: rgba(162, 155, 254, 0.25); border: 1.5px solid #a29bfe; color: #e056fd;';
    } else if (weather.id === 'rainy') {
      buffSummary = '🌧️ Mưa Rào (+40% Kiên Nhẫn)';
      buffStyle = 'background: rgba(52, 152, 219, 0.22); border: 1.5px solid #3498db; color: #74b9ff;';
    } else if (weather.id === 'cloudy') {
      buffSummary = '⛅ Trời Râm (+10% Khách, +15% Kiên Nhẫn)';
      buffStyle = 'background: rgba(149, 165, 166, 0.22); border: 1.5px solid #a4b0be; color: #dfe6e9;';
    } else if (weather.id === 'windy') {
      buffSummary = '🍃 Gió Mùa (+15% Mang Đi, +10% Tip)';
      buffStyle = 'background: rgba(46, 204, 113, 0.22); border: 1.5px solid #2ecc71; color: #55efc4;';
    } else {
      buffSummary = '☀️ Nắng Vàng (+25% Khách Dạo Phố)';
      buffStyle = 'background: rgba(241, 196, 15, 0.22); border: 1.5px solid #f1c40f; color: #fdcb6e;';
    }

    if (elBuffText) elBuffText.innerText = buffSummary;
    elBuffWeather.setAttribute('style', `display: inline-block; border-radius: 4px; padding: 2px 7px; font-weight: bold; cursor: pointer; ${buffStyle}`);
    if (elBuffBar) elBuffBar.style.display = 'flex';
  }
}

/**
 * Open Weather forecast popup modal
 */
export function openWeatherModal() {
  if (!modalWeatherInfo) modalWeatherInfo = document.getElementById('modal-weather-info');
  if (!modalWeatherInfo) return;

  const weather = (state.storeState && state.storeState.weather) || {
    id: 'sunny',
    name: 'Nắng Vàng Rực Rỡ',
    icon: '☀️',
    desc: 'Trời quang đãng nắng ấm chan hòa. Khách đi dạo phố nhiều, lượng khách ghé quầy tăng +25%!'
  };

  const elIcon = document.getElementById('weather-modal-icon');
  const elName = document.getElementById('weather-modal-name');
  const elDesc = document.getElementById('weather-modal-desc');
  const elEffectList = document.getElementById('weather-modal-effects');
  const btnTestLightning = document.getElementById('btn-test-lightning');

  if (elIcon) elIcon.innerText = weather.icon;
  if (elName) elName.innerText = weather.name;
  if (elDesc) elDesc.innerText = weather.desc;

  if (elEffectList) {
    let effectsHtml = '';
    if (weather.id === 'stormy') {
      effectsHtml = `
        <li style="color: #a29bfe;">⚡ <b>Sấm Sét Rền Vang:</b> Chớp lóe sáng toàn màn hình & rung giật giông bão sinh động.</li>
        <li style="color: #50fa7b;">🛵 <b>Đơn Ship Xe Máy Bùng Nổ:</b> Tần suất shipper xuất hiện nhận đơn tăng +60%!</li>
        <li style="color: #f1c40f;">💰 <b>Tiền Tip Tăng Vọt:</b> Khách hàng thương shipper & quầy thưởng tip hào phóng hơn +25%!</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'block';
    } else if (weather.id === 'rainy') {
      effectsHtml = `
        <li style="color: #74b9ff;">🌧️ <b>Mưa Rào Tí Tách:</b> Màn mưa xiên sợi rơi rào rào, mặt đường ướt bóng phản chiếu ánh đèn.</li>
        <li style="color: #50fa7b;">⏱️ <b>Khách Trú Mưa Kiên Nhẫn:</b> Khách chờ đợi pha chế lâu hơn +40%!</li>
        <li style="color: #00cec9;">🛵 <b>Gọi Ship Đều Đặn:</b> Nhu cầu đặt xe máy giao tận nhà tăng đều.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    } else if (weather.id === 'cloudy') {
      effectsHtml = `
        <li style="color: #a4b0be;">⛅ <b>Trời Râm Mát Dịu:</b> Tầng mây xám bạc dịu mát, lớp sương mỏng là đà trôi ngang tầm mắt.</li>
        <li style="color: #55efc4;">👥 <b>Lượng Khách Ghé Đều:</b> Khách hàng dạo phố ghé tiệm ổn định (+10%).</li>
        <li style="color: #fdcb6e;">⏱️ <b>Khách Kiên Nhẫn Tốt:</b> Khách thong thả nhâm nhi chờ đợi đồ uống (+15%).</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    } else if (weather.id === 'windy') {
      effectsHtml = `
        <li style="color: #55efc4;">🍃 <b>Gió Mùa Vi Vu:</b> Từng đợt gió xoáy và cánh hoa / lá vàng chao lượn trên đường phố.</li>
        <li style="color: #74b9ff;">🥤 <b>Khách Mua Mang Đi:</b> Nhu cầu đặt đồ uống take-away tiện lợi tăng (+15%).</li>
        <li style="color: #fdcb6e;">💰 <b>Tiền Tip Thưởng Thêm:</b> Khách vui vẻ thưởng tip thêm (+10%).</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    } else {
      effectsHtml = `
        <li style="color: #f1c40f;">☀️ <b>Nắng Đẹp Rực Rỡ:</b> Tia sáng God Rays xiên qua kẽ lá & hạt bụi nắng vàng lơ lửng.</li>
        <li style="color: #50fa7b;">👥 <b>Khách Dạo Phố Tấp Nập:</b> Khách ghé quầy vỉa hè tăng mạnh +25%!</li>
        <li style="color: #55efc4;">🥤 <b>Nước Mát Bán Chạy:</b> Đơn hàng giải khát mát lạnh nhiều đá được ưu tiên.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    }
    elEffectList.innerHTML = effectsHtml;
  }

  modalWeatherInfo.style.display = 'flex';
}
