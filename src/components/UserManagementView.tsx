import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Building,
  School,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
  Info,
  Upload,
  Download,
  FileUp,
  X,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, Role, Department, normalizeRole } from '../types';
import { storageService } from '../services/storageService';

interface UserManagementViewProps {
  currentUser: User;
  onRefreshAll?: () => void;
}

export const ROLE_DETAILS: Record<
  'ADMIN' | 'BGH' | 'TO_TRUONG' | 'TO_PHO' | 'GIAO_VIEN' | 'HOI_DONG_TDKT',
  {
    label: string;
    description: string;
    scope: string;
    badgeClass: string;
    permissions: string[];
  }
> = {
  ADMIN: {
    label: 'Quản trị viên (Admin)',
    description: 'Toàn quyền cấu hình hệ thống, quản lý tài khoản, phân quyền, tiêu chí và sao lưu dữ liệu.',
    scope: 'Toàn hệ thống',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: [
      'Tạo, sửa, khóa, xóa và phân quyền người dùng',
      'Cấu hình tiêu chí thi đua 100 điểm & quy chế',
      'Sao lưu & phục hồi CSDL toàn trường',
      'Kiểm tra chính sách RLS & nhật ký kiểm toán'
    ]
  },
  BGH: {
    label: 'Ban Giám hiệu (Hiệu trưởng / Phó HT)',
    description: 'Thẩm định, rà soát kết quả thi đua toàn trường, phê duyệt điểm thưởng/phạt và ký duyệt báo cáo.',
    scope: 'Toàn trường',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    permissions: [
      'Xem và thẩm định hồ sơ thi đua toàn trường',
      'Rà soát kết quả chấm điểm của các tổ chuyên môn',
      'Phê duyệt điểm cộng thành tích & điểm trừ vi phạm',
      'Xem và xuất tất cả báo cáo, Phụ lục 06'
    ]
  },
  TO_TRUONG: {
    label: 'Tổ trưởng chuyên môn',
    description: 'Quản lý, theo dõi tiến độ, thẩm định minh chứng cấp tổ và chấm điểm thi đua cho giáo viên trong tổ.',
    scope: 'Tổ chuyên môn',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: [
      'Xem hồ sơ thi đua của giáo viên trong tổ',
      'Thẩm định, duyệt hoặc yêu cầu bổ sung minh chứng cấp tổ',
      'Chấm điểm tổ và lập biên bản điều chỉnh điểm chênh lệch',
      'Xem và in báo cáo thi đua của tổ'
    ]
  },
  TO_PHO: {
    label: 'Tổ phó chuyên môn',
    description: 'Hỗ trợ Tổ trưởng quản lý chuyên môn, theo dõi tiến độ nộp hồ sơ và hỗ trợ rà soát minh chứng cấp tổ.',
    scope: 'Tổ chuyên môn',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    permissions: [
      'Xem hồ sơ thi đua của giáo viên trong tổ chuyên môn',
      'Hỗ trợ rà soát và kiểm tra tính hợp lệ minh chứng tổ',
      'Tự chấm điểm 23 tiêu chí cá nhân & nộp minh chứng điện tử',
      'Xem và in bảng điểm, báo cáo thi đua của tổ'
    ]
  },
  GIAO_VIEN: {
    label: 'Giáo viên',
    description: 'Tự đánh giá theo 23 tiêu chí, nộp hồ sơ minh chứng điện tử, theo dõi tiến độ và gửi giải trình.',
    scope: 'Cá nhân',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    permissions: [
      'Tự chấm điểm 23 tiêu chí chuẩn (100 điểm)',
      'Tải lên, quản lý các phiên bản minh chứng điện tử',
      'Gửi giải trình & bổ sung minh chứng khi có yêu cầu',
      'Xem và in phiếu đánh giá cá nhân (Phụ lục 01)'
    ]
  },
  HOI_DONG_TDKT: {
    label: 'Hội đồng Thi đua - Khen thưởng (HĐ TĐKT)',
    description: 'Tham gia bình xét, xem bảng tổng hợp điểm thi đua và kết luận mức xếp loại toàn trường.',
    scope: 'Cấp Hội đồng',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    permissions: [
      'Xem bảng tổng hợp điểm thi đua toàn trường (Phụ lục 06)',
      'Tham gia họp bình xét và kết luận mức xếp loại',
      'Xem xét giải trình và khiếu nại thi đua',
      'Ký duyệt biên bản thi đua'
    ]
  }
};

export interface ExcelParsedRow {
  rowIdx: number;
  name: string;
  email: string;
  teacherId?: string;
  role: Role;
  roleLabel: string;
  departmentId: string;
  departmentName: string;
  position: string;
  subjects: string[];
  educationLevel: 'TH' | 'THCS' | 'LIEN_CAP';
  phone?: string;
  password?: string;
  status: 'ACTIVE' | 'LOCKED';
  validationStatus: 'VALID' | 'EXISTING' | 'INVALID';
  validationMessage?: string;
}

function parseRoleFromExcel(val: any): { role: Role; label: string } {
  const str = String(val || '').trim().toUpperCase();
  if (str === 'ADMIN' || str.includes('QUẢN TRỊ') || str.includes('QUANTRI')) {
    return { role: 'ADMIN', label: 'Quản trị viên (Admin)' };
  }
  if (
    str === 'BGH' ||
    str === 'PRINCIPAL' ||
    str.includes('BAN GIÁM HIỆU') ||
    str.includes('HIỆU TRƯỞNG') ||
    str.includes('PHÓ HIỆU TRƯỞNG')
  ) {
    return { role: 'BGH', label: 'Ban Giám hiệu (BGH)' };
  }
  if (
    str === 'TO_TRUONG' ||
    str === 'TEAM_LEADER' ||
    str.includes('TỔ TRƯỞNG') ||
    str.includes('TOTRUONG') ||
    str.includes('TTCM')
  ) {
    return { role: 'TO_TRUONG', label: 'Tổ trưởng chuyên môn' };
  }
  if (
    str === 'TO_PHO' ||
    str === 'VICE_TEAM_LEADER' ||
    str.includes('TỔ PHÓ') ||
    str.includes('TOPHO') ||
    str.includes('TPCM')
  ) {
    return { role: 'TO_PHO', label: 'Tổ phó chuyên môn' };
  }
  if (
    str === 'HOI_DONG_TDKT' ||
    str === 'COUNCIL' ||
    str.includes('HỘI ĐỒNG') ||
    str.includes('HOIDONG') ||
    str.includes('TĐKT')
  ) {
    return { role: 'HOI_DONG_TDKT', label: 'Hội đồng TĐKT' };
  }
  return { role: 'GIAO_VIEN', label: 'Giáo viên' };
}

