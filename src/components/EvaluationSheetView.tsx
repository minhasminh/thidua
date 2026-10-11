import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  Save,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  ShieldCheck,
  Award,
  AlertOctagon,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Clock,
  Printer,
  Edit3,
  ShieldAlert,
  Scale,
  Send,
  MessageSquareQuote,
  X
} from 'lucide-react';
import { User, EvaluationRecord, CriteriaScore, EvidenceItem, RatingLevel, normalizeRole, AppealItem } from '../types';
import { CRITERIA_GROUPS, TOTAL_MAX_SCORE } from '../data/criteriaData';
import { criteriaService } from '../services/criteriaService';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { getRatingTierInfo } from '../utils/ratingConfig';
import { getAuthoritativeTimestamp } from '../utils/formatters';

interface EvaluationSheetViewProps {
  currentUser: User;
  onOpenUpload: (criteriaId?: string) => void;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

export const EvaluationSheetView: React.FC<EvaluationSheetViewProps> = ({
  currentUser,
  onOpenUpload,
  onViewEvidence
}) => {
  const userRole = normalizeRole(currentUser.role);
  // RLS-restricted teacher list (Mục 6 & Mục 7)
  const allowedTeachers = databaseService.getTeachers(currentUser);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (userRole === 'GIAO_VIEN') return currentUser.id;
    if (userRole === 'TO_TRUONG' || userRole === 'TO_PHO') {
      const match = allowedTeachers.find(
        (t) => t.department_id === currentUser.departmentId || t.to_chuyen_mon === currentUser.departmentName
      );
      return match ? match.user_id : currentUser.id;
    }
    return 'user-gv1';
  });

  const selectedTeacher = storageService.getUserById(selectedTeacherId) || currentUser;
  const settings = storageService.getSettings();

  const [evaluation, setEvaluation] = useState<EvaluationRecord>(() =>
    storageService.getEvaluation(selectedTeacherId, settings.schoolYear, settings.currentSemester)
  );

  const [discrepancyReason, setDiscrepancyReason] = useState(evaluation.discrepancyReason || '');
  const [teamComment, setTeamComment] = useState(evaluation.teamComment || '');
  const [bghComment, setBghComment] = useState(evaluation.bghComment || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationNotice, setValidationNotice] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Controlled condition states (Mục 5)
  const [showControlledModal, setShowControlledModal] = useState(false);
  const [controlledMaxRatingInput, setControlledMaxRatingInput] = useState<RatingLevel>(
    evaluation.controlledMaxRating || 'B'
  );
  const [controlledReasonInput, setControlledReasonInput] = useState(evaluation.controlledReason || '');

  // Explanation / Appeal Modal States (Mục 1)
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealTitle, setAppealTitle] = useState('');
  const [appealContent, setAppealContent] = useState('');
  const [appealCriteriaCode, setAppealCriteriaCode] = useState('');
  const [appealAttachedFileName, setAppealAttachedFileName] = useState('');
  const [appealAttachedFileUrl, setAppealAttachedFileUrl] = useState('');
  const [appealError, setAppealError] = useState<string | null>(null);
  const [appealNotice, setAppealNotice] = useState<string | null>(null);

  const handleOpenAppealModal = (criteriaCode?: string, defaultTitle?: string, defaultContent?: string) => {
    setAppealCriteriaCode(criteriaCode || '');
    setAppealTitle(defaultTitle || (criteriaCode ? `Giải trình chênh lệch điểm tiêu chí ${criteriaCode}` : 'Giải trình kết quả đánh giá thi đua'));
    setAppealContent(defaultContent || '');
    setAppealAttachedFileName('');
    setAppealAttachedFileUrl('');
    setAppealError(null);
    setShowAppealModal(true);
  };

  const handleConfirmSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    setAppealError(null);
    if (!appealContent.trim()) {
      setAppealError('Vui lòng nhập nội dung giải trình!');
      return;
    }

    const matchedCrit = allDbCriteria.find((c) => c.ma_tieu_chi === appealCriteriaCode);

    const newAppeal: AppealItem = {
      id: `appeal-${Date.now()}`,
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      departmentName: selectedTeacher.departmentName,
      title: appealTitle.trim() || `Giải trình tiêu chí ${appealCriteriaCode || 'chuyên môn'}`,
      content: appealContent.trim(),
      criteriaCode: appealCriteriaCode || undefined,
      criteriaTitle: matchedCrit?.ten_tieu_chi,
      attachedFiles: appealAttachedFileName
        ? [
            {
              name: appealAttachedFileName.trim(),
              url: appealAttachedFileUrl.trim() || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80',
              size: '1.5 MB'
            }
          ]
        : undefined,
      submittedAt: getAuthoritativeTimestamp(),
      targetType: 'SCORE',
      status: 'SUBMITTED',
      auditLogs: []
    };

    try {
      storageService.saveAppeal(newAppeal, currentUser);
      setShowAppealModal(false);
      setAppealNotice('Đã gửi đơn giải trình thành công! Ban Giám hiệu và Tổ trưởng đã nhận được thông báo.');
      setTimeout(() => setAppealNotice(null), 4000);
    } catch (err: any) {
      setAppealError(err.message || 'Lỗi khi gửi giải trình.');
    }
  };

  // Dynamic criteria groups from service
  const dbGroups = criteriaService.getGroups();
  const allDbCriteria = criteriaService.getAllCriteria();

  // Reload when teacher changes
  useEffect(() => {
    const ev = storageService.getEvaluation(selectedTeacherId, settings.schoolYear, settings.currentSemester);
    setEvaluation(ev);
    setDiscrepancyReason(ev.discrepancyReason || '');
    setTeamComment(ev.teamComment || '');
    setBghComment(ev.bghComment || '');
    setControlledMaxRatingInput(ev.controlledMaxRating || 'B');
    setControlledReasonInput(ev.controlledReason || '');
    setSaveSuccess(false);
  }, [selectedTeacherId, settings.schoolYear, settings.currentSemester]);

  // Permission checks
  const isTeacher = userRole === 'GIAO_VIEN';
  const isTeamLeader = userRole === 'TO_TRUONG' || userRole === 'ADMIN';
  const isBgh = userRole === 'BGH' || userRole === 'ADMIN';
  const isCouncil = userRole === 'HOI_DONG_TDKT' || userRole === 'ADMIN';

  // Toggle group collapse
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Score change handler
  const handleScoreChange = (
    criteriaId: string,
    criteriaCode: string,
    field: 'selfScore' | 'teamScore' | 'bghScore',
    value: string,
    maxScore: number
  ) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      if (num < 0) {
        setValidationNotice(`Lỗi điểm: Điểm tiêu chí ${criteriaCode} không được nhỏ hơn 0. Đã tự động điều chỉnh về 0đ.`);
        setTimeout(() => setValidationNotice(null), 3500);
      } else if (num > maxScore) {
        setValidationNotice(`Lỗi điểm: Điểm tiêu chí ${criteriaCode} không được vượt quá ${maxScore}đ. Đã tự động giới hạn về ${maxScore}đ.`);
        setTimeout(() => setValidationNotice(null), 3500);
      }
    }
    const validNum = isNaN(num) ? 0 : Math.max(0, Math.min(maxScore, num));

    setEvaluation((prev) => {
      const currentScore = prev.scores[criteriaId] || {
        criteriaId,
        criteriaCode,
        selfScore: 0,
        teamScore: 0,
        bghScore: 0
      };

      const updatedScore: CriteriaScore = {
        ...currentScore,
        [field]: validNum
      };

      const updatedScores = {
        ...prev.scores,
        [criteriaId]: updatedScore
      };

      // Recalculate sums
      let sSum = 0;
      let tSum = 0;
      let bSum = 0;
      for (const id in updatedScores) {
        sSum += Number(updatedScores[id].selfScore) || 0;
        tSum += Number(updatedScores[id].teamScore) || 0;
        bSum += Number(updatedScores[id].bghScore) || 0;
      }

      sSum = Math.min(100, Math.round(sSum * 10) / 10);
      tSum = Math.min(100, Math.round(tSum * 10) / 10);
      bSum = Math.min(100, Math.round(bSum * 10) / 10);

      const effectiveBase = bSum > 0 ? bSum : tSum > 0 ? tSum : sSum;
      const finalVal = Math.max(
        0,
        Math.min(100, effectiveBase + (prev.bonusPoints || 0) - (prev.deductionPoints || 0))
      );

      const diff = Math.abs(sSum - tSum);
      const isAlert = sSum > 0 && tSum > 0 && diff >= (settings.discrepancyThreshold || 5.0);

      const teacherEvidences = storageService.getTeacherEvidences(selectedTeacherId);
      const outstandingCount = teacherEvidences.filter(
        (e) => e.isOutstanding && (e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED')
      ).length;

      const newRating = storageService.calculateRating(
        finalVal,
        outstandingCount,
        prev.deductionPoints > 2
      );

      return {
        ...prev,
        scores: updatedScores,
        selfTotal: sSum,
        teamTotal: tSum,
        bghTotal: bSum,
        finalScore: Math.round(finalVal * 10) / 10,
        rating: newRating,
        discrepancyAlert: isAlert
      };
    });
  };

  const handleSave = () => {
    const updated: EvaluationRecord = {
      ...evaluation,
      discrepancyReason,
      teamComment,
      bghComment,
      status: isBgh ? 'DA_RA_SOAT' : isTeamLeader ? 'DA_DUYET_CAP_TO' : 'DANG_TU_DANH_GIA'
    };

    const saved = storageService.saveEvaluation(updated, currentUser);
    setEvaluation(saved);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const teacherEvidences = storageService.getTeacherEvidences(selectedTeacherId);

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Teacher Switcher */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              Phụ lục 01 – Quy chế 2026–2027
            </span>
            <span className="text-xs text-slate-500">Thang điểm chuẩn: 100 điểm</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">
            Phiếu Đánh giá & Xếp loại Thi đua Cá nhân
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Áp dụng cho cán bộ giáo viên Trường TH&THCS Nguyễn Đình Anh • Năm học {settings.schoolYear}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Teacher selector for Leader/BGH with RLS filtering */}
          {!isTeacher && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Chọn GV:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              >
                {allowedTeachers.map((t, idx) => (
                  <option key={`eval-tch-${t.user_id || t.id}-${idx}`} value={t.user_id}>
                    {t.ho_ten} - {t.to_chuyen_mon} ({t.ma_giao_vien})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" /> In phiếu A4
          </button>

          {/* Nút Mục 1: GIÁO VIÊN có nút GỬI GIẢI TRÌNH */}
          {(userRole === 'GIAO_VIEN' || selectedTeacherId === currentUser.id) && (
            <button
              onClick={() => handleOpenAppealModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> GỬI GIẢI TRÌNH
            </button>
          )}

          {(isBgh || isCouncil) && (
            <button
              onClick={() => setShowControlledModal(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                evaluation.isControlled
                  ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 ring-2 ring-red-500/20'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Đánh dấu hoặc gỡ bỏ điều kiện khống chế thi đua (Mục 5)"
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              {evaluation.isControlled ? 'Khống chế (CONTROLLED)' : 'Khống chế thi đua'}
            </button>
          )}

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saveSuccess ? 'Đã lưu thành công!' : 'Lưu kết quả chấm'}
          </button>
        </div>
      </div>

      {/* CONTROLLED CONDITION ALERT (Mục 5: Bị khống chế theo điều kiện thi đua) */}
      {evaluation.isControlled && (
        <div className="bg-red-50 border-2 border-red-500 p-5 rounded-2xl shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded text-[10px]">
                  CONTROLLED
                </span>
                <h2 className="text-sm font-black text-red-950">
                  “Bị khống chế theo điều kiện thi đua.”
                </h2>
              </div>
              <p className="mt-1 text-xs text-red-800 font-medium">
                Tổng điểm đạt <strong>{evaluation.finalScore}đ</strong> (Điểm tương ứng mức <strong>{evaluation.originalUncappedRating || evaluation.rating}</strong>), nhưng hệ thống khống chế mức xếp loại tối đa là <strong>{evaluation.controlledMaxRating || 'B'}</strong> theo quy chế thi đua.
              </p>
              {evaluation.controlledReason && (
                <div className="mt-2 text-red-900 bg-white/80 p-2.5 rounded-xl border border-red-200 text-xs">
                  <strong>Căn cứ / Lý do khống chế:</strong> {evaluation.controlledReason}
                  {evaluation.controlledMarkedBy && (
                    <span className="block text-[11px] text-red-700 mt-0.5">
                      Xác lập bởi: {evaluation.controlledMarkedBy} {evaluation.controlledMarkedAt ? `vào ${evaluation.controlledMarkedAt}` : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISCREPANCY WARNING BANNER (Section XI) */}
      {evaluation.discrepancyAlert && (
        <div className="bg-amber-50 border-2 border-amber-400 p-5 rounded-2xl shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                ⚠️ CẢNH BÁO CHÊNH LỆCH ĐIỂM (THEO ĐIỀU 18 QUY CHẾ)
              </h2>
              <div className="mt-2 text-xs text-amber-900 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white/70 p-3 rounded-xl border border-amber-200">
                <div>
                  Điểm tự chấm: <strong className="text-blue-800 text-sm">{evaluation.selfTotal}đ</strong>
                </div>
                <div>
                  Điểm tổ chấm: <strong className="text-amber-800 text-sm">{evaluation.teamTotal}đ</strong>
                </div>
                <div>
                  Chênh lệch:{' '}
                  <strong className="text-red-700 text-sm font-extrabold">
                    {Math.abs(evaluation.selfTotal - evaluation.teamTotal)} điểm (≥ 5.0đ)
                  </strong>
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Yêu cầu Tổ trưởng nhập: Lý do và căn cứ điều chỉnh điểm <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isTeamLeader && !isBgh}
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    placeholder="Ghi rõ lý do điều chỉnh giảm hoặc tăng điểm (VD: Hồ sơ nộp muộn, thiếu biên bản dự giờ, chưa đạt chỉ tiêu...)"
                    className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                </div>
                {(userRole === 'GIAO_VIEN' || selectedTeacherId === currentUser.id) && (
                  <button
                    onClick={() =>
                      handleOpenAppealModal(
                        undefined,
                        'Giải trình chênh lệch điểm tự chấm và tổ chấm',
                        discrepancyReason ? `Lý do chênh lệch từ tổ: ${discrepancyReason}` : ''
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> GỬI GIẢI TRÌNH
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Teacher Card & Score Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
              {selectedTeacher.name.split(' ').slice(-1)[0][0]}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate">
                {selectedTeacher.name}
              </div>
              <div className="text-xs text-slate-500">{selectedTeacher.position}</div>
              <div className="text-[11px] text-blue-600 font-medium">{selectedTeacher.departmentName}</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px] font-medium">Tự chấm</span>
            <span className="text-lg font-bold text-slate-800 block mt-0.5">{evaluation.selfTotal}đ</span>
            <span className="text-[10px] text-slate-400">Tối đa 100đ</span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-blue-600 block text-[11px] font-medium">Tổ chấm</span>
            <span className="text-lg font-bold text-blue-900 block mt-0.5">{evaluation.teamTotal}đ</span>
            <span className="text-[10px] text-blue-500">Tổ thẩm định</span>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <span className="text-indigo-600 block text-[11px] font-medium">BGH rà soát</span>
            <span className="text-lg font-bold text-indigo-900 block mt-0.5">{evaluation.bghTotal}đ</span>
            <span className="text-[10px] text-indigo-500">Cấp thẩm quyền</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-emerald-700 block text-[11px] font-medium">Tổng điểm thi đua</span>
            <span className="text-xl font-extrabold text-emerald-800 block mt-0.5">{evaluation.finalScore}đ</span>
            <span className="text-[10px] text-emerald-600">
              (+{evaluation.bonusPoints}đ / -{evaluation.deductionPoints}đ)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 col-span-2 sm:col-span-1">
            <span className="text-amber-800 block text-[11px] font-medium">Mức xếp loại (Mục 6)</span>
            <span className="text-base font-black text-amber-900 block mt-1">
              {getRatingTierInfo(evaluation.rating, settings.ratingThresholds).label}
            </span>
            <span className="text-[10px] text-amber-700 block font-semibold">
              Ngưỡng: {getRatingTierInfo(evaluation.rating, settings.ratingThresholds).rangeText}
            </span>
          </div>
        </div>
      </div>

      {/* VALIDATION WARNING ALERT (Mục 5) */}
      {validationNotice && (
        <div className="bg-rose-50 border-2 border-rose-400 p-4 rounded-2xl flex items-center gap-3 text-rose-900 text-xs font-bold shadow-md animate-in fade-in">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span>{validationNotice}</span>
            <div className="text-[11px] font-normal text-rose-700 mt-0.5">
              Hệ thống không cho phép nhập điểm &lt; 0 hoặc vượt quá điểm tối đa của tiêu chí (Quy chuẩn Mục 5).
            </div>
          </div>
          <button
            onClick={() => setValidationNotice(null)}
            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* APPENDIX 01 MAIN TABLE (Mục 4 & Mục 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Bảng điểm chi tiết 6 nhóm tiêu chí (100 điểm)
            </h2>
            <div className="text-xs text-slate-500">
              Nhập điểm tự chấm, tổ chấm và đính kèm minh chứng cho từng mục • Tự động tính tổng nhóm & 100 điểm
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Điểm Tự chấm
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Điểm Tổ chấm
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Điểm BGH
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200 sticky top-16 z-20">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Mã</th>
                <th className="py-3 px-4 min-w-[280px]">Tiêu chí</th>
                <th className="py-3 px-3 w-24 text-center">Điểm tối đa</th>
                <th className="py-3 px-3 w-24 text-center bg-blue-50/70 border-x border-blue-100 text-blue-900">
                  Tự chấm
                </th>
                <th className="py-3 px-3 w-24 text-center bg-indigo-50/70 border-r border-indigo-100 text-indigo-900">
                  Tổ chấm
                </th>
                <th className="py-3 px-3 w-24 text-center bg-emerald-50/70 border-r border-emerald-100 text-emerald-900">
                  BGH
                </th>
                <th className="py-3 px-4 min-w-[220px]">Minh chứng</th>
              </tr>
            </thead>
            <tbody>
              {dbGroups.map((group) => {
                const isCollapsed = collapsedGroups[group.id];
                const groupCriteria = allDbCriteria
                  .filter((c) => c.group_id === group.id && c.is_active)
                  .map((c) => ({
                    id: c.id,
                    code: c.ma_tieu_chi,
                    groupId: c.group_id,
                    title: c.ten_tieu_chi,
                    maxScore: c.diem_toi_da,
                    description: c.mo_ta
                  }));

                // Calculate group totals
                let groupSelf = 0;
                let groupTeam = 0;
                let groupBgh = 0;
                groupCriteria.forEach((crit) => {
                  const s = evaluation.scores[crit.id];
                  if (s) {
                    groupSelf += Number(s.selfScore) || 0;
                    groupTeam += Number(s.teamScore) || 0;
                    groupBgh += Number(s.bghScore) || 0;
                  }
                });

                return (
                  <React.Fragment key={group.id}>
                    {/* Group Header Row */}
                    <tr
                      onClick={() => toggleGroup(group.id)}
                      className="bg-slate-100 hover:bg-slate-200/80 cursor-pointer font-bold text-slate-800 border-y border-slate-200 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 inline text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 inline text-slate-500" />
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-extrabold text-blue-950 uppercase">
                        {group.ten_nhom}
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-900 font-extrabold">
                        {group.diem_toi_da}đ
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold bg-blue-100/50 text-blue-900 border-x border-blue-200">
                        {Math.round(groupSelf * 10) / 10}đ
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold bg-indigo-100/50 text-indigo-900 border-r border-indigo-200">
                        {Math.round(groupTeam * 10) / 10}đ
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold bg-emerald-100/50 text-emerald-900 border-r border-emerald-200">
                        {Math.round(groupBgh * 10) / 10}đ
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px] font-normal italic">
                        {group.mo_ta}
                      </td>
                    </tr>

                    {/* Criteria Item Rows */}
                    {!isCollapsed &&
                      groupCriteria.map((crit) => {
                        const scoreData = evaluation.scores[crit.id] || {
                          criteriaId: crit.id,
                          criteriaCode: crit.code,
                          selfScore: 0,
                          teamScore: 0,
                          bghScore: 0
                        };

                        const critEvidences = teacherEvidences.filter(
                          (e) => e.criteriaId === crit.id
                        );

                        return (
                          <tr
                            key={crit.id}
                            className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3 px-3 text-center font-bold text-slate-700 bg-slate-50/50">
                              {crit.code}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{crit.title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                {crit.description}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-700">
                              {crit.maxScore}
                            </td>

                            {/* Self Score Input */}
                            <td className="py-3 px-3 text-center bg-blue-50/30 border-x border-blue-100">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={crit.maxScore}
                                disabled={!isTeacher && currentUser.role !== 'ADMIN'}
                                value={scoreData.selfScore ?? 0}
                                onChange={(e) =>
                                  handleScoreChange(
                                    crit.id,
                                    crit.code,
                                    'selfScore',
                                    e.target.value,
                                    crit.maxScore
                                  )
                                }
                                className="w-16 text-center py-1 px-1.5 rounded-lg border border-blue-200 bg-white font-bold text-slate-900 focus:ring-1 focus:ring-blue-500 text-xs shadow-2xs"
                              />
                            </td>

                            {/* Team Score Input */}
                            <td className="py-3 px-3 text-center bg-indigo-50/30 border-r border-indigo-100">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={crit.maxScore}
                                disabled={!isTeamLeader}
                                value={scoreData.teamScore ?? 0}
                                onChange={(e) =>
                                  handleScoreChange(
                                    crit.id,
                                    crit.code,
                                    'teamScore',
                                    e.target.value,
                                    crit.maxScore
                                  )
                                }
                                className="w-16 text-center py-1 px-1.5 rounded-lg border border-indigo-200 bg-white font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 text-xs shadow-2xs"
                              />
                            </td>

                            {/* BGH Score Input */}
                            <td className="py-3 px-3 text-center bg-emerald-50/30 border-r border-emerald-100">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={crit.maxScore}
                                disabled={!isBgh}
                                value={scoreData.bghScore ?? 0}
                                onChange={(e) =>
                                  handleScoreChange(
                                    crit.id,
                                    crit.code,
                                    'bghScore',
                                    e.target.value,
                                    crit.maxScore
                                  )
                                }
                                className="w-16 text-center py-1 px-1.5 rounded-lg border border-emerald-200 bg-white font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500 text-xs shadow-2xs"
                              />
                            </td>

                            {/* Evidence Column (Section XV) */}
                            <td className="py-3 px-4">
                              <div className="space-y-1.5">
                                {critEvidences.length > 0 ? (
                                  critEvidences.map((ev, idx) => (
                                    <div
                                      key={ev.id}
                                      onClick={() => onViewEvidence(ev)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[11px] text-blue-700 cursor-pointer shadow-2xs transition-colors max-w-full"
                                      title={ev.name}
                                    >
                                      <FileText className="w-3.5 h-3.5 shrink-0" />
                                      <span className="font-semibold">[{idx + 1}]</span>
                                      <span className="truncate max-w-[150px]">{ev.name}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic block">
                                    Chưa có minh chứng
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onOpenUpload(crit.id)}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline block pt-0.5 cursor-pointer"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" /> + Thêm minh chứng
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
            {/* Grand Total Footer */}
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
              <tr>
                <td colSpan={2} className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-800">
                  Tổng điểm các tiêu chí (Thang 100đ):
                </td>
                <td className="py-3.5 px-3 text-center text-slate-900 font-black">100đ</td>
                <td className="py-3.5 px-3 text-center bg-blue-100 text-blue-900 font-black text-sm">
                  {evaluation.selfTotal}đ
                </td>
                <td className="py-3.5 px-3 text-center bg-indigo-100 text-indigo-900 font-black text-sm">
                  {evaluation.teamTotal}đ
                </td>
                <td className="py-3.5 px-3 text-center bg-emerald-100 text-emerald-900 font-black text-sm">
                  {evaluation.bghTotal}đ
                </td>
                <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                  Tổng hợp trước điểm cộng / trừ
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* BGH Adjustments Notice (Mục 5: Không cho sửa âm thầm) */}
      {evaluation.bghAdjustments && evaluation.bghAdjustments.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
            <Edit3 className="w-4 h-4 text-indigo-600" />
            Lịch sử Ban Giám hiệu điều chỉnh điểm thi đua ({evaluation.bghAdjustments.length} lần)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evaluation.bghAdjustments.map((adj, i) => (
              <div key={adj.id || i} className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Tiêu chí {adj.criteriaCode}: {adj.oldScore}đ → <strong className="text-indigo-700">{adj.newScore}đ</strong></span>
                  <span className="font-mono text-slate-400 text-[10px]">{adj.adjustedAt}</span>
                </div>
                <div className="text-slate-600 text-[11px]"><strong>Lý do:</strong> {adj.reason}</div>
                <div className="text-slate-500 text-[10px]"><strong>Căn cứ:</strong> {adj.evidenceBasis} (Điều chỉnh bởi: {adj.adjustedBy})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Comments & Confirmation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Leader Comments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Nhận xét & Kết luận của Tổ chuyên môn
            </h3>
            <span className="text-[11px] text-slate-400">Tổ trưởng phê duyệt</span>
          </div>
          <textarea
            rows={3}
            disabled={!isTeamLeader}
            value={teamComment}
            onChange={(e) => setTeamComment(e.target.value)}
            placeholder="Tổ trưởng ghi nhận xét về tinh thần trách nhiệm, chuyên môn, tiến độ thực hiện nhiệm vụ..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* BGH Comments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Nhận xét & Phê duyệt của Ban Giám hiệu
            </h3>
            <span className="text-[11px] text-slate-400">Hiệu trưởng ký duyệt</span>
          </div>
          <textarea
            rows={3}
            disabled={!isBgh}
            value={bghComment}
            onChange={(e) => setBghComment(e.target.value)}
            placeholder="Ban giám hiệu ghi ý kiến rà soát, kết luận xếp loại thi đua cá nhân..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* MODAL THIẾT LẬP ĐIỀU KIỆN KHỐNG CHẾ (Mục 5) */}
      {showControlledModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <h2 className="text-base font-bold">
                  Thiết lập Điều kiện khống chế thi đua (Mục 5)
                </h2>
              </div>
              <button
                onClick={() => setShowControlledModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const saved = storageService.setControlledCondition(
                  selectedTeacherId,
                  true,
                  controlledMaxRatingInput,
                  controlledReasonInput,
                  currentUser
                );
                setEvaluation(saved);
                setShowControlledModal(false);
                setValidationNotice('Đã thiết lập điều kiện khống chế thi đua cho giáo viên thành công!');
                setTimeout(() => setValidationNotice(null), 3500);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-sm">{selectedTeacher.name}</div>
                <div className="text-slate-500 text-xs">
                  {selectedTeacher.departmentName} • Điểm hiện tại: <strong>{evaluation.finalScore}đ</strong> (Xếp loại gốc: {evaluation.originalUncappedRating || evaluation.rating})
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mức xếp loại khống chế tối đa được phép (Mục 5):
                </label>
                <select
                  value={controlledMaxRatingInput}
                  onChange={(e) => setControlledMaxRatingInput(e.target.value as RatingLevel)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-red-900"
                >
                  <option value="B">Mức B (Hoàn thành - Không cho lên A hoặc A+)</option>
                  <option value="C">Mức C (Cần cố gắng - Tối đa mức C)</option>
                  <option value="D">Mức D (Không hoàn thành nhiệm vụ)</option>
                </select>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Dù điểm số thực tế có cao hơn, hệ thống sẽ tự động khống chế không xếp mức cao hơn mức này.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do & Căn cứ khống chế <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  value={controlledReasonInput}
                  onChange={(e) => setControlledReasonInput(e.target.value)}
                  placeholder="VD: Nghỉ dạy quá số tiết quy định; bị kỷ luật khiển trách; có học sinh khiếu nại về đạo đức..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {evaluation.isControlled && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Xác nhận gỡ bỏ điều kiện khống chế cho giáo viên này?')) {
                        const saved = storageService.setControlledCondition(
                          selectedTeacherId,
                          false,
                          undefined,
                          undefined,
                          currentUser
                        );
                        setEvaluation(saved);
                        setShowControlledModal(false);
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs cursor-pointer"
                  >
                    Gỡ bỏ khống chế
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowControlledModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Xác nhận khống chế
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GỬI GIẢI TRÌNH (Mục 1: GIÁO VIÊN có nút GỬI GIẢI TRÌNH - Form: Nội dung, Tiêu chí, Minh chứng, File đính kèm, Thời gian gửi) */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-purple-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-purple-200" />
                <h2 className="text-base font-bold">Gửi Đơn Giải trình Thi đua (Mục 1)</h2>
              </div>
              <button
                onClick={() => setShowAppealModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmitAppeal} className="p-6 space-y-4 text-xs">
              {appealError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{appealError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề đơn giải trình <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={appealTitle}
                  onChange={(e) => setAppealTitle(e.target.value)}
                  placeholder="VD: Giải trình về sự cố nộp muộn kế hoạch tuần 8..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tiêu chí liên quan (Mục 1) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiêu chí liên quan (Mục 1):
                  </label>
                  <select
                    value={appealCriteriaCode}
                    onChange={(e) => setAppealCriteriaCode(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="">-- Chọn tiêu chí --</option>
                    {allDbCriteria.map((c) => (
                      <option key={c.id} value={c.ma_tieu_chi}>
                        Tiêu chí {c.ma_tieu_chi} ({c.ten_tieu_chi.substring(0, 24)}...)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minh chứng liên quan (Mục 1) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Minh chứng liên quan (Mục 1):
                  </label>
                  <select
                    value={appealAttachedFileName ? 'custom' : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const ev = teacherEvidences.find((x) => x.id === e.target.value);
                        if (ev) {
                          setAppealAttachedFileName(ev.fileName || ev.name);
                          setAppealAttachedFileUrl(ev.fileUrl || '');
                        }
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- Chọn minh chứng đã nộp --</option>
                    {teacherEvidences.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        [{ev.criteriaCode}] {ev.name.substring(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nội dung giải trình (Mục 1) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung giải trình chi tiết <span className="text-red-500">* (Mục 1)</span>:
                </label>
                <textarea
                  rows={4}
                  required
                  value={appealContent}
                  onChange={(e) => setAppealContent(e.target.value)}
                  placeholder="Trình bày rõ lý do khách quan/chủ quan, căn cứ chứng minh, đề xuất với Tổ trưởng và BGH..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* File đính kèm (Mục 1) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên file đính kèm (Mục 1):
                  </label>
                  <input
                    type="text"
                    value={appealAttachedFileName}
                    onChange={(e) => setAppealAttachedFileName(e.target.value)}
                    placeholder="VD: BienBanKiemTra.pdf"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Đường dẫn tệp (URL / Drive):
                  </label>
                  <input
                    type="url"
                    value={appealAttachedFileUrl}
                    onChange={(e) => setAppealAttachedFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Thời gian gửi (Mục 1) */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 flex items-center justify-between text-[11px]">
                <span className="font-semibold">Thời gian gửi (tự động ghi nhận):</span>
                <span className="font-mono font-bold text-purple-800">{getAuthoritativeTimestamp()}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> GỬI GIẢI TRÌNH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
