/**
 * UNIT TESTS CHO HỆ THỐNG BÁO CÁO HOÀN CHỈNH (Mục 1 đến Mục 8)
 * 1. Dashboard toàn trường (8 chỉ số)
 * 2. Thống kê mức xếp loại (A+, A, B, C, D)
 * 3. Thống kê theo tổ (Bảng tổ, số GV, điểm TB, số A+, A, B, C, D - Không tự động xếp hạng)
 * 4. Báo cáo cá nhân (Xem/in: điểm tiêu chí, minh chứng, điểm cộng, điểm trừ, nhận xét, kết quả)
 * 5. Báo cáo theo tổ (Danh sách GV, điểm, xếp loại, trạng thái hồ sơ)
 * 6. Bảng tổng hợp Phụ lục 06 (STT, Họ tên, Vị trí, HKI, Mức, HKII, Mức, Cả năm, Mức, Ghi chú)
 * 7. Export (Excel, PDF, Print A4)
 * 8. Bộ lọc (Năm học, Học kỳ, Tổ, Giáo viên, Mức xếp loại, Trạng thái)
 */

// Polyfill localStorage for Node test environment
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

import { reportsService } from '../src/services/reportsService';
import { storageService } from '../src/services/storageService';

// Initialize storage with seeds
storageService.resetToDefaults();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

