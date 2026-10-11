import React from 'react';
import {
  Users,
  FolderCheck,
  Clock,
  AlertTriangle,
  Award,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { User, RatingLevel } from '../types';
import { storageService } from '../services/storageService';
import { CRITERIA_GROUPS } from '../data/criteriaData';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (tab: string, params?: any) => void;
  onOpenUpload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onOpenUpload
}) => {
  const isTeacherOnly = currentUser.role === 'TEACHER';
  const settings = storageService.getSettings();
  const allUsers = storageService.getUsers().filter((u) => u.role === 'TEACHER' || u.role === 'TEAM_LEADER');
  const allDepartments = storageService.getDepartments();
  const allEvidences = storageService.getEvidences();
  const allEvaluations = storageService.getEvaluations();

  // Metrics for School / Department
  const totalStaff = storageService.getUsers().length;
  const totalTeachers = allUsers.length;
  const totalEvidences = allEvidences.length;
  const pendingEvidences = allEvidences.filter(
    (e) => e.status === 'SUBMITTED' || e.status === 'TEAM_REVIEW' || e.status === 'BGH_REVIEW'
  ).length;
  const approvedEvidences = allEvidences.filter(
    (e) => e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED' || e.status === 'LOCKED'
  ).length;
  const revisionEvidences = allEvidences.filter((e) => e.status === 'REVISION_REQUIRED').length;
  const rejectedEvidences = allEvidences.filter((e) => e.status === 'REJECTED').length;

  // Rating counts
  const ratingsCount: Record<RatingLevel, number> = {
    A_PLUS: 0,
    A: 0,
    B: 0,
    C: 0,
    D: 0
  };

  const discrepancyAlerts: { teacherName: string; self: number; team: number; diff: number; reason?: string }[] = [];

  allUsers.forEach((u) => {
    const ev = storageService.getEvaluation(u.id);
    if (ev) {
      if (ev.rating) ratingsCount[ev.rating] = (ratingsCount[ev.rating] || 0) + 1;
      if (ev.selfTotal > 0 && ev.teamTotal > 0) {
        const diff = Math.abs(ev.selfTotal - ev.teamTotal);
        if (diff >= (settings.discrepancyThreshold || 5.0)) {
          discrepancyAlerts.push({
            teacherName: u.name,
            self: ev.selfTotal,
            team: ev.teamTotal,
            diff,
            reason: ev.discrepancyReason
          });
        }
      }
    }
  });

  // Personal metrics for teacher
  const myEvidences = storageService.getTeacherEvidences(currentUser.id);
  const myEval = storageService.getEvaluation(currentUser.id);
  const mySubmitted = myEvidences.length;
  const myApproved = myEvidences.filter(
    (e) => e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED' || e.status === 'LOCKED'
  ).length;
  const myPending = myEvidences.filter(
    (e) => e.status === 'SUBMITTED' || e.status === 'TEAM_REVIEW'
  ).length;
  const myRevision = myEvidences.filter((e) => e.status === 'REVISION_REQUIRED').length;
  const pendingSupplements = storageService
    .getSupplementRequests()
    .filter((s) => s.teacherId === currentUser.id && s.status === 'PENDING');

  // Criteria coverage calculation (total criteria items = 22)
  const totalCriteriaCount = CRITERIA_GROUPS.reduce((acc, g) => acc + g.criteria.length, 0);
  const coveredCriteriaIds = new Set(myEvidences.map((e) => e.criteriaId));
  const completionPercent = Math.min(100, Math.round((coveredCriteriaIds.size / totalCriteriaCount) * 100));

  const getRatingBadge = (rating: RatingLevel) => {
    switch (rating) {
      case 'A_PLUS':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-xl text-sm">A+ – Nổi bật (95–100)</span>;
      case 'A':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-3 py-1 rounded-xl text-sm">A – Xuất sắc (90–94,5)</span>;
      case 'B':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-3 py-1 rounded-xl text-sm">B – Tốt (80–89,5)</span>;
      case 'C':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-3 py-1 rounded-xl text-sm">C – Đạt (65–79,5)</span>;
      default:
        return <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold px-3 py-1 rounded-xl text-sm">D – Chưa đạt (&lt;65)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs px-3 py-1 rounded-full mb-3 backdrop-blur-md">
            <span>Năm học {settings.schoolYear}</span> • <span>Học kỳ I</span> • <span>Trường TH&THCS Nguyễn Đình Anh</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Xin chào, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Hệ thống đánh giá thi đua, thẩm định minh chứng số hóa bám sát Quy chế Tiêu chí đánh giá, xếp loại nội bộ năm học 2026–2027.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" /> Nộp minh chứng mới
            </button>
            <button
              onClick={() => onNavigate('evaluation')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" /> Phiếu chấm thi đua
            </button>
            {(currentUser.role === 'BGH' || currentUser.role === 'ADMIN') && (
              <button
                onClick={() => onNavigate('bgh-review')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-500 text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" /> Rà soát thi đua BGH
              </button>
            )}
            <button
              onClick={() => onNavigate('regulations')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
            >
              Xem quy chế thi đua &rarr;
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Discrepancy Alert Banner (Section XI: Cảnh báo chênh lệch điểm >= 5) */}
      {discrepancyAlerts.length > 0 && !isTeacherOnly && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 rounded-xl shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                ⚠️ CẢNH BÁO CHÊNH LỆCH ĐIỂM THI ĐUA (≥ 05 ĐIỂM)
                <span className="text-xs font-normal text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  {discrepancyAlerts.length} trường hợp cần giải trình
                </span>
              </h2>
              <p className="text-xs text-amber-800 mt-1">
                Theo Quy chế, nếu điểm tự chấm và điểm tổ chấm chênh lệch từ 05 điểm trở lên, Tổ trưởng bắt buộc phải ghi rõ lý do và căn cứ điều chỉnh.
              </p>
              <div className="mt-3 space-y-2">
                {discrepancyAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{alert.teacherName}</span>: Tự chấm{' '}
                      <span className="font-bold text-blue-700">{alert.self}đ</span> | Tổ chấm{' '}
                      <span className="font-bold text-amber-700">{alert.team}đ</span> (Chênh lệch:{' '}
                      <strong className="text-red-600 font-extrabold">{alert.diff}đ</strong>)
                      {alert.reason && (
                        <div className="text-[11px] text-slate-600 mt-1 italic">
                          Lý do tổ ghi nhận: "{alert.reason}"
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onNavigate(currentUser.role === 'BGH' || currentUser.role === 'ADMIN' ? 'bgh-review' : 'evaluation')}
                      className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-xs shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      {currentUser.role === 'BGH' || currentUser.role === 'ADMIN' ? 'Rà soát cấp BGH →' : 'Kiểm tra phiếu chấm →'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nhiệm vụ yêu cầu bổ sung minh chứng cho Giáo viên (Mục 2: Lý do, Người yêu cầu, Thời gian, Hạn bổ sung) */}
      {pendingSupplements.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-500 p-5 rounded-2xl shadow-sm animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-200 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </span>
              <h2 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Nhiệm vụ: Yêu cầu bổ sung minh chứng ({pendingSupplements.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigate('appeals')}
              className="text-xs font-bold text-amber-900 hover:underline cursor-pointer"
            >
              Xem chi tiết trung tâm giải trình &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {pendingSupplements.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-xl border border-amber-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    {req.criteriaCode && (
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        Tiêu chí {req.criteriaCode}
                      </span>
                    )}
                    <span>{req.evidenceName || req.criteriaTitle || 'Hồ sơ minh chứng'}</span>
                  </div>
                  <div className="text-rose-700 font-bold text-xs">
                    Lý do: "{req.reason}"
                  </div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-3 flex-wrap">
                    <span>Người yêu cầu: <strong>{req.requesterName}</strong> ({req.requesterRole})</span>
                    <span>Thời gian yêu cầu: {req.createdAt}</span>
                    <span className="text-rose-700 font-mono font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Hạn bổ sung: {req.deadline}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigate('my-evidence')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    BỔ SUNG MINH CHỨNG
                  </button>
                  <button
                    onClick={() => onNavigate('appeals')}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    GỬI GIẢI TRÌNH
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEACHER DASHBOARD VIEW (Section XIII) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Score Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kết quả thi đua cá nhân (HKI)
              </span>
              <Award className="w-5 h-5 text-blue-600" />
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <div className="text-4xl font-extrabold text-blue-900">
                {myEval ? myEval.finalScore : 0}
                <span className="text-lg text-slate-400 font-medium">/100đ</span>
              </div>
              <div className="mt-1">{getRatingBadge(myEval ? myEval.rating : 'D')}</div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Tự chấm</span>
                <span className="font-bold text-slate-800 text-sm">{myEval?.selfTotal || 0}đ</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-slate-400 block text-[11px]">Tổ chấm</span>
                <span className="font-bold text-indigo-700 text-sm">{myEval?.teamTotal || 0}đ</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">BGH duyệt</span>
                <span className="font-bold text-emerald-700 text-sm">{myEval?.bghTotal || 0}đ</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Điểm cộng: <strong className="text-emerald-600">+{myEval?.bonusPoints || 0}</strong></span>
              <span>Điểm trừ: <strong className="text-red-600">-{myEval?.deductionPoints || 0}</strong></span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('evaluation')}
            className="mt-5 w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            Chi tiết phiếu chấm Phụ lục 01 <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Evidence Completion Progress Card (Section XXX) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tiến độ minh chứng cá nhân
              </span>
              <FolderCheck className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-800">
                  Hoàn thành: {completionPercent}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {coveredCriteriaIds.size}/{totalCriteriaCount} tiêu chí đã có minh chứng
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* Evidence status breakdown */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600">Đã nộp:</span>
                <span className="font-bold text-slate-900">{mySubmitted}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <span className="text-emerald-800 font-medium">Đã duyệt:</span>
                <span className="font-bold text-emerald-700">{myApproved}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <span className="text-blue-800 font-medium">Chờ duyệt:</span>
                <span className="font-bold text-blue-700">{myPending}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                <span className="text-amber-800 font-medium">Cần bổ sung:</span>
                <span className="font-bold text-amber-700">{myRevision}</span>
              </div>
            </div>

            {totalCriteriaCount - coveredCriteriaIds.size > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 text-[11px] text-amber-900 border border-amber-200 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Bạn còn <strong>{totalCriteriaCount - coveredCriteriaIds.size} tiêu chí</strong> cần hoàn thiện minh chứng trước ngày {settings.evidenceDeadline}.
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('my-evidence')}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            Quản lý minh chứng của tôi <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Rules & Guidelines Pill Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Khung tiêu chuẩn xếp loại 2026–2027
            </span>

            <div className="mt-3 space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                <span className="font-bold text-amber-900">A+ (Nổi bật)</span>
                <span className="text-amber-800 font-medium">95–100đ &gt;= 2 minh chứng nổi bật</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-900">A (Xuất sắc)</span>
                <span className="text-emerald-800 font-medium">90–94,5 điểm</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                <span className="font-bold text-blue-900">B (Tốt)</span>
                <span className="text-blue-800 font-medium">80–89,5 điểm</span>
              </div>
              <div className="p-2 rounded-lg bg-purple-50/80 border border-purple-200 flex items-center justify-between">
                <span className="font-bold text-purple-900">C (Đạt)</span>
                <span className="text-purple-800 font-medium">65–79,5 điểm</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-200 flex items-center justify-between">
                <span className="font-bold text-rose-900">D (Chưa đạt)</span>
                <span className="text-rose-800 font-medium">&lt; 65 điểm</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Thời hạn nộp: <strong>{settings.evidenceDeadline}</strong></span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Xem báo cáo &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* SCHOOL & DEPARTMENT OVERVIEW SECTION (Section XII & XXIX) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tổng quan toàn trường & Các tổ chuyên môn
            </h2>
            <div className="text-xs text-slate-500">
              Dữ liệu thẩm định minh chứng và bình xét thi đua học kỳ I năm học 2026–2027
            </div>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Bảng tổng hợp Phụ lục 06
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 text-xs block font-medium">Tổng số cán bộ - GV</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalStaff}</span>
            <span className="text-[11px] text-slate-500">{totalTeachers} giáo viên trực tiếp</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 text-xs block font-medium">Tổng số minh chứng</span>
            <span className="text-2xl font-bold text-blue-900 mt-1 block">{totalEvidences}</span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {approvedEvidences} minh chứng đã duyệt
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 text-xs block font-medium">Minh chứng chờ duyệt</span>
            <span className="text-2xl font-bold text-indigo-700 mt-1 block">{pendingEvidences}</span>
            <span className="text-[11px] text-slate-500">Đang chờ tổ trưởng / BGH</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 text-xs block font-medium">Cần bổ sung / Từ chối</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">
              {revisionEvidences + rejectedEvidences}
            </span>
            <span className="text-[11px] text-amber-600 font-medium">
              {revisionEvidences} yêu cầu bổ sung
            </span>
          </div>
        </div>

        {/* Rating Breakdown Pill Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-[11px] text-amber-800 font-bold uppercase block">Mức A+ (Nổi bật)</span>
            <span className="text-2xl font-black text-amber-900 mt-0.5 block">{ratingsCount.A_PLUS}</span>
            <span className="text-[10px] text-amber-700">95–100 điểm</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[11px] text-emerald-800 font-bold uppercase block">Mức A (Xuất sắc)</span>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block">{ratingsCount.A}</span>
            <span className="text-[10px] text-emerald-700">90–94,5 điểm</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <span className="text-[11px] text-blue-800 font-bold uppercase block">Mức B (Tốt)</span>
            <span className="text-2xl font-black text-blue-900 mt-0.5 block">{ratingsCount.B}</span>
            <span className="text-[10px] text-blue-700">80–89,5 điểm</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
            <span className="text-[11px] text-purple-800 font-bold uppercase block">Mức C (Đạt)</span>
            <span className="text-2xl font-black text-purple-900 mt-0.5 block">{ratingsCount.C}</span>
            <span className="text-[10px] text-purple-700">65–79,5 điểm</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] text-rose-800 font-bold uppercase block">Mức D (Chưa đạt)</span>
            <span className="text-2xl font-black text-rose-900 mt-0.5 block">{ratingsCount.D}</span>
            <span className="text-[10px] text-rose-700">&lt;65 điểm</span>
          </div>
        </div>

        {/* Table By Department (Section XII) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Thống kê chất lượng thi đua theo tổ chuyên môn
            </h3>
            <span className="text-xs text-slate-500 italic">
              (Thống kê nội bộ phục vụ rà soát, không dùng để xếp hạng tổ trái quy chế)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tổ chuyên môn</th>
                  <th className="py-3 px-3 text-center">Số GV</th>
                  <th className="py-3 px-3 text-center">Điểm TB</th>
                  <th className="py-3 px-3 text-center text-amber-700 font-bold">A+</th>
                  <th className="py-3 px-3 text-center text-emerald-700 font-bold">A</th>
                  <th className="py-3 px-3 text-center text-blue-700 font-bold">B</th>
                  <th className="py-3 px-3 text-center text-purple-700 font-bold">C</th>
                  <th className="py-3 px-3 text-center text-rose-700 font-bold">D</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allDepartments.map((dept) => {
                  const deptUsers = allUsers.filter((u) => u.departmentId === dept.id);
                  let sumScore = 0;
                  let countScored = 0;
                  let dAPlus = 0;
                  let dA = 0;
                  let dB = 0;
                  let dC = 0;
                  let dD = 0;

                  deptUsers.forEach((u) => {
                    const ev = storageService.getEvaluation(u.id);
                    if (ev && ev.finalScore > 0) {
                      sumScore += ev.finalScore;
                      countScored++;
                      if (ev.rating === 'A_PLUS') dAPlus++;
                      else if (ev.rating === 'A') dA++;
                      else if (ev.rating === 'B') dB++;
                      else if (ev.rating === 'C') dC++;
                      else dD++;
                    }
                  });

                  const avgScore = countScored > 0 ? (sumScore / countScored).toFixed(1) : '---';

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{dept.name}</div>
                        <div className="text-[11px] text-slate-500">Tổ trưởng: {dept.leaderName}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                        {deptUsers.length}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-blue-700 text-sm">
                        {avgScore}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-amber-700">{dAPlus}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-700">{dA}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-blue-700">{dB}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-purple-700">{dC}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-rose-700">{dD}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigate('team-evidence')}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Xem tổ &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
