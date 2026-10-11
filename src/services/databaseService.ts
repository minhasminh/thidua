import {
  Teacher,
  DepartmentModel,
  SchoolYear,
  Semester,
  User,
  EvidenceItem,
  normalizeRole
} from '../types';
import { logRlsEnforcement } from '../lib/supabaseClient';

const DB_KEYS = {
  TEACHERS: 'nda_db_teachers_v3',
  DEPARTMENTS: 'nda_db_departments_v3',
  SCHOOL_YEARS: 'nda_db_school_years_v3',
  SEMESTERS: 'nda_db_semesters_v3'
};

// Seed: 11 Hồ sơ Giáo viên / Cán bộ chuẩn mẫu theo Mục 2 & Mục 9
const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-admin',
    user_id: 'user-admin-system',
    ho_ten: 'Quản trị viên Hệ thống',
    email: 'admin@nguyendinhanh.edu.vn',
    ma_giao_vien: 'QT-001',
    to_chuyen_mon: 'Phòng Quản trị & CNTT',
    department_id: 'dept-1',
    cap_hoc: 'Liên cấp',
    mon_day: 'Tin học, Quản trị mạng',
    chuc_vu: 'Chuyên viên CNTT & Thư ký TĐKT',
    co_so: 'Cơ sở chính (Trường TH&THCS Nguyễn Đình Anh)',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-01',
    user_id: 'user-admin',
    ho_ten: 'Trần Đình Trọng',
    email: 'hieutruong@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-001',
    to_chuyen_mon: 'Ban Giám hiệu',
    department_id: 'dept-1',
    cap_hoc: 'Liên cấp',
    mon_day: 'Toán học, Quản lý giáo dục',
    chuc_vu: 'Hiệu trưởng',
    co_so: 'Cơ sở chính (Trường TH&THCS Nguyễn Đình Anh)',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-02',
    user_id: 'user-council',
    ho_ten: 'Phạm Minh Trang',
    email: 'hoidong.tdkt@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-002',
    to_chuyen_mon: 'Hội đồng Thi đua - Khen thưởng',
    department_id: 'dept-2',
    cap_hoc: 'Liên cấp',
    mon_day: 'Ngữ văn',
    chuc_vu: 'Phó Hiệu trưởng - Phó Chủ tịch HĐ TĐKT',
    co_so: 'Cơ sở chính (Trường TH&THCS Nguyễn Đình Anh)',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-03',
    user_id: 'user-tt1',
    ho_ten: 'Lê Thị Mai',
    email: 'maile@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-003',
    to_chuyen_mon: 'Tổ khoa học tự nhiên',
    department_id: 'dept-1',
    cap_hoc: 'THCS',
    mon_day: 'Toán học 8, 9',
    chuc_vu: 'Tổ trưởng chuyên môn',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-04',
    user_id: 'user-gv1',
    ho_ten: 'Nguyễn Văn An',
    email: 'annv@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-004',
    to_chuyen_mon: 'Tổ khoa học tự nhiên',
    department_id: 'dept-1',
    cap_hoc: 'THCS',
    mon_day: 'Tin học 7, 8, Toán 8',
    chuc_vu: 'Giáo viên - GVCN 8A1',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-05',
    user_id: 'user-gv2',
    ho_ten: 'Vũ Hoàng Long',
    email: 'longvh@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-005',
    to_chuyen_mon: 'Tổ khoa học tự nhiên',
    department_id: 'dept-1',
    cap_hoc: 'THCS',
    mon_day: 'KHTN 6, 7 (Vật lý)',
    chuc_vu: 'Tổ phó chuyên môn',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-06',
    user_id: 'user-tt2',
    ho_ten: 'Hoàng Thị Bích Ngọc',
    email: 'ngochtb@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-006',
    to_chuyen_mon: 'Tổ khoa học xã hội',
    department_id: 'dept-2',
    cap_hoc: 'THCS',
    mon_day: 'Tiếng Anh 7, 9',
    chuc_vu: 'Tổ trưởng chuyên môn',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-07',
    user_id: 'user-gv3',
    ho_ten: 'Ngô Thị Thúy Loan',
    email: 'loanntt@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-007',
    to_chuyen_mon: 'Tổ 4-5',
    department_id: 'dept-5',
    cap_hoc: 'Tiểu học',
    mon_day: 'Tiểu học lớp 4, 5',
    chuc_vu: 'Tổ trưởng chuyên môn',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-11',
    user_id: 'user-gv7',
    ho_ten: 'Trần Thị Thu Hà',
    email: 'hath@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-011',
    to_chuyen_mon: 'Tổ 4-5',
    department_id: 'dept-5',
    cap_hoc: 'Tiểu học',
    mon_day: 'Tiểu học lớp 5',
    chuc_vu: 'Giáo viên - GVCN 5A1',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-08',
    user_id: 'user-gv4',
    ho_ten: 'Bùi Quang Hải',
    email: 'haibq@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-008',
    to_chuyen_mon: 'Tổ khoa học xã hội',
    department_id: 'dept-2',
    cap_hoc: 'THCS',
    mon_day: 'Lịch sử - Địa lý 7, 8',
    chuc_vu: 'Giáo viên - Bí thư Chi đoàn',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-09',
    user_id: 'user-gv5',
    ho_ten: 'Đặng Tuấn Anh',
    email: 'anhdt@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-009',
    to_chuyen_mon: 'Tổ Tiếng Anh - Giáo dục thể chất',
    department_id: 'dept-3',
    cap_hoc: 'Liên cấp',
    mon_day: 'Âm nhạc, Mỹ thuật',
    chuc_vu: 'Giáo viên Âm nhạc, Mỹ thuật',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  },
  {
    id: 'tch-10',
    user_id: 'user-gv6',
    ho_ten: 'Lê Hoài Thương',
    email: 'thuonglh@nguyendinhanh.edu.vn',
    ma_giao_vien: 'GV-010',
    to_chuyen_mon: 'Tổ 1-2-3',
    department_id: 'dept-4',
    cap_hoc: 'Tiểu học',
    mon_day: 'Giáo viên Tiểu học đa môn',
    chuc_vu: 'Giáo viên chủ nhiệm lớp 2A1',
    co_so: 'Cơ sở chính',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  }
];

