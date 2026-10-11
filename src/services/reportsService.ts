import * as XLSX from 'xlsx';
import {
  User,
  Department,
  EvidenceItem,
  EvaluationRecord,
  RatingLevel,
  EvaluationStatus,
  normalizeRole
} from '../types';
import { storageService } from './storageService';
import { databaseService } from './databaseService';

export interface SchoolDashboardMetrics {
  totalTeachers: number;
  totalDepartments: number;
  totalEvidences: number;
  approvedEvidences: number;
  pendingEvidences: number;
  revisionRequiredEvidences: number;
  completedEvaluations: number;
  incompleteEvaluations: number;
}

export interface RatingStatItem {
  rating: RatingLevel;
  label: string;
  subLabel: string;
  scoreRange: string;
  count: number;
  percentage: number;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export interface DepartmentStatItem {
  departmentId: string;
  departmentName: string;
  departmentCode?: string;
  teacherCount: number;
  averageScore: number;
  countAPlus: number;
  countA: number;
  countB: number;
  countC: number;
  countD: number;
}

export interface ReportFilterOptions {
  schoolYear: string;
  semester: 'HKI' | 'HKII' | 'CA_NAM';
  departmentId: string;
  searchTeacher: string;
  ratingLevel: string; // 'ALL' | RatingLevel
  evaluationStatus: string; // 'ALL' | 'HOAN_THANH' | 'CHUA_HOAN_THANH' | 'CHO_DUYET' | 'CAN_BO_SUNG'
}

export interface TeacherReportRow {
  teacher: User;
  evaluation: EvaluationRecord;
  departmentName: string;
  evidencesCount: number;
  approvedEvidencesCount: number;
  bonusPoints: number;
  deductionPoints: number;
  finalScore: number;
  rating: RatingLevel;
  statusLabel: string;
  isCompleted: boolean;
  notes: string;
}

export class ReportsService {
  /**
   * Lấy danh sách giáo viên thuộc phạm vi đánh giá thi đua
   */
  public getEligibleTeachers(): User[] {
    const allUsers = storageService.getUsers();
    return allUsers.filter((u) => {
      const r = normalizeRole(u.role);
      return (
        r === 'GIAO_VIEN' ||
        r === 'TO_TRUONG' ||
        r === 'BGH' ||
        r === 'HOI_DONG_TDKT'
      );
    });
  }

  /**
   * 1. DASHBOARD TOÀN TRƯỜNG:
   * - Tổng giáo viên
   * - Tổng tổ
   * - Tổng minh chứng
   * - Minh chứng đã duyệt
   * - Minh chứng chờ duyệt
   * - Minh chứng cần bổ sung
   * - Hồ sơ hoàn thành
   * - Hồ sơ chưa hoàn thành
   */
  public getDashboardMetrics(
    schoolYear = '2026-2027',
    semester = 'HKI'
  ): SchoolDashboardMetrics {
    const teachers = this.getEligibleTeachers();
    const departments = storageService.getDepartments();
    const evidences = storageService.getEvidences();

    // Minh chứng
    const approvedEvidences = evidences.filter(
      (e) =>
        e.status === 'TEAM_APPROVED' ||
        e.status === 'BGH_APPROVED' ||
        e.status === 'LOCKED'
    ).length;

    const pendingEvidences = evidences.filter(
      (e) =>
        e.status === 'SUBMITTED' ||
        e.status === 'TEAM_REVIEW' ||
        e.status === 'BGH_REVIEW'
    ).length;

    const revisionRequiredEvidences = evidences.filter(
      (e) => e.status === 'REVISION_REQUIRED'
    ).length;

    // Hồ sơ đánh giá hoàn thành vs chưa hoàn thành
    let completedCount = 0;
    let incompleteCount = 0;

    teachers.forEach((t) => {
      const ev = storageService.getEvaluation(t.id, schoolYear, semester);
      const isCompleted =
        ev.status === 'DA_RA_SOAT' ||
        ev.status === 'DA_DUYET_CAP_TO' ||
        ev.status === 'BGH_APPROVED' ||
        ev.status === 'DA_KET_LUAN' ||
        ev.status === 'DA_KHOA' ||
        (ev.finalScore > 0 && ev.status !== 'CHUA_BAT_DAU');

      if (isCompleted) {
        completedCount++;
      } else {
        incompleteCount++;
      }
    });

    return {
      totalTeachers: teachers.length,
      totalDepartments: departments.length,
      totalEvidences: evidences.length,
      approvedEvidences,
      pendingEvidences,
      revisionRequiredEvidences,
      completedEvaluations: completedCount,
      incompleteEvaluations: incompleteCount
    };
  }

