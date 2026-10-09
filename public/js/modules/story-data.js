// Narrative & Story Tutorial Script Data for Chapters

export const STORY_DATA = {
  1: {
    title: 'Chương 1: Xe Đẩy Vỉa Hè (Món Nợ 3 Triệu)',
    scenes: [
      {
        avatar: '🧋',
        speaker: 'HeeHee (Cô Chủ Nhỏ)',
        role: 'Khởi nghiệp vỉa hè',
        text: 'Chào bạn! Mình là HeeHee.\n\nSau nhiều năm ấp ủ ước mơ tự tay làm ra những ly trà sữa thơm ngon chuẩn vị nhất phố, mình đã gom góp hết số tiền tiết kiệm ít ỏi để mở tiệm trà sữa trên chiếc xe đẩy nhỏ này!\n\nNhưng đường đời không như là mơ... Để sắm được xe đẩy và bộ đồ nghề inox, mình đã phải vay một khoản tiền lớn!',
        hint: { icon: '🧋', text: 'Chào mừng bạn đến với Tiệm Trà Sữa HeeHee!' }
      },
      {
        avatar: '🕶️',
        speaker: 'Anh Bảnh (Chủ Nợ Khu Phố)',
        role: 'Đầu gấu đòi nợ',
        text: 'Này con bé! Chiếc xe đẩy inox và bộ máy dập nắp này là tao cho mày vay đúng 3.000.000đ tiền mặt!\n\nNhớ kỹ cho tao: Liệu mà cày cuốc bán buôn trả nợ dần. Sau 7 ngày mà chưa trả hết là tao cho đàn em kéo xe đi rã sắt vụn đấy! Đừng trách Anh Bảnh không nể nang!',
        hint: { icon: '⚠️', text: 'Mục tiêu tối thượng: Kiếm đủ tiền trả hết 3.000.000đ nợ cho Anh Bảnh!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp & Anh Lâm',
        role: 'Đồng đội trợ thủ',
        text: 'Chị HeeHee ơi đừng lo! Em là Bé Bắp, em sẽ đứng quầy phụ chị dập nắp ly và ghi vé đơn hàng!\n\nCòn anh là Anh Lâm Shipper, có đơn nào khách đặt mang đi anh sẽ phóng xe Wave ship hỏa tốc! Trà sữa của chị đậm đà thơm béo, nhất định tụi mình sẽ cày đủ tiền trả sạch nợ!',
        hint: { icon: '🤝', text: 'Bé Bắp và Anh Lâm sẽ sát cánh hỗ trợ bạn buôn bán mỗi ngày!' }
      },
      {
        avatar: '📋',
        speaker: 'Bé Bắp (Hướng Dẫn Viên)',
        role: 'Bước 1: Đón Đơn Hàng',
        text: 'Em chỉ chị cách phục vụ khách nha! Khi khách ghé quầy, vé gọi món sẽ xuất hiện:\n\n• 👤 Tên khách & Tiền thu: Khách trả tiền tương ứng với từng món.\n• 🍹 Tên món: Ban đầu tiệm có Trà Sữa Truyền Thống.\n• ⏱️ Thanh kiên nhẫn: Phải giao ly trước khi thanh màu xanh tụt hết kẻo khách giận bỏ đi (-⭐ đánh giá quán)!',
        hint: { icon: '👀', text: 'Bước 1: Luôn quan sát kỹ vé đơn hàng và thanh thời gian chờ của khách!' }
      },
      {
        avatar: '🍵',
        speaker: 'Bé Bắp (Hướng Dẫn Viên)',
        role: 'Bước 2: Quầy Pha Chế',
        text: 'Ngay bên dưới là Quầy Pha Chế:\n\n1. Cốt Trà: Bấm chọn đúng trà khách gọi: Trà Đen, Thái Xanh, Sữa Tươi, Lài, Ô Long.\n2. Đường & Đá: Chọn đúng % đường (0%, 30%, 50%...) và mức đá khách thích!\n3. Topping: Bấm chọn trân châu đen, thạch lá dứa, đường đen... (khách gọi món nào kèm topping đó).',
        hint: { icon: '🧋', text: 'Bước 2: Chọn đúng cốt trà + mức đường đá + topping theo yêu cầu.' }
      },
      {
        avatar: '🍸',
        speaker: 'Bé Bắp (Hướng Dẫn Viên)',
        role: 'Bước 3: Quy Trình 4 Bước Chuẩn Barista',
        text: 'Pha xong các nguyên liệu trong Bình Lắc:\n\n1. Nhấn [1. Lắc Bình 🍸] để hòa quyện cốt trà, đường đá và topping sánh mịn!\n2. Nhấn [2. Rót Cốc 🧋] để đổ trà sữa vào ly mang đi.\n3. Nhấn [3. Dập Nắp 🖲️] niêm phong màng nilon chuyên nghiệp.\n4. Nhấn [GIAO LY (SERVE) ✨] trao tận tay khách hàng!\n\nTing ting! Tiền thanh toán và tiền tip thưởng sẽ cộng ngay vào túi tiệm!',
        hint: { icon: '🍸', text: 'Quy trình 4 bước: 1. Lắc Bình ➔ 2. Rót Cốc ➔ 3. Dập Nắp ➔ 4. Giao Ly!' }
      },
      {
        avatar: '🛒',
        speaker: 'HeeHee (Cô Chủ Nhỏ)',
        role: 'Bước 4: Mở Rộng Quán',
        text: 'Khi có tiền lãi, đừng quên bấm vào [Nâng Cấp]:\n\n• 📜 Mua Công Thức Mới: Mua Hồng Trà Tắc, Thái Xanh, Đường Đen... để khách gọi được nhiều món xịn giá cao hơn!\n• 🐾 Nuôi Thú Cưng: Corgi tăng tip +20%, Mèo Chiêu Tài tăng +15% doanh thu, Capybara giúp khách kiên nhẫn +40%!\n• ⚠️ Cảnh giác kẻ trộm áo đen câu mất thú cưng khi quán đông!',
        hint: { icon: '💡', text: 'Bước 4: Nâng cấp máy móc, mở rộng Menu và nuôi thú cưng để làm giàu nhanh!' }
      },
      {
        avatar: '💰',
        speaker: 'HeeHee (Cô Chủ Nhỏ)',
        role: 'Mục Tiêu Trả Nợ & Lên Chương',
        text: 'Và điều quan trọng nhất: Hãy bấm vào nút [Trả Nợ] bất cứ khi nào có dư tiền mặt!\n\nTrả dần từng khoản 500.000đ hoặc gom đủ 3.000.000đ trả sạch nợ cho Anh Bảnh để xóa sổ nợ, chính thức làm chủ tiệm và MỞ KHÓA CHƯƠNG 2: GÓC HẺM SINH VIÊN!\n\nKhách hàng đầu tiên đang tới rồi, cùng chiến thôi nào!',
        hint: { icon: '🚀', text: 'Chúc bạn buôn may bán đắt và sớm trở thành Vua Trà Sữa!' }
      }
    ]
  },
  2: {
    title: 'Chương 2: Góc Hẻm Sinh Viên (Tự Do Khởi Nghiệp)',
    scenes: [
      {
        avatar: '🕶️',
        speaker: 'Anh Bảnh (Kính Nể)',
        role: 'Thanh lý sổ nợ',
        text: 'Khá lắm con bé! Tao thật không ngờ một đứa chân ướt chân ráo như mày lại trả đủ 3.000.000đ sòng phẳng đúng hẹn thế này!\n\nĐây, giấy nợ tao xé tại chỗ. Chiếc xe đẩy này từ nay chính thức thuộc về mày! Chúc mày buôn may bán đắt, tao đi đây!',
        hint: { icon: '🎉', text: 'Chúc mừng! Đã xóa sạch 3.000.000đ nợ và bước sang Chương 2!' }
      },
      {
        avatar: '🧋',
        speaker: 'HeeHee (Cô Chủ Quán)',
        role: 'Mở rộng thị trường',
        text: 'Yayyy! Chúng ta đã hoàn toàn sạch nợ rồi! Giờ đây mỗi đồng tiền kiếm được đều là lợi nhuận thực sự của chúng mình!\n\nBé Bắp ơi, phụ chị đẩy xe vào Góc Hẻm Sinh Viên cạnh trường đại học nào! Ở đây đông đảo bạn trẻ và sinh viên qua lại suốt ngày đêm!',
        hint: { icon: '🏫', text: 'Chương 2: Góc Hẻm Sinh Viên - Lượng khách đông đảo hơn!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp (Hào Hứng)',
        role: 'Menu đại học',
        text: 'Sinh viên cực mê các món hot trend như Sữa Tươi Trân Châu Đường Đen và Trà Đào Cam Sả chị ơi!\n\nChị mau vào mục [Nâng Cấp] để sắm ngay các công thức mới này nhé! Menu càng phong phú, doanh thu càng bùng nổ!',
        hint: { icon: '🍹', text: 'Mở khóa công thức Sữa Tươi Đường Đen & Trà Đào Cam Sả để đón bão sinh viên!' }
      },
      {
        avatar: '🦹‍♂️',
        speaker: 'Lão Ba (Chủ Quán Trâu Vàng)',
        role: 'Đối thủ cạnh tranh xảo quyệt',
        text: 'Hừm! Lại thêm một con bé hỉ mũi chưa sạch dám kéo xe tới địa bàn Cổng Phụ Bách Khoa à?\n\nQuán \'Trà Sữa Trâu Vàng\' của tao ở đây bao năm nay chưa ngán bất kỳ ai đâu nhé! Liệu hồn mà dọn đi sớm, kẻo mất cả chì lẫn chài!',
        hint: { icon: '⚔️', text: 'Xuất hiện đối thủ cạnh tranh! Cuộc chiến giành khách bắt đầu!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp (Tham Mưu Chiến Thuật)',
        role: 'Mở khóa Thẻ Hãm Hại',
        text: 'Chị HeeHee đừng sợ! Ở Chương 2 này, chúng mình đã có vũ khí mới trong mục [Nâng Cấp - Thẻ Hãm Hại]:\n\n• 📱 Thẻ Bóc Phốt (500k): Thuê TikToker bóc phốt dìm hàng đối thủ khiến khách e ngại tẩy chay (-50% khách & -30% doanh thu trong 10 đợt đơn)!\n• 👮 Thẻ Quản Lý Thị Trường (850k): Báo thanh tra ập vào kiểm tra đột xuất đối thủ (-60% khách & -40% doanh thu trong 10 đợt đơn)!',
        hint: { icon: '🃏', text: 'Mở khóa 2 Thẻ Hãm Hại trong mục [Nâng Cấp] để làm suy yếu đối thủ!' }
      },
      {
        avatar: '🛵',
        speaker: 'Anh Lâm (Shipper Tình Báo)',
        role: 'Tác dụng tức thì',
        text: 'Chỉ cần chọn Thẻ Hãm Hại, nhập Mã Quán đối thủ hoặc chọn nhanh từ danh sách Bạn bè, đòn tấn công sẽ CÓ TÁC DỤNG NGAY LẬP TỨC!\n\nQuán bị dính đòn sẽ vang còi báo động 🚨, khách quay xe bỏ đi rầm rộ!\n\nNhưng nhớ canh chừng, đối thủ cũng có thể trả đũa chúng ta bất cứ lúc nào đấy nhé!',
        hint: { icon: '⚡', text: 'Thẻ có tác dụng tức thì ngay khi kích hoạt lên mã quán đối thủ!' }
      },
      {
        avatar: '🧋',
        speaker: 'HeeHee (Quyết Tâm)',
        role: 'Chinh phục Phố Thương Mại',
        text: 'Tuyệt vời! Chúng ta vừa phục vụ khách tận tâm bằng những ly trà hảo hạng, vừa vận dụng chiến thuật thông minh để bảo vệ thị phần!\n\nMục tiêu lớn nhất của Chương 2: Gom đủ 50.000.000đ để thuê mặt bằng lớn tại Phố Thương Mại sầm uất!\n\nCả đội cùng cố gắng nào!',
        hint: { icon: '🏆', text: 'Tích lũy 50.000.000đ để hoàn thành Chương 2 và tiến vào Phố Thương Mại!' }
      }
    ]
  },
  3: {
    title: 'Chương 3: Trùm Trà Sữa Đô Thị (Flagship Store 2 Tầng)',
    scenes: [
      {
        avatar: '🦹‍♂️',
        speaker: 'Lão Ba (Chủ Quán Trâu Vàng)',
        role: 'Tâm phục khẩu phục',
        text: 'Ta nhận thua rồi, cô bé HeeHee à! Hương vị trà nguyên bản thanh tao và cách phục vụ sạch sẽ, tận tâm của cháu đã hoàn toàn chinh phục sinh viên Bách Khoa!\n\nTừ nay ta xin rửa tay gác kiếm, chuyển giao độc quyền xưởng trân châu nghệ nhân của ta cho tiệm HeeHee! Chúc cháu tiến quân ra Phố Đi Bộ đại thắng!',
        hint: { icon: '🤝', text: 'Lão Ba chịu thua! Toàn bộ khu sinh viên đã công nhận trà sữa HeeHee!' }
      },
      {
        avatar: '🏛️',
        speaker: 'HeeHee (Tổng Giám Đốc)',
        role: 'Khai trương Flagship Store',
        text: 'Tạm biệt chiếc xe đẩy inox vỉa hè đầy kỷ niệm! Chào mừng mọi người đến với FLAGSHIP STORE 2 TẦNG ngay trung tâm Phố Đi Bộ Hà Nội!\n\n• Tầng 1: Quầy bar ốp đá cẩm thạch sang trọng, máy pha Nitro Cold Brew hiện đại!\n• Tầng 2: Không gian thưởng trà ngắm phố, bàn ghế gỗ cao cấp đón khách ngồi lại (Dine-in) thưởng thức!',
        hint: { icon: '✨', text: 'Mặt bằng 2 tầng sang trọng với trải nghiệm khách ngồi tại bàn (Dine-in)!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp (Cửa Hàng Trưởng)',
        role: 'Thăng chức quản lý',
        text: 'Em đã được chị HeeHee thăng chức lên CỬA HÀNG TRƯỞNG rồi nè!\n\nTừ giờ, em sẽ phụ trách TỰ ĐỘNG DẬP NẮP 100% tất cả các ly trà mà chị không cần bấm tay nữa! Tốc độ pha chế x2, phục vụ khách siêu mượt mà!',
        hint: { icon: '⭐', text: 'Cửa Hàng Trưởng Bé Bắp tự động dập nắp ly trà ngay khi rót cốc xong!' }
      },
      {
        avatar: '🛵',
        speaker: 'Anh Lâm (Đội Trưởng Logistics)',
        role: 'Tổng chỉ huy đội xe',
        text: 'Còn anh Lâm giờ là ĐỘI TRƯỞNG LOGISTICS, quản lý cả một đội xe Dream chiến và xe Wave giao hàng phủ khắp các quận!\n\nMỗi đơn shipper giao đi được cộng thêm +35% doanh thu và đơn hàng liên tục đổ về không ngơi tay!',
        hint: { icon: '📦', text: 'Đội Trưởng Logistics Anh Lâm buff thêm +35% doanh thu cho mỗi đơn giao hàng!' }
      },
      {
        avatar: '👑',
        speaker: 'HeeHee (Nhà Sáng Lập)',
        role: 'Menu Thượng Lưu & Nhượng Quyền',
        text: 'Tại Flagship Store, chúng ta mở khóa thực đơn thượng lưu: Trà Sữa Dát Vàng 24K, Nitro Cold Brew, Trà Sen Tây Hồ Thượng Hạng, Kem Khò Bánh Bỏng!\n\nKhách VIP ngồi lại còn hào phóng bo thêm tiền Tip siêu khủng từ 15k - 30k mỗi ly!\n\nMục tiêu tiếp theo: Tích lũy 200.000.000đ để tiến tới Chương 4 - Nhượng quyền toàn cầu!',
        hint: { icon: '🚀', text: 'Khai phá thực đơn thượng lưu, thu tiền tip Dine-In và chuẩn bị cho Đế Chế Nhượng Quyền!' }
      }
    ]
  }
};

