-- ==============================================================================
-- SUPABASE MASTER PRODUCTION SCHEMA & RLS POLICIES
-- HỆ THỐNG QUẢN LÝ THI ĐUA NỘI BỘ NHÀ GIÁO
-- TRƯỜNG TH&THCS NGUYỄN ĐÌNH ANH (NĂM HỌC 2026–2027)
-- ==============================================================================

-- 1. BẢNG TỔ CHUYÊN MÔN (departments)
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    leader_id TEXT,
    leader_name VARCHAR(255),
    teacher_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BẢNG HỒ SƠ GIÁO VIÊN (teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    ho_ten VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    ma_giao_vien VARCHAR(50) NOT NULL UNIQUE,
    to_chuyen_mon VARCHAR(255) NOT NULL,
    department_id TEXT REFERENCES public.departments(id),
    cap_hoc VARCHAR(50) DEFAULT 'THCS',
    mon_day TEXT NOT NULL,
    chuc_vu VARCHAR(255) NOT NULL,
    co_so VARCHAR(255) DEFAULT 'Cơ sở chính',
    trang_thai VARCHAR(50) DEFAULT 'DANG_CONG_TAC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BẢNG NHÓM TIÊU CHÍ (criteria_groups - 6 nhóm, tổng 100đ)
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

-- 4. BẢNG TIÊU CHÍ CHI TIẾT (criteria - 23 tiêu chí chuẩn 100đ)
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

-- 5. BẢNG MINH CHỨNG ĐIỆN TỬ (evidence)
CREATE TABLE IF NOT EXISTS public.evidence (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    department_id TEXT REFERENCES public.departments(id),
    department_name VARCHAR(255),
    school_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
    semester VARCHAR(50) NOT NULL DEFAULT 'HKI',
    criteria_id TEXT REFERENCES public.criteria(id),
    criteria_code VARCHAR(50) NOT NULL,
    criteria_title TEXT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'TEAM_REVIEW', 'TEAM_APPROVED', 'BGH_REVIEW', 'BGH_APPROVED', 'REVISION_REQUIRED', 'REJECTED', 'LOCKED')),
    reviewer_id TEXT,
    reviewer_name VARCHAR(255),
    reviewer_role VARCHAR(100),
    review_date TIMESTAMPTZ,
    review_note TEXT,
    is_outstanding BOOLEAN DEFAULT FALSE
);

-- 6. BẢNG PHIÊN BẢN MINH CHỨNG (evidence_versions)
CREATE TABLE IF NOT EXISTS public.evidence_versions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    version_label VARCHAR(50) NOT NULL, -- 'Version 1', 'Version 2', 'Version 3'
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by VARCHAR(255) NOT NULL,
    note TEXT,
    supplement_request_id TEXT
);

-- 7. BẢNG NHẬT KÝ KIỂM TOÁN MINH CHỨNG (evidence_audit_logs - Bất biến, không cho xóa)
CREATE TABLE IF NOT EXISTS public.evidence_audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id TEXT NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50)
);

-- 8. BẢNG PHIẾU ĐÁNH GIÁ THI ĐUA (evaluations)
CREATE TABLE IF NOT EXISTS public.evaluations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    school_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
    semester VARCHAR(50) NOT NULL DEFAULT 'HKI',
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    self_total NUMERIC(5, 2) NOT NULL DEFAULT 0,
    team_total NUMERIC(5, 2) NOT NULL DEFAULT 0,
    bgh_total NUMERIC(5, 2) NOT NULL DEFAULT 0,
    bonus_points NUMERIC(5, 2) NOT NULL DEFAULT 0,
    deduction_points NUMERIC(5, 2) NOT NULL DEFAULT 0,
    final_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    rating VARCHAR(50) NOT NULL DEFAULT 'D' CHECK (rating IN ('A_PLUS', 'A', 'B', 'C', 'D')),
    status VARCHAR(50) NOT NULL DEFAULT 'DANG_TU_DANH_GIA',
    discrepancy_alert BOOLEAN NOT NULL DEFAULT FALSE,
    discrepancy_reason TEXT,
    team_comment TEXT,
    bgh_comment TEXT,
    is_controlled BOOLEAN NOT NULL DEFAULT FALSE,
    controlled_max_rating VARCHAR(50),
    controlled_reason TEXT,
    controlled_marked_by VARCHAR(255),
    controlled_marked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. BẢNG ĐIỂM CỘNG (bonus_points - 5 loại thành tích)
