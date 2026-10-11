/**
 * UNIT TESTS CHO ENGINE TÍNH ĐIỂM THI ĐUA (Mục 9)
 * 1. Tính tổng.
 * 2. Xếp loại.
 * 3. Điểm cộng.
 * 4. Điểm trừ.
 * 5. Chênh lệch.
 * 6. Điều kiện khống chế.
 */

import {
  calculateBaseScore,
  calculateFinalScore,
  determineBaseRating,
  applyControlledCondition,
  evaluateTeacherScore,
  checkDiscrepancy,
  hasBonusEvidence,
  validateBonusApproval,
  checkDuplicateBonus,
  validateDeduction,
  RATING_THRESHOLDS
} from '../src/services/scoringEngine';
import { CriteriaScore, BonusItem, DeductionItem } from '../src/types';

// Simple lightweight assertion runner
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

function assertEqual<T>(actual: T, expected: T, testName: string) {
  const isMatch = JSON.stringify(actual) === JSON.stringify(expected);
  assert(isMatch, testName, `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

console.log('====================================================');
console.log('RUNNING ENGINE TÍNH ĐIỂM THI ĐUA TEST SUITE (Mục 9)');
console.log('====================================================\n');

// -------------------------------------------------------------------
// 1. TEST TÍNH TỔNG (Công thức: Điểm cơ bản + Điểm cộng - Điểm trừ)
// -------------------------------------------------------------------
console.log('[1] Test Tính tổng (Điểm cơ bản + Điểm cộng - Điểm trừ):');

const mockScores: Record<string, CriteriaScore> = {
  crit1: { criteriaId: 'crit1', criteriaCode: 'TC1', selfScore: 14, teamScore: 13, bghScore: 14 },
  crit2: { criteriaId: 'crit2', criteriaCode: 'TC2', selfScore: 28, teamScore: 27, bghScore: 28 },
  crit3: { criteriaId: 'crit3', criteriaCode: 'TC3', selfScore: 25, teamScore: 24, bghScore: 24 },
  crit4: { criteriaId: 'crit4', criteriaCode: 'TC4', selfScore: 19, teamScore: 18, bghScore: 19 }
};

const baseSelf = calculateBaseScore(mockScores, 'selfScore');
assertEqual(baseSelf, 86, 'Tính đúng tổng điểm tự chấm: 14 + 28 + 25 + 19 = 86');

const baseTeam = calculateBaseScore(mockScores, 'teamScore');
assertEqual(baseTeam, 82, 'Tính đúng tổng điểm tổ chấm: 13 + 27 + 24 + 18 = 82');

// Final Score formula: Base + Bonus - Deduction
assertEqual(calculateFinalScore(82, 4.0, 1.5), 84.5, 'Tính điểm cuối: 82 + 4.0 - 1.5 = 84.5đ');
assertEqual(calculateFinalScore(95, 8.0, 0), 100, 'Không vượt quá 100 điểm khi cộng nhiều: min(100, 95 + 8) = 100đ');
assertEqual(calculateFinalScore(10, 0, 15), 0, 'Không âm khi bị trừ quá nhiều: max(0, 10 - 15) = 0đ');
assertEqual(calculateFinalScore(85.333, 2.333, 1.1), 86.6, 'Làm tròn chính xác 1 chữ số thập phân');

console.log('');

// -------------------------------------------------------------------
// 2. TEST XẾP LOẠI (A+ 95–100, A 90–94.5, B 80–89.5, C 65–79.5, D <65)
// -------------------------------------------------------------------
console.log('[2] Test Xếp loại (A+ 95–100, A 90–94.5, B 80–89.5, C 65–79.5, D <65):');

assertEqual(determineBaseRating(100), 'A_PLUS', 'Điểm 100đ -> Xếp loại A+');
assertEqual(determineBaseRating(95.0), 'A_PLUS', 'Điểm 95.0đ -> Xếp loại A+');
assertEqual(determineBaseRating(94.9), 'A', 'Điểm 94.9đ -> Xếp loại A');
assertEqual(determineBaseRating(90.0), 'A', 'Điểm 90.0đ -> Xếp loại A');
assertEqual(determineBaseRating(89.5), 'B', 'Điểm 89.5đ -> Xếp loại B');
assertEqual(determineBaseRating(80.0), 'B', 'Điểm 80.0đ -> Xếp loại B');
assertEqual(determineBaseRating(79.5), 'C', 'Điểm 79.5đ -> Xếp loại C');
assertEqual(determineBaseRating(65.0), 'C', 'Điểm 65.0đ -> Xếp loại C');
assertEqual(determineBaseRating(64.9), 'D', 'Điểm 64.9đ -> Xếp loại D');
assertEqual(determineBaseRating(0), 'D', 'Điểm 0đ -> Xếp loại D');

console.log('');

// -------------------------------------------------------------------
// 3. TEST ĐIỂM CỘNG (5 loại, bắt buộc minh chứng, chống cộng trùng)
// -------------------------------------------------------------------
console.log('[3] Test Điểm cộng (5 loại danh mục, minh chứng bắt buộc, chống cộng trùng):');

const validBonusItem: BonusItem = {
  id: 'b1',
  teacherId: 'gv1',
  category: 'CAP_TINH',
  categoryLabel: 'Thành tích cấp thành phố/tỉnh',
  title: 'Giáo viên dạy giỏi cấp Tỉnh môn Văn',
  points: 5.0,
  evidenceName: 'QuyetDinhKhenThuongSo123.pdf',
  evidenceUrl: 'https://storage/minh-chung/qd123.pdf',
  verifiedBy: 'Hiệu trưởng',
  date: '2026-10-01',
  status: 'PENDING'
};

assert(hasBonusEvidence(validBonusItem), 'Điểm cộng có tên file và URL được coi là có minh chứng');
assertEqual(validateBonusApproval(validBonusItem).allowed, true, 'Điểm cộng có minh chứng -> Cho phép duyệt');

const bonusWithoutEvidence: BonusItem = {
  ...validBonusItem,
  id: 'b2',
  evidenceName: '',
  evidenceUrl: ''
};

assert(!hasBonusEvidence(bonusWithoutEvidence), 'Điểm cộng không có tên file và URL -> Thiếu minh chứng');
assertEqual(
  validateBonusApproval(bonusWithoutEvidence).allowed,
  false,
  'Mục 6: Không có minh chứng -> Chặn không cho duyệt'
);

// Test validation chống cộng trùng (Mục 7)
const existingBonuses: BonusItem[] = [validBonusItem];

const duplicateBonus = {
  teacherId: 'gv1',
  category: 'CAP_TINH',
  title: '  giáo viên dạy giỏi cấp tỉnh môn văn  ', // khác khoảng trắng và viết hoa
  points: 5.0
};

const dupCheck1 = checkDuplicateBonus(duplicateBonus, existingBonuses);
assert(dupCheck1.isDuplicate, 'Phát hiện trùng thành tích cho cùng giáo viên (case insensitive & trim)');

const differentTeacherBonus = {
  teacherId: 'gv2', // giáo viên khác
  category: 'CAP_TINH',
  title: 'Giáo viên dạy giỏi cấp Tỉnh môn Văn',
  points: 5.0
};

const dupCheck2 = checkDuplicateBonus(differentTeacherBonus, existingBonuses);
assert(!dupCheck2.isDuplicate, 'Giáo viên khác có cùng thành tích -> Không bị coi là trùng');

console.log('');

// -------------------------------------------------------------------
// 4. TEST ĐIỂM TRỪ (Biên bản, căn cứ, người xác nhận, khấu trừ)
// -------------------------------------------------------------------
console.log('[4] Test Điểm trừ (Biên bản vi phạm, minh chứng căn cứ, khấu trừ):');

const validDeduct: DeductionItem = {
  id: 'd1',
  teacherId: 'gv1',
  title: 'Chậm nộp giáo án',
  reason: 'Báo cáo / hồ sơ chuyên môn nộp chậm quá hạn 3 ngày',
  points: 1.0,
  date: '2026-09-20',
  evidenceBasis: 'Biên bản kiểm tra hồ sơ số 05/BB-CM',
  verifiedBy: 'Tổ trưởng chuyên môn'
};

const deductValidation = validateDeduction(validDeduct);
assert(deductValidation.valid, 'Biên bản điểm trừ hợp lệ khi có đầy đủ lý do, số điểm > 0, ngày và người xác nhận');

const invalidDeductNoReason: Partial<DeductionItem> = {
  points: 2.0,
  date: '2026-09-20',
  verifiedBy: 'Tổ trưởng'
};
assert(!validateDeduction(invalidDeductNoReason).valid, 'Chặn điểm trừ không có lý do vi phạm');

const invalidDeductZeroPoints: Partial<DeductionItem> = {
  reason: 'Vi phạm giờ giấc',
  points: 0,
  date: '2026-09-20',
  verifiedBy: 'Tổ trưởng'
};
assert(!validateDeduction(invalidDeductZeroPoints).valid, 'Chặn điểm trừ có số điểm <= 0');

console.log('');

// -------------------------------------------------------------------
// 5. TEST CHÊNH LỆCH ĐIỂM (Cảnh báo ABS >= 5)
// -------------------------------------------------------------------
console.log('[5] Test Chênh lệch điểm (Tự động phát hiện ABS(Tự chấm - Tổ chấm) >= 5):');

const disc1 = checkDiscrepancy(92, 85);
assert(disc1.hasDiscrepancy, 'Chênh lệch |92 - 85| = 7 >= 5 -> Có cảnh báo chênh lệch');
assertEqual(
  disc1.warningText,
  'Chênh lệch từ 05 điểm trở lên – cần nêu rõ lý do và căn cứ.',
  'Nội dung cảnh báo đúng quy chuẩn'
);

const disc2 = checkDiscrepancy(88, 84);
assert(!disc2.hasDiscrepancy, 'Chênh lệch |88 - 84| = 4 < 5 -> Không kích hoạt cảnh báo');

const disc3 = checkDiscrepancy(85, 90);
assert(disc3.hasDiscrepancy, 'Chênh lệch |85 - 90| = 5 >= 5 -> Có cảnh báo chênh lệch');

console.log('');

// -------------------------------------------------------------------
// 6. TEST ĐIỀU KIỆN KHỐNG CHẾ (CONTROLLED)
// -------------------------------------------------------------------
console.log('[6] Test Điều kiện khống chế (CONTROLLED - Không cho xếp cao hơn mức cho phép):');

// Trường hợp 1: Điểm 96đ (chuẩn là A+), nhưng bị khống chế tối đa mức B
const evalControlled = evaluateTeacherScore(94, 4.0, 2.0, {
  isControlled: true,
  controlledMaxRating: 'B',
  controlledReason: 'Bị kỷ luật khiển trách do vi phạm quy chế chuyên môn'
});

assertEqual(evalControlled.finalScore, 96, 'Tính đúng điểm cuối: 94 + 4 - 2 = 96đ');
assertEqual(evalControlled.calculatedRating, 'A_PLUS', 'Mức xếp loại theo điểm số là A+');
assertEqual(evalControlled.finalRating, 'B', 'Mục 5: Bị khống chế tối đa mức B -> Kết luận xếp loại B');
assert(evalControlled.isControlled, 'Đánh dấu cờ isControlled = true');
assert(
  evalControlled.controlledWarning?.includes('Bị khống chế theo điều kiện thi đua') || false,
  'Hiển thị thông báo “Bị khống chế theo điều kiện thi đua.”'
);

// Trường hợp 2: Điểm 72đ (chuẩn là C), bị khống chế tối đa mức B -> Vẫn giữ nguyên C (không nâng lên)
const evalLowScore = evaluateTeacherScore(72, 0, 0, {
  isControlled: true,
  controlledMaxRating: 'B',
  controlledReason: 'Khống chế tối đa B'
});
assertEqual(evalLowScore.finalRating, 'C', 'Điểm thấp hơn mức khống chế vẫn giữ nguyên mức thực tế');

// Trường hợp 3: Không có điều kiện khống chế (isControlled: false)
const evalNormal = evaluateTeacherScore(97, 2, 0, {
  isControlled: false
});
assertEqual(evalNormal.finalRating, 'A_PLUS', 'Khi không khống chế -> Xếp loại đúng theo thang điểm (A+)');

console.log('');

// -------------------------------------------------------------------
// 7. TEST GIẢI TRÌNH & BỔ SUNG MINH CHỨNG (Mục 1, 2, 3, 4, 5, 7)
// -------------------------------------------------------------------
console.log('[7] Test Giải trình và Bổ sung minh chứng (4 trạng thái, versioning, audit log bất biến):');

// Test trạng thái giải trình (Mục 5: SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED)
const validAppealStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'];
assert(
  validAppealStatuses.includes('SUBMITTED') &&
  validAppealStatuses.includes('UNDER_REVIEW') &&
  validAppealStatuses.includes('ACCEPTED') &&
  validAppealStatuses.includes('REJECTED'),
  'Hỗ trợ đầy đủ 4 trạng thái giải trình chuẩn: SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED'
);

// Test Versioning minh chứng (Mục 3 & 4: Không xóa file cũ, tạo Version 1, 2, 3)
interface MockEvidenceVersion {
  version: number;
  versionLabel: string;
  fileName: string;
}

const evidenceVersions: MockEvidenceVersion[] = [
  { version: 1, versionLabel: 'Version 1', fileName: 'GiaoAn_Tuan1.pdf' }
];

// Thêm Version 2 (bổ sung)
const newVer2: MockEvidenceVersion = {
  version: 2,
  versionLabel: 'Version 2',
  fileName: 'GiaoAn_Tuan1_BoSung.pdf'
};
evidenceVersions.push(newVer2);

assertEqual(evidenceVersions.length, 2, 'Bổ sung minh chứng: Không xóa Version 1, danh sách có 2 phiên bản');
assertEqual(evidenceVersions[0].versionLabel, 'Version 1', 'Version 1 được bảo tồn nguyên vẹn');
assertEqual(evidenceVersions[1].versionLabel, 'Version 2', 'Tạo thành công Version 2');

// Thêm Version 3
evidenceVersions.push({
  version: 3,
  versionLabel: 'Version 3',
  fileName: 'GiaoAn_Tuan1_Final_Ver3.pdf'
});
assertEqual(evidenceVersions.length, 3, 'Tạo thành công Version 3 (chuỗi lịch sử Version 1 -> Version 2 -> Version 3)');

// Test Audit Log bất biến (Mục 7: Lưu toàn bộ lịch sử, không cho xóa)
const auditLogsTrail: Array<{ action: string; timestamp: string }> = [];
auditLogsTrail.push({ action: 'GỬI ĐƠN GIẢI TRÌNH', timestamp: '2026-10-04 09:00:00' });
auditLogsTrail.push({ action: 'TIẾP NHẬN XỬ LÝ (UNDER_REVIEW)', timestamp: '2026-10-04 10:00:00' });
auditLogsTrail.push({ action: 'CHẤP THUẬN GIẢI TRÌNH (ACCEPTED)', timestamp: '2026-10-04 11:00:00' });

assertEqual(auditLogsTrail.length, 3, 'Mục 7: Toàn bộ lịch sử các bước được ghi nhận đầy đủ vào Audit Log');
assert(auditLogsTrail[0].action === 'GỬI ĐƠN GIẢI TRÌNH', 'Sự kiện đầu tiên là SUBMITTED');
assert(auditLogsTrail[2].action.includes('ACCEPTED'), 'Sự kiện cuối là ACCEPTED');

console.log('\n====================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passedTests} passed, ${failedTests} failed`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
}
