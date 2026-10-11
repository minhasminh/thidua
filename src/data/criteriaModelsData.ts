import { CriteriaGroupModel, CriteriaModel } from '../types';

export const INITIAL_CRITERIA_GROUPS: CriteriaGroupModel[] = [
  {
    id: 'group-1',
    ten_nhom: 'Nhóm 1 – Phẩm chất, đạo đức, trách nhiệm',
    diem_toi_da: 15,
    mo_ta: 'Đánh giá việc chấp hành chủ trương pháp luật, đạo đức nhà giáo, đoàn kết và tinh thần trách nhiệm',
    thu_tu: 1,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'group-2',
    ten_nhom: 'Nhóm 2 – Thực hiện nhiệm vụ chuyên môn',
    diem_toi_da: 30,
    mo_ta: 'Thực hiện chương trình KHGD, hồ sơ chuyên môn, đổi mới PPDH, dự giờ, KTĐG và phụ đạo/bồi dưỡng học sinh',
    thu_tu: 2,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'group-3',
    ten_nhom: 'Nhóm 3 – Chất lượng và hiệu quả giáo dục',
    diem_toi_da: 25,
    mo_ta: 'Kết quả chỉ tiêu chất lượng bộ môn, sự tiến bộ học sinh, chất lượng giờ dạy và hoạt động ngoài giờ',
    thu_tu: 3,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'group-4',
    ten_nhom: 'Nhóm 4 – Kỷ luật, kỷ cương, hồ sơ, tiến độ',
    diem_toi_da: 15,
    mo_ta: 'Ngày công, giờ công, nền nếp hội họp, báo cáo và chấp hành phân công điều động của nhà trường',
    thu_tu: 4,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'group-5',
    ten_nhom: 'Nhóm 5 – Công tác chủ nhiệm, kiêm nhiệm, phối hợp',
    diem_toi_da: 5,
    mo_ta: 'Công tác giáo viên chủ nhiệm lớp, nhiệm vụ kiêm nhiệm, đoàn thể và phối hợp với cha mẹ học sinh',
    thu_tu: 5,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'group-6',
    ten_nhom: 'Nhóm 6 – Đổi mới, chuyển đổi số, phong trào, đóng góp',
    diem_toi_da: 10,
    mo_ta: 'Ứng dụng CNTT/chuyển đổi số/AI, phong trào thi đua chung và sáng kiến giải pháp được công nhận',
    thu_tu: 6,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  }
];

