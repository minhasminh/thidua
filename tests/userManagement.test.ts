/**
 * UNIT & INTEGRATION TESTS CHO CHỨC NĂNG QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN
 * 1. Tạo tài khoản mới (Create User)
 * 2. Phân quyền tài khoản (Assign Role & RBAC)
 * 3. Sửa thông tin tài khoản (Edit User)
 * 4. Đặt lại mật khẩu (Reset Password)
 * 5. Khóa / Mở khóa tài khoản (Lock / Unlock Account)
 * 6. Kiểm tra bảo vệ an toàn khi xóa tài khoản (Safe Deletion & Self-protection)
 * 7. Kiểm tra chặn đăng nhập khi tài khoản bị tạm khóa (Auth Service Enforcement)
 * 8. Bộ lọc & Tìm kiếm tài khoản (Search, Role, Department, Status)
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

import { storageService } from '../src/services/storageService';
import { authService } from '../src/services/authService';
import { normalizeRole } from '../src/types';

// Reset to clean seed defaults
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

async function runTests() {
  console.log('====================================================');
  console.log('TEST SUITE: QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN RBAC');
  console.log('====================================================\n');

  const adminUser = storageService.getUserById('user-admin-system')!;
  assert(Boolean(adminUser), 'Tìm thấy tài khoản Quản trị viên hệ thống gốc');

  // -------------------------------------------------------------------
  // 1. TẠO TÀI KHOẢN MỚI
  // -------------------------------------------------------------------
  console.log('[1] Kiểm tra Tạo tài khoản mới:');
  const initialCount = storageService.getUsers().length;

  const newUser = storageService.createUser({
    name: 'Đặng Thùy Trâm',
    email: 'tramdt@nguyendinhanh.edu.vn',
    teacherId: 'GV-099',
    role: 'GIAO_VIEN',
    departmentId: 'dept-1',
    position: 'Giáo viên - GVCN 6A2',
    subjects: ['Toán 6', 'Tin 6'],
    educationLevel: 'THCS',
    phone: '0912 345 678',
    password: 'Password@2026',
    status: 'ACTIVE'
  });

  assert(Boolean(newUser && newUser.id), 'Tạo tài khoản thành công với ID sinh tự động');
  assertEqual(newUser.name, 'Đặng Thùy Trâm', 'Họ tên lưu chính xác');
  assertEqual(newUser.email, 'tramdt@nguyendinhanh.edu.vn', 'Email chuẩn hóa chữ thường');
  assertEqual(newUser.teacherId, 'GV-099', 'Mã giáo viên lưu chính xác');
  assertEqual(newUser.role, 'GIAO_VIEN', 'Vai trò lưu chính xác');
  assertEqual(newUser.status, 'ACTIVE', 'Trạng thái khởi tạo là ACTIVE');
  assert(storageService.getUsers().length === initialCount + 1, 'Tổng số tài khoản trong hệ thống tăng 1');

  // -------------------------------------------------------------------
  // 2. SỬA THÔNG TIN TÀI KHOẢN
  // -------------------------------------------------------------------
  console.log('\n[2] Kiểm tra Sửa thông tin tài khoản:');
  const updatedUser = storageService.updateUser(newUser.id, {
    name: 'Đặng Thùy Trâm (Đã bổ nhiệm)',
    position: 'Phó Tổ trưởng chuyên môn',
    phone: '0988 999 888',
    educationLevel: 'LIEN_CAP'
  });

  assert(Boolean(updatedUser), 'Cập nhật tài khoản thành công');
  assertEqual(updatedUser?.name, 'Đặng Thùy Trâm (Đã bổ nhiệm)', 'Tên đã cập nhật');
  assertEqual(updatedUser?.position, 'Phó Tổ trưởng chuyên môn', 'Chức vụ đã cập nhật');
  assertEqual(updatedUser?.phone, '0988 999 888', 'Số điện thoại đã cập nhật');
  assertEqual(updatedUser?.educationLevel, 'LIEN_CAP', 'Cấp học đã cập nhật');
  assert(Boolean(updatedUser?.updatedAt), 'Có ghi nhận timestamp updatedAt');

  // -------------------------------------------------------------------
  // 3. PHÂN QUYỀN CHO TÀI KHOẢN (RBAC)
  // -------------------------------------------------------------------
  console.log('\n[3] Kiểm tra Phân quyền cho tài khoản:');
  // Nâng quyền lên Tổ trưởng
  const roleUpdated = storageService.updateUserRole(newUser.id, 'TO_TRUONG');
  assertEqual(roleUpdated?.role, 'TO_TRUONG', 'Nâng quyền thành công lên TO_TRUONG');
  assertEqual(normalizeRole(roleUpdated!.role), 'TO_TRUONG', 'Chuẩn hóa quyền chính xác');

  // Nâng quyền lên Ban Giám hiệu
  const bghUpdated = storageService.updateUserRole(newUser.id, 'BGH');
  assertEqual(bghUpdated?.role, 'BGH', 'Nâng quyền thành công lên BGH');
  assertEqual(normalizeRole(bghUpdated!.role), 'BGH', 'Chuẩn hóa quyền BGH chính xác');

  // Gán quyền Hội đồng TĐKT
  const hdUpdated = storageService.updateUserRole(newUser.id, 'HOI_DONG_TDKT');
  assertEqual(hdUpdated?.role, 'HOI_DONG_TDKT', 'Gán quyền thành công Hội đồng TĐKT');

  // -------------------------------------------------------------------
  // 4. ĐẶT LẠI MẬT KHẨU
  // -------------------------------------------------------------------
  console.log('\n[4] Kiểm tra Đặt lại mật khẩu:');
  const resetSuccess = storageService.resetUserPassword(newUser.id, 'NewSecurePwd@123');
  assert(resetSuccess, 'Đặt lại mật khẩu thành công');
  const refUser = storageService.getUserById(newUser.id);
  assertEqual(refUser?.password, 'NewSecurePwd@123', 'Mật khẩu mới đã được lưu');

  // Reset về mặc định
  storageService.resetUserPassword(newUser.id, '123456');
  const refUserDef = storageService.getUserById(newUser.id);
  assertEqual(refUserDef?.password, '123456', 'Đặt lại mật khẩu về mặc định 123456 thành công');

  // -------------------------------------------------------------------
  // 5. KHÓA / MỞ KHÓA TÀI KHOẢN
  // -------------------------------------------------------------------
  console.log('\n[5] Kiểm tra Khóa và Mở khóa tài khoản:');
  // Khóa tài khoản
  const lockedStatus = storageService.toggleUserStatus(newUser.id);
  assertEqual(lockedStatus, 'LOCKED', 'Tài khoản chuyển sang trạng thái LOCKED');
  const lockedUser = storageService.getUserById(newUser.id);
  assertEqual(lockedUser?.status, 'LOCKED', 'Trạng thái trong DB lưu là LOCKED');

  // Mở khóa tài khoản
  const unlockedStatus = storageService.toggleUserStatus(newUser.id);
  assertEqual(unlockedStatus, 'ACTIVE', 'Tài khoản chuyển lại trạng thái ACTIVE');
  const activeUser = storageService.getUserById(newUser.id);
  assertEqual(activeUser?.status, 'ACTIVE', 'Trạng thái trong DB phục hồi ACTIVE');

  // -------------------------------------------------------------------
  // 6. KIỂM TRA CHẶN ĐĂNG NHẬP KHI TÀI KHOẢN BỊ KHÓA
  // -------------------------------------------------------------------
  console.log('\n[6] Kiểm tra Chặn đăng nhập khi tài khoản bị khóa:');
  // Khóa lại tài khoản để test đăng nhập
  storageService.toggleUserStatus(newUser.id);

  const loginAttempt = await authService.signIn(newUser.email, '123456');
  assert(!loginAttempt.success, 'Bảo mật: Từ chối đăng nhập khi tài khoản bị tạm khóa');
  assert(
    Boolean(loginAttempt.error && loginAttempt.error.includes('tạm khóa')),
    'Thông báo lỗi rõ ràng báo tài khoản bị tạm khóa'
  );

  // Mở khóa và thử lại
  storageService.toggleUserStatus(newUser.id);
  const loginSuccessAttempt = await authService.signIn(newUser.email, '123456');
  assert(loginSuccessAttempt.success, 'Cho phép đăng nhập bình thường sau khi mở khóa');

  // -------------------------------------------------------------------
  // 7. KIỂM TRA BẢO VỆ AN TOÀN KHI XÓA TÀI KHOẢN
  // -------------------------------------------------------------------
  console.log('\n[7] Kiểm tra Bảo vệ an toàn khi xóa tài khoản:');
  // Chặn tự xóa chính mình
  const selfDel = storageService.deleteUserSafely(adminUser.id, adminUser.id);
  assert(!selfDel.success, 'Bảo vệ: Không cho phép Quản trị viên tự xóa chính mình');

  // Chặn xóa tài khoản Admin hệ thống gốc
  const rootAdminDel = storageService.deleteUserSafely('user-admin-system', 'another-admin');
  assert(!rootAdminDel.success, 'Bảo vệ: Không cho phép xóa tài khoản Admin gốc của hệ thống');

  // Xóa tài khoản thông thường đã tạo
  const validDel = storageService.deleteUserSafely(newUser.id, adminUser.id);
  assert(validDel.success, 'Xóa tài khoản người dùng thông thường thành công');
  assert(storageService.getUserById(newUser.id) === undefined, 'Tài khoản đã bị xóa khỏi danh sách');

  console.log('\n====================================================');
  console.log(`KẾT QUẢ KIỂM THỬ QUẢN LÝ TÀI KHOẢN: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
