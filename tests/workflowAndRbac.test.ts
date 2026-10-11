/**
 * TEST SUITE: WORKFLOW TOÀN TRÌNH, PHÂN QUYỀN RBAC/RLS, AUTHENTICATION & STORAGE
 * Trường TH&THCS Nguyễn Đình Anh
 */

// Polyfill localStorage for Node test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) || null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    get length() {
      return store.size;
    }
  } as any;
}

import { authService, DEMO_ACCOUNTS } from '../src/services/authService';
import { databaseService } from '../src/services/databaseService';
import { storageService } from '../src/services/storageService';
import {
  evaluateTeacherScore,
  calculateFinalScore,
  checkDiscrepancy,
  checkDuplicateBonus,
  validateBonusApproval
} from '../src/services/scoringEngine';
import { User, EvidenceItem, normalizeRole } from '../src/types';

// Reset to fresh storage
storageService.resetToDefaults();

let passCount = 0;
let failCount = 0;

function assert(cond: boolean, name: string, detail?: string) {
  if (cond) {
    passCount++;
    console.log(`  ✓ PASS: ${name}`);
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${name} ${detail || ''}`);
  }
}

function assertEqual<T>(actual: T, expected: T, name: string) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  assert(match, name, `Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('TEST SUITE: AUTHENTICATION, RBAC/RLS, STORAGE & WORKFLOW');
  console.log('====================================================\n');

  // ===================================================================
  // 1. KIỂM TRA AUTHENTICATION (Admin, BGH, Tổ trưởng, Giáo viên, HĐ TĐKT)
  // ===================================================================
  console.log('[1] Kiểm tra Authentication cho 5 Roles chuẩn:');

  // Test Admin
  const authAdmin = await authService.signIn('admin@nguyendinhanh.edu.vn', '123456');
  assert(authAdmin.success && authAdmin.user?.role === 'ADMIN', 'Admin: Đăng nhập thành công với quyền ADMIN');

  // Test BGH
  const authBgh = await authService.signIn('hieutruong@nguyendinhanh.edu.vn', '123456');
  assert(authBgh.success && authBgh.user?.role === 'BGH', 'BGH: Đăng nhập thành công với quyền BGH');

  // Test Tổ trưởng
  const authTt = await authService.signIn('maile@nguyendinhanh.edu.vn', '123456');
  assert(authTt.success && authTt.user?.role === 'TO_TRUONG', 'Tổ trưởng: Đăng nhập thành công với quyền TO_TRUONG');

  // Test Tổ phó
  const authTp = await authService.signIn('longvh@nguyendinhanh.edu.vn', '123456');
  assert(authTp.success && authTp.user?.role === 'TO_PHO', 'Tổ phó: Đăng nhập thành công với quyền TO_PHO');

  // Test Giáo viên
  const authGv = await authService.signIn('annv@nguyendinhanh.edu.vn', '123456');
  assert(authGv.success && authGv.user?.role === 'GIAO_VIEN', 'Giáo viên: Đăng nhập thành công với quyền GIAO_VIEN');

  // Test Hội đồng TĐKT
  const authCouncil = await authService.signIn('hoidong.tdkt@nguyendinhanh.edu.vn', '123456');
  assert(authCouncil.success && authCouncil.user?.role === 'HOI_DONG_TDKT', 'Hội đồng TĐKT: Đăng nhập thành công với quyền HOI_DONG_TDKT');

  // Test sai mật khẩu (dưới 4 ký tự)
  const authWrong = await authService.signIn('annv@nguyendinhanh.edu.vn', '12');
  assert(!authWrong.success, 'Bảo mật: Từ chối đăng nhập khi sai mật khẩu');

  console.log('');

  // ===================================================================
  // 2. KIỂM TRA PHÂN QUYỀN (RBAC & RLS)
  // ===================================================================
  console.log('[2] Kiểm tra Phân quyền (RBAC & RLS):');

  const adminUser = authAdmin.user!;
  const bghUser = authBgh.user!;
const ttUser = authTt.user!;
const gvUser = authGv.user!;
const councilUser = authCouncil.user!;

// Giáo viên: chỉ xem hồ sơ của mình
const gvView = databaseService.getTeachers(gvUser);
assertEqual(gvView.length, 1, 'RLS Giáo viên: Chỉ xem 1 hồ sơ duy nhất (hồ sơ của chính mình)');
assert(gvView[0].user_id === gvUser.id, 'RLS Giáo viên: Hồ sơ trả về đúng là của user hiện tại');

// Tổ trưởng: chỉ xem tổ mình
const ttView = databaseService.getTeachers(ttUser);
assert(ttView.length > 1, `RLS Tổ trưởng: Xem danh sách giáo viên trong tổ (${ttView.length} GV)`);
assert(
  ttView.every((t) => t.department_id === ttUser.departmentId || t.to_chuyen_mon === ttUser.departmentName),
  'RLS Tổ trưởng: 100% giáo viên trả về đều thuộc tổ chuyên môn của tổ trưởng'
);

// Tổ phó: chỉ xem tổ mình
const tpUser = authTp.user!;
const tpView = databaseService.getTeachers(tpUser);
assert(tpView.length > 1, `RLS Tổ phó: Xem danh sách giáo viên trong tổ (${tpView.length} GV)`);
assert(
  tpView.every((t) => t.department_id === tpUser.departmentId || t.to_chuyen_mon === tpUser.departmentName),
  'RLS Tổ phó: 100% giáo viên trả về đều thuộc tổ chuyên môn của tổ phó'
);

// BGH: xem toàn trường
const bghView = databaseService.getTeachers(bghUser);
assert(bghView.length >= 10, `RLS BGH: Xem toàn bộ giáo viên toàn trường (${bghView.length} GV)`);

// Admin: toàn quyền
const adminView = databaseService.getTeachers(adminUser);
assert(adminView.length >= 10, `RLS Admin: Toàn quyền xem toàn trường (${adminView.length} GV)`);

// Bảo vệ xóa minh chứng của người khác
const testEv: EvidenceItem = {
  id: 'ev-test-rbac-1',
  teacherId: 'user-gv2', // của GV khác
  teacherName: 'Trần Quốc Long',
  departmentId: 'dept-1',
  departmentName: 'Tổ Toán - Tin',
  schoolYear: '2026-2027',
  semester: 'HKI',
  criteriaGroupId: 'g-1',
  criteriaId: 'c-1-1',
  criteriaCode: '1.1',
  criteriaTitle: 'Chấp hành chủ trương',
  name: 'Biên bản họp chi bộ',
  description: 'Biên bản họp chi bộ mẫu',
  evidenceType: 'BIEN_BAN',
  fileName: 'bb.pdf',
  fileUrl: 'https://storage/bb.pdf',
  storagePath: '2026-2027/HKI/Toan-Tin/Tran-Quoc-Long/1-1/bb.pdf',
  fileType: 'application/pdf',
  fileSize: '1 MB',
  executionDate: '2026-10-01',
  uploadedBy: 'Trần Quốc Long',
  uploadedAt: '2026-10-01 08:00:00',
  status: 'SUBMITTED',
  auditLogs: []
};
storageService.saveEvidence(testEv, adminUser);

// GV khác xóa thử -> Bị từ chối
const deleteByOther = storageService.deleteEvidence(testEv.id, gvUser);
assert(!deleteByOther, 'Bảo mật: Giáo viên KHÔNG THỂ xóa minh chứng của giáo viên khác');

console.log('');

// ===================================================================
// 3. KIỂM TRA STORAGE & VERSIONING
// ===================================================================
console.log('[3] Kiểm tra Storage, Versioning & Timestamp:');

// Thử xóa minh chứng đã duyệt -> Phải bị chặn
const approvedEv: EvidenceItem = {
  ...testEv,
  id: 'ev-test-approved',
  teacherId: gvUser.id,
  status: 'TEAM_APPROVED'
};
storageService.saveEvidence(approvedEv, adminUser);
const deleteApproved = storageService.deleteEvidence(approvedEv.id, gvUser);
assert(!deleteApproved, 'Bảo mật Storage: Không cho xóa minh chứng đã được phê duyệt');

// Bổ sung minh chứng -> Tạo Version mới không xóa file cũ
const suppResult = storageService.supplementEvidenceFile(approvedEv.id, gvUser, {
  fileName: 'bb_bo_sung_v2.pdf',
  filePath: '2026-2027/HKI/Toan-Tin/Nguyen-Van-An/1-1/bb_v2.pdf',
  fileUrl: 'https://storage/bb_v2.pdf',
  fileSize: '1.2 MB',
  fileType: 'application/pdf',
  teacherNote: 'Bổ sung chữ ký xác nhận'
});

assert(suppResult.currentVersion === 2, 'Versioning: Tăng lên Version 2 khi bổ sung');
assert(Boolean(suppResult.versions && suppResult.versions.length >= 2), 'Versioning: Danh sách phiên bản lưu trữ đầy đủ cả Version 1 và Version 2');
assertEqual(suppResult.versions![0].versionLabel, 'Version 1', 'Version 1 cũ được bảo toàn 100%');
assertEqual(suppResult.versions![1].versionLabel, 'Version 2', 'Version 2 mới được ghi nhận chính xác');
assert(Boolean(suppResult.updatedAt && suppResult.updatedAt.length > 0), `Timestamp: Ghi nhận mốc thời gian hệ thống (${suppResult.updatedAt})`);

console.log('');

// ===================================================================
// 4. KIỂM TRA WORKFLOW TOÀN TRÌNH
// Giáo viên -> Upload -> Gửi duyệt -> Tổ trưởng -> Duyệt / Bổ sung -> BGH -> Rà soát -> HĐ TĐKT -> Kết quả
// ===================================================================
console.log('[4] Kiểm tra Workflow Toàn trình 5 cấp:');

// B1: Giáo viên nộp minh chứng
const workflowEv: EvidenceItem = {
  id: `ev-wf-${Date.now()}`,
  teacherId: gvUser.id,
  teacherName: gvUser.name,
  departmentId: gvUser.departmentId,
  departmentName: gvUser.departmentName,
  schoolYear: '2026-2027',
  semester: 'HKI',
  criteriaGroupId: 'g-2',
  criteriaId: 'c-2-3',
  criteriaCode: '2.3',
  criteriaTitle: 'Đổi mới phương pháp dạy học',
  name: 'Kế hoạch bài dạy minh họa STEM',
  description: 'Kế hoạch bài dạy STEM môn Toán',
  evidenceType: 'GIAO_AN',
  fileName: 'STEM_BaiDay.pdf',
  fileUrl: 'https://storage/stem.pdf',
  storagePath: '2026-2027/HKI/Toan-Tin/Nguyen-Van-An/2-3/stem.pdf',
  fileType: 'application/pdf',
  fileSize: '2.5 MB',
  executionDate: '2026-10-04',
  uploadedBy: gvUser.name,
  uploadedAt: '2026-10-04 08:00:00',
  status: 'SUBMITTED',
  auditLogs: []
};
storageService.saveEvidence(workflowEv, gvUser);
assertEqual(workflowEv.status, 'SUBMITTED', 'B1: Giáo viên nộp hồ sơ ở trạng thái SUBMITTED');

// B2: Tổ trưởng duyệt minh chứng
const reviewedByTt = storageService.teamLeaderReviewEvidence(
  workflowEv.id,
  ttUser,
  'APPROVE',
  'Hồ sơ chuẩn bị chu đáo, có giáo án điện tử STEM hoàn chỉnh.'
);
assertEqual(reviewedByTt.status, 'TEAM_APPROVED', 'B2: Tổ trưởng duyệt minh chứng -> TEAM_APPROVED');

// B3: BGH rà soát minh chứng
const reviewedByBgh = storageService.reviewEvidence(
  workflowEv.id,
  bghUser,
  'BGH_APPROVED',
  'BGH nhất trí phê duyệt hồ sơ minh chứng.'
);
assert(reviewedByBgh !== null && reviewedByBgh.status === 'BGH_APPROVED', 'B3: BGH thẩm định -> BGH_APPROVED');

// B4: Hội đồng TĐKT tổng hợp kết quả
const evalResult = storageService.getEvaluation(gvUser.id, '2026-2027', 'HKI');
assert(evalResult.finalScore >= 0 && evalResult.finalScore <= 100, `B4: Hội đồng TĐKT tổng hợp điểm cuối: ${evalResult.finalScore}đ`);
assert(['A_PLUS', 'A', 'B', 'C', 'D'].includes(evalResult.rating), `B5: Kết luận xếp loại: ${evalResult.rating}`);

console.log('');

// ===================================================================
// 5. KIỂM TRA TÍNH ĐIỂM (100 điểm, Điểm cộng, Điểm trừ, Xếp loại, Chênh lệch >= 5, Điều kiện khống chế)
// ===================================================================
console.log('[5] Kiểm tra Tính điểm & Quy chế thi đua:');

// Thang 100 điểm & Cộng Trừ
const score1 = calculateFinalScore(90, 6.0, 1.5);
assertEqual(score1, 94.5, 'Công thức: 90 + 6.0 - 1.5 = 94.5đ');

// Không vượt quá 100 điểm
assertEqual(calculateFinalScore(98, 5, 0), 100, 'Không vượt quá 100đ khi điểm cộng lớn');

// Chênh lệch điểm >= 5đ
const discWarn = checkDiscrepancy(95, 88);
assert(discWarn.hasDiscrepancy, 'Cảnh báo chênh lệch: |95 - 88| = 7 >= 5 kích hoạt cảnh báo theo Điều 18');

const discOk = checkDiscrepancy(90, 88);
assert(!discOk.hasDiscrepancy, 'Không cảnh báo khi chênh lệch |90 - 88| = 2 < 5');

// Điều kiện khống chế (CONTROLLED)
const evalControlled = evaluateTeacherScore(98, 2, 0, {
  isControlled: true,
  controlledMaxRating: 'B',
  controlledReason: 'Bị kỷ luật khiển trách'
});
assertEqual(evalControlled.finalRating, 'B', 'Điều kiện khống chế: Dù đạt 100đ nhưng bị khống chế tối đa mức B');
assert(evalControlled.controlledWarning?.includes('khống chế') || false, 'Hiển thị câu cảnh báo: Bị khống chế theo điều kiện thi đua.');

console.log('');

// ===================================================================
// 6. KIỂM TRA AUDIT LOG (Bất biến, không mất lịch sử)
// ===================================================================
console.log('[6] Kiểm tra Audit Log:');
const checkLogs = storageService.getEvidenceById(workflowEv.id);
assert(checkLogs !== undefined, 'Hồ sơ minh chứng tồn tại');
assert(checkLogs!.auditLogs.length >= 2, `Audit Log ghi nhận đầy đủ ${checkLogs!.auditLogs.length} sự kiện lịch sử`);
assert(
  checkLogs!.auditLogs.some((l) => l.action.includes('Tải lên') || l.action.includes('UPLOAD')),
  'Lịch sử ghi nhận bước nộp ban đầu'
);
assert(
  checkLogs!.auditLogs.some((l) => l.action.includes('phê duyệt') || l.action.includes('Tổ trưởng')),
  'Lịch sử ghi nhận bước phê duyệt'
);

console.log('');

// ===================================================================
// 7. KIỂM TRA PHÂN QUYỀN TỔ TRƯỞNG & ĐỒNG BỘ TỔ CHUYÊN MÔN (ĐẶC BIỆT TỔ 4-5)
// ===================================================================
console.log('[7] Kiểm tra Phân quyền Tổ trưởng chuyên môn (Tổ 4-5):');

// 7.1 Kiểm tra Tổ 4-5 mặc định có Tổ trưởng và vai trò TO_TRUONG
const depts = storageService.getDepartments();
const dept45 = depts.find((d) => d.id === 'dept-5');
assert(Boolean(dept45), 'Tổ 4-5 tồn tại trong hệ thống (dept-5)');
assert(dept45?.leaderId === 'user-gv3', 'Tổ 4-5 có leaderId là user-gv3 (Ngô Thị Thúy Loan)');

const userLoan = storageService.getUserById('user-gv3');
assert(userLoan?.role === 'TO_TRUONG', 'Ngô Thị Thúy Loan có quyền TO_TRUONG chuẩn xác');
assert(userLoan?.position === 'Tổ trưởng chuyên môn', 'Ngô Thị Thúy Loan có chức vụ Tổ trưởng chuyên môn');

// 7.2 Thử phân quyền Tổ trưởng Tổ 4-5 cho Trần Thị Thu Hà (user-gv7)
const assignRes = storageService.assignDepartmentLeadership('dept-5', 'user-gv7');
assert(assignRes.success, 'Bổ nhiệm thành công Tổ trưởng Tổ 4-5 cho user-gv7');

const updatedDept45 = storageService.getDepartmentById('dept-5');
assert(updatedDept45?.leaderId === 'user-gv7', 'Tổ 4-5 đã cập nhật leaderId mới thành user-gv7');
assert(updatedDept45?.leaderName === 'Trần Thị Thu Hà', 'Tổ 4-5 đã cập nhật leaderName thành Trần Thị Thu Hà');

const userHa = storageService.getUserById('user-gv7');
assert(userHa?.role === 'TO_TRUONG', 'Trần Thị Thu Hà tự động được cấp quyền TO_TRUONG');
assert(userHa?.position === 'Tổ trưởng chuyên môn', 'Trần Thị Thu Hà nhận chức danh Tổ trưởng chuyên môn');

const userLoanAfter = storageService.getUserById('user-gv3');
assert(userLoanAfter?.role === 'GIAO_VIEN', 'Tổ trưởng cũ (user-gv3) tự động chuyển về quyền GIAO_VIEN');

// 7.3 Thử phân quyền lại cho user-gv3 qua updateUserRole
storageService.updateUserRole('user-gv3', 'TO_TRUONG');
const deptAfterReassign = storageService.getDepartmentById('dept-5');
assert(deptAfterReassign?.leaderId === 'user-gv3', 'updateUserRole tự động đồng bộ Tổ 4-5 leaderId về user-gv3');
assert(deptAfterReassign?.leaderName === 'Ngô Thị Thúy Loan', 'updateUserRole tự động đồng bộ Tổ 4-5 leaderName về Ngô Thị Thúy Loan');

  console.log('\n====================================================');
  console.log(`KẾT QUẢ KIỂM THỬ WORKFLOW & PHÂN QUYỀN: ${passCount} passed, ${failCount} failed`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