// Seed 23 tiêu chí chuẩn xác theo Mục 1
export const INITIAL_CRITERIA: CriteriaModel[] = [
  // --- NHÓM 1: 15 ĐIỂM ---
  {
    id: 'c-1-1',
    group_id: 'group-1',
    ma_tieu_chi: '1.1',
    ten_tieu_chi: 'Chấp hành chủ trương, pháp luật',
    diem_toi_da: 4,
    mo_ta: 'Chấp hành chủ trương, chính sách của Đảng, pháp luật của Nhà nước và quy chế chuyên môn ngành Giáo dục',
    thu_tu: 1,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-1-2',
    group_id: 'group-1',
    ma_tieu_chi: '1.2',
    ten_tieu_chi: 'Đạo đức nhà giáo, ứng xử',
    diem_toi_da: 4,
    mo_ta: 'Giữ gìn phẩm chất đạo đức nhà giáo, lối sống mẫu mực, chuẩn mực văn hóa ứng xử sư phạm',
    thu_tu: 2,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-1-3',
    group_id: 'group-1',
    ma_tieu_chi: '1.3',
    ten_tieu_chi: 'Đoàn kết, phối hợp',
    diem_toi_da: 3,
    mo_ta: 'Xây dựng tinh thần đoàn kết nội bộ, tích cực hỗ trợ đồng nghiệp và phối hợp liên tổ chuyên môn',
    thu_tu: 3,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-1-4',
    group_id: 'group-1',
    ma_tieu_chi: '1.4',
    ten_tieu_chi: 'Tinh thần trách nhiệm',
    diem_toi_da: 4,
    mo_ta: 'Tận tụy, có tinh thần trách nhiệm cao, chủ động khắc phục khó khăn hoàn thành tốt nhiệm vụ được giao',
    thu_tu: 4,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },

  // --- NHÓM 2: 30 ĐIỂM ---
  {
    id: 'c-2-1',
    group_id: 'group-2',
    ma_tieu_chi: '2.1',
    ten_tieu_chi: 'Thực hiện chương trình, KHGD',
    diem_toi_da: 6,
    mo_ta: 'Dạy đúng, đủ chương trình, kế hoạch giáo dục cá nhân và phân phối thời lượng theo quy định Bộ GD&ĐT',
    thu_tu: 1,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-2-2',
    group_id: 'group-2',
    ma_tieu_chi: '2.2',
    ten_tieu_chi: 'Hồ sơ chuyên môn',
    diem_toi_da: 5,
    mo_ta: 'Đầy đủ giáo án, sổ sách chuyên môn theo quy định điều lệ trường học, soạn bài chu đáo và duyệt đúng hạn',
    thu_tu: 2,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-2-3',
    group_id: 'group-2',
    ma_tieu_chi: '2.3',
    ten_tieu_chi: 'Đổi mới PPDH và KTĐG',
    diem_toi_da: 5,
    mo_ta: 'Áp dụng phương pháp dạy học tích cực phát triển năng lực học sinh; đa dạng hóa hình thức kiểm tra đánh giá',
    thu_tu: 3,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-2-4',
    group_id: 'group-2',
    ma_tieu_chi: '2.4',
    ten_tieu_chi: 'Dự giờ, thao giảng, SHCM',
    diem_toi_da: 4,
    mo_ta: 'Thực hiện đủ số tiết dự giờ theo quy định; tham gia thao giảng, sinh hoạt chuyên môn theo nghiên cứu bài học',
    thu_tu: 4,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-2-5',
    group_id: 'group-2',
    ma_tieu_chi: '2.5',
    ten_tieu_chi: 'Kiểm tra, đánh giá học sinh',
    diem_toi_da: 4,
    mo_ta: 'Kiểm tra, đánh giá học sinh đúng quy chế, cập nhật điểm số và nhận xét khách quan, kịp thời trên hệ thống',
    thu_tu: 5,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-2-6',
    group_id: 'group-2',
    ma_tieu_chi: '2.6',
    ten_tieu_chi: 'Hỗ trợ HS yếu/bồi dưỡng HS',
    diem_toi_da: 6,
    mo_ta: 'Có kế hoạch và triển khai phụ đạo học sinh chưa đạt chuẩn, có học sinh tiến bộ hoặc bồi dưỡng HSG đạt kết quả',
    thu_tu: 6,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },

  // --- NHÓM 3: 25 ĐIỂM ---
  {
    id: 'c-3-1',
    group_id: 'group-3',
    ma_tieu_chi: '3.1',
    ten_tieu_chi: 'Kết quả chỉ tiêu chất lượng',
    diem_toi_da: 10,
    mo_ta: 'Đạt hoặc vượt chỉ tiêu chất lượng bộ môn đăng ký đầu năm học (tỷ lệ trên trung bình, tỷ lệ khá giỏi)',
    thu_tu: 1,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-3-2',
    group_id: 'group-3',
    ma_tieu_chi: '3.2',
    ten_tieu_chi: 'Tiến bộ của học sinh',
    diem_toi_da: 5,
    mo_ta: 'Học sinh có sự chuyển biến tích cực rõ nét về thái độ, nền nếp, phẩm chất và năng lực học tập',
    thu_tu: 2,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-3-3',
    group_id: 'group-3',
    ma_tieu_chi: '3.3',
    ten_tieu_chi: 'Chất lượng giờ dạy',
    diem_toi_da: 5,
    mo_ta: 'Giờ dạy được tổ chuyên môn và Ban giám hiệu đánh giá, thanh tra xếp loại từ Khá trở lên (ưu tiên loại Tốt)',
    thu_tu: 3,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-3-4',
    group_id: 'group-3',
    ma_tieu_chi: '3.4',
    ten_tieu_chi: 'Hoạt động giáo dục ngoài giờ/chuyên môn',
    diem_toi_da: 5,
    mo_ta: 'Tổ chức hoặc hướng dẫn học sinh tham gia các hoạt động ngoại khóa, câu lạc bộ, ngày hội STEM, trải nghiệm sáng tạo',
    thu_tu: 4,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },

  // --- NHÓM 4: 15 ĐIỂM ---
  {
    id: 'c-4-1',
    group_id: 'group-4',
    ma_tieu_chi: '4.1',
    ten_tieu_chi: 'Ngày công, giờ công',
    diem_toi_da: 5,
    mo_ta: 'Đảm bảo đủ ngày công, giờ công; lên lớp đúng giờ, không đi muộn về sớm, không tự ý bỏ giờ hoặc đổi giờ',
    thu_tu: 1,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-4-2',
    group_id: 'group-4',
    ma_tieu_chi: '4.2',
    ten_tieu_chi: 'Thông tin, báo cáo',
    diem_toi_da: 4,
    mo_ta: 'Thực hiện chế độ thông tin, báo cáo số liệu, nộp đề kiểm tra, hồ sơ đúng thời hạn và chính xác',
    thu_tu: 2,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-4-3',
    group_id: 'group-4',
    ma_tieu_chi: '4.3',
    ten_tieu_chi: 'Chấp hành phân công',
    diem_toi_da: 3,
    mo_ta: 'Chấp hành nghiêm sự phân công nhiệm vụ, dạy thay, coi thi, chấm thi và các nhiệm vụ đột xuất của nhà trường',
    thu_tu: 3,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-4-4',
    group_id: 'group-4',
    ma_tieu_chi: '4.4',
    ten_tieu_chi: 'Hội họp, tác phong, điện thoại',
    diem_toi_da: 3,
    mo_ta: 'Tham gia họp đầy đủ, đúng giờ; tác phong trang nhã; không sử dụng điện thoại làm việc riêng trong giờ giảng',
    thu_tu: 4,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },

  // --- NHÓM 5: 5 ĐIỂM ---
  {
    id: 'c-5-1',
    group_id: 'group-5',
    ma_tieu_chi: '5.1',
    ten_tieu_chi: 'Công tác chủ nhiệm',
    diem_toi_da: 3,
    mo_ta: 'Quản lý tốt nề nếp lớp học, tỷ lệ chuyên cần cao, xây dựng tập thể lớp tiến bộ, không có học sinh vi phạm nghiêm trọng',
    thu_tu: 1,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-5-2',
    group_id: 'group-5',
    ma_tieu_chi: '5.2',
    ten_tieu_chi: 'Nhiệm vụ kiêm nhiệm, phối hợp',
    diem_toi_da: 2,
    mo_ta: 'Hoàn thành tốt công tác kiêm nhiệm (Đội, TTCM, TPCM...); phối hợp chặt chẽ với cha mẹ học sinh',
    thu_tu: 2,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },

  // --- NHÓM 6: 10 ĐIỂM ---
  {
    id: 'c-6-1',
    group_id: 'group-6',
    ma_tieu_chi: '6.1',
    ten_tieu_chi: 'CNTT/chuyển đổi số/AI',
    diem_toi_da: 5,
    mo_ta: 'Ứng dụng hiệu quả công nghệ thông tin, bài giảng điện tử, phần mềm quản lý học tập (LMS) và khai thác AI giáo dục',
    thu_tu: 1,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-6-2',
    group_id: 'group-6',
    ma_tieu_chi: '6.2',
    ten_tieu_chi: 'Phong trào, hoạt động chung',
    diem_toi_da: 3,
    mo_ta: 'Tích cực tham gia các hội thi, giải thể thao, văn nghệ, hoạt động xã hội, nhân đạo do ngành và trường phát động',
    thu_tu: 2,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'c-6-3',
    group_id: 'group-6',
    ma_tieu_chi: '6.3',
    ten_tieu_chi: 'Sáng kiến/giải pháp',
    diem_toi_da: 2,
    mo_ta: 'Có sáng kiến kinh nghiệm (SKKN), giải pháp đổi mới được cấp trường/cấp ngành chấm đạt và ứng dụng thực tiễn',
    thu_tu: 3,
    is_active: true,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  }
];

export const TOTAL_EXPECTED_SCORE = 100;