  /**
   * 2. THỐNG KÊ MỨC XẾP LOẠI (A+, A, B, C, D)
   */
  public getRatingStatistics(
    teachers: User[],
    schoolYear = '2026-2027',
    semester = 'HKI'
  ): RatingStatItem[] {
    const total = teachers.length || 1;
    const counts: Record<RatingLevel, number> = {
      A_PLUS: 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0
    };

    teachers.forEach((t) => {
      const ev = storageService.getEvaluation(t.id, schoolYear, semester);
      if (ev && ev.rating) {
        counts[ev.rating] = (counts[ev.rating] || 0) + 1;
      } else {
        counts['D'] = (counts['D'] || 0) + 1;
      }
    });

    const calcPct = (cnt: number) => Math.round((cnt / total) * 1000) / 10;

    return [
      {
        rating: 'A_PLUS',
        label: 'Loại A+',
        subLabel: 'Xuất sắc nổi bật',
        scoreRange: '95.0 – 100 điểm',
        count: counts.A_PLUS,
        percentage: calcPct(counts.A_PLUS),
        color: '#F59E0B',
        bgClass: 'bg-amber-500',
        borderClass: 'border-amber-300',
        textClass: 'text-amber-700'
      },
      {
        rating: 'A',
        label: 'Loại A',
        subLabel: 'Hoàn thành xuất sắc',
        scoreRange: '90.0 – 94.5 điểm',
        count: counts.A,
        percentage: calcPct(counts.A),
        color: '#10B981',
        bgClass: 'bg-emerald-500',
        borderClass: 'border-emerald-300',
        textClass: 'text-emerald-700'
      },
      {
        rating: 'B',
        label: 'Loại B',
        subLabel: 'Hoàn thành tốt',
        scoreRange: '80.0 – 89.5 điểm',
        count: counts.B,
        percentage: calcPct(counts.B),
        color: '#3B82F6',
        bgClass: 'bg-blue-500',
        borderClass: 'border-blue-300',
        textClass: 'text-blue-700'
      },
      {
        rating: 'C',
        label: 'Loại C',
        subLabel: 'Hoàn thành nhiệm vụ',
        scoreRange: '65.0 – 79.5 điểm',
        count: counts.C,
        percentage: calcPct(counts.C),
        color: '#8B5CF6',
        bgClass: 'bg-purple-500',
        borderClass: 'border-purple-300',
        textClass: 'text-purple-700'
      },
      {
        rating: 'D',
        label: 'Loại D',
        subLabel: 'Chưa hoàn thành',
        scoreRange: 'Dưới 65.0 điểm',
        count: counts.D,
        percentage: calcPct(counts.D),
        color: '#EF4444',
        bgClass: 'bg-rose-500',
        borderClass: 'border-rose-300',
        textClass: 'text-rose-700'
      }
    ];
  }

  /**
   * 3. THỐNG KÊ THEO TỔ:
   * Bảng:
   * Tổ | Số giáo viên | Điểm trung bình | Số A+ | Số A | Số B | Số C | Số D
   * ĐẶC BIỆT: "Không tự động xếp hạng các tổ nếu Quy chế không quy định."
   */
  public getDepartmentStatistics(
    departments: Department[],
    teachers: User[],
    schoolYear = '2026-2027',
    semester = 'HKI'
  ): DepartmentStatItem[] {
    return departments.map((dept) => {
      const deptTeachers = teachers.filter(
        (t) => t.departmentId === dept.id || t.departmentName === dept.name
      );

      let totalScore = 0;
      let countAPlus = 0;
      let countA = 0;
      let countB = 0;
      let countC = 0;
      let countD = 0;

      deptTeachers.forEach((t) => {
        const ev = storageService.getEvaluation(t.id, schoolYear, semester);
        const score = ev?.finalScore || 0;
        totalScore += score;

        const rating = ev?.rating || 'D';
        if (rating === 'A_PLUS') countAPlus++;
        else if (rating === 'A') countA++;
        else if (rating === 'B') countB++;
        else if (rating === 'C') countC++;
        else countD++;
      });

      const avgScore =
        deptTeachers.length > 0
          ? Math.round((totalScore / deptTeachers.length) * 10) / 10
          : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        teacherCount: deptTeachers.length,
        averageScore: avgScore,
        countAPlus,
        countA,
        countB,
        countC,
        countD
      };
    });
  }

