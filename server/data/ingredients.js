// Danh mục Nguyên liệu Chợ Đầu Mối (Wholesale Milk Tea Market)
const INGREDIENTS = [
  // --- CỐT TRÀ CHÍNH ---
  {
    id: 'tra_den',
    name: 'Trà Đen Tân Cương',
    category: 'tea',
    teaKey: 'den',
    price: 2000,
    unit: 'phần',
    packSize: 10,
    icon: '🍵',
    pixelColor: '#7c3f1d',
    desc: 'Lá trà đen ủ lên men đậm đà, nền tảng cho Trà Sữa Truyền Thống & Hồng Trà Tắc'
  },
  {
    id: 'tra_thai_xanh',
    name: 'Trà Thái Xanh Thượng Hạng',
    category: 'tea',
    teaKey: 'thai_xanh',
    price: 2500,
    unit: 'phần',
    packSize: 10,
    icon: '🍃',
    pixelColor: '#2fa364',
    desc: 'Bột trà xanh Thái Lan thơm nức mùi hoa hồi và thảo mộc thanh mát'
  },
  {
    id: 'sua_tuoi',
    name: 'Sữa Tươi Thanh Trùng',
    category: 'tea',
    teaKey: 'sua_tuoi',
    price: 3000,
    unit: 'phần',
    packSize: 10,
    icon: '🥛',
    pixelColor: '#ffffff',
    desc: 'Sữa tươi Đà Lạt béo ngậy thanh nhẹ, dùng cho Sữa Tươi Đường Đen'
  },
  {
    id: 'tra_lai',
    name: 'Lục Trà Hoa Lài Cao Cấp',
    category: 'tea',
    teaKey: 'lai',
    price: 3000,
    unit: 'phần',
    packSize: 10,
    icon: '🌼',
    pixelColor: '#e09838',
    desc: 'Cốt trà ướp cánh hoa lài tự nhiên thơm ngát, nền tảng cho Trà Đào Cam Sả'
  },
  {
    id: 'tra_olong',
    name: 'Trà Ô Long Nướng Sao Cháy',
    category: 'tea',
    teaKey: 'olong_nuong',
    price: 3500,
    unit: 'phần',
    packSize: 10,
    icon: '🍂',
    pixelColor: '#824f33',
    desc: 'Trà ô long sấy than củi đượm vị khói mộc mạc hảo hạng'
  },

  // --- TOPPING NGUYÊN LIỆU ---
  {
    id: 'tranchau_den',
    name: 'Trân Châu Đen Dẻo',
    category: 'topping',
    price: 1500,
    unit: 'phần',
    packSize: 10,
    icon: '⚫',
    pixelColor: '#2d1d28',
    desc: 'Hạt trân châu bột sắn nấu đường nâu, dẻo dai nhai sướng miệng'
  },
  {
    id: 'thach_la_dua',
    name: 'Thạch Lá Dứa Tươi',
    category: 'topping',
    price: 1500,
    unit: 'phần',
    packSize: 10,
    icon: '🌿',
    pixelColor: '#2ed573',
    desc: 'Thạch rau câu giòn sần sật ép từ lá dứa thơm mát ngọt lành'
  },
  {
    id: 'tranchau_duongden',
    name: 'Sốt Đường Đen Hàn Quốc',
    category: 'topping',
    price: 2000,
    unit: 'phần',
    packSize: 10,
    icon: '🍯',
    pixelColor: '#5c3a21',
    desc: 'Mật mía cô đặc sánh mịn, vân đường hổ chảy quanh thành ly'
  },
  {
    id: 'dao_mieng',
    name: 'Đào Ngâm Giòn Nam Phi',
    category: 'topping',
    price: 2500,
    unit: 'phần',
    packSize: 10,
    icon: '🍑',
    pixelColor: '#ffa502',
    desc: 'Miếng đào vàng ươm mọng nước, vị chua ngọt giòn tan'
  },
  {
    id: 'cam_vang',
    name: 'Cam Vàng Tươi Cắt Lát',
    category: 'topping',
    price: 2000,
    unit: 'phần',
    packSize: 10,
    icon: '🍊',
    pixelColor: '#ff9f43',
    desc: 'Lát cam vàng mọng nước, vị chua ngọt thanh mát tạo tầng hương cho Trà Đào Cam Sả'
  },
  {
    id: 'sa_tuoi',
    name: 'Sả Tươi Đập Dập',
    category: 'topping',
    price: 1500,
    unit: 'phần',
    packSize: 10,
    icon: '🌱',
    pixelColor: '#a8e063',
    desc: 'Nhánh sả tươi đập dập cay the dịu nhẹ, linh hồn không thể thiếu của Trà Đào Cam Sả'
  },
  {
    id: 'suong_sao',
    name: 'Thạch Sương Sáo Thanh Mát',
    category: 'topping',
    price: 2000,
    unit: 'phần',
    packSize: 10,
    icon: '🍮',
    pixelColor: '#1e272e',
    desc: 'Cao thạch đen giải nhiệt cực tốt, mềm mượt tan trên đầu lưỡi'
  },

  // --- VẬT TƯ TIÊU HAO ---
  {
    id: 'ly_nap',
    name: 'Thùng Ly & Màng Dập Nắp',
    category: 'consumable',
    price: 1000,
    unit: 'bộ',
    packSize: 20,
    icon: '🧋',
    pixelColor: '#ff79c6',
    desc: 'Ly nhựa chịu nhiệt in logo HeeHee kèm cuộn màng dập niêm phong'
  }
];

const DEFAULT_INVENTORY = {
  tra_den: 30,
  tra_thai_xanh: 25,
  sua_tuoi: 25,
  tra_lai: 25,
  tra_olong: 25,
  tranchau_den: 30,
  thach_la_dua: 25,
  tranchau_duongden: 25,
  dao_mieng: 20,
  cam_vang: 20,
  sa_tuoi: 20,
  suong_sao: 20,
  ly_nap: 60
};

module.exports = { INGREDIENTS, DEFAULT_INVENTORY };