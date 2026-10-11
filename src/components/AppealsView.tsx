import React, { useState } from 'react';
import {
  MessageSquareQuote,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  User as UserIcon,
  X,
  AlertCircle,
  AlertTriangle,
  History,
  FileText,
  Calendar,
  Check,
  XCircle,
  UploadCloud,
  Layers,
  ArrowRight,
  Filter,
  Eye,
  FolderGit2
} from 'lucide-react';
import {
  AppealItem,
  AppealStatus,
  SupplementRequest,
  EvidenceItem,
  EvidenceVersion,
  User,
  normalizeRole
} from '../types';
import { storageService } from '../services/storageService';
import { criteriaService } from '../services/criteriaService';
import { getAuthoritativeTimestamp } from '../utils/formatters';

interface AppealsViewProps {
  currentUser: User;
}

export const AppealsView: React.FC<AppealsViewProps> = ({ currentUser }) => {
  const normRole = normalizeRole(currentUser.role);
  const isTeacher = normRole === 'GIAO_VIEN';
  const isLeaderOrAdmin =
    normRole === 'TO_TRUONG' ||
    normRole === 'TO_PHO' ||
    normRole === 'BGH' ||
    normRole === 'ADMIN' ||
    normRole === 'HOI_DONG_TDKT';

  // Active top sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'APPEALS' | 'SUPPLEMENTS' | 'VERSIONS'>('APPEALS');

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateAppealModal, setShowCreateAppealModal] = useState(false);
  const [showCreateSupplementModal, setShowCreateSupplementModal] = useState(false);
  const [showSupplementEvidenceModal, setShowSupplementEvidenceModal] = useState(false);
  const [selectedAppealForReview, setSelectedAppealForReview] = useState<AppealItem | null>(null);
  const [selectedAppealForHistory, setSelectedAppealForHistory] = useState<AppealItem | null>(null);
  const [selectedEvidenceForVersions, setSelectedEvidenceForVersions] = useState<EvidenceItem | null>(null);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(1);

  // Form states: Create Appeal (Mục 1)
  const [appealTitle, setAppealTitle] = useState('');
  const [appealContent, setAppealContent] = useState('');
  const [selectedCriteriaCode, setSelectedCriteriaCode] = useState('');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileUrl, setAttachedFileUrl] = useState('');
  const [appealTargetType, setAppealTargetType] = useState<AppealItem['targetType']>('SCORE');
  const [formError, setFormError] = useState<string | null>(null);

  // Form states: Review Appeal (Mục 5)
  const [reviewStatusChoice, setReviewStatusChoice] = useState<AppealStatus>('UNDER_REVIEW');
  const [reviewResponseContent, setReviewResponseContent] = useState('');

  // Form states: Create Supplement Request (Mục 2)
  const [suppTeacherId, setSuppTeacherId] = useState('');
  const [suppEvidenceId, setSuppEvidenceId] = useState('');
  const [suppReason, setSuppReason] = useState('');
  const [suppDeadline, setSuppDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Form states: Supplement Evidence (Mục 3)
  const [targetEvidenceToSupplement, setTargetEvidenceToSupplement] = useState<EvidenceItem | null>(null);
  const [targetSupplementRequestId, setTargetSupplementRequestId] = useState<string | undefined>(undefined);
  const [supplementFileName, setSupplementFileName] = useState('');
  const [supplementFileUrl, setSupplementFileUrl] = useState('');
  const [supplementNote, setSupplementNote] = useState('');

  // Toast notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3800);
  };

  // Data queries
  const allAppeals = storageService.getAppeals();
  const allSupplements = storageService.getSupplementRequests();
  const allEvidences = storageService.getEvidences();
  const allCriteria = criteriaService.getAllCriteria();
  const allTeachers = storageService.getUsers().filter(
    (u) =>
      u.role === 'GIAO_VIEN' ||
      u.role === 'TEACHER' ||
      u.role === 'TO_TRUONG' ||
      u.role === 'TEAM_LEADER' ||
      u.role === 'TO_PHO'
  );

  // Teacher-scoped data if role is teacher
  const displayedAppeals = isTeacher
    ? allAppeals.filter((a) => a.teacherId === currentUser.id)
    : allAppeals;

  const displayedSupplements = isTeacher
    ? allSupplements.filter((s) => s.teacherId === currentUser.id)
    : allSupplements;

  const myEvidences = allEvidences.filter((e) => e.teacherId === currentUser.id);

  // Filtered appeals
  const filteredAppeals = displayedAppeals.filter((a) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'SUBMITTED' && a.status !== 'SUBMITTED' && a.status !== 'CHO_XU_LY') return false;
      if (statusFilter === 'UNDER_REVIEW' && a.status !== 'UNDER_REVIEW') return false;
      if (statusFilter === 'ACCEPTED' && a.status !== 'ACCEPTED' && a.status !== 'DA_GIAI_QUYET') return false;
      if (statusFilter === 'REJECTED' && a.status !== 'REJECTED' && a.status !== 'TU_CHOI') return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(term);
      const matchTeacher = a.teacherName.toLowerCase().includes(term);
      const matchContent = a.content.toLowerCase().includes(term);
      const matchCrit = a.criteriaCode?.toLowerCase().includes(term);
      return matchTitle || matchTeacher || matchContent || matchCrit;
    }
    return true;
  });

  // Multiversion evidences list
  const multiVersionEvidences = allEvidences.filter(
    (e) => (e.versions && e.versions.length > 1) || (isTeacher && e.teacherId === currentUser.id)
  );

  // 1. Handle Submit Appeal (Mục 1)
  const handleOpenCreateAppeal = () => {
    setAppealTitle('');
    setAppealContent('');
    setSelectedCriteriaCode('2.3');
    setSelectedEvidenceId('');
    setAttachedFileName('');
    setAttachedFileUrl('');
    setAppealTargetType('SCORE');
    setFormError(null);
    setShowCreateAppealModal(true);
  };

  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!appealContent.trim()) {
      setFormError('Vui lòng nhập nội dung giải trình!');
      return;
    }

    const matchedCrit = allCriteria.find((c) => c.ma_tieu_chi === selectedCriteriaCode);
    const matchedEv = allEvidences.find((ev) => ev.id === selectedEvidenceId);

    const newAppeal: AppealItem = {
      id: `appeal-${Date.now()}`,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      departmentName: currentUser.departmentName,
      title: appealTitle.trim() || `Giải trình tiêu chí ${selectedCriteriaCode || 'chuyên môn'}`,
      content: appealContent.trim(),
      criteriaCode: selectedCriteriaCode || undefined,
      criteriaTitle: matchedCrit?.ten_tieu_chi,
      relatedEvidenceId: matchedEv?.id,
      relatedEvidenceName: matchedEv?.name,
      attachedFiles: attachedFileName
        ? [
            {
              name: attachedFileName.trim(),
              url: attachedFileUrl.trim() || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80',
              size: '1.8 MB'
            }
          ]
        : undefined,
      submittedAt: getAuthoritativeTimestamp(),
      targetType: appealTargetType,
      status: 'SUBMITTED',
      auditLogs: []
    };

    try {
      storageService.saveAppeal(newAppeal, currentUser);
      setShowCreateAppealModal(false);
      showToast('Đã gửi đơn giải trình thành công! Tổ trưởng và BGH đã nhận được thông báo.');
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi gửi giải trình.');
    }
  };

  // 2. Handle Review Appeal (Mục 5)
  const handleConfirmReviewAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppealForReview) return;
    if (!reviewResponseContent.trim()) {
      alert('Vui lòng nhập ý kiến phản hồi / kết luận xử lý!');
      return;
    }

    try {
      storageService.updateAppealStatus(
        selectedAppealForReview.id,
        reviewStatusChoice,
        reviewResponseContent,
        currentUser
      );
      setSelectedAppealForReview(null);
      setReviewResponseContent('');
      showToast(`Đã cập nhật trạng thái giải trình thành [${reviewStatusChoice}].`);
    } catch (err: any) {
      alert(err.message || 'Lỗi xử lý giải trình.');
    }
  };

  // 3. Handle Create Supplement Request (Mục 2)
  const handleOpenCreateSupplement = () => {
    setSuppTeacherId(allTeachers[0]?.id || '');
    setSuppEvidenceId('');
    setSuppReason('');
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setSuppDeadline(d.toISOString().split('T')[0]);
    setShowCreateSupplementModal(true);
  };

  const handleConfirmCreateSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppReason.trim()) {
      alert('Vui lòng nhập lý do yêu cầu bổ sung minh chứng!');
      return;
    }

    const matchedEv = allEvidences.find((e) => e.id === suppEvidenceId);
    const matchedTeacher = allTeachers.find((t) => t.id === suppTeacherId);

    try {
      storageService.createSupplementRequest(
        {
          teacherId: suppTeacherId,
          evidenceId: matchedEv?.id,
          evidenceName: matchedEv?.name,
          criteriaId: matchedEv?.criteriaId,
          criteriaCode: matchedEv?.criteriaCode,
          criteriaTitle: matchedEv?.criteriaTitle,
          reason: suppReason.trim(),
          deadline: suppDeadline
        },
        currentUser
      );
      setShowCreateSupplementModal(false);
      showToast(`Đã tạo nhiệm vụ yêu cầu bổ sung minh chứng cho giáo viên ${matchedTeacher?.name || ''}.`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo yêu cầu bổ sung.');
    }
  };

  // 4. Handle Supplement Evidence (Mục 3: BỔ SUNG MINH CHỨNG - Tạo version mới)
  const handleOpenSupplementEvidence = (ev: EvidenceItem, suppReqId?: string) => {
    setTargetEvidenceToSupplement(ev);
    setTargetSupplementRequestId(suppReqId);
    setSupplementFileName(`BoSung_${ev.fileName}`);
    setSupplementFileUrl('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80');
    setSupplementNote('');
    setShowSupplementEvidenceModal(true);
  };

  const handleConfirmSupplementEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEvidenceToSupplement) return;
    if (!supplementFileName.trim()) {
      alert('Vui lòng nhập tên tệp bổ sung!');
      return;
    }

    try {
      storageService.supplementEvidence(
        targetEvidenceToSupplement.id,
        {
          fileName: supplementFileName.trim(),
          fileUrl: supplementFileUrl.trim() || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80',
          fileSize: '2.4 MB',
          fileType: 'application/pdf',
          note: supplementNote.trim(),
          supplementRequestId: targetSupplementRequestId
        },
        currentUser
      );

      setShowSupplementEvidenceModal(false);
      showToast('Đã nộp bổ sung minh chứng thành công! Hệ thống đã tạo phiên bản Version mới.');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi bổ sung minh chứng.');
    }
  };

  // Helper status badge for Appeal (Mục 5)
  const getAppealStatusBadge = (status: AppealStatus) => {
    switch (status) {
      case 'SUBMITTED':
      case 'CHO_XU_LY':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" /> SUBMITTED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> UNDER_REVIEW
          </span>
        );
      case 'ACCEPTED':
      case 'DA_GIAI_QUYET':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACCEPTED
          </span>
        );
      case 'REJECTED':
      case 'TU_CHOI':
        return (
          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-rose-300 inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <MessageSquareQuote className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              MODULE QUY TRÌNH – GIẢI TRÌNH & BỔ SUNG MINH CHỨNG
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Trung tâm Giải trình & Bổ sung Minh chứng Thi đua
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý đơn giải trình (4 trạng thái), nhiệm vụ yêu cầu bổ sung, tạo version mới không xóa file cũ và audit log bất biến
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Nút Mục 1: GIÁO VIÊN có nút GỬI GIẢI TRÌNH */}
          <button
            onClick={handleOpenCreateAppeal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" /> GỬI GIẢI TRÌNH
          </button>

          {/* Nút Mục 2: Tổ trưởng/BGH có nút YÊU CẦU BỔ SUNG */}
          {isLeaderOrAdmin && (
            <button
              onClick={handleOpenCreateSupplement}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" /> YÊU CẦU BỔ SUNG
            </button>
          )}
        </div>
      </div>

      {/* Global Toast */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('APPEALS')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'APPEALS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" />
          Đơn Giải trình ({displayedAppeals.length})
        </button>

        <button
          onClick={() => setActiveSubTab('SUPPLEMENTS')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'SUPPLEMENTS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Nhiệm vụ Yêu cầu Bổ sung ({displayedSupplements.length})
          {displayedSupplements.some((s) => s.status === 'PENDING') && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('VERSIONS')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'VERSIONS'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Lịch sử Version Minh chứng ({multiVersionEvidences.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ĐƠN GIẢI TRÌNH (Mục 1 & 5) */}
      {/* ========================================================================= */}
      {activeSubTab === 'APPEALS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">Tất cả ({displayedAppeals.length})</option>
                <option value="SUBMITTED">SUBMITTED (Mới nộp)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (Đang xem xét)</option>
                <option value="ACCEPTED">ACCEPTED (Đã chấp thuận)</option>
                <option value="REJECTED">REJECTED (Từ chối)</option>
              </select>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tiêu đề, giáo viên, nội dung..."
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Appeals List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-3 text-center w-12">STT</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Giáo viên</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Tiêu chí / Minh chứng</th>
                    <th className="py-3.5 px-4 min-w-[260px]">Nội dung giải trình (Mục 1)</th>
                    <th className="py-3.5 px-4 min-w-[160px]">File đính kèm</th>
                    <th className="py-3.5 px-3 text-center w-28">Thời gian gửi</th>
                    <th className="py-3.5 px-3 text-center w-28">Trạng thái (Mục 5)</th>
                    <th className="py-3.5 px-4 text-center min-w-[140px]">Xử lý & Lịch sử</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppeals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <MessageSquareQuote className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        Không tìm thấy đơn giải trình nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredAppeals.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{item.teacherName}</div>
                          <div className="text-[11px] text-slate-400">{item.departmentName}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {item.criteriaCode && (
                            <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px] block w-fit mb-0.5">
                              Tiêu chí {item.criteriaCode}
                            </span>
                          )}
                          <div className="font-semibold text-slate-800 text-[11px]">
                            {item.relatedEvidenceName || item.criteriaTitle || 'Giải trình điểm số / vi phạm'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs mb-0.5">{item.title}</div>
                          <div className="text-slate-600 line-clamp-2 text-[11px]">{item.content}</div>
                          {item.responseContent && (
                            <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                              <span className="font-bold text-indigo-800">
                                Phản hồi ({item.responseBy || 'Hội đồng'}):
                              </span>{' '}
                              <span className="text-slate-700">{item.responseContent}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {item.attachedFiles && item.attachedFiles.length > 0 ? (
                            <div className="space-y-1">
                              {item.attachedFiles.map((file, fIdx) => (
                                <a
                                  key={fIdx}
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[150px]">{file.name}</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Không có tệp</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500">
                          {item.submittedAt}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {getAppealStatusBadge(item.status)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Lịch sử Audit Log (Mục 7) */}
                            <button
                              onClick={() => setSelectedAppealForHistory(item)}
                              className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
                              title="Xem toàn bộ lịch sử Audit Log (Mục 7)"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Xử lý đơn cho Tổ trưởng / BGH */}
                            {isLeaderOrAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedAppealForReview(item);
                                  setReviewStatusChoice(item.status === 'SUBMITTED' ? 'UNDER_REVIEW' : 'ACCEPTED');
                                  setReviewResponseContent(item.responseContent || '');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-[11px] cursor-pointer"
                              >
                                Xử lý
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NHIỆM VỤ YÊU CẦU BỔ SUNG MINH CHỨNG (Mục 2 & Mục 3) */}
      {/* ========================================================================= */}
      {activeSubTab === 'SUPPLEMENTS' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider">Cơ chế Nhiệm vụ Yêu cầu Bổ sung (Mục 2 & 3)</div>
              <p className="mt-0.5 text-amber-800">
                Khi Tổ trưởng/BGH phát hiện minh chứng chưa đạt hoặc thiếu số liệu, hệ thống tạo nhiệm vụ hiển thị rõ: <strong>Lý do, Người yêu cầu, Thời gian, Hạn bổ sung</strong> và gửi notification cho giáo viên. Giáo viên nhấn nút <strong>“BỔ SUNG MINH CHỨNG”</strong> để tạo Version mới (không xóa file cũ).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-600" />
                Danh sách nhiệm vụ yêu cầu bổ sung ({displayedSupplements.length})
              </div>
              {isLeaderOrAdmin && (
                <button
                  onClick={handleOpenCreateSupplement}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm yêu cầu bổ sung
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-3 text-center w-12">STT</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Giáo viên thực hiện</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Tiêu chí / Minh chứng</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Lý do yêu cầu bổ sung (Mục 2)</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Người yêu cầu</th>
                    <th className="py-3.5 px-3 text-center w-28">Thời gian yêu cầu</th>
                    <th className="py-3.5 px-3 text-center w-28">Hạn bổ sung</th>
                    <th className="py-3.5 px-3 text-center w-28">Trạng thái</th>
                    <th className="py-3.5 px-4 text-center min-w-[140px]">Thao tác bổ sung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedSupplements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                        Không có nhiệm vụ bổ sung minh chứng nào cần xử lý.
                      </td>
                    </tr>
                  ) : (
                    displayedSupplements.map((req, idx) => {
                      const targetEv = allEvidences.find((e) => e.id === req.evidenceId);
                      const isPending = req.status === 'PENDING';
                      const canTeacherSupplement = currentUser.id === req.teacherId && isPending;

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{req.teacherName}</div>
                            <div className="text-[11px] text-slate-400">{req.departmentName}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            {req.criteriaCode && (
                              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px] block w-fit mb-0.5">
                                Tiêu chí {req.criteriaCode}
                              </span>
                            )}
                            <div className="font-semibold text-slate-800 text-[11px]">
                              {req.evidenceName || req.criteriaTitle || 'Minh chứng chuyên môn'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-800">
                            <div className="font-bold text-rose-700 text-xs mb-0.5">
                              Lý do: "{req.reason}"
                            </div>
                            {req.supplementedNote && (
                              <div className="text-[11px] text-emerald-700 mt-1 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                                ✓ Đã bổ sung (Version {req.supplementedVersion}): {req.supplementedNote}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {req.requesterName}
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({req.requesterRole})
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500">
                            {req.createdAt}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {req.deadline}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            {isPending ? (
                              <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Đang chờ bổ sung
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã hoàn thành
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {canTeacherSupplement ? (
                              /* Nút Mục 3: GIÁO VIÊN có nút BỔ SUNG MINH CHỨNG */
                              <button
                                onClick={() => {
                                  if (targetEv) {
                                    handleOpenSupplementEvidence(targetEv, req.id);
                                  } else {
                                    alert('Không tìm thấy tệp minh chứng gốc. Vui lòng kiểm tra lại danh mục minh chứng.');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <UploadCloud className="w-3.5 h-3.5" /> BỔ SUNG MINH CHỨNG
                              </button>
                            ) : isPending ? (
                              <span className="text-[11px] text-slate-400 italic">Chờ GV nộp</span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-semibold">
                                Đã nộp Version {req.supplementedVersion || 2}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LỊCH SỬ VERSION MINH CHỨNG (Mục 4) */}
      {/* ========================================================================= */}
      {activeSubTab === 'VERSIONS' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
            <Layers className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider">Cơ chế Quản lý Lịch sử Version (Mục 4)</div>
              <p className="mt-0.5 text-blue-800">
                Khi giáo viên nộp bổ sung minh chứng, hệ thống <strong>không xóa minh chứng cũ</strong> mà tự động tạo <strong>Version 1, Version 2, Version 3...</strong> Cho phép xem lại toàn bộ các phiên bản đã nộp, đối chiếu tệp đính kèm và kiểm tra Audit Log.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of Multiversion Evidences */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-blue-600" /> Danh sách minh chứng có version
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {multiVersionEvidences.map((ev) => {
                  const verCount = ev.versions?.length || 1;
                  const isSelected = selectedEvidenceForVersions?.id === ev.id;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedEvidenceForVersions(ev);
                        setSelectedVersionNum(ev.currentVersion || verCount);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded text-[10px]">
                          Tiêu chí {ev.criteriaCode}
                        </span>
                        <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 text-[10px]">
                          {verCount} Phiên bản
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 mt-1.5 line-clamp-1">{ev.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">GV: {ev.teacherName}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Version Detail & Compare Pane */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              {selectedEvidenceForVersions ? (
                <div className="space-y-5">
                  <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          Tiêu chí {selectedEvidenceForVersions.criteriaCode}
                        </span>
                        <span className="text-xs text-slate-500">
                          {selectedEvidenceForVersions.criteriaTitle}
                        </span>
                      </div>
                      <h2 className="text-base font-black text-slate-900 mt-1">
                        {selectedEvidenceForVersions.name}
                      </h2>
                    </div>

                    {/* Nút BỔ SUNG MINH CHỨNG */}
                    {isTeacher && selectedEvidenceForVersions.teacherId === currentUser.id && (
                      <button
                        onClick={() => handleOpenSupplementEvidence(selectedEvidenceForVersions)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <UploadCloud className="w-4 h-4" /> Bổ sung Version mới
                      </button>
                    )}
                  </div>

                  {/* Version Tabs (Mục 4: Version 1, Version 2, Version 3) */}
                  <div className="bg-slate-100 p-2 rounded-xl flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-600 mr-2 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-indigo-600" /> Chọn xem phiên bản:
                    </span>
                    {(selectedEvidenceForVersions.versions && selectedEvidenceForVersions.versions.length > 0
                      ? selectedEvidenceForVersions.versions
                      : [
                          {
                            version: 1,
                            versionLabel: 'Version 1',
                            fileName: selectedEvidenceForVersions.fileName,
                            fileUrl: selectedEvidenceForVersions.fileUrl,
                            fileSize: selectedEvidenceForVersions.fileSize,
                            fileType: selectedEvidenceForVersions.fileType,
                            uploadedAt: selectedEvidenceForVersions.uploadedAt,
                            uploadedBy: selectedEvidenceForVersions.teacherName,
                            note: 'Phiên bản ban đầu'
                          }
                        ]
                    ).map((ver) => (
                      <button
                        key={ver.version}
                        onClick={() => setSelectedVersionNum(ver.version)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedVersionNum === ver.version
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {ver.versionLabel}{' '}
                        {ver.version === (selectedEvidenceForVersions.currentVersion || 1) && '(Hiện tại)'}
                      </button>
                    ))}
                  </div>

                  {/* Active Version Content Viewer */}
                  {(() => {
                    const versionsList = selectedEvidenceForVersions.versions || [
                      {
                        version: 1,
                        versionLabel: 'Version 1',
                        fileName: selectedEvidenceForVersions.fileName,
                        fileUrl: selectedEvidenceForVersions.fileUrl,
                        fileSize: selectedEvidenceForVersions.fileSize,
                        fileType: selectedEvidenceForVersions.fileType,
                        uploadedAt: selectedEvidenceForVersions.uploadedAt,
                        uploadedBy: selectedEvidenceForVersions.teacherName,
                        note: 'Phiên bản ban đầu'
                      }
                    ];
                    const currentVer = versionsList.find((v) => v.version === selectedVersionNum) || versionsList[0];

                    return (
                      <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-400 block font-medium">Phiên bản hiển thị:</span>
                            <span className="font-black text-indigo-900 text-sm">{currentVer.versionLabel}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Người nộp phiên bản:</span>
                            <span className="font-bold text-slate-800">{currentVer.uploadedBy}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Thời gian nộp:</span>
                            <span className="font-mono text-slate-700">{currentVer.uploadedAt}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Ghi chú bổ sung:</span>
                            <span className="font-medium text-slate-800">{currentVer.note || 'Không có ghi chú'}</span>
                          </div>
                        </div>

                        {/* File preview frame */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="font-bold text-slate-900">{currentVer.fileName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">({currentVer.fileSize})</span>
                            </div>
                            <a
                              href={currentVer.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Mở tệp phiên bản này
                            </a>
                          </div>

                          <iframe
                            src={currentVer.fileUrl}
                            title={currentVer.fileName}
                            className="w-full h-80 rounded-xl border border-slate-200 bg-slate-50"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400 text-xs">
                  <FolderGit2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  Chọn một minh chứng ở cột bên trái để xem lịch sử phiên bản (Version 1, Version 2, Version 3...)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: GỬI GIẢI TRÌNH (Mục 1) */}
      {/* ========================================================================= */}
      {showCreateAppealModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                <h2 className="text-base font-bold">Gửi Đơn Giải trình Thi đua (Mục 1)</h2>
              </div>
              <button
                onClick={() => setShowCreateAppealModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAppeal} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề đơn giải trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appealTitle}
                  onChange={(e) => setAppealTitle(e.target.value)}
                  placeholder="VD: Giải trình về sự cố nộp muộn kế hoạch bài dạy tuần 8..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tiêu chí liên quan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiêu chí liên quan (Mục 1)
                  </label>
                  <select
                    value={selectedCriteriaCode}
                    onChange={(e) => setSelectedCriteriaCode(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="">-- Không theo tiêu chí riêng --</option>
                    {allCriteria.map((c) => (
                      <option key={c.id} value={c.ma_tieu_chi}>
                        Tiêu chí {c.ma_tieu_chi} ({c.ten_tieu_chi.substring(0, 30)}...)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minh chứng liên quan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Minh chứng liên quan (Mục 1)
                  </label>
                  <select
                    value={selectedEvidenceId}
                    onChange={(e) => setSelectedEvidenceId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- Chọn minh chứng đã nộp --</option>
                    {myEvidences.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        [{ev.criteriaCode}] {ev.name.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nội dung giải trình */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung giải trình chi tiết <span className="text-red-500">* (Mục 1)</span>
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

              {/* File đính kèm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên file đính kèm (Mục 1)
                  </label>
                  <input
                    type="text"
                    value={attachedFileName}
                    onChange={(e) => setAttachedFileName(e.target.value)}
                    placeholder="VD: BienBanKiemTra.pdf"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Đường dẫn liên kết tệp (URL)
                  </label>
                  <input
                    type="url"
                    value={attachedFileUrl}
                    onChange={(e) => setAttachedFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Thời gian gửi tự động */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-between text-[11px]">
                <span>Thời gian gửi (tự động ghi nhận):</span>
                <span className="font-mono font-bold text-blue-800">{getAuthoritativeTimestamp()}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAppealModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Gửi đơn giải trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: XỬ LÝ ĐƠN GIẢI TRÌNH (Mục 5: 4 trạng thái chuẩn) */}
      {/* ========================================================================= */}
      {selectedAppealForReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" /> Xử lý Đơn Giải trình (Mục 5)
              </h2>
              <button
                onClick={() => setSelectedAppealForReview(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReviewAppeal} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{selectedAppealForReview.title}</div>
                <div className="text-slate-500">
                  Giáo viên: <strong>{selectedAppealForReview.teacherName}</strong> • {selectedAppealForReview.departmentName}
                </div>
                <div className="text-slate-700 mt-2 italic bg-white p-2 rounded border border-slate-200">
                  "{selectedAppealForReview.content}"
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn trạng thái giải trình (Mục 5) <span className="text-red-500">*</span>:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatusChoice('UNDER_REVIEW')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewStatusChoice === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    UNDER_REVIEW
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatusChoice('ACCEPTED')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewStatusChoice === 'ACCEPTED'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ACCEPTED
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatusChoice('REJECTED')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewStatusChoice === 'REJECTED'
                        ? 'bg-rose-100 text-rose-900 border-rose-400 ring-2 ring-rose-400/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    REJECTED
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung kết luận / Phản hồi xử lý <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewResponseContent}
                  onChange={(e) => setReviewResponseContent(e.target.value)}
                  placeholder="Ghi rõ ý kiến đồng ý, hướng dẫn bổ sung minh chứng hoặc lý do từ chối..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppealForReview(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Xác nhận kết luận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TẠO YÊU CẦU BỔ SUNG (Mục 2) */}
      {/* ========================================================================= */}
      {showCreateSupplementModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5" />
                <h2 className="text-base font-bold">Ban hành Yêu cầu Bổ sung Minh chứng (Mục 2)</h2>
              </div>
              <button
                onClick={() => setShowCreateSupplementModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateSupplement} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn Giáo viên nhận yêu cầu <span className="text-red-500">*</span>
                </label>
                <select
                  value={suppTeacherId}
                  onChange={(e) => {
                    setSuppTeacherId(e.target.value);
                    setSuppEvidenceId('');
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {allTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} - {t.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Minh chứng cần bổ sung (nếu có)
                </label>
                <select
                  value={suppEvidenceId}
                  onChange={(e) => setSuppEvidenceId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Chọn từ hồ sơ minh chứng của giáo viên --</option>
                  {allEvidences
                    .filter((ev) => ev.teacherId === suppTeacherId)
                    .map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        [{ev.criteriaCode}] {ev.name} ({ev.fileName})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do yêu cầu bổ sung <span className="text-red-500">* (Mục 2)</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  value={suppReason}
                  onChange={(e) => setSuppReason(e.target.value)}
                  placeholder="VD: Thiếu chữ ký của tổ trưởng tại trang 3; cần bổ sung bảng tổng hợp dự giờ đủ 8 tiết..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hạn bổ sung <span className="text-red-500">* (Mục 2)</span>:
                </label>
                <input
                  type="date"
                  required
                  value={suppDeadline}
                  onChange={(e) => setSuppDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>Quy định Mục 6:</strong> Hệ thống sẽ tự động phát thông báo Notification đẩy đến tài khoản của giáo viên ngay sau khi yêu cầu được tạo.
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSupplementModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md cursor-pointer"
                >
                  Ban hành yêu cầu bổ sung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BỔ SUNG MINH CHỨNG (Mục 3: Tạo version mới, không xóa version cũ) */}
      {/* ========================================================================= */}
      {showSupplementEvidenceModal && targetEvidenceToSupplement && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5" />
                <h2 className="text-base font-bold">Bổ sung Minh chứng (Mục 3 & 4)</h2>
              </div>
              <button
                onClick={() => setShowSupplementEvidenceModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSupplementEvidence} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{targetEvidenceToSupplement.name}</div>
                <div className="text-slate-500">
                  Tiêu chí {targetEvidenceToSupplement.criteriaCode} • Phiên bản hiện tại:{' '}
                  <strong className="text-indigo-700">
                    Version {targetEvidenceToSupplement.currentVersion || targetEvidenceToSupplement.versions?.length || 1}
                  </strong>
                </div>
                <div className="text-emerald-700 font-bold text-[11px] mt-1">
                  ✓ Khi nộp bổ sung, hệ thống sẽ tạo Version {(targetEvidenceToSupplement.currentVersion || targetEvidenceToSupplement.versions?.length || 1) + 1} và bảo lưu nguyên vẹn phiên bản cũ.
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên tệp bổ sung mới <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={supplementFileName}
                  onChange={(e) => setSupplementFileName(e.target.value)}
                  placeholder="VD: SoDuGio_BoSung_8Tiet.pdf"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đường dẫn tệp mới (URL / Cloud Storage) <span className="text-red-500">*</span>:
                </label>
                <input
                  type="url"
                  required
                  value={supplementFileUrl}
                  onChange={(e) => setSupplementFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú nội dung bổ sung (Mục 3):
                </label>
                <textarea
                  rows={3}
                  value={supplementNote}
                  onChange={(e) => setSupplementNote(e.target.value)}
                  placeholder="Ghi rõ nội dung đã cập nhật (VD: Đã bổ sung 4 tiết dự giờ tuần 4 có chữ ký đầy đủ của giáo viên bộ môn)..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplementEvidenceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Nộp bổ sung Version mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: LỊCH SỬ AUDIT LOG BẤT BIẾN (Mục 7) */}
      {/* ========================================================================= */}
      {selectedAppealForHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold">Lịch sử Audit Log Bất biến (Mục 7)</h2>
              </div>
              <button
                onClick={() => setSelectedAppealForHistory(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{selectedAppealForHistory.title}</div>
                <div className="text-slate-500 mt-0.5">
                  Giáo viên: {selectedAppealForHistory.teacherName} • Thời gian nộp: {selectedAppealForHistory.submittedAt}
                </div>
              </div>

              <div className="space-y-2">
                {!selectedAppealForHistory.auditLogs || selectedAppealForHistory.auditLogs.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 italic">
                    Chưa có sự kiện Audit Log nào được ghi nhận.
                  </div>
                ) : (
                  selectedAppealForHistory.auditLogs.map((log, i) => (
                    <div key={log.id || i} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="text-blue-700">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">{log.details}</div>
                      <div className="text-slate-400 text-[10px] italic">Thực hiện bởi: {log.actorName}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">
                Quy định Mục 7: Lịch sử Audit Log được lưu trữ bất biến và không cho phép xóa.
              </span>
              <button
                onClick={() => setSelectedAppealForHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
