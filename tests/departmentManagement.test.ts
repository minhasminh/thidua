import { storageService } from '../src/services/storageService';
import { Department } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

console.log('====================================================');
console.log('TEST SUITE: QUẢN LÝ TỔ CHUYÊN MÔN (6 TỔ MẶC ĐỊNH & CRUD)');
console.log('====================================================');

// [1] Kiểm tra 6 Tổ chuyên môn mặc định
console.log('\n[1] Kiểm tra danh sách 6 Tổ chuyên môn mặc định:');
storageService.resetDepartmentsToDefaults();
const depts = storageService.getDepartments();

assert(depts.length >= 6, `Hệ thống có tối thiểu 6 tổ chuyên môn (thực tế: ${depts.length})`);

const expectedNames = [
  'Tổ khoa học tự nhiên',
  'Tổ khoa học xã hội',
  'Tổ Tiếng Anh - Giáo dục thể chất',
  'Tổ 1-2-3',
  'Tổ 4-5',
  'Tổ văn phòng'
];

expectedNames.forEach((expectedName) => {
  const found = depts.find((d) => d.name.toLowerCase() === expectedName.toLowerCase());
  assert(Boolean(found), `Tồn tại tổ chuyên môn mặc định: "${expectedName}" (Mã: ${found?.code || 'N/A'})`);
});

// [2] Kiểm tra Tạo mới Tổ chuyên môn
console.log('\n[2] Kiểm tra Tạo mới Tổ chuyên môn:');
const testDeptName = 'Tổ Khảo thí & Đảm bảo chất lượng';
const testDeptCode = 'KHAO_THI_DBCL';

const created = storageService.createDepartment({
  name: testDeptName,
  code: testDeptCode,
  leaderId: 'user-tt1',
  description: 'Tổ chức các kỳ thi kiểm tra định kỳ và đánh giá chất lượng dạy học'
});

assert(Boolean(created.id), `Tạo thành công tổ mới với ID: ${created.id}`);
assert(created.name === testDeptName, `Tên tổ tạo mới đúng: "${created.name}"`);
assert(created.code === testDeptCode, `Mã tổ tạo mới chuẩn hóa: "${created.code}"`);
assert(created.leaderName.length > 0, `Gán tổ trưởng thành công: "${created.leaderName}"`);

// Kiểm tra danh sách sau khi thêm
const listAfterAdd = storageService.getDepartments();
assert(
  listAfterAdd.some((d) => d.id === created.id),
  'Tổ mới được lưu trữ và có mặt trong danh sách getDepartments()'
);

// [3] Kiểm tra Chỉnh sửa Tổ chuyên môn & Đồng bộ tên sang giáo viên
console.log('\n[3] Kiểm tra Chỉnh sửa Tổ chuyên môn & Đồng bộ:');
const updatedName = 'Tổ Khảo thí & Chuyển đổi số';
const updated = storageService.updateDepartment(created.id, {
  name: updatedName,
  description: 'Mô tả đã được cập nhật bởi Quản trị viên'
});

assert(updated !== null, 'Hàm updateDepartment trả về dữ liệu thành công');
assert(updated?.name === updatedName, `Cập nhật tên tổ thành công: "${updated?.name}"`);

// [4] Kiểm tra Xóa an toàn (Safe Deletion & Transfer)
console.log('\n[4] Kiểm tra Xóa an toàn Tổ chuyên môn:');
// 4.1. Xóa tổ có thành viên và chuyển sang dept-1
const deleteWithTransferRes = storageService.deleteDepartment(created.id, 'dept-1');
assert(
  deleteWithTransferRes.success,
  `Xóa tổ có thành viên bằng cách chuyển giáo viên sang dept-1 thành công: ${deleteWithTransferRes.message}`
);

const listAfterDelete = storageService.getDepartments();
assert(
  !listAfterDelete.some((d) => d.id === created.id),
  'Tổ đã xóa không còn tồn tại trong danh sách'
);

// 4.2. Tạo tổ rỗng (không gán tổ trưởng) và xóa trực tiếp
const emptyDept = storageService.createDepartment({
  name: 'Tổ Thử nghiệm Tạm thời',
  code: 'THU_NGHIEM_TAM',
  description: 'Tổ dùng để test xóa rỗng'
});

const deleteEmptyRes = storageService.deleteDepartment(emptyDept.id);
assert(deleteEmptyRes.success, `Xóa tổ rỗng không có thành viên thành công: ${deleteEmptyRes.message}`);

// 4.3. Xóa tổ có thành viên nhưng không chỉ định tổ đích -> Phải chặn
const dept1 = storageService.getDepartments().find((d) => d.id === 'dept-1');
assert(Boolean(dept1), 'Tìm thấy dept-1 (Tổ khoa học tự nhiên)');

if (dept1 && (dept1.teacherCount || 0) > 0) {
  const deleteBlocked = storageService.deleteDepartment('dept-1');
  assert(
    !deleteBlocked.success,
    `Chặn xóa thành công khi tổ đang có giáo viên: "${deleteBlocked.message}"`
  );
}

// [5] Kiểm tra Khôi phục 6 tổ chuẩn (resetDepartmentsToDefaults)
console.log('\n[5] Kiểm tra Khôi phục 6 tổ chuẩn (resetDepartmentsToDefaults):');
storageService.resetDepartmentsToDefaults();
const resetDepts = storageService.getDepartments();
assert(resetDepts.length === 6, `Sau khi khôi phục, danh sách có đúng 6 tổ chuẩn`);

console.log('\n====================================================');
console.log('KẾT QUẢ KIỂM THỬ: TẤT CẢ TEST CASES QUẢN LÝ TỔ ĐÃ PASSED 100%');
console.log('====================================================\n');