function matchDepartment(val: any, departments: Department[]): Department {
  const str = String(val || '').trim().toLowerCase();
  if (!str) return departments[0];
  const found = departments.find(
    (d) =>
      d.name.toLowerCase().includes(str) ||
      str.includes(d.name.toLowerCase()) ||
      d.id.toLowerCase() === str ||
      d.code.toLowerCase() === str
  );
  return found || departments[0];
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onRefreshAll
}) => {
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const departments = useMemo(() => storageService.getDepartments(), []);

  // File input ref for Excel upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Excel Batch Import State
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelParsedRows, setExcelParsedRows] = useState<ExcelParsedRow[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [updateExistingInDb, setUpdateExistingInDb] = useState(true);
  const [excelFilterStatus, setExcelFilterStatus] = useState<'ALL' | 'VALID' | 'EXISTING' | 'INVALID'>('ALL');

  // Form states for create/edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    teacherId: '',
    role: 'GIAO_VIEN' as Role,
    departmentId: 'dept-1',
    position: 'Giáo viên bộ môn',
    subjects: 'Toán học',
    educationLevel: 'THCS' as 'TH' | 'THCS' | 'LIEN_CAP',
    phone: '',
    password: '',
    status: 'ACTIVE' as 'ACTIVE' | 'LOCKED'
  });

  // Reset password form state
  const [newPassword, setNewPassword] = useState('123456');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Selected role for Role Modal
  const [selectedNewRole, setSelectedNewRole] = useState<Role>('GIAO_VIEN');

  // Sub-tab view: LIST vs RBAC_MATRIX
  const [activeViewMode, setActiveViewMode] = useState<'LIST' | 'RBAC_MATRIX'>('LIST');

  // Quick Assign Leader State
  const [showQuickAssignLeaderModal, setShowQuickAssignLeaderModal] = useState(false);
  const [selectedDeptForLeader, setSelectedDeptForLeader] = useState('dept-5');
  const [selectedTeacherForLeader, setSelectedTeacherForLeader] = useState('');

  // Quick Assign Vice Leader State
  const [showQuickAssignViceModal, setShowQuickAssignViceModal] = useState(false);
  const [selectedTeacherForVice, setSelectedTeacherForVice] = useState('');

  // Success / Alert message
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const refreshList = () => {
    setUsers(storageService.getUsers());
    if (onRefreshAll) onRefreshAll();
  };

  // Role normalization helper
  const getNormRole = (role: Role) => normalizeRole(role);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const matched = users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.teacherId && u.teacherId.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        u.position.toLowerCase().includes(q);

      const norm = getNormRole(u.role);
      const matchRole = selectedRoleFilter === 'ALL' || norm === selectedRoleFilter;
      const matchDept = selectedDeptFilter === 'ALL' || u.departmentId === selectedDeptFilter;
      const userStatus = u.status || 'ACTIVE';
      const matchStatus = selectedStatusFilter === 'ALL' || userStatus === selectedStatusFilter;

      return matchSearch && matchRole && matchDept && matchStatus;
    });

    // Safeguard deduplication by ID to prevent non-unique key warnings
    const seen = new Set<string>();
    return matched.filter((u) => {
      if (!u || !u.id || seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedDeptFilter, selectedStatusFilter]);

  // Stat metrics
  const stats = useMemo(() => {
    const total = users.length;
    let admin = 0;
    let bgh = 0;
    let totruong = 0;
    let topho = 0;
    let giaovien = 0;
    let hoidong = 0;
    let active = 0;
    let locked = 0;

    users.forEach((u) => {
      const r = getNormRole(u.role);
      if (r === 'ADMIN') admin++;
      else if (r === 'BGH') bgh++;
      else if (r === 'TO_TRUONG') totruong++;
      else if (r === 'TO_PHO') topho++;
      else if (r === 'GIAO_VIEN') giaovien++;
      else if (r === 'HOI_DONG_TDKT') hoidong++;

      if (u.status === 'LOCKED') locked++;
      else active++;
    });

    return { total, admin, bgh, totruong, topho, giaovien, hoidong, active, locked };
  }, [users]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextIndex = users.length + 1;
    setFormData({
      name: '',
      email: '',
      teacherId: `GV-${String(nextIndex).padStart(3, '0')}`,
      role: 'GIAO_VIEN',
      departmentId: departments[0]?.id || 'dept-1',
      position: 'Giáo viên bộ môn',
      subjects: 'Toán học',
      educationLevel: 'THCS',
      phone: '',
      password: '123456',
      status: 'ACTIVE'
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      teacherId: user.teacherId || '',
      role: user.role,
      departmentId: user.departmentId,
      position: user.position,
      subjects: user.subjects ? user.subjects.join(', ') : '',
      educationLevel: user.educationLevel || 'THCS',
      phone: user.phone || '',
      password: user.password || '',
      status: user.status || 'ACTIVE'
    });
  };

  // Open Role Modal
  const handleOpenRoleModal = (user: User) => {
    setRoleModalUser(user);
    setSelectedNewRole(getNormRole(user.role));
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (user: User) => {
    setResetPwdUser(user);
    setNewPassword('123456');
    setShowPasswordText(false);
  };

  // Submit Create User
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showAlert('error', 'Họ tên và email là bắt buộc!');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      showAlert('error', `Email "${cleanEmail}" đã được sử dụng bởi ${existing.name}!`);
      return;
    }

    const dept = departments.find((d) => d.id === formData.departmentId) || departments[0];
    const subArr = formData.subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newUser = storageService.createUser({
      name: formData.name.trim(),
      email: cleanEmail,
      teacherId: formData.teacherId.trim() || undefined,
      role: formData.role,
      departmentId: dept?.id || 'dept-1',
      departmentName: dept?.name || 'Tổ khoa học tự nhiên',
      position: formData.position.trim(),
      subjects: subArr.length > 0 ? subArr : ['Chuyên môn'],
      educationLevel: formData.educationLevel,
      phone: formData.phone.trim(),
      password: formData.password.trim() || '123456',
      status: formData.status
    });

    refreshList();
    setShowCreateModal(false);
    showAlert('success', `Đã tạo tài khoản cho cán bộ "${newUser.name}" thành công!`);
  };

  // Submit Edit User
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formData.name.trim() || !formData.email.trim()) {
      showAlert('error', 'Họ tên và email là bắt buộc!');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail && u.id !== editingUser.id);
    if (existing) {
      showAlert('error', `Email "${cleanEmail}" đã thuộc về tài khoản ${existing.name}!`);
      return;
    }

    const dept = departments.find((d) => d.id === formData.departmentId) || departments[0];
    const subArr = formData.subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    storageService.updateUser(editingUser.id, {
      name: formData.name.trim(),
      email: cleanEmail,
      teacherId: formData.teacherId.trim(),
      role: formData.role,
      departmentId: dept?.id || editingUser.departmentId,
      departmentName: dept?.name || editingUser.departmentName,
      position: formData.position.trim(),
      subjects: subArr.length > 0 ? subArr : editingUser.subjects,
      educationLevel: formData.educationLevel,
      phone: formData.phone.trim(),
      status: formData.status,
      ...(formData.password ? { password: formData.password.trim() } : {})
    });

    if (formData.role !== editingUser.role) {
      storageService.updateUserRole(editingUser.id, formData.role);
    }

    refreshList();
    setEditingUser(null);
    showAlert('success', `Đã cập nhật thông tin tài khoản "${formData.name}" thành công!`);
  };

  // Submit Role Change
  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;

    storageService.updateUserRole(roleModalUser.id, selectedNewRole);
    refreshList();
    const roleInfo = ROLE_DETAILS[normalizeRole(selectedNewRole)];
    setRoleModalUser(null);
    showAlert('success', `Đã cập nhật phân quyền của "${roleModalUser.name}" sang "${roleInfo.label}"!`);
  };

  // Submit Reset Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUser) return;
    if (!newPassword || newPassword.length < 4) {
      showAlert('error', 'Mật khẩu mới phải có tối thiểu 4 ký tự!');
      return;
    }

    storageService.resetUserPassword(resetPwdUser.id, newPassword);
    refreshList();
    setResetPwdUser(null);
    showAlert('success', `Đã đặt lại mật khẩu cho "${resetPwdUser.name}" thành công!`);
  };

  // Toggle Account Status
  const handleToggleStatus = (user: User) => {
    if (user.id === currentUser.id) {
      showAlert('error', 'Bạn không thể tự khóa tài khoản của chính mình!');
      return;
    }
    const next = storageService.toggleUserStatus(user.id);
    refreshList();
    if (next === 'LOCKED') {
      showAlert('success', `Đã tạm khóa tài khoản "${user.name}".`);
    } else {
      showAlert('success', `Đã mở khóa và kích hoạt lại tài khoản "${user.name}".`);
    }
  };

  // Confirm Delete User
  const handleDeleteUser = () => {
    if (!deletingUser) return;
    const res = storageService.deleteUserSafely(deletingUser.id, currentUser.id);
    if (res.success) {
      refreshList();
      showAlert('success', res.message);
    } else {
      showAlert('error', res.message);
    }
    setDeletingUser(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredUsers.map((u, idx) => {
      const normRole = getNormRole(u.role);
      const roleMeta = ROLE_DETAILS[normRole];
      return {
        STT: idx + 1,
        'Mã giáo viên': u.teacherId || 'Chưa cấp',
        'Họ và tên': u.name,
        'Email công vụ': u.email,
        'Số điện thoại': u.phone || 'Chưa cập nhật',
        'Tổ chuyên môn': u.departmentName,
        'Vị trí việc làm / Chức vụ': u.position,
        'Môn giảng dạy': u.subjects?.join(', ') || 'Chuyên môn',
        'Cấp học': u.educationLevel || 'THCS',
        'Vai trò phân quyền': roleMeta.label,
        'Phạm vi quyền': roleMeta.scope,
        'Trạng thái': u.status === 'LOCKED' ? 'Tạm khóa' : 'Hoạt động'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 26 },
      { wch: 30 },
      { wch: 15 },
      { wch: 28 },
      { wch: 28 },
      { wch: 22 },
      { wch: 10 },
      { wch: 25 },
      { wch: 18 },
      { wch: 14 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách Tài khoản');
    XLSX.writeFile(
      workbook,
      `DanhSach_TaiKhoan_THCS_NguyenDinhAnh_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // -------------------------------------------------------------------------
  // EXCEL BATCH IMPORT LOGIC
  // -------------------------------------------------------------------------
  // 1. Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        STT: 1,
        'Họ và tên (*)': 'Nguyễn Thu Trang',
        'Email công vụ (*)': 'trangnt@nguyendinhanh.edu.vn',
        'Mã giáo viên': 'GV-015',
        'Vai trò (*)': 'GIAO_VIEN',
        'Tổ chuyên môn': 'Tổ khoa học tự nhiên',
        'Vị trí / Chức vụ': 'Giáo viên - GVCN 7A1',
        'Môn giảng dạy': 'Toán học 7',
        'Cấp học': 'THCS',
        'Số điện thoại': '0912 345 678',
        'Mật khẩu': '123456'
      },
      {
        STT: 2,
        'Họ và tên (*)': 'Trần Quốc Đạt',
        'Email công vụ (*)': 'dattq@nguyendinhanh.edu.vn',
        'Mã giáo viên': 'GV-016',
        'Vai trò (*)': 'TO_TRUONG',
        'Tổ chuyên môn': 'Tổ khoa học xã hội',
        'Vị trí / Chức vụ': 'Tổ trưởng chuyên môn',
        'Môn giảng dạy': 'Ngữ văn 8, 9',
        'Cấp học': 'THCS',
        'Số điện thoại': '0988 777 666',
        'Mật khẩu': '123456'
      },
      {
        STT: 3,
        'Họ và tên (*)': 'Lê Minh Tuấn',
        'Email công vụ (*)': 'tuanlm@nguyendinhanh.edu.vn',
        'Mã giáo viên': 'GV-017',
        'Vai trò (*)': 'HOI_DONG_TDKT',
        'Tổ chuyên môn': 'Hội đồng Thi đua - Khen thưởng',
        'Vị trí / Chức vụ': 'Ủy viên Hội đồng TĐKT',
        'Môn giảng dạy': 'Giáo dục thể chất',
        'Cấp học': 'THCS',
        'Số điện thoại': '0977 123 456',
        'Mật khẩu': '123456'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 28 },
      { wch: 14 },
      { wch: 16 },
      { wch: 28 },
      { wch: 25 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_TaiKhoan');
    XLSX.writeFile(wb, 'Mau_Nhap_TaiKhoan_THCS_NguyenDinhAnh.xlsx');
  };

  // 2. Parse Uploaded Excel File
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          showAlert('error', 'Tệp Excel không có dữ liệu hoặc định dạng không đúng!');
          return;
        }

        const parsedRows: ExcelParsedRow[] = [];
        const seenEmailsInFile = new Set<string>();
        const currentUsers = storageService.getUsers();

        rawJson.forEach((row, idx) => {
          const name = String(
            row['Họ và tên (*)'] ||
              row['Họ và tên'] ||
              row['Họ tên'] ||
              row['ho_ten'] ||
              row['name'] ||
              ''
          ).trim();

          const email = String(
            row['Email công vụ (*)'] ||
              row['Email công vụ'] ||
              row['Email'] ||
              row['email'] ||
              ''
          )
            .trim()
            .toLowerCase();

          const teacherId = String(row['Mã giáo viên'] || row['Mã GV'] || row['ma_giao_vien'] || '').trim();
          const roleRaw = String(
            row['Vai trò (*)'] || row['Vai trò'] || row['Phân quyền'] || row['Role'] || row['role'] || ''
          ).trim();
          const deptRaw = String(
            row['Tổ chuyên môn'] || row['Tổ'] || row['to_chuyen_mon'] || row['department'] || ''
          ).trim();
          const position = String(
            row['Vị trí / Chức vụ'] || row['Vị trí'] || row['Chức vụ'] || row['position'] || 'Giáo viên bộ môn'
          ).trim();
          const subjectsRaw = String(row['Môn giảng dạy'] || row['Môn'] || row['subjects'] || 'Chuyên môn').trim();
          const eduRaw = String(row['Cấp học'] || row['educationLevel'] || 'THCS').trim().toUpperCase();
          const phone = String(row['Số điện thoại'] || row['SĐT'] || row['phone'] || '').trim();
          const password = String(row['Mật khẩu'] || row['password'] || '123456').trim();

          const roleInfo = parseRoleFromExcel(roleRaw);
          const dept = matchDepartment(deptRaw, departments);
          const subjects = subjectsRaw
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
          const educationLevel =
            eduRaw.includes('TIỂU HỌC') || eduRaw === 'TH'
              ? 'TH'
              : eduRaw.includes('LIÊN CẤP') || eduRaw === 'LIEN_CAP'
              ? 'LIEN_CAP'
              : 'THCS';

          let validationStatus: 'VALID' | 'EXISTING' | 'INVALID' = 'VALID';
          let validationMessage = 'Hợp lệ, sẵn sàng tạo mới';

          if (!name) {
            validationStatus = 'INVALID';
            validationMessage = 'Thiếu Họ và tên';
          } else if (!email || !email.includes('@')) {
            validationStatus = 'INVALID';
            validationMessage = 'Email không hợp lệ';
          } else if (seenEmailsInFile.has(email)) {
            validationStatus = 'INVALID';
            validationMessage = 'Trùng email trong cùng tệp Excel';
          } else {
            const existingUser = currentUsers.find((u) => u.email.toLowerCase() === email);
            if (existingUser) {
              validationStatus = 'EXISTING';
              validationMessage = `Đã tồn tại trong hệ thống (${existingUser.name})`;
            }
          }

          if (email) {
            seenEmailsInFile.add(email);
          }

          parsedRows.push({
            rowIdx: idx + 2,
            name,
            email,
            teacherId: teacherId || undefined,
            role: roleInfo.role,
            roleLabel: roleInfo.label,
            departmentId: dept.id,
            departmentName: dept.name,
            position,
            subjects: subjects.length > 0 ? subjects : ['Chuyên môn'],
            educationLevel,
            phone,
            password: password || '123456',
            status: 'ACTIVE',
            validationStatus,
            validationMessage
          });
        });

        setExcelParsedRows(parsedRows);
        setExcelFileName(file.name);
        setExcelFilterStatus('ALL');
        setShowExcelModal(true);
      } catch (err) {
        console.error('Lỗi khi đọc file Excel:', err);
        showAlert('error', 'Không thể đọc tệp Excel. Vui lòng kiểm tra định dạng .xlsx hoặc .xls!');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // 3. Confirm Excel Batch Import
  const handleConfirmImportExcel = () => {
    let importedCount = 0;
    let updatedCount = 0;

    excelParsedRows.forEach((row) => {
      if (row.validationStatus === 'VALID') {
        storageService.createUser({
          name: row.name,
          email: row.email,
          teacherId: row.teacherId,
          role: row.role,
          departmentId: row.departmentId,
          departmentName: row.departmentName,
          position: row.position,
          subjects: row.subjects,
          educationLevel: row.educationLevel,
          phone: row.phone,
          password: row.password,
          status: row.status
        });
        importedCount++;
      } else if (row.validationStatus === 'EXISTING' && updateExistingInDb) {
        const existing = storageService.getUsers().find((u) => u.email.toLowerCase() === row.email.toLowerCase());
        if (existing) {
          storageService.updateUser(existing.id, {
            name: row.name,
            role: row.role,
            departmentId: row.departmentId,
            departmentName: row.departmentName,
            position: row.position,
            subjects: row.subjects,
            educationLevel: row.educationLevel,
            phone: row.phone || existing.phone,
            teacherId: row.teacherId || existing.teacherId
          });
          updatedCount++;
        }
      }
    });

    refreshList();
    setShowExcelModal(false);
    showAlert(
      'success',
      `Nhập thành công! Đã tạo mới ${importedCount} tài khoản${
        updatedCount > 0 ? ` và cập nhật ${updatedCount} tài khoản` : ''
      } từ tệp Excel.`
    );
  };

  // Filtered rows for Excel preview modal
  const excelFilteredRows = useMemo(() => {
    if (excelFilterStatus === 'ALL') return excelParsedRows;
    return excelParsedRows.filter((r) => r.validationStatus === excelFilterStatus);
  }, [excelParsedRows, excelFilterStatus]);

  const excelStats = useMemo(() => {
    let valid = 0;
    let existing = 0;
    let invalid = 0;
    excelParsedRows.forEach((r) => {
      if (r.validationStatus === 'VALID') valid++;
      else if (r.validationStatus === 'EXISTING') existing++;
      else invalid++;
    });
    return { total: excelParsedRows.length, valid, existing, invalid };
  }, [excelParsedRows]);

  return (
    <div className="space-y-6">
      {/* Hidden file input for Excel upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleExcelFileUpload}
      />

      {/* Alert toast */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-sm transition-all animate-in fade-in ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Quản trị Tài khoản & Phân quyền RBAC
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Quản lý Tài khoản & Phân quyền Người dùng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dành cho Quản trị viên hệ thống tạo tài khoản, nhập hàng loạt từ Excel, phân quyền 6 cấp (bao gồm Tổ phó chuyên môn) và đổi mật khẩu
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tải file mẫu Excel */}
          <button
            onClick={handleDownloadTemplate}
            title="Tải tệp Excel mẫu để chuẩn bị danh sách cán bộ nhập hàng loạt"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Tải file mẫu Excel
          </button>

          {/* Nhập từ Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Tải lên tệp Excel (.xlsx, .xls) để nhập hàng loạt tài khoản"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-900 cursor-pointer transition-colors shadow-2xs"
          >
            <FileUp className="w-4 h-4 text-indigo-600" /> Nhập từ Excel (.xlsx)
          </button>

          {/* Xuất Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 cursor-pointer transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất Excel
          </button>

          {/* Tạo thủ công */}
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" /> Tạo tài khoản mới
          </button>

          {/* Làm mới */}
          <button
            onClick={refreshList}
            title="Tải lại danh sách"
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tab navigation: Danh sách tài khoản vs Ma trận Phân quyền & Vai trò Tổ phó */}
      <div className="flex border-b border-slate-200 gap-1 bg-white px-5 rounded-2xl border shadow-xs">
        <button
          type="button"
          onClick={() => setActiveViewMode('LIST')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeViewMode === 'LIST'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Danh sách Tài khoản & Cán bộ ({stats.total})
        </button>
        <button
          type="button"
          onClick={() => setActiveViewMode('RBAC_MATRIX')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeViewMode === 'RBAC_MATRIX'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-cyan-600" /> Bảng Ma trận Phân quyền & Vai trò Tổ phó chuyên môn
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-100 text-cyan-800 font-extrabold border border-cyan-200">
            {stats.topho} Tổ phó
          </span>
        </button>
      </div>

      {activeViewMode === 'LIST' ? (
        <>
          {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Tổng tài khoản</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          <div className="text-[10px] text-slate-500">Cán bộ giáo viên</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs bg-purple-50/30">
          <div className="text-[11px] font-bold text-purple-700 uppercase">Admin</div>
          <div className="text-2xl font-black text-purple-900 mt-0.5">{stats.admin}</div>
          <div className="text-[10px] text-purple-600">Quản trị hệ thống</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-2xs bg-red-50/30">
          <div className="text-[11px] font-bold text-red-700 uppercase">Ban Giám hiệu</div>
          <div className="text-2xl font-black text-red-900 mt-0.5">{stats.bgh}</div>
          <div className="text-[10px] text-red-600">Hiệu trưởng, Phó HT</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/30">
          <div className="text-[11px] font-bold text-blue-700 uppercase">Tổ trưởng</div>
          <div className="text-2xl font-black text-blue-900 mt-0.5">{stats.totruong}</div>
          <div className="text-[10px] text-blue-600">Duyệt cấp tổ</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-cyan-200 shadow-2xs bg-cyan-50/30">
          <div className="text-[11px] font-bold text-cyan-700 uppercase">Tổ phó</div>
          <div className="text-2xl font-black text-cyan-900 mt-0.5">{stats.topho}</div>
          <div className="text-[10px] text-cyan-600">Hỗ trợ cấp tổ</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/30">
          <div className="text-[11px] font-bold text-emerald-700 uppercase">Giáo viên</div>
          <div className="text-2xl font-black text-emerald-900 mt-0.5">{stats.giaovien}</div>
          <div className="text-[10px] text-emerald-600">Tự đánh giá</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/30">
          <div className="text-[11px] font-bold text-amber-700 uppercase">HĐ TĐKT</div>
          <div className="text-2xl font-black text-amber-900 mt-0.5">{stats.hoidong}</div>
          <div className="text-[10px] text-amber-600">Hội đồng TĐKT</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Trạng thái</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black text-emerald-600">{stats.active}</span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-lg font-bold text-rose-600">{stats.locked}</span>
          </div>
          <div className="text-[10px] text-slate-500">Hoạt động / Khóa</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-blue-100 text-blue-700">
            <Filter className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Bộ lọc & Tìm kiếm Tài khoản
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tìm kiếm:</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Họ tên, email, mã GV, SĐT..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Phân quyền (Role):</label>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">Tất cả các vai trò ({users.length})</option>
              <option value="ADMIN">ADMIN – Quản trị viên ({stats.admin})</option>
              <option value="BGH">BGH – Ban Giám hiệu ({stats.bgh})</option>
              <option value="TO_TRUONG">TO_TRUONG – Tổ trưởng ({stats.totruong})</option>
              <option value="TO_PHO">TO_PHO – Tổ phó chuyên môn ({stats.topho})</option>
              <option value="GIAO_VIEN">GIAO_VIEN – Giáo viên ({stats.giaovien})</option>
              <option value="HOI_DONG_TDKT">HOI_DONG_TDKT – Hội đồng TĐKT ({stats.hoidong})</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tổ chuyên môn:</label>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">Tất cả các tổ ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Trạng thái:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table of Users */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-700">
            Hiển thị <span className="text-blue-600 font-black">{filteredUsers.length}</span> / {users.length} tài khoản
          </div>
          <div className="text-slate-400 text-[11px]">
            Hệ thống phân quyền chuẩn RBAC (Role-Based Access Control)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[200px]">Cán bộ & Tài khoản</th>
                <th className="py-3 px-3 min-w-[160px]">Tổ chuyên môn</th>
                <th className="py-3 px-3 min-w-[150px]">Vị trí & Môn dạy</th>
                <th className="py-3 px-3 text-center min-w-[150px]">Phân quyền (Role)</th>
                <th className="py-3 px-3 text-center w-28">Trạng thái</th>
                <th className="py-3 px-4 text-center min-w-[180px]">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u, idx) => {
                  const normRole = getNormRole(u.role);
                  const roleMeta = ROLE_DETAILS[normRole];
                  const isLocked = u.status === 'LOCKED';
                  const isSelf = u.id === currentUser.id;

                  return (
                    <tr
                      key={`${u.id}-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLocked ? 'bg-slate-50/50 opacity-75' : ''
                      }`}
                    >
                      {/* STT */}
                      <td className="py-3.5 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-xs">
                            {u.name.split(' ').slice(-1)[0][0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                              <span>{u.email}</span>
                              {u.teacherId && (
                                <span className="bg-slate-100 text-slate-600 px-1 rounded text-[10px] font-bold">
                                  {u.teacherId}
                                </span>
                              )}
                            </div>
                            {u.phone && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" /> {u.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{u.departmentName}</div>
                        <div className="text-[10px] text-slate-400">
                          Cấp học: {u.educationLevel || 'THCS'}
                        </div>
                      </td>

                      {/* Position & Subject */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">{u.position}</div>
                        <div className="text-[10px] text-slate-500">
                          {u.subjects?.join(', ') || 'Chuyên môn'}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenRoleModal(u)}
                          title="Click để thay đổi phân quyền"
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${roleMeta.badgeClass}`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{roleMeta.label.split(' ')[0]}</span>
                          <span className="text-[10px] opacity-75">({roleMeta.scope})</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={isLocked ? 'Click để mở khóa' : 'Click để tạm khóa tài khoản'}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                            isLocked
                              ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                          {isLocked ? 'Tạm khóa' : 'Hoạt động'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Sửa thông tin */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Sửa thông tin tài khoản"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Phân quyền */}
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            title="Phân quyền (RBAC)"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-purple-50 hover:text-purple-600 text-slate-600 cursor-pointer transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          {/* Đặt lại mật khẩu */}
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            title="Đặt lại mật khẩu"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:text-amber-600 text-slate-600 cursor-pointer transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Khóa/Mở khóa */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            className={`p-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors ${
                              isLocked
                                ? 'hover:bg-emerald-50 hover:text-emerald-600 text-rose-600'
                                : 'hover:bg-rose-50 hover:text-rose-600 text-slate-600'
                            }`}
                          >
                            {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Xóa tài khoản */}
                          <button
                            onClick={() => setDeletingUser(u)}
                            disabled={isSelf || u.id === 'user-admin-system' || u.id === 'user-admin'}
                            title={
                              isSelf
                                ? 'Không thể xóa tài khoản của bạn'
                                : u.id === 'user-admin-system' || u.id === 'user-admin'
                                ? 'Tài khoản hệ thống mặc định không thể xóa'
                                : 'Xóa tài khoản'
                            }
                            className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${
                              isSelf || u.id === 'user-admin-system' || u.id === 'user-admin'
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'hover:bg-red-50 hover:text-red-600 text-slate-600 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs italic">
                    Không tìm thấy tài khoản nào phù hợp với điều kiện tìm kiếm và bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    /* RBAC MATRIX & TO_PHO MANAGEMENT VIEW */
    <div className="space-y-6 animate-in fade-in">
      {/* Banner introduction */}
      <div className="bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 text-xs px-3 py-1 rounded-full font-bold backdrop-blur-md">
              <Shield className="w-3.5 h-3.5" /> Quản trị Hệ thống • Phân quyền 6 Cấp RBAC
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Ma trận Phân quyền & Quản lý Vai trò Tổ phó chuyên môn
            </h2>
            <p className="text-xs sm:text-sm text-cyan-100/80 leading-relaxed">
              Cơ chế phân quyền theo nguyên tắc đặc quyền tối thiểu (Principle of Least Privilege), bảo vệ dữ liệu bằng Row Level Security (RLS) tại CSDL. Đặc biệt, chức danh <strong>Tổ phó chuyên môn (TO_PHO)</strong> được phân cấp rõ ràng thẩm quyền hỗ trợ Tổ trưởng rà soát minh chứng và theo dõi tiến độ thi đua cấp tổ.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowQuickAssignViceModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" /> Bổ nhiệm Tổ phó chuyên môn
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('LIST')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold backdrop-blur-md cursor-pointer transition-all"
            >
              <Users className="w-4 h-4" /> Xem danh sách tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* 6 Roles Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'] as const).map((r) => {
          const info = ROLE_DETAILS[r];
          const count =
            r === 'ADMIN'
              ? stats.admin
              : r === 'BGH'
              ? stats.bgh
              : r === 'TO_TRUONG'
              ? stats.totruong
              : r === 'TO_PHO'
              ? stats.topho
              : r === 'GIAO_VIEN'
              ? stats.giaovien
              : stats.hoidong;

          const isToPho = r === 'TO_PHO';

          return (
            <div
              key={r}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isToPho
                  ? 'bg-cyan-50/40 border-cyan-300 ring-2 ring-cyan-400/40 shadow-md relative'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {isToPho && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-cyan-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                  Điểm mới bổ sung
                </span>
              )}

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${info.badgeClass}`}>
                    {info.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-black">
                    {count} cán bộ
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Phạm vi: <span className="text-slate-700 font-semibold">{info.scope}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {info.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Quyền hạn cốt lõi:</div>
                  <ul className="space-y-1 text-[11px] text-slate-700">
                    {info.permissions.map((p, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Role code: {r}</span>
                {r === 'TO_TRUONG' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeptForLeader('dept-5');
                      setShowQuickAssignLeaderModal(true);
                    }}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer flex items-center gap-1"
                  >
                    + Phân quyền Tổ trưởng
                  </button>
                )}
                {isToPho && (
                  <button
                    type="button"
                    onClick={() => setShowQuickAssignViceModal(true)}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer flex items-center gap-1"
                  >
                    + Gán thêm cán bộ
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive: QUY ĐỊNH PHÂN QUYỀN TỔ PHÓ CHUYÊN MÔN (TO_PHO) */}
      <div className="bg-white rounded-3xl border border-cyan-200 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-cyan-100 text-cyan-800">
              <Shield className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Chi tiết Quy chế & Thẩm quyền Phân quyền: Tổ phó chuyên môn (TO_PHO)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy định cụ thể theo Điều lệ trường THCS & Quy chế Thi đua số 86/QC-TH&THCS-NDA
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Đã kích hoạt bảo vệ RLS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-xs font-black text-slate-900">Rà soát & Kiểm tra Minh chứng Tổ</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Truy cập xem tất cả minh chứng của giáo viên cùng tổ chuyên môn. Hỗ trợ rà soát tính hợp lệ, đầy đủ, đúng tiêu chí và phát hiện thiếu sót để báo cáo Tổ trưởng.
            </p>
            <span className="inline-block text-[10px] font-bold text-cyan-800 bg-white px-2 py-0.5 rounded border border-cyan-200">
              RLS: Chỉ xem trong tổ
            </span>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-xs font-black text-slate-900">Giám sát & Đôn đốc Tiến độ</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Theo dõi danh sách các thành viên chưa tự chấm điểm, chưa nộp hoặc nộp chậm minh chứng so với hạn chót. Phối hợp Tổ trưởng nhắc nhở cán bộ trong tổ.
            </p>
            <span className="inline-block text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
              Thống kê tiến độ tổ
            </span>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-xs font-black text-slate-900">Tự đánh giá & Nộp hồ sơ Cá nhân</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Là một giáo viên trong tổ, Tổ phó có đầy đủ quyền tự chấm 23 tiêu chí chuẩn (100 điểm), nộp và cập nhật minh chứng điện tử của bản thân theo Phụ lục 01.
            </p>
            <span className="inline-block text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
              Quyền tự chấm cá nhân
            </span>
          </div>

          {/* Pillar 4 */}
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="text-xs font-black text-slate-900">Thay mặt Tổ trưởng (Khi ủy quyền)</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Khi Tổ trưởng vắng mặt có lý do chính đáng hoặc được phân công, Tổ phó được phép chủ trì cuộc họp bình xét thi đua của tổ, chấm điểm cấp tổ và báo cáo BGH.
            </p>
            <span className="inline-block text-[10px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200">
              Ủy quyền điều hành tổ
            </span>
          </div>
        </div>

        {/* Security & Isolation Callout */}
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Hàng rào bảo mật Row Level Security (RLS) cho Tổ phó chuyên môn:
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">RLS ACTIVE • PROTECTED</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Hệ thống áp dụng chính sách cách ly dữ liệu: Cán bộ giữ vai trò <code className="text-cyan-300">TO_PHO</code> chỉ có quyền đọc dữ liệu giáo viên và minh chứng trong phạm vi tổ mình trực thuộc (<code className="text-emerald-300">WHERE department_id = auth.current_department()</code>). Hệ thống tự động chặn mọi nỗ lực truy cập hồ sơ của các tổ chuyên môn khác hoặc can thiệp vào tầng cấu hình quản trị hệ thống.
          </p>
        </div>
      </div>

      {/* Current Vice Leaders List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              Danh sách Cán bộ đang được Phân quyền Tổ phó chuyên môn ({stats.topho} cán bộ)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Các cán bộ được bổ nhiệm hỗ trợ quản lý chuyên môn tại các tổ trực thuộc nhà trường
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickAssignViceModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 cursor-pointer transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Phân quyền thêm Tổ phó
          </button>
        </div>

        {users.filter((u) => normalizeRole(u.role) === 'TO_PHO').length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users
              .filter((u) => normalizeRole(u.role) === 'TO_PHO')
              .map((u, idx) => {
                const dept = departments.find((d) => d.id === u.departmentId);
                const isLocked = u.status === 'LOCKED';

                return (
                  <div
                    key={`${u.id}-${idx}`}
                    className="p-4 rounded-2xl border border-cyan-200 bg-cyan-50/30 hover:border-cyan-400 transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                        TO_PHO
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-cyan-100/70">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Tổ trực thuộc:</span>
                        <span className="font-bold text-slate-800">{dept?.name || u.departmentName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Chức vụ hiển thị:</span>
                        <span className="font-semibold text-slate-700">{u.position}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Mã GV / SĐT:</span>
                        <span className="font-mono text-[11px] text-slate-600">
                          {u.teacherId || '---'} • {u.phone || '---'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-cyan-100/70 flex items-center justify-end gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenRoleModal(u)}
                        title="Đổi vai trò phân quyền"
                        className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold cursor-pointer"
                      >
                        Đổi vai trò
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        title="Sửa thông tin tài khoản"
                        className="px-2.5 py-1 rounded-lg border border-cyan-300 bg-white hover:bg-cyan-50 text-cyan-800 font-bold cursor-pointer"
                      >
                        Sửa
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <Shield className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600">
              Hiện chưa có cán bộ nào được phân quyền <strong>Tổ phó chuyên môn (TO_PHO)</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowQuickAssignViceModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              Bổ nhiệm Tổ phó chuyên môn ngay
            </button>
          </div>
        )}
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Bảng So sánh Chi tiết Phân quyền 6 Vai trò trong Hệ thống
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh thẩm quyền thực hiện các nghiệp vụ thi đua giữa Giáo viên, Tổ phó, Tổ trưởng, Ban Giám hiệu, HĐ TĐKT và Admin
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Cột <strong className="text-cyan-700">Tổ phó chuyên môn</strong> được làm nổi bật
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 min-w-[200px]">Nghiệp vụ / Chức năng hệ thống</th>
                <th className="py-3 px-3 text-center min-w-[90px] text-purple-800">1. ADMIN</th>
                <th className="py-3 px-3 text-center min-w-[90px] text-red-800">2. BGH</th>
                <th className="py-3 px-3 text-center min-w-[100px] text-blue-800">3. TỔ TRƯỞNG</th>
                <th className="py-3 px-3 text-center min-w-[110px] bg-cyan-100/80 text-cyan-900 border-x border-cyan-300">
                  ★ 4. TỔ PHÓ
                </th>
                <th className="py-3 px-3 text-center min-w-[90px] text-emerald-800">5. GIÁO VIÊN</th>
                <th className="py-3 px-3 text-center min-w-[90px] text-amber-800">6. HĐ TĐKT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[
                { name: '1. Xem hồ sơ & phiếu tự chấm cá nhân', admin: true, bgh: true, tt: true, tp: true, gv: true, hd: true },
                { name: '2. Tự chấm điểm 23 tiêu chí (Phụ lục 01)', admin: true, bgh: true, tt: true, tp: true, gv: true, hd: true },
                { name: '3. Tải lên & quản lý minh chứng điện tử của bản thân', admin: true, bgh: true, tt: true, tp: true, gv: true, hd: true },
                { name: '4. Xem hồ sơ & minh chứng giáo viên trong tổ', admin: true, bgh: true, tt: true, tp: true, gv: false, hd: true },
                { name: '5. Hỗ trợ rà soát, kiểm tra tính hợp lệ minh chứng tổ', admin: true, bgh: true, tt: true, tp: true, gv: false, hd: false },
                { name: '6. Thẩm định, duyệt hoặc từ chối minh chứng cấp tổ', admin: true, bgh: true, tt: true, tp: 'Ủy quyền', gv: false, hd: false },
                { name: '7. Chấm điểm thi đua cấp tổ & ghi biên bản giải trình', admin: true, bgh: true, tt: true, tp: 'Ủy quyền', gv: false, hd: false },
                { name: '8. Theo dõi tiến độ thi đua & đôn đốc nộp hồ sơ tổ', admin: true, bgh: true, tt: true, tp: true, gv: false, hd: false },
                { name: '9. Xem bảng điểm & in báo cáo thi đua tổ', admin: true, bgh: true, tt: true, tp: true, gv: false, hd: true },
                { name: '10. Xem hồ sơ thi đua giáo viên toàn trường', admin: true, bgh: true, tt: false, tp: false, gv: false, hd: true },
                { name: '11. Rà soát & duyệt điểm cấp Ban Giám hiệu', admin: true, bgh: true, tt: false, tp: false, gv: false, hd: false },
                { name: '12. Phê duyệt điểm thưởng thành tích / điểm trừ vi phạm', admin: true, bgh: true, tt: false, tp: false, gv: false, hd: false },
                { name: '13. Tham gia bình xét, kết luận mức xếp loại (Phụ lục 06)', admin: true, bgh: true, tt: false, tp: false, gv: false, hd: true },
                { name: '14. Quản lý tài khoản, phân quyền RBAC & CSDL', admin: true, bgh: false, tt: false, tp: false, gv: false, hd: false }
              ].map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{row.name}</td>
                  
                  {/* Admin */}
                  <td className="py-2.5 px-3 text-center">
                    {row.admin === true ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">✗</span>
                    )}
                  </td>

                  {/* BGH */}
                  <td className="py-2.5 px-3 text-center">
                    {row.bgh === true ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">✗</span>
                    )}
                  </td>

                  {/* Tổ trưởng */}
                  <td className="py-2.5 px-3 text-center">
                    {row.tt === true ? (
                      <span className="text-blue-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">✗</span>
                    )}
                  </td>

                  {/* TỔ PHÓ - Highlighted column */}
                  <td className="py-2.5 px-3 text-center bg-cyan-50/60 border-x border-cyan-200">
                    {row.tp === true ? (
                      <span className="text-cyan-700 font-black">✓</span>
                    ) : row.tp === 'Ủy quyền' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                        Ủy quyền
                      </span>
                    ) : (
                      <span className="text-slate-300">✗</span>
                    )}
                  </td>

                  {/* Giáo viên */}
                  <td className="py-2.5 px-3 text-center">
                    {row.gv === true ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">✗</span>
                    )}
                  </td>

                  {/* Hội đồng TĐKT */}
                  <td className="py-2.5 px-3 text-center">
                    {row.hd === true ? (
                      <span className="text-amber-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* ========================================================================= */}
      {/* MODAL 0: XEM TRƯỚC VÀ XÁC NHẬN NHẬP DỮ LIỆU TỪ EXCEL */}
      {/* ========================================================================= */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Xem trước & Xác nhận Nhập tài khoản từ Excel
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Tệp tin: <strong className="text-slate-700">{excelFileName}</strong> ({excelStats.total} dòng đọc được)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExcelModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Stat summary pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setExcelFilterStatus('ALL')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    excelFilterStatus === 'ALL'
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng số dòng</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{excelStats.total}</div>
                  <div className="text-[10px] text-slate-400">Tất cả dữ liệu</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExcelFilterStatus('VALID')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    excelFilterStatus === 'VALID'
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                      : 'border-emerald-200 bg-emerald-50/50'
                  }`}
                >
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Hợp lệ tạo mới</div>
                  <div className="text-xl font-black text-emerald-800 mt-0.5">{excelStats.valid}</div>
                  <div className="text-[10px] text-emerald-600">Sẵn sàng thêm</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExcelFilterStatus('EXISTING')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    excelFilterStatus === 'EXISTING'
                      ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                      : 'border-amber-200 bg-amber-50/50'
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-700 uppercase">Đã có email</div>
                  <div className="text-xl font-black text-amber-800 mt-0.5">{excelStats.existing}</div>
                  <div className="text-[10px] text-amber-600">Cập nhật thông tin</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExcelFilterStatus('INVALID')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    excelFilterStatus === 'INVALID'
                      ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500'
                      : 'border-rose-200 bg-rose-50/50'
                  }`}
                >
                  <div className="text-[11px] font-bold text-rose-700 uppercase">Không hợp lệ / Lỗi</div>
                  <div className="text-xl font-black text-rose-800 mt-0.5">{excelStats.invalid}</div>
                  <div className="text-[10px] text-rose-600">Sẽ bị bỏ qua</div>
                </button>
              </div>

              {/* Option toggle for existing accounts */}
              {excelStats.existing > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-amber-900 font-semibold text-[11px]">
                      Phát hiện {excelStats.existing} tài khoản đã tồn tại email trong hệ thống.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-bold text-amber-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateExistingInDb}
                      onChange={(e) => setUpdateExistingInDb(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    Cập nhật thông tin các tài khoản này
                  </label>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Dòng</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3">Email công vụ</th>
                        <th className="py-2.5 px-3">Mã GV</th>
                        <th className="py-2.5 px-3 text-center">Vai trò</th>
                        <th className="py-2.5 px-3">Tổ chuyên môn</th>
                        <th className="py-2.5 px-3">Vị trí & Môn</th>
                        <th className="py-2.5 px-3 text-center w-36">Kiểm tra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {excelFilteredRows.length > 0 ? (
                        excelFilteredRows.map((r) => (
                          <tr
                            key={r.rowIdx}
                            className={`hover:bg-slate-50 transition-colors ${
                              r.validationStatus === 'INVALID'
                                ? 'bg-rose-50/40 text-rose-950'
                                : r.validationStatus === 'EXISTING'
                                ? 'bg-amber-50/30'
                                : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                              #{r.rowIdx}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{r.name || '---'}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{r.email || '---'}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.teacherId || 'Tự sinh'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  ROLE_DETAILS[normalizeRole(r.role)].badgeClass
                                }`}
                              >
                                {r.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 text-[11px]">{r.departmentName}</td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              {r.position} • {r.subjects.join(', ')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {r.validationStatus === 'VALID' ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Hợp lệ
                                </span>
                              ) : r.validationStatus === 'EXISTING' ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                    updateExistingInDb
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                  title={r.validationMessage}
                                >
                                  {updateExistingInDb ? 'Cập nhật' : 'Đã có'}
                                </span>
                              ) : (
                                <span
                                  className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1"
                                  title={r.validationMessage}
                                >
                                  <X className="w-3 h-3" /> {r.validationMessage}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                            Không có dòng dữ liệu nào theo bộ lọc này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500">
                Sẵn sàng thêm mới: <strong className="text-emerald-700 font-black">{excelStats.valid}</strong>
                {updateExistingInDb && excelStats.existing > 0 && (
                  <span>
                    {' '}• Cập nhật: <strong className="text-blue-700 font-black">{excelStats.existing}</strong>
                  </span>
                )}
                {excelStats.invalid > 0 && (
                  <span>
                    {' '}• Bỏ qua lỗi: <strong className="text-rose-700 font-bold">{excelStats.invalid}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExcelModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={excelStats.valid === 0 && (!updateExistingInDb || excelStats.existing === 0)}
                  onClick={handleConfirmImportExcel}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận nhập{' '}
                  {excelStats.valid + (updateExistingInDb ? excelStats.existing : 0)} tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO TÀI KHOẢN MỚI THỦ CÔNG */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">Tạo tài khoản cán bộ mới</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Họ tên */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên cán bộ giáo viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Nguyễn Thị Lan"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                {/* Mã giáo viên */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã giáo viên:</label>
                  <input
                    type="text"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    placeholder="VD: GV-012"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email công vụ (Tên đăng nhập) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="lannt@nguyendinhanh.edu.vn"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912 345 678"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Phân quyền (Role) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phân quyền vai trò (Role RBAC) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                >
                  <option value="GIAO_VIEN">Giáo viên (Chỉ xem và tự đánh giá hồ sơ cá nhân)</option>
                  <option value="TO_PHO">Tổ phó chuyên môn (Hỗ trợ quản lý & rà soát hồ sơ tổ)</option>
                  <option value="TO_TRUONG">Tổ trưởng chuyên môn (Duyệt minh chứng và chấm điểm tổ)</option>
                  <option value="BGH">Ban Giám hiệu (Rà soát & thẩm định thi đua toàn trường)</option>
                  <option value="HOI_DONG_TDKT">Hội đồng Thi đua - Khen thưởng (Tham gia bình xét chung cuộc)</option>
                  <option value="ADMIN">Quản trị viên hệ thống (Toàn quyền hệ thống)</option>
                </select>
                <div className="mt-1 p-2 rounded-lg bg-blue-50/70 text-blue-800 text-[11px] leading-relaxed">
                  <strong>Mô tả quyền hạn:</strong> {ROLE_DETAILS[normalizeRole(formData.role)].description}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tổ chuyên môn */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ chuyên môn:</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vị trí / Chức vụ */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vị trí việc làm / Chức vụ:</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="VD: Giáo viên - GVCN 7A1"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Môn giảng dạy */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn giảng dạy:</label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    placeholder="VD: Toán 7, Tin 6 (cách nhau dấu phẩy)"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Cấp học */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cấp học:</label>
                  <select
                    value={formData.educationLevel}
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="THCS">THCS</option>
                    <option value="TH">Tiểu học (TH)</option>
                    <option value="LIEN_CAP">Liên cấp (TH & THCS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mật khẩu khởi tạo */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu khởi tạo:</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mặc định: 123456"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái tài khoản:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="ACTIVE">Hoạt động (Cho phép đăng nhập)</option>
                    <option value="LOCKED">Tạm khóa</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SỬA THÔNG TIN TÀI KHOẢN */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Sửa tài khoản: {editingUser.name}
                </h2>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Họ tên */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                {/* Mã giáo viên */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã giáo viên:</label>
                  <input
                    type="text"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email công vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Phân quyền */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phân quyền (Role RBAC):</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                >
                  <option value="GIAO_VIEN">Giáo viên</option>
                  <option value="TO_PHO">Tổ phó chuyên môn</option>
                  <option value="TO_TRUONG">Tổ trưởng chuyên môn</option>
                  <option value="BGH">Ban Giám hiệu</option>
                  <option value="HOI_DONG_TDKT">Hội đồng Thi đua - Khen thưởng</option>
                  <option value="ADMIN">Quản trị viên hệ thống</option>
                </select>
                <div className="mt-1 p-2 rounded-lg bg-blue-50/70 text-blue-800 text-[11px]">
                  <strong>Quyền hạn:</strong> {ROLE_DETAILS[normalizeRole(formData.role)].description}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tổ chuyên môn */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tổ chuyên môn:</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vị trí */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vị trí / Chức vụ:</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Môn giảng dạy */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn giảng dạy:</label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Cấp học */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cấp học:</label>
                  <select
                    value={formData.educationLevel}
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="THCS">THCS</option>
                    <option value="TH">Tiểu học (TH)</option>
                    <option value="LIEN_CAP">Liên cấp (TH & THCS)</option>
                  </select>
                </div>
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng thái hoạt động:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="ACTIVE">Hoạt động (Bình thường)</option>
                  <option value="LOCKED">Tạm khóa (Không thể đăng nhập)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PHÂN QUYỀN CHO TÀI KHOẢN (RBAC ROLE MATRIX) */}
      {/* ========================================================================= */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
                  <Shield className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Phân quyền: {roleModalUser.name}
                </h2>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{roleModalUser.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{roleModalUser.email}</div>
                  <div className="text-[11px] text-slate-500">
                    {roleModalUser.departmentName} • {roleModalUser.position}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Vai trò hiện tại:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                      ROLE_DETAILS[normalizeRole(roleModalUser.role)].badgeClass
                    }`}
                  >
                    {ROLE_DETAILS[normalizeRole(roleModalUser.role)].label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Chọn vai trò phân quyền mới:
                </label>
                <div className="space-y-2.5">
                  {(['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT'] as const).map((r) => {
                    const info = ROLE_DETAILS[r];
                    const isSelected = selectedNewRole === r;

                    return (
                      <label
                        key={r}
                        className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="roleSelection"
                            value={r}
                            checked={isSelected}
                            onChange={() => setSelectedNewRole(r)}
                            className="mt-0.5 text-purple-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{info.label}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Phạm vi: {info.scope}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {info.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {info.permissions.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                                >
                                  ✓ {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  Xác nhận phân quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ĐẶT LẠI MẬT KHẨU */}
      {/* ========================================================================= */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-100 text-amber-700">
                  <KeyRound className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">Đặt lại mật khẩu</h2>
              </div>
              <button
                onClick={() => setResetPwdUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{resetPwdUser.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{resetPwdUser.email}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới:</label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewPassword('123456')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] cursor-pointer"
                >
                  ⚡ Đặt nhanh: 123456
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rnd = `Nda@${Math.floor(100000 + Math.random() * 900000)}`;
                    setNewPassword(rnd);
                    setShowPasswordText(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-[11px] cursor-pointer"
                >
                  🎲 Tạo mật khẩu ngẫu nhiên
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: XÁC NHẬN XÓA TÀI KHOẢN */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden p-6 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Xác nhận xóa tài khoản</h3>
              <p className="text-slate-600">
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của{' '}
                <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email})?
              </p>
              <div className="text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] mt-2 text-left">
                ⚠️ Hành động này sẽ loại bỏ tài khoản khỏi danh sách đăng nhập và đánh giá thi đua.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: BỔ NHIỆM & PHÂN QUYỀN TỔ PHÓ CHUYÊN MÔN NHANH */}
      {/* ========================================================================= */}
      {showQuickAssignViceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-cyan-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-cyan-50 border-b border-cyan-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-cyan-600 text-white">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Bổ nhiệm & Phân quyền Tổ phó chuyên môn
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cấp vai trò TO_PHO và phân công phụ trách rà soát tổ
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQuickAssignViceModal(false);
                  setSelectedTeacherForVice('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedTeacherForVice) {
                  showAlert('error', 'Vui lòng chọn một giáo viên để bổ nhiệm Tổ phó!');
                  return;
                }
                const target = users.find((u) => u.id === selectedTeacherForVice);
                if (!target) return;
                storageService.updateUser(target.id, {
                  role: 'TO_PHO',
                  position: 'Tổ phó chuyên môn'
                });
                const dept = departments.find((d) => d.id === target.departmentId);
                if (dept && (!dept.viceLeaderId || dept.viceLeaderId === '')) {
                  storageService.updateDepartment(dept.id, {
                    viceLeaderId: target.id,
                    viceLeaderName: target.name
                  });
                }
                refreshList();
                setShowQuickAssignViceModal(false);
                setSelectedTeacherForVice('');
                showAlert('success', `Đã phân quyền Tổ phó chuyên môn cho "${target.name}" (${target.departmentName}) thành công!`);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3.5 bg-cyan-50/60 rounded-xl border border-cyan-200 text-cyan-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-900">
                  <Info className="w-4 h-4 text-cyan-700" /> Quy định bổ nhiệm:
                </div>
                <p className="text-[11px] text-cyan-800 leading-relaxed">
                  Cán bộ được bổ nhiệm sẽ tự động nhận vai trò <code className="font-bold text-cyan-900">TO_PHO</code>, có quyền rà soát minh chứng và theo dõi tiến độ thi đua của các thành viên cùng tổ chuyên môn.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn Cán bộ / Giáo viên để phân quyền Tổ phó:
                </label>
                <select
                  value={selectedTeacherForVice}
                  onChange={(e) => setSelectedTeacherForVice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  required
                >
                  <option value="">-- Chọn cán bộ giáo viên trong trường --</option>
                  {users
                    .filter((u) => normalizeRole(u.role) !== 'ADMIN' && normalizeRole(u.role) !== 'BGH')
                    .map((u, idx) => (
                      <option key={`${u.id}-${idx}`} value={u.id}>
                        {u.name} ({u.email}) • {u.departmentName} [{ROLE_DETAILS[normalizeRole(u.role)].label}]
                      </option>
                    ))}
                </select>
              </div>

              {selectedTeacherForVice && (() => {
                const preview = users.find((u) => u.id === selectedTeacherForVice);
                if (!preview) return null;
                return (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-900">{preview.name}</div>
                    <div className="text-[11px] text-slate-500">Tổ hiện tại: <strong className="text-slate-800">{preview.departmentName}</strong></div>
                    <div className="text-[11px] text-slate-500">Chức vụ hiện tại: <strong className="text-slate-800">{preview.position}</strong></div>
                    <div className="text-[11px] text-cyan-700 font-semibold pt-1 border-t border-slate-200">
                      → Sau khi xác nhận: Chức vụ sẽ thành "Tổ phó chuyên môn", vai trò TO_PHO.
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAssignViceModal(false);
                    setSelectedTeacherForVice('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedTeacherForVice}
                  className={`px-5 py-2 rounded-xl font-bold text-white shadow-md cursor-pointer transition-all ${
                    selectedTeacherForVice
                      ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Xác nhận phân quyền Tổ phó
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: BỔ NHIỆM & PHÂN QUYỀN TỔ TRƯỞNG CHUYÊN MÔN NHANH */}
      {/* ========================================================================= */}
      {showQuickAssignLeaderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-blue-600 text-white">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Bổ nhiệm & Phân quyền Tổ trưởng chuyên môn
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cấp vai trò TO_TRUONG và giao phụ trách quản lý thi đua của tổ
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQuickAssignLeaderModal(false);
                  setSelectedTeacherForLeader('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedDeptForLeader) {
                  showAlert('error', 'Vui lòng chọn tổ chuyên môn cần phân quyền!');
                  return;
                }
                if (!selectedTeacherForLeader) {
                  showAlert('error', 'Vui lòng chọn một cán bộ giáo viên để bổ nhiệm Tổ trưởng!');
                  return;
                }
                const targetDept = departments.find((d) => d.id === selectedDeptForLeader);
                const targetUser = users.find((u) => u.id === selectedTeacherForLeader);
                if (!targetDept || !targetUser) return;

                const res = storageService.assignDepartmentLeadership(
                  selectedDeptForLeader,
                  selectedTeacherForLeader,
                  targetDept.viceLeaderId
                );

                if (res.success) {
                  refreshList();
                  setShowQuickAssignLeaderModal(false);
                  setSelectedTeacherForLeader('');
                  showAlert('success', `Đã phân quyền Tổ trưởng chuyên môn cho "${targetUser.name}" phụ trách "${targetDept.name}" thành công!`);
                } else {
                  showAlert('error', res.message);
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Info className="w-4 h-4 text-blue-700" /> Thẩm quyền Tổ trưởng:
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Cán bộ được bổ nhiệm sẽ tự động nhận vai trò <code className="font-bold text-blue-900">TO_TRUONG</code>, có toàn quyền duyệt minh chứng, đánh giá điểm thi đua và đại diện Tổ chuyên môn.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  1. Chọn Tổ chuyên môn cần phân quyền:
                </label>
                <select
                  value={selectedDeptForLeader}
                  onChange={(e) => setSelectedDeptForLeader(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  required
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}) - Tổ trưởng hiện tại: {d.leaderName || 'Chưa chỉ định'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  2. Chọn Cán bộ / Giáo viên làm Tổ trưởng chuyên môn:
                </label>
                <select
                  value={selectedTeacherForLeader}
                  onChange={(e) => setSelectedTeacherForLeader(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  required
                >
                  <option value="">-- Chọn cán bộ giáo viên --</option>
                  <optgroup label="Giáo viên đang thuộc tổ này:">
                    {users
                      .filter((u) => u.departmentId === selectedDeptForLeader)
                      .map((u, idx) => (
                        <option key={`${u.id}-${idx}`} value={u.id}>
                          {u.name} ({u.email}) • {u.position} [{ROLE_DETAILS[normalizeRole(u.role)].label}]
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Giáo viên từ các tổ khác (sẽ chuyển sang làm Tổ trưởng tổ này):">
                    {users
                      .filter((u) => u.departmentId !== selectedDeptForLeader && normalizeRole(u.role) !== 'ADMIN' && normalizeRole(u.role) !== 'BGH')
                      .map((u, idx) => (
                        <option key={`${u.id}-${idx}`} value={u.id}>
                          {u.name} ({u.email}) • Đang ở: {u.departmentName}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {selectedTeacherForLeader && (() => {
                const preview = users.find((u) => u.id === selectedTeacherForLeader);
                const targetDept = departments.find((d) => d.id === selectedDeptForLeader);
                if (!preview || !targetDept) return null;
                return (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-900">{preview.name}</div>
                    <div className="text-[11px] text-slate-500">Email: <strong className="text-slate-800">{preview.email}</strong></div>
                    <div className="text-[11px] text-slate-500">Tổ được chỉ định: <strong className="text-blue-700">{targetDept.name}</strong></div>
                    <div className="text-[11px] text-blue-700 font-semibold pt-1 border-t border-slate-200">
                      → Sau khi xác nhận: Chức vụ sẽ thành "Tổ trưởng chuyên môn", vai trò TO_TRUONG của {targetDept.name}.
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAssignLeaderModal(false);
                    setSelectedTeacherForLeader('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedTeacherForLeader}
                  className={`px-5 py-2 rounded-xl font-bold text-white shadow-md cursor-pointer transition-all ${
                    selectedTeacherForLeader
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Xác nhận phân quyền Tổ trưởng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
