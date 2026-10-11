-- ==============================================================================
-- MIGRATION: QUẢN LÝ TIÊU CHÍ THI ĐUA GIÁO VIÊN (NĂM HỌC 2026–2027)
-- CƠ CẤU 6 NHÓM TIÊU CHÍ - THANG ĐIỂM CHUẨN 100 ĐIỂM
-- TRƯỜNG TH&THCS NGUYỄN ĐÌNH ANH
-- ==============================================================================

-- 1. BẢNG criteria_groups (Mục 2)
CREATE TABLE IF NOT EXISTS public.criteria_groups (
    id VARCHAR(50) PRIMARY KEY,
    ten_nhom VARCHAR(255) NOT NULL,
    diem_toi_da NUMERIC(5, 2) NOT NULL CHECK (diem_toi_da > 0),
    mo_ta TEXT,
    thu_tu INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.criteria_groups IS 'Danh mục 6 nhóm tiêu chí đánh giá thi đua (Tổng 100 điểm)';

-- 2. BẢNG criteria (Mục 2)
CREATE TABLE IF NOT EXISTS public.criteria (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL REFERENCES public.criteria_groups(id) ON DELETE CASCADE,
    ma_tieu_chi VARCHAR(20) NOT NULL UNIQUE,
    ten_tieu_chi VARCHAR(255) NOT NULL,
    diem_toi_da NUMERIC(5, 2) NOT NULL CHECK (diem_toi_da > 0),
    mo_ta TEXT,
    thu_tu INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.criteria IS 'Danh mục 23 tiêu chí chi tiết đánh giá thi đua nhà giáo';

-- 3. CHỈ MỤC TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_criteria_group_id ON public.criteria(group_id);
CREATE INDEX IF NOT EXISTS idx_criteria_ma_tieu_chi ON public.criteria(ma_tieu_chi);
CREATE INDEX IF NOT EXISTS idx_criteria_is_active ON public.criteria(is_active);

-- 4. KÍCH HOẠT ROW LEVEL SECURITY (RLS) - Mục 2 & Mục 3
ALTER TABLE public.criteria_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;

-- Policy criteria_groups: Mọi người dùng đã xác thực đều được XEM
CREATE POLICY "Authenticated users can read criteria groups"
    ON public.criteria_groups FOR SELECT
    TO authenticated
    USING (true);

-- Policy criteria_groups: Chỉ ADMIN mới được THÊM / SỬA / XÓA cấu trúc
CREATE POLICY "Only admin can modify criteria groups"
    ON public.criteria_groups FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'ADMIN')
    WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Policy criteria: Mọi người dùng đã xác thực đều được XEM
CREATE POLICY "Authenticated users can read criteria"
    ON public.criteria FOR SELECT
    TO authenticated
    USING (true);

-- Policy criteria: Chỉ ADMIN mới được THÊM / SỬA / XÓA / KÍCH HOẠT cấu trúc tiêu chí (Mục 3)
CREATE POLICY "Only admin can modify criteria structure"
    ON public.criteria FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'ADMIN')
    WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ==============================================================================
-- 5. SEED DATA CHO 6 NHÓM TIÊU CHÍ (Mục 1 & Mục 7)
-- ==============================================================================
INSERT INTO public.criteria_groups (id, ten_nhom, diem_toi_da, mo_ta, thu_tu, is_active)
VALUES
    ('group-1', 'Nhóm 1 – Phẩm chất, đạo đức, trách nhiệm', 15.0, 'Đánh giá phẩm chất chính trị, đạo đức nhà giáo, đoàn kết và tinh thần trách nhiệm', 1, true),
    ('group-2', 'Nhóm 2 – Thực hiện nhiệm vụ chuyên môn', 30.0, 'Thực hiện chương trình, hồ sơ chuyên môn, đổi mới PPDH, dự giờ, KTĐG và hỗ trợ học sinh', 2, true),
    ('group-3', 'Nhóm 3 – Chất lượng và hiệu quả giáo dục', 25.0, 'Chỉ tiêu chất lượng bộ môn, sự tiến bộ học sinh, chất lượng giờ dạy và hoạt động ngoài giờ', 3, true),
    ('group-4', 'Nhóm 4 – Kỷ luật, kỷ cương, hồ sơ, tiến độ', 15.0, 'Ngày công, giờ công, nền nếp hội họp, báo cáo và chấp hành phân công điều động', 4, true),
    ('group-5', 'Nhóm 5 – Công tác chủ nhiệm, kiêm nhiệm, phối hợp', 5.0, 'Công tác chủ nhiệm lớp, nhiệm vụ kiêm nhiệm, đoàn thể và phối hợp CMHS', 5, true),
    ('group-6', 'Nhóm 6 – Đổi mới, chuyển đổi số, phong trào, đóng góp', 10.0, 'Ứng dụng CNTT/chuyển đổi số/AI, phong trào thi đua chung và sáng kiến giải pháp', 6, true)
