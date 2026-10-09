/**
 * Room Furnishing & Decoration Catalog
 * Cozy Room / Home for HeeHee
 */

const ROOM_DECORATIONS = {
  giuong_nem_em: {
    id: 'giuong_nem_em',
    name: 'Giường Nệm Cao Su Êm Ái',
    category: 'bed',
    icon: '🛏️',
    price: 1200000,
    currency: 'money',
    cozyPoints: 25,
    effect: 'Giúp HeeHee ngủ sâu giấc, hồi phục thể lực nhanh hơn khi kết ca (+20%)',
    desc: 'Nệm cao su thiên nhiên êm ái, ga trải giường màu trà sữa ấm áp.',
    gridSlot: 'bed',
    render: { type: 'bed', color: '#ffbe76', pillowColor: '#ffffff' }
  },
  sofa_long_cuu: {
    id: 'sofa_long_cuu',
    name: 'Sofa Băng Lông Cừu',
    category: 'sofa',
    icon: '🛋️',
    price: 800000,
    currency: 'money',
    cozyPoints: 18,
    effect: 'Chỗ ngồi đọc sách và uống trà cực chill, tăng cảm hứng công thức (+10%)',
    desc: 'Sofa bọc vải nỉ lông cừu mềm mại, điểm tựa thư giãn sau ca làm dài.',
    gridSlot: 'sofa',
    render: { type: 'sofa', color: '#f8c291' }
  },
  ban_tra_go: {
    id: 'ban_tra_go',
    name: 'Bàn Trà Gỗ Tròn Vintage',
    category: 'table',
    icon: '☕',
    price: 350000,
    currency: 'money',
    cozyPoints: 10,
    effect: 'Bày bình trà hoa lài thơm ngát, tăng điểm thư thái',
    desc: 'Bàn trà nhỏ gọn bằng gỗ sồi vintage đặt cạnh sofa.',
    gridSlot: 'table',
    render: { type: 'table', color: '#e58e26' }
  },
  tv_retro: {
    id: 'tv_retro',
    name: 'Tivi Thủy Tinh Retro',
    category: 'appliance',
    icon: '📺',
    price: 950000,
    currency: 'money',
    cozyPoints: 20,
    effect: 'Bật xem dự báo thời tiết & tin tức khởi nghiệp kinh doanh',
    desc: 'Tivi bóng hình cổ điển có 2 râu ăng-ten, phát hình ảnh sống động.',
    gridSlot: 'tv',
    render: { type: 'tv', color: '#3c6382' }
  },
  ke_sach_go: {
    id: 'ke_sach_go',
    name: 'Kệ Sách Gỗ Nhiều Ngăn',
    category: 'storage',
    icon: '📚',
    price: 600000,
    currency: 'money',
    cozyPoints: 15,
    effect: 'Chứa cẩm nang pha chế, tăng +5% tốc độ phục vụ quầy hôm sau',
    desc: 'Kệ sách nhiều tầng bằng gỗ sồi chứa đầy truyện tranh và sách trà đạo.',
    gridSlot: 'shelf',
    render: { type: 'shelf', color: '#b71540' }
  },
  cay_kim_ngan: {
    id: 'cay_kim_ngan',
    name: 'Chậu Cây Kim Ngân May Mắn',
    category: 'plant',
    icon: '🪴',
    price: 450000,
    currency: 'money',
    cozyPoints: 12,
    effect: 'Hút tài lộc phong thủy, tăng +5% tiền tip nhận được',
    desc: 'Cây kim ngân xanh tươi lọc không khí mang lại may mắn và tiền tài.',
    gridSlot: 'plant',
    render: { type: 'plant', color: '#78e08f' }
  },
  den_ngu_mat_trang: {
    id: 'den_ngu_mat_trang',
    name: 'Đèn Ngủ Mặt Trăng 3D',
    category: 'light',
    icon: '🌕',
    price: 300000,
    currency: 'money',
    cozyPoints: 10,
    effect: 'Ánh sáng vàng ấm dịu xua tan mệt mỏi về đêm',
    desc: 'Quả cầu đèn ngủ mô phỏng mặt trăng phát ánh sáng dịu mắt.',
    gridSlot: 'light',
    render: { type: 'light', color: '#f6b93b' }
  },
  tham_boho: {
    id: 'tham_boho',
    name: 'Thảm Tròn Phong Cách Boho',
    category: 'rug',
    icon: '🧶',
    price: 250000,
    currency: 'money',
    cozyPoints: 8,
    effect: 'Tạo cảm giác ấm áp cho sàn nhà bằng gỗ',
    desc: 'Thảm dệt họa tiết thổ cẩm sắc sảo, êm ái cho đôi bàn chân.',
    gridSlot: 'rug',
    render: { type: 'rug', color: '#e55039' }
  },
  gau_bong_khong_lo: {
    id: 'gau_bong_khong_lo',
    name: 'Gấu Bông Khổng Lồ 1m5',
    category: 'decor',
    icon: '🧸',
    price: 500000,
    currency: 'money',
    cozyPoints: 14,
    effect: 'Ôm ngủ siêu mềm mại, tăng chỉ số hạnh phúc',
    desc: 'Chú gấu bông to béo ngồi một góc phòng đợi chủ nhân về ôm.',
    gridSlot: 'teddy',
    render: { type: 'teddy', color: '#fa983a' }
  },
  may_dia_than: {
    id: 'may_dia_than',
    name: 'Máy Quay Đĩa Than Cổ Điển',
    category: 'audio',
    icon: '📻',
    price: 1100000,
    currency: 'money',
    cozyPoints: 22,
    effect: 'Phát nhạc lofi du dương ru ngủ cực ngon',
    desc: 'Máy phát đĩa than với chiếc kèn đồng cổ kính phát giai điệu hoài niệm.',
    gridSlot: 'gramophone',
    render: { type: 'gramophone', color: '#fad390' }
  },
  tranh_treo_tuong: {
    id: 'tranh_treo_tuong',
    name: 'Tranh Canvas Trà Sữa Art',
    category: 'wall',
    icon: '🖼️',
    price: 200000,
    currency: 'money',
    cozyPoints: 6,
    effect: 'Điểm nhấn nghệ thuật cho bức tường phòng khách',
    desc: 'Tranh vẽ nghệ thuật cốc trà sữa trân châu đầu tiên ngày mở quán.',
    gridSlot: 'art',
    render: { type: 'art', color: '#6a89cc' }
  },
  dem_thu_cung: {
    id: 'dem_thu_cung',
    name: 'Đệm Lông Cho Thú Cưng',
    category: 'pet',
    icon: '🐾',
    price: 400000,
    currency: 'money',
    cozyPoints: 12,
    effect: 'Thú cưng giữ quầy có chỗ ngủ ấm áp bên cạnh bạn',
    desc: 'Đệm tròn bọc lông tuyết mềm mượt cho cún Corgi hoặc Mèo ngủ.',
    gridSlot: 'pet_bed',
    render: { type: 'pet_bed', color: '#82ccdd' }
  },

  // TỦ ĐỒ THỜI TRANG HEEHEE (OUTFITS)
  outfit_barista: {
    id: 'outfit_barista',
    name: 'Đồng Phục Barista Cổ Điển',
    category: 'outfit',
    icon: '☕',
    price: 300000,
    currency: 'money',
    cozyPoints: 15,
    effect: 'Tạp dề barista màu cà phê sữa năng động, tăng +5% tốc độ phục vụ quầy',
    desc: 'Áo sơ mi trắng kết hợp tạp dề nâu cà phê đậm chất pha chế chuyên nghiệp.',
    gridSlot: 'outfit',
    render: {
      type: 'outfit',
      dressColor: '#6F4E37',
      trimColor: '#ffffff',
      apronColor: '#4a2c11',
      collarColor: '#ffffff'
    }
  },
  outfit_lolita_pastel: {
    id: 'outfit_lolita_pastel',
    name: 'Váy Lolita Pastel Ngọt Ngào',
    category: 'outfit',
    icon: '🎀',
    price: 650000,
    currency: 'money',
    cozyPoints: 20,
    effect: 'Xinh xắn đáng yêu đốn tim khách hàng, tăng +10% tiền Tip',
    desc: 'Váy xòe bồng bềnh phối ren màu hồng phấn pastel và tím mộng mơ.',
    gridSlot: 'outfit',
    render: {
      type: 'outfit',
      dressColor: '#ff9ff3',
      trimColor: '#feca57',
      apronColor: '#54a0ff',
      collarColor: '#ffffff'
    }
  },
  outfit_ao_dai_sen: {
    id: 'outfit_ao_dai_sen',
    name: 'Áo Dài Hoa Sen Truyền Thống',
    category: 'outfit',
    icon: '🪷',
    price: 1200000,
    currency: 'money',
    cozyPoints: 30,
    effect: 'Duyên dáng thanh tao đậm chất Việt Nam, tăng +15% danh tiếng quán',
    desc: 'Áo dài lụa tơ tằm thêu hoa sen Tây Hồ tao nhã quý phái.',
    gridSlot: 'outfit',
    render: {
      type: 'outfit',
      dressColor: '#00d2d3',
      trimColor: '#ff9ff3',
      apronColor: '#1dd1a1',
      collarColor: '#feca57'
    }
  },
  outfit_master_chef: {
    id: 'outfit_master_chef',
    name: 'Set Đồ Master Chef Hoàng Gia',
    category: 'outfit',
    icon: '👑',
    price: 2500000,
    currency: 'money',
    cozyPoints: 45,
    effect: 'Khí chất bậc thầy pha chế đẳng cấp quốc tế, tăng +20% giá trị đồ uống',
    desc: 'Áo đầu bếp cao cấp dát viền vàng kim óng ánh của nghệ nhân ẩm thực.',
    gridSlot: 'outfit',
    render: {
      type: 'outfit',
      dressColor: '#222f3e',
      trimColor: '#f1c40f',
      apronColor: '#e67e22',
      collarColor: '#f1c40f'
    }
  }
};

module.exports = {
  ROOM_DECORATIONS
};

