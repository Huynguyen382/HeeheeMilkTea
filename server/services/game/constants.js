const cpuOptimizer = require('../cpu-optimizer');

const fastRandom = cpuOptimizer.fastRandom;
const probabilityDistributions = cpuOptimizer.probabilityDistributions;

// Drink Recipes Database
const RECIPES = {
  tra_sua_truyen_thong: {
    id: 'tra_sua_truyen_thong',
    name: 'Trà Sữa Truyền Thống',
    chapter: 1,
    basePrice: 32000,
    cost: 10500,
    tea: 'den',
    toppings: ['tranchau_den'],
    desc: '🍵 Cốt trà: [Trà Đen Đậm] • Cốt trà đen đậm đà hòa quyện sữa đặc béo ngậy, trân châu đen dẻo dai'
  },
  hong_tra_tac: {
    id: 'hong_tra_tac',
    name: 'Hồng Trà Tắc Xí Muội',
    chapter: 1,
    basePrice: 25000,
    cost: 7000,
    tea: 'den',
    toppings: [],
    desc: '🍵 Cốt trà: [Trà Đen Đậm] • Trà đen giải khát thanh mát, vị tắc chua thanh & xí muội mằn mặn'
  },
  tra_thai_xanh: {
    id: 'tra_thai_xanh',
    name: 'Trà Sữa Thái Xanh',
    chapter: 1,
    basePrice: 35000,
    cost: 11500,
    tea: 'thai_xanh',
    toppings: ['thach_la_dua'],
    desc: '🌿 Cốt trà: [Thái Xanh] • Màu xanh mát mắt, hương hoa lài thơm mát nồng nàn cùng thạch lá dứa'
  },
  sua_tuoi_duong_den: {
    id: 'sua_tuoi_duong_den',
    name: 'Sữa Tươi Trân Châu Đường Đen',
    chapter: 2,
    basePrice: 42000,
    cost: 14000,
    tea: 'sua_tuoi',
    toppings: ['tranchau_duongden'],
    desc: '🥛 Cốt trà: [Sữa Tươi] • Sữa tươi thanh trùng cùng trân châu nấu đường đen dẻo quánh hot trend'
  },
  tra_dao_cam_sa: {
    id: 'tra_dao_cam_sa',
    name: 'Trà Đào Cam Sả',
    chapter: 2,
    basePrice: 48000,
    cost: 19500,
    tea: 'lai',
    toppings: ['dao_mieng', 'cam_vang', 'sa_tuoi'],
    desc: '🌸 Cốt trà: [Lục Trà Lài] • Bắt buộc đủ 3 món: Đào Miếng + Cam Vàng + Sả Tươi thơm nức mũi'
  },
  tra_olong_nuong: {
    id: 'tra_olong_nuong',
    name: 'Trà Ô Long Nướng Sương Sáo',
    chapter: 3,
    basePrice: 45000,
    cost: 14500,
    tea: 'olong_nuong',
    toppings: ['suong_sao'],
    desc: '🔥 Cốt trà: [Ô Long Nướng] • Vị khói sao cháy mộc mạc thượng hạng hòa quyện thạch sương sáo mềm mướt'
  },
  nitro_cold_brew: {
    id: 'nitro_cold_brew',
    name: 'Trà Nitro Lạnh Sủi Bọt',
    chapter: 3,
    basePrice: 55000,
    cost: 18000,
    tea: 'olong_nuong',
    toppings: ['suong_sao', 'tranchau_den'],
    desc: '💨 Cốt trà: [Ô Long Nướng] • Công nghệ Nitro lạnh sủi bọt kem mịn màng mát lạnh kết hợp trân châu & sương sáo'
  },
  tra_sua_dat_vang: {
    id: 'tra_sua_dat_vang',
    name: 'Trà Sữa Hoàng Gia Dát Vàng 24K',
    chapter: 3,
    basePrice: 88000,
    cost: 28000,
    tea: 'den',
    toppings: ['tranchau_den', 'tranchau_duongden'],
    desc: '👑 Cốt trà: [Trà Đen Đậm] • Trà sữa thượng hạng phủ lá vàng 24K thực phẩm lấp lánh dành cho giới thượng lưu'
  },
  tra_sen_tay_ho: {
    id: 'tra_sen_tay_ho',
    name: 'Trà Sen Bách Diệp Tây Hồ',
    chapter: 3,
    basePrice: 68000,
    cost: 22000,
    tea: 'lai',
    toppings: ['dao_mieng', 'sa_tuoi'],
    desc: '🪷 Cốt trà: [Lục Trà Lài] • Tinh hoa trà sen Tây Hồ ngát hương sen sớm quyện cùng đào miếng giòn ngọt & sả thơm'
  },
  kem_kho_banh_bong: {
    id: 'kem_kho_banh_bong',
    name: 'Trà Sữa Kem Khò Bánh Bỏng',
    chapter: 3,
    basePrice: 62000,
    cost: 20000,
    tea: 'thai_xanh',
    toppings: ['thach_la_dua', 'tranchau_duongden'],
    desc: '🔥 Cốt trà: [Thái Xanh] • Lớp kem béo ngậy được khò lửa caramel thơm lừng, rắc bánh bỏng giòn tan'
  }
};