ON CONFLICT (id) DO UPDATE SET
    ten_nhom = EXCLUDED.ten_nhom,
    diem_toi_da = EXCLUDED.diem_toi_da,
    mo_ta = EXCLUDED.mo_ta,
    thu_tu = EXCLUDED.thu_tu,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ==============================================================================
-- 6. SEED DATA CHO 23 TIÊU CHÍ CHI TIẾT (Mục 1)
-- ==============================================================================
INSERT INTO public.criteria (id, group_id, ma_tieu_chi, ten_tieu_chi, diem_toi_da, mo_ta, thu_tu, is_active)
VALUES
    -- Nhóm 1: 15 điểm
    ('c-1-1', 'group-1', '1.1', 'Chấp hành chủ trương, pháp luật', 4.0, 'Chấp hành chủ trương, đường lối của Đảng, chính sách pháp luật Nhà nước và quy chế chuyên môn', 1, true),
    ('c-1-2', 'group-1', '1.2', 'Đạo đức nhà giáo, ứng xử', 4.0, 'Giữ gìn phẩm chất đạo đức nhà giáo, lối sống chuẩn mực, tác phong sư phạm mẫu mực', 2, true),
    ('c-1-3', 'group-1', '1.3', 'Đoàn kết, phối hợp', 3.0, 'Đoàn kết nội bộ, tích cực hỗ trợ đồng nghiệp và phối hợp liên tổ chuyên môn, đoàn thể', 3, true),
    ('c-1-4', 'group-1', '1.4', 'Tinh thần trách nhiệm', 4.0, 'Tận tụy, trách nhiệm cao, chủ động khắc phục khó khăn hoàn thành tốt mọi nhiệm vụ', 4, true),

    -- Nhóm 2: 30 điểm
    ('c-2-1', 'group-2', '2.1', 'Thực hiện chương trình, KHGD', 6.0, 'Thực hiện đúng tiến độ chương trình, kế hoạch giáo dục cá nhân và phân phối thời lượng', 1, true),
    ('c-2-2', 'group-2', '2.2', 'Hồ sơ chuyên môn', 5.0, 'Đầy đủ hồ sơ giáo án theo quy định Điều lệ trường học, soạn bài chu đáo và duyệt đúng hạn', 2, true),
    ('c-2-3', 'group-2', '2.3', 'Đổi mới PPDH và KTĐG', 5.0, 'Đổi mới phương pháp dạy học tích cực, phát triển năng lực; đa dạng hóa kiểm tra đánh giá', 3, true),
    ('c-2-4', 'group-2', '2.4', 'Dự giờ, thao giảng, SHCM', 4.0, 'Thực hiện đủ số tiết dự giờ theo quy định; tham gia thao giảng, sinh hoạt chuyên môn theo NCBH', 4, true),
    ('c-2-5', 'group-2', '2.5', 'Kiểm tra, đánh giá học sinh', 4.0, 'Kiểm tra đánh giá đúng quy chế, cập nhật điểm số và nhận xét khách quan, kịp thời', 5, true),
    ('c-2-6', 'group-2', '2.6', 'Hỗ trợ HS yếu/bồi dưỡng HS', 6.0, 'Có kế hoạch phụ đạo học sinh chưa đạt chuẩn, có học sinh tiến bộ hoặc bồi dưỡng HSG đạt giải', 6, true),

    -- Nhóm 3: 25 điểm
    ('c-3-1', 'group-3', '3.1', 'Kết quả chỉ tiêu chất lượng', 10.0, 'Đạt hoặc vượt chỉ tiêu chất lượng bộ môn đăng ký đầu năm học (tỷ lệ trên TB, khá giỏi)', 1, true),
    ('c-3-2', 'group-3', '3.2', 'Tiến bộ của học sinh', 5.0, 'Học sinh có sự chuyển biến rõ rệt về thái độ, nền nếp, phẩm chất và năng lực học tập', 2, true),
    ('c-3-3', 'group-3', '3.3', 'Chất lượng giờ dạy', 5.0, 'Tiết dạy được tổ chuyên môn và Ban giám hiệu đánh giá, thanh tra xếp loại từ Khá trở lên', 3, true),
    ('c-3-4', 'group-3', '3.4', 'Hoạt động giáo dục ngoài giờ/chuyên môn', 5.0, 'Tổ chức hoặc hướng dẫn học sinh tham gia các hoạt động trải nghiệm, ngoại khóa, CLB, STEM', 4, true),

    -- Nhóm 4: 15 điểm
    ('c-4-1', 'group-4', '4.1', 'Ngày công, giờ công', 5.0, 'Đảm bảo đủ ngày công, giờ công; lên lớp đúng giờ, không đi muộn về sớm, không bỏ giờ', 1, true),
    ('c-4-2', 'group-4', '4.2', 'Thông tin, báo cáo', 4.0, 'Thực hiện chế độ thông tin, báo cáo số liệu, nộp hồ sơ và đề thi đúng thời hạn, chính xác', 2, true),
    ('c-4-3', 'group-4', '4.3', 'Chấp hành phân công', 3.0, 'Chấp hành nghiêm sự phân công nhiệm vụ, dạy thay, coi thi, chấm thi và nhiệm vụ đột xuất', 3, true),
    ('c-4-4', 'group-4', '4.4', 'Hội họp, tác phong, điện thoại', 3.0, 'Tham gia họp đầy đủ, tác phong lịch sự; không sử dụng điện thoại làm việc riêng trên lớp', 4, true),

    -- Nhóm 5: 5 điểm
    ('c-5-1', 'group-5', '5.1', 'Công tác chủ nhiệm', 3.0, 'Quản lý tốt nề nếp lớp học, tỷ lệ chuyên cần cao, không có học sinh vi phạm kỷ luật nặng', 1, true),
    ('c-5-2', 'group-5', '5.2', 'Nhiệm vụ kiêm nhiệm, phối hợp', 2.0, 'Hoàn thành tốt nhiệm vụ kiêm nhiệm (Đội, TTCM...); phối hợp chặt chẽ với CMHS', 2, true),

    -- Nhóm 6: 10 điểm
    ('c-6-1', 'group-6', '6.1', 'CNTT/chuyển đổi số/AI', 5.0, 'Ứng dụng hiệu quả CNTT, học liệu số, LMS và khai thác công cụ AI hỗ trợ giáo dục', 1, true),
    ('c-6-2', 'group-6', '6.2', 'Phong trào, hoạt động chung', 3.0, 'Tích cực tham gia các phong trào, hội thi, văn thể mỹ, từ thiện do trường và ngành phát động', 2, true),
    ('c-6-3', 'group-6', '6.3', 'Sáng kiến/giải pháp', 2.0, 'Có sáng kiến kinh nghiệm (SKKN), giải pháp đổi mới được cấp trường/cấp ngành công nhận', 3, true)
ON CONFLICT (id) DO UPDATE SET
    group_id = EXCLUDED.group_id,
    ma_tieu_chi = EXCLUDED.ma_tieu_chi,
    ten_tieu_chi = EXCLUDED.ten_tieu_chi,
    diem_toi_da = EXCLUDED.diem_toi_da,
    mo_ta = EXCLUDED.mo_ta,
    thu_tu = EXCLUDED.thu_tu,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ==============================================================================
-- 7. KIỂM TRA TỔNG ĐIỂM (MỤC 7)
-- Tổng điểm yêu cầu: 15 + 30 + 25 + 15 + 5 + 10 = 100 ĐIỂM
-- ==============================================================================
DO $$
DECLARE
    v_total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(diem_toi_da), 0) INTO v_total FROM public.criteria WHERE is_active = true;
    IF v_total <> 100.0 THEN
        RAISE EXCEPTION 'LỖI TỔNG ĐIỂM: Tổng điểm các tiêu chí là %, không khớp 100 điểm chuẩn!', v_total;
    ELSE
        RAISE NOTICE 'XÁC NHẬN HỢP LỆ: Tổng điểm 6 nhóm tiêu chí = 100.0 điểm chuẩn!';
    END IF;
END $$;
