/**
 * Franchise Locations & Upgrades Data
 * Hệ thống Chi Nhánh Nhượng Quyền HeeHee Toàn Quốc & Quốc Tế
 */

const FRANCHISE_LOCATIONS = {
  sg_nguyen_hue: {
    id: 'sg_nguyen_hue',
    name: 'Chi Nhánh Sài Gòn',
    location: 'Phố Đi Bộ Nguyễn Huệ, Quận 1',
    cost: 40000000,
    ratePerMinute: 20000,
    maxAccumulated: 2000000,
    shiftBonus: 600000,
    icon: '🏙️',
    color: '#ff7675',
    badge: 'Trung Tâm Sài Gòn',
    desc: 'Vị trí kim cương giữa lòng thành phố mang tên Bác. Hàng ngàn bạn trẻ Gen Z tụ tập mỗi tối, đơn hàng nổ liên tục.'
  },

  dn_cau_rong: {
    id: 'dn_cau_rong',
    name: 'Chi Nhánh Đà Nẵng',
    location: 'Bờ Đông Cầu Rồng, Ven Sông Hàn',
    cost: 75000000,
    ratePerMinute: 40000,
    maxAccumulated: 4000000,
    shiftBonus: 1200000,
    icon: '🌉',
    color: '#74b9ff',
    badge: 'Thành Phố Đáng Sống',
    desc: 'Ngắm Cầu Rồng phun lửa và gió biển mát rượi. Khách du lịch trong nước & quốc tế xếp hàng dài thưởng thức trà sen.'
  },

  tokyo_shibuya: {
    id: 'tokyo_shibuya',
    name: 'Chi Nhánh Tokyo',
    location: 'Ngã Tư Shibuya Crossing, Tokyo',
    cost: 120000000,
    ratePerMinute: 75000,
    maxAccumulated: 7500000,
    shiftBonus: 2500000,
    icon: '🗼',
    color: '#fd79a8',
    badge: 'Thủ Đô Mặt Trời Mọc',
    unlockRecipe: 'matcha_kyoto_dat_bac',
    desc: 'Biểu tượng văn hóa đại chúng toàn cầu! Mở khóa công thức độc quyền: Matcha Uji Kyoto Dát Bạc sang chảnh bậc nhất.'
  },

  seoul_myeongdong: {
    id: 'seoul_myeongdong',
    name: 'Chi Nhánh Seoul',
    location: 'Thánh Địa Mua Sắm Myeongdong, Seoul',
    cost: 180000000,
    ratePerMinute: 120000,
    maxAccumulated: 12000000,
    shiftBonus: 4000000,
    icon: '🏯',
    color: '#a29bfe',
    badge: 'K-Wave Kinh Đô',
    unlockRecipe: 'tra_sam_nui_seoul',
    desc: 'Khu phố thời trang nhộn nhịp bậc nhất xứ sở kim chi. Mở khóa công thức bí truyền: Trà Sữa Sâm Núi Hoàng Gia Seoul!'
  }
};

module.exports = { FRANCHISE_LOCATIONS };

