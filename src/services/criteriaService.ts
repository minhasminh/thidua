import { CriteriaGroupModel, CriteriaModel, User, normalizeRole } from '../types';
import { INITIAL_CRITERIA_GROUPS, INITIAL_CRITERIA, TOTAL_EXPECTED_SCORE } from '../data/criteriaModelsData';
import { logRlsEnforcement } from '../lib/supabaseClient';

const CRITERIA_STORAGE_KEYS = {
  GROUPS: 'nda_criteria_groups_v1',
  CRITERIA: 'nda_criteria_items_v1'
};

function safeGet<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultVal;
    return JSON.parse(item);
  } catch {
    return defaultVal;
  }
}

function safeSet<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to save to localStorage (${key})`, e);
  }
}

export class CriteriaService {
  // Lấy toàn bộ nhóm tiêu chí
  public getGroups(): CriteriaGroupModel[] {
    const groups = safeGet<CriteriaGroupModel[]>(CRITERIA_STORAGE_KEYS.GROUPS, INITIAL_CRITERIA_GROUPS);
    return groups.sort((a, b) => a.thu_tu - b.thu_tu);
  }

  // Lấy toàn bộ tiêu chí
  public getAllCriteria(): CriteriaModel[] {
    const criteria = safeGet<CriteriaModel[]>(CRITERIA_STORAGE_KEYS.CRITERIA, INITIAL_CRITERIA);
    return criteria.sort((a, b) => a.thu_tu - b.thu_tu);
  }

  // Lấy tiêu chí theo nhóm
  public getCriteriaByGroup(groupId: string): CriteriaModel[] {
    return this.getAllCriteria().filter((c) => c.group_id === groupId);
  }

  // Lấy tiêu chí đang kích hoạt (phục vụ phiếu chấm)
  public getActiveCriteria(): CriteriaModel[] {
    return this.getAllCriteria().filter((c) => c.is_active);
  }

  // Kiểm tra tổng điểm hệ thống (Mục 7: 15 + 30 + 25 + 15 + 5 + 10 = 100)
  public verifyTotalScores(): {
    isValid: boolean;
    totalActiveScore: number;
    expectedScore: number;
    groupBreakdown: {
      groupId: string;
      groupName: string;
      groupMaxScore: number;
      actualCriteriaSum: number;
      isMatch: boolean;
      criteriaCount: number;
    }[];
  } {
    const groups = this.getGroups();
    const criteria = this.getAllCriteria().filter((c) => c.is_active);

    let totalActiveScore = 0;
    const groupBreakdown = groups.map((g) => {
      const crits = criteria.filter((c) => c.group_id === g.id);
      const actualSum = crits.reduce((acc, c) => acc + (Number(c.diem_toi_da) || 0), 0);
      const roundedActual = Math.round(actualSum * 10) / 10;
      totalActiveScore += roundedActual;

      return {
        groupId: g.id,
        groupName: g.ten_nhom,
        groupMaxScore: g.diem_toi_da,
        actualCriteriaSum: roundedActual,
        isMatch: Math.abs(roundedActual - g.diem_toi_da) < 0.001,
        criteriaCount: crits.length
      };
    });

    totalActiveScore = Math.round(totalActiveScore * 10) / 10;
    const isValid = totalActiveScore === TOTAL_EXPECTED_SCORE && groupBreakdown.every((g) => g.isMatch);

    return {
      isValid,
      totalActiveScore,
      expectedScore: TOTAL_EXPECTED_SCORE,
      groupBreakdown
    };
  }

  // Thêm tiêu chí mới (Chỉ ADMIN - Mục 3)
  public createCriteria(
    item: Omit<CriteriaModel, 'id' | 'created_at' | 'updated_at'>,
    user: User
  ): { success: boolean; message: string; criteria?: CriteriaModel } {
    const role = normalizeRole(user.role);
    if (role !== 'ADMIN') {
      logRlsEnforcement('INSERT', 'criteria', user.id, role, false, 'Chỉ ADMIN mới được tạo tiêu chí');
      return {
        success: false,
        message: 'Từ chối quyền truy cập: Chỉ ADMIN mới được thêm tiêu chí thi đua.'
      };
    }

    if (!item.ma_tieu_chi.trim() || !item.ten_tieu_chi.trim()) {
      return { success: false, message: 'Mã và Tên tiêu chí không được để trống.' };
    }

    if (item.diem_toi_da <= 0) {
      return { success: false, message: 'Điểm tối đa phải lớn hơn 0.' };
    }

    const all = this.getAllCriteria();
    if (all.some((c) => c.ma_tieu_chi.toLowerCase() === item.ma_tieu_chi.trim().toLowerCase())) {
      return { success: false, message: `Mã tiêu chí "${item.ma_tieu_chi}" đã tồn tại trên hệ thống.` };
    }

    const now = new Date().toISOString();
    const newCriteria: CriteriaModel = {
      ...item,
      id: `c-${item.ma_tieu_chi.replace(/\./g, '-')}-${Date.now()}`,
      ma_tieu_chi: item.ma_tieu_chi.trim(),
      ten_tieu_chi: item.ten_tieu_chi.trim(),
      mo_ta: item.mo_ta.trim(),
      created_at: now,
      updated_at: now
    };

    all.push(newCriteria);
    safeSet(CRITERIA_STORAGE_KEYS.CRITERIA, all);
    logRlsEnforcement('INSERT', 'criteria', user.id, role, true, `Tạo mới tiêu chí ${newCriteria.ma_tieu_chi}`);

    return { success: true, message: 'Thêm tiêu chí thành công!', criteria: newCriteria };
  }

  // Sửa tiêu chí (Chỉ ADMIN - Mục 3)
  public updateCriteria(
    criteriaId: string,
    updates: Partial<Omit<CriteriaModel, 'id' | 'created_at'>>,
    user: User
  ): { success: boolean; message: string; criteria?: CriteriaModel } {
    const role = normalizeRole(user.role);
    if (role !== 'ADMIN') {
      logRlsEnforcement('UPDATE', 'criteria', user.id, role, false, 'Chỉ ADMIN mới được sửa cấu trúc tiêu chí');
      return {
        success: false,
        message: 'Từ chối quyền truy cập: Chỉ ADMIN mới được sửa cấu trúc tiêu chí thi đua.'
      };
    }

    const all = this.getAllCriteria();
    const index = all.findIndex((c) => c.id === criteriaId);
    if (index === -1) {
      return { success: false, message: 'Không tìm thấy tiêu chí cần sửa.' };
    }

    const current = all[index];
    if (updates.ma_tieu_chi && updates.ma_tieu_chi.trim() !== current.ma_tieu_chi) {
      const exists = all.some(
        (c) => c.id !== criteriaId && c.ma_tieu_chi.toLowerCase() === updates.ma_tieu_chi?.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, message: `Mã tiêu chí "${updates.ma_tieu_chi}" đã trùng lặp.` };
      }
    }

    if (updates.diem_toi_da !== undefined && updates.diem_toi_da <= 0) {
      return { success: false, message: 'Điểm tối đa phải lớn hơn 0.' };
    }

    const updatedItem: CriteriaModel = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };

    all[index] = updatedItem;
    safeSet(CRITERIA_STORAGE_KEYS.CRITERIA, all);
    logRlsEnforcement('UPDATE', 'criteria', user.id, role, true, `Cập nhật tiêu chí ${updatedItem.ma_tieu_chi}`);

    return { success: true, message: 'Cập nhật tiêu chí thành công!', criteria: updatedItem };
  }

  // Kích hoạt / Vô hiệu hóa (Chỉ ADMIN - Mục 3)
  public toggleActive(
    criteriaId: string,
    user: User
  ): { success: boolean; message: string; criteria?: CriteriaModel } {
    const role = normalizeRole(user.role);
    if (role !== 'ADMIN') {
      logRlsEnforcement('UPDATE', 'criteria', user.id, role, false, 'Chỉ ADMIN mới được kích hoạt/vô hiệu hóa');
      return {
        success: false,
        message: 'Từ chối quyền: Chỉ ADMIN mới có quyền kích hoạt hoặc vô hiệu hóa tiêu chí.'
      };
    }

    const all = this.getAllCriteria();
    const item = all.find((c) => c.id === criteriaId);
    if (!item) {
      return { success: false, message: 'Không tìm thấy tiêu chí.' };
    }

    item.is_active = !item.is_active;
    item.updated_at = new Date().toISOString();

    safeSet(CRITERIA_STORAGE_KEYS.CRITERIA, all);
    logRlsEnforcement(
      'UPDATE',
      'criteria',
      user.id,
      role,
      true,
      `${item.is_active ? 'Kích hoạt' : 'Vô hiệu hóa'} tiêu chí ${item.ma_tieu_chi}`
    );

    return {
      success: true,
      message: `${item.is_active ? 'Đã kích hoạt' : 'Đã vô hiệu hóa'} tiêu chí ${item.ma_tieu_chi}!`,
      criteria: item
    };
  }

  // Khôi phục tiêu chí gốc 100 điểm ban đầu
  public resetToDefaultCriteria(user: User): { success: boolean; message: string } {
    const role = normalizeRole(user.role);
    if (role !== 'ADMIN') {
      return { success: false, message: 'Chỉ ADMIN mới được khôi phục danh mục tiêu chí mặc định.' };
    }

    safeSet(CRITERIA_STORAGE_KEYS.GROUPS, INITIAL_CRITERIA_GROUPS);
    safeSet(CRITERIA_STORAGE_KEYS.CRITERIA, INITIAL_CRITERIA);
    return { success: true, message: 'Đã khôi phục 6 nhóm và 23 tiêu chí chuẩn 100 điểm!' };
  }
}

export const criteriaService = new CriteriaService();
