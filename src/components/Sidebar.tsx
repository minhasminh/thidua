import React from 'react';
import {
  LayoutDashboard,
  User as UserIcon,
  CheckSquare,
  FolderOpen,
  Users,
  Award,
  AlertOctagon,
  MessageSquareQuote,
  Bell,
  FileSpreadsheet,
  BookOpen,
  Settings,
  X,
  Sparkles,
  Scale,
  ShieldAlert,
  UserCog,
  Building
} from 'lucide-react';
import { User, normalizeRole } from '../types';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  currentUser,
  isOpen,
  onClose
}) => {
  const normRole = normalizeRole(currentUser.role);

  // Build menu list with strict RBAC visibility (Mục 1 & Mục 6)
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'profile',
      label: 'Hồ sơ cá nhân',
      icon: UserIcon,
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'evaluation',
      label: 'Đánh giá thi đua',
      icon: CheckSquare,
      badge: 'Phụ lục 01',
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'criteria-management',
      label: 'Tiêu chí thi đua',
      icon: Scale,
      badge: '100đ',
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'my-evidence',
      label: 'Minh chứng của tôi',
      icon: FolderOpen,
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN']
    },
    {
      id: 'team-evidence',
      label: 'Duyệt minh chứng',
      icon: Users,
      badge: 'Tổ trưởng / phó',
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'HOI_DONG_TDKT']
    },
    {
      id: 'bgh-review',
      label: 'Rà soát thi đua',
      icon: ShieldAlert,
      badge: 'BGH',
      roles: ['ADMIN', 'BGH']
    },
    {
      id: 'bonus-points',
      label: 'Điểm cộng',
      icon: Award,
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'deduction-points',
      label: 'Điểm trừ',
      icon: AlertOctagon,
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'appeals',
      label: 'Giải trình & Bổ sung',
      icon: MessageSquareQuote,
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: Bell,
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'reports',
      label: 'Báo cáo & Xếp loại',
      icon: FileSpreadsheet,
      badge: 'Phụ lục 06',
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'HOI_DONG_TDKT', 'GIAO_VIEN']
    },
    {
      id: 'regulations',
      label: 'Quy chế thi đua',
      icon: BookOpen,
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO', 'GIAO_VIEN', 'HOI_DONG_TDKT']
    },
    {
      id: 'departments',
      label: 'Tổ chuyên môn',
      icon: Building,
      badge: '6 tổ',
      roles: ['ADMIN', 'BGH', 'TO_TRUONG', 'TO_PHO']
    },
    {
      id: 'user-management',
      label: 'Quản lý tài khoản',
      icon: UserCog,
      badge: 'Phân quyền',
      roles: ['ADMIN', 'BGH']
    },
    {
      id: 'settings',
      label: 'Quản trị hệ thống',
      icon: Settings,
      roles: ['ADMIN', 'BGH']
    }
  ];

  const visibleItems = menuItems.filter((item) => item.roles.includes(normRole));

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-50 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800`}
      >
        {/* Mobile Header in sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              NĐA
            </div>
            <div className="text-sm font-bold text-white">Trường TH&THCS N.Đ.Anh</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Quick Info */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser.name.split(' ').slice(-1)[0][0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {currentUser.departmentName}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/20">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Năm học 2026–2027
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Quy chế số 86/QC-TH&THCS-NDA
          </div>
        </div>
      </aside>
    </>
  );
};
