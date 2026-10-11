import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Edit3,
  Trash2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileSpreadsheet,
  UserCheck,
  LayoutGrid,
  List,
  ArrowRight,
  Shield,
  HelpCircle,
  Briefcase,
  Layers,
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Department, User, normalizeRole } from '../types';
import { storageService } from '../services/storageService';

interface DepartmentManagementViewProps {
  currentUser: User;
  onRefreshAll?: () => void;
}

export const DepartmentManagementView: React.FC<DepartmentManagementViewProps> = ({
  currentUser,
  onRefreshAll
}) => {
  const [departments, setDepartments] = useState<Department[]>(() => storageService.getDepartments());
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');

  // Deduplicate users to ensure no duplicate keys in modals or dropdowns
  const uniqueUsers = useMemo(() => {
    const seen = new Set<string>();
    return users.filter((u) => {
      if (!u || !u.id || seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [users]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [appointModalDept, setAppointModalDept] = useState<Department | null>(null);
  const [appointLeaderId, setAppointLeaderId] = useState<string>('');
  const [appointViceLeaderId, setAppointViceLeaderId] = useState<string>('');
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [viewingMembersDept, setViewingMembersDept] = useState<Department | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    leaderId: '',
    viceLeaderId: '',
    description: ''
  });

  // Alert
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const refreshData = () => {
    setDepartments(storageService.getDepartments());
    setUsers(storageService.getUsers());
    if (onRefreshAll) onRefreshAll();
  };

  const isAdmin = normalizeRole(currentUser.role) === 'ADMIN';

  // Stats
  const stats = useMemo(() => {
    const totalDepts = departments.length;
    const totalAssignedTeachers = users.filter((u) =>
      departments.some((d) => d.id === u.departmentId)
    ).length;
    const deptsWithLeader = departments.filter((d) => Boolean(d.leaderId && d.leaderId !== '')).length;
    const largestDept = [...departments].sort((a, b) => (b.teacherCount || 0) - (a.teacherCount || 0))[0];

    return {
      totalDepts,
      totalAssignedTeachers,
      deptsWithLeader,
      largestDeptName: largestDept?.name || '---',
      largestDeptCount: largestDept?.teacherCount || 0
    };
  }, [departments, users]);

  // Filtered
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.leaderName.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    });
  }, [departments, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      leaderId: '',
      viceLeaderId: '',
      description: ''
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      leaderId: dept.leaderId || '',
      viceLeaderId: dept.viceLeaderId || '',
      description: dept.description || ''
    });
  };

  // Open Appoint Modal (Phân quyền Tổ trưởng & Tổ phó)
  const handleOpenAppoint = (dept: Department) => {
    setAppointModalDept(dept);
    setAppointLeaderId(dept.leaderId || '');
    setAppointViceLeaderId(dept.viceLeaderId || '');
  };

  // Submit Appoint
  const handleAppointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointModalDept) return;

    const res = storageService.assignDepartmentLeadership(
      appointModalDept.id,
      appointLeaderId,
      appointViceLeaderId
    );

    if (res.success) {
      refreshData();
      setAppointModalDept(null);
      showAlert('success', res.message);
    } else {
      showAlert('error', res.message);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (dept: Department) => {
    setDeletingDept(dept);
    // Find first other department to recommend as transfer target
    const otherDept = departments.find((d) => d.id !== dept.id);
    setTransferTargetId(otherDept?.id || '');
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showAlert('error', 'Tên tổ chuyên môn và mã tổ là bắt buộc!');
      return;
    }

    const cleanName = formData.name.trim();
    const cleanCode = formData.code.trim().toUpperCase().replace(/\s+/g, '_');

    // Duplicate check
    const existName = departments.find((d) => d.name.toLowerCase() === cleanName.toLowerCase());
    if (existName) {
      showAlert('error', `Tên tổ "${cleanName}" đã tồn tại trong hệ thống!`);
      return;
    }

    const existCode = departments.find((d) => d.code.toUpperCase() === cleanCode);
    if (existCode) {
      showAlert('error', `Mã tổ "${cleanCode}" đã được sử dụng!`);
      return;
    }

    storageService.createDepartment({
      name: cleanName,
      code: cleanCode,
      leaderId: formData.leaderId,
      viceLeaderId: formData.viceLeaderId,
      description: formData.description.trim()
    });

    refreshData();
    setShowCreateModal(false);
    showAlert('success', `Đã thêm mới tổ chuyên môn "${cleanName}" thành công!`);
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    if (!formData.name.trim() || !formData.code.trim()) {
      showAlert('error', 'Tên tổ chuyên môn và mã tổ là bắt buộc!');
      return;
    }

    const cleanName = formData.name.trim();
    const cleanCode = formData.code.trim().toUpperCase().replace(/\s+/g, '_');

    // Duplicate check
    const existName = departments.find(
      (d) => d.name.toLowerCase() === cleanName.toLowerCase() && d.id !== editingDept.id
    );
    if (existName) {
      showAlert('error', `Tên tổ "${cleanName}" đã tồn tại!`);
      return;
    }

    const existCode = departments.find(
      (d) => d.code.toUpperCase() === cleanCode && d.id !== editingDept.id
    );
    if (existCode) {
      showAlert('error', `Mã tổ "${cleanCode}" đã thuộc về tổ khác!`);
      return;
    }

    storageService.updateDepartment(editingDept.id, {
      name: cleanName,
      code: cleanCode,
      leaderId: formData.leaderId,
      viceLeaderId: formData.viceLeaderId,
      description: formData.description.trim()
    });

    refreshData();
    setEditingDept(null);
    showAlert('success', `Đã cập nhật tổ chuyên môn "${cleanName}" thành công!`);
  };

  // Submit Delete
  const handleDeleteSubmit = () => {
    if (!deletingDept) return;

    const deptMembers = users.filter((u) => u.departmentId === deletingDept.id);
    if (deptMembers.length > 0 && !transferTargetId) {
      showAlert('error', 'Vui lòng chọn tổ chuyên môn mới để chuyển giáo viên sang trước khi xóa!');
      return;
    }

    const res = storageService.deleteDepartment(deletingDept.id, transferTargetId);
    if (res.success) {
      refreshData();
      showAlert('success', res.message);
    } else {
      showAlert('error', res.message);
    }
    setDeletingDept(null);
  };

  // Reset to 6 Defaults
  const handleResetToDefaults = () => {
    storageService.resetDepartmentsToDefaults();
    refreshData();
    setShowResetConfirm(false);
    showAlert('success', 'Đã khôi phục thành công danh sách 6 tổ chuyên môn mặc định chuẩn!');
  };

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = departments.map((d, idx) => ({
      STT: idx + 1,
      'Mã tổ': d.code,
      'Tên tổ chuyên môn': d.name,
      'Tổ trưởng': d.leaderName || 'Chưa chỉ định',
      'Số lượng giáo viên': d.teacherCount || 0,
      'Mô tả nhiệm vụ': d.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 32 },
      { wch: 24 },
      { wch: 20 },
      { wch: 45 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'To_Chuyen_Mon');
    XLSX.writeFile(wb, `DanhSach_ToChuyenMon_THCS_NguyenDinhAnh_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Get members of a department
  const getDeptMembers = (deptId: string): User[] => {
    return uniqueUsers.filter((u) => u.departmentId === deptId);
  };

  return (
    <div className="space-y-6">
      {/* Alert toast */}
      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-sm animate-in fade-in ${
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Building className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Cơ cấu Tổ chức Nhà trường
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              6 Tổ chuyên môn chuẩn
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Quản lý Tổ chuyên môn
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách các tổ chuyên môn, chỉ định tổ trưởng và theo dõi đội ngũ giáo viên trực thuộc Trường TH&THCS Nguyễn Đình Anh
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Xuất Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất Excel
          </button>

          {/* Khôi phục mặc định (chỉ Admin) */}
          {isAdmin && (
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Khôi phục danh sách 6 tổ chuyên môn chuẩn của nhà trường"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 cursor-pointer transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Khôi phục 6 tổ chuẩn
            </button>
          )}

          {/* Thêm mới (chỉ Admin) */}
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm tổ chuyên môn
            </button>
          )}
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Tổ chuyên môn</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalDepts}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tổ trong toàn trường</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase">Giáo viên đã phân bổ</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">{stats.totalAssignedTeachers}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Tổng số cán bộ giáo viên</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Đã có Tổ trưởng</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {stats.deptsWithLeader} <span className="text-xs font-semibold text-slate-400">/ {stats.totalDepts}</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            {stats.deptsWithLeader === stats.totalDepts ? '100% đã bổ nhiệm' : `Còn ${stats.totalDepts - stats.deptsWithLeader} tổ chưa có`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase">Tổ đông nhất</span>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base font-black text-purple-900 mt-1 truncate" title={stats.largestDeptName}>
            {stats.largestDeptName}
          </div>
          <div className="text-[10px] text-purple-600 mt-0.5">
            {stats.largestDeptCount} giáo viên trực thuộc
          </div>
        </div>
      </div>

      {/* Filter and View Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tổ, mã tổ, tổ trưởng..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Chế độ xem:</span>
          <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'GRID' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng lưới thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'TABLE' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng bảng"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DEPARTMENTS LISTING */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => {
            const members = getDeptMembers(dept.id);
            const hasLeader = Boolean(dept.leaderId && dept.leaderId !== '');

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-mono text-[11px] font-black tracking-wide">
                      {dept.code}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {members.length} GV
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-8">
                      {dept.description || 'Chưa có thông tin mô tả chi tiết nhiệm vụ của tổ.'}
                    </p>
                  </div>

                  {/* Leader & Vice-Leader info */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Tổ trưởng chuyên môn
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenAppoint(dept)}
                            title="Bổ nhiệm / Phân quyền Tổ trưởng cho tổ này"
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Shield className="w-2.5 h-2.5 text-blue-600" />
                            Phân quyền
                          </button>
                        )}
                      </div>
                      {hasLeader ? (
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {dept.leaderName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">{dept.leaderName}</div>
                            <div className="text-[10px] text-blue-600 font-semibold">Tổ trưởng (TO_TRUONG)</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-amber-50/60 p-2 rounded-xl border border-amber-200/60 text-amber-800 text-xs">
                          <div className="flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-medium text-[11px]">Chưa bổ nhiệm tổ trưởng</span>
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenAppoint(dept)}
                              className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                            >
                              Chỉ định ngay
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Tổ phó chuyên môn (Phân quyền TO_PHO)
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenAppoint(dept)}
                            title="Bổ nhiệm / Phân quyền Tổ phó cho tổ này"
                            className="text-[10px] font-bold text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Shield className="w-2.5 h-2.5 text-cyan-600" />
                            Phân quyền
                          </button>
                        )}
                      </div>
                      {dept.viceLeaderId && dept.viceLeaderName ? (
                        <div className="flex items-center gap-2 bg-cyan-50/70 p-2 rounded-xl border border-cyan-200/70">
                          <div className="w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {dept.viceLeaderName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-cyan-950 truncate">{dept.viceLeaderName}</div>
                            <div className="text-[10px] text-cyan-700 font-semibold">Tổ phó (TO_PHO)</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-500 text-xs">
                          <div className="flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-[11px]">Chưa bổ nhiệm tổ phó</span>
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenAppoint(dept)}
                              className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              Chỉ định ngay
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <button
                    onClick={() => setViewingMembersDept(dept)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Xem {members.length} thành viên
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenAppoint(dept)}
                        title="Bổ nhiệm & Phân quyền Ban cán sự (Tổ trưởng / Tổ phó)"
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer transition-all flex items-center gap-1 font-bold text-xs"
                      >
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>Phân quyền</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        title="Chỉnh sửa tổ"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleOpenDelete(dept)}
                        title="Xóa tổ chuyên môn"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4 w-28">Mã tổ</th>
                  <th className="py-3 px-4">Tên tổ chuyên môn</th>
                  <th className="py-3 px-4">Tổ trưởng</th>
                  <th className="py-3 px-4">Tổ phó</th>
                  <th className="py-3 px-4 text-center">Số giáo viên</th>
                  <th className="py-3 px-4">Mô tả nhiệm vụ</th>
                  <th className="py-3 px-4 text-right w-36">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept, idx) => {
                    const members = getDeptMembers(dept.id);
                    return (
                      <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{dept.code}</td>
                        <td className="py-3 px-4 font-black text-slate-900 text-sm">{dept.name}</td>
                        <td className="py-3 px-4">
                          {dept.leaderName && dept.leaderName !== 'Chưa chỉ định' ? (
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-black">
                                {dept.leaderName.charAt(0)}
                              </span>
                              {dept.leaderName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {dept.viceLeaderName ? (
                            <span className="font-bold text-cyan-800 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-[10px] flex items-center justify-center font-black">
                                {dept.viceLeaderName.charAt(0)}
                              </span>
                              {dept.viceLeaderName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setViewingMembersDept(dept)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold hover:bg-blue-100 cursor-pointer"
                          >
                            <Users className="w-3 h-3" /> {members.length} GV
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={dept.description}>
                          {dept.description || '---'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingMembersDept(dept)}
                              title="Xem danh sách giáo viên"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenAppoint(dept)}
                                title="Bổ nhiệm & Phân quyền Ban cán sự (Tổ trưởng / Tổ phó)"
                                className="px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Shield className="w-3 h-3 text-blue-600" />
                                <span>Phân quyền</span>
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenEdit(dept)}
                                title="Chỉnh sửa tổ"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenDelete(dept)}
                                title="Xóa tổ chuyên môn"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy tổ chuyên môn nào phù hợp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE DEPARTMENT */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Building className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Thêm mới Tổ chuyên môn</h3>
                  <p className="text-xs text-slate-500">Tạo mới cơ cấu tổ chức và chỉ định tổ trưởng</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên tổ chuyên môn <span className="text-rose-500">(*)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Auto suggest code if code is empty or matches previous auto
                    setFormData((prev) => ({
                      ...prev,
                      name: val,
                      code:
                        prev.code === '' || prev.code === prev.name.slice(0, 10).toUpperCase().replace(/\s+/g, '_')
                          ? val
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .replace(/đ/g, 'd')
                              .replace(/Đ/g, 'D')
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, '_')
                              .replace(/_+/g, '_')
                              .replace(/^_|_$/g, '')
                              .slice(0, 15)
                          : prev.code
                    }));
                  }}
                  placeholder="Ví dụ: Tổ khoa học tự nhiên"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã tổ (viết tắt) <span className="text-rose-500">(*)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="VD: KHTN, KHXH"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ trưởng chuyên môn:</label>
                  <select
                    value={formData.leaderId}
                    onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">-- Chưa chỉ định --</option>
                    {uniqueUsers.map((u, idx) => (
                      <option key={`create-leader-${u.id}-${idx}`} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">Phân quyền: TO_TRUONG</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ phó chuyên môn:</label>
                  <select
                    value={formData.viceLeaderId}
                    onChange={(e) => setFormData({ ...formData, viceLeaderId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">-- Chưa chỉ định --</option>
                    {uniqueUsers
                      .filter((u) => u.id !== formData.leaderId)
                      .map((u, idx) => (
                        <option key={`create-vice-${u.id}-${idx}`} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                  <span className="text-[10px] text-cyan-600 mt-0.5 block">Phân quyền: TO_PHO</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả chức năng & nhiệm vụ:</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Phụ trách giảng dạy các môn học thuộc tổ..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Tạo tổ chuyên môn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT DEPARTMENT */}
      {/* ------------------------------------------------------------- */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Edit3 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Chỉnh sửa Tổ chuyên môn</h3>
                  <p className="text-xs text-slate-500">Cập nhật thông tin, mã tổ và tổ trưởng</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên tổ chuyên môn <span className="text-rose-500">(*)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Lưu ý: Khi đổi tên tổ, hệ thống sẽ tự động cập nhật tên tổ cho toàn bộ giáo viên đang trực thuộc.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã tổ (viết tắt) <span className="text-rose-500">(*)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ trưởng chuyên môn:</label>
                  <select
                    value={formData.leaderId}
                    onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">-- Chưa chỉ định --</option>
                    <optgroup label={`Giáo viên trực thuộc ${editingDept.name}`}>
                      {uniqueUsers
                        .filter((u) => u.departmentId === editingDept.id)
                        .map((u, idx) => (
                          <option key={`edit-leader-${u.id}-${idx}`} value={u.id}>
                            {u.name} ({u.email}) - {u.position}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Giáo viên từ các tổ khác (sẽ chuyển sang tổ này)">
                      {uniqueUsers
                        .filter((u) => u.departmentId !== editingDept.id)
                        .map((u, idx) => (
                          <option key={`edit-other-leader-${u.id}-${idx}`} value={u.id}>
                            {u.name} ({u.email}) - Đang ở: {u.departmentName}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">Phân quyền: TO_TRUONG</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ phó chuyên môn:</label>
                  <select
                    value={formData.viceLeaderId}
                    onChange={(e) => setFormData({ ...formData, viceLeaderId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">-- Chưa chỉ định --</option>
                    <optgroup label={`Giáo viên trực thuộc ${editingDept.name}`}>
                      {uniqueUsers
                        .filter((u) => u.departmentId === editingDept.id && u.id !== formData.leaderId)
                        .map((u, idx) => (
                          <option key={`edit-vice-${u.id}-${idx}`} value={u.id}>
                            {u.name} ({u.email}) - {u.position}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Giáo viên từ các tổ khác (sẽ chuyển sang tổ này)">
                      {uniqueUsers
                        .filter((u) => u.departmentId !== editingDept.id && u.id !== formData.leaderId)
                        .map((u, idx) => (
                          <option key={`edit-other-vice-${u.id}-${idx}`} value={u.id}>
                            {u.name} ({u.email}) - Đang ở: {u.departmentName}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <span className="text-[10px] text-cyan-600 mt-0.5 block">Phân quyền: TO_PHO</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả chức năng & nhiệm vụ:</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: BỔ NHIỆM / PHÂN QUYỀN TỔ TRƯỞNG & TỔ PHÓ */}
      {/* ------------------------------------------------------------- */}
      {appointModalDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Phân quyền Ban cán sự: {appointModalDept.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bổ nhiệm Tổ trưởng (TO_TRUONG) & Tổ phó (TO_PHO) phụ trách tổ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAppointModalDept(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAppointSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Tổ chuyên môn: {appointModalDept.name}</span>
                  <span className="font-mono px-2 py-0.5 rounded bg-blue-200/80 text-blue-800 text-[11px]">
                    Mã: {appointModalDept.code}
                  </span>
                </div>
                <p className="text-[11px] text-blue-700">
                  Hệ thống tự động kích hoạt thẩm quyền chấm điểm, duyệt minh chứng cấp tổ và đồng bộ vai trò RBAC ngay khi lưu.
                </p>
              </div>

              {/* Tổ trưởng chuyên môn */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  1. Tổ trưởng chuyên môn <span className="text-blue-700 font-semibold">(Phân quyền: TO_TRUONG)</span>:
                </label>
                <select
                  value={appointLeaderId}
                  onChange={(e) => setAppointLeaderId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  <option value="">-- Chưa chỉ định tổ trưởng --</option>
                  <optgroup label={`Giáo viên trực thuộc ${appointModalDept.name}`}>
                    {uniqueUsers
                      .filter((u) => u.departmentId === appointModalDept.id)
                      .map((u, idx) => (
                        <option key={`appoint-leader-${u.id}-${idx}`} value={u.id}>
                          {u.name} ({u.email}) - {u.position}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Giáo viên từ các tổ khác (sẽ chuyển trực thuộc tổ này)">
                    {uniqueUsers
                      .filter((u) => u.departmentId !== appointModalDept.id)
                      .map((u, idx) => (
                        <option key={`appoint-other-leader-${u.id}-${idx}`} value={u.id}>
                          {u.name} ({u.email}) - Đang ở: {u.departmentName}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Khi bổ nhiệm, giáo viên nhận quyền <strong>TO_TRUONG</strong> để duyệt minh chứng, chấm điểm và quản lý hồ sơ tổ {appointModalDept.name}.
                </span>
              </div>

              {/* Tổ phó chuyên môn */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Tổ phó chuyên môn <span className="text-cyan-700 font-semibold">(Phân quyền: TO_PHO)</span>:
                </label>
                <select
                  value={appointViceLeaderId}
                  onChange={(e) => setAppointViceLeaderId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                >
                  <option value="">-- Chưa chỉ định tổ phó --</option>
                  <optgroup label={`Giáo viên trực thuộc ${appointModalDept.name}`}>
                    {uniqueUsers
                      .filter((u) => u.departmentId === appointModalDept.id && u.id !== appointLeaderId)
                      .map((u, idx) => (
                        <option key={`appoint-vice-${u.id}-${idx}`} value={u.id}>
                          {u.name} ({u.email}) - {u.position}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Giáo viên từ các tổ khác (sẽ chuyển trực thuộc tổ này)">
                    {uniqueUsers
                      .filter((u) => u.departmentId !== appointModalDept.id && u.id !== appointLeaderId)
                      .map((u, idx) => (
                        <option key={`appoint-other-vice-${u.id}-${idx}`} value={u.id}>
                          {u.name} ({u.email}) - Đang ở: {u.departmentName}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Tổ phó nhận quyền <strong>TO_PHO</strong> để hỗ trợ quản trị và rà soát hồ sơ thành viên trong tổ.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAppointModalDept(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận phân quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE DEPARTMENT WITH SAFE TRANSFER */}
      {/* ------------------------------------------------------------- */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <span className="p-2 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Xác nhận xóa Tổ chuyên môn</h3>
                <p className="text-xs text-rose-600 font-medium">Hành động này sẽ xóa vĩnh viễn cấu trúc tổ</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                Tên tổ: <strong className="text-slate-900">{deletingDept.name}</strong>
              </div>
              <div>
                Mã tổ: <strong className="text-slate-900 font-mono">{deletingDept.code}</strong>
              </div>
              <div>
                Tổ trưởng: <strong>{deletingDept.leaderName}</strong>
              </div>
              <div>
                Số giáo viên hiện tại: <strong className="text-blue-700">{getDeptMembers(deletingDept.id).length} giáo viên</strong>
              </div>
            </div>

            {getDeptMembers(deletingDept.id).length > 0 ? (
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700">
                  Chuyển {getDeptMembers(deletingDept.id).length} giáo viên sang tổ chuyên môn mới:
                </label>
                <select
                  required
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                >
                  <option value="">-- Chọn tổ chuyên môn đích --</option>
                  {departments
                    .filter((d) => d.id !== deletingDept.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                  Hệ thống sẽ an toàn chuyển toàn bộ hồ sơ giáo viên của tổ này sang tổ đích trước khi xóa để đảm bảo không mất mát dữ liệu thi đua!
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Tổ chuyên môn này hiện không có giáo viên nào trực thuộc. Bạn có thể yên tâm xóa!
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VIEW MEMBERS */}
      {/* ------------------------------------------------------------- */}
      {viewingMembersDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Danh sách Giáo viên: {viewingMembersDept.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mã tổ: <span className="font-mono font-bold text-blue-700">{viewingMembersDept.code}</span> •{' '}
                    Tổ trưởng: <strong className="text-slate-800">{viewingMembersDept.leaderName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingMembersDept(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Email công vụ</th>
                      <th className="py-2.5 px-3">Chức vụ & Môn dạy</th>
                      <th className="py-2.5 px-3 text-center">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {getDeptMembers(viewingMembersDept.id).length > 0 ? (
                      getDeptMembers(viewingMembersDept.id).map((member, idx) => (
                        <tr key={`dept-member-${member.id}-${idx}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {member.name}
                            {member.id === viewingMembersDept.leaderId && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                                Tổ trưởng
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{member.email}</td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {member.position} • {member.subjects?.join(', ') || 'Chuyên môn'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {member.role}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                          Chưa có cán bộ giáo viên nào được phân bổ vào tổ chuyên môn này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div>
                Tổng số thành viên: <strong>{getDeptMembers(viewingMembersDept.id).length} cán bộ giáo viên</strong>
              </div>
              <button
                onClick={() => setViewingMembersDept(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: RESET CONFIRMATION */}
      {/* ------------------------------------------------------------- */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <span className="p-2 rounded-full bg-amber-100">
                <RotateCcw className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Khôi phục 6 Tổ chuyên môn chuẩn?</h3>
                <p className="text-xs text-amber-700 font-medium">Thiết lập lại danh mục tổ chuẩn theo yêu cầu</p>
              </div>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <p className="font-bold">Hệ thống sẽ thiết lập lại 6 tổ chuyên môn gồm:</p>
              <ol className="list-decimal pl-4 space-y-0.5 font-medium">
                <li>Tổ khoa học tự nhiên</li>
                <li>Tổ khoa học xã hội</li>
                <li>Tổ Tiếng Anh - Giáo dục thể chất</li>
                <li>Tổ 1-2-3</li>
                <li>Tổ 4-5</li>
                <li>Tổ văn phòng</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
