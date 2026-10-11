import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Paperclip,
  ArrowRight,
  Send,
  Eye,
  FileCheck
} from 'lucide-react';
import { EvidenceItem, User } from '../types';
import { storageService } from '../services/storageService';
import { evidenceStorageService, buildEvidenceStoragePath } from '../services/evidenceStorageService';

interface SupplementEvidenceModalProps {
  evidence: EvidenceItem;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplementEvidenceModal: React.FC<SupplementEvidenceModalProps> = ({
  evidence,
  currentUser,
  onClose,
  onSuccess
}) => {
  const settings = storageService.getSettings();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teacherNote, setTeacherNote] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    setErrorMsg('');
    const maxBytes = (settings.maxFileSizeMb || 25) * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`File vượt quá dung lượng cho phép (${settings.maxFileSizeMb || 25}MB).`);
      return false;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'zip'];
    if (!allowed.includes(ext)) {
      setErrorMsg(`Định dạng .${ext} không được hỗ trợ. Các định dạng: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, ZIP.`);
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn tệp tài liệu mới cần bổ sung!');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(20);

    try {
      // 1. Build standardized path
      const storagePath = buildEvidenceStoragePath(
        evidence.schoolYear,
        evidence.semester,
        currentUser.departmentName || 'To-Chuyen-Mon',
        currentUser.name,
        evidence.criteriaCode,
        selectedFile.name
      );

      // 2. Upload file to Supabase Storage
      const uploadRes = await evidenceStorageService.uploadEvidenceFile(
        selectedFile,
        storagePath,
        (p) => setUploadProgress(p)
      );

      if (!uploadRes.success) {
        throw new Error(uploadRes.error || 'Lỗi tải lên file.');
      }

      // 3. Update evidence in storage service & submit back to Team Leader
      storageService.supplementEvidenceFile(evidence.id, currentUser, {
        fileName: uploadRes.fileName,
        filePath: uploadRes.filePath,
        fileUrl: uploadRes.fileUrl,
        fileSize: uploadRes.fileSize,
        fileType: uploadRes.fileType,
        teacherNote: teacherNote.trim()
      });

      setSuccessMsg('Đã nộp bổ sung minh chứng và gửi lại cho Tổ trưởng duyệt thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra khi nộp bổ sung minh chứng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100">
                Workflow: Giáo viên → Tổ trưởng
              </div>
              <h2 className="text-base font-black">
                Bổ sung minh chứng theo yêu cầu Tổ trưởng
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Reason Alert from Team Leader (Mục 4) */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Lý do Tổ trưởng yêu cầu bổ sung:
            </div>
            <p className="text-amber-800 text-xs italic pl-5 font-medium leading-relaxed">
              "{evidence.reviewNote || 'Chưa có thông tin lý do cụ thể.'}"
            </p>
            {evidence.reviewerName && (
              <div className="text-[10px] text-amber-700/80 pl-5">
                Người yêu cầu: <strong>{evidence.reviewerName}</strong> ({evidence.reviewerRole || 'Tổ trưởng'}) • {evidence.reviewDate}
              </div>
            )}
          </div>

          {/* Evidence Details Readout */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800 text-xs">
              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono mr-1.5">
                {evidence.criteriaCode}
              </span>
              {evidence.name}
            </div>
            <div className="text-[11px] text-slate-500">
              Tệp hiện tại: <span className="font-mono text-slate-700 font-medium">{evidence.fileName}</span> ({evidence.fileSize})
            </div>
          </div>

          {/* File Upload Box (Mục 4: Giáo viên được phép bổ sung file) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn tệp mới bổ sung / thay thế <span className="text-red-500">*</span>
              <span className="font-normal text-[11px] text-slate-500 ml-1.5">
                (Định dạng: PDF, DOC, DOCX, XLS, PPT, JPG, PNG, ZIP • Tối đa {settings.maxFileSizeMb || 25}MB)
              </span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold font-mono">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-900">{selectedFile.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng tải lên
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-1">
                    Nhấp để chọn tệp khác nếu cần
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-800">
                    Kéo thả tệp bổ sung vào đây, hoặc <span className="text-amber-600 underline">duyệt tệp</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    PDF, Word, Excel, PowerPoint, Ảnh hoặc ZIP
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Note / Explanation */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ý kiến giải trình / Ghi chú bổ sung cho Tổ trưởng
            </label>
            <textarea
              rows={2}
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="VD: Em đã bổ sung thêm biên bản họp phụ huynh và hình ảnh tiết dạy theo nhận xét của cô..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          {/* Progress & Alert */}
          {isSubmitting && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
                <span>Đang tải tệp lên Supabase Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> {successMsg}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> GỬI LẠI TỔ TRƯỞNG DUYỆT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
