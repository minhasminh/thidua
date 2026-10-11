import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Shield,
  Clock,
  ChevronRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface RegulationsViewProps {
  currentUser: User;
}

export const RegulationsView: React.FC<RegulationsViewProps> = ({ currentUser }) => {
  const regulation = storageService.getRegulation();
  const [activeTab, setActiveTab] = useState<'DOCUMENT' | 'ARTICLES' | 'VERSIONS'>('DOCUMENT');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Mục XXXVII – Quản lý Quy chế Thi đua
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Quy chế Thi đua Nội bộ Năm học 2026–2027
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Văn bản số 86/QC-TH&THCS-NDA ban hành ngày 01/09/2026 • Hiệu trưởng Trần Đình Trọng
          </p>
        </div>

        <a
          href={regulation.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Tải bản PDF chính thức
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('DOCUMENT')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'DOCUMENT'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Toàn văn Quy chế 2026–2027
        </button>
        <button
          onClick={() => setActiveTab('ARTICLES')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'ARTICLES'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Trích dẫn 6 Nhóm Tiêu chí & Thang điểm
        </button>
        <button
          onClick={() => setActiveTab('VERSIONS')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'VERSIONS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Lịch sử ban hành & Hiệu lực
        </button>
      </div>

      {/* Content depending on Tab */}
      {activeTab === 'DOCUMENT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="text-center pb-6 border-b border-slate-200">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
              Số: 86/QC-TH&THCS-NDA
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase mt-2">
              QUY CHẾ TIÊU CHÍ ĐÁNH GIÁ, XẾP LOẠI THI ĐUA NỘI BỘ NĂM HỌC 2026–2027
            </h2>
            <div className="text-xs text-slate-500 mt-1">
              (Ban hành kèm theo Quyết định số 102/QĐ-TH&THCS-NDA ngày 01 tháng 09 năm 2026 của Hiệu trưởng)
            </div>
          </div>

          {/* Chapter 1 */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-blue-900 uppercase">
              Chương I: QUY ĐỊNH CHUNG
            </h3>
            <p>
              <strong>Điều 1. Phạm vi điều chỉnh và đối tượng áp dụng:</strong> Quy chế này quy định về đối tượng, tiêu chí, thang điểm, quy trình đánh giá, thẩm định minh chứng điện tử và xếp loại thi đua định kỳ từng học kỳ và cả năm học 2026–2027 đối với toàn thể cán bộ, giáo viên, nhân viên Trường TH&THCS Nguyễn Đình Anh.
            </p>
            <p>
              <strong>Điều 2. Thang điểm chuẩn:</strong> Thang điểm đánh giá chuẩn là <strong>100 điểm</strong>, được phân bổ cho 6 nhóm tiêu chí chuyên môn và đạo đức sư phạm. Tổng điểm thi đua cuối cùng bằng Tổng điểm các tiêu chí cộng Điểm cộng thành tích và trừ Điểm trừ vi phạm.
            </p>
            <p>
              <strong>Điều 3. Nguyên tắc đánh giá:</strong> Bảo đảm tính dân chủ, công khai, khách quan, chính xác và có minh chứng xác thực. Mọi điểm cộng hoặc trừ đều phải có căn cứ quyết định hoặc biên bản xác nhận của cấp có thẩm quyền.
            </p>
          </div>

          {/* Chapter 2 */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-blue-900 uppercase">
              Chương II: TIÊU CHUẨN XẾP LOẠI VÀ ĐIỀU KIỆN KHỐNG CHẾ
            </h3>
            <div className="space-y-1.5 pl-3 border-l-2 border-blue-500">
              <p>
                <strong>1. Mức A+ (Nổi bật):</strong> Tổng điểm đạt từ <strong>95,0 đến 100 điểm</strong> và bắt buộc có <strong>ít nhất 02 minh chứng nổi bật</strong> được Ban Giám hiệu công nhận (giải thưởng cấp huyện/thành phố, sáng kiến kinh nghiệm loại Tốt, bài giảng số hóa tiêu biểu). Không bị điểm trừ vì vi phạm quy chế chuyên môn.
              </p>
              <p>
                <strong>2. Mức A (Xuất sắc):</strong> Tổng điểm đạt từ <strong>90,0 đến 94,5 điểm</strong>; hoàn thành tốt mọi nhiệm vụ được giao, hồ sơ chuyên môn xếp loại Tốt.
              </p>
              <p>
                <strong>3. Mức B (Tốt):</strong> Tổng điểm đạt từ <strong>80,0 đến 89,5 điểm</strong>; hoàn thành nhiệm vụ chuyên môn và nền nếp công tác.
              </p>
              <p>
                <strong>4. Mức C (Đạt):</strong> Tổng điểm đạt từ <strong>65,0 đến 79,5 điểm</strong>; còn hạn chế về tiến độ hồ sơ hoặc chỉ tiêu bộ môn.
              </p>
              <p>
                <strong>5. Mức D (Chưa đạt):</strong> Tổng điểm đạt <strong>dưới 65,0 điểm</strong> hoặc bị kỷ luật từ mức khiển trách trở lên.
              </p>
            </div>
          </div>

          {/* Chapter 3 */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-blue-900 uppercase">
              Chương III: QUY TRÌNH THẨM ĐỊNH VÀ CẢNH BÁO CHÊNH LỆCH ĐIỂM
            </h3>
            <p>
              <strong>Điều 18. Xử lý chênh lệch điểm đánh giá:</strong> Trường hợp điểm tự chấm của cá nhân và điểm do Tổ chuyên môn thẩm định chênh lệch từ <strong>05 điểm trở lên</strong>, hệ thống tự động phát cảnh báo. Tổ trưởng bắt buộc phải ghi rõ lý do và căn cứ điều chỉnh vào phiếu đánh giá.
            </p>
            <p>
              <strong>Điều 20. Quy trình đánh giá 5 bước:</strong>
              <br />Bước 1: Giáo viên tự chấm và tải minh chứng điện tử lên hệ thống.
              <br />Bước 2: Tổ trưởng kiểm tra, đối chiếu hồ sơ, họp tổ bình xét và ghi điểm tổ.
              <br />Bước 3: Ban Giám hiệu rà soát, kiểm tra sự chênh lệch và điều chỉnh theo thẩm quyền.
              <br />Bước 4: Hội đồng Thi đua – Khen thưởng họp xem xét, giải quyết kiến nghị (nếu có).
              <br />Bước 5: Hiệu trưởng phê duyệt và khóa kết quả thi đua chính thức.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'ARTICLES' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3">
              Cơ cấu 6 nhóm tiêu chí đánh giá (Tổng cộng 100 điểm)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="font-bold text-blue-900 text-sm block">
                  Nhóm 1 – Phẩm chất, Đạo đức, Trách nhiệm (15 điểm)
                </span>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
                  <li>1.1 Chấp hành chủ trương, pháp luật (4đ)</li>
                  <li>1.2 Đạo đức nhà giáo, ứng xử (4đ)</li>
                  <li>1.3 Đoàn kết, phối hợp (3đ)</li>
                  <li>1.4 Tinh thần trách nhiệm (4đ)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <span className="font-bold text-indigo-900 text-sm block">
                  Nhóm 2 – Thực hiện Nhiệm vụ Chuyên môn (30 điểm)
                </span>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
                  <li>2.1 Thực hiện chương trình, KHGD (6đ)</li>
                  <li>2.2 Hồ sơ chuyên môn (5đ)</li>
                  <li>2.3 Đổi mới PPDH và KTĐG (5đ)</li>
                  <li>2.4 Dự giờ, thao giảng, SHCM (4đ)</li>
                  <li>2.5 Kiểm tra, đánh giá học sinh (4đ)</li>
                  <li>2.6 Hỗ trợ HS yếu/bồi dưỡng HS (6đ)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="font-bold text-emerald-900 text-sm block">
                  Nhóm 3 – Chất lượng & Hiệu quả Giáo dục (25 điểm)
                </span>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
                  <li>3.1 Kết quả chỉ tiêu chất lượng (10đ)</li>
                  <li>3.2 Tiến bộ của học sinh (5đ)</li>
                  <li>3.3 Chất lượng giờ dạy (5đ)</li>
                  <li>3.4 Hoạt động ngoài giờ/phong trào (5đ)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="font-bold text-amber-900 text-sm block">
                  Nhóm 4 – Kỷ luật, Kỷ cương, Hồ sơ, Tiến độ (15 điểm)
                </span>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
                  <li>4.1 Ngày công, giờ công (5đ)</li>
                  <li>4.2 Thông tin, báo cáo (4đ)</li>
                  <li>4.3 Chấp hành phân công (3đ)</li>
                  <li>4.4 Hội họp, tác phong, điện thoại (3đ)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
                <span className="font-bold text-purple-900 text-sm block">
                  Nhóm 5 – Công tác Chủ nhiệm & Kiêm nhiệm (5 điểm)
                </span>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
                  <li>5.1 Công tác chủ nhiệm (3đ)</li>
                  <li>5.2 Nhiệm vụ kiêm nhiệm, phối hợp (2đ)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200">
                <span className="font-bold text-cyan-900 text-sm block">
                  Nhóm 6 – Đổi mới, Chuyển đổi số & Đóng góp (10 điểm)
                </span>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
                  <li>6.1 CNTT/chuyển đổi số/AI (5đ)</li>
                  <li>6.2 Phong trào, hoạt động chung (3đ)</li>
                  <li>6.3 Sáng kiến/giải pháp (2đ)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'VERSIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800">
            Lịch sử phiên bản Quy chế thi đua
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-900 text-sm">{regulation.version}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Đang có hiệu lực
                  </span>
                </div>
                <div className="text-slate-600 mt-1">
                  {regulation.title} • Ký ban hành bởi {regulation.signer} vào ngày {regulation.issueDate}.
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Tập tin lưu trữ: <span className="font-mono">{regulation.fileName}</span>
                </div>
              </div>

              <a
                href={regulation.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0"
              >
                Tải văn bản
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