// Seed: 6 Tổ chuyên môn mặc định
const INITIAL_DEPARTMENTS: DepartmentModel[] = [
  {
    id: 'dept-1',
    ten_to: 'Tổ khoa học tự nhiên',
    truong_to: 'Lê Thị Mai',
    truong_to_id: 'user-tt1',
    mo_ta: 'Phụ trách chuyên môn Toán học, Tin học và Khoa học Tự nhiên cấp THCS',
    trang_thai: 'HOAT_DONG',
    teacher_count: 3,
    created_at: '2026-08-15T08:00:00Z'
  },
  {
    id: 'dept-2',
    ten_to: 'Tổ khoa học xã hội',
    truong_to: 'Hoàng Thị Bích Ngọc',
    truong_to_id: 'user-tt2',
    mo_ta: 'Phụ trách Ngữ văn, Lịch sử - Địa lý, GDCD cấp THCS',
    trang_thai: 'HOAT_DONG',
    teacher_count: 2,
    created_at: '2026-08-15T08:00:00Z'
  },
  {
    id: 'dept-3',
    ten_to: 'Tổ Tiếng Anh - Giáo dục thể chất',
    truong_to: 'Đặng Tuấn Anh',
    truong_to_id: 'user-gv5',
    mo_ta: 'Phụ trách môn Tiếng Anh, Giáo dục thể chất, Âm nhạc và Mỹ thuật',
    trang_thai: 'HOAT_DONG',
    teacher_count: 1,
    created_at: '2026-08-15T08:00:00Z'
  },
  {
    id: 'dept-4',
    ten_to: 'Tổ 1-2-3',
    truong_to: 'Lê Hoài Thương',
    truong_to_id: 'user-gv6',
    mo_ta: 'Phụ trách công tác giảng dạy khối lớp 1, 2, 3 cấp Tiểu học',
    trang_thai: 'HOAT_DONG',
    teacher_count: 1,
    created_at: '2026-08-15T08:00:00Z'
  },
  {
    id: 'dept-5',
    ten_to: 'Tổ 4-5',
    truong_to: 'Ngô Thị Thúy Loan',
    truong_to_id: 'user-gv3',
    mo_ta: 'Phụ trách công tác giảng dạy khối lớp 4, 5 cấp Tiểu học',
    trang_thai: 'HOAT_DONG',
    teacher_count: 2,
    created_at: '2026-08-15T08:00:00Z'
  },
  {
    id: 'dept-6',
    ten_to: 'Tổ văn phòng',
    truong_to: 'Quản trị viên Hệ thống',
    truong_to_id: 'user-admin-system',
    mo_ta: 'Công tác văn thư lưu trữ, kế toán tài vụ, y tế học đường, thư viện và hành chính',
    trang_thai: 'HOAT_DONG',
    teacher_count: 1,
    created_at: '2026-08-15T08:00:00Z'
  }
];

