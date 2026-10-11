import { CriteriaGroup } from '../types';

export const CRITERIA_GROUPS: CriteriaGroup[] = [
  {
    id: 'group-1',
    order: 1,
    name: 'NHÓM 1 – PHẨM CHẤT, ĐẠO ĐỨC, TRÁCH NHIỆM',
    maxScore: 15,
    description: 'Đánh giá việc chấp hành chủ trương, đạo đức nghề nghiệp, tinh thần đoàn kết và trách nhiệm trong công việc',
    criteria: [
      {
        id: 'c-1-1',
        code: '1.1',
        groupId: 'group-1',
        title: 'Chấp hành chủ trương, chính sách, pháp luật của Đảng, Nhà nước và ngành',
        maxScore: 4,
        description: 'Chấp hành nghiêm đường lối, nghị quyết của Đảng, pháp luật của Nhà nước; quy chế chuyên môn của Bộ GD&ĐT, Sở GD&ĐT, Phòng GD&ĐT và nội quy nhà trường.',
        evidenceRequirements: ['Biên bản đánh giá viên chức', 'Minh chứng không vi phạm quy định', 'Bản cam kết đầu năm']
      },
      {
        id: 'c-1-2',
        code: '1.2',
        groupId: 'group-1',
        title: 'Đạo đức nhà giáo, lối sống, quy tắc ứng xử',
        maxScore: 4,
        description: 'Mẫu mực trong quan hệ với đồng nghiệp, học sinh, phụ huynh; giữ gìn danh dự nhà giáo; không xúc phạm danh dự, thân thể học sinh, không vi phạm dạy thêm học thêm.',
        evidenceRequirements: ['Phiếu đánh giá chuẩn nghề nghiệp', 'Ý kiến phụ huynh/học sinh', 'Nhận xét tổ chuyên môn']
      },
      {
        id: 'c-1-3',
        code: '1.3',
        groupId: 'group-1',
        title: 'Đoàn kết, phối hợp công tác',
        maxScore: 3,
        description: 'Tích cực xây dựng tập thể sư phạm đoàn kết, hỗ trợ đồng nghiệp trong chuyên môn và đời sống; phối hợp nhịp nhàng giữa các bộ phận, đoàn thể trong nhà trường.',
        evidenceRequirements: ['Biên bản sinh hoạt tổ chuyên môn', 'Minh chứng phối hợp liên môn/đoàn thể']
      },
      {
        id: 'c-1-4',
        code: '1.4',
        groupId: 'group-1',
        title: 'Tinh thần trách nhiệm, tâm huyết với nghề',
        maxScore: 4,
        description: 'Chủ động, tận tụy với công việc được giao; khắc phục khó khăn hoàn thành tốt nhiệm vụ giảng dạy và giáo dục học sinh.',
        evidenceRequirements: ['Sổ theo dõi tiến độ công việc', 'Báo cáo tổng kết đợt thi đua']
      }
    ]
  },
  {
    id: 'group-2',
    order: 2,
    name: 'NHÓM 2 – THỰC HIỆN NHIỆM VỤ CHUYÊN MÔN',
    maxScore: 30,
    description: 'Thực hiện chương trình, hồ sơ sổ sách, đổi mới PPDH, dự giờ, KTĐG và bồi dưỡng học sinh',
    criteria: [
      {
        id: 'c-2-1',
        code: '2.1',
        groupId: 'group-2',
        title: 'Thực hiện chương trình, kế hoạch giáo dục',
        maxScore: 6,
        description: 'Đảm bảo tiến độ chương trình theo phân phối thời lượng môn học; dạy đúng, dạy đủ các tiết học và hoạt động giáo dục theo quy định.',
        evidenceRequirements: ['Sổ ghi đầu bài điện tử', 'Kế hoạch giáo dục cá nhân (KHGD)']
      },
      {
        id: 'c-2-2',
        code: '2.2',
        groupId: 'group-2',
        title: 'Hồ sơ chuyên môn, giáo án bài dạy',
        maxScore: 5,
        description: 'Đầy đủ các loại hồ sơ theo quy định Điều lệ trường THCS và Thông tư hiện hành; soạn giáo án chu đáo, phê duyệt đúng hạn.',
        evidenceRequirements: ['Link Google Drive / Thư mục Giáo án điện tử', 'Biên bản kiểm tra hồ sơ định kỳ']
      },
      {
        id: 'c-2-3',
        code: '2.3',
        groupId: 'group-2',
        title: 'Đổi mới phương pháp dạy học (PPDH) và kiểm tra đánh giá (KTĐG)',
        maxScore: 5,
        description: 'Áp dụng dạy học tích cực, phát triển phẩm chất năng lực học sinh; đa dạng hóa hình thức đánh giá thường xuyên và định kỳ.',
        evidenceRequirements: ['Kế hoạch bài dạy theo CV 5512', 'Phiếu học tập, ma trận & bảng đặc tả đề kiểm tra']
      },
      {
        id: 'c-2-4',
        code: '2.4',
        groupId: 'group-2',
        title: 'Dự giờ, thao giảng, sinh hoạt chuyên môn (SHCM)',
        maxScore: 4,
        description: 'Thực hiện đủ số tiết dự giờ theo quy định; tích cực tham gia thao giảng, sinh hoạt chuyên môn theo nghiên cứu bài học.',
        evidenceRequirements: ['Sổ dự giờ điện tử', 'Biên bản sinh hoạt chuyên môn tổ / nhóm']
      },
      {
        id: 'c-2-5',
        code: '2.5',
        groupId: 'group-2',
        title: 'Kiểm tra, đánh giá học sinh đúng quy chế',
        maxScore: 4,
        description: 'Cập nhật điểm số trên hệ thống vnEdu/Cơ sở dữ liệu ngành đúng tiến độ; nhận xét học sinh kịp thời, chính xác, khách quan.',
        evidenceRequirements: ['Ảnh chụp tiến độ nhập điểm phần mềm quản lý', 'Sổ theo dõi đánh giá học sinh']
      },
      {
        id: 'c-2-6',
        code: '2.6',
        groupId: 'group-2',
        title: 'Hỗ trợ học sinh yếu kém / Bồi dưỡng học sinh giỏi',
        maxScore: 6,
        description: 'Có kế hoạch và thực hiện phụ đạo học sinh chưa đạt chuẩn, có học sinh tiến bộ rõ rệt hoặc bồi dưỡng HSG đạt kết quả.',
        evidenceRequirements: ['Kế hoạch phụ đạo/bồi dưỡng', 'Danh sách và bảng điểm so sánh trước - sau']
      }
    ]
  },
  {
    id: 'group-3',
    order: 3,
    name: 'NHÓM 3 – CHẤT LƯỢNG VÀ HIỆU QUẢ GIÁO DỤC',
    maxScore: 25,
    description: 'Chỉ tiêu chất lượng bộ môn, sự tiến bộ học sinh, chất lượng tiết dạy và hoạt động ngoài giờ',
    criteria: [
      {
        id: 'c-3-1',
        code: '3.1',
        groupId: 'group-3',
        title: 'Kết quả chỉ tiêu chất lượng bộ môn',
        maxScore: 10,
        description: 'Đạt hoặc vượt chỉ tiêu chất lượng bộ môn đăng ký đầu năm học (tỷ lệ trên trung bình, tỷ lệ khá giỏi).',
        evidenceRequirements: ['Bảng tổng hợp chất lượng bộ môn cuối kỳ/năm', 'Báo cáo đối sánh kết quả chỉ tiêu']
      },
      {
        id: 'c-3-2',
        code: '3.2',
        groupId: 'group-3',
        title: 'Tiến bộ của học sinh về phẩm chất và năng lực',
        maxScore: 5,
        description: 'Học sinh có sự chuyển biến tích cực trong học tập, thái độ và kỹ năng sống so với đầu năm học.',
        evidenceRequirements: ['Phiếu nhận xét cá nhân học sinh', 'Sản phẩm minh chứng sự tiến bộ của HS']
      },
      {
        id: 'c-3-3',
        code: '3.3',
        groupId: 'group-3',
        title: 'Chất lượng giờ dạy qua kiểm tra, thanh tra',
        maxScore: 5,
        description: 'Các tiết dạy được tổ chuyên môn và Ban giám hiệu đánh giá từ loại Khá trở lên (ưu tiên loại Tốt).',
        evidenceRequirements: ['Phiếu đánh giá tiết dạy của Tổ/BGH', 'Biên bản kiểm tra nội bộ']
      },
      {
        id: 'c-3-4',
        code: '3.4',
        groupId: 'group-3',
        title: 'Hoạt động giáo dục ngoài giờ lên lớp / Phong trào bộ môn',
        maxScore: 5,
        description: 'Tổ chức hoặc hướng dẫn học sinh tham gia các hoạt động trải nghiệm, CLB bộ môn, ngày hội STEM, ngoại khóa.',
        evidenceRequirements: ['Kế hoạch tổ chức chuyên đề/CLB', 'Hình ảnh/Video sản phẩm hoạt động ngoài giờ']
      }
    ]
  },
  {
    id: 'group-4',
    order: 4,
    name: 'NHÓM 4 – KỶ LUẬT, KỶ CƯƠNG, HỒ SƠ, TIẾN ĐỘ',
    maxScore: 15,
    description: 'Ngày công, giờ công, nền nếp hội họp, báo cáo và chấp hành kỷ cương',
    criteria: [
      {
        id: 'c-4-1',
        code: '4.1',
        groupId: 'group-4',
        title: 'Ngày công, giờ công, lên lớp đúng giờ',
        maxScore: 5,
        description: 'Đảm bảo đủ ngày công, giờ công theo lịch; không đi muộn về sớm, không bỏ giờ, không tùy tiện đổi giờ khi chưa báo cáo.',
        evidenceRequirements: ['Sổ chấm công điện tử', 'Báo cáo trực tuần/theo dõi nề nếp']
      },
      {
        id: 'c-4-2',
        code: '4.2',
        groupId: 'group-4',
        title: 'Thông tin, báo cáo và nộp hồ sơ đúng thời hạn',
        maxScore: 4,
        description: 'Thực hiện chế độ báo cáo số liệu, nộp các loại hồ sơ, đề kiểm tra đúng quy định về thời gian và chất lượng.',
        evidenceRequirements: ['Nhật ký nộp báo cáo trên hệ thống', 'Xác nhận của văn phòng/chuyên môn']
      },
      {
        id: 'c-4-3',
        code: '4.3',
        groupId: 'group-4',
        title: 'Chấp hành sự phân công, điều động',
        maxScore: 3,
        description: 'Chấp hành nghiêm túc sự phân công nhiệm vụ, dạy thay, coi thi, chấm thi, các nhiệm vụ đột xuất của nhà trường.',
        evidenceRequirements: ['Lịch phân công coi thi/chấm thi', 'Phiếu phân công dạy thay/tăng cường']
      },
      {
        id: 'c-4-4',
        code: '4.4',
        groupId: 'group-4',
        title: 'Hội họp, tác phong sư phạm, sử dụng điện thoại',
        maxScore: 3,
        description: 'Tham gia đầy đủ các buổi hội họp, sinh hoạt; trang phục lịch sự, đúng quy định; không sử dụng điện thoại vào việc riêng khi lên lớp.',
        evidenceRequirements: ['Biên bản điểm danh họp hội đồng/CĐ', 'Sổ ghi nhận tác phong của Ban thi đua']
      }
    ]
  },
  {
    id: 'group-5',
    order: 5,
    name: 'NHÓM 5 – CÔNG TÁC CHỦ NHIỆM, KIÊM NHIỆM, PHỐI HỢP',
    maxScore: 5,
    description: 'Công tác GVCN, đoàn thể và phối hợp với ban đại diện cha mẹ học sinh',
    criteria: [
      {
        id: 'c-5-1',
        code: '5.1',
        groupId: 'group-5',
        title: 'Công tác chủ nhiệm lớp (hoặc nhiệm vụ tương đương)',
        maxScore: 3,
        description: 'Quản lý tốt nề nếp lớp học; tỷ lệ chuyên cần cao; không có học sinh vi phạm kỷ luật nghiêm trọng; xây dựng tập thể lớp tiến bộ.',
        evidenceRequirements: ['Sổ chủ nhiệm lớp', 'Biên bản họp phụ huynh các kỳ', 'Bảng xếp loại thi đua tuần/tháng của lớp']
      },
      {
        id: 'c-5-2',
        code: '5.2',
        groupId: 'group-5',
        title: 'Nhiệm vụ kiêm nhiệm, công tác đoàn thể, phối hợp',
        maxScore: 2,
        description: 'Hoàn thành tốt các nhiệm vụ kiêm nhiệm (Đoàn - Đội, TTCM, TPCM...); phối hợp chặt chẽ với CMHS và địa phương.',
        evidenceRequirements: ['Báo cáo tổng kết công tác đoàn thể/kiêm nhiệm', 'Minh chứng phối hợp với CMHS']
      }
    ]
  },
  {
    id: 'group-6',
    order: 6,
    name: 'NHÓM 6 – ĐỔI MỚI, CHUYỂN ĐỔI SỐ, PHONG TRÀO, ĐÓNG GÓP',
    maxScore: 10,
    description: 'Ứng dụng CNTT/AI, phong trào thi đua và sáng kiến kinh nghiệm',
    criteria: [
      {
        id: 'c-6-1',
        code: '6.1',
        groupId: 'group-6',
        title: 'Ứng dụng CNTT, chuyển đổi số, khai thác AI trong giáo dục',
        maxScore: 5,
        description: 'Ứng dụng thành thạo phần mềm quản lý học tập (LMS), học liệu số, khai thác công cụ AI hỗ trợ thiết kế bài giảng và kiểm tra đánh giá.',
        evidenceRequirements: ['Sản phẩm bài giảng tương tác/học liệu số', 'Link bài giảng E-learning/AI đã triển khai']
      },
      {
        id: 'c-6-2',
        code: '6.2',
        groupId: 'group-6',
        title: 'Tham gia phong trào, hoạt động chung của trường và ngành',
        maxScore: 3,
        description: 'Nhiệt tình tham gia các hội thi, giải thể thao, văn nghệ, hoạt động từ thiện, đền ơn đáp nghĩa do trường và cấp trên phát động.',
        evidenceRequirements: ['Giấy chứng nhận tham gia hội thi/giải thưởng', 'Hình ảnh/Danh sách xác nhận đóng góp phong trào']
      },
      {
        id: 'c-6-3',
        code: '6.3',
        groupId: 'group-6',
        title: 'Sáng kiến kinh nghiệm, giải pháp hữu ích được công nhận',
        maxScore: 2,
        description: 'Có sáng kiến kinh nghiệm (SKKN) hoặc giải pháp đổi mới được cấp trường/cấp ngành chấm đạt và ứng dụng hiệu quả.',
        evidenceRequirements: ['Quyết định công nhận SKKN', 'Báo cáo tóm tắt sáng kiến/giải pháp đổi mới']
      }
    ]
  }
];

export const TOTAL_MAX_SCORE = 100;
