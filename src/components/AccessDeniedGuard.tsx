import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { Role, normalizeRole } from '../types';

interface AccessDeniedGuardProps {
  currentRole: Role;
  requiredRoles: string[];
  tabName: string;
  onGoBack: () => void;
}

export const AccessDeniedGuard: React.FC<AccessDeniedGuardProps> = ({
  currentRole,
  requiredRoles,
  tabName,
  onGoBack
}) => {
  const normRole = normalizeRole(currentRole);

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'Quản trị viên (ADMIN)';
      case 'BGH':
        return 'Ban Giám hiệu (BGH)';
      case 'TO_TRUONG':
        return 'Tổ trưởng chuyên môn (TO_TRUONG)';
      case 'TO_PHO':
        return 'Tổ phó chuyên môn (TO_PHO)';
      case 'GIAO_VIEN':
        return 'Giáo viên (GIAO_VIEN)';
      case 'HOI_DONG_TDKT':
        return 'Hội đồng TĐKT (HOI_DONG_TDKT)';
      default:
        return r;
    }
  };

  return (
    <div className="min-h-[450px] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-red-200 p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200 shadow-md">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 mb-2">
            <Lock className="w-3.5 h-3.5" /> Chặn truy cập theo chính sách RBAC & Row Level Security (RLS)
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Từ chối quyền truy cập trang
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Bạn đang đăng nhập với vai trò <strong className="text-slate-800">{getRoleLabel(normRole)}</strong>.
            Chức năng <strong className="text-red-700 font-mono">[{tabName}]</strong> chỉ dành riêng cho các vai trò:{' '}
            <span className="font-semibold text-slate-800">
              {requiredRoles.map((r) => getRoleLabel(r)).join(', ')}
            </span>.
          </p>
        </div>

        {/* Database RLS Rule explanation per Requirement 6 & 7 */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Quy định bảo vệ ở tầng CSDL (RLS Policy):
          </div>
          <p className="text-[11px] text-slate-600 leading-normal">
            Theo Quy chế thi đua nội bộ năm học 2026–2027 và thiết kế CSDL Supabase, hệ thống thực thi chính sách bảo vệ dữ liệu ở cấp độ dòng (Row Level Security):
          </p>
          <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[10px] overflow-x-auto leading-relaxed">
            CREATE POLICY "Restricted access to {tabName}" ON public.{tabName.replace('-', '_')}
            <br />
            &nbsp;&nbsp;FOR ALL TO authenticated
            <br />
            &nbsp;&nbsp;USING (public.get_current_user_role() IN ({requiredRoles.map((r) => `'${r}'`).join(', ')}));
          </code>
        </div>

        <button
          onClick={onGoBack}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay về Dashboard của tôi
        </button>
      </div>
    </div>
  );
};
