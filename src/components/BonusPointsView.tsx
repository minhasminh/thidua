import React, { useState } from 'react';
import {
  Award,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  ShieldCheck,
  Calendar,
  X,
  History,
  AlertTriangle,
  Clock,
  Check,
  XCircle,
  FileText
} from 'lucide-react';
import { BonusItem, User, normalizeRole, ScoreAuditLog } from '../types';
import { storageService } from '../services/storageService';
import { BONUS_CATEGORIES, hasBonusEvidence } from '../services/scoringEngine';

interface BonusPointsViewProps {
  currentUser: User;
}

export const BonusPointsView: React.FC<BonusPointsViewProps> = ({ currentUser }) => {
  const normRole = normalizeRole(currentUser.role);
  const isBghOrAdmin = normRole === 'BGH' || normRole === 'ADMIN';

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(currentUser.id);
  const [category, setCategory] = useState<BonusItem['category']>('CAP_TRUONG');
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(1.0);
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Reject Modal
  const [rejectModalItem, setRejectModalItem] = useState<BonusItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Audit Log History Modal
  const [historyModalItem, setHistoryModalItem] = useState<BonusItem | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const allUsers = storageService.getUsers().filter(
    (u) =>
      u.role === 'TEACHER' ||
      u.role === 'TEAM_LEADER' ||
      u.role === 'GIAO_VIEN' ||
      u.role === 'TO_TRUONG' ||
      u.role === 'TO_PHO'
  );
  const bonusList = storageService.getBonusList();

  const currentCategoryObj =
    BONUS_CATEGORIES.find((c) => c.code === category) || BONUS_CATEGORIES[0];

  const handleOpenAddModal = () => {
    setSelectedTeacherId(currentUser.id);
    setCategory('CAP_TRUONG');
    setTitle('');
    setPoints(1.0);
    setEvidenceName('');
    setEvidenceUrl('');
    setNote('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleAddBonus = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Vui lòng nhập nội dung thành tích!');
      return;
    }

    // Mục 6: Bắt buộc có minh chứng
    if (!evidenceName.trim() && !evidenceUrl.trim()) {
      setFormError('Mục 6: Điểm cộng bắt buộc phải có minh chứng (Tên văn bản hoặc Đường dẫn xem file)!');
      return;
    }

    const teacher = storageService.getUserById(selectedTeacherId);
    if (!teacher) return;

    const newBonus: BonusItem = {
      id: `bonus-${Date.now()}`,
      teacherId: selectedTeacherId,
      teacherName: teacher.name,
      category,
      categoryLabel: currentCategoryObj.label,
      title: title.trim(),
      points: Number(points),
      evidenceName: evidenceName.trim() || 'MinhChungThanhTich.pdf',
      evidenceUrl: evidenceUrl.trim(),
      verifiedBy: isBghOrAdmin ? `${currentUser.name} (${currentUser.position || currentUser.role})` : 'Chờ thẩm định',
      verifiedById: isBghOrAdmin ? currentUser.id : undefined,
      date: new Date().toISOString().split('T')[0],
      status: isBghOrAdmin ? 'APPROVED' : 'PENDING',
      note: note.trim()
    };

    try {
      storageService.saveBonus(newBonus, currentUser);
      setShowAddModal(false);
      setNotificationMsg({
        type: 'success',
        text: `Đã ghi nhận điểm cộng thành tích cho giáo viên ${teacher.name} thành công!`
      });
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu điểm cộng.');
    }
  };

  const handleApprove = (item: BonusItem) => {
    try {
      storageService.approveBonus(item.id, currentUser);
      setNotificationMsg({
        type: 'success',
        text: `Đã phê duyệt +${item.points}đ cho thành tích: "${item.title}".`
      });
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err: any) {
      setNotificationMsg({
        type: 'error',
        text: err.message || 'Không thể phê duyệt điểm cộng.'
      });
      setTimeout(() => setNotificationMsg(null), 4500);
    }
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối điểm cộng!');
      return;
    }

    try {
      storageService.rejectBonus(rejectModalItem.id, currentUser, rejectReason);
      setRejectModalItem(null);
      setRejectReason('');
      setNotificationMsg({
        type: 'success',
        text: `Đã từ chối điểm cộng "${rejectModalItem.title}".`
      });
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Lỗi từ chối điểm cộng.');
    }
  };

  const handleDelete = (id: string, itemTitle: string) => {
    if (confirm(`Xác nhận xóa điểm cộng "${itemTitle}"? Thao tác sẽ được ghi vào Audit Log.`)) {
      storageService.deleteBonus(id, currentUser);
      setNotificationMsg({
        type: 'success',
        text: `Đã xóa điểm cộng "${itemTitle}".`
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
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Award className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              ENGINE THI ĐUA – MODULE BONUS POINTS (Mục 2 & 6)
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Quản lý Điểm cộng Thành tích & Khen thưởng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            5 nhóm thành tích chuẩn, kiểm soát minh chứng bắt buộc, chống cộng trùng và truy vết lịch sử Audit Log
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Thêm điểm cộng mới
        </button>
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

      {/* 5 Nhóm danh mục Điểm cộng (Mục 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {BONUS_CATEGORIES.map((cat, idx) => (
          <div key={cat.code} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Nhóm {idx + 1}</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-black">
                  +{cat.minPoints}–{cat.maxPoints}đ
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs mt-1.5 line-clamp-2">
                {cat.label}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {cat.description}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Bắt buộc có minh chứng
            </div>
          </div>
        ))}
      </div>

      {/* Bonus Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Danh sách điểm cộng đã ghi nhận ({bonusList.length})
          </div>
          <span className="text-xs text-slate-500">
            Nguyên tắc: Không cộng trùng • Minh chứng hợp lệ mới được duyệt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-4 min-w-[160px]">Giáo viên</th>
                <th className="py-3.5 px-4 min-w-[190px]">Nhóm điểm cộng (Mục 2)</th>
                <th className="py-3.5 px-4 min-w-[240px]">Nội dung thành tích</th>
                <th className="py-3.5 px-3 text-center w-24">Số điểm</th>
                <th className="py-3.5 px-4 min-w-[200px]">Minh chứng (Mục 6)</th>
                <th className="py-3.5 px-3 text-center w-28">Ngày</th>
                <th className="py-3.5 px-3.5 text-center w-32">Người xác nhận</th>
                <th className="py-3.5 px-3 text-center w-28">Trạng thái duyệt</th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">Thao tác & Lịch sử</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bonusList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    Chưa có bản ghi điểm cộng nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                bonusList.map((item, idx) => {
                  const teacher = storageService.getUserById(item.teacherId);
                  const hasEvidence = hasBonusEvidence(item);

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

                      {/* Nhóm điểm cộng */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <span className="font-semibold text-slate-800">{item.categoryLabel}</span>
                      </td>

                      {/* Nội dung */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        {item.note && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Ghi chú: {item.note}
                          </div>
                        )}
                      </td>

                      {/* Số điểm */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                          +{item.points}đ
                        </span>
                      </td>

                      {/* Minh chứng (Mục 6: Bắt buộc có minh chứng mới được duyệt) */}
                      <td className="py-3.5 px-4">
                        {hasEvidence ? (
                          <div className="space-y-0.5">
                            {item.evidenceUrl ? (
                              <a
                                href={item.evidenceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[170px]">{item.evidenceName || 'Xem minh chứng'}</span>
                              </a>
                            ) : (
                              <div className="text-slate-800 font-medium flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="truncate max-w-[170px]">{item.evidenceName}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              ✓ Có minh chứng
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Thiếu minh chứng
                            </span>
                            <span className="text-[10px] text-rose-500 block">
                              (Không cho duyệt theo Mục 6)
                            </span>
                          </div>
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

                      {/* Trạng thái duyệt */}
                      <td className="py-3.5 px-3 text-center">
                        {item.status === 'APPROVED' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã duyệt
                          </span>
                        ) : item.status === 'REJECTED' ? (
                          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-rose-300 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" /> Từ chối
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Chờ duyệt
                          </span>
                        )}
                      </td>

                      {/* Thao tác & Lịch sử (Mục 8) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Lịch sử Audit Log */}
                          <button
                            onClick={() => setHistoryModalItem(item)}
                            className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
                            title="Xem lịch sử Audit Log thay đổi điểm (Mục 8)"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Thao tác Phê duyệt cho BGH / Admin */}
                          {isBghOrAdmin && item.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleApprove(item)}
                              disabled={!hasEvidence}
                              className={`px-2 py-1 rounded-lg text-white font-bold text-[11px] flex items-center gap-1 transition-all ${
                                hasEvidence
                                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-2xs cursor-pointer'
                                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                              }`}
                              title={
                                hasEvidence
                                  ? 'Phê duyệt điểm cộng'
                                  : 'Không có minh chứng → không cho duyệt (Mục 6)'
                              }
                            >
                              <Check className="w-3 h-3" /> Duyệt
                            </button>
                          )}

                          {isBghOrAdmin && item.status !== 'REJECTED' && (
                            <button
                              onClick={() => {
                                setRejectModalItem(item);
                                setRejectReason('');
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-[11px] cursor-pointer"
                              title="Từ chối điểm cộng"
                            >
                              Từ chối
                            </button>
                          )}

                          {isBghOrAdmin && (
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                              title="Xóa điểm cộng"
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

      {/* Add Bonus Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <h2 className="text-base font-bold">Thêm điểm cộng thành tích (Mục 2 & 6)</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBonus} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn Giáo viên được cộng điểm <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {allUsers.map((u, idx) => (
                    <option key={`bonus-user-${u.id}-${idx}`} value={u.id}>
                      {u.name} - {u.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  5 Loại thành tích theo Quy chế (Mục 2) <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setCategory(val);
                    const found = BONUS_CATEGORIES.find((c) => c.code === val);
                    if (found) setPoints(found.minPoints);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {BONUS_CATEGORIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} (+{c.minPoints}–{c.maxPoints}đ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điểm (+{currentCategoryObj.minPoints} đến +{currentCategoryObj.maxPoints}đ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min={currentCategoryObj.minPoints}
                    max={currentCategoryObj.maxPoints}
                    value={points}
                    onChange={(e) => setPoints(parseFloat(e.target.value) || currentCategoryObj.minPoints)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-emerald-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên minh chứng / Số quyết định <span className="text-red-500">* (Mục 6)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={evidenceName}
                    onChange={(e) => setEvidenceName(e.target.value)}
                    placeholder="VD: QĐ 45/QĐ-UBND, Giấy khen..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung thành tích / Sáng kiến <span className="text-red-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">(Hệ thống tự kiểm tra chống cộng trùng)</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Đạt giải Nhất giáo viên dạy giỏi cấp Thành phố môn Toán..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đường dẫn xem file minh chứng (URL / Cloud Storage)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... hoặc đường dẫn file scan"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú / Cơ quan ban hành
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Cơ quan cấp khen thưởng, ngày hiệu lực..."
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Xác nhận lưu điểm cộng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Từ chối điểm cộng
              </h2>
              <button
                onClick={() => setRejectModalItem(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block">Thành tích:</span>
                <span className="font-bold text-slate-800 text-sm">{rejectModalItem.title}</span>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do từ chối <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="VD: Minh chứng không có dấu mộc hợp lệ; quyết định khen thưởng ngoài niên độ..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md"
                >
                  Xác nhận từ chối
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
                <h2 className="text-base font-bold">Lịch sử Audit Log (Mục 8)</h2>
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
                <div className="font-bold text-slate-800 text-sm">{historyModalItem.title}</div>
                <div className="text-slate-500 mt-0.5">
                  Mức điểm: +{historyModalItem.points}đ • Nhóm: {historyModalItem.categoryLabel}
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
                        <span className="text-indigo-700">{log.action}</span>
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
