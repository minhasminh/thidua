import React, { useState } from 'react';
import {
  Bell,
  School,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Menu,
  Clock,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Award,
  BookOpen,
  Lock
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { storageService } from '../services/storageService';
import { RlsSecurityInspectorModal } from './RlsSecurityInspectorModal';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onNavigate: (tab: string) => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  onNavigate,
  onToggleSidebar,
  onLogout
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showRlsModal, setShowRlsModal] = useState(false);

  const rawUsers = storageService.getUsers();
  const allUsers = React.useMemo(() => {
    const seen = new Set<string>();
    return rawUsers.filter((u) => {
      if (!u || !u.id || seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [rawUsers]);
  const notifications = storageService.getNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSelectUser = (user: User) => {
    storageService.setCurrentUser(user.id);
    onUserChange(user);
    setShowRoleMenu(false);
    setShowAccountMenu(false);
  };

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsAsRead();
    setShowNotifMenu(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="bg-purple-100 text-purple-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-purple-200">
            Quản trị viên
          </span>
        );
      case 'BGH':
      case 'PRINCIPAL':
        return (
          <span className="bg-red-100 text-red-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-red-200">
            Ban Giám Hiệu
          </span>
        );
      case 'HOI_DONG_TDKT':
      case 'COUNCIL':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
            Hội đồng TĐKT
          </span>
        );
      case 'TO_TRUONG':
      case 'TEAM_LEADER':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
            Tổ trưởng
          </span>
        );
      case 'GIAO_VIEN':
      case 'TEACHER':
      default:
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
            Giáo viên
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & App Title (Section 4) */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20 group-hover:scale-105 transition-transform shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-blue-900 leading-tight">
                  Trường TH&THCS Nguyễn Đình Anh
                </div>
                {/* Header Title per requirement: "Quản lý thi đua nội bộ – Năm học 2026–2027" */}
                <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  Quản lý thi đua nội bộ – Năm học 2026–2027
                </h1>
              </div>
            </div>
          </div>

          {/* Right side: Notifications, User Name, Role, Avatar, Account Menu */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" /> Thông báo ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((item: NotificationItem) => (
                      <div
                        key={item.id}
                        className={`p-3 text-xs ${!item.isRead ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <div className="font-semibold text-slate-800">{item.title}</div>
                        <div className="text-slate-600 mt-0.5">{item.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{item.createdAt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Account Menu (Section 4) */}
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  {currentUser.name.split(' ').slice(-1)[0][0]}
                </div>

                {/* Name & Role */}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-snug">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getRoleBadge(currentUser.role)}
                  </div>
                </div>

                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Account Dropdown */}
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                    <div className="mt-1">{getRoleBadge(currentUser.role)}</div>
                  </div>

                  <div className="py-1 text-xs">
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" /> Hồ sơ cá nhân
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowRoleMenu(true);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-blue-600 font-semibold cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-600" /> Đổi vai trò kiểm thử RBAC (11 TK)
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowRlsModal(true);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-700 font-semibold cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-emerald-600" /> Kiểm tra RLS & CSDL Supabase
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Đăng xuất tài khoản
                    </button>
                  </div>
                </div>
              )}

              {/* RBAC Role Switcher Modal / Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Chuyển đổi tài khoản kiểm thử
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Chọn người dùng mẫu để kiểm tra phân quyền RBAC (Mục 9)
                      </div>
                    </div>
                    <button
                      onClick={() => setShowRoleMenu(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                    {allUsers.map((user, idx) => (
                      <button
                        key={`header-usr-${user.id}-${idx}`}
                        onClick={() => handleSelectUser(user)}
                        className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-slate-50 cursor-pointer ${
                          user.id === currentUser.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {user.name.split(' ').slice(-1)[0][0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{user.position}</div>
                        </div>
                        {getRoleBadge(user.role)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RLS Security Inspector Modal */}
      {showRlsModal && (
        <RlsSecurityInspectorModal
          currentUser={currentUser}
          onClose={() => setShowRlsModal(false)}
        />
      )}
    </header>
  );
};
