export type Role =
  | 'ADMIN'
  | 'BGH'
  | 'TO_TRUONG'
  | 'TO_PHO'
  | 'GIAO_VIEN'
  | 'HOI_DONG_TDKT'
  // English aliases for backward compatibility
  | 'TEACHER'
  | 'TEAM_LEADER'
  | 'VICE_TEAM_LEADER'
  | 'PRINCIPAL'
  | 'COUNCIL';

export function normalizeRole(role: Role): 'ADMIN' | 'BGH' | 'TO_TRUONG' | 'TO_PHO' | 'GIAO_VIEN' | 'HOI_DONG_TDKT' {
  switch (role) {
    case 'ADMIN':
      return 'ADMIN';
    case 'BGH':
    case 'PRINCIPAL':
      return 'BGH';
    case 'TO_TRUONG':
    case 'TEAM_LEADER':
      return 'TO_TRUONG';
    case 'TO_PHO':
    case 'VICE_TEAM_LEADER':
      return 'TO_PHO';
    case 'HOI_DONG_TDKT':
    case 'COUNCIL':
      return 'HOI_DONG_TDKT';
    case 'GIAO_VIEN':
    case 'TEACHER':
    default:
      return 'GIAO_VIEN';
  }
}

export type EvidenceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TEAM_REVIEW'
  | 'TEAM_APPROVED'
  | 'REVISION_REQUIRED'
  | 'REJECTED'
  | 'BGH_REVIEW'
  | 'BGH_APPROVED'
  | 'LOCKED';

export type EvaluationStatus =
  | 'CHUA_BAT_DAU'
  | 'DANG_TU_DANH_GIA'
  | 'CHO_TO_DUYET'
  | 'DA_DUYET_CAP_TO'
  | 'CHO_BGH'
  | 'DA_RA_SOAT'
  | 'BGH_APPROVED'
  | 'CHO_HOI_DONG'
  | 'DA_KET_LUAN'
  | 'DA_KHOA';

export type RatingLevel = 'A_PLUS' | 'A' | 'B' | 'C' | 'D';

// 2. THÔNG TIN GIÁO VIÊN (bảng teachers)
export interface Teacher {
  id: string;
  user_id: string;
  ho_ten: string;
  email: string;
  ma_giao_vien: string;
  to_chuyen_mon: string;
  department_id?: string;
  cap_hoc: 'Tiểu học' | 'THCS' | 'Liên cấp';
  mon_day: string;
  chuc_vu: string;
  co_so: string;
  trang_thai: 'DANG_CONG_TAC' | 'NGHI_PHEP' | 'CHUYEN_CONG_TAC';
  created_at: string;
  updated_at: string;
}

// 3. TỔ CHUYÊN MÔN (bảng departments)
export interface DepartmentModel {
  id: string;
  ten_to: string;
  truong_to: string;
  truong_to_id?: string;
  mo_ta: string;
  trang_thai: 'HOAT_DONG' | 'TAM_KHOA';
  teacher_count?: number;
  created_at: string;
}

// 4. NĂM HỌC (bảng school_years)
export interface SchoolYear {
  id: string;
  ten_nam_hoc: string; // VD: "2026–2027"
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: 'DANG_DIEN_RA' | 'DA_KET_THUC' | 'KE_HOACH';
}

// 5. HỌC KỲ (bảng semesters)
export interface Semester {
  id: string;
  school_year_id: string;
  ten_hoc_ky: 'HKI' | 'HKII' | 'CA_NAM';
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: 'DANG_DIEN_RA' | 'DA_KET_THUC' | 'KE_HOACH';
}

// User Profile & Legacy Interop
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  departmentId: string;
  departmentName: string;
  position: string;
  subjects: string[];
  educationLevel: 'TH' | 'THCS' | 'LIEN_CAP';
  phone?: string;
  teacherId?: string;
  password?: string;
  status?: 'ACTIVE' | 'LOCKED';
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  leaderName: string;
  viceLeaderId?: string;
  viceLeaderName?: string;
  teacherCount: number;
  description?: string;
}

