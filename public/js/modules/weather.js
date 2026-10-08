/**
 * Dynamic Weather Client Controller
 * Updates Weather HUD badge, syncs canvas weather, and displays weather forecast modal
 */

import { state } from './state.js';
import { showToast } from './toast.js';

let elWeatherBadge = null;
let modalWeatherInfo = null;

export function initWeatherModule() {
  elWeatherBadge = document.getElementById('weather-badge');
  modalWeatherInfo = document.getElementById('modal-weather-info');

  if (elWeatherBadge) {
    elWeatherBadge.addEventListener('click', () => openWeatherModal());
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
        showToast('⚡ Sấm sét giông bão giật chớp lóe sáng!', 2500);
      }
    });
  }
}

/**
 * Update weather badge and sync with canvas
 */
export function updateWeatherUI(weather) {
  if (!weather && state.storeState && state.storeState.weather) {
    weather = state.storeState.weather;
  }
  if (!weather) {
    weather = { id: 'sunny', name: 'Nắng Vàng', icon: '☀️' };
  }

  // Sync canvas
  if (state.canvas && typeof state.canvas.setWeather === 'function') {
    state.canvas.setWeather(weather);
  }

  // Sync Room Window with live weather
  import('./room.js').then(m => {
    if (m && typeof m.syncRoomWeather === 'function') {
      m.syncRoomWeather(weather);
    }
  }).catch(() => {});

  // Update HUD badge
  if (!elWeatherBadge) {
    elWeatherBadge = document.getElementById('weather-badge');
  }

  if (elWeatherBadge) {
    elWeatherBadge.innerHTML = `${weather.icon} ${weather.name}`;
    if (weather.id === 'stormy') {
      elWeatherBadge.classList.add('stormy');
      elWeatherBadge.title = '⛈️ Giông Bão Sấm Sét - Khách gọi ship hỏa tốc cực mạnh (+60%)!';
    } else {
      elWeatherBadge.classList.remove('stormy');
      elWeatherBadge.title = `Thời tiết: ${weather.name} - ${weather.desc}`;
    }
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
        <li style="color: #a29bfe;">⚡ <b>Sấm Sét Rền Vang:</b> Chớp lóe sáng toàn màn hình & rung giật sinh động.</li>
        <li style="color: #50fa7b;">🛵 <b>Đơn Ship Xe Máy Bùng Nổ:</b> Tần suất shipper xuất hiện tăng +60%!</li>
        <li style="color: #f1c40f;">💰 <b>Tiền Tip Tăng Vọt:</b> Khách hàng thưởng tip hào phóng hơn +25%!</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'block';
    } else if (weather.id === 'rainy') {
      effectsHtml = `
        <li style="color: #74b9ff;">🌧️ <b>Mưa Rào Tí Tách:</b> Hạt mưa rơi rào rào trên vỉa hè.</li>
        <li style="color: #50fa7b;">⏱️ <b>Khách Kiên Nhẫn Hơn:</b> Khách trú mưa chờ đợi lâu hơn +40%!</li>
        <li style="color: #00cec9;">🛵 <b>Gọi Ship Đông:</b> Nhu cầu gọi ship xe máy tăng đều đặn.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    } else if (weather.id === 'sunny') {
      effectsHtml = `
        <li style="color: #f1c40f;">☀️ <b>Nắng Đẹp Rực Rỡ:</b> Khách dạo phố đông đúc ghé quầy +25%!</li>
        <li style="color: #55efc4;">🥤 <b>Nước Mát Bán Chạy:</b> Đơn hàng giải khát nhiều đá được ưu tiên.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    } else {
      effectsHtml = `
        <li style="color: #dfe6e9;">🍃 <b>Thời Tiết Mát Mẻ:</b> Khách mua trà sữa mang đi đều đặn.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    }
    elEffectList.innerHTML = effectsHtml;
  }

  modalWeatherInfo.style.display = 'flex';
}

