import React, { useState } from 'react';
import {
  ListFilter,
  Search,
  Plus,
  Edit2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Lock,
  ShieldCheck,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Info,
  X,
  FileCode2,
  Scale
} from 'lucide-react';
import { CriteriaModel, CriteriaGroupModel, User, normalizeRole } from '../types';
import { criteriaService } from '../services/criteriaService';
import { databaseService } from '../services/databaseService';

interface CriteriaManagementPageProps {
  currentUser: User;
  onNavigate?: (tab: string) => void;
}

export const CriteriaManagementPage: React.FC<CriteriaManagementPageProps> = ({
  currentUser,
  onNavigate
}) => {
  const normRole = normalizeRole(currentUser.role);
  const isAdmin = normRole === 'ADMIN';

  const [groups, setGroups] = useState<CriteriaGroupModel[]>(() => criteriaService.getGroups());
  const [criteriaList, setCriteriaList] = useState<CriteriaModel[]>(() => criteriaService.getAllCriteria());

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [viewingCriteria, setViewingCriteria] = useState<CriteriaModel | null>(null);
  const [editingCriteria, setEditingCriteria] = useState<CriteriaModel | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form states for Add / Edit
  const [formGroupId, setFormGroupId] = useState('group-1');
  const [formMaTieuChi, setFormMaTieuChi] = useState('');
  const [formTenTieuChi, setFormTenTieuChi] = useState('');
  const [formDiemToiDa, setFormDiemToiDa] = useState<number>(4);
  const [formMoTa, setFormMoTa] = useState('');
  const [formThuTu, setFormThuTu] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Score Verification (Mục 7)
  const scoreReport = criteriaService.verifyTotalScores();

  // Reload data
  const refreshData = () => {
    setGroups(criteriaService.getGroups());
    setCriteriaList(criteriaService.getAllCriteria());
  };

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Filtered List
  const filteredCriteria = criteriaList.filter((item) => {
    // Group filter
    if (selectedGroupFilter !== 'ALL' && item.group_id !== selectedGroupFilter) {
      return false;
    }
    // Status filter
    if (selectedStatusFilter === 'ACTIVE' && !item.is_active) return false;
    if (selectedStatusFilter === 'INACTIVE' && item.is_active) return false;

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchMa = item.ma_tieu_chi.toLowerCase().includes(q);
      const matchTen = item.ten_tieu_chi.toLowerCase().includes(q);
      const matchMoTa = item.mo_ta.toLowerCase().includes(q);
      return matchMa || matchTen || matchMoTa;
    }

    return true;
  });

  // Open Edit Modal
  const handleOpenEdit = (crit: CriteriaModel) => {
    if (!isAdmin) {
      alert('Chỉ tài khoản ADMIN mới có quyền sửa cấu trúc tiêu chí (Quy chế Mục 3 & RLS)!');
      return;
    }
    setEditingCriteria(crit);
    setFormGroupId(crit.group_id);
    setFormMaTieuChi(crit.ma_tieu_chi);
    setFormTenTieuChi(crit.ten_tieu_chi);
    setFormDiemToiDa(crit.diem_toi_da);
    setFormMoTa(crit.mo_ta);
    setFormThuTu(crit.thu_tu);
    setFormIsActive(crit.is_active);
    setFormError(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    if (!isAdmin) {
      alert('Chỉ tài khoản ADMIN mới có quyền thêm tiêu chí (Quy chế Mục 3 & RLS)!');
      return;
    }
    setFormGroupId(selectedGroupFilter !== 'ALL' ? selectedGroupFilter : 'group-1');
    setFormMaTieuChi('');
    setFormTenTieuChi('');
    setFormDiemToiDa(4);
    setFormMoTa('');
    setFormThuTu(filteredCriteria.length + 1);
    setFormIsActive(true);
    setFormError(null);
    setShowAddModal(true);
  };

  // Submit Add
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const res = criteriaService.createCriteria(
      {
        group_id: formGroupId,
        ma_tieu_chi: formMaTieuChi,
        ten_tieu_chi: formTenTieuChi,
        diem_toi_da: Number(formDiemToiDa) || 0,
        mo_ta: formMoTa,
        thu_tu: Number(formThuTu) || 1,
        is_active: formIsActive
      },
      currentUser
    );

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    refreshData();
    setShowAddModal(false);
    showNotification(`Đã thêm mới tiêu chí ${res.criteria?.ma_tieu_chi} thành công!`);
  };

  // Submit Edit
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCriteria) return;
    setFormError(null);

    const res = criteriaService.updateCriteria(
      editingCriteria.id,
      {
        group_id: formGroupId,
        ma_tieu_chi: formMaTieuChi,
        ten_tieu_chi: formTenTieuChi,
        diem_toi_da: Number(formDiemToiDa) || 0,
        mo_ta: formMoTa,
        thu_tu: Number(formThuTu) || 1,
        is_active: formIsActive
      },
      currentUser
    );

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    refreshData();
    setEditingCriteria(null);
    showNotification(`Đã cập nhật tiêu chí ${res.criteria?.ma_tieu_chi} thành công!`);
  };

  // Toggle Active
  const handleToggleActive = (crit: CriteriaModel) => {
    if (!isAdmin) {
      alert('Chỉ tài khoản ADMIN mới có quyền kích hoạt hoặc vô hiệu hóa tiêu chí!');
      return;
    }

    const res = criteriaService.toggleActive(crit.id, currentUser);
    if (res.success) {
      refreshData();
      showNotification(res.message);
    } else {
      alert(res.message);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (!isAdmin) {
      alert('Chỉ ADMIN mới được khôi phục tiêu chí!');
      return;
    }

    if (
      window.confirm(
        'Bạn có chắc chắn muốn khôi phục lại 6 nhóm và 23 tiêu chí chuẩn 100 điểm ban đầu của Trường TH&THCS Nguyễn Đình Anh?'
      )
    ) {
      const res = criteriaService.resetToDefaultCriteria(currentUser);
      if (res.success) {
        refreshData();
        showNotification(res.message);
      }
    }
  };

  // SQL Migration Text
  const sqlMigrationCode = `-- ==============================================================================
-- SUPABASE MIGRATION: QUẢN LÝ TIÊU CHÍ THI ĐUA (NĂM HỌC 2026–2027)
-- ==============================================================================
-- 1. BẢNG criteria_groups
CREATE TABLE IF NOT EXISTS public.criteria_groups (
    id VARCHAR(50) PRIMARY KEY,
    ten_nhom VARCHAR(255) NOT NULL,
    diem_toi_da NUMERIC(5, 2) NOT NULL,
    mo_ta TEXT,
    thu_tu INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG criteria
CREATE TABLE IF NOT EXISTS public.criteria (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) REFERENCES public.criteria_groups(id) ON DELETE CASCADE,
    ma_tieu_chi VARCHAR(20) UNIQUE NOT NULL,
    ten_tieu_chi VARCHAR(255) NOT NULL,
    diem_toi_da NUMERIC(5, 2) NOT NULL,
    mo_ta TEXT,
    thu_tu INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.criteria_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read criteria" ON public.criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin can modify criteria" ON public.criteria FOR ALL TO authenticated USING (public.get_current_user_role() = 'ADMIN');

-- 4. TỔNG ĐIỂM KIỂM TRA: 15 + 30 + 25 + 15 + 5 + 10 = 100 ĐIỂM
SELECT SUM(diem_toi_da) FROM public.criteria WHERE is_active = true;
`;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{actionSuccess}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Scale className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Quản trị → Tiêu chí thi đua
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Năm học 2026–2027
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Quản Lý Tiêu Chí Thi Đua Giáo Viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cơ cấu 6 nhóm chuẩn 100 điểm • Quy chế đánh giá & xếp loại thi đua nội bộ TH&THCS Nguyễn Đình Anh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <FileCode2 className="w-4 h-4 text-purple-600" /> Migration SQL
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                title="Khôi phục 23 tiêu chí gốc"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Khôi phục 100đ
              </button>

              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm tiêu chí mới
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Chế độ xem (Chỉ ADMIN được sửa cấu trúc)
            </div>
          )}
        </div>
      </div>

      {/* RBAC PERMISSION NOTIFICATION BANNER */}
      {isAdmin ? (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Bạn đang đăng nhập với quyền ADMIN:</strong> Toàn quyền thêm mới, chỉnh sửa, kích hoạt/vô hiệu hóa các tiêu chí thi đua.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-800 shrink-0">
            RLS: Full Access
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Chỉ ADMIN mới được sửa cấu trúc:</strong> Tài khoản của bạn ({normRole}) có quyền xem tra cứu bảng tiêu chí. Các thao tác thêm, sửa, kích hoạt được khóa bảo vệ bởi Row Level Security.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-800 shrink-0">
            RLS: Read-Only
          </span>
        </div>
      )}

      {/* SECTION 1: 6 NHÓM TIÊU CHÍ SUMMARY CARDS (15 + 30 + 25 + 15 + 5 + 10 = 100) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-blue-600" />
            Cơ Cấu 6 Nhóm Tiêu Chí (Tổng 100 Điểm Chuẩn)
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`font-extrabold px-2.5 py-0.5 rounded-full border text-[11px] ${
                scoreReport.isValid
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              Tổng điểm hiện tại: {scoreReport.totalActiveScore} / 100đ{' '}
              {scoreReport.isValid ? '✓ Đạt chuẩn' : '⚠ Cần điều chỉnh'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {scoreReport.groupBreakdown.map((gb, idx) => {
            const isSelected = selectedGroupFilter === gb.groupId;
            return (
              <button
                key={gb.groupId}
                onClick={() => setSelectedGroupFilter(isSelected ? 'ALL' : gb.groupId)}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Nhóm {idx + 1}
                  </span>
                  <span className="text-xs font-black text-blue-900 bg-blue-100/70 px-1.5 py-0.5 rounded">
                    {gb.groupMaxScore}đ
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-xs line-clamp-2 h-8">
                  {gb.groupName.replace(/^Nhóm \d – /, '')}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span>{gb.criteriaCount} tiêu chí</span>
                  <span
                    className={`font-semibold ${
                      gb.isMatch ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {gb.actualCriteriaSum}đ
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: FILTERS & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã (VD: 1.1, 2.3), tên tiêu chí, từ khóa..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold whitespace-nowrap">Lọc nhóm:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              <option value="ALL">Tất cả các nhóm (6 nhóm)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.ten_nhom} ({g.diem_toi_da}đ)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold whitespace-nowrap">Trạng thái:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              <option value="ALL">Tất cả ({criteriaList.length})</option>
              <option value="ACTIVE">
                Đang kích hoạt ({criteriaList.filter((c) => c.is_active).length})
              </option>
              <option value="INACTIVE">
                Vô hiệu hóa ({criteriaList.filter((c) => !c.is_active).length})
              </option>
            </select>
          </div>

          {(searchTerm || selectedGroupFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGroupFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* SECTION 3: CRITERIA TABLE (Mục 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Danh mục tiêu chí thi đua chi tiết ({filteredCriteria.length} tiêu chí)
            </h3>
            <p className="text-xs text-slate-500">
              {selectedGroupFilter === 'ALL'
                ? 'Hiển thị tất cả 6 nhóm tiêu chí'
                : `Đang lọc: ${groups.find((g) => g.id === selectedGroupFilter)?.ten_nhom}`}
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('evaluation')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              Chuyển tới Phiếu chấm thi đua →
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Mã</th>
                <th className="py-3 px-4 min-w-[260px]">Tên tiêu chí thi đua</th>
                <th className="py-3 px-4 min-w-[180px]">Nhóm tiêu chí</th>
                <th className="py-3 px-3 w-24 text-center">Điểm tối đa</th>
                <th className="py-3 px-4 min-w-[240px]">Mô tả quy định</th>
                <th className="py-3 px-3 w-28 text-center">Trạng thái</th>
                <th className="py-3 px-4 w-32 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCriteria.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                    Không tìm thấy tiêu chí nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCriteria.map((item) => {
                  const group = groups.find((g) => g.id === item.group_id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !item.is_active ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Mã */}
                      <td className="py-3 px-3 text-center font-extrabold text-blue-900 bg-slate-50/60">
                        {item.ma_tieu_chi}
                      </td>

                      {/* Tên */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.ten_tieu_chi}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ID: {item.id} • Thứ tự: {item.thu_tu}
                        </div>
                      </td>

                      {/* Nhóm */}
                      <td className="py-3 px-4">
                        <span className="inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 max-w-[200px] truncate">
                          {group ? group.ten_nhom.replace(/^Nhóm \d – /, '') : item.group_id}
                        </span>
                      </td>

                      {/* Điểm tối đa */}
                      <td className="py-3 px-3 text-center font-black text-sm text-blue-950">
                        {item.diem_toi_da}đ
                      </td>

                      {/* Mô tả */}
                      <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                        <span className="line-clamp-2" title={item.mo_ta}>
                          {item.mo_ta || '—'}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 text-center">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Đang áp dụng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                            <XCircle className="w-3 h-3" /> Vô hiệu hóa
                          </span>
                        )}
                      </td>

                      {/* Thao tác (Xem, Sửa, Kích hoạt/Vô hiệu hóa) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Xem */}
                          <button
                            onClick={() => setViewingCriteria(item)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Xem chi tiết tiêu chí"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Sửa (Chỉ ADMIN) */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            disabled={!isAdmin}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isAdmin
                                ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                                : 'border-slate-200 text-slate-300 cursor-not-allowed'
                            }`}
                            title={isAdmin ? 'Sửa tiêu chí' : 'Chỉ ADMIN mới được sửa'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Kích hoạt / Vô hiệu hóa (Chỉ ADMIN) */}
                          <button
                            onClick={() => handleToggleActive(item)}
                            disabled={!isAdmin}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              !isAdmin
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                : item.is_active
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={
                              !isAdmin
                                ? 'Chỉ ADMIN mới được bật/tắt'
                                : item.is_active
                                ? 'Bấm để vô hiệu hóa tiêu chí'
                                : 'Bấm để kích hoạt tiêu chí'
                            }
                          >
                            {item.is_active ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
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

      {/* ========================================================================= */}
      {/* MODAL: XEM CHI TIẾT TIÊU CHÍ */}
      {/* ========================================================================= */}
      {viewingCriteria && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Chi tiết tiêu chí thi đua
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Mã {viewingCriteria.ma_tieu_chi}: {viewingCriteria.ten_tieu_chi}
                </h3>
              </div>
              <button
                onClick={() => setViewingCriteria(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Thuộc nhóm:</span>
                  <span className="font-bold text-slate-800">
                    {groups.find((g) => g.id === viewingCriteria.group_id)?.ten_nhom || viewingCriteria.group_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Điểm tối đa:</span>
                  <span className="text-base font-extrabold text-blue-900">
                    {viewingCriteria.diem_toi_da} điểm
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Trạng thái:</span>
                  <span
                    className={`font-bold inline-flex items-center gap-1 ${
                      viewingCriteria.is_active ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {viewingCriteria.is_active ? '✓ Đang kích hoạt' : '✕ Đã vô hiệu hóa'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thứ tự hiển thị:</span>
                  <span className="font-bold text-slate-800">{viewingCriteria.thu_tu}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Mô tả và quy định đánh giá:</label>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-medium">
                  {viewingCriteria.mo_ta || 'Không có mô tả chi tiết.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <div>Ngày tạo: {viewingCriteria.created_at || '—'}</div>
                <div>Cập nhật: {viewingCriteria.updated_at || '—'}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              {isAdmin && (
                <button
                  onClick={() => {
                    const toEdit = viewingCriteria;
                    setViewingCriteria(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Sửa tiêu chí này
                </button>
              )}
              <button
                onClick={() => setViewingCriteria(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM MỚI TIÊU CHÍ (CHỈ ADMIN) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitAdd}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Quản trị viên • RLS Protected
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Thêm Tiêu Chí Thi Đua Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Thuộc Nhóm Tiêu Chí <span className="text-red-500">*</span>
                </label>
                <select
                  value={formGroupId}
                  onChange={(e) => setFormGroupId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.ten_nhom} (Tối đa nhóm: {g.diem_toi_da}đ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Mã tiêu chí <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 1.5, 6.4..."
                    value={formMaTieuChi}
                    onChange={(e) => setFormMaTieuChi(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Điểm tối đa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="30"
                    required
                    value={formDiemToiDa}
                    onChange={(e) => setFormDiemToiDa(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-extrabold text-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tên tiêu chí thi đua <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đổi mới sáng tạo trong sinh hoạt chuyên môn..."
                  value={formTenTieuChi}
                  onChange={(e) => setFormTenTieuChi(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mô tả & Hướng dẫn minh chứng
                </label>
                <textarea
                  rows={3}
                  value={formMoTa}
                  onChange={(e) => setFormMoTa(e.target.value)}
                  placeholder="Ghi rõ tiêu chuẩn đạt điểm, yêu cầu hồ sơ minh chứng..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Thứ tự hiển thị:</label>
                  <input
                    type="number"
                    min="1"
                    value={formThuTu}
                    onChange={(e) => setFormThuTu(parseInt(e.target.value) || 1)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Kích hoạt ngay</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Lưu Tiêu Chí
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SỬA TIÊU CHÍ (CHỈ ADMIN) */}
      {/* ========================================================================= */}
      {editingCriteria && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitEdit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Cập nhật tiêu chí • RLS Protected
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Chỉnh Sửa Tiêu Chí {editingCriteria.ma_tieu_chi}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCriteria(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Thuộc Nhóm Tiêu Chí <span className="text-red-500">*</span>
                </label>
                <select
                  value={formGroupId}
                  onChange={(e) => setFormGroupId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.ten_nhom} (Tối đa nhóm: {g.diem_toi_da}đ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Mã tiêu chí <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formMaTieuChi}
                    onChange={(e) => setFormMaTieuChi(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Điểm tối đa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="30"
                    required
                    value={formDiemToiDa}
                    onChange={(e) => setFormDiemToiDa(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-extrabold text-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tên tiêu chí thi đua <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTenTieuChi}
                  onChange={(e) => setFormTenTieuChi(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mô tả & Hướng dẫn minh chứng
                </label>
                <textarea
                  rows={3}
                  value={formMoTa}
                  onChange={(e) => setFormMoTa(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Thứ tự hiển thị:</label>
                  <input
                    type="number"
                    min="1"
                    value={formThuTu}
                    onChange={(e) => setFormThuTu(parseInt(e.target.value) || 1)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Kích hoạt áp dụng</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingCriteria(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Cập Nhật Tiêu Chí
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM MIGRATION SQL & ROW LEVEL SECURITY */}
      {/* ========================================================================= */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  PostgreSQL / Supabase Migration
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  SQL Schema & RLS Policies (criteria_groups & criteria)
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                {sqlMigrationCode}
              </pre>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlMigrationCode);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã sao chép!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Sao chép SQL
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500">
              <span>Tệp migration: <code>/src/db/criteria_migration.sql</code></span>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
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
