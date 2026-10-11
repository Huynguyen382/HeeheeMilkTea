/**
 * Dynamic Weather Client Controller
 * Updates Weather HUD badge, syncs canvas weather, and displays weather forecast modal
 * Note: Exact buff/debuff percentages are intentionally hidden from players.
 */

import { state } from './state.js';
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
      elWeatherBadge.title = '⛈️ Giông Bão Sấm Sét - Thời tiết khắc nghiệt tác động tới đơn Shipper và tâm lý khách hàng!';
    } else if (weather.id === 'rainy') {
      elWeatherBadge.classList.add('weather-badge-rainy');
      elWeatherBadge.title = '🌧️ Mưa Rào - Khách ghé trú mưa và thay đổi thời gian chờ đợi!';
    } else if (weather.id === 'cloudy') {
      elWeatherBadge.classList.add('weather-badge-cloudy');
      elWeatherBadge.title = '⛅ Trời Râm - Thời tiết mát dịu tác động tới lượng khách dạo phố!';
    } else if (weather.id === 'windy') {
      elWeatherBadge.classList.add('weather-badge-windy');
      elWeatherBadge.title = '🍃 Gió Mùa - Gió vi vu hoa lá rơi bay, khách thích mua mang đi!';
    } else {
      elWeatherBadge.classList.add('weather-badge-sunny');
      elWeatherBadge.title = '☀️ Nắng Vàng Rực Rỡ - Thời tiết nắng đẹp tác động tới lượng khách ghé quầy!';
    }
  }

  // Update Active Buffs Bar Weather Pill (no exact percentages shown)
  if (!elBuffWeather) {
    elBuffWeather = document.getElementById('buff-weather');
  }
  const elBuffBar = document.getElementById('active-buffs-bar');

  if (elBuffWeather) {
    const elBuffText = document.getElementById('buff-weather-text');
    let buffSummary = '';
    let buffStyle = '';

    if (weather.id === 'stormy') {
      buffSummary = '⛈️ Giông Bão (Biến Động Đơn Ship & Tip)';
      buffStyle = 'background: rgba(162, 155, 254, 0.25); border: 1.5px solid #a29bfe; color: #e056fd;';
    } else if (weather.id === 'rainy') {
      buffSummary = '🌧️ Mưa Rào (Hiệu Ứng Trú Mưa)';
      buffStyle = 'background: rgba(52, 152, 219, 0.22); border: 1.5px solid #3498db; color: #74b9ff;';
    } else if (weather.id === 'cloudy') {
      buffSummary = '⛅ Trời Râm (Khách Dạo Phố Thư Thả)';
      buffStyle = 'background: rgba(149, 165, 166, 0.22); border: 1.5px solid #a4b0be; color: #dfe6e9;';
    } else if (weather.id === 'windy') {
      buffSummary = '🍃 Gió Mùa (Khách Mua Mang Đi)';
      buffStyle = 'background: rgba(46, 204, 113, 0.22); border: 1.5px solid #2ecc71; color: #55efc4;';
    } else {
      buffSummary = '☀️ Nắng Vàng (Khách Dạo Phố)';
      buffStyle = 'background: rgba(241, 196, 15, 0.22); border: 1.5px solid #f1c40f; color: #fdcb6e;';
    }

    if (elBuffText) elBuffText.innerText = buffSummary;
    elBuffWeather.setAttribute('style', `display: inline-block; border-radius: 4px; padding: 2px 7px; font-weight: bold; cursor: pointer; ${buffStyle}`);
    if (elBuffBar) elBuffBar.style.display = 'flex';
  }
}

/**
 * Open Weather forecast popup modal (qualitative descriptions only, hiding exact rates)
 */
export function openWeatherModal() {
  if (!modalWeatherInfo) modalWeatherInfo = document.getElementById('modal-weather-info');
  if (!modalWeatherInfo) return;

  const weather = (state.storeState && state.storeState.weather) || {
    id: 'sunny',
    name: 'Nắng Vàng Rực Rỡ',
    icon: '☀️',
    desc: 'Trời quang đãng nắng ấm chan hòa. Khách đi dạo phố ghé quầy nhộn nhịp hơn thường ngày!'
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
        <li style="color: #a29bfe;">⚡ <b>Sấm Sét Rền Vang:</b> Chớp lóe sáng toàn màn hình & giông bão trên phố.</li>
        <li style="color: #50fa7b;">🛵 <b>Biến Động Đơn Giao Hàng:</b> Tần suất khách đi bộ và đơn Shipper thay đổi theo giông bão.</li>
        <li style="color: #f1c40f;">💰 <b>Biến Động Tiền Tip & Giá Trị Đơn:</b> Mức chi tiêu của khách chịu ảnh hưởng trực tiếp từ thời tiết.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'block';
    } else if (weather.id === 'rainy') {
      effectsHtml = `
        <li style="color: #74b9ff;">🌧️ <b>Mưa Rào Tí Tách:</b> Màn mưa xiên sợi rơi rào rào, mặt đường ướt bóng phản chiếu ánh đèn.</li>
        <li style="color: #50fa7b;">⏱️ <b>Hiệu Ứng Trú Mưa:</b> Tâm lý và thời gian kiên nhẫn chờ đợi của khách tại quầy thay đổi.</li>
        <li style="color: #00cec9;">🛵 <b>Đơn Đặt Giao Hàng:</b> Nhu cầu đặt xe máy giao tận nhà biến động theo cơn mưa.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    } else if (weather.id === 'cloudy') {
      effectsHtml = `
        <li style="color: #a4b0be;">⛅ <b>Trời Râm Mát Dịu:</b> Tầng mây xám bạc dịu mát, lớp sương mỏng là đà trôi ngang tầm mắt.</li>
        <li style="color: #55efc4;">👥 <b>Lượng Khách Dạo Phố:</b> Lưu lượng khách hàng ghé tiệm điều chỉnh theo tiết trời mát mẻ.</li>
        <li style="color: #fdcb6e;">⏱️ <b>Tâm Lý Thư Thả:</b> Thời gian khách đứng chờ pha chế chịu tác động từ thời tiết.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    } else if (weather.id === 'windy') {
      effectsHtml = `
        <li style="color: #55efc4;">🍃 <b>Gió Mùa Vi Vu:</b> Từng đợt gió xoáy và cánh hoa / lá vàng chao lượn trên đường phố.</li>
        <li style="color: #74b9ff;">🥤 <b>Xu Hướng Mua Mang Đi:</b> Lưu lượng khách ghé mua đồ uống take-away biến động.</li>
        <li style="color: #fdcb6e;">💰 <b>Tâm Trạng Khách Hàng:</b> Tiền thưởng thêm và độ kiên nhẫn thay đổi theo tiết trời.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    } else {
      effectsHtml = `
        <li style="color: #f1c40f;">☀️ <b>Nắng Đẹp Rực Rỡ:</b> Tia sáng God Rays xiên qua kẽ lá & hạt bụi nắng vàng lơ lửng.</li>
        <li style="color: #50fa7b;">👥 <b>Khách Dạo Phố:</b> Lưu lượng khách ghé quầy vỉa hè và nhu cầu giải khát thay đổi theo nắng ấm.</li>
        <li style="color: #55efc4;">🥤 <b>Đồ Uống Giải Nhiệt:</b> Mức chi tiêu và tiền tip chịu ảnh hưởng từ thời tiết hiện tại.</li>
      `;
      if (btnTestLightning) btnTestLightning.style.display = 'none';
    }
    elEffectList.innerHTML = effectsHtml;
  }

  modalWeatherInfo.style.display = 'flex';
}