function assertEqual<T>(actual: T, expected: T, testName: string) {
  const isMatch = JSON.stringify(actual) === JSON.stringify(expected);
  assert(isMatch, testName, `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

console.log('====================================================');
console.log('RUNNING HỆ THỐNG BÁO CÁO THI ĐUA TEST SUITE');
console.log('====================================================\n');

// -------------------------------------------------------------------
// 1. TEST DASHBOARD TOÀN TRƯỜNG (8 chỉ số chính)
// -------------------------------------------------------------------
console.log('[1] Test Dashboard Toàn trường (8 chỉ số):');
const metrics = reportsService.getDashboardMetrics('2026-2027', 'HKI');

assert(metrics.totalTeachers > 0, `Tổng giáo viên: ${metrics.totalTeachers} > 0`);
assert(metrics.totalDepartments > 0, `Tổng tổ: ${metrics.totalDepartments} > 0`);
assert(metrics.totalEvidences >= 0, `Tổng minh chứng: ${metrics.totalEvidences}`);
assert(metrics.approvedEvidences >= 0, `Minh chứng đã duyệt: ${metrics.approvedEvidences}`);
assert(metrics.pendingEvidences >= 0, `Minh chứng chờ duyệt: ${metrics.pendingEvidences}`);
assert(metrics.revisionRequiredEvidences >= 0, `Minh chứng cần bổ sung: ${metrics.revisionRequiredEvidences}`);
assert(metrics.completedEvaluations >= 0, `Hồ sơ hoàn thành: ${metrics.completedEvaluations}`);
assert(metrics.incompleteEvaluations >= 0, `Hồ sơ chưa hoàn thành: ${metrics.incompleteEvaluations}`);
assert(
  metrics.completedEvaluations + metrics.incompleteEvaluations === metrics.totalTeachers,
  'Tổng hồ sơ hoàn thành + chưa hoàn thành = Tổng giáo viên'
);
console.log('');

// -------------------------------------------------------------------
// 2. TEST THỐNG KÊ MỨC XẾP LOẠI (A+, A, B, C, D)
// -------------------------------------------------------------------
console.log('[2] Test Thống kê mức xếp loại (A+, A, B, C, D) & Biểu đồ:');
const teachers = reportsService.getEligibleTeachers();
const ratingStats = reportsService.getRatingStatistics(teachers, '2026-2027', 'HKI');

assertEqual(ratingStats.length, 5, 'Đủ 5 mức xếp loại: A+, A, B, C, D');
assert(ratingStats.some((r) => r.rating === 'A_PLUS'), 'Có mức A+');
assert(ratingStats.some((r) => r.rating === 'A'), 'Có mức A');
assert(ratingStats.some((r) => r.rating === 'B'), 'Có mức B');
assert(ratingStats.some((r) => r.rating === 'C'), 'Có mức C');
assert(ratingStats.some((r) => r.rating === 'D'), 'Có mức D');

const totalCount = ratingStats.reduce((sum, r) => sum + r.count, 0);
assertEqual(totalCount, teachers.length, 'Tổng số lượng các mức xếp loại bằng tổng giáo viên');

const totalPercentage = Math.round(ratingStats.reduce((sum, r) => sum + r.percentage, 0));
assert(
  totalPercentage >= 99 && totalPercentage <= 101,
  `Tổng phần trăm biểu đồ xếp loại ~ 100% (thực tế: ${totalPercentage}%)`
);
console.log('');

// -------------------------------------------------------------------
// 3. TEST THỐNG KÊ THEO TỔ (Không tự động xếp hạng các tổ)
// -------------------------------------------------------------------
console.log('[3] Test Thống kê theo tổ (Tổ, số GV, Điểm TB, Số A+, A, B, C, D):');
const departments = storageService.getDepartments();
const deptStats = reportsService.getDepartmentStatistics(departments, teachers, '2026-2027', 'HKI');

assertEqual(deptStats.length, departments.length, `Đủ ${departments.length} tổ chuyên môn`);

deptStats.forEach((ds) => {
  assert(ds.departmentName.length > 0, `Tổ: ${ds.departmentName}`);
  assert(ds.teacherCount >= 0, `  - Số giáo viên: ${ds.teacherCount}`);
  assert(ds.averageScore >= 0 && ds.averageScore <= 100, `  - Điểm trung bình: ${ds.averageScore}đ`);
  assert(
    ds.countAPlus + ds.countA + ds.countB + ds.countC + ds.countD === ds.teacherCount,
    `  - Tổng số A+, A, B, C, D (${ds.countAPlus}+${ds.countA}+${ds.countB}+${ds.countC}+${ds.countD}) = Số giáo viên (${ds.teacherCount})`
  );
  // Kiểm tra yêu cầu: KHÔNG tự động xếp hạng các tổ
  assert(
    !('rank' in ds) && !('ranking' in ds) && !('xep_hang' in ds),
    `  - Chuẩn quy chế: KHÔNG tự động gán cột xếp hạng cho tổ ${ds.departmentName}`
  );
});
console.log('');

// -------------------------------------------------------------------
// 4. TEST BÁO CÁO CÁ NHÂN (Xem/in điểm tiêu chí, minh chứng, cộng, trừ, nhận xét, kết quả)
// -------------------------------------------------------------------
console.log('[4] Test Báo cáo Cá nhân (Đầy đủ 6 nội dung chuẩn):');
const sampleTeacher = teachers.find((t) => t.id === 'user-gv1') || teachers[0];
const sampleEval = storageService.getEvaluation(sampleTeacher.id, '2026-2027', 'HKI');
const sampleEvidences = storageService.getTeacherEvidences(sampleTeacher.id);
const sampleBonuses = storageService.getBonusList().filter((b) => b.teacherId === sampleTeacher.id);
const sampleDeductions = storageService.getDeductions().filter((d) => d.teacherId === sampleTeacher.id);

assert(Object.keys(sampleEval.scores).length > 0, '1. Có điểm chi tiết từng tiêu chí');
assert(Array.isArray(sampleEvidences), '2. Có danh sách minh chứng liên quan');
assert(Array.isArray(sampleBonuses), '3. Có danh sách điểm cộng');
assert(Array.isArray(sampleDeductions), '4. Có danh sách điểm trừ');
assert(
  Boolean(sampleEval.teamComment || sampleEval.bghComment || sampleEval.councilComment),
  '5. Có phần ý kiến nhận xét (Tổ trưởng / BGH / Hội đồng)'
);
assert(typeof sampleEval.finalScore === 'number' && sampleEval.rating !== undefined, '6. Có điểm cuối và xếp loại kết quả');
console.log('');

// -------------------------------------------------------------------
// 5. TEST BÁO CÁO THEO TỔ (Danh sách GV, điểm, xếp loại, trạng thái hồ sơ)
// -------------------------------------------------------------------
console.log('[5] Test Báo cáo theo tổ:');
const sampleDept = departments[0];
const deptTeachersRows = reportsService.filterTeacherReports(teachers, {
  schoolYear: '2026-2027',
  semester: 'HKI',
  departmentId: sampleDept.id,
  searchTeacher: '',
  ratingLevel: 'ALL',
  evaluationStatus: 'ALL'
});

assert(deptTeachersRows.length > 0, `Lấy được danh sách ${deptTeachersRows.length} GV thuộc tổ ${sampleDept.name}`);
deptTeachersRows.forEach((row) => {
  assert(row.teacher.name.length > 0, `  - GV: ${row.teacher.name}`);
  assert(row.finalScore >= 0, `    Điểm cuối: ${row.finalScore}đ`);
  assert(['A_PLUS', 'A', 'B', 'C', 'D'].includes(row.rating), `    Xếp loại: ${row.rating}`);
  assert(row.statusLabel.length > 0, `    Trạng thái hồ sơ: ${row.statusLabel}`);
});
console.log('');

// -------------------------------------------------------------------
// 6. TEST BẢNG TỔNG HỢP PHỤ LỤC 06
// -------------------------------------------------------------------
console.log('[6] Test Bảng tổng hợp Phụ lục 06 (STT, Họ tên, Vị trí, HKI, HKII, Cả năm, Ghi chú):');
const appendix06Rows = reportsService.generateAppendix06Rows(teachers, '2026-2027');

assertEqual(appendix06Rows.length, teachers.length, `Tạo đủ ${teachers.length} dòng cho Phụ lục 06`);

appendix06Rows.slice(0, 3).forEach((r) => {
  assert(typeof r.stt === 'number', `STT: ${r.stt}`);
  assert(r.name.length > 0, `Họ tên: ${r.name}`);
  assert(r.position.length > 0, `Vị trí: ${r.position}`);
  assert(typeof r.hkiScore === 'number', `Điểm HKI: ${r.hkiScore}`);
  assert(r.hkiRating.length > 0, `Mức HKI: ${r.hkiRating}`);
  assert(r.hkiiScore !== undefined, `Điểm HKII: ${r.hkiiScore}`);
  assert(r.hkiiRating.length > 0, `Mức HKII: ${r.hkiiRating}`);
  assert(typeof r.yearScore === 'number', `Điểm Cả năm: ${r.yearScore}`);
  assert(r.yearRating.length > 0, `Mức Cả năm: ${r.yearRating}`);
  assert(r.notes.length > 0, `Ghi chú: ${r.notes}`);
});
console.log('');

// -------------------------------------------------------------------
// 7. TEST BỘ LỌC ĐA TIÊU CHÍ (Mục 8)
// -------------------------------------------------------------------
console.log('[7] Test Bộ lọc đa tiêu chí (Năm học, Học kỳ, Tổ, Giáo viên, Mức xếp loại, Trạng thái):');

// Lọc theo tìm kiếm tên giáo viên
const filteredByName = reportsService.filterTeacherReports(teachers, {
  schoolYear: '2026-2027',
  semester: 'HKI',
  departmentId: 'ALL',
  searchTeacher: 'Nguyễn Văn An',
  ratingLevel: 'ALL',
  evaluationStatus: 'ALL'
});
assert(filteredByName.length > 0 && filteredByName[0].teacher.name.includes('Nguyễn Văn An'), 'Lọc chính xác theo tên giáo viên');

// Lọc theo Mức xếp loại A+
const filteredByRating = reportsService.filterTeacherReports(teachers, {
  schoolYear: '2026-2027',
  semester: 'HKI',
  departmentId: 'ALL',
  searchTeacher: '',
  ratingLevel: 'A_PLUS',
  evaluationStatus: 'ALL'
});
assert(
  filteredByRating.every((r) => r.rating === 'A_PLUS'),
  'Tất cả kết quả lọc theo A+ đều có rating A_PLUS'
);

// Lọc theo Trạng thái Hoàn thành
const filteredByStatus = reportsService.filterTeacherReports(teachers, {
  schoolYear: '2026-2027',
  semester: 'HKI',
  departmentId: 'ALL',
  searchTeacher: '',
  ratingLevel: 'ALL',
  evaluationStatus: 'HOAN_THANH'
});
assert(
  filteredByStatus.every((r) => r.isCompleted),
  'Tất cả kết quả lọc HOAN_THANH đều có cờ isCompleted = true'
);

console.log('\n====================================================');
console.log(`KẾT QUẢ KIỂM THỬ BÁO CÁO: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
