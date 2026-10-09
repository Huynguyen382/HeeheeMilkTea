/**
 * Player's Cozy Home & Room Decoration Service
 * Handles: Buying room items, equipping furniture, calculating cozy score, visiting friends' rooms
 */

const db = require('../../models/db');
const anticheat = require('../anticheat.service');
const { invalidateStoreCache } = require('./cache.helper');
const { ROOM_DECORATIONS } = require('../../data/room_decorations');

/**
 * Get current room state for a store
 */
async function getRoomState(storeId) {
  const store = await db.prepare('SELECT id, store_code, store_name, username FROM stores WHERE id = ?').get(storeId);
  if (!store) throw new Error('Không tìm thấy tiệm trà sữa!');

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Không tìm thấy dữ liệu game!');

  let decorations = [];
  try {
    decorations = JSON.parse(save.decorations || '[]');
  } catch (e) {
    decorations = [];
  }

  // Calculate owned and equipped items
  const ownedIds = new Set(decorations.map(d => typeof d === 'string' ? d : d.id));
  const equippedIds = new Set(
    decorations
      .filter(d => (typeof d === 'object' && d.equipped) || typeof d === 'string')
      .map(d => typeof d === 'string' ? d : d.id)
  );

  let totalCozyPoints = 0;
  const equippedItems = [];
  const catalog = Object.values(ROOM_DECORATIONS).map(item => {
    const isOwned = ownedIds.has(item.id);
    const isEquipped = isOwned && equippedIds.has(item.id);
    if (isEquipped) {
      totalCozyPoints += item.cozyPoints;
      equippedItems.push(item);
    }
    return {
      ...item,
      owned: isOwned,
      equipped: isEquipped
    };
  });

  // Calculate cozy tier / level
  let cozyTier = 'Phòng Trọ Đơn Sơ';
  let cozyTitle = '🌱 Căn phòng khởi nghiệp mộc mạc';
  if (totalCozyPoints >= 100) {
    cozyTier = 'Biệt Thự Trà Sữa Thiên Đường';
    cozyTitle = '👑 Không gian sống xa hoa bậc nhất phố';
  } else if (totalCozyPoints >= 65) {
    cozyTier = 'Studio Nghệ Thuật Ấm Cúng';
    cozyTitle = '✨ Căn phòng tràn ngập tiện nghi và thẩm mỹ';
  } else if (totalCozyPoints >= 35) {
    cozyTier = 'Căn Hộ Xinh Xắn Tiện Nghi';
    cozyTitle = '🪴 Góc nhỏ thư thái và ấm cúng';
  }

  return {
    store_id: store.id,
    store_code: store.store_code,
    store_name: store.store_name,
    username: store.username,
    cozyPoints: totalCozyPoints,
    cozyTier,
    cozyTitle,
    equippedItems,
    catalog,
    pet: save.active_buffs ? JSON.parse(save.active_buffs || '{}').pet : null
  };
}

/**
 * Buy a room decor item
 */
async function buyRoomDecor(storeId, decorId) {
  const item = ROOM_DECORATIONS[decorId];
  if (!item) throw new Error('Vật phẩm trang trí không tồn tại!');

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Dữ liệu lưu game không tồn tại!');

  let decorations = [];
  try {
    decorations = JSON.parse(save.decorations || '[]');
  } catch (e) {
    decorations = [];
  }

  const alreadyOwned = decorations.some(d => (typeof d === 'string' ? d === decorId : d.id === decorId));
  if (alreadyOwned) {
    throw new Error(`Bạn đã sở hữu [${item.name}] rồi! Hãy đặt vào phòng nhé.`);
  }

  if (save.money < item.price) {
    throw new Error(`Bạn không đủ tiền! Cần ${item.price.toLocaleString('vi-VN')}đ (Hiện có: ${save.money.toLocaleString('vi-VN')}đ)`);
  }

  const newMoney = save.money - item.price;
  decorations.push({ id: item.id, equipped: true, bought_at: Date.now() });

  const updatedState = {
    store_id: storeId,
    chapter: Number(save.chapter),
    day_in_game: Number(save.day_in_game),
    money: newMoney,
    debt_remaining: Number(save.debt_remaining),
    reputation: Number(save.reputation),
    teacoin: Number(save.teacoin || 0)
  };
  const hash = anticheat.generateSaveHash(updatedState);

  await db.prepare(`
    UPDATE game_saves 
    SET money = ?, decorations = ?, save_hash = ?, updated_at = ?
    WHERE store_id = ?
  `).run(newMoney, JSON.stringify(decorations), hash, new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    item,
    money: newMoney,
    message: `🎉 Chúc mừng bạn đã tậu [${item.icon} ${item.name}] về căn phòng của mình! Điểm ấm cúng +${item.cozyPoints}⭐`
  };
}

