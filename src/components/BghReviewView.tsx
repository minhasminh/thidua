import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  Edit3,
  Send,
  Eye,
  History,
  Building2,
  Users,
  Award,
  Star,
  Check,
  RotateCcw,
  Sparkles,
  Download,
  AlertOctagon,
  Scale
} from 'lucide-react';
import {
  User,
  EvaluationRecord,
  RatingLevel,
  EvaluationStatus,
  normalizeRole,
  BghScoreAdjustment,
  EvidenceItem
} from '../types';
import { storageService } from '../services/storageService';
import { criteriaService } from '../services/criteriaService';
import { evidenceStorageService } from '../services/evidenceStorageService';
import { formatExactTimestamp } from '../utils/formatters';
import { EvidenceAuditHistoryModal } from './EvidenceAuditHistoryModal';

interface BghReviewViewProps {
  currentUser: User;
  onNavigateToEvaluation?: (teacherId: string) => void;
}

export const BghReviewView: React.FC<BghReviewViewProps> = ({
  currentUser,
  onNavigateToEvaluation
}) => {
  // BẢO MẬT MỤC 7: Chỉ BGH và Admin có quyền rà soát cấp BGH
  const normRole = normalizeRole(currentUser.role);
  const isAuthorized = normRole === 'BGH' || normRole === 'ADMIN';

  const settings = storageService.getSettings();
  const allUsers = storageService.getUsers().filter(
    (u) =>
      u.role === 'TEACHER' ||
      u.role === 'TEAM_LEADER' ||
      u.role === 'GIAO_VIEN' ||
      u.role === 'TO_TRUONG' ||
      u.role === 'TO_PHO'
  );
  const departments = storageService.getDepartments();
  const allCriteria = criteriaService.getAllCriteria().filter((c) => c.is_active);

  // States
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [filterRating, setFilterRating] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDiscrepancyOnly, setFilterDiscrepancyOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal States
  const [adjustModalTeacher, setAdjustModalTeacher] = useState<User | null>(null);
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<string>('');
  const [newScoreVal, setNewScoreVal] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustEvidenceBasis, setAdjustEvidenceBasis] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string>('');

  // Explanation & Reject Modal
  const [actionModal, setActionModal] = useState<{
    teacher: User;
    actionType: 'EXPLANATION' | 'SUPPLEMENT' | 'REJECT' | 'APPROVE';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDeadline, setActionDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [actionError, setActionError] = useState('');

  // Evidences inspection modal
  const [inspectTeacher, setInspectTeacher] = useState<User | null>(null);
  const [historyModalEvidence, setHistoryModalEvidence] = useState<EvidenceItem | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Quyền truy cập bị từ chối (Mục 7)</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Chỉ Ban Giám hiệu và Quản trị viên hệ thống mới có quyền truy cập module Rà soát thi đua cấp BGH.
        </p>
      </div>
    );
  }

  // Lấy dữ liệu rà soát cho tất cả giáo viên
  const evaluationRows = allUsers.map((teacher) => {
    const evaluation = storageService.getEvaluation(teacher.id, settings.schoolYear, settings.currentSemester);
    const selfScore = evaluation.selfTotal || 0;
    const teamScore = evaluation.teamTotal || 0;
    const diff = Math.abs(selfScore - teamScore);
    const hasDiscrepancy = diff >= 5.0 && selfScore > 0 && teamScore > 0;
    const teacherEvidences = storageService.getTeacherEvidences(teacher.id);

    return {
      teacher,
      evaluation,
      selfScore,
      teamScore,
      diff,
      hasDiscrepancy,
      bonusPoints: evaluation.bonusPoints || 0,
      deductionPoints: evaluation.deductionPoints || 0,
      finalScore: evaluation.finalScore || 0,
      rating: evaluation.rating || 'D',
      status: evaluation.status || 'CHUA_BAT_DAU',
      evidences: teacherEvidences
    };
  });

  // KPI Metrics (Mục 1: BGH DASHBOARD)
  const totalTeachers = evaluationRows.length;
  const completedRecords = evaluationRows.filter((r) => r.teamScore > 0 || r.status === 'BGH_APPROVED').length;
  const incompletedRecords = totalTeachers - completedRecords;
  const pendingBghEvidences = storageService
    .getEvidences()
    .filter((e) => e.status === 'TEAM_APPROVED' || e.status === 'SUBMITTED').length;
  const pointsToReviewCount = evaluationRows.filter(
    (r) => r.teamScore > 0 && r.status !== 'BGH_APPROVED' && r.status !== 'DA_KHOA'
  ).length;
  const discrepancyCount = evaluationRows.filter((r) => r.hasDiscrepancy).length;
  const needExplanationCount = evaluationRows.filter(
    (r) => r.hasDiscrepancy || r.evaluation.bghExplanationRequired
  ).length;

  // Lọc danh sách bảng (Mục 2)
  const filteredRows = evaluationRows.filter((row) => {
    if (selectedDeptId !== 'ALL' && row.teacher.departmentId !== selectedDeptId) return false;
    if (filterRating !== 'ALL' && row.rating !== filterRating) return false;
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'BGH_APPROVED' && row.status !== 'BGH_APPROVED') return false;
      if (filterStatus === 'CHO_BGH' && row.status === 'BGH_APPROVED') return false;
    }
    if (filterDiscrepancyOnly && !row.hasDiscrepancy) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = row.teacher.name.toLowerCase().includes(q);
      const matchDept = row.teacher.departmentName.toLowerCase().includes(q);
      if (!matchName && !matchDept) return false;
    }
    return true;
  });

  const getStatusBadge = (status: EvaluationStatus) => {
    switch (status) {
      case 'BGH_APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> BGH ĐÃ DUYỆT
          </span>
        );
      case 'DA_DUYET_CAP_TO':
      case 'CHO_BGH':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> CHỜ BGH RÀ SOÁT
          </span>
        );
      case 'CHO_HOI_DONG':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            CHỜ HỘI ĐỒNG TĐKT
          </span>
        );
      case 'CHO_TO_DUYET':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            TỔ ĐANG XỬ LÝ
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            CHƯA HOÀN TẤT
          </span>
        );
    }
  };

  const getRatingBadge = (rating: RatingLevel) => {
    switch (rating) {
      case 'A_PLUS':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> A+ Xuất sắc
          </span>
        );
      case 'A':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-md text-xs">
            A Hoàn thành Tốt
          </span>
        );
      case 'B':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 font-semibold px-2 py-0.5 rounded-md text-xs">
            B Hoàn thành
          </span>
        );
      case 'C':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-300 font-semibold px-2 py-0.5 rounded-md text-xs">
            C Cần cố gắng
          </span>
        );
      case 'D':
      default:
        return (
          <span className="bg-red-100 text-red-800 border border-red-300 font-bold px-2 py-0.5 rounded-md text-xs">
            D Chưa hoàn thành
          </span>
        );
    }
  };

  // Mở modal điều chỉnh điểm (Mục 5)
  const handleOpenAdjust = (teacher: User) => {
    const ev = storageService.getEvaluation(teacher.id);
    const firstCrit = allCriteria[0];
    setAdjustModalTeacher(teacher);
    setSelectedCriteriaId(firstCrit?.id || '');
    const currentScore = Number(ev.scores[firstCrit?.id]?.bghScore ?? ev.scores[firstCrit?.id]?.teamScore ?? 0);
    setNewScoreVal(currentScore);
    setAdjustReason('');
    setAdjustEvidenceBasis('');
    setAdjustError('');
  };

  const handleCriteriaSelectChange = (critId: string) => {
    setSelectedCriteriaId(critId);
    if (!adjustModalTeacher) return;
    const ev = storageService.getEvaluation(adjustModalTeacher.id);
    const currentScore = Number(ev.scores[critId]?.bghScore ?? ev.scores[critId]?.teamScore ?? 0);
    setNewScoreVal(currentScore);
  };

  const handleSubmitScoreAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalTeacher || !selectedCriteriaId) return;
    setAdjustError('');

    const crit = allCriteria.find((c) => c.id === selectedCriteriaId);
    if (!crit) return;

    if (newScoreVal < 0 || newScoreVal > crit.diem_toi_da) {
      setAdjustError(`Điểm mới phải nằm trong khoảng 0 đến ${crit.diem_toi_da}đ.`);
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError('Mục 5: Bắt buộc phải nhập Lý do điều chỉnh điểm!');
      return;
    }

    if (!adjustEvidenceBasis.trim()) {
      setAdjustError('Mục 5: Bắt buộc phải nêu rõ Căn cứ / Minh chứng điều chỉnh điểm!');
      return;
    }

    try {
      storageService.bghAdjustScore(
        adjustModalTeacher.id,
        crit.id,
        crit.ma_tieu_chi,
        newScoreVal,
        adjustReason.trim(),
        adjustEvidenceBasis.trim(),
        currentUser
      );

      setSuccessToast(`Đã điều chỉnh điểm tiêu chí ${crit.ma_tieu_chi} của ${adjustModalTeacher.name} thành công!`);
      setAdjustModalTeacher(null);
      setRefreshKey((k) => k + 1);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setAdjustError(err.message || 'Lỗi khi điều chỉnh điểm.');
    }
  };

  // Xử lý Duyệt, Yêu cầu giải trình, Yêu cầu bổ sung, Từ chối (Mục 4 & Mục 6)
  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setActionError('');

    const { teacher, actionType } = actionModal;

    try {
      if (actionType === 'APPROVE') {
        storageService.bghApproveEvaluation(teacher.id, currentUser, actionReason);
        setSuccessToast(`Đã phê duyệt hồ sơ thi đua của ${teacher.name} thành công! Hồ sơ chuyển CHỜ HỘI ĐỒNG TĐKT.`);
      } else if (actionType === 'EXPLANATION') {
        if (!actionReason.trim()) {
          setActionError('Bắt buộc phải nhập nội dung/lý do yêu cầu giải trình!');
          return;
        }
        storageService.bghRequestExplanation(teacher.id, currentUser, actionReason.trim());
        setSuccessToast(`Đã gửi yêu cầu giải trình tới giáo viên ${teacher.name}!`);
      } else if (actionType === 'SUPPLEMENT') {
        if (!actionReason.trim()) {
          setActionError('Bắt buộc phải nhập nội dung yêu cầu bổ sung minh chứng!');
          return;
        }
        storageService.bghRequestSupplement(teacher.id, currentUser, actionReason.trim(), actionDeadline);
        setSuccessToast(`Đã gửi yêu cầu bổ sung minh chứng tới giáo viên ${teacher.name}!`);
      } else if (actionType === 'REJECT') {
        if (!actionReason.trim()) {
          setActionError('Bắt buộc phải có lý do khi từ chối hồ sơ thi đua!');
          return;
        }
        storageService.bghRejectEvaluation(teacher.id, currentUser, actionReason.trim());
        setSuccessToast(`Đã từ chối và trả lại hồ sơ của ${teacher.name} cho Tổ chuyên môn thẩm định lại!`);
      }

      setActionModal(null);
      setRefreshKey((k) => k + 1);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setActionError(err.message || 'Lỗi thực hiện thao tác.');
    }
  };

  const selectedCritObj = allCriteria.find((c) => c.id === selectedCriteriaId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">
              Workflow: Tổ trưởng → Ban Giám hiệu
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            RÀ SOÁT THI ĐUA (CẤP BGH)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rà soát chênh lệch điểm tự chấm - tổ chấm, thẩm định minh chứng toàn trường, điều chỉnh điểm có căn cứ và phê duyệt chuyển Hội đồng TĐKT
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            Năm học 2026–2027 • {settings.currentSemester}
          </span>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs text-emerald-700 hover:underline">
            Đóng
          </button>
        </div>
      )}

      {/* 1. BGH DASHBOARD: 7 Chỉ số tổng hợp theo Mục 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Tổng giáo viên */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Tổng giáo viên</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1.5">{totalTeachers}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Toàn trường</div>
        </div>

        {/* 2. Hồ sơ hoàn thành */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
            <span>Hồ sơ hoàn thành</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1.5">{completedRecords}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Tổ đã chấm</div>
        </div>

        {/* 3. Hồ sơ chưa hoàn thành */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
            <span>Chưa hoàn thành</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-700 mt-1.5">{incompletedRecords}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đang xử lý</div>
        </div>

        {/* 4. Minh chứng chờ BGH */}
        <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 flex items-center justify-between">
            <span>Minh chứng chờ BGH</span>
            <FileText className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-700 mt-1.5">{pendingBghEvidences}</div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">Tổ đã duyệt</div>
        </div>

        {/* 5. Điểm cần rà soát */}
        <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-700 flex items-center justify-between">
            <span>Điểm cần rà soát</span>
            <Scale className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-700 mt-1.5">{pointsToReviewCount}</div>
          <div className="text-[10px] text-indigo-600/80 mt-0.5">Chờ BGH duyệt</div>
        </div>

        {/* 6. Chênh lệch điểm (Mục 3: Cảnh báo ABS >= 5) */}
        <div
          onClick={() => setFilterDiscrepancyOnly(!filterDiscrepancyOnly)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterDiscrepancyOnly
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/20'
              : discrepancyCount > 0
              ? 'bg-amber-50/70 border-amber-300 text-amber-900 hover:border-amber-400'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <div className="text-[11px] font-bold flex items-center justify-between">
            <span>Chênh lệch điểm</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black mt-1.5 flex items-center gap-1.5">
            {discrepancyCount}
            {discrepancyCount > 0 && (
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded font-bold">
                ≥ 5đ
              </span>
            )}
          </div>
          <div className="text-[10px] mt-0.5 opacity-90 truncate">
            {filterDiscrepancyOnly ? 'Đang lọc chênh lệch' : 'Nhấp để lọc'}
          </div>
        </div>

        {/* 7. Hồ sơ cần giải trình */}
        <div className="bg-white p-3.5 rounded-2xl border border-purple-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-purple-700 flex items-center justify-between">
            <span>Cần giải trình</span>
            <AlertOctagon className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-black text-purple-700 mt-1.5">{needExplanationCount}</div>
          <div className="text-[10px] text-purple-600/80 mt-0.5">Chờ phản hồi</div>
        </div>
      </div>

      {/* Cảnh báo toàn trường nếu có chênh lệch điểm >= 5 (Mục 3) */}
      {discrepancyCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-amber-900 text-xs uppercase tracking-wider">
              Cảnh báo kiểm soát chất lượng thẩm định (Mục 3)
            </div>
            <p className="text-amber-800 text-xs font-medium">
              Phát hiện <strong>{discrepancyCount} hồ sơ giáo viên</strong> có điểm tự chấm và điểm tổ thẩm định chênh lệch từ <strong>05 điểm trở lên</strong>. Theo quy chế thi đua: <em>“Chênh lệch từ 05 điểm trở lên – cần nêu rõ lý do và căn cứ.”</em> Ban Giám hiệu cần yêu cầu giải trình hoặc điều chỉnh điểm có căn cứ trước khi phê duyệt.
            </p>
          </div>
        </div>
      )}

      {/* Bộ lọc bảng (Mục 2) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Lọc Tổ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tổ chuyên môn:</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả tổ chuyên môn</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Mức Xếp loại */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Mức xếp loại:</label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả mức xếp loại</option>
              <option value="A_PLUS">Mức A+ (Xuất sắc)</option>
              <option value="A">Mức A (Hoàn thành Tốt)</option>
              <option value="B">Mức B (Hoàn thành)</option>
              <option value="C">Mức C (Cần cố gắng)</option>
              <option value="D">Mức D (Chưa hoàn thành)</option>
            </select>
          </div>

          {/* Lọc Trạng thái BGH */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trạng thái BGH:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHO_BGH">Chờ BGH rà soát</option>
              <option value="BGH_APPROVED">BGH đã duyệt (Chờ HĐ)</option>
            </select>
          </div>

          {/* Toggle chênh lệch */}
          <div className="flex items-end">
            <button
              onClick={() => setFilterDiscrepancyOnly(!filterDiscrepancyOnly)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                filterDiscrepancyOnly
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {filterDiscrepancyOnly ? 'Đang lọc Chênh lệch ≥ 5đ' : 'Lọc hồ sơ Chênh lệch ≥ 5đ'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên giáo viên, tổ chuyên môn..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Hiển thị: <strong>{filteredRows.length}</strong> / {totalTeachers} giáo viên
            </span>
            {(selectedDeptId !== 'ALL' ||
              filterRating !== 'ALL' ||
              filterStatus !== 'ALL' ||
              filterDiscrepancyOnly ||
              searchTerm) && (
              <button
                onClick={() => {
                  setSelectedDeptId('ALL');
                  setFilterRating('ALL');
                  setFilterStatus('ALL');
                  setFilterDiscrepancyOnly(false);
                  setSearchTerm('');
                }}
                className="text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BẢNG: “RÀ SOÁT THI ĐUA” (Mục 2: Giáo viên, Tổ, Điểm tự chấm, Điểm tổ, Chênh lệch, Điểm cộng, Điểm trừ, Tổng điểm, Mức hiện tại, Trạng thái) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-4 min-w-[170px]">Giáo viên</th>
                <th className="py-3.5 px-3 min-w-[140px]">Tổ</th>
                <th className="py-3.5 px-3 text-center min-w-[100px]">Điểm tự chấm</th>
                <th className="py-3.5 px-3 text-center min-w-[100px]">Điểm tổ</th>
                <th className="py-3.5 px-3.5 text-center min-w-[130px]">Chênh lệch</th>
                <th className="py-3.5 px-2.5 text-center w-16">Điểm cộng</th>
                <th className="py-3.5 px-2.5 text-center w-16">Điểm trừ</th>
                <th className="py-3.5 px-3 text-center min-w-[90px]">Tổng điểm</th>
                <th className="py-3.5 px-3 text-center min-w-[140px]">Mức hiện tại</th>
                <th className="py-3.5 px-3 text-center min-w-[140px]">Trạng thái</th>
                <th className="py-3.5 px-4 text-center min-w-[280px]">Thao tác BGH (Mục 4)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Không tìm thấy giáo viên nào phù hợp với bộ lọc rà soát.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr
                    key={`bgh-row-${row.teacher.id}-${idx}`}
                    className={`transition-colors ${
                      row.hasDiscrepancy ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>

                    {/* Giáo viên */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{row.teacher.name}</div>
                      <div className="text-[10px] text-slate-400">{row.teacher.email}</div>
                      {row.evaluation.bghAdjustments && row.evaluation.bghAdjustments.length > 0 && (
                        <div className="text-[10px] text-indigo-700 font-semibold mt-0.5 flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Đã điều chỉnh ({row.evaluation.bghAdjustments.length} lần)
                        </div>
                      )}
                    </td>

                    {/* Tổ */}
                    <td className="py-3.5 px-3 text-slate-700 font-medium text-xs">
                      {row.teacher.departmentName}
                    </td>

                    {/* Điểm tự chấm */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-700 text-xs">
                      {row.selfScore > 0 ? `${row.selfScore}đ` : <span className="text-slate-300">-</span>}
                    </td>

                    {/* Điểm tổ */}
                    <td className="py-3.5 px-3 text-center font-bold text-indigo-700 text-xs">
                      {row.teamScore > 0 ? `${row.teamScore}đ` : <span className="text-slate-300">-</span>}
                    </td>

                    {/* Chênh lệch (Mục 3: Cảnh báo ABS >= 5) */}
                    <td className="py-3.5 px-3.5 text-center">
                      {row.selfScore > 0 && row.teamScore > 0 ? (
                        <div>
                          {row.hasDiscrepancy ? (
                            <div className="space-y-0.5">
                              <span
                                className="px-2 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-300 inline-flex items-center gap-1"
                                title="Chênh lệch từ 05 điểm trở lên – cần nêu rõ lý do và căn cứ."
                              >
                                <AlertTriangle className="w-3 h-3" /> Δ {row.diff.toFixed(1)}đ
                              </span>
                              <div className="text-[9px] text-red-600 font-semibold">Cần giải trình</div>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">
                              Δ {row.diff.toFixed(1)}đ
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Điểm cộng */}
                    <td className="py-3.5 px-2.5 text-center text-emerald-700 font-bold text-xs">
                      {row.bonusPoints > 0 ? `+${row.bonusPoints}` : '0'}
                    </td>

                    {/* Điểm trừ */}
                    <td className="py-3.5 px-2.5 text-center text-red-600 font-bold text-xs">
                      {row.deductionPoints > 0 ? `-${row.deductionPoints}` : '0'}
                    </td>

                    {/* Tổng điểm */}
                    <td className="py-3.5 px-3 text-center font-black text-slate-900 text-sm">
                      {row.finalScore > 0 ? `${row.finalScore}đ` : '0đ'}
                    </td>

                    {/* Mức hiện tại */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getRatingBadge(row.rating)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>

                    {/* Thao tác BGH (Mục 4: Xem minh chứng, mở file, xem lịch sử, yêu cầu bổ sung, yêu cầu giải trình, điều chỉnh điểm, duyệt, từ chối) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* 1. Xem minh chứng & chi tiết */}
                        <button
                          onClick={() => setInspectTeacher(row.teacher)}
                          className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-[11px] cursor-pointer"
                          title="Xem toàn bộ minh chứng & mở file (Mục 4)"
                        >
                          <Eye className="w-3 h-3 inline mr-0.5" /> Minh chứng ({row.evidences.length})
                        </button>

                        {/* 2. Điều chỉnh điểm có căn cứ (Mục 5) */}
                        <button
                          onClick={() => handleOpenAdjust(row.teacher)}
                          className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-[11px] cursor-pointer"
                          title="BGH điều chỉnh điểm nếu có căn cứ (Mục 5)"
                        >
                          <Edit3 className="w-3 h-3 inline mr-0.5" /> Sửa điểm
                        </button>

                        {/* 3. Yêu cầu giải trình (Mục 4) */}
                        <button
                          onClick={() =>
                            setActionModal({
                              teacher: row.teacher,
                              actionType: 'EXPLANATION'
                            })
                          }
                          className="px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-[11px] cursor-pointer"
                          title="Yêu cầu giáo viên giải trình chênh lệch điểm (Mục 4)"
                        >
                          Giải trình
                        </button>

                        {/* 4. Yêu cầu bổ sung (Mục 4) */}
                        <button
                          onClick={() =>
                            setActionModal({
                              teacher: row.teacher,
                              actionType: 'SUPPLEMENT'
                            })
                          }
                          className="px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-[11px] cursor-pointer"
                          title="Yêu cầu bổ sung minh chứng"
                        >
                          Bổ sung
                        </button>

                        {/* 5. DUYỆT (Mục 6: BGH_APPROVED -> CHỜ HỘI ĐỒNG TĐKT) */}
                        <button
                          onClick={() =>
                            setActionModal({
                              teacher: row.teacher,
                              actionType: 'APPROVE'
                            })
                          }
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer"
                          title="BGH phê duyệt -> Chuyển Hội đồng TĐKT (Mục 6)"
                        >
                          <Check className="w-3 h-3 inline mr-0.5" /> Duyệt
                        </button>

                        {/* 6. Từ chối (Mục 4) */}
                        <button
                          onClick={() =>
                            setActionModal({
                              teacher: row.teacher,
                              actionType: 'REJECT'
                            })
                          }
                          className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 font-bold text-[11px] cursor-pointer"
                          title="Từ chối / Trả lại cho tổ họp thẩm định lại (Mục 4)"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL ĐIỀU CHỈNH ĐIỂM (Mục 5: Bắt buộc nhập Điểm cũ, Điểm mới, Lý do, Người điều chỉnh, Thời gian, Căn cứ/minh chứng. Không cho sửa âm thầm) */}
      {adjustModalTeacher && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 text-white">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200">
                    BGH Điều chỉnh điểm có căn cứ (Mục 5)
                  </div>
                  <h2 className="text-base font-black">
                    Điều chỉnh điểm thi đua: {adjustModalTeacher.name}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setAdjustModalTeacher(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitScoreAdjustment} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Teacher & Dept readout */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Giáo viên:</span>
                  <span className="font-bold text-slate-800 text-xs">{adjustModalTeacher.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tổ chuyên môn:</span>
                  <span className="font-semibold text-slate-700 text-xs">{adjustModalTeacher.departmentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người điều chỉnh:</span>
                  <span className="font-bold text-indigo-700 text-xs">{currentUser.name} (BGH)</span>
                </div>
              </div>

              {/* Chọn Tiêu chí */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn tiêu chí thi đua cần điều chỉnh:
                </label>
                <select
                  value={selectedCriteriaId}
                  onChange={(e) => handleCriteriaSelectChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-indigo-900"
                >
                  {allCriteria.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ma_tieu_chi} – {c.ten_tieu_chi} (Tối đa {c.diem_toi_da}đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Điểm cũ & Điểm mới (Mục 5) */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Điểm hiện tại (Điểm cũ):
                  </label>
                  <div className="font-black text-slate-800 text-base bg-white p-2 rounded-lg border border-slate-200">
                    {storageService.getEvaluation(adjustModalTeacher.id).scores[selectedCriteriaId]?.bghScore ??
                      storageService.getEvaluation(adjustModalTeacher.id).scores[selectedCriteriaId]?.teamScore ??
                      0}
                    đ
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Điểm mới do BGH ấn định <span className="text-red-500">*</span>:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max={selectedCritObj?.diem_toi_da || 10}
                      required
                      value={newScoreVal}
                      onChange={(e) => setNewScoreVal(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 font-black text-indigo-900 bg-white"
                    />
                    <span className="text-slate-400 font-bold text-xs shrink-0">
                      / {selectedCritObj?.diem_toi_da || 10}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Lý do điều chỉnh (Mục 5: Bắt buộc) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do điều chỉnh điểm <span className="text-red-500">*</span>
                  <span className="font-normal text-slate-400 ml-1">(Bắt buộc theo Mục 5)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="VD: Tổ chấm chưa bao quát đủ các tiết dạy đột xuất; giáo viên có sáng kiến số hóa đạt giải cấp huyện..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Căn cứ / Minh chứng thẩm định (Mục 5: Bắt buộc) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Căn cứ / Minh chứng thẩm định <span className="text-red-500">*</span>
                  <span className="font-normal text-slate-400 ml-1">(Bắt buộc theo Mục 5)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustEvidenceBasis}
                  onChange={(e) => setAdjustEvidenceBasis(e.target.value)}
                  placeholder="VD: Căn cứ biên bản kiểm tra đột xuất số 12/BB-BGH ngày 15/10 và minh chứng sản phẩm học sinh trên LMS..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Dấu thời gian tự động (Mục 5) */}
              <div className="text-[11px] text-slate-500 flex items-center justify-between p-2 rounded-lg bg-slate-100 font-mono">
                <span>Dấu thời gian điều chỉnh:</span>
                <strong>{formatExactTimestamp()}</strong>
              </div>

              {adjustError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {adjustError}
                </div>
              )}

              {/* Lịch sử các lần điều chỉnh trước đó (Mục 5: Không cho sửa âm thầm) */}
              {storageService.getEvaluation(adjustModalTeacher.id).bghAdjustments &&
                storageService.getEvaluation(adjustModalTeacher.id).bghAdjustments!.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700 text-[11px]">
                      Lịch sử các lần BGH điều chỉnh trước đó ({storageService.getEvaluation(adjustModalTeacher.id).bghAdjustments!.length}):
                    </span>
                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                      {storageService.getEvaluation(adjustModalTeacher.id).bghAdjustments!.map((adj, i) => (
                        <div key={adj.id || i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>Tiêu chí {adj.criteriaCode}: {adj.oldScore}đ → <strong className="text-indigo-700">{adj.newScore}đ</strong></span>
                            <span className="font-mono text-slate-400 text-[10px]">{adj.adjustedAt}</span>
                          </div>
                          <div className="text-slate-600">Lý do: {adj.reason}</div>
                          <div className="text-slate-500 text-[10px] italic">Căn cứ: {adj.evidenceBasis} (Bởi: {adj.adjustedBy})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalTeacher(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  XÁC NHẬN ĐIỀU CHỈNH ĐIỂM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DUYỆT / GIẢI TRÌNH / BỔ SUNG / TỪ CHỐI (Mục 4 & Mục 6) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                actionModal.actionType === 'APPROVE'
                  ? 'bg-emerald-600'
                  : actionModal.actionType === 'EXPLANATION'
                  ? 'bg-purple-600'
                  : actionModal.actionType === 'SUPPLEMENT'
                  ? 'bg-amber-600'
                  : 'bg-red-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 text-white">
                  {actionModal.actionType === 'APPROVE' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">
                    Quyết định thẩm định Ban Giám hiệu
                  </div>
                  <h2 className="text-base font-black">
                    {actionModal.actionType === 'APPROVE'
                      ? `Phê duyệt thi đua: ${actionModal.teacher.name}`
                      : actionModal.actionType === 'EXPLANATION'
                      ? `Yêu cầu giải trình: ${actionModal.teacher.name}`
                      : actionModal.actionType === 'SUPPLEMENT'
                      ? `Yêu cầu bổ sung: ${actionModal.teacher.name}`
                      : `Từ chối duyệt: ${actionModal.teacher.name}`}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-sm">{actionModal.teacher.name}</div>
                <div className="text-slate-500 text-xs">
                  {actionModal.teacher.departmentName} • {actionModal.teacher.position || 'Giáo viên'}
                </div>
                {actionModal.actionType === 'APPROVE' && (
                  <div className="text-emerald-700 font-semibold text-xs mt-1">
                    ✓ Sau khi xác nhận: Trạng thái chuyển <strong>BGH_APPROVED</strong> và hồ sơ được gửi sang <strong>CHỜ HỘI ĐỒNG TĐKT</strong> (Mục 6).
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {actionModal.actionType === 'APPROVE'
                    ? 'Nhận xét / Ý kiến chỉ đạo của BGH (Tùy chọn):'
                    : actionModal.actionType === 'EXPLANATION'
                    ? 'Nội dung BGH yêu cầu giáo viên giải trình (Bắt buộc):'
                    : actionModal.actionType === 'SUPPLEMENT'
                    ? 'Nội dung BGH yêu cầu bổ sung minh chứng (Bắt buộc):'
                    : 'Lý do BGH từ chối và trả lại hồ sơ (Bắt buộc):'}
                </label>
                <textarea
                  rows={3}
                  required={actionModal.actionType !== 'APPROVE'}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    actionModal.actionType === 'APPROVE'
                      ? 'Nhận xét đánh giá chung của Ban Giám hiệu...'
                      : actionModal.actionType === 'EXPLANATION'
                      ? 'Nêu rõ lý do điểm tự chấm và điểm tổ chênh lệch ≥ 5 điểm hoặc nội dung cần làm rõ...'
                      : 'Nhập nội dung cụ thể...'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                />

                {actionModal.actionType === 'SUPPLEMENT' && (
                  <div className="mt-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      Hạn hoàn thành bổ sung <span className="text-red-500">* (Mục 2)</span>:
                    </label>
                    <input
                      type="date"
                      required
                      value={actionDeadline}
                      onChange={(e) => setActionDeadline(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-rose-700"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Hệ thống sẽ tạo nhiệm vụ vào hồ sơ giáo viên và gửi thông báo Notification (Mục 6).
                    </span>
                  </div>
                )}
              </div>

              {actionError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {actionError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md cursor-pointer ${
                    actionModal.actionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : actionModal.actionType === 'EXPLANATION'
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                      : actionModal.actionType === 'SUPPLEMENT'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                  {actionModal.actionType === 'APPROVE'
                    ? 'XÁC NHẬN DUYỆT (BGH_APPROVED)'
                    : 'GỬI YÊU CẦU CHO GIÁO VIÊN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL XEM TOÀN BỘ MINH CHỨNG & MỞ FILE (Mục 4) */}
      {inspectTeacher && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    BGH Thẩm định Toàn bộ Minh chứng (Mục 4)
                  </div>
                  <h2 className="text-base font-black">
                    Hồ sơ minh chứng: {inspectTeacher.name} ({inspectTeacher.departmentName})
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setInspectTeacher(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="font-bold text-blue-900 text-xs">
                  Tổng số {storageService.getTeacherEvidences(inspectTeacher.id).length} tệp minh chứng đã nộp
                </span>
                {onNavigateToEvaluation && (
                  <button
                    onClick={() => {
                      onNavigateToEvaluation(inspectTeacher.id);
                      setInspectTeacher(null);
                    }}
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    Xem toàn văn Phiếu chấm 23 tiêu chí <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {storageService.getTeacherEvidences(inspectTeacher.id).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  Chưa có minh chứng nào được tải lên cho giáo viên này.
                </div>
              ) : (
                <div className="space-y-3">
                  {storageService.getTeacherEvidences(inspectTeacher.id).map((ev, i) => (
                    <div
                      key={ev.id || i}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                            Tiêu chí {ev.criteriaCode}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{ev.name}</span>
                          {ev.isOutstanding && (
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold text-[10px] flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Nổi bật
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatExactTimestamp(ev.uploadedAt)}
                        </span>
                      </div>

                      {ev.description && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">{ev.description}</p>
                      )}

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-[11px] truncate">{ev.fileName}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{ev.storagePath}</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Mở file trực tiếp (Mục 4) */}
                          <a
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" /> Mở file
                          </a>
                          <button
                            onClick={() =>
                              evidenceStorageService.downloadFile(ev.storagePath, ev.fileName, ev.fileUrl)
                            }
                            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px]"
                            title="Tải về máy"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setHistoryModalEvidence(ev)}
                            className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px]"
                            title="Xem lịch sử minh chứng"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {ev.reviewNote && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <strong>Tổ trưởng nhận xét:</strong> "{ev.reviewNote}" (Duyệt bởi: {ev.reviewerName})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectTeacher(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal khi xem lịch sử minh chứng */}
      {historyModalEvidence && (
        <EvidenceAuditHistoryModal
          evidence={historyModalEvidence}
          onClose={() => setHistoryModalEvidence(null)}
        />
      )}
    </div>
  );
};
