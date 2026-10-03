// Bản đồ thế giới game: khu vực để người chơi xây dựng tài sản
const LOCATIONS = {
  que: {
    id: 'que',
    name: 'Quê Hương',
    icon: '🌾',
    description: 'Gốc quê nhỏ bé bình yên, gió mát và tiếng gà kêu sáng. Rẻ hơn, khách ít nhưng trung thành.',
    unlocked: true,
    priceMultiplier: 0.7,
    customerBonus: 0,
    patienceBonus: 0.15,
    dailyIncomeBonus: 0.1,
    buildableSlots: 3,
    propertyTypes: {
      ngoi_nha: {
        id: 'ngoi_nha',
        name: 'Nhà Gỗ Mộc Mạc',
        icon: '🏠',
        price: 8000000,
        effect: 'Thuê 2 nhân viên phụ giúp pha chế nhanh hơn'
      },
      vuon_trai: {
        id: 'vuon_trai',
        name: 'Vườn Trái Cây',
        icon: '🌳',
        price: 5000000,
        effect: 'Tự trồng trà, giảm 20% chi phí nguyên liệu'
      }
    }
  },
  pho: {
    id: 'pho',
    name: 'Đô Thị',
    icon: '🏙️',
    description: 'Phố phim hoa đèn lung linh, nhưng đất đắt và khách hàng khó tính hơn.',
    unlocked: false,
    unlockRequirement: 'Sở hữu ít nhất 1 tài sản ở quê',
    unlockCost: 15000000,
    priceMultiplier: 2.5,
    customerBonus: 0.5,
    patienceBonus: 0,
    dailyIncomeBonus: 0.5,
    buildableSlots: 5,
    propertyTypes: {
      chung_cu: {
        id: 'chung_cu',
        name: 'Căn Hộ Chung Cư Mini',
        icon: '🏢',
        price: 45000000,
        effect: 'Quan sát trực tiếp khách, tăng 30% doanh thu'
      },
      shop_mini: {
        id: 'shop_mini',
        name: 'Cửa Hàng Nhánh',
        icon: '🏪',
        price: 30000000,
        effect: 'Mở thêm 1 chi nhánh bán offline, thu nhập 1.500.000đ/ngày'
      }
    }
  }
};

// Đồ trang trí cho cả 2 khu vực
const DECORATIONS = {
  que: [
    { id: 'cay_khoi', name: 'Cây Khói Xanh', icon: '🌲', price: 300000, effect: 'Tăng uy tín cho du khách quê +0.05⭐' },
    { id: 'bong_den', name: 'Bóng Đèn Lồng Đỏ', icon: '🏮', price: 250000, effect: 'Trang trí đẹp, khách chụp ảnh check-in' },
    { id: 'xe_lua', name: 'Xe Lửa Đồ Chơi', icon: '🚂', price: 800000, effect: 'Thu hút trẻ em, tăng lượng khách trẻ +15%' },
    { id: 'bong_tho', name: 'Bó Hoa Mặt Trời', icon: '🌻', price: 150000, effect: 'Khách sành điệu khen quán đẹp' }
  ],
  pho: [
    { id: 'neon_biet', name: 'Bảng Neon Trà Sữa', icon: '💡', price: 500000, effect: 'Thu hút khách về đêm +25%' },
    { id: 'loa_bluetooth', name: 'Loa Bluetooth DJ', icon: '🔊', price: 350000, effect: 'Khách nghe nhạc, ở lâu hơn +10% kiên nhẫn' },
    { id: 'bong_thu_pho', name: 'Bó Hoa Thành Phố', icon: '💐', price: 300000, effect: 'Trang trí cho không gian hiện đại' }
  ]
};

module.exports = { LOCATIONS, DECORATIONS };