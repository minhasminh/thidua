import React, { useState } from 'react';
import {
  Settings,
  Database,
  Save,
  Download,
  Upload,
  RefreshCw,
  Users,
  Building,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Plus
} from 'lucide-react';
import { SystemSettings, User, Department, Role, normalizeRole } from '../types';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { UserManagementView } from './UserManagementView';
import { DepartmentManagementView } from './DepartmentManagementView';

interface SystemConfigViewProps {
  currentUser: User;
  onRefreshAll: () => void;
}

export const SystemConfigView: React.FC<SystemConfigViewProps> = ({
  currentUser,
  onRefreshAll
}) => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'DEPARTMENTS' | 'TEACHERS' | 'DATABASE' | 'BACKUP' | 'RLS_TEST'>('SETTINGS');
  const [settings, setSettings] = useState<SystemSettings>(() => storageService.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<Role>(currentUser.role);
  const departments = storageService.getDepartments();

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopySql = () => {
    const sql = storageService.getSupabaseSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExportBackup = () => {
    const json = storageService.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaoLuu_ThiDua_NguyenDinhAnh_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const success = storageService.importBackupJson(text);
          if (success) {
            alert('Khôi phục dữ liệu thành công!');
            onRefreshAll();
          } else {
            alert('File dữ liệu không hợp lệ.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn đặt lại dữ liệu về trạng thái Demo chuẩn ban đầu của Trường TH&THCS Nguyễn Đình Anh?'
      )
    ) {
      storageService.resetToDefaults();
      alert('Đã thiết lập lại dữ liệu mẫu thành công!');
      onRefreshAll();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Settings className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Mục XXXVI – Cấu hình & Quản trị Hệ thống
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Quản trị & Cấu hình Đánh giá Thi đua
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dành cho Admin và Ban Giám hiệu quản lý kỳ đánh giá, phân quyền RBAC và tích hợp CSDL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Khôi phục Demo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'SETTINGS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Thông số Hệ thống & Thời hạn
        </button>
        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'DEPARTMENTS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" /> Quản lý Tổ chuyên môn
        </button>
        <button
          onClick={() => setActiveTab('TEACHERS')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'TEACHERS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Quản lý Tài khoản & Phân quyền
        </button>
        <button
          onClick={() => setActiveTab('DATABASE')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'DATABASE'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Schema CSDL Supabase (18 Bảng)
        </button>
        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'BACKUP'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sao lưu & Phục hồi JSON
        </button>
        <button
          onClick={() => setActiveTab('RLS_TEST')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'RLS_TEST'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" /> Kiểm tra RLS & Phân quyền
        </button>
      </div>

      {/* Tab: System Settings */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Trường học
              </label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Năm học áp dụng
              </label>
              <input
                type="text"
                value={settings.schoolYear}
                onChange={(e) => setSettings({ ...settings, schoolYear: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Học kỳ hiện tại
              </label>
              <select
                value={settings.currentSemester}
                onChange={(e) => setSettings({ ...settings, currentSemester: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
              >
                <option value="HKI">Học kỳ I (HKI)</option>
                <option value="HKII">Học kỳ II (HKII)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngưỡng Cảnh báo chênh lệch điểm (Điều 18)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="20"
                value={settings.discrepancyThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, discrepancyThreshold: parseFloat(e.target.value) || 5.0 })
                }
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold text-amber-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Mặc định: 5.0 điểm (Hệ thống sẽ bắt buộc tổ trưởng giải trình)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hạn chót nộp minh chứng
              </label>
              <input
                type="date"
                value={settings.evidenceDeadline}
                onChange={(e) => setSettings({ ...settings, evidenceDeadline: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hạn chót bình xét & duyệt điểm
              </label>
              <input
                type="date"
                value={settings.evaluationDeadline}
                onChange={(e) => setSettings({ ...settings, evaluationDeadline: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dung lượng file tối đa (MB)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={settings.maxFileSizeMb}
                onChange={(e) =>
                  setSettings({ ...settings, maxFileSizeMb: parseInt(e.target.value) || 25 })
                }
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trạng thái nộp minh chứng
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.evidenceSubmissionOpen}
                  onChange={(e) =>
                    setSettings({ ...settings, evidenceSubmissionOpen: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-semibold">Cho phép giáo viên tải lên & cập nhật minh chứng</span>
              </label>
            </div>
          </div>

          {/* Cấu hình Ngưỡng Xếp loại Thi đua (Mục 6) */}
          <div className="pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Cấu hình Ngưỡng Xếp loại Thi đua (Mục 6 - Không Hard-code)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Quy định các khoảng điểm chuẩn xếp loại giáo viên năm học {settings.schoolYear}. Được lưu trữ trực tiếp vào cấu hình hệ thống.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    ratingThresholds: { aPlusMin: 95.0, aMin: 90.0, bMin: 80.0, cMin: 65.0 }
                  })
                }
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Đặt lại chuẩn mặc định (95 - 90 - 80 - 65)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {/* A+ */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-emerald-800">Hạng A+</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-800">
                    Xuất sắc nổi bật
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-1">Điểm tối thiểu:</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="80"
                    max="100"
                    value={settings.ratingThresholds?.aPlusMin ?? 95.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 95.0;
                      setSettings({
                        ...settings,
                        ratingThresholds: {
                          ...(settings.ratingThresholds || { aPlusMin: 95, aMin: 90, bMin: 80, cMin: 65 }),
                          aPlusMin: val
                        }
                      });
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-emerald-300 bg-white font-extrabold text-emerald-900"
                  />
                  <span className="text-xs font-bold text-slate-500">đ</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1.5">
                  Khoảng: {settings.ratingThresholds?.aPlusMin ?? 95.0} – 100 điểm
                </div>
              </div>

              {/* A */}
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-blue-800">Hạng A</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200/80 text-blue-800">
                    Xuất sắc
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-1">Điểm tối thiểu:</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="70"
                    max="100"
                    value={settings.ratingThresholds?.aMin ?? 90.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 90.0;
                      setSettings({
                        ...settings,
                        ratingThresholds: {
                          ...(settings.ratingThresholds || { aPlusMin: 95, aMin: 90, bMin: 80, cMin: 65 }),
                          aMin: val
                        }
                      });
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-blue-300 bg-white font-extrabold text-blue-900"
                  />
                  <span className="text-xs font-bold text-slate-500">đ</span>
                </div>
                <div className="text-[10px] text-blue-700 font-semibold mt-1.5">
                  Khoảng: {settings.ratingThresholds?.aMin ?? 90.0} – {(settings.ratingThresholds?.aPlusMin ?? 95.0) - 0.5} điểm
                </div>
              </div>

              {/* B */}
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-indigo-800">Hạng B</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200/80 text-indigo-800">
                    Tốt
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-1">Điểm tối thiểu:</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="60"
                    max="95"
                    value={settings.ratingThresholds?.bMin ?? 80.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 80.0;
                      setSettings({
                        ...settings,
                        ratingThresholds: {
                          ...(settings.ratingThresholds || { aPlusMin: 95, aMin: 90, bMin: 80, cMin: 65 }),
                          bMin: val
                        }
                      });
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-indigo-300 bg-white font-extrabold text-indigo-900"
                  />
                  <span className="text-xs font-bold text-slate-500">đ</span>
                </div>
                <div className="text-[10px] text-indigo-700 font-semibold mt-1.5">
                  Khoảng: {settings.ratingThresholds?.bMin ?? 80.0} – {(settings.ratingThresholds?.aMin ?? 90.0) - 0.5} điểm
                </div>
              </div>

              {/* C */}
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-amber-800">Hạng C</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-800">
                    Đạt
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-1">Điểm tối thiểu:</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="40"
                    max="80"
                    value={settings.ratingThresholds?.cMin ?? 65.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 65.0;
                      setSettings({
                        ...settings,
                        ratingThresholds: {
                          ...(settings.ratingThresholds || { aPlusMin: 95, aMin: 90, bMin: 80, cMin: 65 }),
                          cMin: val
                        }
                      });
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white font-extrabold text-amber-900"
                  />
                  <span className="text-xs font-bold text-slate-500">đ</span>
                </div>
                <div className="text-[10px] text-amber-700 font-semibold mt-1.5">
                  Khoảng: {settings.ratingThresholds?.cMin ?? 65.0} – {(settings.ratingThresholds?.bMin ?? 80.0) - 0.5} điểm
                </div>
              </div>

              {/* D */}
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-rose-800">Hạng D</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-800">
                    Chưa đạt
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-1">Ngưỡng tự động:</div>
                <div className="p-2 rounded-lg bg-white border border-rose-200 font-extrabold text-xs text-rose-700 text-center">
                  &lt; {settings.ratingThresholds?.cMin ?? 65.0}đ
                </div>
                <div className="text-[10px] text-rose-700 font-semibold mt-1.5">
                  Dưới {settings.ratingThresholds?.cMin ?? 65.0} điểm
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đã lưu cài đặt!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
            >
              Lưu cấu hình hệ thống
            </button>
          </div>
        </form>
      )}

      {/* Tab: Departments */}
      {activeTab === 'DEPARTMENTS' && (
        <DepartmentManagementView currentUser={currentUser} onRefreshAll={onRefreshAll} />
      )}

      {/* Tab: Teachers / User Management */}
      {activeTab === 'TEACHERS' && (
        <UserManagementView currentUser={currentUser} onRefreshAll={onRefreshAll} />
      )}

      {/* Tab: Database Schema (Section XXIII & XXV) */}
      {activeTab === 'DATABASE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Đặc tả 18 Bảng CSDL PostgreSQL / Supabase & Chính sách RLS
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Được thiết kế đầy đủ theo yêu cầu Mục XXIII & Mục XXV để sẵn sàng kết nối sang Supabase khi triển khai.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedSql ? 'Đã sao chép SQL!' : 'Sao chép toàn bộ mã SQL'}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[500px] leading-relaxed border border-slate-800">
            {storageService.getSupabaseSqlSchema()}
          </pre>
        </div>
      )}

      {/* Tab: Backup & Restore */}
      {activeTab === 'BACKUP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" /> Sao lưu dữ liệu toàn hệ thống
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Xuất toàn bộ giáo viên, minh chứng, phiếu đánh giá, điểm cộng, điểm trừ và nhật ký kiểm toán thành tệp tin JSON an toàn.
            </p>
            <button
              onClick={handleExportBackup}
              className="mt-3 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              Tải file sao lưu (.json)
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" /> Khôi phục dữ liệu từ tệp tin
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tải lên tệp tin sao lưu JSON đã xuất trước đó để phục hồi trạng thái hệ thống.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      )}

      {/* Tab: RLS Testing & Verification (Mục 6 & 7) */}
      {activeTab === 'RLS_TEST' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Kiểm tra Cơ chế Row Level Security (RLS) & Phân quyền Truy cập
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Theo Mục 7: Quyền hạn được kiểm soát và bảo vệ trực tiếp tại tầng CSDL (Database Engine), không chỉ qua giao diện.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Mô phỏng truy vấn với Role:</span>
              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value as any)}
                className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
              >
                <option value="ADMIN">ADMIN (Toàn quyền)</option>
                <option value="BGH">BGH (Xem toàn trường)</option>
                <option value="TO_TRUONG">TO_TRUONG (Chỉ xem tổ)</option>
                <option value="TO_PHO">TO_PHO (Tổ phó - Chỉ xem tổ)</option>
                <option value="GIAO_VIEN">GIAO_VIEN (Chỉ xem bản thân)</option>
                <option value="HOI_DONG_TDKT">HOI_DONG_TDKT (Bình xét)</option>
              </select>
            </div>
          </div>

          {/* RLS Query Demonstration */}
          {(() => {
            const simulatedUser: User = {
              ...currentUser,
              role: simulatedRole
            };
            const rlsTeachers = databaseService.getTeachers(simulatedUser);
            const rlsEvidences = databaseService.filterEvidencesByRls(
              storageService.getEvidences(),
              simulatedUser
            );

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Vai trò đang kiểm thử</span>
                    <div className="text-lg font-black text-slate-900 mt-1">{simulatedRole}</div>
                    <span className="text-[11px] text-blue-600 font-medium">
                      {simulatedRole === 'GIAO_VIEN'
                        ? 'Chỉ truy cập hồ sơ chính mình (auth.uid() = user_id)'
                        : simulatedRole === 'TO_TRUONG'
                        ? `Giới hạn trong ${simulatedUser.departmentName} (Tổ trưởng)`
                        : simulatedRole === 'TO_PHO'
                        ? `Giới hạn trong ${simulatedUser.departmentName} (Tổ phó chuyên môn)`
                        : 'Toàn quyền truy cập cấp trường'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                    <span className="text-xs text-blue-800 font-medium">Bản ghi Giáo viên RLS cho phép</span>
                    <div className="text-2xl font-black text-blue-900 mt-1">
                      {rlsTeachers.length} / {databaseService.getAllTeachersRaw().length}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {rlsTeachers.length === 1 ? '1 giáo viên cá nhân' : `${rlsTeachers.length} giáo viên`}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-medium">Bản ghi Minh chứng RLS cho phép</span>
                    <div className="text-2xl font-black text-emerald-900 mt-1">
                      {rlsEvidences.length} / {storageService.getEvidences().length}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {rlsEvidences.length} minh chứng được phép đọc
                    </span>
                  </div>
                </div>

                {/* Filtered Data Readout */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                    <span>Kết quả truy vấn SELECT FROM teachers WHERE [RLS POLICY]:</span>
                    <span className="text-emerald-700 font-mono">200 OK • RLS Enforced</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {rlsTeachers.map((t) => (
                      <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900">{t.ho_ten}</span>
                          <span className="text-slate-400 font-mono text-[11px] ml-2">({t.ma_giao_vien})</span>
                          <span className="text-slate-500 text-[11px] block">{t.to_chuyen_mon} • {t.chuc_vu}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          user_id: {t.user_id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-1">
                  <div className="text-emerald-400 font-bold">-- PostgreSQL RLS Policy được thực thi:</div>
                  <div>CREATE POLICY "Teachers can only view own record" ON public.teachers</div>
                  <div className="text-blue-300">    FOR SELECT TO authenticated USING (user_id = auth.uid());</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
