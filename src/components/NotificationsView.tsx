import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  CheckCheck,
  ExternalLink
} from 'lucide-react';
import { NotificationItem, User } from '../types';
import { storageService } from '../services/storageService';

interface NotificationsViewProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [refresh, setRefresh] = useState(0);

  const notifications = storageService.getNotifications();
  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const handleMarkAll = () => {
    storageService.markAllNotificationsAsRead();
    setRefresh((prev) => prev + 1);
  };

  const handleMarkOne = (id: string) => {
    storageService.markNotificationAsRead(id);
    setRefresh((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Bell className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Mục XIX – Trung tâm Thông báo
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Thông báo Hệ thống Thi đua
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật tức thì về tiến trình nộp, thẩm định minh chứng, cảnh báo chênh lệch và kết quả đánh giá
          </p>
        </div>

        <button
          onClick={handleMarkAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" /> Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setFilter('ALL')}
          className={`py-2 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tất cả thông báo ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`py-2 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            filter === 'UNREAD'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chưa đọc ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            Không có thông báo nào.
          </div>
        ) : (
          filtered.map((item: NotificationItem) => (
            <div
              key={item.id}
              onClick={() => handleMarkOne(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                !item.isRead
                  ? 'bg-blue-50/50 border-blue-200 shadow-2xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 rounded-xl shrink-0 mt-0.5">
                {item.type === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : item.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900 truncate">
                    {item.title}
                  </h2>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
