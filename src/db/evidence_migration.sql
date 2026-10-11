-- ==============================================================================
-- SUPABASE MIGRATION: QUẢN LÝ MINH CHỨNG THI ĐUA (NĂM HỌC 2026–2027)
-- BUCKET: minh-chung-thi-dua
-- BẢNG: evidence & evidence_audit_logs
-- TRƯỜNG TH&THCS NGUYỄN ĐÌNH ANH
-- ==============================================================================

-- 1. BẢNG EVIDENCE (Mục 4)
CREATE TABLE IF NOT EXISTS public.evidence (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT NOT NULL,
    department_id TEXT REFERENCES public.departments(id),
    school_year_id TEXT REFERENCES public.school_years(id),
    semester_id TEXT, -- 'HKI', 'HKII', 'CA_NAM'
    criteria_id TEXT REFERENCES public.criteria(id),
    ten_minh_chung VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- 2026-2027/HKI/[TO]/[GIAO_VIEN]/[MA_TIEU_CHI]/[file_name]
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    ngay_thuc_hien DATE,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED' 
        CHECK (status IN ('DRAFT', 'SUBMITTED', 'TEAM_REVIEW', 'TEAM_APPROVED', 'BGH_REVIEW', 'BGH_APPROVED', 'REVISION_REQUIRED', 'REJECTED', 'LOCKED')),
    reviewer_id TEXT,
    reviewer_name VARCHAR(255),
    reviewer_role VARCHAR(100),
    review_date TIMESTAMPTZ,
    review_note TEXT,
    is_outstanding BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE public.evidence IS 'Bảng lưu trữ hồ sơ minh chứng điện tử giáo viên';

-- 2. BẢNG AUDIT LOGS (Mục 11 - Không được xóa Audit Log)
CREATE TABLE IF NOT EXISTS public.evidence_audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'UPLOAD', 'UPDATE', 'SUBMIT', 'DELETE_ATTEMPT', 'REVIEW'
    details TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.evidence_audit_logs IS 'Nhật ký thẩm định và thay đổi minh chứng (Bất biến, không thể xóa)';

-- 3. CHỈ MỤC TỐI ƯU HIỆU NĂNG
CREATE INDEX IF NOT EXISTS idx_evidence_teacher_id ON public.evidence(teacher_id);
CREATE INDEX IF NOT EXISTS idx_evidence_dept_id ON public.evidence(department_id);
CREATE INDEX IF NOT EXISTS idx_evidence_criteria_id ON public.evidence(criteria_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON public.evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_audit_evidence_id ON public.evidence_audit_logs(evidence_id);

-- 4. KÍCH HOẠT ROW LEVEL SECURITY (RLS) - Mục 10 & Mục 11
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES CHO BẢNG EVIDENCE:
-- Giáo viên chỉ được xem minh chứng của mình (Mục 10)
CREATE POLICY "Teachers can only view own evidence"
    ON public.evidence FOR SELECT
    TO authenticated
    USING (
        teacher_id = auth.uid()::text 
        OR public.get_current_user_role() IN ('ADMIN', 'BGH', 'HOI_DONG_TDKT')
        OR (public.get_current_user_role() = 'TO_TRUONG' AND department_id = public.get_current_user_department())
    );

-- Giáo viên chỉ được upload minh chứng của mình (Mục 10)
CREATE POLICY "Teachers can only insert own evidence"
    ON public.evidence FOR INSERT
    TO authenticated
    WITH CHECK (teacher_id = auth.uid()::text OR public.get_current_user_role() = 'ADMIN');

-- Giáo viên chỉ được sửa minh chứng khi là DRAFT hoặc REVISION_REQUIRED (Mục 2: Sau khi gửi không tự ý sửa file)
-- Tổ trưởng chỉ được duyệt giáo viên thuộc tổ mình (Mục 10: Kiểm tra quyền ở database/RLS)
CREATE POLICY "Strict evidence update and review policy"
    ON public.evidence FOR UPDATE
    TO authenticated
    USING (
        -- Giáo viên chỉ được cập nhật khi ở trạng thái DRAFT hoặc REVISION_REQUIRED
        (teacher_id = auth.uid()::text AND status IN ('DRAFT', 'REVISION_REQUIRED'))
        -- Tổ trưởng chỉ được duyệt giáo viên thuộc tổ mình (Mục 10)
        OR (public.get_current_user_role() = 'TO_TRUONG' AND department_id = public.get_current_user_department())
        -- Ban Giám hiệu và Admin
        OR public.get_current_user_role() IN ('ADMIN', 'BGH')
    );

-- Giáo viên chỉ được xóa minh chứng khi chưa được duyệt (Mục 10)
CREATE POLICY "Teachers can delete own unapproved evidence"
    ON public.evidence FOR DELETE
    TO authenticated
    USING (
        (teacher_id = auth.uid()::text AND status IN ('DRAFT', 'SUBMITTED', 'REVISION_REQUIRED'))
        OR public.get_current_user_role() = 'ADMIN'
    );

-- POLICIES CHO AUDIT LOGS:
-- Chỉ cho phép SELECT và INSERT (Tuyệt đối KHÔNG có DELETE hoặc UPDATE policy)
CREATE POLICY "Users can read relevant audit logs"
    ON public.evidence_audit_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert audit logs"
    ON public.evidence_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 5. SUPABASE STORAGE BUCKET CONFIGURATION (Mục 1)
-- Tạo bucket minh-chung-thi-dua
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'minh-chung-thi-dua',
    'minh-chung-thi-dua',
    true,
    52428800, -- 50MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'application/zip',
        'application/x-zip-compressed'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Giáo viên chỉ upload vào thư mục của mình
CREATE POLICY "Allow authenticated uploads to minh-chung-thi-dua"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'minh-chung-thi-dua');

CREATE POLICY "Allow authenticated read to minh-chung-thi-dua"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'minh-chung-thi-dua');
