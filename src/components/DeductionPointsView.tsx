import React, { useState } from 'react';
import {
  AlertOctagon,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  X,
  AlertTriangle,
  User as UserIcon,
  History,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DeductionItem, User, normalizeRole } from '../types';
import { storageService } from '../services/storageService';

interface DeductionPointsViewProps {
  currentUser: User;
}

export const DeductionPointsView: React.FC<DeductionPointsViewProps> = ({ currentUser }) => {
  const normRole = normalizeRole(currentUser.role);
  const isLeaderOrAdmin =
    normRole === 'TO_TRUONG' ||
    normRole === 'TO_PHO' ||
    normRole === 'BGH' ||
    normRole === 'ADMIN';

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [title, setTitle] = useState('');
  const [reasonCategory, setReasonCategory] = useState('HO_SO_CHAM');
  const [reasonCustom, setReasonCustom] = useState('');
  const [points, setPoints] = useState(1.0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [evidenceBasis, setEvidenceBasis] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // History Audit Log Modal
  const [historyModalItem, setHistoryModalItem] = useState<DeductionItem | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const allUsers = storageService.getUsers().filter(
    (u) =>
      u.role === 'TEACHER' ||
      u.role === 'TEAM_LEADER' ||
      u.role === 'GIAO_VIEN' ||
      u.role === 'TO_TRUONG' ||
      u.role === 'TO_PHO'
  );
  const deductionList = storageService.getDeductions();

  const defaultReasons = [
    { value: 'HO_SO_CHAM', label: 'Báo cáo / hồ sơ chuyên môn nộp chậm quá hạn', defaultPoints: 1.0 },
    { value: 'DI_MUON', label: 'Đi muộn / về sớm không lý do chính đáng', defaultPoints: 0.5 },
    { value: 'VANG_HOP', label: 'Vắng họp Hội đồng / sinh hoạt chuyên môn không phép', defaultPoints: 2.0 },
    { value: 'KHONG_THUC_HIEN', label: 'Không thực hiện nhiệm vụ được nhà trường phân công', defaultPoints: 3.0 },
    { value: 'SAI_HO_SO', label: 'Sai lệch hồ sơ, điểm số, sổ sách do lỗi chủ quan', defaultPoints: 1.5 },
    { value: 'VI_PHAM_TAC_PHONG', label: 'Vi phạm tác phong sư phạm, nề nếp chuyên môn', defaultPoints: 1.0 },
    { value: 'KHAC', label: 'Nội dung vi phạm khác', defaultPoints: 1.0 }
  ];

  const handleOpenAddModal = () => {
    setSelectedTeacherId(allUsers[0]?.id || '');
    setTitle('');
    setReasonCategory('HO_SO_CHAM');
    setReasonCustom('');
    setPoints(1.0);
    setDate(new Date().toISOString().split('T')[0]);
    setEvidenceBasis('');
    setEvidenceUrl('');
    setNotes('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleAddDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const selectedReasonObj = defaultReasons.find((r) => r.value === reasonCategory);
    const finalReason =
      reasonCategory === 'KHAC'
        ? reasonCustom.trim()
        : `${selectedReasonObj?.label || ''}${reasonCustom.trim() ? `: ${reasonCustom.trim()}` : ''}`;

    if (!finalReason.trim()) {
      setFormError('Mục 3: Vui lòng nhập lý do trừ điểm!');
      return;
    }

    if (!evidenceBasis.trim() && !evidenceUrl.trim()) {
      setFormError('Mục 3: Bắt buộc phải có Căn cứ / Minh chứng vi phạm (Số biên bản hoặc liên kết file)!');
      return;
    }

    const teacher = storageService.getUserById(selectedTeacherId);
    if (!teacher) return;

    const newDeduct: DeductionItem = {
      id: `deduct-${Date.now()}`,
      teacherId: selectedTeacherId,
      teacherName: teacher.name,
      title: title.trim() || finalReason,
      reason: finalReason,
      points: Number(points),
      date,
      evidenceBasis: evidenceBasis.trim() || 'Biên bản kiểm tra chuyên môn',
      evidenceUrl: evidenceUrl.trim(),
      verifiedBy: `${currentUser.name} (${currentUser.position || currentUser.role})`,
      verifiedById: currentUser.id,
      notes: notes.trim()
    };

    try {
      storageService.saveDeduction(newDeduct, currentUser);
      setShowAddModal(false);
      setNotificationMsg({
        type: 'success',
        text: `Đã ghi nhận điểm trừ cho giáo viên ${teacher.name} (-${points}đ).`
      });
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu điểm trừ.');
    }
  };

  const handleDelete = (id: string, reasonText: string) => {
    if (confirm(`Xác nhận xóa biên bản điểm trừ: "${reasonText}"? Thao tác sẽ được ghi vào Audit Log.`)) {
      storageService.deleteDeduction(id, currentUser);
      setNotificationMsg({
        type: 'success',
        text: `Đã xóa biên bản điểm trừ.`
      });
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">
              ENGINE THI ĐUA – MODULE DEDUCTION POINTS (Mục 3)
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Sổ theo dõi Điểm trừ Thi đua & Kỷ luật
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận vi phạm đầy đủ nội dung, số điểm, minh chứng/căn cứ, ngày, người xác nhận, lý do và truy vết Audit Log
          </p>
        </div>

        {isLeaderOrAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> + Lập biên bản điểm trừ
          </button>
        )}
      </div>

      {/* Global Notification Toast */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-500 text-white shrink-0 mt-0.5">
          <AlertOctagon className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs text-red-900">
          <div className="font-bold uppercase tracking-wider">Nguyên tắc quản lý điểm trừ (Mục 3)</div>
          <p className="text-red-800 text-[11px]">
            Mọi điểm trừ bắt buộc phải có biên bản, căn cứ xác minh cụ thể và người chịu trách nhiệm xác nhận. Điểm trừ sẽ tự động khấu trừ vào công thức điểm cuối: <strong>Điểm cơ bản + Điểm cộng - Điểm trừ</strong>.
          </p>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            Biên bản ghi nhận điểm trừ ({deductionList.length})
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Có đầy đủ minh chứng/căn cứ & Audit Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-4 min-w-[160px]">Giáo viên</th>
                <th className="py-3.5 px-4 min-w-[220px]">Nội dung / Tiêu đề</th>
                <th className="py-3.5 px-4 min-w-[240px]">Lý do trừ điểm (Mục 3)</th>
                <th className="py-3.5 px-3 text-center w-24">Số điểm trừ</th>
                <th className="py-3.5 px-4 min-w-[200px]">Minh chứng / Căn cứ (Mục 3)</th>
                <th className="py-3.5 px-3 text-center w-28">Ngày lập</th>
                <th className="py-3.5 px-3.5 text-center w-36">Người xác nhận</th>
                <th className="py-3.5 px-3 text-center w-24">Lịch sử & Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deductionList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    Không có trường hợp vi phạm hoặc điểm trừ nào được ghi nhận. Toàn trường đạt nền nếp tốt!
                  </td>
                </tr>
              ) : (
                deductionList.map((item, idx) => {
                  const teacher = storageService.getUserById(item.teacherId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* STT */}
                      <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>

                      {/* Giáo viên */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {teacher ? teacher.name : item.teacherName || item.teacherId}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {teacher?.departmentName}
                        </div>
                      </td>

                      {/* Nội dung */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {item.title || item.reason}
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                            Ghi chú: {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Lý do */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="line-clamp-2">{item.reason}</div>
                      </td>

                      {/* Số điểm trừ */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-black text-rose-700 text-sm bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 shadow-2xs">
                          -{item.points}đ
                        </span>
                      </td>

                      {/* Minh chứng / Căn cứ */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="truncate max-w-[170px]">
                            {item.evidenceBasis || 'Biên bản kiểm tra'}
                          </span>
                        </div>
                        {item.evidenceUrl && (
                          <a
                            href={item.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-[10px] font-semibold flex items-center gap-1 mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" /> Mở tệp đính kèm
                          </a>
                        )}
                      </td>

                      {/* Ngày */}
                      <td className="py-3.5 px-3 text-center text-slate-600 font-mono text-[11px]">
                        {item.date}
                      </td>

                      {/* Người xác nhận */}
                      <td className="py-3.5 px-3.5 text-center text-slate-700 font-medium text-[11px]">
                        {item.verifiedBy || '—'}
                      </td>

                      {/* Lịch sử & Thao tác */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setHistoryModalItem(item)}
                            className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
                            title="Xem lịch sử Audit Log (Mục 8)"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          {isLeaderOrAdmin && (
                            <button
                              onClick={() => handleDelete(item.id, item.title || item.reason)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                              title="Xóa điểm trừ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Deduction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" />
                <h2 className="text-base font-bold">Lập biên bản Điểm trừ Thi đua (Mục 3)</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDeduction} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn Giáo viên vi phạm <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} - {u.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhóm hành vi vi phạm theo Quy chế (Mục 3)
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => {
                    setReasonCategory(e.target.value);
                    const found = defaultReasons.find((r) => r.value === e.target.value);
                    if (found) setPoints(found.defaultPoints);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {defaultReasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} (-{r.defaultPoints}đ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điểm trừ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="10"
                    value={points}
                    onChange={(e) => setPoints(parseFloat(e.target.value) || 0.5)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-rose-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày lập biên bản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung / Tiêu đề biên bản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Chậm nộp kế hoạch bài dạy tuần 12..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do chi tiết vi phạm <span className="text-red-500">* (Mục 3)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={reasonCustom}
                  onChange={(e) => setReasonCustom(e.target.value)}
                  placeholder="Mô tả cụ thể thời gian, địa điểm, nội dung vi phạm..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Minh chứng / Căn cứ xác lập <span className="text-red-500">* (Mục 3)</span>
                </label>
                <input
                  type="text"
                  required
                  value={evidenceBasis}
                  onChange={(e) => setEvidenceBasis(e.target.value)}
                  placeholder="VD: Biên bản số 04/BB-KT ngày 10/11 của Tổ chuyên môn..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đường dẫn tệp đính kèm (nếu có)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... hoặc link tệp scan"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú bổ sung
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ý kiến giải trình của giáo viên (nếu có)..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 cursor-pointer"
                >
                  Xác nhận lập biên bản trừ điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Audit Log Modal (Mục 8) */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold">Lịch sử Audit Log Điểm trừ (Mục 8)</h2>
              </div>
              <button
                onClick={() => setHistoryModalItem(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-sm">
                  {historyModalItem.title || historyModalItem.reason}
                </div>
                <div className="text-rose-700 font-bold mt-0.5">
                  Mức trừ: -{historyModalItem.points}đ • Căn cứ: {historyModalItem.evidenceBasis || 'Biên bản'}
                </div>
              </div>

              <div className="space-y-2">
                {!historyModalItem.auditLogs || historyModalItem.auditLogs.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 italic">
                    Chưa có sự kiện Audit Log nào được ghi nhận cho mục này.
                  </div>
                ) : (
                  historyModalItem.auditLogs.map((log, i) => (
                    <div key={log.id || i} className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="text-rose-700">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">{log.details}</div>
                      <div className="text-slate-400 text-[10px] italic">Thực hiện bởi: {log.actorName}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setHistoryModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
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
