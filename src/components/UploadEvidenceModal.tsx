import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  Calendar,
  CheckCircle2,
  FolderGit2,
  Sparkles,
  Paperclip,
  Check,
  Eye,
  FileCheck,
  ArrowRight,
  Send
} from 'lucide-react';
import { User, EvidenceItem, EvidenceStatus } from '../types';
import { criteriaService } from '../services/criteriaService';
import { storageService } from '../services/storageService';
import { evidenceStorageService, buildEvidenceStoragePath } from '../services/evidenceStorageService';
import { formatExactTimestamp, getAuthoritativeTimestamp } from '../utils/formatters';

interface UploadEvidenceModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
  initialCriteriaId?: string;
}

// Gợi ý nhanh tài liệu minh chứng cho từng nhóm và tiêu chí (Mục 9)
const CRITERIA_DOCUMENT_SUGGESTIONS: Record<string, string[]> = {
  'c-2-3': ['Kế hoạch bài dạy (CV 5512)', 'Phiếu học tập số hóa', 'Hình ảnh hoạt động nhóm', 'Sản phẩm học sinh'],
  'c-2-1': ['Kế hoạch giáo dục cá nhân (KHGD)', 'Sổ ghi đầu bài điện tử', 'Kế hoạch dạy học môn học'],
  'c-2-2': ['Hồ sơ chuyên môn điện tử', 'Giáo án bài dạy', 'Biên bản kiểm tra hồ sơ'],
  'c-2-4': ['Sổ dự giờ điện tử', 'Biên bản tiết dạy thao giảng', 'Biên bản sinh hoạt chuyên môn NCBH'],
  'c-2-5': ['Ma trận và đặc tả đề kiểm tra', 'Bảng thống kê điểm số vnEdu', 'Đề kiểm tra kèm đáp án'],
  'c-2-6': ['Kế hoạch phụ đạo học sinh yếu', 'Kế hoạch bồi dưỡng HSG', 'Danh sách và bảng điểm đối sánh'],
  'c-1-1': ['Bản cam kết thi đua đầu năm', 'Biên bản đánh giá viên chức', 'Minh chứng chấp hành quy định'],
  'c-1-2': ['Phiếu tự đánh giá chuẩn nghề nghiệp', 'Biên bản nhận xét của tổ chuyên môn', 'Cam kết đạo đức nhà giáo'],
  'c-3-1': ['Báo cáo chỉ tiêu chất lượng bộ môn', 'Bảng tổng hợp điểm khảo sát đầu năm', 'Đối sánh kết quả chỉ tiêu'],
  'c-3-4': ['Kế hoạch ngoại khóa / CLB bộ môn', 'Hình ảnh ngày hội STEM', 'Video trải nghiệm sáng tạo'],
  'c-4-1': ['Báo cáo theo dõi ngày công, giờ công', 'Bảng chấm công điện tử', 'Sổ ghi nhận nề nếp'],
  'c-4-2': ['Nhật ký nộp báo cáo đúng hạn', 'Biên bản nộp đề kiểm tra định kỳ', 'Xác nhận của chuyên môn'],
  'c-5-1': ['Sổ chủ nhiệm lớp', 'Biên bản họp phụ huynh đầu năm', 'Bảng theo dõi chuyên cần học sinh'],
  'c-6-1': ['Báo cáo ứng dụng trợ lý AI trong dạy học', 'Bài giảng số E-learning trên LMS', 'Kho học liệu số tương tác'],
  'c-6-3': ['Báo cáo tóm tắt sáng kiến kinh nghiệm', 'Quyết định công nhận SKKN', 'Giấy xác nhận hiệu quả áp dụng']
};