// Seed: Năm học
const INITIAL_SCHOOL_YEARS: SchoolYear[] = [
  {
    id: 'sy-2026-2027',
    ten_nam_hoc: '2026–2027',
    ngay_bat_dau: '2026-09-01',
    ngay_ket_thuc: '2027-05-31',
    trang_thai: 'DANG_DIEN_RA'
  }
];

// Seed: Học kỳ
const INITIAL_SEMESTERS: Semester[] = [
  {
    id: 'sem-2026-hki',
    school_year_id: 'sy-2026-2027',
    ten_hoc_ky: 'HKI',
    ngay_bat_dau: '2026-09-01',
    ngay_ket_thuc: '2027-01-15',
    trang_thai: 'DANG_DIEN_RA'
  },
  {
    id: 'sem-2026-hkii',
    school_year_id: 'sy-2026-2027',
    ten_hoc_ky: 'HKII',
    ngay_bat_dau: '2027-01-16',
    ngay_ket_thuc: '2027-05-31',
    trang_thai: 'KE_HOACH'
  },
  {
    id: 'sem-2026-canam',
    school_year_id: 'sy-2026-2027',
    ten_hoc_ky: 'CA_NAM',
    ngay_bat_dau: '2026-09-01',
    ngay_ket_thuc: '2027-05-31',
    trang_thai: 'KE_HOACH'
  }
];

