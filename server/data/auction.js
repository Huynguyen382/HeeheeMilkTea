/**
 * Rare Ingredient Auction House Data
 * Sàn Đấu Giá Nguyên Liệu Quý Hiếm & Độc Quyền
 */

const AUCTION_ITEMS = {
  tra_co_thu_ta_xua: {
    id: 'tra_co_thu_ta_xua',
    name: 'Mẻ Trà Cổ Thụ Tà Xùa 300 Năm',
    icon: '🍵',
    startingBid: 15000000,
    minBidStep: 1000000,
    color: '#824f33',
    badge: 'Kỳ Hoa Dị Thảo',
    desc: 'Búp trà cổ thụ mọc trên vách núi mây ngàn Tà Xùa. Tăng vĩnh viễn +30% giá bán toàn bộ menu Trà Đen & Trà Ô Long! Khách xếp hàng dài kiên nhẫn gấp đôi.',
    effects: {
      teaPriceMultiplier: 1.30,
      patienceBonus: 0.50
    }
  },

  olong_alishan_hun_khoi: {
    id: 'olong_alishan_hun_khoi',
    name: 'Búp Trà Ô Long Hun Khói Alishan',
    icon: '🍂',
    startingBid: 20000000,
    minBidStep: 1500000,
    color: '#d35400',
    badge: 'Đặc Sản Núi Cao',
    desc: 'Hái từ đỉnh núi mù sương Alishan rồi hun khói gỗ tuyết tùng 72 giờ. Tăng thêm +50% tiền Tip rơi trên bàn (Dine-in) và đơn shipper!',
    effects: {
      tipBonusMultiplier: 1.50
    }
  },

  sua_tuoi_hokkaido: {
    id: 'sua_tuoi_hokkaido',
    name: 'Thùng Sữa Tươi Bò Vàng Hokkaido',
    icon: '🥛',
    startingBid: 25000000,
    minBidStep: 2000000,
    color: '#ffffff',
    badge: 'Hoàng Gia Nhật Bản',
    desc: 'Sữa tươi béo ngậy nguyên chất từ thảo nguyên tuyết Hokkaido. Tăng vĩnh viễn +45% giá bán tất cả đồ uống cốt Sữa Tươi & hiệu ứng lấp lánh!',
    effects: {
      milkPriceMultiplier: 1.45
    }
  },

  mat_mia_u_minh: {
    id: 'mat_mia_u_minh',
    name: 'Hũ Mật Mía Rừng Nguyên Sinh U Minh',
    icon: '🍯',
    startingBid: 30000000,
    minBidStep: 2500000,
    color: '#f1c40f',
    badge: 'Tinh Hoa Rừng Già',
    desc: 'Mật mía hoa tràm cô đặc trong rừng sâu nguyên sinh. Nấu trân châu đường đen dẻo quánh, tăng +0.25⭐ danh tiếng và khách tự động gọi thêm full topping!',
    effects: {
      repBoost: 0.25,
      autoToppingBonus: true
    }
  }
};

const NPC_BIDDERS = [
  { id: 'lao_ba', name: 'Lão Ba (Trà Sữa Trâu Vàng)', catchphrase: 'Trâu Vàng vung tiền không tiếc!', personality: 'aggressive' },
  { id: 'dai_gia_q1', name: 'Đại Gia Phố Đi Bộ Quận 1', catchphrase: 'Tiền bạc với tôi chỉ là con số!', personality: 'rich' },
  { id: 'mr_sato', name: 'Mr. Sato (Tokyo Boba King)', catchphrase: 'Tuyệt phẩm này phải mang về Shibuya!', personality: 'strategic' },
  { id: 'shark_tuan', name: 'Shark Tuấn (Quỹ Đầu Tư Bách Khoa)', catchphrase: 'Món này định giá hời, tôi đầu tư ngay!', personality: 'investor' }
];

module.exports = { AUCTION_ITEMS, NPC_BIDDERS };

