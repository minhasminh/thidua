import React, { useState } from 'react';
import {
  School,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Building,
  HelpCircle,
  X
} from 'lucide-react';
import { User, Role, normalizeRole } from '../types';
import { authService, DEMO_ACCOUNTS } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email công vụ.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.signIn(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Đăng nhập không thành công.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = async (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('123456');
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await authService.signIn(accountEmail, '123456');
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess('');
    const res = await authService.resetPassword(forgotEmail);
    setForgotSuccess(res.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* School Logo */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-xl shadow-blue-500/30 mb-4 border border-blue-400/30">
          <School className="w-9 h-9" />
        </div>

        <div className="text-xs uppercase tracking-widest font-black text-blue-300">
          Trường TH & THCS Nguyễn Đình Anh
        </div>
        <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
          Hệ thống Quản lý Thi đua Nội bộ
        </h1>
        <p className="text-xs text-slate-300 mt-1 font-medium">
          Năm học 2026–2027 • Quy chế đánh giá viên chức và xếp loại thi đua
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-200/80 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form đăng nhập (Mục 8) */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ Email công vụ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="annv@nguyendinhanh.edu.vn"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(email);
                    setForgotSuccess('');
                  }}
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                (Mật khẩu mặc định tài khoản mẫu: <strong>123456</strong>)
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Switcher for Seamless Testing */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Đăng nhập nhanh 1-Click (10 Tài khoản mẫu)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickSelect(acc.email)}
                  className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700">
                    {acc.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{acc.position}</div>
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${acc.badgeColor}`}
                  >
                    {acc.roleLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security and RLS note */}
        <div className="mt-4 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Hệ thống bảo vệ bởi Row Level Security (RLS) & RBAC</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" /> Khôi phục mật khẩu công vụ
              </h2>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Nhập địa chỉ email giáo viên đã được cấp bởi Trường TH&THCS Nguyễn Đình Anh. Hệ thống sẽ gửi hướng dẫn thiết lập lại mật khẩu.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email giáo viên
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="annv@nguyendinhanh.edu.vn"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              {forgotSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
