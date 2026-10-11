import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Building,
  School,
  Award,
  Users,
  FolderOpen,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  ChevronRight,
  User as UserIcon,
  Layers,
  FileText,
  BarChart3,
  PieChart,
  Table as TableIcon,
  ShieldAlert,
  Calendar,
  ExternalLink,
  Eye,
  Info
} from 'lucide-react';
import { User, RatingLevel, EvaluationStatus, Department } from '../types';
import { storageService } from '../services/storageService';
import { criteriaService } from '../services/criteriaService';
import {
  reportsService,
  ReportFilterOptions,
  SchoolDashboardMetrics,
  RatingStatItem,
  DepartmentStatItem,
  TeacherReportRow
} from '../services/reportsService';

interface ReportsViewProps {
  currentUser: User;
}

type ActiveTabType = 'DASHBOARD' | 'APPENDIX_06' | 'DEPARTMENT' | 'INDIVIDUAL';

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser }) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<ActiveTabType>('DASHBOARD');

  // Filter States (Mục 8)
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('2026-2027');
  const [selectedSemester, setSelectedSemester] = useState<'HKI' | 'HKII' | 'CA_NAM'>('HKI');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('ALL');
  const [searchTeacherQuery, setSearchTeacherQuery] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Selected for Department report (Mục 5)
  const [deptReportId, setDeptReportId] = useState<string>('dept-1');

  // Selected for Individual report (Mục 4)
  const [individualTeacherId, setIndividualTeacherId] = useState<string>('user-gv1');

  // Master Data
  const departments = storageService.getDepartments();
  const eligibleTeachers = useMemo(() => reportsService.getEligibleTeachers(), []);
  const allCriteria = useMemo(() => criteriaService.getAllCriteria(), []);
  const criteriaGroups = useMemo(() => criteriaService.getGroups(), []);

  // Filter Options Object
  const filterOptions: ReportFilterOptions = useMemo(
    () => ({
      schoolYear: selectedSchoolYear,
      semester: selectedSemester,
      departmentId: selectedDepartmentId,
      searchTeacher: searchTeacherQuery,
      ratingLevel: selectedRatingFilter,
      evaluationStatus: selectedStatusFilter
    }),
    [
      selectedSchoolYear,
      selectedSemester,
      selectedDepartmentId,
      searchTeacherQuery,
      selectedRatingFilter,
      selectedStatusFilter
    ]
  );

  // 1. Dashboard Metrics (Mục 1)
  const metrics: SchoolDashboardMetrics = useMemo(
    () => reportsService.getDashboardMetrics(selectedSchoolYear, selectedSemester),
    [selectedSchoolYear, selectedSemester]
  );

  // 2. Rating Statistics & Charts (Mục 2)
  const ratingStats: RatingStatItem[] = useMemo(
    () => reportsService.getRatingStatistics(eligibleTeachers, selectedSchoolYear, selectedSemester),
    [eligibleTeachers, selectedSchoolYear, selectedSemester]
  );

  // 3. Department Statistics (Mục 3)
  const deptStats: DepartmentStatItem[] = useMemo(
    () =>
      reportsService.getDepartmentStatistics(
        departments,
        eligibleTeachers,
        selectedSchoolYear,
        selectedSemester
      ),
    [departments, eligibleTeachers, selectedSchoolYear, selectedSemester]
  );

  // Filtered Teachers Rows
  const filteredTeacherRows: TeacherReportRow[] = useMemo(
    () => reportsService.filterTeacherReports(eligibleTeachers, filterOptions),
    [eligibleTeachers, filterOptions]
  );

  // 6. Appendix 06 Rows (Mục 6)
  const appendixRows = useMemo(
    () => reportsService.generateAppendix06Rows(eligibleTeachers, selectedSchoolYear),
    [eligibleTeachers, selectedSchoolYear]
  );

  // Filtered Appendix 06 Rows
  const filteredAppendixRows = useMemo(() => {
    return appendixRows.filter((r) => {
      const matchDept =
        selectedDepartmentId === 'ALL' ||
        eligibleTeachers.find((t) => t.name === r.name)?.departmentId === selectedDepartmentId;
      const matchSearch =
        !searchTeacherQuery.trim() ||
        r.name.toLowerCase().includes(searchTeacherQuery.toLowerCase()) ||
        r.position.toLowerCase().includes(searchTeacherQuery.toLowerCase());
      const rawEv = r.rawEvaluation;
      const matchRating =
        selectedRatingFilter === 'ALL' || (rawEv && rawEv.rating === selectedRatingFilter);
      return matchDept && matchSearch && matchRating;
    });
  }, [appendixRows, selectedDepartmentId, searchTeacherQuery, selectedRatingFilter, eligibleTeachers]);

  // Selected Teacher for Individual Report (Mục 4)
  const currentIndividualTeacher = useMemo(() => {
    return eligibleTeachers.find((t) => t.id === individualTeacherId) || eligibleTeachers[0];
  }, [eligibleTeachers, individualTeacherId]);

  const individualEvaluation = useMemo(() => {
    if (!currentIndividualTeacher) return null;
    return storageService.getEvaluation(currentIndividualTeacher.id, selectedSchoolYear, selectedSemester);
  }, [currentIndividualTeacher, selectedSchoolYear, selectedSemester]);

  const individualEvidences = useMemo(() => {
    if (!currentIndividualTeacher) return [];
    return storageService.getTeacherEvidences(currentIndividualTeacher.id);
  }, [currentIndividualTeacher]);

  const individualBonuses = useMemo(() => {
    if (!currentIndividualTeacher) return [];
    return storageService.getBonusList().filter((b) => b.teacherId === currentIndividualTeacher.id);
  }, [currentIndividualTeacher]);

  const individualDeductions = useMemo(() => {
    if (!currentIndividualTeacher) return [];
    return storageService.getDeductions().filter((d) => d.teacherId === currentIndividualTeacher.id);
  }, [currentIndividualTeacher]);

  // Selected Department for Department Report (Mục 5)
  const currentDept = useMemo(() => {
    return departments.find((d) => d.id === deptReportId) || departments[0];
  }, [departments, deptReportId]);

  const deptTeachersRows = useMemo(() => {
    return reportsService.filterTeacherReports(eligibleTeachers, {
      schoolYear: selectedSchoolYear,
      semester: selectedSemester,
      departmentId: deptReportId,
      searchTeacher: '',
      ratingLevel: 'ALL',
      evaluationStatus: 'ALL'
    });
  }, [eligibleTeachers, deptReportId, selectedSchoolYear, selectedSemester]);

  // Handlers
  const handleResetFilters = () => {
    setSelectedSchoolYear('2026-2027');
    setSelectedSemester('HKI');
    setSelectedDepartmentId('ALL');
    setSearchTeacherQuery('');
    setSelectedRatingFilter('ALL');
    setSelectedStatusFilter('ALL');
  };

  const handleExportExcel = () => {
    reportsService.exportCompleteWorkbook(selectedSchoolYear, selectedSemester);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper formatting badges
  const getRatingBadge = (rating?: RatingLevel) => {
    switch (rating) {
      case 'A_PLUS':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1 shadow-2xs">
            ★ A+ (Nổi bật)
          </span>
        );
      case 'A':
        return (
          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1">
            ✓ A (Xuất sắc)
          </span>
        );
      case 'B':
        return (
          <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1">
            B (Tốt)
          </span>
        );
      case 'C':
        return (
          <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1">
            C (Hoàn thành)
          </span>
        );
      case 'D':
      default:
        return (
          <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1">
            D (Chưa đạt)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & EXPORT ACTIONS (Mục 7: Excel, PDF, Print A4) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Hệ thống Báo cáo & Thống kê Thi đua Hoàn chỉnh (Phụ lục 06)
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Trung tâm Báo cáo & Thống kê Thi đua Toàn trường
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dashboard 8 chỉ số • Biểu đồ 5 mức xếp loại • Thống kê theo tổ • Báo cáo cá nhân • Bảng tổng hợp Phụ lục 06
          </p>
        </div>

        {/* Action Buttons (Mục 7) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            title="In trang báo cáo ra khổ giấy A4 chuẩn hành chính"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" /> In trực tiếp A4
          </button>

          <button
            onClick={handlePrint}
            title="Tải hoặc xem dưới dạng PDF khổ A4"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-bold shadow-2xs cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-purple-600" /> Tải PDF A4
          </button>

          <button
            onClick={handleExportExcel}
            title="Xuất dữ liệu toàn diện ra file Excel (.xlsx)"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất file Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. BỘ LỌC ĐA TIÊU CHÍ (Mục 8: Năm học, Học kỳ, Tổ, Giáo viên, Xếp loại, Trạng thái) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-100 text-blue-700">
              <Filter className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Bộ lọc dữ liệu báo cáo đa tiêu chí (Mục 8)
            </span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Đặt lại mặc định
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* 1. Năm học */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Năm học:</label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="2026-2027">Năm học 2026–2027</option>
              <option value="2025-2026">Năm học 2025–2026</option>
            </select>
          </div>

          {/* 2. Học kỳ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Học kỳ:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="HKI">Học kỳ I</option>
              <option value="HKII">Học kỳ II</option>
              <option value="CA_NAM">Cả năm học</option>
            </select>
          </div>

          {/* 3. Tổ chuyên môn */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tổ chuyên môn:</label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả các tổ ({eligibleTeachers.length} GV)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Tìm kiếm Giáo viên */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tìm giáo viên:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tên, mã GV..."
                value={searchTeacherQuery}
                onChange={(e) => setSearchTeacherQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>

          {/* 5. Mức xếp loại */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Mức xếp loại:</label>
            <select
              value={selectedRatingFilter}
              onChange={(e) => setSelectedRatingFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả mức</option>
              <option value="A_PLUS">Loại A+ (95 - 100đ)</option>
              <option value="A">Loại A (90 - 94.5đ)</option>
              <option value="B">Loại B (80 - 89.5đ)</option>
              <option value="C">Loại C (65 - 79.5đ)</option>
              <option value="D">Loại D (&lt; 65đ)</option>
            </select>
          </div>

          {/* 6. Trạng thái hồ sơ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trạng thái hồ sơ:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="HOAN_THANH">Đã hoàn thành</option>
              <option value="CHUA_HOAN_THANH">Chưa hoàn thành</option>
              <option value="CHO_DUYET">Chờ duyệt / rà soát</option>
              <option value="CAN_BO_SUNG">Cần bổ sung minh chứng</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION SUB-TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center border-b border-slate-200 gap-2 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'DASHBOARD'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> 1. Dashboard Toàn trường & Thống kê
        </button>

        <button
          onClick={() => setActiveTab('APPENDIX_06')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'APPENDIX_06'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> 2. Bảng Tổng hợp (Phụ lục 06)
        </button>

        <button
          onClick={() => setActiveTab('DEPARTMENT')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'DEPARTMENT'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" /> 3. Báo cáo theo Tổ
        </button>

        <button
          onClick={() => setActiveTab('INDIVIDUAL')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'INDIVIDUAL'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" /> 4. Báo cáo Cá nhân
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD TOÀN TRƯỜNG & THỐNG KÊ (Mục 1, 2, 3) */}
      {/* ========================================================================= */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* MỤC 1: 8 CHỈ SỐ DASHBOARD TOÀN TRƯỜNG */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1 rounded-md bg-blue-100 text-blue-700">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                1. Dashboard Toàn trường – 8 Chỉ số Thi đua Cốt lõi
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {/* 1. Tổng giáo viên */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Tổng GV</div>
                <div className="text-2xl font-black text-slate-900">{metrics.totalTeachers}</div>
                <div className="text-[10px] text-slate-500 font-medium">Toàn trường</div>
              </div>

              {/* 2. Tổng tổ */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Tổng tổ</div>
                <div className="text-2xl font-black text-indigo-700">{metrics.totalDepartments}</div>
                <div className="text-[10px] text-slate-500 font-medium">Tổ chuyên môn</div>
              </div>

              {/* 3. Tổng minh chứng */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Tổng MC</div>
                <div className="text-2xl font-black text-blue-700">{metrics.totalEvidences}</div>
                <div className="text-[10px] text-slate-500 font-medium">Hồ sơ đã nộp</div>
              </div>

              {/* 4. Minh chứng đã duyệt */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-emerald-800 uppercase">MC đã duyệt</div>
                <div className="text-2xl font-black text-emerald-700">{metrics.approvedEvidences}</div>
                <div className="text-[10px] text-emerald-700 font-medium">Đạt chuẩn</div>
              </div>

              {/* 5. Minh chứng chờ duyệt */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-blue-800 uppercase">MC chờ duyệt</div>
                <div className="text-2xl font-black text-blue-700">{metrics.pendingEvidences}</div>
                <div className="text-[10px] text-blue-700 font-medium">Đang xử lý</div>
              </div>

              {/* 6. Minh chứng cần bổ sung */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-amber-800 uppercase">Cần bổ sung</div>
                <div className="text-2xl font-black text-amber-700">{metrics.revisionRequiredEvidences}</div>
                <div className="text-[10px] text-amber-700 font-medium">Nhiệm vụ mở</div>
              </div>

              {/* 7. Hồ sơ hoàn thành */}
              <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-purple-800 uppercase">Hoàn thành</div>
                <div className="text-2xl font-black text-purple-700">{metrics.completedEvaluations}</div>
                <div className="text-[10px] text-purple-700 font-medium">Đã kết luận</div>
              </div>

              {/* 8. Hồ sơ chưa hoàn thành */}
              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-rose-800 uppercase">Chưa xong</div>
                <div className="text-2xl font-black text-rose-700">{metrics.incompleteEvaluations}</div>
                <div className="text-[10px] text-rose-700 font-medium">Chờ hoàn thiện</div>
              </div>
            </div>
          </div>

          {/* MỤC 2: THỐNG KÊ MỨC XẾP LOẠI (A+, A, B, C, D) & BIỂU ĐỒ */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  2. Thống kê & Biểu đồ Tỷ trọng 5 Mức Xếp loại (A+, A, B, C, D)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thang điểm chuẩn: A+ (95–100đ), A (90–94.5đ), B (80–89.5đ), C (65–79.5đ), D (&lt;65đ)
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
                Tổng số: {eligibleTeachers.length} Giáo viên
              </span>
            </div>

            {/* Stacked Proportional Bar (Biểu đồ dải tỷ trọng 100%) */}
            <div className="space-y-1.5">
              <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {ratingStats.map((item) => (
                  <div
                    key={item.rating}
                    style={{ width: `${item.percentage}%` }}
                    className={`${item.bgClass} transition-all duration-500 hover:opacity-90 relative group`}
                    title={`${item.label} (${item.subLabel}): ${item.count} GV (${item.percentage}%)`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>0%</span>
                <span>Phân bố tỷ lệ thi đua toàn trường</span>
                <span>100%</span>
              </div>
            </div>

            {/* Detailed Visual Bar Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
              {ratingStats.map((item) => (
                <div
                  key={item.rating}
                  className={`p-4 rounded-xl border ${item.borderClass} bg-slate-50/50 flex flex-col justify-between space-y-3 hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${item.bgClass} text-white`}>
                      {item.label}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{item.scoreRange}</span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{item.count}</span>
                      <span className="text-xs font-black text-slate-600">{item.percentage}%</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.subLabel}</div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.bgClass} rounded-full`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MỤC 3: THỐNG KÊ THEO TỔ */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  3. Thống kê Thi đua theo Tổ Chuyên môn (Mục 3)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tổng hợp số giáo viên, điểm trung bình và số lượng từng mức xếp loại của từng tổ
                </p>
              </div>

              {/* Quy định: Không tự động xếp hạng các tổ */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Quy chế: Không tự động xếp hạng các tổ</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="py-3 px-4">Tổ chuyên môn</th>
                    <th className="py-3 px-3 text-center">Số giáo viên</th>
                    <th className="py-3 px-3 text-center bg-blue-50/70 text-blue-900">Điểm trung bình</th>
                    <th className="py-3 px-3 text-center text-amber-800 bg-amber-50/50">Số A+</th>
                    <th className="py-3 px-3 text-center text-emerald-800 bg-emerald-50/50">Số A</th>
                    <th className="py-3 px-3 text-center text-blue-800 bg-blue-50/50">Số B</th>
                    <th className="py-3 px-3 text-center text-purple-800 bg-purple-50/50">Số C</th>
                    <th className="py-3 px-3 text-center text-rose-800 bg-rose-50/50">Số D</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptStats.map((ds) => (
                    <tr key={ds.departmentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ds.departmentName}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                        {ds.teacherCount} GV
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-blue-900 bg-blue-50/30 text-sm">
                        {ds.averageScore}đ
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-amber-900 bg-amber-50/20">
                        {ds.countAPlus}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-900 bg-emerald-50/20">
                        {ds.countA}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-blue-900 bg-blue-50/20">
                        {ds.countB}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-purple-900 bg-purple-50/20">
                        {ds.countC}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-rose-900 bg-rose-50/20">
                        {ds.countD}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Grand Total Footer */}
                <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="py-3 px-4 uppercase">Tổng cộng toàn trường</td>
                    <td className="py-3 px-3 text-center">{eligibleTeachers.length} GV</td>
                    <td className="py-3 px-3 text-center text-blue-950 text-sm">
                      {Math.round(
                        (deptStats.reduce((acc, d) => acc + d.averageScore * d.teacherCount, 0) /
                          (eligibleTeachers.length || 1)) *
                          10
                      ) / 10}
                      đ
                    </td>
                    <td className="py-3 px-3 text-center text-amber-900">
                      {deptStats.reduce((acc, d) => acc + d.countAPlus, 0)}
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-900">
                      {deptStats.reduce((acc, d) => acc + d.countA, 0)}
                    </td>
                    <td className="py-3 px-3 text-center text-blue-900">
                      {deptStats.reduce((acc, d) => acc + d.countB, 0)}
                    </td>
                    <td className="py-3 px-3 text-center text-purple-900">
                      {deptStats.reduce((acc, d) => acc + d.countC, 0)}
                    </td>
                    <td className="py-3 px-3 text-center text-rose-900">
                      {deptStats.reduce((acc, d) => acc + d.countD, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BẢNG TỔNG HỢP THEO PHỤ LỤC 06 (Mục 6, 7) */}
      {/* ========================================================================= */}
      {activeTab === 'APPENDIX_06' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Printable Official Header */}
          <div className="border-b border-slate-200 pb-6 text-center space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 uppercase font-semibold">
              <div>
                PHÒNG GD&ĐT HUYỆN / THÀNH PHỐ<br />
                <strong className="text-slate-900 font-extrabold">TRƯỜNG TH&THCS NGUYỄN ĐÌNH ANH</strong>
              </div>
              <div className="mt-2 sm:mt-0 text-center">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
                <span className="font-bold underline text-slate-800">Độc lập - Tự do - Hạnh phúc</span>
              </div>
            </div>

            <div className="pt-4">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded">
                Phụ lục 06 (Kèm theo Quy chế số 86/QC-TH&THCS-NDA)
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase mt-2">
                BẢNG TỔNG HỢP ĐIỂM VÀ XẾP LOẠI THI ĐUA NỘI BỘ NĂM HỌC {selectedSchoolYear}
              </h2>
              <div className="text-xs text-slate-500 italic">
                Thời điểm lập báo cáo: {new Date().toLocaleDateString('vi-VN')} • Học kỳ: {selectedSemester}
              </div>
            </div>
          </div>

          {/* Appendix 06 Main Table (Mục 6: STT, Họ tên, Vị trí, HKI, HKII, Cả năm, Ghi chú) */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-300 uppercase">
                <tr>
                  <th className="border border-slate-300 py-3 px-2 w-12" rowSpan={2}>STT</th>
                  <th className="border border-slate-300 py-3 px-3 min-w-[170px]" rowSpan={2}>Họ và tên</th>
                  <th className="border border-slate-300 py-3 px-3 min-w-[150px]" rowSpan={2}>Vị trí việc làm</th>
                  <th className="border border-slate-300 py-2 px-2" colSpan={2}>Học kỳ I</th>
                  <th className="border border-slate-300 py-2 px-2" colSpan={2}>Học kỳ II</th>
                  <th className="border border-slate-300 py-2 px-2 bg-amber-50" colSpan={2}>Cả năm</th>
                  <th className="border border-slate-300 py-3 px-3 min-w-[170px]" rowSpan={2}>Ghi chú</th>
                </tr>
                <tr>
                  <th className="border border-slate-300 py-2 px-2 w-16">Điểm</th>
                  <th className="border border-slate-300 py-2 px-2 w-20">Mức</th>
                  <th className="border border-slate-300 py-2 px-2 w-16 text-slate-400">Điểm</th>
                  <th className="border border-slate-300 py-2 px-2 w-20 text-slate-400">Mức</th>
                  <th className="border border-slate-300 py-2 px-2 w-16 bg-amber-50 font-black">Điểm</th>
                  <th className="border border-slate-300 py-2 px-2 w-20 bg-amber-50 font-black">Mức</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppendixRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="border border-slate-300 py-3 px-2 text-center text-slate-500 font-medium">
                      {r.stt}
                    </td>
                    <td className="border border-slate-300 py-3 px-3">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[10px] text-slate-400">{r.departmentName}</div>
                    </td>
                    <td className="border border-slate-300 py-3 px-3 text-slate-700">
                      {r.position}
                    </td>

                    {/* HKI */}
                    <td className="border border-slate-300 py-3 px-2 text-center font-bold text-blue-900">
                      {r.hkiScore}
                    </td>
                    <td className="border border-slate-300 py-3 px-2 text-center">
                      {getRatingBadge(r.rawEvaluation?.rating)}
                    </td>

                    {/* HKII */}
                    <td className="border border-slate-300 py-3 px-2 text-center text-slate-400">
                      {r.hkiiScore}
                    </td>
                    <td className="border border-slate-300 py-3 px-2 text-center text-slate-400 text-[10px]">
                      {r.hkiiRating}
                    </td>

                    {/* Full Year */}
                    <td className="border border-slate-300 py-3 px-2 text-center font-black text-amber-950 bg-amber-50/50">
                      {r.yearScore}
                    </td>
                    <td className="border border-slate-300 py-3 px-2 text-center bg-amber-50/50">
                      {getRatingBadge(r.rawEvaluation?.rating)}
                    </td>

                    {/* Ghi chú */}
                    <td className="border border-slate-300 py-3 px-3 text-[11px] text-slate-600">
                      {r.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Printable Sign-off lines */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs print-break-inside-avoid">
            <div>
              <div className="font-bold uppercase text-slate-900">THƯ KÝ HỘI ĐỒNG</div>
              <div className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-bold text-slate-800">Lê Thị Mai</div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900">PHÓ CHỦ TỊCH HỘI ĐỒNG TĐKT</div>
              <div className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-bold text-slate-800">Phạm Minh Trang</div>
            </div>

            <div>
              <div className="font-bold uppercase text-slate-900">HIỆU TRƯỞNG</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, đóng dấu và ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-bold text-slate-800">Trần Đình Trọng</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BÁO CÁO THEO TỔ (Mục 5: Danh sách giáo viên, Điểm, Xếp loại, Trạng thái) */}
      {/* ========================================================================= */}
      {activeTab === 'DEPARTMENT' && (
        <div className="space-y-5">
          {/* Department Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">Báo cáo theo Tổ (Mục 5)</span>
                <h3 className="text-lg font-black text-slate-900">{currentDept.name}</h3>
                <p className="text-xs text-slate-500">
                  Tổ trưởng: <strong>{currentDept.leaderName}</strong> • Quy mô: {deptTeachersRows.length} Giáo viên
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Chọn tổ:</span>
              <select
                value={deptReportId}
                onChange={(e) => setDeptReportId(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department Printable Container */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4 text-center">
              <h2 className="text-base font-black text-slate-900 uppercase">
                BÁO CÁO KẾT QUẢ THI ĐUA {currentDept.name.toUpperCase()}
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Năm học: {selectedSchoolYear} • Học kỳ: {selectedSemester}
              </div>
            </div>

            {/* Teacher List Table (Mục 5) */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-4 min-w-[200px]">Danh sách giáo viên</th>
                    <th className="py-3 px-3 text-center">Điểm tự chấm</th>
                    <th className="py-3 px-3 text-center">Điểm tổ chấm</th>
                    <th className="py-3 px-3 text-center">Điểm BGH</th>
                    <th className="py-3 px-3 text-center bg-blue-50/70 text-blue-900">Điểm cuối</th>
                    <th className="py-3 px-3 text-center">Xếp loại</th>
                    <th className="py-3 px-4 text-center">Trạng thái hồ sơ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptTeachersRows.map((row, idx) => (
                    <tr key={`report-row-${row.teacher.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{row.teacher.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {row.teacher.position} • {row.teacher.subjects.join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                        {row.evaluation.selfTotal}đ
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-indigo-700">
                        {row.evaluation.teamTotal}đ
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-emerald-700">
                        {row.evaluation.bghTotal || '---'}
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-blue-900 bg-blue-50/30 text-sm">
                        {row.finalScore}đ
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {getRatingBadge(row.rating)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                            row.isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {row.isCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                          {row.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Department Sign-off */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs print-break-inside-avoid">
              <div>
                <div className="font-bold uppercase text-slate-900">TỔ TRƯỞNG CHUYÊN MÔN</div>
                <div className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-bold text-slate-800">{currentDept.leaderName}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-900">BAN GIÁM HIỆU PHÊ DUYỆT</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, đóng dấu và ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-bold text-slate-800">Trần Đình Trọng</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BÁO CÁO CÁ NHÂN (Mục 4: Điểm tiêu chí, Minh chứng, Cộng, Trừ, Nhận xét, Kết quả) */}
      {/* ========================================================================= */}
      {activeTab === 'INDIVIDUAL' && currentIndividualTeacher && individualEvaluation && (
        <div className="space-y-6">
          {/* Teacher Selector Card (no-print) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                {currentIndividualTeacher.name.split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase">Báo cáo Cá nhân (Mục 4)</span>
                <h3 className="text-lg font-black text-slate-900">{currentIndividualTeacher.name}</h3>
                <p className="text-xs text-slate-500">
                  {currentIndividualTeacher.position} • {currentIndividualTeacher.departmentName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Chọn giáo viên:</span>
              <select
                value={individualTeacherId}
                onChange={(e) => setIndividualTeacherId(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-1 focus:ring-purple-500"
              >
                {eligibleTeachers.map((t, idx) => (
                  <option key={`report-tch-${t.id}-${idx}`} value={t.id}>
                    {t.name} ({t.departmentName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Individual Report Document */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header Form */}
            <div className="border-b border-slate-200 pb-5 text-center space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-semibold">
                <span>TRƯỜNG TH&THCS NGUYỄN ĐÌNH ANH</span>
                <span>MẪU BÁO CÁO CÁ NHÂN A4</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase pt-2">
                BÁO CÁO ĐÁNH GIÁ THI ĐUA CÁ NHÂN
              </h2>
              <div className="text-xs text-slate-600 font-semibold">
                Họ và tên: <strong className="text-slate-900">{currentIndividualTeacher.name}</strong> • Chức vụ: {currentIndividualTeacher.position} • Tổ: {currentIndividualTeacher.departmentName}
              </div>
              <div className="text-xs text-slate-500 italic">
                Năm học: {selectedSchoolYear} • Học kỳ: {selectedSemester}
              </div>
            </div>

            {/* Summary Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <span className="text-[11px] font-bold text-blue-700 block uppercase">Điểm tự chấm</span>
                <span className="text-xl font-black text-blue-900">{individualEvaluation.selfTotal}đ</span>
              </div>
              <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                <span className="text-[11px] font-bold text-indigo-700 block uppercase">Điểm tổ chấm</span>
                <span className="text-xl font-black text-indigo-900">{individualEvaluation.teamTotal}đ</span>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[11px] font-bold text-emerald-700 block uppercase">Điểm cuối cùng</span>
                <span className="text-xl font-black text-emerald-900">{individualEvaluation.finalScore}đ</span>
              </div>
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-[11px] font-bold text-amber-700 block uppercase">Xếp loại</span>
                <span className="text-xl font-black text-amber-900">{individualEvaluation.rating}</span>
              </div>
            </div>

            {/* Controlled warning banner (nếu có) */}
            {individualEvaluation.isControlled && (
              <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <strong>Bị khống chế theo điều kiện thi đua:</strong> Mức xếp loại tối đa là{' '}
                  <strong>{individualEvaluation.controlledMaxRating || 'B'}</strong>. Lý do: {individualEvaluation.controlledReason || 'Theo quyết định thi đua.'}
                </div>
              </div>
            )}

            {/* 1. ĐIỂM TỪNG TIÊU CHÍ (6 Nhóm) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-blue-600" />
                1. Điểm chi tiết từng tiêu chí thi đua (100 điểm)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center">Mã</th>
                      <th className="py-2.5 px-4">Nội dung tiêu chí</th>
                      <th className="py-2.5 px-3 w-20 text-center">Tối đa</th>
                      <th className="py-2.5 px-3 w-20 text-center">Tự chấm</th>
                      <th className="py-2.5 px-3 w-20 text-center">Tổ chấm</th>
                      <th className="py-2.5 px-3 w-20 text-center">BGH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteriaGroups.map((group) => {
                      const groupCrits = allCriteria.filter((c) => c.group_id === group.id && c.is_active);
                      return (
                        <React.Fragment key={group.id}>
                          <tr className="bg-slate-100/70 font-extrabold text-slate-900 border-y border-slate-200">
                            <td colSpan={2} className="py-2 px-3 uppercase text-blue-900">
                              {group.ten_nhom}
                            </td>
                            <td className="py-2 px-3 text-center text-blue-900">{group.diem_toi_da}đ</td>
                            <td colSpan={3} className="py-2 px-3 text-[11px] text-slate-500 italic">
                              {group.mo_ta}
                            </td>
                          </tr>
                          {groupCrits.map((crit) => {
                            const sc = individualEvaluation.scores[crit.id] || {
                              selfScore: 0,
                              teamScore: 0,
                              bghScore: 0
                            };
                            return (
                              <tr key={crit.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="py-2 px-3 text-center font-bold text-slate-600">{crit.ma_tieu_chi}</td>
                                <td className="py-2 px-4 text-slate-800">{crit.ten_tieu_chi}</td>
                                <td className="py-2 px-3 text-center font-semibold text-slate-600">{crit.diem_toi_da}</td>
                                <td className="py-2 px-3 text-center font-bold text-blue-700">{sc.selfScore ?? 0}</td>
                                <td className="py-2 px-3 text-center font-bold text-indigo-700">{sc.teamScore ?? 0}</td>
                                <td className="py-2 px-3 text-center font-bold text-emerald-700">{sc.bghScore ?? 0}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. MINH CHỨNG */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                2. Danh sách hồ sơ minh chứng đính kèm ({individualEvidences.length})
              </h3>
              {individualEvidences.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-3 w-12 text-center">STT</th>
                        <th className="py-2 px-4">Tên minh chứng</th>
                        <th className="py-2 px-3 text-center">Tiêu chí</th>
                        <th className="py-2 px-3">Tệp đính kèm / Phiên bản</th>
                        <th className="py-2 px-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {individualEvidences.map((ev, idx) => (
                        <tr key={ev.id}>
                          <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-4 font-semibold text-slate-900">{ev.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">
                            {ev.criteriaCode}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                            {ev.fileName} {ev.currentVersion ? `(Version ${ev.currentVersion})` : ''}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {ev.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs italic">
                  Chưa có hồ sơ minh chứng nào được đính kèm.
                </div>
              )}
            </div>

            {/* 3 & 4: ĐIỂM CỘNG VÀ ĐIỂM TRỪ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Điểm cộng */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <span className="text-xs font-black text-emerald-900 uppercase block">
                  3. Điểm cộng thành tích (+{individualEvaluation.bonusPoints || 0}đ)
                </span>
                {individualBonuses.length > 0 ? (
                  <div className="space-y-1.5 text-xs">
                    {individualBonuses.map((b) => (
                      <div key={b.id} className="bg-white p-2 rounded-lg border border-emerald-200">
                        <div className="font-bold text-emerald-900 flex justify-between">
                          <span>{b.title}</span>
                          <span className="font-black text-emerald-700">+{b.points}đ</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {b.categoryLabel} • Minh chứng: {b.evidenceName || 'Hồ sơ khen thưởng'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs italic">Không có điểm cộng trong kỳ này.</div>
                )}
              </div>

              {/* Điểm trừ */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                <span className="text-xs font-black text-rose-900 uppercase block">
                  4. Điểm trừ vi phạm (-{individualEvaluation.deductionPoints || 0}đ)
                </span>
                {individualDeductions.length > 0 ? (
                  <div className="space-y-1.5 text-xs">
                    {individualDeductions.map((d) => (
                      <div key={d.id} className="bg-white p-2 rounded-lg border border-rose-200">
                        <div className="font-bold text-rose-900 flex justify-between">
                          <span>{d.reason}</span>
                          <span className="font-black text-rose-700">-{d.points}đ</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Căn cứ: {d.evidenceBasis || 'Biên bản kiểm tra'} • Xác nhận: {d.verifiedBy}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs italic">Không có điểm trừ vi phạm trong kỳ này.</div>
                )}
              </div>
            </div>

            {/* 5. NHẬN XÉT CỦA TỔ TRƯỞNG & BGH */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                5. Ý kiến nhận xét & Kết luận đánh giá
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-800 block">Ý kiến của Tổ trưởng chuyên môn:</span>
                  <p className="text-slate-700 italic">
                    "{individualEvaluation.teamComment || 'Hoàn thành các nhiệm vụ chuyên môn theo kế hoạch.'}"
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-800 block">Ý kiến của Ban Giám hiệu:</span>
                  <p className="text-slate-700 italic">
                    "{individualEvaluation.bghComment || 'Nhất trí với kết quả đánh giá của tổ chuyên môn.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* 6. KẾT QUẢ XẾP LOẠI CHUNG CUỘC */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block">
                  6. Kết quả Xếp loại Thi đua Cuối cùng (Mục 4)
                </span>
                <div className="text-sm font-medium mt-1">
                  Công thức: Điểm cơ bản ({individualEvaluation.bghTotal || individualEvaluation.teamTotal || individualEvaluation.selfTotal}đ) + Điểm cộng ({individualEvaluation.bonusPoints || 0}đ) - Điểm trừ ({individualEvaluation.deductionPoints || 0}đ) = <strong>{individualEvaluation.finalScore}đ</strong>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Điểm thi đua</span>
                  <span className="text-2xl font-black text-emerald-400">{individualEvaluation.finalScore}đ</span>
                </div>
                <div className="text-right pl-3 border-l border-slate-700">
                  <span className="text-xs text-slate-400 block">Xếp loại</span>
                  <span className="text-2xl font-black text-amber-400">{individualEvaluation.rating}</span>
                </div>
              </div>
            </div>

            {/* Individual Printable Sign-off */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs print-break-inside-avoid">
              <div>
                <div className="font-bold uppercase text-slate-900">GIÁO VIÊN TỰ ĐÁNH GIÁ</div>
                <div className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-bold text-slate-800">{currentIndividualTeacher.name}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-900">TỔ TRƯỞNG CHUYÊN MÔN</div>
                <div className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-bold text-slate-800">Lê Thị Mai</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-900">HIỆU TRƯỞNG PHÊ DUYỆT</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, đóng dấu và ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-bold text-slate-800">Trần Đình Trọng</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