/**
 * Toggle equip status of owned room decor
 */
async function equipRoomDecor(storeId, decorId, equipStatus) {
  const item = ROOM_DECORATIONS[decorId];
  if (!item) throw new Error('Vật phẩm không tồn tại!');

  const save = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(storeId);
  if (!save) throw new Error('Dữ liệu lưu game không tồn tại!');

  let decorations = [];
  try {
    decorations = JSON.parse(save.decorations || '[]');
  } catch (e) {
    decorations = [];
  }

  let found = false;
  const isOutfit = item.category === 'outfit';

  const newDecorations = decorations.map(d => {
    const id = typeof d === 'string' ? d : d.id;
    const currentEquipped = typeof d === 'string' ? true : !!d.equipped;
    const dItem = ROOM_DECORATIONS[id];

    if (id === decorId) {
      found = true;
      const shouldEquip = (typeof equipStatus === 'boolean') ? equipStatus : !currentEquipped;
      return { id, equipped: shouldEquip, updated_at: Date.now() };
    }

    // If equipping a new outfit, unequip any other outfit
    if (isOutfit && dItem && dItem.category === 'outfit' && ((typeof equipStatus === 'boolean') ? equipStatus : !currentEquipped)) {
      return { id, equipped: false, updated_at: Date.now() };
    }

    return typeof d === 'string' ? { id: d, equipped: true } : d;
  });

  if (!found) {
    throw new Error('Bạn chưa sở hữu vật phẩm này để bài trí!');
  }

  await db.prepare(`
    UPDATE game_saves 
    SET decorations = ?, updated_at = ?
    WHERE store_id = ?
  `).run(JSON.stringify(newDecorations), new Date().toISOString(), storeId);

  invalidateStoreCache(storeId);

  return {
    success: true,
    decorId,
    equipped: (typeof equipStatus === 'boolean') ? equipStatus : true,
    message: `Đã thay đổi cách bài trí [${item.name}] trong phòng!`
  };
}

/**
 * Visit friend's room
 */
async function getFriendRoom(identifier) {
  let store = null;
  if (typeof identifier === 'number' || !isNaN(Number(identifier))) {
    store = await db.prepare('SELECT id, store_code, store_name, username FROM stores WHERE id = ?').get(Number(identifier));
  } else {
    store = await db.prepare('SELECT id, store_code, store_name, username FROM stores WHERE store_code = ? OR username = ?')
      .get(identifier.trim().toUpperCase(), identifier.trim().toLowerCase());
  }

  if (!store) {
    throw new Error('Không tìm thấy nhà của bạn bè!');
  }

  const roomState = await getRoomState(store.id);
  return {
    success: true,
    friend: {
      id: store.id,
      store_code: store.store_code,
      store_name: store.store_name,
      username: store.username
    },
    room: roomState
  };
}

/**
 * Send a cheer / like to a friend's room (awards 50 TeaCoin to friend)
 */
async function cheerFriendRoom(fromStoreId, toStoreId, message) {
  const toSave = await db.prepare('SELECT * FROM game_saves WHERE store_id = ?').get(toStoreId);
  if (!toSave) throw new Error('Không tìm thấy bạn bè!');

  const fromStore = await db.prepare('SELECT store_name FROM stores WHERE id = ?').get(fromStoreId);
  const senderName = fromStore ? fromStore.store_name : 'Một người bạn thân thiết';

  const bonusTeacoin = 50;
  const newTeacoin = (toSave.teacoin || 0) + bonusTeacoin;

  await db.prepare('UPDATE game_saves SET teacoin = ? WHERE store_id = ?').run(newTeacoin, toStoreId);
  invalidateStoreCache(toStoreId);

  return {
    success: true,
    bonusTeacoin,
    message: `❤️ Bạn đã thả tim và khen ngợi căn phòng xinh xắn của [${senderName}]! Đã tặng bạn ấy +${bonusTeacoin} TeaCoin!`
  };
}

module.exports = {
  ROOM_DECORATIONS,
  getRoomState,
  buyRoomDecor,
  equipRoomDecor,
  getFriendRoom,
  cheerFriendRoom
};

