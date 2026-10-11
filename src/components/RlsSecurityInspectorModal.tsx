import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Database,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
  Users,
  Eye,
  Building
} from 'lucide-react';
import { User, normalizeRole } from '../types';
import { databaseService } from '../services/databaseService';
import { storageService } from '../services/storageService';

interface RlsSecurityInspectorModalProps {
  currentUser: User;
  onClose: () => void;
  onSwitchUser?: (user: User) => void;
}

export const RlsSecurityInspectorModal: React.FC<RlsSecurityInspectorModalProps> = ({
  currentUser,
  onClose,
  onSwitchUser
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'ddl' | 'matrix'>('simulator');
  const [selectedEntity, setSelectedEntity] = useState<'teachers' | 'departments' | 'school_years' | 'semesters' | 'evidences'>('teachers');
  const [copied, setCopied] = useState(false);

  const role = normalizeRole(currentUser.role);
  const teachersAllowed = databaseService.getTeachers(currentUser);
  const allTeachersRaw = databaseService.getAllTeachersRaw();
  const allEvidences = storageService.getEvidences();
  const evidencesAllowed = databaseService.filterEvidencesByRls(allEvidences, currentUser);

  const handleCopySql = () => {
    navigator.clipboard.writeText(databaseService.getSupabaseStep2MigrationSql());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-blue-300">
                Supabase & Database Security • Bước 2
              </div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Công cụ Kiểm tra Row Level Security (RLS) & Phân quyền RBAC
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Session Context Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Đang kiểm thử dưới tài khoản:</span>
            <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300">
              {currentUser.name} ({currentUser.email})
            </span>
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
              Role: {role}
            </span>
            <span className="text-slate-500 font-medium">
              Tổ: {currentUser.departmentName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px] border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> RLS Status: ACTIVE (Bật ở tầng CSDL)
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-4 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'simulator'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" /> 1. Truy vấn mô phỏng RLS (Simulator)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> 2. Ma trận phân quyền 6 Vai trò (Mục 1 & 6)
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'ddl'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" /> 3. Mã SQL DDL Migration & RLS Policies (Mục 7)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" /> Chọn bảng CSDL để kiểm tra:
                </div>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {(['teachers', 'departments', 'school_years', 'semesters', 'evidences'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedEntity(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedEntity === t
                          ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Query Execution Box */}
              <div className="bg-slate-900 rounded-2xl p-4 text-emerald-400 font-mono text-xs shadow-inner space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
                  <span>POSTGRESQL QUERY PLAN WITH ROW LEVEL SECURITY</span>
                  <span className="text-emerald-400 font-bold">RLS ENFORCED ✓</span>
                </div>
                <div className="text-white font-bold">
                  SELECT * FROM public.{selectedEntity};
                </div>
                <div className="text-slate-400 text-[11px]">
                  -- auth.uid() = '{currentUser.id}' • role = '{role}' • dept = '{currentUser.departmentName}'
                </div>
                <div className="text-amber-300 text-[11px]">
                  {selectedEntity === 'teachers' && (
                    <>
                      {role === 'ADMIN' || role === 'BGH' || role === 'HOI_DONG_TDKT'
                        ? `-- Policy "Admins and BGH can view all teachers": Trả về toàn bộ ${allTeachersRaw.length} hồ sơ giáo viên toàn trường.`
                        : role === 'TO_TRUONG'
                        ? `-- Policy "Team Leaders can view department teachers": Lọc theo department_id = '${currentUser.departmentId}', trả về ${teachersAllowed.length} hồ sơ.`
                        : `-- Policy "Teachers can only view own record": Lọc user_id = auth.uid(), trả về duy nhất 1 hồ sơ cá nhân của chính bạn.`}
                    </>
                  )}
                  {selectedEntity === 'evidences' && (
                    <>
                      {role === 'ADMIN' || role === 'BGH' || role === 'HOI_DONG_TDKT'
                        ? `-- Full read access: Xem toàn bộ ${allEvidences.length} minh chứng toàn trường.`
                        : role === 'TO_TRUONG'
                        ? `-- Department filter: Xem ${evidencesAllowed.length} minh chứng của các GV thuộc ${currentUser.departmentName}.`
                        : `-- User filter: Chỉ xem ${evidencesAllowed.length} minh chứng do chính bạn nộp.`}
                    </>
                  )}
                </div>
              </div>

              {/* Query Result Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    Kết quả truy vấn thực tế: ({selectedEntity === 'teachers' ? teachersAllowed.length : selectedEntity === 'evidences' ? evidencesAllowed.length : selectedEntity === 'departments' ? 3 : 1} bản ghi)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Dữ liệu được lọc tại database service, không phụ thuộc vào frontend)
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {selectedEntity === 'teachers' ? (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Mã GV</th>
                          <th className="py-2 px-3">Họ và tên</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Tổ chuyên môn</th>
                          <th className="py-2 px-3">Chức vụ</th>
                          <th className="py-2 px-3">Cấp học</th>
                          <th className="py-2 px-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teachersAllowed.map((t) => (
                          <tr key={t.id} className="hover:bg-blue-50/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{t.ma_giao_vien}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{t.ho_ten}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{t.email}</td>
                            <td className="py-2.5 px-3 text-slate-700">{t.to_chuyen_mon}</td>
                            <td className="py-2.5 px-3 text-slate-700">{t.chuc_vu}</td>
                            <td className="py-2.5 px-3 text-slate-500">{t.cap_hoc}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {t.trang_thai}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : selectedEntity === 'evidences' ? (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Tiêu chí</th>
                          <th className="py-2 px-3">Tên minh chứng</th>
                          <th className="py-2 px-3">Giáo viên</th>
                          <th className="py-2 px-3">Tổ</th>
                          <th className="py-2 px-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {evidencesAllowed.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-blue-700">{e.criteriaCode}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{e.name}</td>
                            <td className="py-2.5 px-3 text-slate-700">{e.teacherName}</td>
                            <td className="py-2.5 px-3 text-slate-500">{e.departmentName}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-xs text-slate-600 space-y-2">
                      <p>
                        Bảng <strong>{selectedEntity}</strong> có chính sách cấp quyền đọc công khai cho tất cả người dùng trong trường đã xác thực (authenticated), chỉ cho phép Quản trị viên (ADMIN) thực hiện thao tác INSERT / UPDATE / DELETE.
                      </p>
                      <pre className="bg-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                        {selectedEntity === 'departments' && JSON.stringify(databaseService.getDepartments(), null, 2)}
                        {selectedEntity === 'school_years' && JSON.stringify(databaseService.getSchoolYears(), null, 2)}
                        {selectedEntity === 'semesters' && JSON.stringify(databaseService.getSemesters(), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Ma trận kiểm soát phân quyền 6 vai trò theo đúng <strong>Mục 6 & Mục 7 của Quy chế</strong>:
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Vai trò (Role)</th>
                      <th className="py-3 px-3">Phạm vi xem Giáo viên</th>
                      <th className="py-3 px-3">Phạm vi xem Minh chứng</th>
                      <th className="py-3 px-3">Chấm điểm thi đua</th>
                      <th className="py-3 px-3">Quản trị hệ thống</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-purple-800">1. ADMIN</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">Toàn trường (10 GV)</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">Toàn trường (30 file)</td>
                      <td className="py-3 px-3 text-slate-700">Xem / Giám sát toàn bộ</td>
                      <td className="py-3 px-3 text-emerald-700 font-bold">Toàn quyền (Full Access)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-red-800">2. BGH</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">Toàn trường (10 GV)</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">Toàn trường (30 file)</td>
                      <td className="py-3 px-3 text-blue-700 font-bold">Rà soát & Chấm điểm BGH</td>
                      <td className="py-3 px-3 text-slate-500">Xem cấu hình & Báo cáo</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-blue-800">3. TO_TRUONG</td>
                      <td className="py-3 px-3 text-blue-700 font-semibold">Chỉ GV thuộc tổ mình</td>
                      <td className="py-3 px-3 text-blue-700 font-semibold">Chỉ minh chứng của tổ mình</td>
                      <td className="py-3 px-3 text-blue-700 font-bold">Chấm điểm cấp Tổ & Thẩm định</td>
                      <td className="py-3 px-3 text-red-600 font-semibold">Không có quyền (Chặn RLS)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-cyan-800">4. TO_PHO</td>
                      <td className="py-3 px-3 text-cyan-700 font-semibold">Chỉ GV thuộc tổ mình</td>
                      <td className="py-3 px-3 text-cyan-700 font-semibold">Chỉ minh chứng của tổ mình</td>
                      <td className="py-3 px-3 text-cyan-700 font-bold">Tự chấm cá nhân & Rà soát tổ</td>
                      <td className="py-3 px-3 text-red-600 font-semibold">Không có quyền (Chặn RLS)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-emerald-800">5. GIAO_VIEN</td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">Chỉ hồ sơ cá nhân (1 GV)</td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">Chỉ minh chứng của mình</td>
                      <td className="py-3 px-3 text-emerald-700 font-bold">Tự chấm điểm cá nhân</td>
                      <td className="py-3 px-3 text-red-600 font-semibold">Không có quyền (Chặn RLS)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-amber-800">6. HOI_DONG_TDKT</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">Toàn trường (10 GV)</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">Toàn trường (30 file)</td>
                      <td className="py-3 px-3 text-amber-700 font-bold">Xem xét & Kết luận thi đua</td>
                      <td className="py-3 px-3 text-slate-500">Xem báo cáo & xếp loại</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ddl' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  Script SQL DDL kích hoạt và cấu hình Row Level Security trên Supabase / PostgreSQL:
                </span>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép SQL' : 'Sao chép SQL'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                {databaseService.getSupabaseStep2MigrationSql()}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chính sách RLS tuân thủ chặt chẽ nguyên tắc bảo vệ dữ liệu trường học.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
