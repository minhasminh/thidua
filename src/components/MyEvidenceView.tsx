import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  History,
  FolderOpen,
  Calendar,
  XCircle,
  Star,
  FileSpreadsheet,
  FileCode,
  Eye,
  ShieldCheck,
  Check,
  Sparkles,
  Send,
  Lock,
  MessageSquareQuote,
  UploadCloud,
  Layers,
  X,
  FolderGit2
} from 'lucide-react';
import { EvidenceItem, User, EvidenceStatus, AppealItem, SupplementRequest } from '../types';
import { storageService } from '../services/storageService';
import { evidenceStorageService } from '../services/evidenceStorageService';
import { CRITERIA_GROUPS } from '../data/criteriaData';
import { criteriaService } from '../services/criteriaService';
import { formatExactTimestamp, getAuthoritativeTimestamp } from '../utils/formatters';
import { EvidenceAuditHistoryModal } from './EvidenceAuditHistoryModal';
import { SupplementEvidenceModal } from './SupplementEvidenceModal';

interface MyEvidenceViewProps {
  currentUser: User;
  onOpenUpload: (criteriaId?: string) => void;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

export const MyEvidenceView: React.FC<MyEvidenceViewProps> = ({
  currentUser,
  onOpenUpload,
  onViewEvidence
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [historyModalEvidence, setHistoryModalEvidence] = useState<EvidenceItem | null>(null);
  const [supplementModalEvidence, setSupplementModalEvidence] = useState<EvidenceItem | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  // Form states: GỬI GIẢI TRÌNH (Mục 1)
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealTitle, setAppealTitle] = useState('');
  const [appealContent, setAppealContent] = useState('');
  const [appealCriteriaCode, setAppealCriteriaCode] = useState('');
  const [appealEvidenceId, setAppealEvidenceId] = useState('');
  const [appealAttachedFileName, setAppealAttachedFileName] = useState('');
  const [appealAttachedFileUrl, setAppealAttachedFileUrl] = useState('');
  const [appealError, setAppealError] = useState<string | null>(null);

  // Modal states: LỊCH SỬ PHIÊN BẢN VERSION (Mục 4)
  const [versionModalEvidence, setVersionModalEvidence] = useState<EvidenceItem | null>(null);
  const [selectedVerNum, setSelectedVerNum] = useState<number>(1);

  // Nút: “GỬI TỔ TRƯỞNG DUYỆT” (Mục 2)
  const handleSubmitToTeamLeader = (item: EvidenceItem) => {
    try {
      storageService.submitEvidenceToTeamLeader(item.id, currentUser);
      setSubmissionNotice(`Đã gửi minh chứng "${item.name}" (Tiêu chí ${item.criteriaCode}) lên Tổ trưởng chuyên môn duyệt thành công!`);
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setSubmissionNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi duyệt minh chứng');
    }
  };

  // Lấy danh sách minh chứng của giáo viên hiện tại (Mục 10: Giáo viên chỉ xem minh chứng của mình)
  const evidences = storageService.getTeacherEvidences(currentUser.id);
  const groups = criteriaService.getGroups();
  const allCriteria = criteriaService.getAllCriteria();
  const pendingSupplements = storageService
    .getSupplementRequests()
    .filter((s) => s.teacherId === currentUser.id && s.status === 'PENDING');

  // Xử lý mở form GỬI GIẢI TRÌNH (Mục 1)
  const handleOpenAppeal = (criteriaCode?: string, evidenceId?: string) => {
    setAppealTitle('');
    setAppealContent('');
    setAppealCriteriaCode(criteriaCode || '2.3');
    setAppealEvidenceId(evidenceId || '');
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

    const matchedCrit = allCriteria.find((c) => c.ma_tieu_chi === appealCriteriaCode);
    const matchedEv = evidences.find((ev) => ev.id === appealEvidenceId);

    const newAppeal: AppealItem = {
      id: `appeal-${Date.now()}`,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      departmentName: currentUser.departmentName,
      title: appealTitle.trim() || `Giải trình tiêu chí ${appealCriteriaCode || 'chuyên môn'}`,
      content: appealContent.trim(),
      criteriaCode: appealCriteriaCode || undefined,
      criteriaTitle: matchedCrit?.ten_tieu_chi,
      relatedEvidenceId: matchedEv?.id,
      relatedEvidenceName: matchedEv?.name,
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
      targetType: 'EVIDENCE',
      status: 'SUBMITTED',
      auditLogs: []
    };

    try {
      storageService.saveAppeal(newAppeal, currentUser);
      setShowAppealModal(false);
      setSubmissionNotice('Đã gửi đơn giải trình thành công! Tổ trưởng và BGH đã nhận được thông báo.');
      setTimeout(() => setSubmissionNotice(null), 4500);
    } catch (err: any) {
      setAppealError(err.message || 'Lỗi khi gửi giải trình.');
    }
  };

  // Thống kê nhanh theo Mục 8: Tổng số, Đã duyệt, Chờ duyệt, Cần bổ sung, Từ chối
  const totalCount = evidences.length;
  const approvedCount = evidences.filter(
    (e) => e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED' || e.status === 'LOCKED'
  ).length;
  const pendingCount = evidences.filter(
    (e) => e.status === 'SUBMITTED' || e.status === 'TEAM_REVIEW' || e.status === 'BGH_REVIEW' || e.status === 'DRAFT'
  ).length;
  const revisionCount = evidences.filter((e) => e.status === 'REVISION_REQUIRED').length;
  const rejectedCount = evidences.filter((e) => e.status === 'REJECTED').length;

  // Lọc theo bộ lọc và tìm kiếm (Mục 8)
  const filteredList = evidences.filter((item) => {
    if (filterGroupId !== 'ALL' && item.criteriaGroupId !== filterGroupId) return false;
    if (filterSemester !== 'ALL' && item.semester !== filterSemester) return false;
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'APPROVED') {
        if (item.status !== 'TEAM_APPROVED' && item.status !== 'BGH_APPROVED' && item.status !== 'LOCKED') return false;
      } else if (filterStatus === 'PENDING') {
        if (item.status !== 'SUBMITTED' && item.status !== 'TEAM_REVIEW' && item.status !== 'BGH_REVIEW' && item.status !== 'DRAFT') return false;
      } else if (item.status !== filterStatus) {
        return false;
      }
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.criteriaCode.toLowerCase().includes(q);
      const matchFileName = item.fileName.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchFileName && !matchDesc) return false;
    }
    return true;
  });

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-300">
            Bản nháp
          </span>
        );
      case 'SUBMITTED':
      case 'TEAM_REVIEW':
        return (
          <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-blue-300 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" /> Chờ duyệt
          </span>
        );
      case 'TEAM_APPROVED':
        return (
          <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-indigo-300 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Tổ đã duyệt
          </span>
        );
      case 'BGH_REVIEW':
        return (
          <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-purple-300">
            BGH rà soát
          </span>
        );
      case 'BGH_APPROVED':
      case 'LOCKED':
        return (
          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-300 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã duyệt
          </span>
        );
      case 'REVISION_REQUIRED':
        return (
          <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-300 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Cần bổ sung
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-red-300 flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" /> Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <span className="p-1 rounded bg-red-100 text-red-700 font-bold text-[10px] uppercase">PDF</span>;
    }
    if (ext === 'doc' || ext === 'docx') {
      return <span className="p-1 rounded bg-blue-100 text-blue-700 font-bold text-[10px] uppercase">DOC</span>;
    }
    if (ext === 'xls' || ext === 'xlsx') {
      return <span className="p-1 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase">XLS</span>;
    }
    if (ext === 'ppt' || ext === 'pptx') {
      return <span className="p-1 rounded bg-amber-100 text-amber-700 font-bold text-[10px] uppercase">PPT</span>;
    }
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      return <span className="p-1 rounded bg-purple-100 text-purple-700 font-bold text-[10px] uppercase">IMG</span>;
    }
    if (ext === 'zip') {
      return <span className="p-1 rounded bg-slate-200 text-slate-800 font-bold text-[10px] uppercase">ZIP</span>;
    }
    return <span className="p-1 rounded bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">FILE</span>;
  };

  // Xóa minh chứng (Mục 10 & Mục 11: Chỉ xóa khi chưa duyệt, ghi Audit Log)
  const handleDelete = (item: EvidenceItem) => {
    if (item.status === 'TEAM_APPROVED' || item.status === 'BGH_APPROVED' || item.status === 'LOCKED') {
      alert('Không thể xóa minh chứng đã được duyệt hoặc đã khóa!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa minh chứng "${item.name}" không?\nThao tác này sẽ ghi nhận vào nhật ký hệ thống.`)) {
      const ok = storageService.deleteEvidence(item.id, currentUser);
      if (ok) {
        setRefreshTrigger((prev) => prev + 1);
      } else {
        alert('Có lỗi xảy ra khi xóa minh chứng.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <FolderOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Quản lý Minh chứng thi đua (Năm học 2026–2027)
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Minh chứng của tôi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ trên Supabase Storage bucket <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-600">minh-chung-thi-dua</code> • Gắn với từng tiêu chí thi đua
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto shrink-0">
          {/* Nút Mục 1: GIÁO VIÊN có nút GỬI GIẢI TRÌNH */}
          <button
            onClick={() => handleOpenAppeal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" /> GỬI GIẢI TRÌNH
          </button>

          {/* Nút: + THÊM MINH CHỨNG (Mục 2) */}
          <button
            onClick={() => onOpenUpload()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> + THÊM MINH CHỨNG
          </button>
        </div>
      </div>

      {/* Nhiệm vụ: YÊU CẦU BỔ SUNG (Mục 2: Lý do, Người yêu cầu, Thời gian, Hạn bổ sung) */}
      {pendingSupplements.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 p-5 rounded-2xl shadow-sm animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-200 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </span>
              <h2 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                NHIỆM VỤ YÊU CẦU BỔ SUNG MINH CHỨNG ({pendingSupplements.length})
              </h2>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              Cần xử lý trước hạn
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingSupplements.map((req) => {
              const matchedEv = evidences.find((e) => e.id === req.evidenceId);
              return (
                <div
                  key={req.id}
                  className="bg-white p-4 rounded-xl border border-amber-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                        Tiêu chí {req.criteriaCode || matchedEv?.criteriaCode || 'Chuyên môn'}
                      </span>
                      <span className="text-slate-900">{req.evidenceName || matchedEv?.name || 'Hồ sơ minh chứng thi đua'}</span>
                    </div>

                    <div className="text-rose-700 font-bold text-xs bg-rose-50 p-2 rounded-lg border border-rose-200">
                      Lý do yêu cầu bổ sung: "{req.reason}"
                    </div>

                    <div className="text-slate-500 text-[11px] flex items-center gap-3 flex-wrap pt-0.5">
                      <span>Người yêu cầu: <strong>{req.requesterName}</strong> ({req.requesterRole})</span>
                      <span>Thời gian yêu cầu: {req.createdAt}</span>
                      <span className="text-rose-700 font-mono font-bold bg-rose-100/70 px-1.5 py-0.5 rounded">
                        Hạn bổ sung: {req.deadline}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Nút Mục 3: GIÁO VIÊN có nút BỔ SUNG MINH CHỨNG */}
                    <button
                      onClick={() => {
                        if (matchedEv) {
                          setSupplementModalEvidence(matchedEv);
                        } else {
                          onOpenUpload(req.criteriaId);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" /> BỔ SUNG MINH CHỨNG
                    </button>
                    <button
                      onClick={() => handleOpenAppeal(req.criteriaCode, req.evidenceId)}
                      className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Gửi giải trình
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thông báo thao tác gửi duyệt */}
      {submissionNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{submissionNotice}</span>
          </div>
          <button
            onClick={() => setSubmissionNotice(null)}
            className="text-xs text-blue-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 5 Thẻ thống kê Mục 8: Tổng số, Đã duyệt, Chờ duyệt, Cần bổ sung, Từ chối */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Tổng số */}
        <div
          onClick={() => setFilterStatus('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={filterStatus === 'ALL' ? 'text-slate-300' : 'text-slate-500'}>Tổng số</span>
            <FolderOpen className={`w-4 h-4 ${filterStatus === 'ALL' ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-black mt-2">{totalCount}</div>
          <div className={`text-[11px] mt-1 ${filterStatus === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
            Tất cả minh chứng đã nộp
          </div>
        </div>

        {/* Đã duyệt */}
        <div
          onClick={() => setFilterStatus('APPROVED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-white text-slate-800 border-emerald-200 hover:border-emerald-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span className={filterStatus === 'APPROVED' ? 'text-white' : 'text-emerald-700'}>Đã duyệt</span>
            <CheckCircle2 className={`w-4 h-4 ${filterStatus === 'APPROVED' ? 'text-white' : 'text-emerald-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-2 ${filterStatus === 'APPROVED' ? 'text-white' : 'text-emerald-600'}`}>
            {approvedCount}
          </div>
          <div className={`text-[11px] mt-1 ${filterStatus === 'APPROVED' ? 'text-emerald-100' : 'text-emerald-600/80'}`}>
            Hợp lệ được tính điểm
          </div>
        </div>

        {/* Chờ duyệt */}
        <div
          onClick={() => setFilterStatus('PENDING')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'PENDING'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
              : 'bg-white text-slate-800 border-blue-200 hover:border-blue-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
            <span className={filterStatus === 'PENDING' ? 'text-white' : 'text-blue-700'}>Chờ duyệt</span>
            <Clock className={`w-4 h-4 ${filterStatus === 'PENDING' ? 'text-white' : 'text-blue-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-2 ${filterStatus === 'PENDING' ? 'text-white' : 'text-blue-600'}`}>
            {pendingCount}
          </div>
          <div className={`text-[11px] mt-1 ${filterStatus === 'PENDING' ? 'text-blue-100' : 'text-blue-600/80'}`}>
            Đang chờ tổ / BGH duyệt
          </div>
        </div>

        {/* Cần bổ sung */}
        <div
          onClick={() => setFilterStatus('REVISION_REQUIRED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'REVISION_REQUIRED'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/20'
              : 'bg-white text-slate-800 border-amber-200 hover:border-amber-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span className={filterStatus === 'REVISION_REQUIRED' ? 'text-white' : 'text-amber-700'}>Cần bổ sung</span>
            <AlertTriangle className={`w-4 h-4 ${filterStatus === 'REVISION_REQUIRED' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-2 ${filterStatus === 'REVISION_REQUIRED' ? 'text-white' : 'text-amber-600'}`}>
            {revisionCount}
          </div>
          <div className={`text-[11px] mt-1 ${filterStatus === 'REVISION_REQUIRED' ? 'text-amber-100' : 'text-amber-600/80'}`}>
            Cần cập nhật lại hồ sơ
          </div>
        </div>

        {/* Từ chối */}
        <div
          onClick={() => setFilterStatus('REJECTED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all col-span-2 sm:col-span-1 ${
            filterStatus === 'REJECTED'
              ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-600/20'
              : 'bg-white text-slate-800 border-red-200 hover:border-red-400 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-red-700">
            <span className={filterStatus === 'REJECTED' ? 'text-white' : 'text-red-700'}>Từ chối</span>
            <XCircle className={`w-4 h-4 ${filterStatus === 'REJECTED' ? 'text-white' : 'text-red-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-2 ${filterStatus === 'REVISION_REQUIRED' ? 'text-white' : 'text-red-600'}`}>
            {rejectedCount}
          </div>
          <div className={`text-[11px] mt-1 ${filterStatus === 'REJECTED' ? 'text-red-100' : 'text-red-600/80'}`}>
            Không được chấp thuận
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Mục 8) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm minh chứng, mã tiêu chí..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Group Filter */}
          <div>
            <select
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Tất cả nhóm tiêu chí (6 nhóm)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.ten_nhom} ({g.diem_toi_da}đ)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="TEAM_APPROVED">Tổ đã duyệt</option>
              <option value="BGH_APPROVED">BGH đã duyệt</option>
              <option value="REVISION_REQUIRED">Cần bổ sung</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Tất cả học kỳ</option>
              <option value="HKI">Học kỳ I (HKI)</option>
              <option value="HKII">Học kỳ II (HKII)</option>
              <option value="CA_NAM">Cả năm</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Hiển thị <strong>{filteredList.length}</strong> / {evidences.length} minh chứng
          </span>
          {(searchTerm || filterGroupId !== 'ALL' || filterStatus !== 'ALL' || filterSemester !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterGroupId('ALL');
                setFilterStatus('ALL');
                setFilterSemester('ALL');
              }}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main Evidence Table (Mục 5: STT, Tiêu chí, Tên minh chứng, File, Người nộp, Ngày nộp, Trạng thái, Người duyệt, Ngày duyệt, Thao tác [XEM], [TẢI], [LỊCH SỬ]) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-3 text-center w-20">Tiêu chí</th>
                <th className="py-3.5 px-4 min-w-[220px]">Tên minh chứng</th>
                <th className="py-3.5 px-4 min-w-[170px]">File</th>
                <th className="py-3.5 px-3 text-center min-w-[100px]">Phiên bản</th>
                <th className="py-3.5 px-3 min-w-[120px]">Người nộp</th>
                <th className="py-3.5 px-3 text-center min-w-[140px]">Ngày nộp</th>
                <th className="py-3.5 px-3 text-center min-w-[110px]">Trạng thái</th>
                <th className="py-3.5 px-3 min-w-[120px]">Người duyệt</th>
                <th className="py-3.5 px-3 text-center min-w-[140px]">Ngày duyệt</th>
                <th className="py-3.5 px-4 text-center min-w-[270px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FolderOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Chưa có minh chứng nào phù hợp với bộ lọc.
                    <div className="mt-3">
                      <button
                        onClick={() => onOpenUpload()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> + THÊM MINH CHỨNG
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* STT */}
                    <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>

                    {/* Tiêu chí (Mục 9) */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.criteriaCode}
                      </span>
                    </td>

                    {/* Tên minh chứng */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span
                          className="cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => onViewEvidence(item)}
                          title="Xem chi tiết minh chứng"
                        >
                          {item.name}
                        </span>
                        {item.isOutstanding && (
                          <span title="Minh chứng nổi bật cho A+">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={item.description}>
                          {item.description}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">
                          Ghi chú: {item.note}
                        </div>
                      )}
                    </td>

                    {/* File & Nút “Xem minh chứng” (Mục 6) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getFileIcon(item.fileName)}
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => onViewEvidence(item)}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline truncate text-left text-xs block cursor-pointer"
                            title="Xem minh chứng trực tiếp (Mục 6)"
                          >
                            Xem minh chứng
                          </button>
                          <div className="text-[10px] text-slate-400 truncate font-mono">
                            {item.fileName} ({item.fileSize})
                          </div>
                          {/* Khóa sửa file theo Mục 2 */}
                          {(item.status === 'SUBMITTED' || item.status === 'TEAM_REVIEW') && (
                            <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                              <Lock className="w-2.5 h-2.5" /> Đã gửi - Không được sửa file
                            </div>
                          )}
                          {item.status === 'REVISION_REQUIRED' && (
                            <div className="text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded-lg font-medium mt-1 border border-amber-200 space-y-1">
                              <div>⚠️ Yêu cầu bổ sung: "{item.reviewNote}"</div>
                              <button
                                onClick={() => setSupplementModalEvidence(item)}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                BỔ SUNG MINH CHỨNG (Tạo Version mới) &rarr;
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phiên bản (Mục 4: Version 1, Version 2, Version 3) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setVersionModalEvidence(item);
                          setSelectedVerNum(item.currentVersion || item.versions?.length || 1);
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Xem lịch sử phiên bản (Version 1, Version 2, Version 3...)"
                      >
                        <Layers className="w-3 h-3 text-indigo-600" />
                        Version {item.currentVersion || item.versions?.length || 1}
                      </button>
                    </td>

                    {/* Người nộp */}
                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      {item.uploadedBy || currentUser.name}
                    </td>

                    {/* Ngày nộp - Hiển thị chính xác DD/MM/YYYY HH:mm:ss (Mục 7) */}
                    <td className="py-3.5 px-3 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {formatExactTimestamp(item.uploadedAt)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Người duyệt */}
                    <td className="py-3.5 px-3 text-xs">
                      {item.reviewerName ? (
                        <div>
                          <div className="font-semibold text-slate-800">{item.reviewerName}</div>
                          {item.reviewerRole && (
                            <div className="text-[10px] text-slate-400">{item.reviewerRole}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa duyệt</span>
                      )}
                    </td>

                    {/* Ngày duyệt - Hiển thị chính xác DD/MM/YYYY HH:mm:ss (Mục 7) */}
                    <td className="py-3.5 px-3 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {item.reviewDate ? formatExactTimestamp(item.reviewDate) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Thao tác: BỔ SUNG MINH CHỨNG, GỬI GIẢI TRÌNH, [XEM], [TẢI], [LỊCH SỬ] */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Nút Mục 3: BỔ SUNG MINH CHỨNG */}
                        <button
                          onClick={() => setSupplementModalEvidence(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                          title="Bổ sung minh chứng mới (tạo Version mới, không xóa bản cũ)"
                        >
                          <UploadCloud className="w-3 h-3 text-emerald-600" /> Bổ sung
                        </button>

                        {/* Nút Mục 1: GỬI GIẢI TRÌNH */}
                        <button
                          onClick={() => handleOpenAppeal(item.criteriaCode, item.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                          title="Gửi đơn giải trình cho tiêu chí/minh chứng này"
                        >
                          <Send className="w-3 h-3 text-purple-600" /> Giải trình
                        </button>

                        {/* Nút: GỬI TỔ TRƯỞNG DUYỆT khi DRAFT (Mục 2) */}
                        {item.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSubmitToTeamLeader(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                            title="Gửi minh chứng lên Tổ trưởng chuyên môn duyệt"
                          >
                            <Send className="w-3 h-3" /> GỬI DUYỆT
                          </button>
                        )}

                        {/* [XEM] */}
                        <button
                          onClick={() => onViewEvidence(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                          title="Xem minh chứng trực tiếp"
                        >
                          <Eye className="w-3 h-3" /> [XEM]
                        </button>

                        {/* [TẢI] */}
                        <button
                          onClick={() => evidenceStorageService.downloadFile(item.storagePath, item.fileName, item.fileUrl)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                          title="Tải file về máy"
                        >
                          <Download className="w-3 h-3" /> [TẢI]
                        </button>

                        {/* [LỊCH SỬ] */}
                        <button
                          onClick={() => setHistoryModalEvidence(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                          title="Xem lịch sử thẩm định & Audit Log"
                        >
                          <History className="w-3 h-3" /> [LỊCH SỬ]
                        </button>

                        {/* Xóa (Mục 10: Chỉ khi chưa duyệt) */}
                        {item.status !== 'LOCKED' && item.status !== 'BGH_APPROVED' && item.status !== 'TEAM_APPROVED' && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Xóa minh chứng chưa duyệt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* MODAL 1: GỬI GIẢI TRÌNH (Mục 1: Form Nội dung, Tiêu chí, Minh chứng, File, Thời gian) */}
      {/* ========================================================================= */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                    Tiêu chí liên quan (Mục 1)
                  </label>
                  <select
                    value={appealCriteriaCode}
                    onChange={(e) => setAppealCriteriaCode(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="">-- Chọn tiêu chí --</option>
                    {allCriteria.map((c) => (
                      <option key={c.id} value={c.ma_tieu_chi}>
                        Tiêu chí {c.ma_tieu_chi} ({c.ten_tieu_chi.substring(0, 25)}...)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minh chứng liên quan (Mục 1) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Minh chứng liên quan (Mục 1)
                  </label>
                  <select
                    value={appealEvidenceId}
                    onChange={(e) => setAppealEvidenceId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">-- Chọn minh chứng đã nộp --</option>
                    {evidences.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        [{ev.criteriaCode}] {ev.name.substring(0, 25)}...
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
                  <Send className="w-3.5 h-3.5" /> Gửi đơn giải trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LỊCH SỬ VERSION MINH CHỨNG (Mục 4: Version 1, Version 2, Version 3) */}
      {/* ========================================================================= */}
      {versionModalEvidence && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold">Lịch sử Phiên bản Minh chứng (Mục 4)</h2>
              </div>
              <button
                onClick={() => setVersionModalEvidence(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{versionModalEvidence.name}</div>
                <div className="text-slate-500 mt-0.5">
                  Tiêu chí {versionModalEvidence.criteriaCode} - {versionModalEvidence.criteriaTitle}
                </div>
              </div>

              {/* Version Selector Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-indigo-600" /> Các phiên bản:
                </span>
                {(versionModalEvidence.versions && versionModalEvidence.versions.length > 0
                  ? versionModalEvidence.versions
                  : [
                      {
                        version: 1,
                        versionLabel: 'Version 1',
                        fileName: versionModalEvidence.fileName,
                        fileUrl: versionModalEvidence.fileUrl,
                        fileSize: versionModalEvidence.fileSize,
                        fileType: versionModalEvidence.fileType,
                        uploadedAt: versionModalEvidence.uploadedAt,
                        uploadedBy: versionModalEvidence.teacherName,
                        note: 'Phiên bản ban đầu khi nộp'
                      }
                    ]
                ).map((ver) => (
                  <button
                    key={ver.version}
                    type="button"
                    onClick={() => setSelectedVerNum(ver.version)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedVerNum === ver.version
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {ver.versionLabel} {ver.version === (versionModalEvidence.currentVersion || 1) && '(Mới nhất)'}
                  </button>
                ))}
              </div>

              {/* Selected Version Detail */}
              {(() => {
                const list = versionModalEvidence.versions && versionModalEvidence.versions.length > 0
                  ? versionModalEvidence.versions
                  : [
                      {
                        version: 1,
                        versionLabel: 'Version 1',
                        fileName: versionModalEvidence.fileName,
                        fileUrl: versionModalEvidence.fileUrl,
                        fileSize: versionModalEvidence.fileSize,
                        fileType: versionModalEvidence.fileType,
                        uploadedAt: versionModalEvidence.uploadedAt,
                        uploadedBy: versionModalEvidence.teacherName,
                        note: 'Phiên bản ban đầu khi nộp'
                      }
                    ];
                const activeVer = list.find((v) => v.version === selectedVerNum) || list[list.length - 1];

                return (
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-medium">Phiên bản:</span>
                        <span className="font-black text-indigo-900 text-sm">{activeVer.versionLabel}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Người nộp:</span>
                        <span className="font-bold text-slate-800">{activeVer.uploadedBy}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Thời gian nộp:</span>
                        <span className="font-mono text-slate-700">{activeVer.uploadedAt}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Dung lượng & Loại tệp:</span>
                        <span className="font-mono text-slate-700">{activeVer.fileSize} • {activeVer.fileType}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong>Ghi chú phiên bản:</strong> {activeVer.note || 'Không có ghi chú.'}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-slate-600 text-[11px] truncate max-w-xs">{activeVer.fileName}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => evidenceStorageService.downloadFile(activeVer.storagePath || '', activeVer.fileName, activeVer.fileUrl)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" /> Tải tệp
                        </button>
                        <a
                          href={activeVer.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> Mở xem
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                💡 <strong>Quy định Mục 3 & 4:</strong> Khi nộp bổ sung minh chứng, hệ thống không xóa minh chứng cũ mà tự động tạo Version tiếp theo để Hội đồng thi đua dễ dàng đối chiếu, kiểm chứng.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const ev = versionModalEvidence;
                  setVersionModalEvidence(null);
                  setSupplementModalEvidence(ev);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" /> Bổ sung Version mới
              </button>
              <button
                onClick={() => setVersionModalEvidence(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Modal khi click [LỊCH SỬ] (Mục 5 & Mục 11) */}
      {historyModalEvidence && (
        <EvidenceAuditHistoryModal
          evidence={historyModalEvidence}
          onClose={() => setHistoryModalEvidence(null)}
        />
      )}

      {/* Supplement Evidence Modal khi giáo viên bổ sung file (Mục 4) */}
      {supplementModalEvidence && (
        <SupplementEvidenceModal
          evidence={supplementModalEvidence}
          currentUser={currentUser}
          onClose={() => setSupplementModalEvidence(null)}
          onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}
    </div>
  );
};
