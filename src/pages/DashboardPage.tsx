import React, { useState } from 'react';
import {
  Users,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  TrendingUp,
  FileCheck,
  FileSpreadsheet,
  Building,
  UploadCloud,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileText,
  Database,
  Lock,
  Sparkles,
  AlertOctagon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { User, EvidenceItem, normalizeRole } from '../types';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { getStatusLabel } from '../utils/formatters';
import { RlsSecurityInspectorModal } from '../components/RlsSecurityInspectorModal';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
  onOpenUpload: () => void;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onNavigate,
  onOpenUpload,
  onViewEvidence
}) => {
  const [showRlsInspector, setShowRlsInspector] = useState(false);
  const settings = storageService.getSettings();
  const allTeachers = storageService.getUsers().filter(
    (u) => u.role === 'TEACHER' || u.role === 'TEAM_LEADER' || u.role === 'GIAO_VIEN' || u.role === 'TO_TRUONG'
  );
  const departments = storageService.getDepartments();
  const evidences = storageService.getEvidences();

  // Metrics requested in Section 3
  const totalTeachers = allTeachers.length; // 10
  const totalDepartments = departments.length; // 3
  const totalEvidences = evidences.length; // 30
  const pendingEvidences = evidences.filter(
    (e) => e.status === 'SUBMITTED' || e.status === 'TEAM_REVIEW'
  ).length; // 8
  const approvedEvidences = evidences.filter(
    (e) => e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED' || e.status === 'LOCKED'
  ).length; // 16
  const revisionEvidences = evidences.filter((e) => e.status === 'REVISION_REQUIRED').length; // 4
  const rejectedEvidences = evidences.filter((e) => e.status === 'REJECTED').length; // 2

  // Progress metrics for "TIẾN ĐỘ THI ĐUA" (Section 3)
  const submitProgress = 85;
  const reviewProgress = Math.round((approvedEvidences / (totalEvidences || 1)) * 100);
  const evalProgress = 65;

  // Chart data by department
  const chartData = departments.map((dept) => {
    const deptEvidences = evidences.filter((e) => e.departmentId === dept.id);
    return {
      name: dept.name.replace('Tổ ', ''),
      'Đã duyệt': deptEvidences.filter(
        (e) => e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED' || e.status === 'LOCKED'
      ).length,
      'Chờ duyệt': deptEvidences.filter(
        (e) => e.status === 'SUBMITTED' || e.status === 'TEAM_REVIEW'
      ).length,
      'Cần bổ sung': deptEvidences.filter((e) => e.status === 'REVISION_REQUIRED').length
    };
  });

  // Recent 6 evidences
  const recentEvidences = evidences.slice(0, 6);
  const userRole = normalizeRole(currentUser.role);

  // Department-specific or Personal metrics
  const myEvidences = storageService.getTeacherEvidences(currentUser.id);
  const myEval = storageService.getEvaluation(currentUser.id);
  const deptEvidences = storageService.getDepartmentEvidences(currentUser.departmentId);
  const deptTeachers = allTeachers.filter((t) => t.departmentId === currentUser.departmentId);

  // RLS-scoped teacher list
  const rlsTeachers = databaseService.getTeachers(currentUser);

  return (
    <div className="space-y-6">
      {/* Welcome Banner Tailored by Role (Mục 8) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs px-3 py-1 rounded-full mb-3 backdrop-blur-md">
            <span>Năm học {settings.schoolYear}</span> • <span>Học kỳ I</span> • <span>{currentUser.departmentName}</span>
          </div>

          {/* Role-Specific Heading per Section 8 */}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            {userRole === 'GIAO_VIEN' && `Dashboard Giáo viên – ${currentUser.name}`}
            {userRole === 'TO_TRUONG' && `Dashboard Tổ trưởng – ${currentUser.departmentName}`}
            {userRole === 'TO_PHO' && `Dashboard Tổ phó chuyên môn – ${currentUser.departmentName}`}
            {userRole === 'BGH' && `Dashboard Ban Giám hiệu – Toàn trường`}
            {userRole === 'HOI_DONG_TDKT' && `Dashboard Hội đồng Thi đua – Khen thưởng`}
            {userRole === 'ADMIN' && `Dashboard Quản trị Hệ thống Toàn trường`}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            {userRole === 'GIAO_VIEN' &&
              `Chào mừng thầy/cô! Quản lý điểm tự chấm, nộp và tra cứu minh chứng số hóa theo Quy chế số 86/QC-TH&THCS-NDA.`}
            {userRole === 'TO_TRUONG' &&
              `Khu vực điều hành cấp tổ. Thẩm định minh chứng cho ${deptTeachers.length} giáo viên thuộc ${currentUser.departmentName}, bình xét thi đua học kỳ I.`}
            {userRole === 'TO_PHO' &&
              `Khu vực hỗ trợ điều hành chuyên môn cấp tổ. Hỗ trợ rà soát minh chứng, theo dõi tiến độ nộp hồ sơ của ${deptTeachers.length} giáo viên thuộc ${currentUser.departmentName}.`}
            {userRole === 'BGH' &&
              `Trung tâm chỉ đạo và giám sát thi đua toàn trường. Rà soát kết quả đánh giá 10 cán bộ giáo viên và xử lý chênh lệch điểm số.`}
            {userRole === 'HOI_DONG_TDKT' &&
              `Khu vực thẩm tra danh hiệu thi đua. Xem xét bảng tổng hợp xếp loại và bảo đảm cơ cấu tỷ lệ khen thưởng không vượt trần.`}
            {userRole === 'ADMIN' &&
              `Trung tâm quản trị kỹ thuật. Giám sát 11 tài khoản, 4 bảng CSDL Supabase, cấu hình năm học và trạng thái bảo vệ Row Level Security (RLS).`}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {userRole === 'GIAO_VIEN' ? (
              <>
                <button
                  onClick={onOpenUpload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" /> Nộp minh chứng của tôi
                </button>
                <button
                  onClick={() => onNavigate('evaluation')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" /> Phiếu tự chấm của tôi
                </button>
              </>
            ) : userRole === 'TO_TRUONG' || userRole === 'TO_PHO' ? (
              <>
                <button
                  onClick={() => onNavigate('team-evidence')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Thẩm định & Rà soát minh chứng tổ
                </button>
                <button
                  onClick={() => onNavigate('evaluation')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" /> Phiếu đánh giá cá nhân & Tổ
                </button>
                <button
                  onClick={() => onNavigate('reports')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Báo cáo thi đua tổ
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('reports')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" /> Báo cáo Phụ lục 06
                </button>
                <button
                  onClick={() => onNavigate('evaluation')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Rà soát điểm toàn trường
                </button>
              </>
            )}

            <button
              onClick={() => setShowRlsInspector(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" /> Kiểm tra RLS & Phân quyền
            </button>

            <button
              onClick={() => onNavigate('regulations')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
            >
              Xem Quy chế 2026–2027 &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 1: ROLE-SPECIFIC DASHBOARD SECTIONS (Mục 8: Dashboard theo vai trò) */}
      {/* ========================================================================= */}

      {/* 1. DASHBOARD GIÁO VIÊN */}
      {userRole === 'GIAO_VIEN' && (
        <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Khu vực nghiệp vụ cá nhân
              </span>
              <h2 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" /> Tình hình hồ sơ thi đua của {currentUser.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Hạn nộp minh chứng: {settings.evidenceDeadline}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div className="text-xs font-bold text-blue-700">Điểm tự chấm của tôi</div>
              <div className="text-2xl font-black text-blue-900 mt-1">{myEval?.selfTotal || 96.5} / 100</div>
              <div className="text-[11px] text-blue-600 mt-0.5">Xếp loại dự kiến: Loại A (Tốt)</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-700">Minh chứng đã nộp</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{myEvidences.length} file</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Lưu trữ trên Supabase Storage</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-700">Đã được phê duyệt</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {myEvidences.filter((e) => e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED').length} file
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Đạt chuẩn quy chế</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
              <div className="text-xs font-bold text-amber-700">Cần bổ sung / Chờ duyệt</div>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {myEvidences.filter((e) => e.status === 'REVISION_REQUIRED' || e.status === 'SUBMITTED').length} file
              </div>
              <div className="text-[11px] text-amber-600 mt-0.5">
                {myEvidences.filter((e) => e.status === 'REVISION_REQUIRED').length > 0 ? 'Có file cần bổ sung gấp' : 'Đang xử lý'}
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Chính sách RLS đảm bảo bạn chỉ xem và chỉnh sửa duy nhất hồ sơ cá nhân của mình.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('my-evidence')}
                className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Xem tất cả minh chứng của tôi &rarr;
              </button>
              <button
                onClick={() => onNavigate('evaluation')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Vào Phiếu chấm Phụ lục 01 &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DASHBOARD TỔ TRƯỞNG & TỔ PHÓ */}
      {(userRole === 'TO_TRUONG' || userRole === 'TO_PHO') && (
        <div className="bg-white rounded-3xl border border-indigo-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Khu vực điều hành chuyên môn cấp tổ
              </span>
              <h2 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Tình hình thi đua {currentUser.departmentName}
              </h2>
            </div>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
              {userRole === 'TO_PHO' ? `Tổ phó: ${currentUser.name}` : `Tổ trưởng: ${currentUser.name}`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
              <div className="text-xs font-bold text-indigo-700">Số giáo viên trong tổ</div>
              <div className="text-2xl font-black text-indigo-900 mt-1">{rlsTeachers.length} GV</div>
              <div className="text-[11px] text-indigo-600 mt-0.5">Giới hạn bởi Row Level Security</div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
              <div className="text-xs font-bold text-purple-700">Minh chứng tổ đã nộp</div>
              <div className="text-2xl font-black text-purple-900 mt-1">{deptEvidences.length} file</div>
              <div className="text-[11px] text-purple-600 mt-0.5">Từ các giáo viên trong tổ</div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div className="text-xs font-bold text-blue-700">Chờ tổ thẩm định</div>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {deptEvidences.filter((e) => e.status === 'SUBMITTED' || e.status === 'TEAM_REVIEW').length} file
              </div>
              <div className="text-[11px] text-blue-600 mt-0.5">Cần đối chiếu quy chế</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-700">Tiến độ chấm điểm tổ</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">75%</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Chuẩn bị họp bình xét</div>
            </div>
          </div>

          {/* Quick Department Teachers List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
              <span>Danh sách giáo viên thuộc tổ ({rlsTeachers.length} người)</span>
              <span className="text-[11px] text-slate-500 font-normal">RLS Policy: Chỉ hiển thị GV trong tổ</span>
            </div>
            <div className="divide-y divide-slate-100">
              {rlsTeachers.map((t) => (
                <div key={t.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-700">{t.ma_giao_vien}</span>
                    <span className="font-bold text-slate-900">{t.ho_ten}</span>
                    <span className="text-slate-500">{t.mon_day}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">{t.chuc_vu}</span>
                    <button
                      onClick={() => onNavigate('evaluation')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] cursor-pointer"
                    >
                      Chấm điểm tổ &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. DASHBOARD BAN GIÁM HIỆU */}
      {userRole === 'BGH' && (
        <div className="bg-white rounded-3xl border border-red-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Trung tâm điều hành Ban Giám hiệu
              </span>
              <h2 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <Building className="w-5 h-5 text-red-600" /> Giám sát công tác thi đua toàn trường
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full">
                Quyền BGH: Xem & Phê duyệt toàn trường
              </span>
            </div>
          </div>

          {/* Alert discrepancy if any */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-950">
                Cảnh báo Điều 22 Quy chế: Phát hiện 01 trường hợp chênh lệch điểm số ≥ 5.0 điểm
              </div>
              <p className="mt-1 text-amber-800 leading-relaxed">
                Giáo viên Vũ Hoàng Long (Tổ Toán - Tin - KHTN): Tự chấm 95.0 điểm, Tổ chuyên môn chấm 88.0 điểm (chênh lệch 7.0 điểm do chưa đủ minh chứng tiêu chí K2.2). Yêu cầu BGH rà soát trước khi chuyển Hội đồng TĐKT.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => onNavigate('evaluation')}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  Mở phiếu chấm để rà soát &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-700">Tổ chức họp bình xét</div>
              <div className="text-sm font-bold text-slate-900 mt-1">3 / 3 Tổ đã hoàn thành</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Biên bản đã nộp đầy đủ</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-700">Tỷ lệ minh chứng đạt chuẩn</div>
              <div className="text-sm font-bold text-emerald-700 mt-1">93.3% (28/30 file)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Đã qua 2 vòng thẩm tra</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-700">Dự kiến danh hiệu A+ (CSTĐ)</div>
              <div className="text-sm font-bold text-purple-700 mt-1">02 Giáo viên (20%)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Bảo đảm trần quy định</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DASHBOARD ADMIN */}
      {userRole === 'ADMIN' && (
        <div className="bg-white rounded-3xl border border-purple-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Trung tâm Quản trị Kỹ thuật & CSDL
              </span>
              <h2 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" /> Quản trị Hệ thống & Cấu hình Supabase
              </h2>
            </div>
            <button
              onClick={() => setShowRlsInspector(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" /> Mở công cụ kiểm tra RLS & Phân quyền
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
              <div className="text-xs font-bold text-purple-700">Tài khoản chuẩn hóa</div>
              <div className="text-2xl font-black text-purple-900 mt-1">11 Tài khoản</div>
              <div className="text-[11px] text-purple-600 mt-0.5">1 Admin, 1 BGH, 2 TT, 6 GV, 1 HĐ</div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div className="text-xs font-bold text-blue-700">Bảng CSDL Supabase</div>
              <div className="text-2xl font-black text-blue-900 mt-1">4 Bảng</div>
              <div className="text-[11px] text-blue-600 mt-0.5">teachers, depts, school_years, sem</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-700">Row Level Security (RLS)</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">ENABLED</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Bảo vệ ở tầng cơ sở dữ liệu</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-700">Cấu hình năm học</div>
              <div className="text-2xl font-black text-slate-900 mt-1">2026–2027</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Học kỳ I đang diễn ra</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DASHBOARD HỘI ĐỒNG TĐKT */}
      {userRole === 'HOI_DONG_TDKT' && (
        <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Thường trực Hội đồng Thi đua – Khen thưởng
              </span>
              <h2 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" /> Bảng thẩm tra kết quả xếp loại thi đua toàn trường
              </h2>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" /> Báo cáo Phụ lục 06 &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center">
              <div className="text-[11px] font-bold text-purple-700">Loại A+ (Xuất sắc)</div>
              <div className="text-xl font-black text-purple-900 mt-1">2 GV</div>
              <div className="text-[10px] text-purple-600 mt-0.5">20% (Đạt trần)</div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <div className="text-[11px] font-bold text-blue-700">Loại A (Tốt)</div>
              <div className="text-xl font-black text-blue-900 mt-1">6 GV</div>
              <div className="text-[10px] text-blue-600 mt-0.5">60%</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-[11px] font-bold text-emerald-700">Loại B (Hoàn thành)</div>
              <div className="text-xl font-black text-emerald-900 mt-1">2 GV</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">20%</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[11px] font-bold text-amber-700">Loại C (Cần cố gắng)</div>
              <div className="text-xl font-black text-amber-900 mt-1">0 GV</div>
              <div className="text-[10px] text-amber-600 mt-0.5">0%</div>
            </div>
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-center">
              <div className="text-[11px] font-bold text-red-700">Loại D (Không HT)</div>
              <div className="text-xl font-black text-red-900 mt-1">0 GV</div>
              <div className="text-[10px] text-red-600 mt-0.5">0%</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHỐI 2: 6 UNIVERSAL STAT CARDS (BƯỚC 1: GIỮ NGUYÊN TOÀN BỘ GIAO DIỆN)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Tổng số giáo viên */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tổng số GV</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalTeachers}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">3 tổ bộ môn</div>
        </div>

        {/* Card 2: Tổng số tổ */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tổng số tổ</span>
            <Building className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalDepartments}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tổ chuyên môn</div>
        </div>

        {/* Card 3: Tổng số minh chứng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tổng minh chứng</span>
            <FolderOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-2">{totalEvidences}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Đã nộp trên hệ thống</div>
        </div>

        {/* Card 4: Minh chứng chờ duyệt */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-xs font-bold">Chờ duyệt</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-2">{pendingEvidences}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Chờ tổ & BGH</div>
        </div>

        {/* Card 5: Minh chứng đã duyệt */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold">Đã duyệt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">{approvedEvidences}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Đạt yêu cầu chuẩn</div>
        </div>

        {/* Card 6: Minh chứng cần bổ sung */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold">Cần bổ sung</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{revisionEvidences}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Yêu cầu hoàn thiện</div>
        </div>
      </div>

      {/* KHU VỰC: "TIẾN ĐỘ THI ĐUA" (Section 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> TIẾN ĐỘ THI ĐUA NĂM HỌC 2026–2027
            </h2>
            <div className="text-xs text-slate-500">
              Định kỳ đánh giá Học kỳ I • Hạn chót nộp minh chứng: {settings.evidenceDeadline}
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            Hệ thống đang hoạt động ổn định
          </span>
        </div>

        {/* 3 Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Tiến độ nộp minh chứng */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">1. Tiến độ nộp minh chứng</span>
              <span className="text-blue-700 font-extrabold text-sm">{submitProgress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${submitProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1">
              <span>Đã nộp: 30 minh chứng</span>
              <span>Mục tiêu: 100% GV</span>
            </div>
          </div>

          {/* 2. Tiến độ duyệt */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">2. Tiến độ thẩm định & duyệt</span>
              <span className="text-emerald-700 font-extrabold text-sm">{reviewProgress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1">
              <span>Đã duyệt: {approvedEvidences}/30</span>
              <span>Chờ duyệt: {pendingEvidences}</span>
            </div>
          </div>

          {/* 3. Tiến độ hoàn thành đánh giá */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">3. Tiến độ hoàn thành đánh giá</span>
              <span className="text-indigo-700 font-extrabold text-sm">{evalProgress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${evalProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between pt-1">
              <span>Đã họp bình xét cấp tổ</span>
              <span>Chờ BGH rà soát</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Visual Chart & Department Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recharts Bar Chart: Minh chứng theo tổ và trạng thái */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800">
                Thống kê minh chứng theo 3 tổ chuyên môn
              </h3>
              <span className="text-xs text-slate-400">HKI 2026–2027</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Đã duyệt" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chờ duyệt" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cần bổ sung" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tổ Toán - Tin nộp nhiều minh chứng nhất (14 file)</span>
            <button
              onClick={() => onNavigate('team-evidence')}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Xem chi tiết tổ &rarr;
            </button>
          </div>
        </div>

        {/* Department Summary Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800">
                Tình hình thực hiện tại 3 tổ chuyên môn
              </h3>
              <span className="text-xs text-slate-400">10 Giáo viên</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tổ</th>
                    <th className="py-2.5 px-2 text-center">Số GV</th>
                    <th className="py-2.5 px-2 text-center">Minh chứng</th>
                    <th className="py-2.5 px-2 text-center text-emerald-700">Đã duyệt</th>
                    <th className="py-2.5 px-2 text-center text-blue-700">Chờ duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((d) => {
                    const deptE = evidences.filter((e) => e.departmentId === d.id);
                    const appE = deptE.filter(
                      (e) => e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED' || e.status === 'LOCKED'
                    ).length;
                    const penE = deptE.filter(
                      (e) => e.status === 'SUBMITTED' || e.status === 'TEAM_REVIEW'
                    ).length;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{d.name}</div>
                          <div className="text-[10px] text-slate-400">Tổ trưởng: {d.leaderName}</div>
                        </td>
                        <td className="py-3 px-2 text-center font-semibold text-slate-700">
                          {d.teacherCount}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-purple-700">
                          {deptE.length}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-700">
                          {appE}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-blue-700">
                          {penE}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cả 3 tổ đều đã triển khai nộp minh chứng</span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Bảng điểm Phụ lục 06 &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Evidences Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Minh chứng mới cập nhật gần đây
            </h3>
            <div className="text-xs text-slate-500">
              Hiển thị các tài liệu số hóa mới nhất trong tổng số 30 minh chứng
            </div>
          </div>
          <button
            onClick={() => onNavigate('my-evidence')}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Xem tất cả minh chứng &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">Mã</th>
                <th className="py-3 px-4 min-w-[200px]">Tên minh chứng</th>
                <th className="py-3 px-4 min-w-[150px]">Giáo viên</th>
                <th className="py-3 px-3 min-w-[140px]">Tổ chuyên môn</th>
                <th className="py-3 px-3 text-center w-32">Ngày nộp</th>
                <th className="py-3 px-3 text-center w-32">Trạng thái</th>
                <th className="py-3 px-4 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEvidences.map((item) => {
                const s = getStatusLabel(item.status);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 text-center font-bold text-blue-700">
                      {item.criteriaCode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div
                        onClick={() => onViewEvidence(item)}
                        className="cursor-pointer hover:text-blue-600 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-sm">{item.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        {item.fileName} • {item.fileSize}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {item.teacherName}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500">
                      {item.departmentName}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {item.uploadedAt.split(' ')[0]}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.bg} ${s.color} ${s.border}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onViewEvidence(item)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Xem file
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RLS Security Inspector Modal */}
      {showRlsInspector && (
        <RlsSecurityInspectorModal
          currentUser={currentUser}
          onClose={() => setShowRlsInspector(false)}
        />
      )}
    </div>
  );
};
