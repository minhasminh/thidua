import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building2,
  UserCheck,
  Star,
  Download,
  Eye,
  History,
  Check,
  XCircle,
  Send,
  MessageSquare,
  Lock,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { EvidenceItem, User, EvidenceStatus, normalizeRole } from '../types';
import { storageService } from '../services/storageService';
import { evidenceStorageService } from '../services/evidenceStorageService';
import { criteriaService } from '../services/criteriaService';
import { formatExactTimestamp } from '../utils/formatters';
import { EvidenceAuditHistoryModal } from './EvidenceAuditHistoryModal';

interface TeamEvidenceViewProps {
  currentUser: User;
  onViewEvidence: (evidence: EvidenceItem) => void;
}

type ReviewActionType = 'APPROVE' | 'REQUEST_REVISION' | 'REJECT';

export const TeamEvidenceView: React.FC<TeamEvidenceViewProps> = ({
  currentUser,
  onViewEvidence
}) => {
  const departments = storageService.getDepartments();
  const allTeachers = storageService.getUsers().filter(
    (u) =>
      u.role === 'TEACHER' ||
      u.role === 'TEAM_LEADER' ||
      u.role === 'GIAO_VIEN' ||
      u.role === 'TO_TRUONG' ||
      u.role === 'TO_PHO'
  );
  const groups = criteriaService.getGroups();
  const allCriteria = criteriaService.getAllCriteria().filter((c) => c.is_active);

  // BẢO MẬT MỤC 10: Tổ trưởng / Tổ phó chỉ được duyệt giáo viên thuộc tổ mình
  const normRole = normalizeRole(currentUser.role);
  const isTeamLeader = normRole === 'TO_TRUONG' || normRole === 'TO_PHO';
  const isAdminOrBgh = normRole === 'ADMIN' || normRole === 'BGH';

  const [selectedDeptId, setSelectedDeptId] = useState(
    isTeamLeader ? currentUser.departmentId : (currentUser.departmentId || 'dept-1')
  );

  // Bộ lọc Mục 9: Giáo viên, Tiêu chí, Học kỳ, Ngày nộp, Trạng thái
  const [selectedTeacherId, setSelectedTeacherId] = useState('ALL');
  const [filterCriteriaCode, setFilterCriteriaCode] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterSubmissionDate, setFilterSubmissionDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Tab ưu tiên Mục 8: “MINH CHỨNG CHỜ DUYỆT” vs “TẤT CẢ MINH CHỨNG TRONG TỔ”
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING');

  // Modal Review States
  const [reviewModalEvidence, setReviewModalEvidence] = useState<EvidenceItem | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewActionType>('APPROVE');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewDeadline, setReviewDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [isOutstanding, setIsOutstanding] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // History modal state
  const [historyModalEvidence, setHistoryModalEvidence] = useState<EvidenceItem | null>(null);

  // Phòng ban và giáo viên của phòng ban được chọn
  const currentDept = departments.find((d) => d.id === selectedDeptId) || departments[0];
  const deptTeachers = allTeachers.filter((t) => t.departmentId === selectedDeptId);

  // Lấy toàn bộ minh chứng của tổ chuyên môn
  const allDeptEvidences = storageService.getDepartmentEvidences(selectedDeptId);

  // DASHBOARD TỔ TRƯỞNG (Mục 8)
  const totalTeacherCount = deptTeachers.length;
  const totalEvidenceCount = allDeptEvidences.length;
  const pendingCount = allDeptEvidences.filter(
    (e) => e.status === 'SUBMITTED' || e.status === 'TEAM_REVIEW'
  ).length;
  const approvedCount = allDeptEvidences.filter(
    (e) => e.status === 'TEAM_APPROVED' || e.status === 'BGH_APPROVED' || e.status === 'LOCKED'
  ).length;
  const revisionCount = allDeptEvidences.filter((e) => e.status === 'REVISION_REQUIRED').length;
  const rejectedCount = allDeptEvidences.filter((e) => e.status === 'REJECTED').length;

  // Lọc danh sách minh chứng theo tab và bộ lọc (Mục 8 & Mục 9)
  const filteredEvidences = allDeptEvidences.filter((item) => {
    // Tab "MINH CHỨNG CHỜ DUYỆT" chỉ hiển thị các minh chứng đang chờ xử lý
    if (activeTab === 'PENDING') {
      if (item.status !== 'SUBMITTED' && item.status !== 'TEAM_REVIEW') return false;
    }

    if (selectedTeacherId !== 'ALL' && item.teacherId !== selectedTeacherId) return false;
    if (filterCriteriaCode !== 'ALL' && item.criteriaCode !== filterCriteriaCode) return false;
    if (filterSemester !== 'ALL' && item.semester !== filterSemester) return false;

    if (filterStatus !== 'ALL') {
      if (filterStatus === 'PENDING') {
        if (item.status !== 'SUBMITTED' && item.status !== 'TEAM_REVIEW') return false;
      } else if (filterStatus === 'APPROVED') {
        if (item.status !== 'TEAM_APPROVED' && item.status !== 'BGH_APPROVED' && item.status !== 'LOCKED') return false;
      } else if (item.status !== filterStatus) {
        return false;
      }
    }

    // Lọc theo ngày nộp (DD/MM/YYYY hoặc YYYY-MM-DD)
    if (filterSubmissionDate) {
      const itemDateStr = item.uploadedAt || '';
      // item.uploadedAt is formatted DD/MM/YYYY HH:mm:ss
      const [datePart] = itemDateStr.split(' ');
      if (datePart) {
        // filterSubmissionDate is YYYY-MM-DD
        const [y, m, d] = filterSubmissionDate.split('-');
        const expectedDate = `${d}/${m}/${y}`;
        if (datePart !== expectedDate) return false;
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchTeacher = item.teacherName.toLowerCase().includes(q);
      const matchCode = item.criteriaCode.toLowerCase().includes(q);
      const matchFile = item.fileName.toLowerCase().includes(q);
      if (!matchName && !matchTeacher && !matchCode && !matchFile) return false;
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
          <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-blue-300 flex items-center justify-center gap-1 animate-pulse">
            <Clock className="w-3 h-3 text-blue-600" /> Chờ duyệt
          </span>
        );
      case 'TEAM_APPROVED':
        return (
          <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-indigo-300 flex items-center justify-center gap-1">
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

  // Mở modal để xử lý: DUYỆT | YÊU CẦU BỔ SUNG | TỪ CHỐI (Mục 3, 4, 5, 6)
  const handleOpenReview = (item: EvidenceItem, action: ReviewActionType) => {
    // Kiểm tra bảo mật Mục 10: Tổ trưởng chỉ duyệt tổ mình
    if (isTeamLeader && !isAdminOrBgh && currentUser.departmentId !== item.departmentId) {
      alert(`BẢO MẬT (Mục 10): Bạn chỉ có quyền duyệt giáo viên thuộc ${currentUser.departmentName}. Không thể duyệt giáo viên tổ khác!`);
      return;
    }

    setReviewModalEvidence(item);
    setReviewAction(action);
    setReviewError('');
    setIsOutstanding(item.isOutstanding || false);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setReviewDeadline(d.toISOString().split('T')[0]);

    if (action === 'APPROVE') {
      setReviewReason(item.reviewNote || 'Đạt yêu cầu hồ sơ minh chứng theo quy chế.');
    } else if (action === 'REQUEST_REVISION') {
      setReviewReason(item.reviewNote || 'Chưa có biên bản xác nhận.');
    } else {
      setReviewReason(item.reviewNote || 'Minh chứng không đúng với yêu cầu của tiêu chí.');
    }
  };

  // Xác nhận lưu thẩm định (Mục 4, 5, 6, 7 & Mục 10)
  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalEvidence) return;
    setReviewError('');

    // Kiểm tra lý do bắt buộc (Mục 4 & Mục 6)
    if (reviewAction === 'REQUEST_REVISION' && !reviewReason.trim()) {
      setReviewError('Bắt buộc phải nhập lý do yêu cầu bổ sung (Ví dụ: "Chưa có biên bản xác nhận.")');
      return;
    }

    if (reviewAction === 'REJECT' && !reviewReason.trim()) {
      setReviewError('Bắt buộc phải nhập lý do khi từ chối minh chứng!');
      return;
    }

    try {
      storageService.teamLeaderReviewEvidence(
        reviewModalEvidence.id,
        currentUser,
        reviewAction,
        reviewReason.trim(),
        reviewAction === 'APPROVE' ? isOutstanding : false,
        reviewDeadline
      );

      const actionText =
        reviewAction === 'APPROVE'
          ? 'Đã duyệt minh chứng thành công!'
          : reviewAction === 'REQUEST_REVISION'
          ? 'Đã gửi yêu cầu bổ sung minh chứng tới giáo viên!'
          : 'Đã từ chối minh chứng!';

      setActionSuccessMessage(actionText);
      setReviewModalEvidence(null);
      setRefreshKey((k) => k + 1);

      setTimeout(() => {
        setActionSuccessMessage('');
      }, 3500);
    } catch (err: any) {
      setReviewError(err.message || 'Có lỗi xảy ra khi lưu thẩm định.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header: DUYỆT MINH CHỨNG (Mục 3) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Workflow: Giáo viên → Tổ trưởng
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            DUYỆT MINH CHỨNG
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dành cho Tổ trưởng chuyên môn thẩm định minh chứng thi đua giáo viên năm học 2026–2027
          </p>
        </div>

        {/* Khóa quyền theo Tổ chuyên môn (Bảo mật Mục 10) */}
        <div className="flex items-center gap-2">
          {isTeamLeader && !isAdminOrBgh ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Tổ chuyên môn:</span>
              <strong className="text-indigo-700">{currentUser.departmentName}</strong>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedTeacherId('ALL');
                }}
                className="text-xs p-2 rounded-xl border border-slate-300 font-bold bg-white text-indigo-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.teacherCount} GV)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Thông báo thành công */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage('')}
            className="text-xs text-emerald-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* DASHBOARD TỔ TRƯỞNG (Mục 8: Tổng GV, Tổng minh chứng, Chờ duyệt, Đã duyệt, Cần bổ sung, Từ chối) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Tổng giáo viên */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tổng giáo viên</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalTeacherCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">{currentDept.name}</div>
        </div>

        {/* Tổng minh chứng */}
        <div
          onClick={() => {
            setActiveTab('ALL');
            setFilterStatus('ALL');
          }}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tổng minh chứng</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalEvidenceCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tất cả tệp đã nộp</div>
        </div>

        {/* Chờ duyệt (Ưu tiên) */}
        <div
          onClick={() => {
            setActiveTab('PENDING');
            setFilterStatus('ALL');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'PENDING'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
              : 'bg-white text-slate-800 border-blue-200 hover:border-blue-400 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={activeTab === 'PENDING' ? 'text-white' : 'text-blue-700'}>Chờ duyệt</span>
            <Clock className={`w-4 h-4 ${activeTab === 'PENDING' ? 'text-white' : 'text-blue-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-2 ${activeTab === 'PENDING' ? 'text-white' : 'text-blue-600'}`}>
            {pendingCount}
          </div>
          <div className={`text-[11px] mt-0.5 ${activeTab === 'PENDING' ? 'text-blue-100' : 'text-blue-600/80 font-semibold'}`}>
            Cần xử lý ngay
          </div>
        </div>

        {/* Đã duyệt */}
        <div
          onClick={() => {
            setActiveTab('ALL');
            setFilterStatus('APPROVED');
          }}
          className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span>Đã duyệt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{approvedCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Đạt yêu cầu</div>
        </div>

        {/* Cần bổ sung */}
        <div
          onClick={() => {
            setActiveTab('ALL');
            setFilterStatus('REVISION_REQUIRED');
          }}
          className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
            <span>Cần bổ sung</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{revisionCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Đang chờ GV sửa</div>
        </div>

        {/* Từ chối */}
        <div
          onClick={() => {
            setActiveTab('ALL');
            setFilterStatus('REJECTED');
          }}
          className="bg-white p-4 rounded-2xl border border-red-200 shadow-2xs cursor-pointer hover:border-red-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-red-700 font-semibold">
            <span>Từ chối</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">{rejectedCount}</div>
          <div className="text-[11px] text-red-600/80 mt-0.5">Không chấp thuận</div>
        </div>
      </div>

      {/* Tabs: Danh sách “MINH CHỨNG CHỜ DUYỆT” (Mục 8) & Tất cả */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PENDING'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          MINH CHỨNG CHỜ DUYỆT
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ALL'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          TẤT CẢ MINH CHỨNG TRONG TỔ
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            {totalEvidenceCount}
          </span>
        </button>
      </div>

      {/* BỘ LỌC MỤC 9: Giáo viên, Tiêu chí, Học kỳ, Ngày nộp, Trạng thái */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Lọc theo Giáo viên */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Giáo viên:</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả giáo viên ({deptTeachers.length})</option>
              {deptTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.position || 'Giáo viên'})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Tiêu chí */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tiêu chí:</label>
            <select
              value={filterCriteriaCode}
              onChange={(e) => setFilterCriteriaCode(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả tiêu chí ({allCriteria.length})</option>
              {allCriteria.map((c) => (
                <option key={c.id} value={c.ma_tieu_chi}>
                  {c.ma_tieu_chi} – {c.ten_tieu_chi.substring(0, 32)}...
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Học kỳ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Học kỳ:</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả học kỳ</option>
              <option value="HKI">Học kỳ I (HKI)</option>
              <option value="HKII">Học kỳ II (HKII)</option>
              <option value="CA_NAM">Cả năm</option>
            </select>
          </div>

          {/* Lọc theo Ngày nộp */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Ngày nộp:</label>
            <input
              type="date"
              value={filterSubmissionDate}
              onChange={(e) => setFilterSubmissionDate(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          {/* Lọc theo Trạng thái */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="TEAM_APPROVED">Tổ đã duyệt</option>
              <option value="BGH_APPROVED">BGH đã duyệt</option>
              <option value="REVISION_REQUIRED">Cần bổ sung</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>
        </div>

        {/* Search input & clear filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên minh chứng, tên giáo viên, mã tiêu chí..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Tìm thấy: <strong>{filteredEvidences.length}</strong> minh chứng
            </span>
            {(selectedTeacherId !== 'ALL' ||
              filterCriteriaCode !== 'ALL' ||
              filterSemester !== 'ALL' ||
              filterSubmissionDate ||
              filterStatus !== 'ALL' ||
              searchTerm) && (
              <button
                onClick={() => {
                  setSelectedTeacherId('ALL');
                  setFilterCriteriaCode('ALL');
                  setFilterSemester('ALL');
                  setFilterSubmissionDate('');
                  setFilterStatus('ALL');
                  setSearchTerm('');
                }}
                className="text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG DUYỆT MINH CHỨNG (Mục 3: Giáo viên, Tiêu chí, Minh chứng, File, Đường dẫn xem, Ngày nộp, Người nộp, Thao tác: DUYỆT, YÊU CẦU BỔ SUNG, TỪ CHỐI) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-3.5 min-w-[150px]">Giáo viên</th>
                <th className="py-3.5 px-2.5 text-center w-16">Tiêu chí</th>
                <th className="py-3.5 px-4 min-w-[220px]">Minh chứng</th>
                <th className="py-3.5 px-3.5 min-w-[190px]">File & Đường dẫn xem</th>
                <th className="py-3.5 px-3 text-center min-w-[150px]">Ngày nộp</th>
                <th className="py-3.5 px-3 min-w-[120px]">Người nộp</th>
                <th className="py-3.5 px-3 text-center min-w-[110px]">Trạng thái</th>
                <th className="py-3.5 px-3.5 text-center min-w-[260px]">
                  3 Nút: Duyệt / Yêu cầu / Từ chối
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvidences.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    {activeTab === 'PENDING'
                      ? 'Tuyệt vời! Hiện không còn minh chứng nào đang chờ duyệt trong tổ.'
                      : 'Không có minh chứng nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filteredEvidences.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.status === 'SUBMITTED' || item.status === 'TEAM_REVIEW'
                        ? 'bg-blue-50/30 hover:bg-blue-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>

                    {/* Giáo viên */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-slate-900 text-xs">{item.teacherName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.departmentName}</div>
                    </td>

                    {/* Tiêu chí */}
                    <td className="py-3.5 px-2.5 text-center">
                      <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {item.criteriaCode}
                      </span>
                    </td>

                    {/* Minh chứng */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span
                          className="cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={() => onViewEvidence(item)}
                          title="Xem chi tiết"
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
                      {item.reviewNote && (
                        <div className="text-[10px] text-amber-700 italic mt-0.5 line-clamp-1">
                          Ghi chú: "{item.reviewNote}"
                        </div>
                      )}
                    </td>

                    {/* File & Đường dẫn xem (Mục 3) */}
                    <td className="py-3.5 px-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => onViewEvidence(item)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                            title="Mở xem minh chứng"
                          >
                            <Eye className="w-3.5 h-3.5" /> [Xem minh chứng]
                          </button>
                          <button
                            onClick={() => evidenceStorageService.downloadFile(item.storagePath, item.fileName, item.fileUrl)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Tải tệp"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <span
                            onClick={() => onViewEvidence(item)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 cursor-pointer"
                            title="Nhấp để xem lịch sử phiên bản (Version 1, Version 2, Version 3...)"
                          >
                            Version {item.currentVersion || item.versions?.length || 1}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={item.storagePath}>
                          {item.fileName} ({item.fileSize})
                        </div>
                      </div>
                    </td>

                    {/* Ngày nộp - DD/MM/YYYY HH:mm:ss */}
                    <td className="py-3.5 px-3 text-center text-slate-600 text-[11px] font-mono whitespace-nowrap">
                      {formatExactTimestamp(item.uploadedAt)}
                    </td>

                    {/* Người nộp */}
                    <td className="py-3.5 px-3 text-slate-700 font-medium text-xs">
                      {item.uploadedBy || item.teacherName}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* 3 NÚT THAO TÁC CHÍNH: DUYỆT | YÊU CẦU BỔ SUNG | TỪ CHỐI (Mục 3) */}
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* 1. Nút DUYỆT (Mục 5) */}
                        <button
                          onClick={() => handleOpenReview(item, 'APPROVE')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          title="Phê duyệt minh chứng (status = TEAM_APPROVED)"
                        >
                          <Check className="w-3 h-3 stroke-[3]" /> DUYỆT
                        </button>

                        {/* 2. Nút YÊU CẦU BỔ SUNG (Mục 4) */}
                        <button
                          onClick={() => handleOpenReview(item, 'REQUEST_REVISION')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          title="Yêu cầu giáo viên bổ sung file (status = REVISION_REQUIRED)"
                        >
                          <AlertTriangle className="w-3 h-3" /> BỔ SUNG
                        </button>

                        {/* 3. Nút TỪ CHỐI (Mục 6) */}
                        <button
                          onClick={() => handleOpenReview(item, 'REJECT')}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-bold text-[11px] transition-colors cursor-pointer"
                          title="Từ chối minh chứng (Bắt buộc có lý do)"
                        >
                          <XCircle className="w-3 h-3" /> TỪ CHỐI
                        </button>

                        {/* Nút Lịch sử Audit Log (Mục 7) */}
                        <button
                          onClick={() => setHistoryModalEvidence(item)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Xem lịch sử Audit Log"
                        >
                          <History className="w-3.5 h-3.5" />
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

      {/* MODAL THẨM ĐỊNH MINH CHỨNG: DUYỆT | YÊU CẦU BỔ SUNG | TỪ CHỐI (Mục 4, 5, 6 & Mục 10) */}
      {reviewModalEvidence && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                reviewAction === 'APPROVE'
                  ? 'bg-emerald-600'
                  : reviewAction === 'REQUEST_REVISION'
                  ? 'bg-amber-500'
                  : 'bg-red-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 text-white">
                  {reviewAction === 'APPROVE' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : reviewAction === 'REQUEST_REVISION' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">
                    Thẩm định Tổ chuyên môn • {currentDept.name}
                  </div>
                  <h2 className="text-base font-black">
                    {reviewAction === 'APPROVE'
                      ? 'Phê duyệt minh chứng (DUYỆT)'
                      : reviewAction === 'REQUEST_REVISION'
                      ? 'Yêu cầu giáo viên bổ sung minh chứng'
                      : 'Từ chối minh chứng thi đua'}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setReviewModalEvidence(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmReview} className="p-6 space-y-4 text-xs">
              {/* Evidence details readout */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded font-mono">
                    Tiêu chí {reviewModalEvidence.criteriaCode}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Nộp: {formatExactTimestamp(reviewModalEvidence.uploadedAt)}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{reviewModalEvidence.name}</div>
                <div className="text-slate-600 text-[11px] flex items-center gap-2">
                  <span>Giáo viên: <strong>{reviewModalEvidence.teacherName}</strong></span>
                  <span>•</span>
                  <span>Tổ: <strong>{reviewModalEvidence.departmentName}</strong></span>
                </div>
                <div className="text-slate-500 font-mono text-[10px] truncate bg-white p-2 rounded-lg border border-slate-200">
                  📁 {reviewModalEvidence.storagePath}
                </div>
              </div>

              {/* Reviewer identity readout (Mục 5: Lưu reviewer_id, reviewed_at, review_comment) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900">
                <span>
                  Người thẩm định: <strong>{currentUser.name}</strong> ({currentUser.position || 'Tổ trưởng'})
                </span>
                <span className="font-mono text-indigo-700">
                  Thời gian: {formatExactTimestamp()}
                </span>
              </div>

              {/* Nhận xét / Lý do (Mục 4 & Mục 6) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {reviewAction === 'REQUEST_REVISION' ? (
                    <span>
                      Lý do yêu cầu bổ sung <span className="text-red-500">*</span>
                      <span className="font-normal text-slate-500 ml-1">(Bắt buộc nhập theo Mục 4)</span>
                    </span>
                  ) : reviewAction === 'REJECT' ? (
                    <span>
                      Lý do từ chối minh chứng <span className="text-red-500">*</span>
                      <span className="font-normal text-slate-500 ml-1">(Bắt buộc có lý do theo Mục 6)</span>
                    </span>
                  ) : (
                    <span>Nhận xét thẩm định của Tổ trưởng:</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  required={reviewAction !== 'APPROVE'}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder={
                    reviewAction === 'REQUEST_REVISION'
                      ? 'VD: Chưa có biên bản xác nhận của tổ / hình ảnh hoạt động chưa rõ ràng...'
                      : reviewAction === 'REJECT'
                      ? 'VD: Minh chứng không khớp với nội dung tiêu chí thi đua này...'
                      : 'Nhận xét về chất lượng minh chứng...'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-indigo-500 bg-white"
                />

                {/* Quick Suggestion Chips for Revisions (Mục 4: Ví dụ "Chưa có biên bản xác nhận.") */}
                {reviewAction === 'REQUEST_REVISION' && (
                  <>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-semibold self-center">Gợi ý nhanh:</span>
                      {[
                        'Chưa có biên bản xác nhận.',
                        'Thiếu hình ảnh hoạt động thực tế.',
                        'Cần bổ sung phiếu đánh giá của học sinh.',
                        'Giáo án chưa đúng thể thức CV 5512.'
                      ].map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewReason(sug)}
                          className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-semibold cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3">
                      <label className="block font-bold text-slate-700 mb-1">
                        Hạn bổ sung minh chứng <span className="text-red-500">* (Mục 2)</span>:
                      </label>
                      <input
                        type="date"
                        required
                        value={reviewDeadline}
                        onChange={(e) => setReviewDeadline(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-rose-700"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Hệ thống sẽ tạo nhiệm vụ và phát thông báo Notification ngay lập tức cho giáo viên (Mục 6).
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Checkbox Minh chứng nổi bật khi DUYỆT (phục vụ tiêu chuẩn xếp loại A+) */}
              {reviewAction === 'APPROVE' && (
                <label className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOutstanding}
                    onChange={(e) => setIsOutstanding(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Đánh dấu là Minh chứng nổi bật (Tiêu chuẩn xét danh hiệu A+ Xuất sắc)
                  </span>
                </label>
              )}

              {/* Error warning */}
              {reviewError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {reviewError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalEvidence(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : reviewAction === 'REQUEST_REVISION'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                  {reviewAction === 'APPROVE' ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> XÁC NHẬN DUYỆT
                    </>
                  ) : reviewAction === 'REQUEST_REVISION' ? (
                    <>
                      <Send className="w-3.5 h-3.5" /> GỬI YÊU CẦU BỔ SUNG
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> XÁC NHẬN TỪ CHỐI
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal khi bấm nút Lịch sử (Mục 7) */}
      {historyModalEvidence && (
        <EvidenceAuditHistoryModal
          evidence={historyModalEvidence}
          onClose={() => setHistoryModalEvidence(null)}
        />
      )}
    </div>
  );
};