// 2. DATABASE TIÊU CHÍ THI ĐUA (Bảng criteria_groups & criteria)
export interface CriteriaGroupModel {
  id: string;
  ten_nhom: string;
  diem_toi_da: number;
  mo_ta: string;
  thu_tu: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CriteriaModel {
  id: string;
  group_id: string;
  ma_tieu_chi: string;
  ten_tieu_chi: string;
  diem_toi_da: number;
  mo_ta: string;
  thu_tu: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CriteriaItem {
  id: string;
  code: string;
  groupId: string;
  title: string;
  maxScore: number;
  description: string;
  evidenceRequirements?: string[];
  isActive?: boolean;
}

export interface CriteriaGroup {
  id: string;
  order: number;
  name: string;
  maxScore: number;
  description: string;
  criteria: CriteriaItem[];
}

export interface EvidenceAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  details?: string;
  previousStatus?: EvidenceStatus;
  newStatus?: EvidenceStatus;
}

// 4. THÔNG TIN DATABASE (bảng evidence - Mục 4)
export interface EvidenceModel {
  id: string;
  teacher_id: string;
  department_id: string;
  school_year_id: string;
  semester_id: string;
  criteria_id: string;
  ten_minh_chung: string;
  mo_ta: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: string;
  ngay_thuc_hien: string;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  status: EvidenceStatus;
  note?: string; // Ghi chú của giáo viên khi nộp (Mục 2)
}

export interface EvidenceVersion {
  version: number;
  versionLabel: string; // 'Version 1', 'Version 2', 'Version 3'
  fileName: string;
  fileUrl: string;
  fileSize: string;
  fileType: string;
  storagePath?: string;
  uploadedAt: string;
  uploadedBy: string;
  note?: string;
  supplementRequestId?: string;
}

export interface EvidenceItem {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentId: string;
  departmentName: string;
  schoolYear: string;
  semester: 'HKI' | 'HKII' | 'CA_NAM';
  criteriaGroupId: string;
  criteriaId: string;
  criteriaCode: string;
  criteriaTitle: string;
  name: string;
  description: string;
  evidenceType: 'GIAO_AN' | 'BIEN_BAN' | 'HINH_ANH' | 'SAN_PHAM' | 'CHUNG_CHI' | 'QUYET_DINH' | 'BAO_CAO' | 'KHAC';
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  storagePath: string;
  executionDate: string;
  uploadedAt: string;
  uploadedBy: string;
  updatedAt?: string;
  status: EvidenceStatus;
  note?: string; // Ghi chú của giáo viên khi nộp (Mục 2)
  reviewerId?: string;
  reviewerName?: string;
  reviewerRole?: string;
  reviewDate?: string;
  reviewNote?: string;
  isOutstanding?: boolean;
  currentVersion?: number;
  versions?: EvidenceVersion[];
  auditLogs: EvidenceAuditLog[];
}

export interface CriteriaScore {
  criteriaId: string;
  criteriaCode: string;
  selfScore: number;
  teamScore: number;
  bghScore: number;
  councilScore?: number;
  note?: string;
  bghNote?: string;
}

export type BonusCategory =
  | 'CAP_TRUONG'
  | 'CAP_XA'
  | 'CAP_TINH'
  | 'SANG_KIEN'
  | 'NHIEM_VU_KHO';

export interface ScoreAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole?: string;
  action: string;
  details: string;
  previousValue?: any;
  newValue?: any;
}

export interface BonusItem {
  id: string;
  teacherId: string;
  teacherName?: string;
  category: BonusCategory;
  categoryLabel: string;
  title: string;
  points: number;
  evidenceUrl?: string;
  evidenceName?: string;
  verifiedBy: string;
  verifiedById?: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  auditLogs?: ScoreAuditLog[];
}

export interface DeductionItem {
  id: string;
  teacherId: string;
  teacherName?: string;
  title?: string;
  reason: string;
  points: number;
  date: string;
  evidenceUrl?: string;
  evidenceBasis?: string;
  verifiedBy: string;
  verifiedById?: string;
  notes?: string;
  auditLogs?: ScoreAuditLog[];
}

