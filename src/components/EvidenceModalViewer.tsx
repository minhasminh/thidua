import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ShieldCheck,
  FolderGit2,
  Copy,
  Check,
  Star,
  MessageSquare,
  UploadCloud,
  History,
  Layers
} from 'lucide-react';
import { EvidenceItem, EvidenceStatus, User } from '../types';
import { storageService } from '../services/storageService';
import { evidenceStorageService } from '../services/evidenceStorageService';
import { formatExactTimestamp } from '../utils/formatters';

interface EvidenceModalViewerProps {
  evidence: EvidenceItem;
  currentUser: User;
  onClose: () => void;
  onUpdate: () => void;
}

export const EvidenceModalViewer: React.FC<EvidenceModalViewerProps> = ({
  evidence,
  currentUser,
  onClose,
  onUpdate
}) => {
  const [copied, setCopied] = useState(false);
  const [reviewNote, setReviewNote] = useState(evidence.reviewNote || '');
  const [isOutstanding, setIsOutstanding] = useState(evidence.isOutstanding || false);
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Versioning & Supplement States (Mục 3 & Mục 4)
  const initialVersions = evidence.versions && evidence.versions.length > 0
    ? evidence.versions
    : [
        {
          version: 1,
          versionLabel: 'Version 1',
          fileName: evidence.fileName,
          fileUrl: evidence.fileUrl,
          fileSize: evidence.fileSize,
          fileType: evidence.fileType,
          uploadedAt: evidence.uploadedAt,
          uploadedBy: evidence.teacherName,
          note: 'Phiên bản gốc ban đầu'
        }
      ];

  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(
    evidence.currentVersion || initialVersions[initialVersions.length - 1].version
  );

  const [showSupplementForm, setShowSupplementForm] = useState(false);
  const [supplementFileName, setSupplementFileName] = useState(`BoSung_${evidence.fileName}`);
  const [supplementFileUrl, setSupplementFileUrl] = useState('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80');
  const [supplementNote, setSupplementNote] = useState('');
  const [supplementDeadline, setSupplementDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Check if reviewer has permission to review this evidence (Mục 10)
  const isTeamLeader =
    ((currentUser.role === 'TEAM_LEADER' ||
      currentUser.role === 'TO_TRUONG' ||
      currentUser.role === 'TO_PHO' ||
      currentUser.role === 'VICE_TEAM_LEADER') &&
      currentUser.departmentId === evidence.departmentId) ||
    currentUser.role === 'ADMIN';
  const isBgh =
    currentUser.role === 'PRINCIPAL' ||
    currentUser.role === 'BGH' ||
    currentUser.role === 'ADMIN';
  const canReview = isTeamLeader || isBgh;
  const isOwnerTeacher = evidence.teacherId === currentUser.id;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(evidence.storagePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-300">Bản nháp</span>;
      case 'SUBMITTED':
      case 'TEAM_REVIEW':
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-300">Chờ tổ trưởng duyệt</span>;
      case 'TEAM_APPROVED':
        return <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-indigo-300">Tổ đã duyệt (Chờ BGH)</span>;
      case 'BGH_REVIEW':
        return <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-300">BGH đang rà soát</span>;
      case 'BGH_APPROVED':
      case 'LOCKED':
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt chính thức</span>;
      case 'REVISION_REQUIRED':
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Cần bổ sung</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-300">Bị từ chối</span>;
      default:
        return null;
    }
  };

  const handleReviewAction = (newStatus: EvidenceStatus) => {
    setActionError('');
    if (newStatus === 'REVISION_REQUIRED' && !reviewNote.trim()) {
      setActionError('Bắt buộc phải nhập lý do/nội dung cần bổ sung!');
      return;
    }
    if (newStatus === 'REJECTED' && !reviewNote.trim()) {
      setActionError('Bắt buộc phải nhập lý do từ chối minh chứng!');
      return;
    }

    setIsProcessing(true);
    try {
      storageService.reviewEvidence(evidence.id, currentUser, newStatus, reviewNote, isOutstanding);

      // Mục 2 & Mục 6: Tự động tạo nhiệm vụ Yêu cầu bổ sung và gửi notification cho GV
      if (newStatus === 'REVISION_REQUIRED') {
        storageService.createSupplementRequest(
          {
            evidenceId: evidence.id,
            evidenceName: evidence.name,
            criteriaId: evidence.criteriaId,
            criteriaCode: evidence.criteriaCode,
            criteriaTitle: evidence.criteriaTitle,
            teacherId: evidence.teacherId,
            reason: reviewNote.trim(),
            deadline: supplementDeadline
          },
          currentUser
        );
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mục 3: BỔ SUNG MINH CHỨNG - Tạo version mới không xóa file cũ
  const handleDoSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplementFileName.trim()) {
      setActionError('Vui lòng nhập tên tệp bổ sung!');
      return;
    }

    setIsProcessing(true);
    try {
      storageService.supplementEvidence(
        evidence.id,
        {
          fileName: supplementFileName.trim(),
          fileUrl: supplementFileUrl.trim() || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80',
          fileSize: '2.5 MB',
          fileType: 'application/pdf',
          note: supplementNote.trim()
        },
        currentUser
      );
      onUpdate();
      setShowSupplementForm(false);
    } catch (err: any) {
      setActionError(err.message || 'Lỗi bổ sung minh chứng.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                  Tiêu chí {evidence.criteriaCode}
                </span>
                {getStatusBadge(evidence.status)}
                {evidence.isOutstanding && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-300">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Minh chứng nổi bật
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 truncate mt-1">
                {evidence.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid (Section V & XXXIX) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Giáo viên nộp:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" /> {evidence.teacherName}
              </span>
              <span className="text-slate-500 text-[11px] block">{evidence.departmentName}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Thời gian nộp:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> {evidence.uploadedAt}
              </span>
              <span className="text-slate-500 text-[11px] block">
                Ngày thực hiện: {evidence.executionDate || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Năm học & Học kỳ:</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {evidence.schoolYear} • {evidence.semester}
              </span>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-200">
              <span className="text-slate-400 block font-medium">Đường dẫn lưu trữ chuẩn hóa (Storage):</span>
              <div className="flex items-center gap-2 mt-1 bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                <FolderGit2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate flex-1">{evidence.storagePath}</span>
                <button
                  onClick={handleCopyPath}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                  title="Sao chép đường dẫn"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Description & Requirements */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Mô tả minh chứng & Tiêu chí áp dụng
            </h3>
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-blue-900">
                {evidence.criteriaCode} - {evidence.criteriaTitle}
              </div>
              <p className="leading-relaxed">{evidence.description}</p>
            </div>
          </div>

          {/* LỊCH SỬ PHIÊN BẢN (Mục 4: Version 1, Version 2, Version 3) */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                  Lịch sử Version minh chứng ({initialVersions.length} phiên bản)
                </span>
              </div>

              {isOwnerTeacher && (
                <button
                  type="button"
                  onClick={() => setShowSupplementForm(!showSupplementForm)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {showSupplementForm ? 'Đóng form bổ sung' : 'BỔ SUNG MINH CHỨNG (Tạo Version mới)'}
                </button>
              )}
            </div>

            {/* Version Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {initialVersions.map((ver) => (
                <button
                  key={ver.version}
                  type="button"
                  onClick={() => setSelectedVersionNum(ver.version)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedVersionNum === ver.version
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {ver.versionLabel} {ver.version === (evidence.currentVersion || initialVersions.length) && '(Mới nhất)'}
                </button>
              ))}
            </div>

            {(() => {
              const activeVer = initialVersions.find((v) => v.version === selectedVersionNum) || initialVersions[initialVersions.length - 1];
              return (
                <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Đang xem {activeVer.versionLabel}:</strong> {activeVer.fileName} • Nộp ngày {activeVer.uploadedAt} bởi {activeVer.uploadedBy}
                  </span>
                  {activeVer.note && (
                    <span className="italic text-slate-600">Ghi chú: "{activeVer.note}"</span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Form Bổ sung minh chứng (Mục 3) */}
          {showSupplementForm && (
            <form onSubmit={handleDoSupplement} className="bg-emerald-50/70 border-2 border-emerald-300 p-4 rounded-xl space-y-3 text-xs">
              <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-emerald-700" />
                Nộp tệp bổ sung (Hệ thống sẽ tạo Version {initialVersions.length + 1} và không xóa version cũ)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên file bổ sung <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={supplementFileName}
                    onChange={(e) => setSupplementFileName(e.target.value)}
                    placeholder="VD: SoDuGio_BoSung_Ver2.pdf"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Đường dẫn file (URL) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="url"
                    required
                    value={supplementFileUrl}
                    onChange={(e) => setSupplementFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú nội dung bổ sung:
                </label>
                <textarea
                  rows={2}
                  value={supplementNote}
                  onChange={(e) => setSupplementNote(e.target.value)}
                  placeholder="Ghi rõ nội dung đã cập nhật bổ sung..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSupplementForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Xác nhận nộp Version mới
                </button>
              </div>
            </form>
          )}

          {/* File Card & Direct Preview */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-100 text-red-600 font-bold text-xs uppercase">
                  {evidence.fileName.split('.').slice(-1)[0] || 'FILE'}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{evidence.fileName}</div>
                  <div className="text-xs text-slate-500">
                    Dung lượng: {evidence.fileSize} • Định dạng: {evidence.fileType}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={evidence.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Xem minh chứng
                </a>
                <button
                  type="button"
                  onClick={() => evidenceStorageService.downloadFile(evidence.storagePath, evidence.fileName, evidence.fileUrl)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về
                </button>
              </div>
            </div>

            {/* Direct visual file preview area (Mục 6) */}
            <div className="p-4 bg-slate-100/50 flex flex-col items-center justify-center min-h-[160px] overflow-hidden">
              {/* PDF Preview */}
              {evidence.fileName.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                    <span>Xem trực tiếp tệp PDF:</span>
                    <a
                      href={evidence.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Mở toàn màn hình
                    </a>
                  </div>
                  <iframe
                    src={evidence.fileUrl}
                    title={evidence.name}
                    className="w-full h-80 rounded-xl border border-slate-300 bg-white shadow-xs"
                  />
                </div>
              ) : (evidence.fileName.toLowerCase().endsWith('.jpg') ||
                evidence.fileName.toLowerCase().endsWith('.png') ||
                evidence.fileName.toLowerCase().endsWith('.jpeg')) ? (
                /* Image Preview */
                <img
                  src={evidence.fileUrl}
                  alt={evidence.name}
                  className="max-h-80 object-contain rounded-xl shadow-md border border-slate-200"
                />
              ) : (
                /* Office Documents (Word, Excel, PowerPoint, ZIP) */
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Tệp tài liệu văn bản / bảng tính ({evidence.fileName.split('.').pop()?.toUpperCase()})
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                      Tệp đã được lưu trữ an toàn trong Supabase Storage. Bạn có thể mở liên kết hoặc tải xuống máy tính để xem và chỉnh sửa.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <a
                      href={evidence.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Mở file
                    </a>
                    <button
                      type="button"
                      onClick={() => evidenceStorageService.downloadFile(evidence.storagePath, evidence.fileName, evidence.fileUrl)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải xuống máy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit Log / History (Section IX) */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" /> Nhật ký thẩm định & Lịch sử thao tác (Audit Log)
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-4 space-y-3">
              {evidence.auditLogs && evidence.auditLogs.length > 0 ? (
                evidence.auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-bold text-slate-800">
                          {log.actorName} <span className="font-normal text-slate-500">({log.actorRole})</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <div className="font-semibold text-blue-700 mt-1">{log.action}</div>
                      {log.details && (
                        <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">Chưa có bản ghi nhật ký.</div>
              )}
            </div>
          </div>

          {/* Reviewer Action Box (Section VIII: Thẩm định minh chứng) */}
          {canReview && (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" /> Thẩm định minh chứng (Dành cho Tổ trưởng / BGH)
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOutstanding}
                    onChange={(e) => setIsOutstanding(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-medium text-amber-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Minh chứng nổi bật (Căn cứ xếp loại A+)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nhận xét / Ý kiến thẩm định / Lý do điều chỉnh:
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Nhập nội dung nhận xét hoặc lý do yêu cầu bổ sung minh chứng..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  rows={2}
                />
              </div>

              {actionError && (
                <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                  {actionError}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleReviewAction('REJECTED')}
                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
                >
                  Từ chối minh chứng
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleReviewAction('REVISION_REQUIRED')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-xs font-semibold shadow-xs transition-colors"
                >
                  Yêu cầu bổ sung
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() =>
                    handleReviewAction(
                      currentUser.role === 'PRINCIPAL' ? 'BGH_APPROVED' : 'TEAM_APPROVED'
                    )
                  }
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition-colors"
                >
                  Phê duyệt minh chứng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Hệ thống Quản lý Thi đua – Trường TH&THCS Nguyễn Đình Anh
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