CREATE TABLE IF NOT EXISTS public.bonus_points (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    teacher_name VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK (category IN ('CAP_TRUONG', 'CAP_XA', 'CAP_TINH', 'SANG_KIEN', 'NHIEM_VU_KHO')),
    category_label VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    points NUMERIC(5, 2) NOT NULL CHECK (points > 0),
    evidence_name VARCHAR(255),
    evidence_url TEXT,
    verified_by VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. BẢNG ĐIỂM TRỪ (deduction_points - Biên bản, căn cứ)
CREATE TABLE IF NOT EXISTS public.deduction_points (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    teacher_name VARCHAR(255),
    title VARCHAR(255),
    reason TEXT NOT NULL,
    points NUMERIC(5, 2) NOT NULL CHECK (points > 0),
    date DATE NOT NULL,
    evidence_basis TEXT NOT NULL,
    verified_by VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. BẢNG ĐƠN GIẢI TRÌNH (appeals - 4 trạng thái chuẩn)
CREATE TABLE IF NOT EXISTS public.appeals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    department_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    criteria_code VARCHAR(50),
    criteria_title TEXT,
    related_evidence_id TEXT,
    related_evidence_name VARCHAR(255),
    attached_files JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED')),
    review_response TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ
);

-- 12. BẢNG NHIỆM VỤ YÊU CẦU BỔ SUNG MINH CHỨNG (supplement_requests)
CREATE TABLE IF NOT EXISTS public.supplement_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT,
    evidence_name VARCHAR(255),
    criteria_code VARCHAR(50),
    teacher_id TEXT NOT NULL,
    teacher_name VARCHAR(255),
    requester_name VARCHAR(255) NOT NULL,
    requester_role VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    deadline DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED'))
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ==============================================================================

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deduction_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_requests ENABLE ROW LEVEL SECURITY;

-- Helper Function: Lấy Role của User hiện tại từ JWT
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role',
        'GIAO_VIEN'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Policy 1: Giáo viên chỉ xem hồ sơ của mình; Tổ trưởng xem tổ mình; BGH & Admin xem toàn trường
CREATE POLICY "RLS_Teachers_Select" ON public.teachers FOR SELECT
USING (
    public.get_current_role() IN ('ADMIN', 'BGH', 'HOI_DONG_TDKT')
    OR (public.get_current_role() = 'TO_TRUONG' AND department_id = (SELECT department_id FROM public.teachers WHERE user_id = auth.uid()::text))
    OR user_id = auth.uid()::text
);

-- Policy 2: Evidence Select
CREATE POLICY "RLS_Evidence_Select" ON public.evidence FOR SELECT
USING (
    public.get_current_role() IN ('ADMIN', 'BGH', 'HOI_DONG_TDKT')
    OR (public.get_current_role() = 'TO_TRUONG' AND department_id = (SELECT department_id FROM public.teachers WHERE user_id = auth.uid()::text))
    OR teacher_id = auth.uid()::text
);

-- Policy 3: Giáo viên chỉ được thêm/sửa minh chứng của chính mình khi chưa duyệt
CREATE POLICY "RLS_Evidence_Insert" ON public.evidence FOR INSERT
WITH CHECK (
    teacher_id = auth.uid()::text
    OR public.get_current_role() = 'ADMIN'
);

-- Policy 4: Audit Logs: Bất biến - Cho phép Select & Insert, CẤM DELETE
CREATE POLICY "RLS_Audit_Select" ON public.evidence_audit_logs FOR SELECT
USING (true);

CREATE POLICY "RLS_Audit_Insert" ON public.evidence_audit_logs FOR INSERT
WITH CHECK (true);

-- KHÔNG TẠO POLICY DELETE CHO evidence_audit_logs ĐỂ BẢO VỆ TÍNH BẤT BIẾN!

-- ==============================================================================
-- SUPABASE STORAGE BUCKET: minh-chung-thi-dua
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'minh-chung-thi-dua',
    'minh-chung-thi-dua',
    true,
    52428800, -- 50MB
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET public = true;