  /**
   * 8. BỘ LỌC ĐA TIÊU CHÍ (Năm học, Học kỳ, Tổ, Giáo viên, Mức xếp loại, Trạng thái)
   */
  public filterTeacherReports(
    teachers: User[],
    options: ReportFilterOptions
  ): TeacherReportRow[] {
    return teachers
      .filter((teacher) => {
        // Lọc theo Tổ
        if (
          options.departmentId !== 'ALL' &&
          teacher.departmentId !== options.departmentId
        ) {
          return false;
        }

        // Lọc tìm kiếm giáo viên (Tên, Email, Mã GV)
        if (options.searchTeacher.trim()) {
          const q = options.searchTeacher.toLowerCase();
          const matchName = teacher.name.toLowerCase().includes(q);
          const matchEmail = teacher.email.toLowerCase().includes(q);
          const matchPos = teacher.position?.toLowerCase().includes(q) || false;
          if (!matchName && !matchEmail && !matchPos) {
            return false;
          }
        }

        const ev = storageService.getEvaluation(
          teacher.id,
          options.schoolYear,
          options.semester
        );

        // Lọc theo Mức xếp loại
        if (options.ratingLevel !== 'ALL' && ev.rating !== options.ratingLevel) {
          return false;
        }

        // Lọc theo Trạng thái hồ sơ
        if (options.evaluationStatus !== 'ALL') {
          const isCompleted =
            ev.status === 'DA_RA_SOAT' ||
            ev.status === 'DA_DUYET_CAP_TO' ||
            ev.status === 'BGH_APPROVED' ||
            ev.status === 'DA_KET_LUAN' ||
            ev.status === 'DA_KHOA' ||
            (ev.finalScore > 0 && ev.status !== 'CHUA_BAT_DAU');

          if (options.evaluationStatus === 'HOAN_THANH' && !isCompleted) return false;
          if (options.evaluationStatus === 'CHUA_HOAN_THANH' && isCompleted) return false;
          if (
            options.evaluationStatus === 'CHO_DUYET' &&
            ev.status !== 'CHO_TO_DUYET' &&
            ev.status !== 'CHO_BGH' &&
            ev.status !== 'CHO_HOI_DONG'
          ) {
            return false;
          }
          if (
            options.evaluationStatus === 'CAN_BO_SUNG' &&
            !ev.bghSupplementRequired &&
            !ev.bghExplanationRequired
          ) {
            return false;
          }
        }

        return true;
      })
      .map((teacher) => {
        const ev = storageService.getEvaluation(
          teacher.id,
          options.schoolYear,
          options.semester
        );
        const evidences = storageService.getTeacherEvidences(teacher.id);
        const approvedCount = evidences.filter(
          (e) =>
            e.status === 'TEAM_APPROVED' ||
            e.status === 'BGH_APPROVED' ||
            e.status === 'LOCKED'
        ).length;

        const isCompleted =
          ev.status === 'DA_RA_SOAT' ||
          ev.status === 'DA_DUYET_CAP_TO' ||
          ev.status === 'BGH_APPROVED' ||
          ev.status === 'DA_KET_LUAN' ||
          ev.status === 'DA_KHOA' ||
          (ev.finalScore > 0 && ev.status !== 'CHUA_BAT_DAU');

        let statusLabel = 'Chưa hoàn thành';
        if (ev.status === 'DA_RA_SOAT' || ev.status === 'BGH_APPROVED') statusLabel = 'BGH đã rà soát';
        else if (ev.status === 'DA_DUYET_CAP_TO') statusLabel = 'Tổ đã duyệt';
        else if (ev.status === 'CHO_BGH') statusLabel = 'Chờ BGH rà soát';
        else if (ev.status === 'CHO_TO_DUYET') statusLabel = 'Chờ tổ duyệt';
        else if (isCompleted) statusLabel = 'Đã hoàn thành';

        const notesArr: string[] = [];
        if (ev.isControlled) {
          notesArr.push(`Khống chế: max ${ev.controlledMaxRating || 'B'}`);
        }
        if (ev.discrepancyAlert) {
          notesArr.push('Chênh lệch ≥ 5đ');
        }
        if (ev.bonusPoints > 0) {
          notesArr.push(`+${ev.bonusPoints}đ`);
        }
        if (ev.deductionPoints > 0) {
          notesArr.push(`-${ev.deductionPoints}đ`);
        }

        return {
          teacher,
          evaluation: ev,
          departmentName: teacher.departmentName,
          evidencesCount: evidences.length,
          approvedEvidencesCount: approvedCount,
          bonusPoints: ev.bonusPoints || 0,
          deductionPoints: ev.deductionPoints || 0,
          finalScore: ev.finalScore || 0,
          rating: ev.rating || 'D',
          statusLabel,
          isCompleted,
          notes: notesArr.join(', ') || '---'
        };
      });
  }