function safeRead<T>(key: string, defaultVal: T): T {
  try {
    if (typeof localStorage === 'undefined') return defaultVal;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function safeWrite<T>(key: string, val: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to write to key [${key}]:`, e);
  }
}

class DatabaseService {
  constructor() {
    this.init();
  }

  public init() {
    if (typeof localStorage === 'undefined') return;
    if (!localStorage.getItem(DB_KEYS.TEACHERS)) {
      safeWrite(DB_KEYS.TEACHERS, INITIAL_TEACHERS);
    } else {
      // Ensure existing cached teachers are updated & deduplicated
      const teachers = safeRead<Teacher[]>(DB_KEYS.TEACHERS, INITIAL_TEACHERS);
      const seenIds = new Set<string>();
      const clean: Teacher[] = [];
      let updated = false;

      teachers.forEach((t) => {
        if (!t || !t.id || seenIds.has(t.id)) {
          updated = true;
          return;
        }
        seenIds.add(t.id);
        if (t.user_id === 'user-gv3' && (t.ho_ten === 'Nguyễn Thị Dung' || t.ho_ten !== 'Ngô Thị Thúy Loan' || t.chuc_vu !== 'Tổ trưởng chuyên môn')) {
          t.ho_ten = 'Ngô Thị Thúy Loan';
          t.email = 'loanntt@nguyendinhanh.edu.vn';
          t.to_chuyen_mon = 'Tổ 4-5';
          t.department_id = 'dept-5';
          t.chuc_vu = 'Tổ trưởng chuyên môn';
          updated = true;
        }
        clean.push(t);
      });

      // Ensure user-gv7 (Trần Thị Thu Hà) is included
      if (!clean.some((t) => t.user_id === 'user-gv7')) {
        const tch11 = INITIAL_TEACHERS.find((t) => t.user_id === 'user-gv7');
        if (tch11) {
          clean.push(tch11);
          updated = true;
        }
      }

      if (updated || clean.length !== teachers.length) {
        safeWrite(DB_KEYS.TEACHERS, clean);
      }
    }

    if (!localStorage.getItem(DB_KEYS.DEPARTMENTS)) {
      safeWrite(DB_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    } else {
      const depts = safeRead<DepartmentModel[]>(DB_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
      let updated = false;
      depts.forEach((d) => {
        if (d.id === 'dept-5' && (d.truong_to === 'Nguyễn Thị Dung' || d.truong_to !== 'Ngô Thị Thúy Loan')) {
          d.truong_to = 'Ngô Thị Thúy Loan';
          d.truong_to_id = 'user-gv3';
          updated = true;
        }
      });
      if (updated) {
        safeWrite(DB_KEYS.DEPARTMENTS, depts);
      }
    }
    if (!localStorage.getItem(DB_KEYS.SCHOOL_YEARS)) {
      safeWrite(DB_KEYS.SCHOOL_YEARS, INITIAL_SCHOOL_YEARS);
    }
    if (!localStorage.getItem(DB_KEYS.SEMESTERS)) {
      safeWrite(DB_KEYS.SEMESTERS, INITIAL_SEMESTERS);
    }
  }

  // ==========================================
  // 1. TEACHERS (Bảng teachers với RLS thực tế)
  // ==========================================
  public getAllTeachersRaw(): Teacher[] {
    const raw = safeRead<Teacher[]>(DB_KEYS.TEACHERS, INITIAL_TEACHERS);
    const seen = new Set<string>();
    const clean: Teacher[] = [];
    for (const t of raw) {
      if (!t || !t.id || seen.has(t.id)) continue;
      seen.add(t.id);
      clean.push(t);
    }
    return clean;
  }

  /**
   * Truy vấn teachers áp dụng Row Level Security (Mục 6 & 7):
   * - ADMIN / BGH / HOI_DONG_TDKT: Xem tất cả giáo viên.
   * - TO_TRUONG / TO_PHO: Chỉ xem giáo viên thuộc tổ mình quản lý.
   * - GIAO_VIEN: Chỉ xem hồ sơ của chính mình (auth.uid() = user_id).
   */
  public getTeachers(requestingUser: User): Teacher[] {
    const all = this.getAllTeachersRaw();
    const role = normalizeRole(requestingUser.role);

    if (role === 'ADMIN' || role === 'BGH' || role === 'HOI_DONG_TDKT') {
      logRlsEnforcement('SELECT', 'teachers', requestingUser.id, role, true, 'Full school read access granted');
      return all;
    }

    if (role === 'TO_TRUONG' || role === 'TO_PHO') {
      const myDeptTeachers = all.filter(
        (t) => t.department_id === requestingUser.departmentId || t.to_chuyen_mon === requestingUser.departmentName
      );
      logRlsEnforcement('SELECT', 'teachers', requestingUser.id, role, true, `Department-restricted read (${myDeptTeachers.length} records)`);
      return myDeptTeachers;
    }

    // GIAO_VIEN: Chỉ xem hồ sơ của mình
    const ownTeacher = all.filter((t) => t.user_id === requestingUser.id);
    logRlsEnforcement('SELECT', 'teachers', requestingUser.id, role, true, `User-restricted read (1 record)`);
    return ownTeacher;
  }

  public getTeacherById(id: string, requestingUser: User): Teacher | null {
    const teachers = this.getTeachers(requestingUser);
    const found = teachers.find((t) => t.id === id || t.user_id === id);
    if (!found) {
      logRlsEnforcement('SELECT_SINGLE', 'teachers', requestingUser.id, requestingUser.role, false, `Access denied or not found for teacher id ${id}`);
      return null;
    }
    return found;
  }

  public saveTeacher(teacher: Teacher, requestingUser: User): boolean {
    const role = normalizeRole(requestingUser.role);
    // RLS Write Check: Only ADMIN or the teacher themselves can update
    const canWrite = role === 'ADMIN' || teacher.user_id === requestingUser.id;
    if (!canWrite) {
      logRlsEnforcement('UPDATE', 'teachers', requestingUser.id, role, false, 'RLS policy violated: User cannot update another teacher');
      return false;
    }

    const all = this.getAllTeachersRaw();
    const index = all.findIndex((t) => t.id === teacher.id);
    teacher.updated_at = new Date().toISOString();

    if (index >= 0) {
      all[index] = teacher;
    } else {
      if (role !== 'ADMIN') {
        logRlsEnforcement('INSERT', 'teachers', requestingUser.id, role, false, 'Only ADMIN can insert new teachers');
        return false;
      }
      all.push(teacher);
    }

    safeWrite(DB_KEYS.TEACHERS, all);
    logRlsEnforcement('WRITE', 'teachers', requestingUser.id, role, true, 'Successfully updated teacher record');
    return true;
  }

  // ==========================================
  // 2. DEPARTMENTS (Bảng departments)
  // ==========================================
  public getDepartments(): DepartmentModel[] {
    return safeRead<DepartmentModel[]>(DB_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  public getDepartmentById(id: string): DepartmentModel | undefined {
    return this.getDepartments().find((d) => d.id === id);
  }

  public saveDepartment(dept: DepartmentModel, requestingUser: User): boolean {
    const role = normalizeRole(requestingUser.role);
    if (role !== 'ADMIN') {
      logRlsEnforcement('WRITE', 'departments', requestingUser.id, role, false, 'Only ADMIN can manage departments');
      return false;
    }
    const all = this.getDepartments();
    const idx = all.findIndex((d) => d.id === dept.id);
    if (idx >= 0) {
      all[idx] = dept;
    } else {
      all.push(dept);
    }
    safeWrite(DB_KEYS.DEPARTMENTS, all);
    return true;
  }

  // ==========================================
  // 3. SCHOOL YEARS (Bảng school_years)
  // ==========================================
  public getSchoolYears(): SchoolYear[] {
    return safeRead<SchoolYear[]>(DB_KEYS.SCHOOL_YEARS, INITIAL_SCHOOL_YEARS);
  }

  public saveSchoolYear(sy: SchoolYear, requestingUser: User): boolean {
    if (normalizeRole(requestingUser.role) !== 'ADMIN') {
      return false;
    }
    const all = this.getSchoolYears();
    const idx = all.findIndex((s) => s.id === sy.id);
    if (idx >= 0) all[idx] = sy;
    else all.push(sy);
    safeWrite(DB_KEYS.SCHOOL_YEARS, all);
    return true;
  }

  // ==========================================
  // 4. SEMESTERS (Bảng semesters)
  // ==========================================
  public getSemesters(schoolYearId = 'sy-2026-2027'): Semester[] {
    const all = safeRead<Semester[]>(DB_KEYS.SEMESTERS, INITIAL_SEMESTERS);
    return all.filter((s) => !schoolYearId || s.school_year_id === schoolYearId);
  }

  // ==========================================
  // 5. ROW LEVEL SECURITY ENFORCEMENT CHO MINH CHỨNG
  // ==========================================
  public filterEvidencesByRls(evidences: EvidenceItem[], requestingUser: User): EvidenceItem[] {
    const role = normalizeRole(requestingUser.role);

    if (role === 'ADMIN' || role === 'BGH' || role === 'HOI_DONG_TDKT') {
      logRlsEnforcement('SELECT', 'evidence', requestingUser.id, role, true, 'Full school access');
      return evidences;
    }

    if (role === 'TO_TRUONG' || role === 'TO_PHO') {
      const filtered = evidences.filter((e) => e.departmentId === requestingUser.departmentId);
      logRlsEnforcement('SELECT', 'evidence', requestingUser.id, role, true, `Department-filtered (${filtered.length} items)`);
      return filtered;
    }

    // GIAO_VIEN: Chỉ xem minh chứng của chính mình
    const ownEvidences = evidences.filter((e) => e.teacherId === requestingUser.id);
    logRlsEnforcement('SELECT', 'evidence', requestingUser.id, role, true, `Teacher-filtered (${ownEvidences.length} items)`);
    return ownEvidences;
  }

  // ==========================================
  // 6. SQL DDL & ROW LEVEL SECURITY SCHEMA
  // ==========================================
  public getSupabaseStep2MigrationSql(): string {
    return `-- ==============================================================================
-- BƯỚC 2: MIGRATION SCRIPT DATABASE & ROW LEVEL SECURITY (RLS)
-- Trường TH&THCS Nguyễn Đình Anh • Năm học 2026–2027
-- ==============================================================================

-- 1. BẢNG ROLES
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'BGH', 'TO_TRUONG', 'GIAO_VIEN', 'HOI_DONG_TDKT');

-- 2. BẢNG DEPARTMENTS (Mục 3)
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_to VARCHAR(255) NOT NULL,
    truong_to VARCHAR(255),
    truong_to_id UUID,
    mo_ta TEXT,
    trang_thai VARCHAR(50) DEFAULT 'HOAT_DONG',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG SCHOOL_YEARS (Mục 4)
CREATE TABLE IF NOT EXISTS public.school_years (
    id TEXT PRIMARY KEY,
    ten_nam_hoc VARCHAR(50) NOT NULL, -- e.g. '2026–2027'
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,
    trang_thai VARCHAR(50) DEFAULT 'DANG_DIEN_RA'
);

-- 4. BẢNG SEMESTERS (Mục 5)
CREATE TABLE IF NOT EXISTS public.semesters (
    id TEXT PRIMARY KEY,
    school_year_id TEXT REFERENCES public.school_years(id) ON DELETE CASCADE,
    ten_hoc_ky VARCHAR(20) NOT NULL, -- 'HKI', 'HKII', 'CA_NAM'
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,
    trang_thai VARCHAR(50) DEFAULT 'DANG_DIEN_RA'
);

-- 5. BẢNG TEACHERS (Mục 2)
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ho_ten VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    ma_giao_vien VARCHAR(50) UNIQUE NOT NULL,
    to_chuyen_mon VARCHAR(255) NOT NULL,
    department_id TEXT REFERENCES public.departments(id),
    cap_hoc VARCHAR(50) DEFAULT 'THCS',
    mon_day VARCHAR(255),
    chuc_vu VARCHAR(150),
    co_so VARCHAR(255) DEFAULT 'Cơ sở chính (Trường TH&THCS Nguyễn Đình Anh)',
    trang_thai VARCHAR(50) DEFAULT 'DANG_CONG_TAC',
    role user_role_enum DEFAULT 'GIAO_VIEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG criteria_groups (Mục 2 - Module Quản lý Tiêu chí)
CREATE TABLE IF NOT EXISTS public.criteria_groups (
    id VARCHAR(50) PRIMARY KEY,
    ten_nhom VARCHAR(255) NOT NULL,
    diem_toi_da NUMERIC(5, 2) NOT NULL,
    mo_ta TEXT,
    thu_tu INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG criteria (Mục 2 - Module Quản lý Tiêu chí)
CREATE TABLE IF NOT EXISTS public.criteria (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) REFERENCES public.criteria_groups(id) ON DELETE CASCADE,
    ma_tieu_chi VARCHAR(20) UNIQUE NOT NULL,
    ten_tieu_chi VARCHAR(255) NOT NULL,
    diem_toi_da NUMERIC(5, 2) NOT NULL,
    mo_ta TEXT,
    thu_tu INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- KÍCH HOẠT VÀ THIẾT LẬP ROW LEVEL SECURITY (RLS) - MỤC 7 & MỤC 3
-- ==============================================================================
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;

-- POLICIES CHO TIÊU CHÍ (criteria_groups & criteria):
-- Mọi người dùng đã xác thực đều được đọc
CREATE POLICY "Authenticated users can read criteria groups" ON public.criteria_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read criteria" ON public.criteria FOR SELECT TO authenticated USING (true);

-- Chỉ ADMIN mới được sửa cấu trúc tiêu chí (Mục 3)
CREATE POLICY "Only admin can modify criteria groups" ON public.criteria_groups FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');
CREATE POLICY "Only admin can modify criteria structure" ON public.criteria FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');

-- Hàm trợ giúp lấy role của người dùng hiện tại
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Hàm trợ giúp lấy tổ chuyên môn của người dùng hiện tại
CREATE OR REPLACE FUNCTION public.get_current_user_department()
RETURNS TEXT AS $$
  SELECT department_id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLICIES CHO BẢNG TEACHERS:
-- 1. ADMIN & BGH xem toàn bộ
CREATE POLICY "Admins and BGH can view all teachers" ON public.teachers
    FOR SELECT TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'BGH', 'HOI_DONG_TDKT'));

-- 2. TỔ TRƯỞNG chỉ xem giáo viên thuộc tổ mình
CREATE POLICY "Team Leaders can view department teachers" ON public.teachers
    FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() = 'TO_TRUONG' 
        AND department_id = public.get_current_user_department()
    );

-- 3. GIÁO VIÊN chỉ xem thông tin cá nhân của mình
CREATE POLICY "Teachers can only view own record" ON public.teachers
    FOR SELECT TO authenticated
    USING (
        public.get_current_user_role() = 'GIAO_VIEN' 
        AND user_id = auth.uid()
    );

-- 4. Giáo viên cập nhật hồ sơ cá nhân
CREATE POLICY "Teachers can update own profile" ON public.teachers
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- 5. ADMIN toàn quyền thêm/sửa/xóa giáo viên
CREATE POLICY "Admin full management on teachers" ON public.teachers
    FOR ALL TO authenticated
    USING (public.get_current_user_role() = 'ADMIN');
`;
  }
}

export const databaseService = new DatabaseService();
