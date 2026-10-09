// API Client with Session & Token Management
const API = {
  token: localStorage.getItem('hyhy_session_token') || null,

  async request(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['x-session-token'] = this.token;
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const res = await fetch('/api' + endpoint, config);
      const data = await res.json();
      if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        this.token = null;
        localStorage.removeItem('hyhy_session_token');
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      return { error: 'Không thể kết nối đến máy chủ Tiệm Trà Sữa HeeHee!' };
    }
  },

  async authRegister(username, password, storeName) {
    const res = await this.request('/auth/register', 'POST', { username, password, store_name: storeName });
    if (res && res.session_token) {
      this.token = res.session_token;
      localStorage.setItem('hyhy_session_token', this.token);
    }
    return res;
  },

  async authLogin(account, password) {
    const res = await this.request('/auth/login', 'POST', { account, password });
    if (res && res.session_token) {
      this.token = res.session_token;
      localStorage.setItem('hyhy_session_token', this.token);
    }
    return res;
  },

  async authLogout() {
    const res = await this.request('/auth/logout', 'POST');
    this.token = null;
    localStorage.removeItem('hyhy_session_token');
    return res;
  },

  async getMe() {
    return await this.request('/auth/me');
  },

  async login(storeName, storeCode) {
    const res = await this.request('/store/login', 'POST', { store_name: storeName, store_code: storeCode });
    if (res && res.session_token) {
      this.token = res.session_token;
      localStorage.setItem('hyhy_session_token', this.token);
    }
    return res;
  },

  async getState() {
    return await this.request('/store/state');
  },

  async getOrder(isShipper = false) {
    const endpoint = isShipper ? '/game/order?isShipper=true' : '/game/order';
    return await this.request(endpoint);
  },

  async getShipperOrder() {
    return await this.getOrder(true);
  },

  async serveOrder(orderId, timeTaken, recipeId, sugar, ice, toppings = [], pausedTimeMs = 0) {
    return await this.request('/game/serve', 'POST', {
      orderId,
      timeTaken,
      recipeId,
      sugar,
      ice,
      toppings,
      pausedTimeMs
    });
  },

  async snackDecision(accept) {
    return await this.request('/game/snack-decision', 'POST', { accept });
  },

  async negotiateOrder(orderId, accept) {
    return await this.request('/game/negotiate', 'POST', { orderId, accept });
  },

  async setCustomPrices(customPrices) {
    return await this.request('/game/custom-prices', 'POST', { customPrices });
  },

  async reportOrderFail(orderId, isTiktoker = false) {
    return await this.request('/game/order-fail', 'POST', { orderId, isTiktoker });
  },

  async collab(friendCode) {
    return await this.request('/game/collab', 'POST', { friendCode });
  },

  async getCollabs() {
    return await this.request('/game/collabs');
  },

  async acceptCollab(collabId) {
    return await this.request('/game/collab/accept', 'POST', { collabId });
  },

  async declineCollab(collabId) {
    return await this.request('/game/collab/decline', 'POST', { collabId });
  },

  async cancelCollab(collabId) {
    return await this.request('/game/collab/cancel', 'POST', { collabId });
  },

  async heartbeat(since = 0) {
    return await this.request('/game/heartbeat', 'POST', { since });
  },

  async getLiveEvents(since = 0) {
    return await this.request(`/game/live-events?since=${since}`);
  },

  async getFriends() {
    return await this.request('/game/friends');
  },

  async sendFriendRequest(friendCode) {
    return await this.request('/game/friends/request', 'POST', { friendCode });
  },

  async acceptFriendRequest(requestId) {
    return await this.request('/game/friends/accept', 'POST', { requestId });
  },

  async rejectFriendRequest(requestId) {
    return await this.request('/game/friends/reject', 'POST', { requestId });
  },

  async removeFriend(friendshipId) {
    return await this.request('/game/friends/remove', 'POST', { friendshipId });
  },

  async sendFriendGift(friendshipId) {
    return await this.request('/game/friends/gift', 'POST', { friendshipId });
  },

  async payDebt(amount) {
    return await this.request('/game/pay-debt', 'POST', { amount });
  },

  async buyUpgrade(upgradeId) {
    return await this.request('/game/upgrade', 'POST', { upgradeId });
  },

  async useTalisman() {
    return await this.request('/game/use-talisman', 'POST');
  },

  async useSabotageCard(cardId, targetStoreCode) {
    return await this.request('/game/use-sabotage', 'POST', { cardId, targetStoreCode });
  },

  async useSupportCard(cardId) {
    return await this.request('/game/use-support-card', 'POST', { cardId });
  },

  async advanceDay() {
    return await this.request('/game/advance-day', 'POST');
  },

  async testTamper() {
    return await this.request('/anticheat/test-tamper', 'POST');
  },

  async acceptPenalty() {
    return await this.request('/anticheat/accept-penalty', 'POST');
  },

  async stealPet() {
    return await this.request('/game/steal-pet', 'POST');
  },

  async redeemPet() {
    return await this.request('/game/redeem-pet', 'POST');
  },

  async shooThief() {
    return await this.request('/game/shoo-thief', 'POST');
  },

  async inviteTiktoker() {
    return await this.request('/game/invite-tiktoker', 'POST');
  },

  async buyIngredients(items) {
    return await this.request('/game/buy-ingredients', 'POST', { items });
  },

  async endShift() {
    return await this.request('/game/end-shift', 'POST');
  },

  async unlockChapter2() {
    return await this.request('/game/unlock-chapter-2', 'POST');
  },

  async unlockChapter3() {
    return await this.request('/game/unlock-chapter-3', 'POST');
  },

  async policeFine() {
    return await this.request('/game/police-fine', 'POST');
  },

  async skipRest() {
    return await this.request('/game/skip-rest', 'POST');
  },

  async getDailyQuests() {
    return await this.request('/game/quests');
  },

  async claimDailyQuest(questId) {
    return await this.request('/game/quests/claim', 'POST', { questId });
  },

  // Weather System
  async getWeather() {
    return await this.request('/game/weather');
  },

  async changeWeather(weatherId) {
    return await this.request('/game/weather/change', 'POST', { weatherId });
  },

  // Room & Cozy Home
  async getRoom() {
    return await this.request('/game/room');
  },

  async buyRoomDecor(decorId) {
    return await this.request('/game/room/buy', 'POST', { decorId });
  },

  async equipRoomDecor(decorId, equipped) {
    return await this.request('/game/room/equip', 'POST', { decorId, equipped });
  },

  async visitFriendRoom(identifier) {
    return await this.request(`/game/room/visit/${encodeURIComponent(identifier)}`);
  },

  async cheerFriendRoom(toStoreId, message) {
    return await this.request('/game/room/cheer', 'POST', { toStoreId, message });
  }
};

window.API = API;