  /**
   * 6. DỮ LIỆU BẢNG TỔNG HỢP PHỤ LỤC 06
   */
  public generateAppendix06Rows(
    teachers: User[],
    schoolYear = '2026-2027'
  ) {
    return teachers.map((teacher, index) => {
      const evHKI = storageService.getEvaluation(teacher.id, schoolYear, 'HKI');
      const evHKII = storageService.getEvaluation(teacher.id, schoolYear, 'HKII');
      const evYear = storageService.getEvaluation(teacher.id, schoolYear, 'CA_NAM');

      // Calculate combined score if available
      const hkiScore = evHKI ? evHKI.finalScore : 0;
      const hkiRating = evHKI ? this.formatRatingText(evHKI.rating) : '---';

      // Notes generator
      const notes: string[] = [];
      if (evHKI?.isControlled) {
        notes.push(`Bị khống chế thi đua: Mức ${evHKI.controlledMaxRating || 'B'}`);
      }
      if (evHKI?.discrepancyAlert) {
        notes.push('Chênh lệch điểm tự chấm và tổ chấm ≥ 5đ');
      }
      if (evHKI?.bonusPoints) {
        notes.push(`Cộng: +${evHKI.bonusPoints}đ thành tích`);
      }
      if (evHKI?.deductionPoints) {
        notes.push(`Trừ: -${evHKI.deductionPoints}đ vi phạm`);
      }

      return {
        stt: index + 1,
        name: teacher.name,
        position: teacher.position || 'Giáo viên',
        departmentName: teacher.departmentName,
        hkiScore,
        hkiRating,
        hkiiScore: evHKII?.finalScore ? evHKII.finalScore : '-',
        hkiiRating: evHKII?.finalScore ? this.formatRatingText(evHKII.rating) : 'Chưa xét',
        yearScore: evYear?.finalScore || hkiScore,
        yearRating: evYear?.finalScore ? this.formatRatingText(evYear.rating) : hkiRating,
        notes: notes.join(' • ') || 'Đủ điều kiện bình xét',
        rawEvaluation: evHKI
      };
    });
  }