export interface BghScoreAdjustment {
  id: string;
  evaluationId: string;
  teacherId: string;
  teacherName: string;
  criteriaId: string;
  criteriaCode: string;
  criteriaTitle?: string;
  oldScore: number;
  newScore: number;
  reason: string;
  evidenceBasis: string; // Căn cứ / minh chứng
  adjustedBy: string; // Người điều chỉnh (BGH)
  adjustedById: string;
  adjustedAt: string; // DD/MM/YYYY HH:mm:ss
}

export interface EvaluationRecord {
  id: string;
  teacherId: string;
  schoolYear: string;
  semester: 'HKI' | 'HKII' | 'CA_NAM';
  scores: Record<string, CriteriaScore>;
  selfTotal: number;
  teamTotal: number;
  bghTotal: number;
  bonusPoints: number;
  deductionPoints: number;
  finalScore: number;
  rating: RatingLevel;
  status: EvaluationStatus;
  discrepancyAlert: boolean;
  discrepancyReason?: string;
  teamComment?: string;
  bghComment?: string;
  bghAdjustments?: BghScoreAdjustment[];
  bghApprovedAt?: string;
  bghApprovedBy?: string;
  bghExplanationRequired?: boolean;
  bghSupplementRequired?: boolean;
  // Điều kiện khống chế (Mục 5)
  isControlled?: boolean;
  controlledMaxRating?: RatingLevel;
  controlledReason?: string;
  controlledMarkedBy?: string;
  controlledMarkedAt?: string;
  originalUncappedRating?: RatingLevel;
  councilComment?: string;
  updatedAt: string;
  lockedAt?: string;
}

export type AppealStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  // Legacy aliases
  | 'CHO_XU_LY'
  | 'DA_GIAI_QUYET'
  | 'TU_CHOI';

export interface AppealAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  previousStatus?: AppealStatus;
  newStatus?: AppealStatus;
}

export interface SupplementRequest {
  id: string;
  evidenceId?: string;
  evidenceName?: string;
  criteriaId?: string;
  criteriaCode?: string;
  criteriaTitle?: string;
  teacherId: string;
  teacherName: string;
  departmentId?: string;
  departmentName?: string;
  requesterId: string;
  requesterName: string;
  requesterRole: 'TO_TRUONG' | 'BGH' | 'ADMIN';
  reason: string;
  deadline: string;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED' | 'OVERDUE';
  resolvedAt?: string;
  supplementedVersion?: number;
  supplementedNote?: string;
  auditLogs: {
    id: string;
    timestamp: string;
    actorName: string;
    action: string;
    details: string;
  }[];
}

export interface AppealItem {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentName: string;
  title: string;
  content: string; // Nội dung
  criteriaCode?: string; // Tiêu chí liên quan
  criteriaTitle?: string;
  relatedEvidenceId?: string; // Minh chứng liên quan
  relatedEvidenceName?: string;
  attachedFiles?: { name: string; url: string; size?: string }[]; // File đính kèm
  submittedAt: string; // Thời gian gửi
  targetType: 'SCORE' | 'EVIDENCE' | 'DEDUCTION' | 'KHAC';
  status: AppealStatus; // SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED
  responseBy?: string;
  responseRole?: string;
  responseContent?: string;
  respondedAt?: string;
  auditLogs: AppealAuditLog[]; // Lưu toàn bộ lịch sử. Không cho xóa lịch sử.
}

export interface NotificationItem {
  id: string;
  userId?: string;
  roleTarget?: Role;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ACTION';
  linkTarget?: string;
  createdAt: string;
  isRead: boolean;
}

export interface SystemSettings {
  schoolName: string;
  schoolYear: string;
  currentSemester: 'HKI' | 'HKII';
  evidenceSubmissionOpen: boolean;
  evidenceDeadline: string;
  evaluationDeadline: string;
  maxFileSizeMb: number;
  allowedFileTypes: string[];
  discrepancyThreshold: number;
  ratingThresholds?: {
    aPlusMin: number;
    aMin: number;
    bMin: number;
    cMin: number;
  };
}

export interface RegulationVersion {
  id: string;
  version: string;
  title: string;
  issueDate: string;
  signer: string;
  isActive: boolean;
  fileUrl: string;
  fileName: string;
  summary: string;
}
