import React from 'react';
import {
  X,
  Clock,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText
} from 'lucide-react';
import { EvidenceItem } from '../types';

interface EvidenceAuditHistoryModalProps {
  evidence: EvidenceItem;
  onClose: () => void;
}

export const EvidenceAuditHistoryModal: React.FC<EvidenceAuditHistoryModalProps> = ({
  evidence,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 inline-block">
                Mục XI – Nhật ký thao tác bất biến (Audit Log)
              </div>
              <h2 className="text-base font-black text-slate-900 mt-1">
                Lịch sử thẩm định & thay đổi minh chứng
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Evidence Summary Header */}
        <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-200 mr-2">
              Tiêu chí {evidence.criteriaCode}
            </span>
            <span className="font-bold text-slate-800">{evidence.name}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono shrink-0">
            ID: {evidence.id}
          </span>
        </div>

        {/* Audit Log Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(!evidence.auditLogs || evidence.auditLogs.length === 0) ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Chưa có nhật ký ghi nhận cho minh chứng này.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {evidence.auditLogs.map((log, idx) => (
                <div key={log.id || idx} className="relative text-xs group">
                  {/* Dot icon */}
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs" />

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{log.actorName}</span>
                        <span className="text-slate-400 font-normal">({log.actorRole})</span>
                      </div>
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {log.timestamp}
                      </span>
                    </div>

                    <div className="font-extrabold text-blue-900 text-xs flex items-center gap-1">
                      <span>• {log.action}</span>
                      {log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          ({log.previousStatus} → <strong className="text-emerald-700">{log.newStatus}</strong>)
                        </span>
                      )}
                    </div>

                    {log.details && (
                      <p className="text-slate-600 text-[11px] leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Quy chế: Dữ liệu kiểm toán bảo mật, không được chỉnh sửa hoặc xóa</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
