import React, { useState } from 'react';
import {
  User as UserIcon,
  Award,
  BookOpen,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  Star,
  MapPin,
  Check
} from 'lucide-react';
import { User, EvidenceItem, normalizeRole } from '../types';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { CRITERIA_GROUPS } from '../data/criteriaData';

interface TeacherProfileViewProps {
  currentUser: User;
  onViewEvidence: (evidence: EvidenceItem) => void;
  onNavigateToEvaluation: () => void;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({
  currentUser,
  onViewEvidence,
  onNavigateToEvaluation
}) => {
  const userRole = normalizeRole(currentUser.role);
  const isTeacher = userRole === 'GIAO_VIEN';
  const allowedTeachers = databaseService.getTeachers(currentUser);

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (isTeacher) return currentUser.id;
    if (userRole === 'TO_TRUONG' || userRole === 'TO_PHO') {
      const match = allowedTeachers.find(
        (t) => t.department_id === currentUser.departmentId || t.to_chuyen_mon === currentUser.departmentName
      );
      return match ? match.user_id : currentUser.id;
    }
    return 'user-gv1';
  });

  const teacher = storageService.getUserById(selectedId) || currentUser;
  const teacherDb = databaseService.getAllTeachersRaw().find((t) => t.user_id === teacher.id) || {
    id: 'tch-04',
    user_id: teacher.id,
    ho_ten: teacher.name,
    email: teacher.email,
    ma_giao_vien: 'GV-004',
    to_chuyen_mon: teacher.departmentName,
    cap_hoc: 'THCS',
    mon_day: teacher.subjects?.join(', ') || 'Chuyên môn',
    chuc_vu: teacher.position,
    co_so: 'Cơ sở chính (Trường TH&THCS Nguyễn Đình Anh)',
    trang_thai: 'DANG_CONG_TAC',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z'
  };

  const evaluation = storageService.getEvaluation(teacher.id);
  const evidences = storageService.getTeacherEvidences(teacher.id);
  const appeals = storageService.getAppeals().filter((a) => a.teacherId === teacher.id);
  const settings = storageService.getSettings();

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'A_PLUS':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-xl text-xs">A+ – Nổi bật (95–100)</span>;
      case 'A':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-3 py-1 rounded-xl text-xs">A – Xuất sắc (90–94,5)</span>;
      case 'B':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-3 py-1 rounded-xl text-xs">B – Tốt (80–89,5)</span>;
      case 'C':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-3 py-1 rounded-xl text-xs">C – Đạt (65–79,5)</span>;
      default:
        return <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold px-3 py-1 rounded-xl text-xs">D – Chưa đạt (&lt;65)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <UserIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Mục XIV – Hồ sơ thi đua cá nhân
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Hồ sơ Thi đua Cán bộ Giáo viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu chuyên môn, điểm số định kỳ và minh chứng lưu trữ
          </p>
        </div>

        {!isTeacher && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Xem hồ sơ GV:</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
            >
              {allowedTeachers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.ho_ten} - {t.to_chuyen_mon} ({t.ma_giao_vien})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Teacher Profile Info Card (Mục 2: Bảng teachers đầy đủ các trường) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              {teacherDb.ho_ten.split(' ').slice(-1)[0][0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{teacherDb.ho_ten}</h2>
                <span className="bg-blue-100 text-blue-800 font-bold font-mono text-xs px-2.5 py-0.5 rounded-full border border-blue-200">
                  {teacherDb.ma_giao_vien}
                </span>
                <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {teacherDb.trang_thai}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> {teacherDb.to_chuyen_mon}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Dạy môn: {teacherDb.mon_day}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Cấp học: {teacherDb.cap_hoc}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {teacherDb.co_so}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToEvaluation}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
          >
            Mở phiếu chấm thi đua &rarr;
          </button>
        </div>

        {/* 3 Semester Results Comparison (Section XIV) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Kết quả Học kỳ I (HKI)
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-blue-950">
                {evaluation.finalScore}
                <span className="text-sm font-normal text-slate-500">/100đ</span>
              </span>
            </div>
            <div className="mt-2">{getRatingBadge(evaluation.rating)}</div>
            <div className="text-[11px] text-slate-500 mt-2">
              Tự chấm: {evaluation.selfTotal}đ • Tổ chấm: {evaluation.teamTotal}đ • BGH: {evaluation.bghTotal}đ
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kết quả Học kỳ II (HKII)
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-400">---</span>
            </div>
            <div className="mt-2">
              <span className="bg-slate-200 text-slate-600 font-semibold px-2.5 py-0.5 rounded-full text-xs">
                Chưa mở đánh giá
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Dự kiến bắt đầu: Tháng 05/2027
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Tổng kết Cả năm học (2026–2027)
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-amber-950">
                {evaluation.finalScore}
                <span className="text-sm font-normal text-slate-500">/100đ</span>
              </span>
            </div>
            <div className="mt-2">{getRatingBadge(evaluation.rating)}</div>
            <div className="text-[11px] text-amber-800 mt-2">
              Theo quy định Điều 21: Căn cứ kết quả cả năm
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
          Điểm số theo từng nhóm tiêu chí
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CRITERIA_GROUPS.map((g) => {
            let gScore = 0;
            g.criteria.forEach((c) => {
              const s = evaluation.scores[c.id];
              gScore += Number(s?.bghScore || s?.teamScore || s?.selfScore || 0);
            });
            gScore = Math.round(gScore * 10) / 10;
            const percent = Math.round((gScore / g.maxScore) * 100);

            return (
              <div key={g.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="truncate pr-2">{g.name.split('–')[1] || g.name}</span>
                  <span className="text-blue-700 shrink-0 font-extrabold">
                    {gScore}/{g.maxScore}đ
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Attached Evidence & Leader/BGH Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evidences list */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Minh chứng đã nộp ({evidences.length})
            </h3>
            <span className="text-xs text-blue-600 font-semibold">Tất cả minh chứng</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {evidences.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có minh chứng nào được nộp.
              </div>
            ) : (
              evidences.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onViewEvidence(ev)}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg px-2 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                      <span className="text-blue-600 bg-blue-50 px-1 rounded text-[10px]">
                        {ev.criteriaCode}
                      </span>
                      <span className="truncate">{ev.name}</span>
                      {ev.isOutstanding && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {ev.fileName} • {ev.uploadedAt}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comments & Explanations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800">
            Ý kiến Tổ chuyên môn, BGH & Giải trình
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700 block">Nhận xét của Tổ chuyên môn:</span>
              <p className="text-slate-600 mt-1 italic leading-relaxed">
                {evaluation.teamComment || 'Chưa có nhận xét của tổ trưởng.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <span className="font-bold text-emerald-900 block">Kết luận của Ban Giám hiệu:</span>
              <p className="text-emerald-950 mt-1 italic leading-relaxed">
                {evaluation.bghComment || 'Chưa có ý kiến của Ban giám hiệu.'}
              </p>
            </div>

            {appeals.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                <span className="font-bold text-blue-900 block">
                  Đơn giải trình gần nhất:
                </span>
                <p className="text-blue-950 mt-1 leading-relaxed">
                  "{appeals[0].title}" - Trạng thái: {appeals[0].status}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