  /**
   * 7. XUẤT EXCEL (.xlsx) ĐẦY ĐỦ VÀ HOÀN CHỈNH
   */
  public exportCompleteWorkbook(
    schoolYear = '2026-2027',
    semester = 'HKI'
  ): void {
    const teachers = this.getEligibleTeachers();
    const departments = storageService.getDepartments();
    const appendixRows = this.generateAppendix06Rows(teachers, schoolYear);
    const deptStats = this.getDepartmentStatistics(departments, teachers, schoolYear, semester);
    const ratingStats = this.getRatingStatistics(teachers, schoolYear, semester);
    const metrics = this.getDashboardMetrics(schoolYear, semester);

    const workbook = XLSX.utils.book_new();

    // Sheet 1: PHỤ LỤC 06 - BẢNG TỔNG HỢP THI ĐUA
    const sheet1Data = [
      ['TRƯỜNG TH&THCS NGUYỄN ĐÌNH ANH', '', '', '', '', '', '', '', '', ''],
      ['BẢNG TỔNG HỢP ĐIỂM VÀ XẾP LOẠI THI ĐUA NỘI BỘ (PHỤ LỤC 06)', '', '', '', '', '', '', '', '', ''],
      [`Năm học: ${schoolYear} • Học kỳ: ${semester} • Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, '', '', '', '', '', '', '', '', ''],
      [''],
      [
        'STT',
        'Họ và tên',
        'Vị trí việc làm',
        'Tổ chuyên môn',
        'Điểm HKI',
        'Mức HKI',
        'Điểm HKII',
        'Mức HKII',
        'Điểm Cả năm',
        'Mức Cả năm',
        'Ghi chú'
      ],
      ...appendixRows.map((r) => [
        r.stt,
        r.name,
        r.position,
        r.departmentName,
        r.hkiScore,
        r.hkiRating,
        r.hkiiScore,
        r.hkiiRating,
        r.yearScore,
        r.yearRating,
        r.notes
      ])
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    ws1['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 22 },
      { wch: 24 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws1, 'PhuLuc06_TongHop');

    // Sheet 2: THỐNG KÊ TOÀN TRƯỜNG & THEO TỔ (Mục 1, 2, 3)
    const sheet2Data = [
      ['BÁO CÁO THỐNG KÊ THI ĐUA TOÀN TRƯỜNG VÀ THEO TỔ'],
      [`Năm học: ${schoolYear} • Học kỳ: ${semester}`],
      [''],
      ['1. CHỈ SỐ DASHBOARD TOÀN TRƯỜNG'],
      ['Chỉ số', 'Số lượng', 'Đơn vị tính'],
      ['Tổng số giáo viên', metrics.totalTeachers, 'Người'],
      ['Tổng số tổ chuyên môn', metrics.totalDepartments, 'Tổ'],
      ['Tổng số minh chứng lưu trữ', metrics.totalEvidences, 'Minh chứng'],
      ['Minh chứng đã phê duyệt', metrics.approvedEvidences, 'Minh chứng'],
      ['Minh chứng chờ duyệt', metrics.pendingEvidences, 'Minh chứng'],
      ['Minh chứng yêu cầu bổ sung', metrics.revisionRequiredEvidences, 'Minh chứng'],
      ['Hồ sơ đánh giá hoàn thành', metrics.completedEvaluations, 'Hồ sơ'],
      ['Hồ sơ chưa hoàn thành', metrics.incompleteEvaluations, 'Hồ sơ'],
      [''],
      ['2. THỐNG KÊ MỨC XẾP LOẠI'],
      ['Mức xếp loại', 'Khoảng điểm', 'Số lượng', 'Tỷ lệ %'],
      ...ratingStats.map((rs) => [rs.label + ' (' + rs.subLabel + ')', rs.scoreRange, rs.count, `${rs.percentage}%`]),
      [''],
      ['3. THỐNG KÊ THEO TỔ (Không tự động xếp hạng các tổ)'],
      ['Tổ chuyên môn', 'Số giáo viên', 'Điểm trung bình', 'Số A+', 'Số A', 'Số B', 'Số C', 'Số D'],
      ...deptStats.map((ds) => [
        ds.departmentName,
        ds.teacherCount,
        ds.averageScore,
        ds.countAPlus,
        ds.countA,
        ds.countB,
        ds.countC,
        ds.countD
      ])
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    ws2['!cols'] = [
      { wch: 32 },
      { wch: 20 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, ws2, 'ThongKe_ToanTruong');

    // Download file
    const safeYear = schoolYear.replace(/[^\w-]/g, '_');
    XLSX.writeFile(
      workbook,
      `BaoCao_TongHopThiDua_${safeYear}_NguyenDinhAnh.xlsx`
    );
  }

  public formatRatingText(rating: RatingLevel): string {
    switch (rating) {
      case 'A_PLUS':
        return 'A+ (Xuất sắc nổi bật)';
      case 'A':
        return 'A (Hoàn thành xuất sắc)';
      case 'B':
        return 'B (Hoàn thành tốt)';
      case 'C':
        return 'C (Hoàn thành)';
      case 'D':
      default:
        return 'D (Chưa hoàn thành)';
    }
  }
}

export const reportsService = new ReportsService();