// Shelf toppings available on the barista workstation
const SHELF_TOPPINGS = [
  'tranchau_den',
  'thach_la_dua',
  'tranchau_duongden',
  'dao_mieng',
  'cam_vang',
  'sa_tuoi',
  'suong_sao'
];

// 5 Canonical Tea Bases (Balanced at ~20% each)
const TEA_BASES = ['den', 'thai_xanh', 'sua_tuoi', 'lai', 'olong_nuong'];

// Core Drink Recipes covering all tea bases
const CORE_RECIPES = [
  'tra_sua_truyen_thong',
  'hong_tra_tac',
  'tra_thai_xanh',
  'sua_tuoi_duong_den',
  'tra_dao_cam_sa',
  'tra_olong_nuong',
  'nitro_cold_brew',
  'tra_sua_dat_vang',
  'tra_sen_tay_ho',
  'kem_kho_banh_bong'
];

// Helper to generate realistic multi-topping combinations for customers
function generateCustomerToppings(cust, recipe) {
  // Trà đào cam sả bắt buộc phải có đủ bộ 3: Đào miếng, Cam vàng, Sả tươi
  if (recipe && recipe.id === 'tra_dao_cam_sa') {
    return ['dao_mieng', 'cam_vang', 'sa_tuoi'];
  }

  // Track performance
  cpuOptimizer.performance.mathRandomCalls++;
  
  let toppingCount;
  
  if (cust && cust.type === 5) {
    // Bác Ba Cụ Đồ thích thanh đạm
    toppingCount = probabilityDistributions.getToppingCount(fastRandom, 'elder');
  } else if (cust && cust.isTiktoker) {
    // Tú TikToker chuộng visual hoành tráng nhiều tầng
    toppingCount = probabilityDistributions.getToppingCount(fastRandom, 'tiktoker');
  } else if (cust && cust.type === 6) {
    // Chú Quân Gymer siết cơ
    toppingCount = probabilityDistributions.getToppingCount(fastRandom, 'gymmer');
  } else {
    // Phổ thông
    toppingCount = probabilityDistributions.getToppingCount(fastRandom, 'normal');
  }

  if (toppingCount === 0) return [];

  const baseTopping = recipe.toppings && recipe.toppings.length > 0 ? recipe.toppings[0] : null;
  const chosen = [];

  // Giữ lại topping đặc trưng của món nếu có trên kệ
  if (baseTopping && SHELF_TOPPINGS.includes(baseTopping)) {
    chosen.push(baseTopping);
  }

  // Chọn thêm ngẫu nhiên các loại topping khác không trùng lặp
  const availableToppings = SHELF_TOPPINGS.filter(t => !chosen.includes(t));
  const neededCount = toppingCount - chosen.length;
  
  if (availableToppings.length > 0 && neededCount > 0) {
    const shuffled = [...availableToppings];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = fastRandom.int(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    for (let i = 0; i < Math.min(neededCount, shuffled.length); i++) {
      chosen.push(shuffled[i]);
    }
  }

  return chosen;
}

// 50 Character System (ModelNPC) - 49 Customer archetypes
function mapCustomerFav(drinkName) {
  const d = (drinkName || '').toLowerCase();
  if (d.includes('olong') || d.includes('ô long') || d.includes('nướng')) return ['tra_olong_nuong', 'tra_sua_truyen_thong'];
  if (d.includes('thái') || d.includes('xanh') || d.includes('matcha')) return ['tra_thai_xanh', 'tra_sua_truyen_thong'];
  if (d.includes('đào') || d.includes('cam') || d.includes('sả')) return ['tra_dao_cam_sa', 'hong_tra_tac'];
  if (d.includes('tắc') || d.includes('chanh') || d.includes('hồng trà')) return ['hong_tra_tac', 'tra_dao_cam_sa'];
  if (d.includes('đường đen') || d.includes('sữa tươi')) return ['sua_tuoi_duong_den', 'tra_sua_truyen_thong'];
  return ['tra_sua_truyen_thong', 'tra_olong_nuong'];
}

let CHARACTERS_DATA = [];
try {
  CHARACTERS_DATA = require('../../../public/js/characters').CHARACTERS;
} catch (e) {
  try {
    CHARACTERS_DATA = require('../../public/js/characters').CHARACTERS;
  } catch (err) {}
}

const CUSTOMERS = (CHARACTERS_DATA && CHARACTERS_DATA.length > 1)
  ? CHARACTERS_DATA.slice(1).map((c, idx) => {
      const isTiktoker = (c.id === 12 || c.id === 53 || c.style === 'tiktoker' || c.cat === 'streamer');
      const isShipper = (c.id === 24 || c.style === 'shipper');
      const isVIP = (c.id === 52 || c.cat === 'vip');
      let tipMult = 1.05;
      if (isVIP) tipMult = 3.5;
      else if (isTiktoker) tipMult = 2.2;
      else if (c.cat === 'traditional') tipMult = 1.5;
      else if (c.cat === 'pro') tipMult = 1.3;

      let patience = 30000;
      if (isTiktoker) patience = 24000;
      else if (isShipper) patience = 25000;
      else if (c.cat === 'traditional' || c.cat === 'teacher') patience = 38000;
      else if (isVIP) patience = 35000;

      return {
        type: idx,
        id: c.id,
        name: c.name,
        patience: patience,
        fav: mapCustomerFav(c.favoriteDrink),
        tipMult: tipMult,
        isTiktoker: isTiktoker,
        isShipper: isShipper,
        isVIP: isVIP,
        dialogues: (c.dialogues && c.dialogues.length > 0) ? c.dialogues : ['Cho một ly trà sữa thơm ngon nha!']
      };
    })
  : [
  {
    type: 0,
    name: 'Bé Lan (Nữ sinh)',
    patience: 25000,
    fav: ['tra_sua_truyen_thong', 'tra_thai_xanh'],
    tipMult: 1.0,
    dialogues: [
      'Chị HeeHee ơi, cho em ly ít đường ít đá mang vào tiết Toán nha!',
      'Trà sữa quán mình ngon nhất phố, em rủ cả lớp ra ủng hộ nè!'
    ]
  }
];

const SHIPPER_SNACKS = [
  { id: 'banh_trang_tron', name: 'Bánh Tráng Trộn Bò Khô Trứng Cút', icon: '🥡', desc: 'Chua cay mặn ngọt bùng nổ vị giác vỉa hè' },
  { id: 'bap_xao', name: 'Bắp Xào Bơ Tép Mỡ Hành', icon: '🌽', desc: 'Béo ngậy thơm nức mũi mùi bơ vàng' },
  { id: 'xien_ban', name: 'Xiên Que Chiên Sốt Me Chua Ngọt', icon: '🍢', desc: 'Hương vị tuổi thơ cổng trường học giòn rụm' },
  { id: 'banh_trang_nuong', name: 'Bánh Tráng Nướng Trứng Xúc Xích', icon: '🍕', desc: 'Pizza Việt Nam nóng hổi giòn tan' },
  { id: 'goi_cuon', name: 'Gỏi Cuốn Tôm Thịt Tương Đen', icon: '🥢', desc: 'Tươi mát nhiều rau kèm đậu phộng rang' },
  { id: 'che_buoi', name: 'Chè Bưởi Cốt Dừa An Giang', icon: '🥣', desc: 'Cùi bưởi giòn sần sật béo ngậy nước cốt dừa' }
];

const UPGRADES = {
  bua_an_than: { 
    name: '🔮 Bùa Ẩn Thân Quầy Hàng', 
    cost: 200000, 
    desc: 'Vật phẩm tiêu hao (sức chứa tối đa 3 tấm). Treo cạnh quầy, nhấp đúp để kích hoạt tàng hình cả quán tối đa 60s, né tránh công an tuần tra. Chỉ mua thêm khi số lượng < 3 tấm!',
    type: 'talisman'
  },
  may_dap_nap: { name: 'Máy Dập Nắp Tự Động', cost: 500000, desc: 'Bé Bắp tự động dập nắp ly siêu tốc' },
  binh_u_lon: { name: 'Bình Ủ Inox 10L', cost: 400000, desc: 'Cốt trà thơm lâu, không sợ thiu chua' },
  xe_wave: { name: 'Xe Wave Giao Hàng Cho Lâm', cost: 1200000, desc: 'Tăng tốc độ ship và rượt bắt kẻ bùng tiền' },
  
  // VẬT PHẨM ĐẶC BIỆT MỚI (SPECIAL ITEMS)
  loa_keo_keo: {
    name: '📻 Loa Kẹo Kéo Sôi Động',
    cost: 850000,
    type: 'special',
    desc: 'Phát nhạc remix sôi động thu hút khách đi đường, tăng +35% tần suất khách ghé quầy!'
  },
  tui_muoi_phong_thuy: {
    name: '🧂 Túi Muối Phong Thủy Đuổi Vía',
    cost: 300000,
    type: 'special',
    desc: 'Treo đầu xe đuổi vía xấu, miễn nhiễm hoàn toàn trước kẻ trộm thú cưng và khách quỵt tiền!'
  },
  may_lac_sieu_toc: {
    name: '⚡ Máy Lắc Siêu Tốc Barista Pro',
    cost: 1500000,
    type: 'special',
    desc: 'Công nghệ lắc từ tính siêu tốc chỉ trong 0.5s, nâng cao chất lượng ly trà sữa và tăng +10% tiền tip!'
  },
  ve_vang_vip: {
    name: '🎫 Vé Vàng Mời Khách VIP Shark Hưng',
    cost: 600000,
    type: 'special',
    desc: 'Vật phẩm tiêu hao: Mời trực tiếp Shark Hưng hoặc Streamer ghé quán, thanh toán x3 - x5 giá ly!'
  },
  bien_led_neon: {
    name: '💡 Biển Hiệu LED Neon Cyberpunk',
    cost: 2000000,
    type: 'special',
    desc: 'Bảng đèn neon phát sáng rực rỡ trong đêm, cộng vĩnh viễn +0.3⭐ danh tiếng quán và hút khách trẻ!'
  },

  // THẺ HÃM HẠI ĐỐI THỦ (SABOTAGE CARDS - CHAPTER 2)
  the_boc_phot: {
    name: '📱 Thẻ Bóc Phốt TikToker',
    cost: 500000,
    type: 'sabotage_card',
    sabotageType: 'tiktoker_flop',
    chapter: 2,
    desc: 'Vật phẩm tiêu hao (Chương 2): Kích hoạt ngay lập tức phốt giả cho quán đối thủ! Quán bị hại sẽ giảm 50% lượng khách và -30% giá bán trong 10 đợt đơn!'
  },
  the_quan_ly_thi_truong: {
    name: '👮 Thẻ Quản Lý Thị Trường Thanh Tra',
    cost: 850000,
    type: 'sabotage_card',
    sabotageType: 'market_inspection',
    chapter: 2,
    desc: 'Vật phẩm tiêu hao (Chương 2): Điều thanh tra Quản lý thị trường ập vào kiểm tra đột xuất quán đối thủ! Quán đối thủ bị niêm phong tạm thời, tụt 60% lượng khách và mất 40% doanh thu trong 10 đợt đơn!'
  },

  // THẺ PHÒNG THỦ & KHẮC CHẾ (DEFENSE & UTILITY CARDS - CHAPTER 2)
  the_attp_5sao: {
    name: '🛡️ Giấy Chứng Nhận ATTP 5 Sao',
    cost: 600000,
    type: 'defense_card',
    cardKey: 'the_attp_5sao',
    chapter: 2,
    desc: 'Vật phẩm phòng thủ: Hóa giải ngay lập tức lệnh niêm phong của Quản Lý Thị Trường; hồi phục 100% lượng khách!'
  },
  the_dinh_chinh: {
    name: '🎥 Video Đính Chính & Phỏng Vấn',
    cost: 700000,
    type: 'defense_card',
    cardKey: 'the_dinh_chinh',
    chapter: 2,
    desc: 'Vật phẩm phòng thủ: Dập tắt clip bóc phốt TikToker; lội ngược dòng tăng +30% lượng khách và doanh thu trong 5 đợt nhờ hiệu ứng minh bạch!'
  },
  the_idol_trieu_view: {
    name: '🎤 Hợp Đồng Idol Triệu View',
    cost: 1200000,
    type: 'event_card',
    cardKey: 'the_idol_trieu_view',
    chapter: 2,
    desc: 'Vật phẩm sự kiện: Ca sĩ thần tượng nổi tiếng ghé check-in; bão khách xếp hàng vòng quanh phố trong 15 đợt đơn!'
  },
  the_mua_giai_nhiet: {
    name: '🌧️ Cơn Mưa Rào Giải Nhiệt',
    cost: 350000,
    type: 'utility_card',
    cardKey: 'the_mua_giai_nhiet',
    chapter: 2,
    desc: 'Vật phẩm tiện ích: Hồi phục ngay lập tức 50% thanh kiên nhẫn của toàn bộ khách hàng đang đứng chờ tại quầy!'
  },

  // HỆ THỐNG THÚ CƯNG GIỮ QUÁN (PETS)
  pet_corgi: {
    name: '🐶 Cún Corgi Chân Ngắn (Mông Trái Tim)',
    cost: 1800000,
    type: 'pet',
    petId: 'corgi',
    desc: 'Cún cưng giữ quầy siêu dễ thương, giúp tăng +20% tiền tip của khách. (Cảnh giác kẻ trộm khi quán đông!)'
  },
  pet_meo_tam_the: {
    name: '🐱 Mèo Tam Thể Chiêu Tài (Maneki Neko)',
    cost: 3200000,
    type: 'pet',
    petId: 'meo_tam_the',
    desc: 'Mèo thần tài vẫy chân may mắn, tăng +15% tổng doanh thu mỗi ly trà sữa!'
  },
  pet_capybara: {
    name: '🐹 Chuột Lang Nước Capybara Siêu Chill',
    cost: 5500000,
    type: 'pet',
    petId: 'capybara',
    desc: 'Thánh ngoại giao bình tĩnh nhất quả đất, tăng +40% thời gian kiên nhẫn chờ đợi của khách hàng!'
  },

  // HỆ THỐNG CÔNG THỨC MÓN MỚI (MỞ RỘNG MENU)
  recipe_hong_tra_tac: {
    name: '📜 Công Thức: Hồng Trà Tắc Xí Muội',
    cost: 120000,
    type: 'recipe',
    recipeId: 'hong_tra_tac',
    desc: 'Mở khóa món Hồng Trà Tắc Xí Muội vào Menu quán! Giá bán: 25.000đ/ly.'
  },
  recipe_tra_thai_xanh: {
    name: '📜 Công Thức: Trà Sữa Thái Xanh',
    cost: 250000,
    type: 'recipe',
    recipeId: 'tra_thai_xanh',
    desc: 'Mở khóa món Trà Sữa Thái Xanh vào Menu quán! Giá bán: 35.000đ/ly.'
  },
  recipe_sua_tuoi_duong_den: {
    name: '📜 Công Thức: Sữa Tươi Trân Châu Đường Đen',
    cost: 500000,
    type: 'recipe',
    recipeId: 'sua_tuoi_duong_den',
    desc: 'Mở khóa món Sữa Tươi Đường Đen hot trend vào Menu quán! Giá bán: 42.000đ/ly.'
  },
  recipe_tra_dao_cam_sa: {
    name: '📜 Công Thức: Trà Đào Cam Sả',
    cost: 800000,
    type: 'recipe',
    recipeId: 'tra_dao_cam_sa',
    desc: 'Mở khóa món Trà Đào Cam Sả giải nhiệt vào Menu quán! Giá bán: 48.000đ/ly.'
  },
  recipe_tra_olong_nuong: {
    name: '📜 Công Thức: Trà Ô Long Nướng Sương Sáo',
    cost: 1500000,
    type: 'recipe',
    recipeId: 'tra_olong_nuong',
    desc: 'Mở khóa món Trà Ô Long Nướng Thượng Hạng vào Menu quán! Giá bán: 45.000đ/ly.'
  },
  recipe_nitro_cold_brew: {
    name: '📜 Công Thức: Trà Nitro Lạnh Sủi Bọt',
    cost: 2200000,
    type: 'recipe',
    recipeId: 'nitro_cold_brew',
    chapter: 3,
    desc: 'Mở khóa món Trà Nitro Lạnh Sủi Bọt cao cấp vào Menu Flagship! Giá bán: 55.000đ/ly.'
  },
  recipe_tra_sua_dat_vang: {
    name: '📜 Công Thức: Trà Sữa Hoàng Gia Dát Vàng 24K',
    cost: 4500000,
    type: 'recipe',
    recipeId: 'tra_sua_dat_vang',
    chapter: 3,
    desc: 'Mở khóa món Trà Sữa Dát Vàng Hoàng Gia 24K vào Menu Flagship! Giá bán: 88.000đ/ly.'
  },
  recipe_tra_sen_tay_ho: {
    name: '📜 Công Thức: Trà Sen Bách Diệp Tây Hồ',
    cost: 3000000,
    type: 'recipe',
    recipeId: 'tra_sen_tay_ho',
    chapter: 3,
    desc: 'Mở khóa món Trà Sen Bách Diệp Tây Hồ tinh hoa vào Menu Flagship! Giá bán: 68.000đ/ly.'
  },
  recipe_kem_kho_banh_bong: {
    name: '📜 Công Thức: Trà Sữa Kem Khò Bánh Bỏng',
    cost: 2800000,
    type: 'recipe',
    recipeId: 'kem_kho_banh_bong',
    chapter: 3,
    desc: 'Mở khóa món Trà Sữa Kem Khò Bánh Bỏng siêu hot trend vào Menu Flagship! Giá bán: 62.000đ/ly.'
  },

  // PHÂN QUYỀN NHÂN SỰ CHƯƠNG 3 (STAFF DELEGATION)
  staff_be_bap_manager: {
    name: '👩‍💼 Thăng Chức Bé Bắp: Cửa Hàng Trưởng',
    cost: 3500000,
    type: 'staff',
    chapter: 3,
    desc: 'Bé Bắp quản lý quầy chuyên nghiệp: Tăng +25% giá trị toàn bộ đơn hàng và tự động dập nắp ly siêu tốc!'
  },
  staff_anh_lam_captain: {
    name: '🏍️ Thăng Chức Anh Lâm: Đội Trưởng Logistics',
    cost: 4500000,
    type: 'staff',
    chapter: 3,
    desc: 'Anh Lâm chỉ huy đội xe Wave giao hàng hỏa tốc tỏa đi khắp thành phố: Tăng +35% doanh thu mọi đơn app!'
  },

  // HỆ THỐNG PHƯƠNG TIỆN & ĐỘI XE GIAO HÀNG (VEHICLE FLEET)
  xe_dream_chien: {
    name: '🏍️ Xe Dream Chiến Tem Lửa (Giao Đơn VIP)',
    cost: 2500000,
    type: 'vehicle',
    chapter: 2,
    desc: 'Huyền thoại đường phố! Tăng +50% tiền Tip cho mọi đơn shipper mang đi và tăng độ kiên nhẫn của shipper!'
  },
  xe_ban_tai_pickup: {
    name: '🛻 Xe Bán Tải Pickup 4x4 (Chở Kho Sỉ)',
    cost: 8000000,
    type: 'vehicle',
    chapter: 3,
    desc: 'Chở nguyên liệu số lượng lớn từ Mộc Châu về quán: Giảm 20% chi phí nhập cốt trà và topping tại Chợ Sỉ!'
  },
  xe_dap_tho_sen: {
    name: '🚲 Xe Đạp Thồ Sen Tây Hồ (Bán Dạo Buổi Sớm)',
    cost: 1500000,
    type: 'vehicle',
    chapter: 2,
    desc: 'Nét đẹp phố cổ Hà Nội: Mỗi sáng sớm tăng tự động +0.2⭐ uy tín tiệm và thu hút khách thượng lưu!'
  }
};

module.exports = {
  RECIPES,
  SHELF_TOPPINGS,
  TEA_BASES,
  CORE_RECIPES,
  generateCustomerToppings,
  mapCustomerFav,
  CUSTOMERS,
  SHIPPER_SNACKS,
  UPGRADES
};