export const UploadEvidenceModal: React.FC<UploadEvidenceModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
  initialCriteriaId
}) => {
  const settings = storageService.getSettings();
  const groups = criteriaService.getGroups();
  const allCriteria = criteriaService.getAllCriteria().filter((c) => c.is_active);

  // Form states (Mục 2)
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    if (initialCriteriaId) {
      const match = allCriteria.find((c) => c.id === initialCriteriaId);
      if (match) return match.group_id;
    }
    return groups[1]?.id || 'group-2'; // Default Nhóm 2
  });

  const [criteriaId, setCriteriaId] = useState<string>(() => {
    if (initialCriteriaId) return initialCriteriaId;
    const firstInGroup = allCriteria.find((c) => c.group_id === (groups[1]?.id || 'group-2'));
    return firstInGroup?.id || allCriteria[0]?.id || 'c-2-3';
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schoolYear, setSchoolYear] = useState(settings.schoolYear || '2026-2027');
  const [semester, setSemester] = useState<'HKI' | 'HKII' | 'CA_NAM'>(settings.currentSemester || 'HKI');
  const [evidenceType, setEvidenceType] = useState<EvidenceItem['evidenceType']>('GIAO_AN');
  const [executionDate, setExecutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isOutstanding, setIsOutstanding] = useState(false);

  // File state & Drag-drop
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Criteria & Group match
  const groupCriteriaList = allCriteria.filter((c) => c.group_id === selectedGroupId);
  const selectedCriteria = allCriteria.find((c) => c.id === criteriaId);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Suggestions for currently selected criteria (Mục 9)
  const currentSuggestions = (selectedCriteria && CRITERIA_DOCUMENT_SUGGESTIONS[selectedCriteria.id]) || [
    'Kế hoạch giáo dục / Kế hoạch bài dạy',
    'Biên bản / Báo cáo kết quả',
    'Hình ảnh hoạt động giáo dục',
    'Sản phẩm học sinh'
  ];

  // Handle Group change -> Auto pick first criteria
  const handleGroupChange = (newGroupId: string) => {
    setSelectedGroupId(newGroupId);
    const firstInNewGroup = allCriteria.find((c) => c.group_id === newGroupId);
    if (firstInNewGroup) {
      setCriteriaId(firstInNewGroup.id);
    }
  };

  // Validate File (Mục 3)
  const validateAndProcessFile = (file: File) => {
    setFileError('');
    const maxBytes = (settings.maxFileSizeMb || 25) * 1024 * 1024;

    if (file.size > maxBytes) {
      setFileError(`File vượt quá dung lượng tối đa cấu hình (${settings.maxFileSizeMb || 25}MB).`);
      return false;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'zip'];

    if (!allowed.includes(ext)) {
      setFileError(
        `Định dạng .${ext} không được hỗ trợ. Các định dạng cho phép: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG, ZIP`
      );
      return false;
    }

    setSelectedFile(file);

    // Auto set name if empty
    if (!name.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setName(cleanName);
    }

    // Auto detect evidence type
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
      if (file.name.toLowerCase().includes('khbd') || file.name.toLowerCase().includes('giao an')) {
        setEvidenceType('GIAO_AN');
      } else if (file.name.toLowerCase().includes('bao cao')) {
        setEvidenceType('BAO_CAO');
      } else if (file.name.toLowerCase().includes('bien ban')) {
        setEvidenceType('BIEN_BAN');
      }
    } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      setEvidenceType('HINH_ANH');
    }

    // Create object URL for instant preview
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);

    return true;
  };

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers (Mục 12)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError('');

    if (!criteriaId || !selectedCriteria || !selectedGroup) {
      setFileError('Vui lòng chọn đầy đủ Nhóm tiêu chí và Mã tiêu chí thi đua.');
      return;
    }

    if (!name.trim()) {
      setFileError('Vui lòng nhập tên minh chứng rõ ràng.');
      return;
    }

    if (!selectedFile) {
      setFileError('Vui lòng chọn hoặc kéo thả file minh chứng cần tải lên.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);

    try {
      // 1. Build standardized Supabase Storage path (Mục 1)
      const storagePath = buildEvidenceStoragePath(
        schoolYear,
        semester,
        currentUser.departmentName || 'To-Chuyen-Mon',
        currentUser.name,
        selectedCriteria.ma_tieu_chi,
        selectedFile.name
      );

      // 2. Real upload into Supabase Storage bucket `minh-chung-thi-dua` (Mục 1 & 12)
      const uploadResult = await evidenceStorageService.uploadEvidenceFile(
        selectedFile,
        storagePath,
        (progress) => setUploadProgress(progress)
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Lỗi trong quá trình upload file.');
      }

      // 3. Save to database / state (Mục 4)
      const timeStr = uploadResult.uploadedAt || getAuthoritativeTimestamp();
      const newEvidence: EvidenceItem = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        teacherId: currentUser.id,
        teacherName: currentUser.name,
        departmentId: currentUser.departmentId,
        departmentName: currentUser.departmentName,
        schoolYear,
        semester,
        criteriaGroupId: selectedGroup.id,
        criteriaId: selectedCriteria.id,
        criteriaCode: selectedCriteria.ma_tieu_chi,
        criteriaTitle: selectedCriteria.ten_tieu_chi,
        name: name.trim(),
        description: description.trim() || `Minh chứng cho tiêu chí ${selectedCriteria.ma_tieu_chi}: ${selectedCriteria.ten_tieu_chi}`,
        evidenceType,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileType: uploadResult.fileType,
        storagePath: uploadResult.filePath,
        executionDate,
        uploadedAt: timeStr,
        uploadedBy: currentUser.name,
        status: 'SUBMITTED' as EvidenceStatus,
        note: note.trim(),
        isOutstanding,
        auditLogs: []
      };

      storageService.saveEvidence(
        newEvidence,
        currentUser,
        `Tải lên file ${selectedFile.name} (Lưu trữ: ${storagePath})`
      );

      // 4. Notify Team Leader
      const dept = storageService.getDepartments().find((d) => d.id === currentUser.departmentId);
      if (dept && dept.leaderId) {
        storageService.addNotification({
          userId: dept.leaderId,
          title: 'Minh chứng mới cần thẩm định',
          message: `${currentUser.name} vừa nộp minh chứng mới cho tiêu chí ${selectedCriteria.ma_tieu_chi} (${name.trim()}).`,
          type: 'INFO',
          createdAt: timeStr,
          isRead: false
        });
      }

      setUploadSuccessMessage(`Đã tải lên minh chứng "${name.trim()}" thành công!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Upload evidence error:', err);
      setFileError(err.message || 'Có lỗi xảy ra khi upload file lên Supabase Storage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isImageFile = selectedFile && (
    selectedFile.type.startsWith('image/') ||
    ['jpg', 'jpeg', 'png'].includes(selectedFile.name.split('.').pop()?.toLowerCase() || '')
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header (Mục 2) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  Supabase Storage Bucket: minh-chung-thi-dua
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 mt-0.5">
                + Thêm Minh Chứng Thi Đua Mới
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Success Banner */}
        {uploadSuccessMessage && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{uploadSuccessMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {fileError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Auto-populated readout (Mục 2: Tự động lấy Người nộp, Tổ, Thời gian upload) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Người nộp (Tự động):</span>
              <span className="font-bold text-slate-900 block mt-0.5">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Tổ chuyên môn (Tự động):</span>
              <span className="font-bold text-slate-900 block mt-0.5">{currentUser.departmentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Thời gian nộp (Authoritative):</span>
              <span className="font-bold text-blue-700 block mt-0.5 font-mono">
                {getAuthoritativeTimestamp()}
              </span>
            </div>
          </div>

          {/* Row 1: Năm học & Học kỳ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Năm học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                placeholder="2026-2027"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Học kỳ <span className="text-red-500">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
              >
                <option value="HKI">Học kỳ I (HKI)</option>
                <option value="HKII">Học kỳ II (HKII)</option>
                <option value="CA_NAM">Cả năm</option>
              </select>
            </div>
          </div>

          {/* Row 2: Nhóm tiêu chí & Mã tiêu chí (Mục 2 & Mục 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nhóm tiêu chí <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.ten_nhom} ({g.diem_toi_da}đ)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mã tiêu chí thi đua <span className="text-red-500">*</span>
              </label>
              <select
                value={criteriaId}
                onChange={(e) => setCriteriaId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-blue-900"
              >
                {groupCriteriaList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ma_tieu_chi} – {c.ten_tieu_chi} (Tối đa {c.diem_toi_da}đ)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Suggestions Pill Bar (Mục 9: Gắn minh chứng với tiêu chí cụ thể) */}
          {selectedCriteria && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Gợi ý tài liệu cho tiêu chí {selectedCriteria.ma_tieu_chi} ({selectedCriteria.ten_tieu_chi}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setName(sug);
                      if (sug.includes('Kế hoạch')) setEvidenceType('GIAO_AN');
                      else if (sug.includes('Biên bản') || sug.includes('Phiếu')) setEvidenceType('BIEN_BAN');
                      else if (sug.includes('Hình ảnh')) setEvidenceType('HINH_ANH');
                      else if (sug.includes('Sản phẩm')) setEvidenceType('SAN_PHAM');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tên minh chứng */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tên minh chứng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Kế hoạch bài dạy Tin học 8 – Sử dụng bảng tính điện tử nâng cao..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
            />
          </div>

          {/* Mô tả minh chứng */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mô tả nội dung minh chứng
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nội dung, bối cảnh thực hiện, sản phẩm kèm theo..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          {/* Row 3: Loại minh chứng & Ngày thực hiện */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phân loại minh chứng
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
              >
                <option value="GIAO_AN">Kế hoạch bài dạy / Giáo án (CV 5512)</option>
                <option value="BIEN_BAN">Biên bản / Phiếu đánh giá / Phiếu học tập</option>
                <option value="HINH_ANH">Hình ảnh hoạt động / Tiết dạy</option>
                <option value="SAN_PHAM">Sản phẩm học sinh / Học liệu số</option>
                <option value="CHUNG_CHI">Chứng chỉ / Giấy chứng nhận</option>
                <option value="QUYET_DINH">Quyết định / Giấy triệu tập</option>
                <option value="BAO_CAO">Báo cáo chỉ tiêu / Báo cáo sáng kiến</option>
                <option value="KHAC">Tài liệu khác</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ngày thực hiện <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={executionDate}
                onChange={(e) => setExecutionDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Ghi chú (Mục 2) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ghi chú thêm
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Minh chứng đợt 1, đã được tổ trưởng góp ý sơ bộ..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          {/* FILE UPLOAD & DRAG DROP (Mục 1, 3, 12) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              File minh chứng <span className="text-red-500">*</span>
              <span className="font-normal text-[11px] text-slate-500 ml-1.5">
                (Định dạng: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG, ZIP • Tối đa {settings.maxFileSizeMb || 25}MB)
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
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {selectedFile.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dung lượng: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Nhấp để đổi file khác
                  </div>

                  {/* Image preview thumbnail */}
                  {isImageFile && filePreviewUrl && (
                    <div className="mt-2 inline-block p-1 border border-slate-200 rounded-lg bg-white">
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="max-h-24 max-w-xs object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-800 text-xs">
                    Kéo thả file vào đây hoặc <span className="text-blue-600 underline">chọn từ thiết bị</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Hỗ trợ tệp số hóa chất lượng cao, lưu trữ đồng bộ vào Supabase Storage
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress Bar (Mục 12) */}
            {isSubmitting && (
              <div className="mt-3 space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                  <span>Đang tải lên Supabase Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ghi chú thêm (Mục 2) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ghi chú thêm
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho tổ trưởng chuyên môn hoặc ban giám hiệu..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          {/* Minh chứng nổi bật checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={isOutstanding}
                onChange={(e) => setIsOutstanding(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
              />
              <span>Đề xuất là minh chứng nổi bật (Phục vụ xếp loại mức A+ theo Quy chế)</span>
            </label>
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Bucket: <code>{settings.schoolYear}/{settings.currentSemester}/...</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang tải lên...' : 'GỬI TỔ TRƯỞNG DUYỆT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
