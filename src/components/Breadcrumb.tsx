import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  currentTab: string;
  onNavigateHome: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  profile: 'Hồ sơ cá nhân',
  evaluation: 'Đánh giá thi đua',
  'my-evidence': 'Minh chứng của tôi',
  'team-evidence': 'Duyệt minh chứng (Tổ)',
  'bgh-review': 'Rà soát thi đua cấp BGH',
  'bonus-points': 'Điểm cộng',
  'deduction-points': 'Điểm trừ',
  appeals: 'Giải trình & Bổ sung minh chứng',
  reports: 'Báo cáo',
  notifications: 'Thông báo',
  'user-management': 'Quản lý tài khoản & Phân quyền',
  departments: 'Quản lý Tổ chuyên môn',
  'criteria-management': 'Tiêu chí thi đua',
  settings: 'Quản trị hệ thống',
  regulations: 'Quy chế thi đua'
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentTab, onNavigateHome }) => {
  const currentTitle = TAB_TITLES[currentTab] || 'Tổng quan';

  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium cursor-pointer"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>Trang chủ</span>
      </button>

      <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1.5 shrink-0" />

      <span className="font-semibold text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
        {currentTitle}
      </span>
    </nav>
  );
};
