import React, { useState } from 'react';
import {
  Bell,
  School,
  UserCheck,
  Shield,
  Award,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Menu,
  Clock
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { storageService } from '../services/storageService';

interface NavbarProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onNavigate: (tab: string) => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  onNavigate,
  onToggleSidebar
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const allUsers = storageService.getUsers();
  const notifications = storageService.getNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const settings = storageService.getSettings();

  const handleSelectUser = (user: User) => {
    storageService.setCurrentUser(user.id);
    onUserChange(user);
    setShowRoleMenu(false);
  };

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsAsRead();
    setShowNotifMenu(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-purple-200">Admin Quản trị</span>;
      case 'PRINCIPAL':
        return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200">Ban Giám Hiệu</span>;
      case 'COUNCIL':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-200">Hội đồng TĐKT</span>;
      case 'TEAM_LEADER':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">Tổ Trưởng</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">Giáo Viên</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & School Logo & Branding */}
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                <School className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs uppercase tracking-wider font-bold text-blue-900 leading-tight">
                  Trường TH & THCS Nguyễn Đình Anh
                </div>
                <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  Quản lý Thi đua Khen thưởng
                  <span className="inline-block text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    2026–2027
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: School Year & Semester indicator */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Năm học:</span>
            <span className="font-bold text-slate-900">{settings.schoolYear}</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-blue-700 bg-white px-2 py-0.5 rounded shadow-2xs">
              Học kỳ I (HKI)
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Đang mở nộp minh chứng
            </span>
          </div>

          {/* Right: Notifications & Quick Switch Role */}
          <div className="flex items-center gap-3">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" /> Thông báo hệ thống ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Chưa có thông báo nào
                      </div>
                    ) : (
                      notifications.map((item: NotificationItem) => (
                        <div
                          key={item.id}
                          className={`p-3 hover:bg-slate-50 transition-colors ${
                            !item.isRead ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {item.type === 'WARNING' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : item.type === 'SUCCESS' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-800">
                                {item.title}
                              </div>
                              <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                {item.message}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {item.createdAt}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        onNavigate('notifications');
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Xem tất cả thông báo &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.name.split(' ').slice(-1)[0][0]}
                </div>
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

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Chuyển đổi tài khoản / Phân quyền
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Chọn người dùng để kiểm thử workflow RBAC thực tế
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                          user.id === currentUser.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {user.name.split(' ').slice(-1)[0][0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {user.position} ({user.departmentName})
                          </div>
                          <div className="mt-1">{getRoleBadge(user.role)}</div>
                        </div>
                        {user.id === currentUser.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
