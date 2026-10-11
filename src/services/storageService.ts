import {
  Department,
  User,
  Role,
  EvidenceItem,
  EvidenceVersion,
  EvaluationRecord,
  BonusItem,
  DeductionItem,
  AppealItem,
  AppealStatus,
  AppealAuditLog,
  SupplementRequest,
  NotificationItem,
  SystemSettings,
  RegulationVersion,
  RatingLevel,
  EvidenceStatus,
  EvaluationStatus,
  BghScoreAdjustment,
  ScoreAuditLog,
  normalizeRole
} from '../types';
import { calculateRatingWithConfig, DEFAULT_RATING_THRESHOLDS } from '../utils/ratingConfig';
import {
  evaluateTeacherScore,
  calculateFinalScore,
  determineBaseRating,
  applyControlledCondition,
  checkDuplicateBonus,
  validateBonusApproval,
  validateDeduction,
  checkDiscrepancy
} from './scoringEngine';
import { getAuthoritativeTimestamp } from '../utils/formatters';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_USERS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_REGULATION,
  INITIAL_EVIDENCES,
  INITIAL_EVALUATIONS,
  INITIAL_BONUS_LIST,
  INITIAL_DEDUCTION_LIST,
  INITIAL_APPEALS,
  INITIAL_SUPPLEMENT_REQUESTS,
  INITIAL_NOTIFICATIONS
} from '../data/seedData';
import { CRITERIA_GROUPS } from '../data/criteriaData';

const STORAGE_KEYS = {
  USERS: 'nda_em_users_v3',
  DEPARTMENTS: 'nda_em_departments_v3',
  SETTINGS: 'nda_em_settings_v3',
  REGULATION: 'nda_em_regulation_v3',
  EVIDENCES: 'nda_em_evidences_v3',
  EVALUATIONS: 'nda_em_evaluations_v3',
  BONUS: 'nda_em_bonus_v3',
  DEDUCTIONS: 'nda_em_deductions_v3',
  APPEALS: 'nda_em_appeals_v3',
  SUPPLEMENT_REQUESTS: 'nda_em_supplement_requests_v3',
  NOTIFICATIONS: 'nda_em_notifications_v3',
  CURRENT_USER_ID: 'nda_em_current_user_id_v3'
};

const memoryStore: Record<string, string> = {};

export function deduplicateUsers(users: User[]): User[] {
  if (!Array.isArray(users)) return [];
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();
  const clean: User[] = [];

  for (const u of users) {
    if (!u || !u.id) continue;
    const cleanId = String(u.id).trim();
    const cleanEmail = (u.email || '').trim().toLowerCase();

    if (seenIds.has(cleanId)) continue;
    if (cleanEmail && seenEmails.has(cleanEmail)) continue;

    seenIds.add(cleanId);
    if (cleanEmail) seenEmails.add(cleanEmail);
    clean.push({
      ...u,
      id: cleanId,
      email: cleanEmail || u.email
    });
  }
  return clean;
}

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage === 'undefined') {
      const mem = memoryStore[key];
      return mem ? (JSON.parse(mem) as T) : defaultValue;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to read from localStorage [${key}]:`, e);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    let finalValue = value;
    if (key === STORAGE_KEYS.USERS && Array.isArray(value)) {
      finalValue = deduplicateUsers(value as unknown as User[]) as unknown as T;
    }
    if (typeof localStorage === 'undefined') {
      memoryStore[key] = JSON.stringify(finalValue);
      return;
    }
    localStorage.setItem(key, JSON.stringify(finalValue));
  } catch (e) {
    console.error(`Failed to write to localStorage [${key}]:`, e);
  }
}

class StorageService {
  // Initialization
  public init() {
    if (typeof localStorage !== 'undefined') {
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!rawUsers) {
        this.resetToDefaults();
      } else {
        try {
          const parsed = JSON.parse(rawUsers);
          if (Array.isArray(parsed)) {
            const cleaned = deduplicateUsers(parsed);
            if (cleaned.length !== parsed.length) {
              safeSet(STORAGE_KEYS.USERS, cleaned);
            }
          }
        } catch {
          // ignore error
        }
      }
    }
  }

  public resetToDefaults() {
    safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
    safeSet(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    safeSet(STORAGE_KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
    safeSet(STORAGE_KEYS.REGULATION, INITIAL_REGULATION);
    safeSet(STORAGE_KEYS.EVIDENCES, INITIAL_EVIDENCES);
    safeSet(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
    safeSet(STORAGE_KEYS.BONUS, INITIAL_BONUS_LIST);
    safeSet(STORAGE_KEYS.DEDUCTIONS, INITIAL_DEDUCTION_LIST);
    safeSet(STORAGE_KEYS.APPEALS, INITIAL_APPEALS);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    safeSet(STORAGE_KEYS.CURRENT_USER_ID, 'user-gv1'); // Default as Teacher Nguyen Van An
  }

  // Active User / Auth
  public getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = safeGet(STORAGE_KEYS.CURRENT_USER_ID, 'user-gv1');
    const found = users.find((u) => u.id === currentId);
    return found || users[0] || INITIAL_USERS[0];
  }

  public setCurrentUser(userId: string): User {
    safeSet(STORAGE_KEYS.CURRENT_USER_ID, userId);
    return this.getCurrentUser();
  }

  // Users & Teachers
  public getUsers(): User[] {
    const rawUsers = safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const uniqueUsers = deduplicateUsers(rawUsers);

    if (uniqueUsers.length !== rawUsers.length) {
      safeSet(STORAGE_KEYS.USERS, uniqueUsers);
    }
    return uniqueUsers;
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (!user.status) {
      user.status = 'ACTIVE';
    }
    user.updatedAt = new Date().toISOString();
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      user.createdAt = user.createdAt || new Date().toISOString();
      users.push(user);
    }
    safeSet(STORAGE_KEYS.USERS, users);
  }

  public createUser(userData: Partial<User> & { name: string; email: string; role: Role }): User {
    const users = this.getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check if user with this email already exists: update existing instead of creating duplicate
    const existingIndex = users.findIndex((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      const updated: User = {
        ...existing,
        ...userData,
        email: cleanEmail,
        updatedAt: new Date().toISOString()
      };
      users[existingIndex] = updated;
      safeSet(STORAGE_KEYS.USERS, users);
      return updated;
    }

    // Generate guaranteed unique ID
    let id = userData.id || `user-custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    while (users.some((u) => u.id === id)) {
      id = `user-custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    const teacherId = userData.teacherId || `GV-${String(users.length + 1).padStart(3, '0')}`;
    const departments = this.getDepartments();
    const dept = departments.find((d) => d.id === userData.departmentId) || departments[0];

    const newUser: User = {
      id,
      name: userData.name.trim(),
      email: cleanEmail,
      role: userData.role,
      departmentId: dept?.id || 'dept-1',
      departmentName: dept?.name || 'Tổ khoa học tự nhiên',
      position: userData.position?.trim() || 'Giáo viên bộ môn',
      subjects: userData.subjects && userData.subjects.length > 0 ? userData.subjects : ['Chuyên môn'],
      educationLevel: userData.educationLevel || 'THCS',
      phone: userData.phone?.trim() || '',
      teacherId,
      password: userData.password?.trim() || '123456',
      status: userData.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    safeSet(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;

    if (updates.departmentId && updates.departmentId !== users[index].departmentId) {
      const dept = this.getDepartments().find((d) => d.id === updates.departmentId);
      if (dept) {
        updates.departmentName = dept.name;
      }
    }

    const updatedUser: User = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    users[index] = updatedUser;
    safeSet(STORAGE_KEYS.USERS, users);
    return updatedUser;
  }

  public updateUserRole(userId: string, newRole: Role): User | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    const oldRole = user.role;

    const newPosition =
      newRole === 'TO_TRUONG'
        ? (user.position.includes('Tổ trưởng') ? user.position : 'Tổ trưởng chuyên môn')
        : newRole === 'TO_PHO'
        ? (user.position.includes('Tổ phó') ? user.position : 'Tổ phó chuyên môn')
        : oldRole === 'TO_TRUONG' || oldRole === 'TO_PHO'
        ? (user.position.includes('Tổ') ? 'Giáo viên bộ môn' : user.position)
        : user.position;

    const updatedUser = this.updateUser(userId, {
      role: newRole,
      position: newPosition
    });

    // Synchronize with Department leader / vice-leader records
    const depts = safeGet<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    let deptsChanged = false;

    if (newRole === 'TO_TRUONG') {
      const targetDeptId = user.departmentId;
      const dIdx = depts.findIndex((d) => d.id === targetDeptId);
      if (dIdx >= 0) {
        // Demote previous leader if different
        if (depts[dIdx].leaderId && depts[dIdx].leaderId !== userId) {
          const oldLId = depts[dIdx].leaderId;
          const oldL = this.getUserById(oldLId);
          if (oldL && oldL.role === 'TO_TRUONG') {
            this.updateUser(oldLId, { role: 'GIAO_VIEN', position: 'Giáo viên bộ môn' });
          }
        }
        depts[dIdx].leaderId = user.id;
        depts[dIdx].leaderName = user.name;
        deptsChanged = true;
      }
    } else if (newRole === 'TO_PHO') {
      const targetDeptId = user.departmentId;
      const dIdx = depts.findIndex((d) => d.id === targetDeptId);
      if (dIdx >= 0) {
        if (depts[dIdx].viceLeaderId && depts[dIdx].viceLeaderId !== userId) {
          const oldVId = depts[dIdx].viceLeaderId;
          const oldV = this.getUserById(oldVId);
          if (oldV && oldV.role === 'TO_PHO') {
            this.updateUser(oldVId, { role: 'GIAO_VIEN', position: 'Giáo viên bộ môn' });
          }
        }
        depts[dIdx].viceLeaderId = user.id;
        depts[dIdx].viceLeaderName = user.name;
        deptsChanged = true;
      }
    } else {
      // If user was previously TO_TRUONG and is now demoted or changed
      if (oldRole === 'TO_TRUONG') {
        depts.forEach((d) => {
          if (d.leaderId === userId) {
            d.leaderId = '';
            d.leaderName = 'Chưa chỉ định';
            deptsChanged = true;
          }
        });
      }
      if (oldRole === 'TO_PHO') {
        depts.forEach((d) => {
          if (d.viceLeaderId === userId) {
            d.viceLeaderId = '';
            d.viceLeaderName = '';
            deptsChanged = true;
          }
        });
      }
    }

    if (deptsChanged) {
      safeSet(STORAGE_KEYS.DEPARTMENTS, depts);
    }

    return updatedUser;
  }

  public resetUserPassword(userId: string, newPassword = '123456'): boolean {
    const updated = this.updateUser(userId, { password: newPassword });
    return Boolean(updated);
  }

  public toggleUserStatus(userId: string): 'ACTIVE' | 'LOCKED' | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    const nextStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    this.updateUser(userId, { status: nextStatus });
    return nextStatus;
  }

  public deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    safeSet(STORAGE_KEYS.USERS, users);
  }

  public deleteUserSafely(userId: string, currentAdminId?: string): { success: boolean; message: string } {
    if (userId === currentAdminId) {
      return { success: false, message: 'Bạn không thể xóa tài khoản Quản trị viên đang đăng nhập!' };
    }
    if (userId === 'user-admin-system' || userId === 'user-admin') {
      return { success: false, message: 'Không thể xóa tài khoản Quản trị viên / Ban Giám hiệu gốc của hệ thống!' };
    }
    this.deleteUser(userId);
    return { success: true, message: 'Đã xóa tài khoản thành công.' };
  }

  // Departments
  public getDepartments(): Department[] {
    const list = safeGet<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    // If the list has fewer than 6 departments or has old names, migrate/ensure 6 default departments are included
    if (!list || list.length < 6) {
      const existingIds = new Set(list.map((d) => d.id));
      INITIAL_DEPARTMENTS.forEach((def) => {
        if (!existingIds.has(def.id)) {
          list.push(def);
        } else {
          const idx = list.findIndex((d) => d.id === def.id);
          if (idx >= 0 && (list[idx].name.includes('Toán - Tin') || list[idx].name.includes('Văn - KHXH'))) {
            list[idx] = { ...list[idx], name: def.name, code: def.code, description: def.description };
          }
        }
      });
      safeSet(STORAGE_KEYS.DEPARTMENTS, list);
    }

    // Auto-heal / sync departments & user roles (e.g. Tổ 4-5 user-gv3, Tổ 1-2-3, Tổ TA-GDTC)
    const users = this.getUsers();
    let hasUserChanges = false;
    let hasDeptChanges = false;

    // Ensure any missing initial users (such as user-gv7 in Tổ 4-5) are in users
    INITIAL_USERS.forEach((defU) => {
      if (!users.some((u) => u.id === defU.id)) {
        users.push(defU);
        hasUserChanges = true;
      }
    });

    // Ensure Tổ 4-5 is migrated from old name Nguyễn Thị Dung to Ngô Thị Thúy Loan
    const gv3User = users.find((u) => u.id === 'user-gv3');
    if (gv3User && (gv3User.name === 'Nguyễn Thị Dung' || gv3User.name !== 'Ngô Thị Thúy Loan')) {
      gv3User.name = 'Ngô Thị Thúy Loan';
      gv3User.email = 'loanntt@nguyendinhanh.edu.vn';
      gv3User.departmentId = 'dept-5';
      gv3User.departmentName = 'Tổ 4-5';
      hasUserChanges = true;
    }
    const d5 = list.find((d) => d.id === 'dept-5');
    if (d5 && (d5.leaderName === 'Nguyễn Thị Dung' || (!d5.leaderId && d5.name === 'Tổ 4-5'))) {
      d5.leaderId = 'user-gv3';
      d5.leaderName = 'Ngô Thị Thúy Loan';
      hasDeptChanges = true;
    }

    list.forEach((dept) => {
      // 1. Leader synchronization
      if (dept.leaderId) {
        const leaderIdx = users.findIndex((u) => u.id === dept.leaderId);
        if (leaderIdx >= 0) {
          const leader = users[leaderIdx];
          if (dept.leaderName !== leader.name) {
            dept.leaderName = leader.name;
            hasDeptChanges = true;
          }
          if (leader.role !== 'TO_TRUONG' && leader.role !== 'ADMIN' && leader.role !== 'BGH') {
            leader.role = 'TO_TRUONG';
            leader.position = leader.position.includes('Tổ trưởng') ? leader.position : 'Tổ trưởng chuyên môn';
            leader.departmentId = dept.id;
            leader.departmentName = dept.name;
            hasUserChanges = true;
          }
        }
      }

      // 2. Vice-Leader synchronization
      if (dept.viceLeaderId) {
        const viceIdx = users.findIndex((u) => u.id === dept.viceLeaderId);
        if (viceIdx >= 0) {
          const vice = users[viceIdx];
          if (dept.viceLeaderName !== vice.name) {
            dept.viceLeaderName = vice.name;
            hasDeptChanges = true;
          }
          if (vice.role !== 'TO_PHO' && vice.role !== 'ADMIN' && vice.role !== 'BGH') {
            vice.role = 'TO_PHO';
            vice.position = vice.position.includes('Tổ phó') ? vice.position : 'Tổ phó chuyên môn';
            vice.departmentId = dept.id;
            vice.departmentName = dept.name;
            hasUserChanges = true;
          }
        }
      }
    });

    if (hasUserChanges) {
      safeSet(STORAGE_KEYS.USERS, users);
    }
    if (hasDeptChanges) {
      safeSet(STORAGE_KEYS.DEPARTMENTS, list);
    }

    // Update live teacher count for each department
    return list.map((dept) => ({
      ...dept,
      teacherCount: users.filter((u) => u.departmentId === dept.id).length
    }));
  }

  public getDepartmentById(id: string): Department | undefined {
    return this.getDepartments().find((d) => d.id === id);
  }

  public saveDepartment(department: Department): void {
    const list = safeGet<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const index = list.findIndex((d) => d.id === department.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...department };
    } else {
      list.push(department);
    }
    safeSet(STORAGE_KEYS.DEPARTMENTS, list);
  }

  public createDepartment(data: {
    name: string;
    code: string;
    leaderId?: string;
    leaderName?: string;
    viceLeaderId?: string;
    viceLeaderName?: string;
    description?: string;
    id?: string;
  }): Department {
    const cleanName = data.name.trim();
    const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, '_');
    const id = data.id || `dept-${cleanCode.toLowerCase().replace(/[^a-z0-9_]/g, '') || Date.now()}`;

    let leaderName = data.leaderName || '';
    if (data.leaderId && !leaderName) {
      const leader = this.getUserById(data.leaderId);
      if (leader) leaderName = leader.name;
    }

    let viceLeaderName = data.viceLeaderName || '';
    if (data.viceLeaderId && !viceLeaderName) {
      const viceLeader = this.getUserById(data.viceLeaderId);
      if (viceLeader) viceLeaderName = viceLeader.name;
    }

    const newDept: Department = {
      id,
      name: cleanName,
      code: cleanCode,
      leaderId: data.leaderId || '',
      leaderName: leaderName || 'Chưa chỉ định',
      viceLeaderId: data.viceLeaderId || '',
      viceLeaderName: viceLeaderName || '',
      teacherCount: 0,
      description: data.description?.trim() || ''
    };

    this.saveDepartment(newDept);

    // If leader is assigned, update leader's department & role
    if (data.leaderId) {
      this.updateUser(data.leaderId, {
        departmentId: id,
        departmentName: cleanName,
        role: 'TO_TRUONG',
        position: 'Tổ trưởng chuyên môn'
      });
    }

    // If vice leader is assigned, update vice leader's department & role
    if (data.viceLeaderId) {
      this.updateUser(data.viceLeaderId, {
        departmentId: id,
        departmentName: cleanName,
        role: 'TO_PHO',
        position: 'Tổ phó chuyên môn'
      });
    }

    return newDept;
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const list = safeGet<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) return null;

    const oldDept = list[index];

    let leaderName = updates.leaderName !== undefined ? updates.leaderName : oldDept.leaderName;
    if (updates.leaderId !== undefined) {
      // If previous leader is replaced by a different user
      if (oldDept.leaderId && oldDept.leaderId !== updates.leaderId) {
        const prevLeader = this.getUserById(oldDept.leaderId);
        if (prevLeader && prevLeader.role === 'TO_TRUONG') {
          this.updateUser(oldDept.leaderId, {
            role: 'GIAO_VIEN',
            position: prevLeader.position === 'Tổ trưởng chuyên môn' ? 'Giáo viên bộ môn' : prevLeader.position
          });
        }
      }

      if (updates.leaderId) {
        const leader = this.getUserById(updates.leaderId);
        if (leader) {
          leaderName = leader.name;
          // ALWAYS make sure leader gets TO_TRUONG role and updated department
          this.updateUser(updates.leaderId, {
            departmentId: id,
            departmentName: updates.name || oldDept.name,
            role: 'TO_TRUONG',
            position: leader.position.includes('Tổ trưởng') ? leader.position : 'Tổ trưởng chuyên môn'
          });
        }
      } else {
        leaderName = 'Chưa chỉ định';
      }
    }

    let viceLeaderName = updates.viceLeaderName !== undefined ? updates.viceLeaderName : oldDept.viceLeaderName;
    if (updates.viceLeaderId !== undefined) {
      // If previous vice leader is replaced
      if (oldDept.viceLeaderId && oldDept.viceLeaderId !== updates.viceLeaderId) {
        const prevVice = this.getUserById(oldDept.viceLeaderId);
        if (prevVice && prevVice.role === 'TO_PHO') {
          this.updateUser(oldDept.viceLeaderId, {
            role: 'GIAO_VIEN',
            position: prevVice.position === 'Tổ phó chuyên môn' ? 'Giáo viên bộ môn' : prevVice.position
          });
        }
      }

      if (updates.viceLeaderId) {
        const viceLeader = this.getUserById(updates.viceLeaderId);
        if (viceLeader) {
          viceLeaderName = viceLeader.name;
          // ALWAYS make sure vice leader gets TO_PHO role and updated department
          this.updateUser(updates.viceLeaderId, {
            departmentId: id,
            departmentName: updates.name || oldDept.name,
            role: 'TO_PHO',
            position: viceLeader.position.includes('Tổ phó') ? viceLeader.position : 'Tổ phó chuyên môn'
          });
        }
      } else {
        viceLeaderName = '';
      }
    }

    const updatedDept: Department = {
      ...oldDept,
      ...updates,
      leaderName: leaderName || 'Chưa chỉ định',
      viceLeaderName: viceLeaderName || ''
    };

    list[index] = updatedDept;
    safeSet(STORAGE_KEYS.DEPARTMENTS, list);

    // If department name was changed, sync departmentName for all users belonging to this department
    if (updates.name && updates.name !== oldDept.name) {
      const users = this.getUsers();
      let hasUserChanges = false;
      users.forEach((u) => {
        if (u.departmentId === id) {
          u.departmentName = updates.name!.trim();
          hasUserChanges = true;
        }
      });
      if (hasUserChanges) {
        safeSet(STORAGE_KEYS.USERS, users);
      }
    }

    return updatedDept;
  }

  /**
   * Bổ nhiệm / Phân quyền Ban cán sự Tổ chuyên môn (Tổ trưởng & Tổ phó)
   */
  public assignDepartmentLeadership(
    departmentId: string,
    leaderId?: string,
    viceLeaderId?: string
  ): { success: boolean; message: string; department?: Department } {
    const dept = this.getDepartmentById(departmentId);
    if (!dept) {
      return { success: false, message: 'Không tìm thấy tổ chuyên môn cần phân quyền!' };
    }

    if (leaderId && viceLeaderId && leaderId === viceLeaderId) {
      return { success: false, message: 'Một cán bộ giáo viên không thể vừa là Tổ trưởng vừa là Tổ phó cùng một tổ!' };
    }

    const updatedDept = this.updateDepartment(departmentId, {
      leaderId: leaderId !== undefined ? leaderId : dept.leaderId,
      viceLeaderId: viceLeaderId !== undefined ? viceLeaderId : dept.viceLeaderId
    });

    if (!updatedDept) {
      return { success: false, message: 'Cập nhật phân quyền tổ chuyên môn thất bại!' };
    }

    return {
      success: true,
      message: `Đã phân quyền Ban cán sự cho "${dept.name}" thành công!`,
      department: updatedDept
    };
  }

  public deleteDepartment(
    id: string,
    transferToDepartmentId?: string
  ): { success: boolean; message: string; transferredCount?: number } {
    const list = safeGet<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const deptToDelete = list.find((d) => d.id === id);
    if (!deptToDelete) {
      return { success: false, message: 'Tổ chuyên môn không tồn tại!' };
    }

    const users = this.getUsers();
    const members = users.filter((u) => u.departmentId === id);

    if (members.length > 0) {
      if (!transferToDepartmentId) {
        return {
          success: false,
          message: `Không thể xóa tổ "${deptToDelete.name}" vì hiện có ${members.length} giáo viên đang trực thuộc. Vui lòng chọn tổ đích để chuyển các giáo viên sang trước khi xóa!`
        };
      }

      const targetDept = list.find((d) => d.id === transferToDepartmentId);
      if (!targetDept) {
        return { success: false, message: 'Tổ chuyên môn đích để chuyển giáo viên không tồn tại!' };
      }

      // Transfer members to target department
      users.forEach((u) => {
        if (u.departmentId === id) {
          u.departmentId = targetDept.id;
          u.departmentName = targetDept.name;
        }
      });
      safeSet(STORAGE_KEYS.USERS, users);
    }

    // Remove department from list
    const updatedList = list.filter((d) => d.id !== id);
    safeSet(STORAGE_KEYS.DEPARTMENTS, updatedList);

    const targetDeptName = list.find((d) => d.id === transferToDepartmentId)?.name;
    return {
      success: true,
      message: `Đã xóa tổ "${deptToDelete.name}" thành công.${
        members.length > 0 ? ` Đã chuyển ${members.length} giáo viên sang "${targetDeptName}".` : ''
      }`,
      transferredCount: members.length
    };
  }

  public resetDepartmentsToDefaults(): void {
    safeSet(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  // Settings
  public getSettings(): SystemSettings {
    const s = safeGet<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
    if (!s.ratingThresholds) {
      s.ratingThresholds = { ...DEFAULT_RATING_THRESHOLDS };
    }
    return s;
  }

  public saveSettings(settings: SystemSettings): void {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
  }

  // Regulation
  public getRegulation(): RegulationVersion {
    return safeGet<RegulationVersion>(STORAGE_KEYS.REGULATION, INITIAL_REGULATION);
  }

  public saveRegulation(reg: RegulationVersion): void {
    safeSet(STORAGE_KEYS.REGULATION, reg);
  }

  // Evidences
  public getEvidences(): EvidenceItem[] {
    return safeGet<EvidenceItem[]>(STORAGE_KEYS.EVIDENCES, INITIAL_EVIDENCES);
  }

  public getEvidenceById(id: string): EvidenceItem | undefined {
    return this.getEvidences().find((e) => e.id === id);
  }

  public getTeacherEvidences(teacherId: string): EvidenceItem[] {
    return this.getEvidences().filter((e) => e.teacherId === teacherId);
  }

  public getDepartmentEvidences(deptId: string): EvidenceItem[] {
    return this.getEvidences().filter((e) => e.departmentId === deptId);
  }

  public saveEvidence(evidence: EvidenceItem, actor: User, actionNote?: string): EvidenceItem {
    const list = this.getEvidences();
    const index = list.findIndex((e) => e.id === evidence.id);
    const timeStr = getAuthoritativeTimestamp();

    if (index >= 0) {
      const prev = list[index];
      // Security check (Mục 10 & Mục 2): Sau khi gửi, giáo viên không được tự ý sửa file
      if (actor.role === 'GIAO_VIEN' || actor.role === 'TEACHER') {
        if (prev.teacherId !== actor.id) {
          throw new Error('Bạn không có quyền sửa minh chứng của giáo viên khác!');
        }
        if (prev.status === 'SUBMITTED' || prev.status === 'TEAM_REVIEW') {
          throw new Error('Minh chứng đang chờ Tổ trưởng duyệt. Sau khi gửi, không được tự ý sửa file!');
        }
        if (prev.status === 'TEAM_APPROVED' || prev.status === 'BGH_APPROVED' || prev.status === 'LOCKED') {
          throw new Error('Minh chứng đã được phê duyệt hoặc khóa, không thể chỉnh sửa!');
        }
      }

      evidence.updatedAt = timeStr;
      // Append audit log (Mục 11: Không được xóa Audit Log)
      const audit = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.position || actor.role,
        action: actionNote || 'Cập nhật minh chứng',
        details: actionNote || `Chỉnh sửa thông tin minh chứng "${evidence.name}"`,
        previousStatus: prev.status,
        newStatus: evidence.status
      };
      evidence.auditLogs = [...(evidence.auditLogs || prev.auditLogs || []), audit];
      list[index] = evidence;
    } else {
      // New evidence (Mục 2 & Mục 10)
      evidence.uploadedAt = evidence.uploadedAt || timeStr;
      evidence.updatedAt = timeStr;
      const audit = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.position || actor.role,
        action: 'Tải lên minh chứng',
        details: `Tải lên file ${evidence.fileName} gắn với tiêu chí ${evidence.criteriaCode}`,
        previousStatus: 'DRAFT' as EvidenceStatus,
        newStatus: evidence.status
      };
      evidence.auditLogs = [audit];
      list.unshift(evidence);
    }

    safeSet(STORAGE_KEYS.EVIDENCES, list);
    return evidence;
  }

  /**
   * Nút: “GỬI TỔ TRƯỞNG DUYỆT” (Mục 2)
   * Chuyển trạng thái sang SUBMITTED, ghi Audit Log và gửi thông báo cho Tổ trưởng
   */
  public submitEvidenceToTeamLeader(evidenceId: string, actor: User): EvidenceItem {
    const list = this.getEvidences();
    const item = list.find((e) => e.id === evidenceId);
    if (!item) {
      throw new Error('Không tìm thấy minh chứng!');
    }

    if (actor.id !== item.teacherId && actor.role !== 'ADMIN') {
      throw new Error('Bạn không có quyền nộp minh chứng của giáo viên khác!');
    }

    if (item.status === 'SUBMITTED' || item.status === 'TEAM_REVIEW') {
      throw new Error('Minh chứng đã gửi lên Tổ trưởng chuyên môn rồi!');
    }

    if (item.status === 'TEAM_APPROVED' || item.status === 'BGH_APPROVED' || item.status === 'LOCKED') {
      throw new Error('Minh chứng này đã được phê duyệt chính thức, không thể gửi lại!');
    }

    const prevStatus = item.status;
    const timeStr = getAuthoritativeTimestamp();
    item.status = 'SUBMITTED';
    item.updatedAt = timeStr;

    // Audit Log Mục 7
    const audit = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.position || actor.role,
      action: 'GỬI TỔ TRƯỞNG DUYỆT',
      details: prevStatus === 'REVISION_REQUIRED'
        ? `Giáo viên nộp lại minh chứng sau khi hoàn tất bổ sung theo yêu cầu`
        : `Giáo viên nộp minh chứng "${item.name}" (Tiêu chí ${item.criteriaCode}) lên Tổ trưởng chuyên môn thẩm định`,
      previousStatus: prevStatus,
      newStatus: 'SUBMITTED' as EvidenceStatus
    };

    item.auditLogs = [...(item.auditLogs || []), audit];
    safeSet(STORAGE_KEYS.EVIDENCES, list);

    // Thông báo cho Tổ trưởng chuyên môn
    const dept = this.getDepartments().find((d) => d.id === item.departmentId);
    if (dept && dept.leaderId) {
      this.addNotification({
        userId: dept.leaderId,
        title: 'Minh chứng mới chờ duyệt',
        message: `${actor.name} (${dept.name}) đã gửi minh chứng "${item.name}" (Tiêu chí ${item.criteriaCode}) chờ bạn thẩm định.`,
        type: 'INFO',
        createdAt: timeStr,
        isRead: false
      });
    }

    return item;
  }

  /**
   * Bổ sung file minh chứng khi Tổ trưởng yêu cầu (Mục 4)
   */
  public supplementEvidenceFile(
    evidenceId: string,
    actor: User,
    data: {
      fileName: string;
      filePath: string;
      fileUrl: string;
      fileSize: string;
      fileType: string;
      teacherNote?: string;
      supplementRequestId?: string;
    }
  ): EvidenceItem {
    const list = this.getEvidences();
    const item = list.find((e) => e.id === evidenceId);
    if (!item) {
      throw new Error('Không tìm thấy minh chứng để bổ sung!');
    }

    if (actor.id !== item.teacherId && actor.role !== 'ADMIN') {
      throw new Error('Bạn không có quyền sửa minh chứng của giáo viên khác!');
    }

    const prevStatus = item.status;
    const timeStr = getAuthoritativeTimestamp();

    // Khởi tạo mảng versions nếu chưa có, đưa phiên bản hiện tại thành Version 1
    if (!item.versions || item.versions.length === 0) {
      item.versions = [
        {
          version: 1,
          versionLabel: 'Version 1',
          fileName: item.fileName,
          fileUrl: item.fileUrl,
          fileSize: item.fileSize || '1.5 MB',
          fileType: item.fileType || 'PDF',
          storagePath: item.storagePath,
          uploadedAt: item.uploadedAt || timeStr,
          uploadedBy: item.uploadedBy || item.teacherName,
          note: item.note || 'Phiên bản ban đầu khi nộp'
        }
      ];
      item.currentVersion = 1;
    }

    const nextVerNum = (item.currentVersion || item.versions.length) + 1;
    const newVersion: EvidenceVersion = {
      version: nextVerNum,
      versionLabel: `Version ${nextVerNum}`,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      fileType: data.fileType,
      storagePath: data.filePath,
      uploadedAt: timeStr,
      uploadedBy: actor.name,
      note: data.teacherNote?.trim() || 'Nộp bổ sung minh chứng mới',
      supplementRequestId: data.supplementRequestId
    };

    // Thêm version mới mà KHÔNG xóa các phiên bản cũ (Mục 3 & 4)
    item.versions.push(newVersion);
    item.currentVersion = nextVerNum;

    item.fileName = data.fileName;
    item.storagePath = data.filePath;
    item.fileUrl = data.fileUrl;
    item.fileSize = data.fileSize;
    item.fileType = data.fileType;
    if (data.teacherNote) {
      item.note = data.teacherNote.trim();
    }
    item.updatedAt = timeStr;
    item.status = 'SUBMITTED'; // Tự động gửi lại tổ trưởng duyệt sau khi bổ sung file

    // Ghi Audit Log Mục 7 (Bất biến)
    const audit = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.position || actor.role,
      action: `BỔ SUNG MINH CHỨNG (Tạo ${newVersion.versionLabel})`,
      details: `Giáo viên nộp bổ sung tệp "${data.fileName}" tạo ${newVersion.versionLabel} (không xóa ${item.versions.length - 1} phiên bản cũ).${data.teacherNote ? ` Ghi chú: "${data.teacherNote}"` : ''}`,
      previousStatus: prevStatus,
      newStatus: 'SUBMITTED' as EvidenceStatus
    };

    item.auditLogs = [...(item.auditLogs || []), audit];
    safeSet(STORAGE_KEYS.EVIDENCES, list);

    // Tự động hoàn thành nhiệm vụ bổ sung nếu có
    const suppRequests = this.getSupplementRequests();
    const relatedReq = data.supplementRequestId
      ? suppRequests.find((r) => r.id === data.supplementRequestId)
      : suppRequests.find((r) => r.evidenceId === item.id && r.status === 'PENDING');

    if (relatedReq) {
      relatedReq.status = 'RESOLVED';
      relatedReq.resolvedAt = timeStr;
      relatedReq.supplementedVersion = nextVerNum;
      relatedReq.supplementedNote = data.teacherNote;
      relatedReq.auditLogs.push({
        id: `log-supp-${Date.now()}`,
        timestamp: timeStr,
        actorName: actor.name,
        action: `Đã nộp bổ sung minh chứng (${newVersion.versionLabel})`,
        details: `Hoàn thành nhiệm vụ bổ sung tệp "${data.fileName}".`
      });
      safeSet(STORAGE_KEYS.SUPPLEMENT_REQUESTS, suppRequests);
    }

    // Gửi thông báo cho Tổ trưởng
    const dept = this.getDepartments().find((d) => d.id === item.departmentId);
    if (dept && dept.leaderId) {
      this.addNotification({
        userId: dept.leaderId,
        title: 'Giáo viên đã bổ sung minh chứng',
        message: `${actor.name} đã nộp bổ sung tệp mới (${newVersion.versionLabel}) cho minh chứng "${item.name}" (Tiêu chí ${item.criteriaCode}) và gửi lại chờ duyệt.`,
        type: 'INFO',
        createdAt: timeStr,
        isRead: false
      });
    }

    return item;
  }

  /**
   * Thẩm định minh chứng của Tổ trưởng (Mục 3, 4, 5, 6 & Mục 10 Bảo mật)
   * 3 nút: DUYỆT | YÊU CẦU BỔ SUNG | TỪ CHỐI
   */
  public teamLeaderReviewEvidence(
    evidenceId: string,
    reviewer: User,
    decision: 'APPROVE' | 'REQUEST_REVISION' | 'REJECT',
    reasonOrComment: string,
    isOutstanding?: boolean,
    deadline?: string
  ): EvidenceItem {
    const list = this.getEvidences();
    const item = list.find((e) => e.id === evidenceId);
    if (!item) {
      throw new Error('Không tìm thấy minh chứng cần thẩm định!');
    }

    // BẢO MẬT MỤC 10: Tổ trưởng chỉ được duyệt giáo viên thuộc tổ mình. Không được duyệt giáo viên tổ khác.
    const isTeamLeader = reviewer.role === 'TO_TRUONG' || reviewer.role === 'TEAM_LEADER';
    const isAdmin = reviewer.role === 'ADMIN';
    const isBgh = reviewer.role === 'BGH' || reviewer.role === 'PRINCIPAL';

    if (!isTeamLeader && !isAdmin && !isBgh) {
      throw new Error('Quyền hạn bị từ chối: Bạn không có quyền thẩm định minh chứng!');
    }

    if (isTeamLeader && !isAdmin && !isBgh) {
      if (reviewer.departmentId !== item.departmentId) {
        throw new Error(
          `Bảo mật (Mục 10): Tổ trưởng chỉ có quyền thẩm định giáo viên thuộc ${reviewer.departmentName || 'tổ mình'}. Bạn không được phép duyệt giáo viên thuộc ${item.departmentName}!`
        );
      }
    }

    const prevStatus = item.status;
    const timeStr = getAuthoritativeTimestamp();
    let newStatus: EvidenceStatus = 'TEAM_APPROVED';
    let actionLabel = 'DUYỆT MINH CHỨNG';

    if (decision === 'REQUEST_REVISION') {
      // Mục 4: Bắt buộc nhập lý do (Ví dụ: "Chưa có biên bản xác nhận.")
      if (!reasonOrComment || !reasonOrComment.trim()) {
        throw new Error('Bắt buộc phải nhập lý do khi yêu cầu bổ sung minh chứng!');
      }
      newStatus = 'REVISION_REQUIRED';
      actionLabel = 'YÊU CẦU BỔ SUNG';
    } else if (decision === 'REJECT') {
      // Mục 6: Bắt buộc có lý do
      if (!reasonOrComment || !reasonOrComment.trim()) {
        throw new Error('Bắt buộc phải nhập lý do khi từ chối minh chứng!');
      }
      newStatus = 'REJECTED';
      actionLabel = 'TỪ CHỐI MINH CHỨNG';
    } else {
      // Mục 5: DUYỆT -> status = TEAM_APPROVED
      newStatus = 'TEAM_APPROVED';
      actionLabel = 'DUYỆT MINH CHỨNG';
    }

    // Lưu các trường: reviewer_id, reviewed_at, review_comment (Mục 5)
    item.status = newStatus;
    item.reviewerId = reviewer.id;
    item.reviewerName = reviewer.name;
    item.reviewerRole = reviewer.position || (isTeamLeader ? 'Tổ trưởng chuyên môn' : reviewer.role);
    item.reviewDate = timeStr;
    item.reviewNote = reasonOrComment ? reasonOrComment.trim() : 'Đạt yêu cầu thẩm định';
    item.updatedAt = timeStr;

    if (typeof isOutstanding === 'boolean') {
      item.isOutstanding = isOutstanding;
    }

    // Audit Log Mục 7: Lưu toàn bộ Người thực hiện, Thời gian, Hành động, Trạng thái trước, Trạng thái sau, Nhận xét
    const audit = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorRole: item.reviewerRole,
      action: actionLabel,
      previousStatus: prevStatus,
      newStatus: newStatus,
      details: reasonOrComment ? reasonOrComment.trim() : (newStatus === 'TEAM_APPROVED' ? 'Tổ trưởng đã duyệt đạt yêu cầu' : '')
    };

    item.auditLogs = [...(item.auditLogs || []), audit];
    safeSet(STORAGE_KEYS.EVIDENCES, list);

    // Mục 2: Khi chọn "YÊU CẦU BỔ SUNG", hệ thống tạo nhiệm vụ cho giáo viên
    // Hiển thị: Lý do, Người yêu cầu, Thời gian, Hạn bổ sung
    if (newStatus === 'REVISION_REQUIRED') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const defDeadline = d.toISOString().split('T')[0];
      const finalDeadline = deadline || defDeadline;

      const requests = this.getSupplementRequests();
      const newReq: SupplementRequest = {
        id: `supp-${Date.now()}`,
        evidenceId: item.id,
        evidenceName: item.name,
        criteriaId: item.criteriaId,
        criteriaCode: item.criteriaCode,
        criteriaTitle: item.criteriaTitle,
        teacherId: item.teacherId,
        teacherName: item.teacherName,
        departmentId: item.departmentId,
        departmentName: item.departmentName,
        requesterId: reviewer.id,
        requesterName: reviewer.name,
        requesterRole: reviewer.role === 'BGH' ? 'BGH' : reviewer.role === 'ADMIN' ? 'ADMIN' : 'TO_TRUONG',
        reason: reasonOrComment.trim(),
        deadline: finalDeadline,
        createdAt: timeStr,
        status: 'PENDING',
        auditLogs: [
          {
            id: `log-supp-${Date.now()}`,
            timestamp: timeStr,
            actorName: `${reviewer.name} (${item.reviewerRole})`,
            action: 'Tạo nhiệm vụ yêu cầu bổ sung minh chứng',
            details: `Lý do: "${reasonOrComment.trim()}". Hạn chót: ${finalDeadline}`
          }
        ]
      };
      requests.unshift(newReq);
      safeSet(STORAGE_KEYS.SUPPLEMENT_REQUESTS, requests);

      // Mục 6: THÔNG BÁO - Khi có yêu cầu bổ sung: Gửi notification cho giáo viên
      this.addNotification({
        userId: item.teacherId,
        title: `Yêu cầu bổ sung minh chứng ${item.criteriaCode}`,
        message: `${reviewer.name} (${item.reviewerRole}) yêu cầu bạn bổ sung minh chứng "${item.name}". Lý do: "${reasonOrComment.trim()}". Hạn bổ sung: ${finalDeadline}.`,
        type: 'ACTION',
        createdAt: timeStr,
        isRead: false
      });
    } else {
      // Gửi thông báo thông thường khi duyệt hoặc từ chối
      let notifTitle = `Minh chứng ${item.criteriaCode} đã được Tổ trưởng phê duyệt`;
      let notifMsg = `Minh chứng "${item.name}" đã được Tổ trưởng duyệt đạt yêu cầu.`;
      let notifType: 'SUCCESS' | 'WARNING' | 'INFO' | 'ACTION' = 'SUCCESS';

      if (newStatus === 'REJECTED') {
        notifTitle = `Minh chứng ${item.criteriaCode} bị từ chối`;
        notifMsg = `Tổ trưởng ${reviewer.name} từ chối minh chứng "${item.name}". Lý do: "${reasonOrComment.trim()}".`;
        notifType = 'WARNING';
      }

      this.addNotification({
        userId: item.teacherId,
        title: notifTitle,
        message: notifMsg,
        type: notifType,
        createdAt: timeStr,
        isRead: false
      });
    }

    return item;
  }

  public reviewEvidence(
    evidenceId: string,
    reviewer: User,
    status: EvidenceStatus,
    note: string,
    isOutstanding?: boolean
  ): EvidenceItem | null {
    if (status === 'TEAM_APPROVED' || status === 'REVISION_REQUIRED' || status === 'REJECTED') {
      const decision = status === 'TEAM_APPROVED' ? 'APPROVE' : status === 'REVISION_REQUIRED' ? 'REQUEST_REVISION' : 'REJECT';
      return this.teamLeaderReviewEvidence(evidenceId, reviewer, decision, note, isOutstanding);
    }

    const list = this.getEvidences();
    const item = list.find((e) => e.id === evidenceId);
    if (!item) return null;

    const prevStatus = item.status;
    item.status = status;
    item.reviewerId = reviewer.id;
    item.reviewerName = reviewer.name;
    item.reviewerRole = reviewer.position || reviewer.role;
    const timeStr = getAuthoritativeTimestamp();
    item.reviewDate = timeStr;
    item.reviewNote = note;
    item.updatedAt = timeStr;
    if (typeof isOutstanding === 'boolean') {
      item.isOutstanding = isOutstanding;
    }

    let actionLabel = 'Thẩm định minh chứng';
    if (status === 'BGH_APPROVED') actionLabel = 'BGH phê duyệt minh chứng';

    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorRole: reviewer.position || reviewer.role,
      action: actionLabel,
      details: note || 'BGH thẩm định',
      previousStatus: prevStatus,
      newStatus: status
    };
    item.auditLogs.push(log);

    safeSet(STORAGE_KEYS.EVIDENCES, list);
    return item;
  }

  public deleteEvidence(id: string, actor: User): boolean {
    const list = this.getEvidences();
    const item = list.find((e) => e.id === id);
    if (!item) return false;

    // Security check (Mục 10): Teacher can only delete own evidence when not approved
    if (actor.role === 'GIAO_VIEN' || actor.role === 'TEACHER') {
      if (item.teacherId !== actor.id) {
        return false;
      }
      if (item.status === 'TEAM_APPROVED' || item.status === 'BGH_APPROVED' || item.status === 'LOCKED') {
        return false;
      }
    }

    const filtered = list.filter((e) => e.id !== id);
    safeSet(STORAGE_KEYS.EVIDENCES, filtered);
    return true;
  }

  // Evaluations & Scoring
  public getEvaluations(): Record<string, EvaluationRecord> {
    return safeGet<Record<string, EvaluationRecord>>(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
  }

  public getEvaluation(teacherId: string, schoolYear = '2026-2027', semester = 'HKI'): EvaluationRecord {
    const evals = this.getEvaluations();
    const key = teacherId;
    if (evals[key] && evals[key].semester === semester && evals[key].schoolYear === schoolYear) {
      return evals[key];
    }

    // Generate empty evaluation record for this teacher
    const emptyScores: Record<string, any> = {};
    for (const group of CRITERIA_GROUPS) {
      for (const crit of group.criteria) {
        emptyScores[crit.id] = {
          criteriaId: crit.id,
          criteriaCode: crit.code,
          selfScore: 0,
          teamScore: 0,
          bghScore: 0
        };
      }
    }

    const newRecord: EvaluationRecord = {
      id: `eval-${teacherId}-${semester}`,
      teacherId,
      schoolYear,
      semester: semester as any,
      scores: emptyScores,
      selfTotal: 0,
      teamTotal: 0,
      bghTotal: 0,
      bonusPoints: 0,
      deductionPoints: 0,
      finalScore: 0,
      rating: 'D',
      status: 'CHUA_BAT_DAU',
      discrepancyAlert: false,
      updatedAt: new Date().toISOString()
    };

    evals[key] = newRecord;
    safeSet(STORAGE_KEYS.EVALUATIONS, evals);
    return newRecord;
  }

  public saveEvaluation(record: EvaluationRecord, actor: User): EvaluationRecord {
    const evals = this.getEvaluations();

    // Recalculate totals
    let selfSum = 0;
    let teamSum = 0;
    let bghSum = 0;

    for (const critId in record.scores) {
      const s = record.scores[critId];
      selfSum += Number(s.selfScore) || 0;
      teamSum += Number(s.teamScore) || 0;
      bghSum += Number(s.bghScore) || 0;
    }

    record.selfTotal = Math.min(100, Math.round(selfSum * 10) / 10);
    record.teamTotal = Math.min(100, Math.round(teamSum * 10) / 10);
    record.bghTotal = Math.min(100, Math.round(bghSum * 10) / 10);

    // Fetch bonus and deduction for teacher
    const bonuses = this.getBonusList().filter(
      (b) => b.teacherId === record.teacherId && b.status === 'APPROVED'
    );
    const bonusTotal = bonuses.reduce((acc, curr) => acc + curr.points, 0);

    const deductions = this.getDeductions().filter((d) => d.teacherId === record.teacherId);
    const deductionTotal = deductions.reduce((acc, curr) => acc + curr.points, 0);

    record.bonusPoints = bonusTotal;
    record.deductionPoints = deductionTotal;

    // Use BGH total if reviewed, otherwise Team total, otherwise Self total
    const effectiveBaseScore =
      record.bghTotal > 0
        ? record.bghTotal
        : record.teamTotal > 0
        ? record.teamTotal
        : record.selfTotal;

    // ENGINE TÍNH ĐIỂM (Mục 1, 4, 5): Tính điểm cuối & áp dụng điều kiện khống chế
    const engineResult = evaluateTeacherScore(
      effectiveBaseScore,
      bonusTotal,
      deductionTotal,
      {
        isControlled: record.isControlled,
        controlledMaxRating: record.controlledMaxRating,
        controlledReason: record.controlledReason,
        controlledMarkedBy: record.controlledMarkedBy
      }
    );

    record.finalScore = engineResult.finalScore;
    record.originalUncappedRating = engineResult.calculatedRating;
    record.rating = engineResult.finalRating;
    record.isControlled = engineResult.isControlled;

    // Calculate discrepancy warning between selfTotal & teamTotal (Mục 3)
    const threshold = this.getSettings().discrepancyThreshold || 5.0;
    const discResult = checkDiscrepancy(record.selfTotal, record.teamTotal, threshold);
    record.discrepancyAlert = discResult.hasDiscrepancy;

    record.updatedAt = getAuthoritativeTimestamp();
    evals[record.teacherId] = record;
    safeSet(STORAGE_KEYS.EVALUATIONS, evals);

    return record;
  }

  /**
   * BGH Điều chỉnh điểm tiêu chí (Mục 5: Bắt buộc nhập Điểm cũ, Điểm mới, Lý do, Người điều chỉnh, Thời gian, Căn cứ/minh chứng. Không cho sửa âm thầm)
   */
  public bghAdjustScore(
    teacherId: string,
    criteriaId: string,
    criteriaCode: string,
    newScore: number,
    reason: string,
    evidenceBasis: string,
    actor: User
  ): EvaluationRecord {
    // Bảo mật Mục 7: Chỉ BGH và Admin có quyền rà soát cấp BGH
    const normRole = normalizeRole(actor.role);
    if (normRole !== 'BGH' && normRole !== 'ADMIN') {
      throw new Error('Bảo mật (Mục 7): Chỉ Ban Giám hiệu và Quản trị viên mới có quyền điều chỉnh điểm cấp BGH!');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Mục 5: Bắt buộc phải nhập Lý do điều chỉnh điểm!');
    }

    if (!evidenceBasis || !evidenceBasis.trim()) {
      throw new Error('Mục 5: Bắt buộc phải nêu rõ Căn cứ / Minh chứng điều chỉnh điểm!');
    }

    const record = this.getEvaluation(teacherId);
    const teacher = this.getUsers().find((u) => u.id === teacherId);
    const timeStr = getAuthoritativeTimestamp();

    if (!record.scores[criteriaId]) {
      record.scores[criteriaId] = {
        criteriaId,
        criteriaCode,
        selfScore: 0,
        teamScore: 0,
        bghScore: 0
      };
    }

    const oldScore = Number(record.scores[criteriaId].bghScore ?? record.scores[criteriaId].teamScore ?? 0);

    // Cập nhật điểm BGH
    record.scores[criteriaId].bghScore = newScore;
    record.scores[criteriaId].bghNote = `${reason} (Căn cứ: ${evidenceBasis})`;

    // Lưu bản ghi lịch sử điều chỉnh điểm chi tiết (Mục 5)
    const adjustment: BghScoreAdjustment = {
      id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      evaluationId: record.id,
      teacherId,
      teacherName: teacher?.name || 'Giáo viên',
      criteriaId,
      criteriaCode,
      oldScore,
      newScore,
      reason: reason.trim(),
      evidenceBasis: evidenceBasis.trim(),
      adjustedBy: actor.name,
      adjustedById: actor.id,
      adjustedAt: timeStr
    };

    record.bghAdjustments = [...(record.bghAdjustments || []), adjustment];

    // Ghi Audit Log bất biến (Mục 8)
    const saved = this.saveEvaluation(record, actor);

    // Gửi thông báo tới giáo viên và tổ trưởng
    this.addNotification({
      userId: teacherId,
      title: `BGH đã điều chỉnh điểm tiêu chí ${criteriaCode}`,
      message: `BGH (${actor.name}) đã điều chỉnh điểm tiêu chí ${criteriaCode}: từ ${oldScore}đ thành ${newScore}đ. Lý do: "${reason.trim()}". Căn cứ: "${evidenceBasis.trim()}".`,
      type: 'INFO',
      createdAt: timeStr,
      isRead: false
    });

    return saved;
  }

  /**
   * BGH Duyệt hồ sơ thi đua (Mục 6: BGH_APPROVED -> CHỜ HỘI ĐỒNG TĐKT)
   */
  public bghApproveEvaluation(teacherId: string, actor: User, comment?: string): EvaluationRecord {
    const normRole = normalizeRole(actor.role);
    if (normRole !== 'BGH' && normRole !== 'ADMIN') {
      throw new Error('Bảo mật (Mục 7): Chỉ Ban Giám hiệu và Admin mới có quyền xác nhận phê duyệt cấp BGH!');
    }

    const record = this.getEvaluation(teacherId);
    const teacher = this.getUsers().find((u) => u.id === teacherId);
    const timeStr = getAuthoritativeTimestamp();

    record.status = 'BGH_APPROVED';
    record.bghApprovedAt = timeStr;
    record.bghApprovedBy = actor.name;
    if (comment && comment.trim()) {
      record.bghComment = comment.trim();
    }

    const saved = this.saveEvaluation(record, actor);

    // Thông báo cho giáo viên
    this.addNotification({
      userId: teacherId,
      title: 'BGH đã phê duyệt hồ sơ thi đua',
      message: `Ban Giám hiệu (${actor.name}) đã phê duyệt hồ sơ thi đua của bạn đạt ${saved.finalScore}đ (Mức ${saved.rating}). Hồ sơ được chuyển CHỜ HỘI ĐỒNG TĐKT.`,
      type: 'SUCCESS',
      createdAt: timeStr,
      isRead: false
    });

    return saved;
  }

  /**
   * BGH Yêu cầu giải trình (Mục 4: Chênh lệch >= 5 hoặc cần làm rõ)
   */
  public bghRequestExplanation(teacherId: string, actor: User, reason: string): EvaluationRecord {
    const normRole = normalizeRole(actor.role);
    if (normRole !== 'BGH' && normRole !== 'ADMIN') {
      throw new Error('Chỉ Ban Giám hiệu và Admin mới có quyền yêu cầu giải trình!');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Bắt buộc phải nhập nội dung/lý do yêu cầu giải trình!');
    }

    const record = this.getEvaluation(teacherId);
    const timeStr = getAuthoritativeTimestamp();

    record.bghExplanationRequired = true;
    record.discrepancyAlert = true;
    record.bghComment = `[BGH Yêu cầu giải trình]: ${reason.trim()}`;

    const saved = this.saveEvaluation(record, actor);

    this.addNotification({
      userId: teacherId,
      title: 'BGH yêu cầu giải trình hồ sơ thi đua',
      message: `Ban Giám hiệu (${actor.name}) yêu cầu bạn gửi giải trình: "${reason.trim()}". Vui lòng vào mục Giải trình để phản hồi.`,
      type: 'WARNING',
      createdAt: timeStr,
      isRead: false
    });

    return saved;
  }

  /**
   * BGH Yêu cầu bổ sung minh chứng (Mục 2 & Mục 4)
   * Khi BGH chọn "YÊU CẦU BỔ SUNG": Hệ thống tạo nhiệm vụ cho giáo viên (Lý do, Người yêu cầu, Thời gian, Hạn bổ sung)
   */
  public bghRequestSupplement(teacherId: string, actor: User, reason: string, deadline?: string): EvaluationRecord {
    const normRole = normalizeRole(actor.role);
    if (normRole !== 'BGH' && normRole !== 'ADMIN') {
      throw new Error('Chỉ Ban Giám hiệu và Admin mới có quyền yêu cầu bổ sung!');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Bắt buộc phải nhập nội dung yêu cầu bổ sung minh chứng!');
    }

    const record = this.getEvaluation(teacherId);
    const timeStr = getAuthoritativeTimestamp();

    record.bghSupplementRequired = true;
    record.bghComment = `[BGH Yêu cầu bổ sung]: ${reason.trim()}`;

    const saved = this.saveEvaluation(record, actor);

    const d = new Date();
    d.setDate(d.getDate() + 7);
    const defDeadline = d.toISOString().split('T')[0];
    const finalDeadline = deadline || defDeadline;

    // Tạo nhiệm vụ trong bảng SupplementRequest (Mục 2)
    this.createSupplementRequest(
      {
        teacherId,
        reason: reason.trim(),
        deadline: finalDeadline
      },
      actor
    );

    return saved;
  }

  /**
   * BGH Từ chối / Trả lại hồ sơ cho tổ thẩm định lại (Mục 4)
   */
  public bghRejectEvaluation(teacherId: string, actor: User, reason: string): EvaluationRecord {
    const normRole = normalizeRole(actor.role);
    if (normRole !== 'BGH' && normRole !== 'ADMIN') {
      throw new Error('Chỉ Ban Giám hiệu và Admin mới có quyền từ chối hồ sơ thi đua!');
    }

    if (!reason || !reason.trim()) {
      throw new Error('Bắt buộc phải nhập lý do từ chối hồ sơ thi đua!');
    }

    const record = this.getEvaluation(teacherId);
    const timeStr = getAuthoritativeTimestamp();

    record.status = 'CHO_TO_DUYET'; // Trả về tổ chuyên môn rà soát lại
    record.bghComment = `[BGH Từ chối - Yêu cầu tổ họp lại]: ${reason.trim()}`;

    const saved = this.saveEvaluation(record, actor);

    // Gửi thông báo cho giáo viên
    this.addNotification({
      userId: teacherId,
      title: 'BGH trả lại hồ sơ thi đua',
      message: `Ban Giám hiệu (${actor.name}) đã trả lại hồ sơ thi đua của bạn về Tổ chuyên môn. Lý do: "${reason.trim()}".`,
      type: 'WARNING',
      createdAt: timeStr,
      isRead: false
    });

    // Gửi thông báo cho Tổ trưởng
    const teacher = this.getUsers().find((u) => u.id === teacherId);
    if (teacher) {
      const dept = this.getDepartments().find((d) => d.id === teacher.departmentId);
      if (dept && dept.leaderId) {
        this.addNotification({
          userId: dept.leaderId,
          title: `BGH trả lại hồ sơ của ${teacher.name}`,
          message: `BGH yêu cầu Tổ chuyên môn họp rà soát lại hồ sơ của giáo viên ${teacher.name}. Lý do: "${reason.trim()}".`,
          type: 'WARNING',
          createdAt: timeStr,
          isRead: false
        });
      }
    }

    return saved;
  }

  public calculateRating(score: number, outstandingEvidencesCount = 0, hasMajorDeduction = false): RatingLevel {
    const thresholds = this.getSettings().ratingThresholds || DEFAULT_RATING_THRESHOLDS;
    const baseRating = calculateRatingWithConfig(score, thresholds);

    // Xếp loại A+ yêu cầu không có vi phạm lớn
    if (baseRating === 'A_PLUS') {
      if (hasMajorDeduction) {
        return 'A'; // Hạ xuống A nếu bị trừ điểm kỷ luật
      }
      return 'A_PLUS';
    }
    return baseRating;
  }

  // 5. ĐIỀU KIỆN KHỐNG CHẾ (CONTROLLED)
  public setControlledCondition(
    teacherId: string,
    isControlled: boolean,
    maxRating?: RatingLevel,
    reason?: string,
    actor?: User
  ): EvaluationRecord {
    const record = this.getEvaluation(teacherId);
    const actorUser = actor || this.getCurrentUser();
    const timeStr = getAuthoritativeTimestamp();

    record.isControlled = isControlled;
    record.controlledMaxRating = isControlled ? maxRating : undefined;
    record.controlledReason = isControlled ? reason?.trim() : undefined;
    record.controlledMarkedBy = isControlled ? `${actorUser.name} (${actorUser.position || actorUser.role})` : undefined;
    record.controlledMarkedAt = isControlled ? timeStr : undefined;

    const saved = this.saveEvaluation(record, actorUser);

    // Ghi Audit Log bất biến (Mục 8)
    this.addNotification({
      userId: teacherId,
      title: isControlled ? 'Hồ sơ bị khống chế theo điều kiện thi đua' : 'Đã gỡ bỏ điều kiện khống chế thi đua',
      message: isControlled
        ? `Hội đồng/BGH đã áp dụng khống chế mức xếp loại tối đa: ${maxRating}. Lý do: "${reason}".`
        : 'Hồ sơ của bạn đã được gỡ bỏ điều kiện khống chế thi đua.',
      type: isControlled ? 'WARNING' : 'INFO',
      createdAt: timeStr,
      isRead: false
    });

    return saved;
  }

  // Bonus Points (Mục 2, 6, 7, 8)
  public getBonusList(): BonusItem[] {
    return safeGet<BonusItem[]>(STORAGE_KEYS.BONUS, INITIAL_BONUS_LIST);
  }

  public saveBonus(bonus: BonusItem, actor?: User): BonusItem {
    const list = this.getBonusList();
    const actorUser = actor || this.getCurrentUser();
    const timeStr = getAuthoritativeTimestamp();

    // 7. Validation chống cộng trùng cùng một thành tích
    const dupCheck = checkDuplicateBonus(bonus, list);
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.message || 'Không được cộng trùng cùng một thành tích theo Quy chế!');
    }

    const index = list.findIndex((b) => b.id === bonus.id);
    const isNew = index < 0;

    const auditLog: ScoreAuditLog = {
      id: `log-b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      actorName: actorUser.name,
      actorRole: actorUser.role,
      action: isNew ? 'Thêm điểm cộng mới' : 'Cập nhật điểm cộng',
      details: `[${bonus.categoryLabel}] ${bonus.title} (+${bonus.points}đ). Minh chứng: ${bonus.evidenceName || bonus.evidenceUrl || 'Chưa đính kèm'}`
    };

    bonus.auditLogs = [...(bonus.auditLogs || []), auditLog];

    if (!isNew) {
      list[index] = bonus;
    } else {
      list.push(bonus);
    }
    safeSet(STORAGE_KEYS.BONUS, list);

    // Refresh evaluation scores for this teacher
    const ev = this.getEvaluation(bonus.teacherId);
    this.saveEvaluation(ev, actorUser);

    return bonus;
  }

  public approveBonus(bonusId: string, actor: User, comment?: string): BonusItem {
    const list = this.getBonusList();
    const item = list.find((b) => b.id === bonusId);
    if (!item) throw new Error('Không tìm thấy bản ghi điểm cộng!');

    // 6. MINH CHỨNG: Điểm cộng phải có minh chứng. Không có minh chứng → không cho duyệt!
    const check = validateBonusApproval(item);
    if (!check.allowed) {
      throw new Error(check.error || 'Điểm cộng phải có minh chứng mới được duyệt!');
    }

    const timeStr = getAuthoritativeTimestamp();
    item.status = 'APPROVED';
    item.verifiedBy = `${actor.name} (${actor.position || actor.role})`;
    item.verifiedById = actor.id;
    if (comment) item.note = comment;

    const log: ScoreAuditLog = {
      id: `log-b-${Date.now()}`,
      timestamp: timeStr,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Phê duyệt điểm cộng (APPROVED)',
      details: `Duyệt +${item.points}đ cho thành tích: "${item.title}". Căn cứ minh chứng: ${item.evidenceName || item.evidenceUrl}`
    };
    item.auditLogs = [...(item.auditLogs || []), log];

    safeSet(STORAGE_KEYS.BONUS, list);

    // Refresh evaluation scores
    const ev = this.getEvaluation(item.teacherId);
    this.saveEvaluation(ev, actor);

    return item;
  }

  public rejectBonus(bonusId: string, actor: User, reason: string): BonusItem {
    const list = this.getBonusList();
    const item = list.find((b) => b.id === bonusId);
    if (!item) throw new Error('Không tìm thấy bản ghi điểm cộng!');

    if (!reason || !reason.trim()) {
      throw new Error('Bắt buộc phải nhập lý do từ chối điểm cộng!');
    }

    const timeStr = getAuthoritativeTimestamp();
    item.status = 'REJECTED';
    item.verifiedBy = `${actor.name} (${actor.position || actor.role})`;
    item.verifiedById = actor.id;
    item.note = `Từ chối: ${reason.trim()}`;

    const log: ScoreAuditLog = {
      id: `log-b-${Date.now()}`,
      timestamp: timeStr,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'Từ chối điểm cộng (REJECTED)',
      details: `Từ chối điểm cộng "${item.title}". Lý do: "${reason.trim()}"`
    };
    item.auditLogs = [...(item.auditLogs || []), log];

    safeSet(STORAGE_KEYS.BONUS, list);

    const ev = this.getEvaluation(item.teacherId);
    this.saveEvaluation(ev, actor);

    return item;
  }

  public deleteBonus(id: string, actor?: User): void {
    const list = this.getBonusList();
    const item = list.find((b) => b.id === id);
    const actorUser = actor || this.getCurrentUser();
    const filtered = list.filter((b) => b.id !== id);
    safeSet(STORAGE_KEYS.BONUS, filtered);
    if (item) {
      const ev = this.getEvaluation(item.teacherId);
      this.saveEvaluation(ev, actorUser);
    }
  }

  // Deductions (Mục 3 & Mục 8)
  public getDeductions(): DeductionItem[] {
    return safeGet<DeductionItem[]>(STORAGE_KEYS.DEDUCTIONS, INITIAL_DEDUCTION_LIST);
  }

  public saveDeduction(item: DeductionItem, actor?: User): DeductionItem {
    const check = validateDeduction(item);
    if (!check.valid) {
      throw new Error(check.error || 'Dữ liệu điểm trừ không hợp lệ!');
    }

    const list = this.getDeductions();
    const actorUser = actor || this.getCurrentUser();
    const timeStr = getAuthoritativeTimestamp();

    const index = list.findIndex((d) => d.id === item.id);
    const isNew = index < 0;

    const audit: ScoreAuditLog = {
      id: `log-d-${Date.now()}`,
      timestamp: timeStr,
      actorName: actorUser.name,
      actorRole: actorUser.role,
      action: isNew ? 'Ghi nhận điểm trừ mới' : 'Cập nhật biên bản điểm trừ',
      details: `Trừ -${item.points}đ. Lý do: ${item.reason}. Căn cứ/Minh chứng: ${item.evidenceBasis || item.evidenceUrl || 'Biên bản kiểm tra'}`
    };

    item.auditLogs = [...(item.auditLogs || []), audit];

    if (!isNew) {
      list[index] = item;
    } else {
      list.push(item);
    }
    safeSet(STORAGE_KEYS.DEDUCTIONS, list);

    // Refresh evaluation scores
    const ev = this.getEvaluation(item.teacherId);
    this.saveEvaluation(ev, actorUser);

    return item;
  }

  public deleteDeduction(id: string, actor?: User): void {
    const list = this.getDeductions();
    const item = list.find((d) => d.id === id);
    const actorUser = actor || this.getCurrentUser();
    const filtered = list.filter((d) => d.id !== id);
    safeSet(STORAGE_KEYS.DEDUCTIONS, filtered);
    if (item) {
      const ev = this.getEvaluation(item.teacherId);
      this.saveEvaluation(ev, actorUser);
    }
  }

  // =========================================================================
  // MODULE: GIẢI TRÌNH VÀ BỔ SUNG MINH CHỨNG (Mục 1, 2, 3, 4, 5, 6, 7)
  // =========================================================================

  // Appeals (Đơn giải trình)
  public getAppeals(): AppealItem[] {
    return safeGet<AppealItem[]>(STORAGE_KEYS.APPEALS, INITIAL_APPEALS);
  }

  public saveAppeal(appeal: AppealItem, actor?: User): AppealItem {
    const list = this.getAppeals();
    const actorUser = actor || this.getCurrentUser();
    const timeStr = getAuthoritativeTimestamp();

    const index = list.findIndex((a) => a.id === appeal.id);
    const isNew = index < 0;

    if (isNew) {
      if (!appeal.status) appeal.status = 'SUBMITTED';
      if (!appeal.submittedAt) appeal.submittedAt = timeStr;

      const initialLog: AppealAuditLog = {
        id: `log-app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        actorId: actorUser.id,
        actorName: actorUser.name,
        actorRole: actorUser.role,
        action: 'GỬI ĐƠN GIẢI TRÌNH (SUBMITTED)',
        details: `Nội dung giải trình: "${appeal.content}". Tiêu chí liên quan: ${appeal.criteriaCode || 'Chung'}. Minh chứng đính kèm: ${appeal.relatedEvidenceName || (appeal.attachedFiles && appeal.attachedFiles.length > 0 ? appeal.attachedFiles[0].name : 'Không có')}`,
        newStatus: 'SUBMITTED'
      };

      appeal.auditLogs = [initialLog];
      list.unshift(appeal);

      // Thông báo cho Tổ trưởng & Ban giám hiệu
      const teacher = this.getUserById(appeal.teacherId);
      if (teacher) {
        const dept = this.getDepartments().find((d) => d.id === teacher.departmentId);
        if (dept && dept.leaderId) {
          this.addNotification({
            userId: dept.leaderId,
            title: `Đơn giải trình mới từ ${teacher.name}`,
            message: `Giáo viên ${teacher.name} vừa gửi giải trình: "${appeal.title}" (Tiêu chí: ${appeal.criteriaCode || 'Chung'}). Vui lòng xem xét xử lý.`,
            type: 'ACTION',
            createdAt: timeStr,
            isRead: false
          });
        }
      }
    } else {
      const existing = list[index];
      // Bảo tồn audit logs bất biến (Mục 7)
      appeal.auditLogs = existing.auditLogs || [];
      list[index] = appeal;
    }

    safeSet(STORAGE_KEYS.APPEALS, list);
    return appeal;
  }

  public updateAppealStatus(
    appealId: string,
    status: AppealStatus,
    responseContent: string,
    actor: User
  ): AppealItem {
    const list = this.getAppeals();
    const appeal = list.find((a) => a.id === appealId);
    if (!appeal) throw new Error('Không tìm thấy đơn giải trình!');

    const timeStr = getAuthoritativeTimestamp();
    const prevStatus = appeal.status;

    appeal.status = status;
    appeal.responseBy = `${actor.name} (${actor.position || actor.role})`;
    appeal.responseRole = actor.position || actor.role;
    appeal.responseContent = responseContent.trim();
    appeal.respondedAt = timeStr;

    // Audit Log bất biến (Mục 7: Lưu toàn bộ lịch sử. Không cho xóa lịch sử.)
    let actionText = `Cập nhật trạng thái giải trình: ${status}`;
    if (status === 'UNDER_REVIEW') actionText = 'Tiếp nhận xử lý giải trình (UNDER_REVIEW)';
    if (status === 'ACCEPTED') actionText = 'Chấp thuận giải trình (ACCEPTED)';
    if (status === 'REJECTED') actionText = 'Từ chối giải trình (REJECTED)';

    const auditLog: AppealAuditLog = {
      id: `log-app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.position || actor.role,
      action: actionText,
      details: responseContent.trim() ? `Ý kiến phản hồi: "${responseContent.trim()}"` : 'Đã cập nhật trạng thái',
      previousStatus: prevStatus,
      newStatus: status
    };

    appeal.auditLogs = [...(appeal.auditLogs || []), auditLog];
    safeSet(STORAGE_KEYS.APPEALS, list);

    // Gửi thông báo cho giáo viên
    this.addNotification({
      userId: appeal.teacherId,
      title: `Đơn giải trình đã có phản hồi [${status}]`,
      message: `${actor.name} (${actor.position || actor.role}) đã ${
        status === 'ACCEPTED'
          ? 'chấp thuận'
          : status === 'REJECTED'
          ? 'từ chối'
          : 'chuyển sang trạng thái đang xem xét'
      } giải trình "${appeal.title}". Phản hồi: "${responseContent.trim() || 'Đang xử lý'}"`,
      type: status === 'ACCEPTED' ? 'SUCCESS' : status === 'REJECTED' ? 'WARNING' : 'INFO',
      createdAt: timeStr,
      isRead: false
    });

    return appeal;
  }

  // Supplement Requests (Nhiệm vụ Yêu cầu bổ sung minh chứng - Mục 2 & 6)
  public getSupplementRequests(): SupplementRequest[] {
    return safeGet<SupplementRequest[]>(STORAGE_KEYS.SUPPLEMENT_REQUESTS, INITIAL_SUPPLEMENT_REQUESTS);
  }

  public createSupplementRequest(
    data: {
      evidenceId?: string;
      evidenceName?: string;
      criteriaId?: string;
      criteriaCode?: string;
      criteriaTitle?: string;
      teacherId: string;
      reason: string;
      deadline: string;
    },
    actor: User
  ): SupplementRequest {
    if (!data.reason || !data.reason.trim()) {
      throw new Error('Bắt buộc phải nhập lý do yêu cầu bổ sung!');
    }
    if (!data.deadline) {
      throw new Error('Bắt buộc phải chọn hạn bổ sung!');
    }

    const requests = this.getSupplementRequests();
    const teacher = this.getUserById(data.teacherId);
    if (!teacher) throw new Error('Không tìm thấy giáo viên!');

    const timeStr = getAuthoritativeTimestamp();
    const normRole = normalizeRole(actor.role);
    const requesterRole = normRole === 'BGH' ? 'BGH' : normRole === 'ADMIN' ? 'ADMIN' : 'TO_TRUONG';

    const newReq: SupplementRequest = {
      id: `supp-${Date.now()}`,
      evidenceId: data.evidenceId,
      evidenceName: data.evidenceName,
      criteriaId: data.criteriaId,
      criteriaCode: data.criteriaCode,
      criteriaTitle: data.criteriaTitle,
      teacherId: data.teacherId,
      teacherName: teacher.name,
      departmentId: teacher.departmentId,
      departmentName: teacher.departmentName,
      requesterId: actor.id,
      requesterName: actor.name,
      requesterRole,
      reason: data.reason.trim(),
      deadline: data.deadline,
      createdAt: timeStr,
      status: 'PENDING',
      auditLogs: [
        {
          id: `log-supp-${Date.now()}`,
          timestamp: timeStr,
          actorName: `${actor.name} (${actor.position || requesterRole})`,
          action: 'Tạo nhiệm vụ yêu cầu bổ sung minh chứng',
          details: `Lý do: "${data.reason.trim()}". Hạn chót: ${data.deadline}`
        }
      ]
    };

    requests.unshift(newReq);
    safeSet(STORAGE_KEYS.SUPPLEMENT_REQUESTS, requests);

    // Cập nhật trạng thái minh chứng thành REVISION_REQUIRED nếu có evidenceId
    if (data.evidenceId) {
      const evidences = this.getEvidences();
      const targetEvidence = evidences.find((e) => e.id === data.evidenceId);
      if (targetEvidence) {
        targetEvidence.status = 'REVISION_REQUIRED';
        targetEvidence.reviewNote = data.reason.trim();
        targetEvidence.updatedAt = timeStr;
        targetEvidence.auditLogs = [
          ...(targetEvidence.auditLogs || []),
          {
            id: `log-ev-${Date.now()}`,
            timestamp: timeStr,
            actorId: actor.id,
            actorName: actor.name,
            actorRole: requesterRole,
            action: 'Yêu cầu bổ sung minh chứng',
            details: `Lý do: "${data.reason.trim()}". Hạn nộp: ${data.deadline}`,
            previousStatus: targetEvidence.status,
            newStatus: 'REVISION_REQUIRED'
          }
        ];
        safeSet(STORAGE_KEYS.EVIDENCES, evidences);
      }
    }

    // Mục 6: THÔNG BÁO - Khi có yêu cầu bổ sung: Gửi notification cho giáo viên
    this.addNotification({
      userId: data.teacherId,
      title: `Yêu cầu bổ sung minh chứng [${data.criteriaCode || 'Chuyên môn'}]`,
      message: `${actor.name} (${actor.position || requesterRole}) yêu cầu bạn bổ sung minh chứng "${data.evidenceName || data.criteriaTitle || 'tiêu chí ' + data.criteriaCode}". Lý do: "${data.reason.trim()}". Hạn bổ sung: ${data.deadline}.`,
      type: 'ACTION',
      createdAt: timeStr,
      isRead: false
    });

    return newReq;
  }

  /**
   * BỔ SUNG MINH CHỨNG (Mục 3, 4, 7)
   * Không xóa minh chứng cũ. Tạo version mới (Version 1, Version 2, Version 3).
   * Lưu toàn bộ lịch sử Audit Log bất biến.
   */
  public supplementEvidence(
    evidenceId: string,
    supplementData: {
      fileName: string;
      fileUrl: string;
      fileSize?: string;
      fileType?: string;
      note?: string;
      supplementRequestId?: string;
    },
    actor: User
  ): EvidenceItem {
    const list = this.getEvidences();
    const item = list.find((e) => e.id === evidenceId);
    if (!item) throw new Error('Không tìm thấy minh chứng để bổ sung!');

    const timeStr = getAuthoritativeTimestamp();

    // Khởi tạo mảng versions nếu chưa có, đưa file hiện tại làm Version 1
    if (!item.versions || item.versions.length === 0) {
      item.versions = [
        {
          version: 1,
          versionLabel: 'Version 1',
          fileName: item.fileName,
          fileUrl: item.fileUrl,
          fileSize: item.fileSize || '1.5 MB',
          fileType: item.fileType || 'PDF',
          storagePath: item.storagePath,
          uploadedAt: item.uploadedAt || timeStr,
          uploadedBy: item.uploadedBy || item.teacherName,
          note: item.note || 'Phiên bản ban đầu khi nộp'
        }
      ];
      item.currentVersion = 1;
    }

    const prevVersionNum = item.currentVersion || item.versions.length;
    const newVersionNum = prevVersionNum + 1;

    // Tạo phiên bản mới (Mục 3 & 4)
    const newVersionObj: EvidenceVersion = {
      version: newVersionNum,
      versionLabel: `Version ${newVersionNum}`,
      fileName: supplementData.fileName,
      fileUrl: supplementData.fileUrl,
      fileSize: supplementData.fileSize || '2.0 MB',
      fileType: supplementData.fileType || 'application/pdf',
      storagePath: this.buildLogicalStoragePath(
        item.schoolYear,
        item.semester,
        item.departmentName,
        item.teacherName,
        item.criteriaTitle,
        supplementData.fileName
      ),
      uploadedAt: timeStr,
      uploadedBy: actor.name,
      note: supplementData.note?.trim() || 'Nộp bổ sung theo yêu cầu',
      supplementRequestId: supplementData.supplementRequestId
    };

    // Đẩy vào danh sách versions (Không xóa version cũ!)
    item.versions.push(newVersionObj);
    item.currentVersion = newVersionNum;

    // Cập nhật thông tin file hiện tại của minh chứng
    const prevStatus = item.status;
    item.fileName = supplementData.fileName;
    item.fileUrl = supplementData.fileUrl;
    item.fileSize = newVersionObj.fileSize;
    item.fileType = newVersionObj.fileType;
    item.storagePath = newVersionObj.storagePath || item.storagePath;
    item.status = 'SUBMITTED'; // Chuyển về trạng thái đã nộp chờ duyệt lại
    item.updatedAt = timeStr;

    // Audit Log bất biến (Mục 7)
    item.auditLogs.push({
      id: `log-ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.position || actor.role,
      action: `BỔ SUNG MINH CHỨNG (Tạo ${newVersionObj.versionLabel})`,
      details: `Giáo viên đã nộp bổ sung tệp "${supplementData.fileName}" (tạo ${newVersionObj.versionLabel}, không xóa ${item.versions.length - 1} phiên bản cũ). Ghi chú: "${supplementData.note || 'Không có'}"`,
      previousStatus: prevStatus,
      newStatus: 'SUBMITTED'
    });

    safeSet(STORAGE_KEYS.EVIDENCES, list);

    // Nếu có supplementRequestId -> Đánh dấu hoàn thành nhiệm vụ bổ sung
    if (supplementData.supplementRequestId) {
      const suppRequests = this.getSupplementRequests();
      const sReq = suppRequests.find((r) => r.id === supplementData.supplementRequestId);
      if (sReq) {
        sReq.status = 'RESOLVED';
        sReq.resolvedAt = timeStr;
        sReq.supplementedVersion = newVersionNum;
        sReq.supplementedNote = supplementData.note;
        sReq.auditLogs.push({
          id: `log-supp-${Date.now()}`,
          timestamp: timeStr,
          actorName: actor.name,
          action: `Đã nộp bổ sung minh chứng (${newVersionObj.versionLabel})`,
          details: `Hoàn thành nhiệm vụ bổ sung tệp "${supplementData.fileName}". Ghi chú: "${supplementData.note || 'Đạt'}"`
        });
        safeSet(STORAGE_KEYS.SUPPLEMENT_REQUESTS, suppRequests);

        // Thông báo cho Người yêu cầu bổ sung
        this.addNotification({
          userId: sReq.requesterId,
          title: `Giáo viên ${item.teacherName} đã nộp bổ sung minh chứng`,
          message: `${item.teacherName} vừa hoàn thành nộp bổ sung minh chứng "${item.name}" (${newVersionObj.versionLabel}). Vui lòng vào duyệt lại.`,
          type: 'INFO',
          createdAt: timeStr,
          isRead: false
        });
      }
    }

    return item;
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return safeGet<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  public addNotification(item: Omit<NotificationItem, 'id'>): void {
    const list = this.getNotifications();
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    list.unshift(newItem);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  public markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const found = list.find((n) => n.id === id);
    if (found) {
      found.isRead = true;
      safeSet(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  public markAllNotificationsAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, isRead: true }));
    safeSet(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  // Build storage path logically as specified in Section XXIV
  public buildLogicalStoragePath(
    schoolYear: string,
    semester: string,
    deptName: string,
    teacherName: string,
    groupTitle: string,
    fileName: string
  ): string {
    const slugify = (text: string) =>
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const deptSlug = slugify(deptName);
    const teacherSlug = slugify(teacherName);
    const groupSlug = slugify(groupTitle.substring(0, 20));

    return `/minh-chung/${schoolYear}/${semester}/${deptSlug}/${teacherSlug}/${groupSlug}/${fileName}`;
  }

  // Backup & Restore
  public exportBackupJson(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      school: 'Trường TH&THCS Nguyễn Đình Anh',
      schoolYear: '2026-2027',
      users: this.getUsers(),
      departments: this.getDepartments(),
      settings: this.getSettings(),
      regulation: this.getRegulation(),
      evidences: this.getEvidences(),
      evaluations: this.getEvaluations(),
      bonus: this.getBonusList(),
      deductions: this.getDeductions(),
      appeals: this.getAppeals(),
      notifications: this.getNotifications()
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) safeSet(STORAGE_KEYS.USERS, data.users);
      if (data.departments) safeSet(STORAGE_KEYS.DEPARTMENTS, data.departments);
      if (data.settings) safeSet(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.regulation) safeSet(STORAGE_KEYS.REGULATION, data.regulation);
      if (data.evidences) safeSet(STORAGE_KEYS.EVIDENCES, data.evidences);
      if (data.evaluations) safeSet(STORAGE_KEYS.EVALUATIONS, data.evaluations);
      if (data.bonus) safeSet(STORAGE_KEYS.BONUS, data.bonus);
      if (data.deductions) safeSet(STORAGE_KEYS.DEDUCTIONS, data.deductions);
      if (data.appeals) safeSet(STORAGE_KEYS.APPEALS, data.appeals);
      if (data.notifications) safeSet(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }

  // Complete SQL Schema definition for Supabase integration requested in Section XXIII
  public getSupabaseSqlSchema(): string {
    return `-- ==============================================================================
-- DATABASE SCHEMA: HỆ THỐNG QUẢN LÝ THI ĐUA TRƯỜNG TH&THCS NGUYỄN ĐÌNH ANH (2026-2027)
-- BÁM SÁT 18 BẢNG TRONG MỤC XXIII & NGUYÊN TẮC BẢO MẬT RLS (MỤC XXV)
-- ==============================================================================

-- 1. roles
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

INSERT INTO public.roles (id, name, description) VALUES
('ADMIN', 'Quản trị viên hệ thống', 'Toàn quyền cấu hình, quản lý và giám sát hệ thống'),
('PRINCIPAL', 'Ban Giám hiệu', 'Rà soát, thẩm định toàn trường, điều chỉnh điểm và phê duyệt kết quả'),
('COUNCIL', 'Hội đồng TĐKT', 'Xem xét tổng thể, ghi nhận xét và kết luận danh hiệu thi đua'),
('TEAM_LEADER', 'Tổ trưởng chuyên môn', 'Thẩm định minh chứng tổ, chấm điểm cấp tổ, giải trình chênh lệch'),
('TEACHER', 'Giáo viên', 'Xem hồ sơ, tự chấm điểm, nộp minh chứng và gửi giải trình')
ON CONFLICT (id) DO NOTHING;

-- 2. departments
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    leader_id TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. users & teachers
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_id TEXT REFERENCES public.roles(id) DEFAULT 'TEACHER',
    department_id TEXT REFERENCES public.departments(id),
    position VARCHAR(150),
    subjects TEXT[],
    education_level VARCHAR(50),
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. criteria_groups & criteria
CREATE TABLE IF NOT EXISTS public.criteria_groups (
    id TEXT PRIMARY KEY,
    order_num INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.criteria (
    id TEXT PRIMARY KEY,
    group_id TEXT REFERENCES public.criteria_groups(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL,
    description TEXT,
    evidence_requirements TEXT[]
);

-- 5. evidence & storage
CREATE TABLE IF NOT EXISTS public.evidence (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    department_id TEXT REFERENCES public.departments(id),
    school_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    criteria_group_id TEXT REFERENCES public.criteria_groups(id),
    criteria_id TEXT REFERENCES public.criteria(id),
    criteria_code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(50),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50),
    file_type VARCHAR(100),
    storage_path TEXT NOT NULL,
    execution_date DATE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    reviewer_id TEXT REFERENCES public.users(id),
    reviewer_name VARCHAR(255),
    reviewer_role VARCHAR(150),
    review_date TIMESTAMPTZ,
    review_note TEXT,
    is_outstanding BOOLEAN DEFAULT FALSE
);

-- 6. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT REFERENCES public.evidence(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    actor_id TEXT REFERENCES public.users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50)
);

-- 7. score_records & evaluations
CREATE TABLE IF NOT EXISTS public.score_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    school_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    criteria_id TEXT REFERENCES public.criteria(id),
    self_score NUMERIC(5, 2) DEFAULT 0,
    team_score NUMERIC(5, 2) DEFAULT 0,
    bgh_score NUMERIC(5, 2) DEFAULT 0,
    council_score NUMERIC(5, 2) DEFAULT 0,
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.evaluation_results (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    school_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    self_total NUMERIC(5, 2) DEFAULT 0,
    team_total NUMERIC(5, 2) DEFAULT 0,
    bgh_total NUMERIC(5, 2) DEFAULT 0,
    bonus_points NUMERIC(5, 2) DEFAULT 0,
    deduction_points NUMERIC(5, 2) DEFAULT 0,
    final_score NUMERIC(5, 2) DEFAULT 0,
    rating VARCHAR(20) DEFAULT 'D',
    status VARCHAR(50) DEFAULT 'CHUA_BAT_DAU',
    discrepancy_alert BOOLEAN DEFAULT FALSE,
    discrepancy_reason TEXT,
    team_comment TEXT,
    bgh_comment TEXT,
    council_comment TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. bonus_points & deduction_points
CREATE TABLE IF NOT EXISTS public.bonus_points (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    category_label VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    points NUMERIC(5, 2) NOT NULL,
    evidence_url TEXT,
    evidence_name VARCHAR(255),
    verified_by VARCHAR(255),
    date DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    note TEXT
);

CREATE TABLE IF NOT EXISTS public.deduction_points (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    points NUMERIC(5, 2) NOT NULL,
    date DATE,
    evidence_url TEXT,
    verified_by VARCHAR(255),
    notes TEXT
);

-- 9. appeals
CREATE TABLE IF NOT EXISTS public.appeals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    teacher_name VARCHAR(255) NOT NULL,
    department_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    criteria_code VARCHAR(20),
    attached_files JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    target_type VARCHAR(50) DEFAULT 'SCORE',
    status VARCHAR(50) DEFAULT 'CHO_XU_LY',
    response_by VARCHAR(255),
    response_role VARCHAR(150),
    response_content TEXT,
    responded_at TIMESTAMPTZ
);

-- 10. notifications & system_settings
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    role_target VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    link_target TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Teachers only edit their own draft evidence
CREATE POLICY "Teachers can manage own draft evidence" ON public.evidence
    FOR ALL USING (auth.uid()::text = teacher_id);

-- Team leaders can view and review department evidence
CREATE POLICY "Team Leaders review department evidence" ON public.evidence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.departments d
            WHERE d.id = public.evidence.department_id AND d.leader_id = auth.uid()::text
        )
    );

-- Audit logs are append-only and cannot be updated or deleted by teachers
CREATE POLICY "Read only audit logs" ON public.audit_logs
    FOR SELECT USING (TRUE);
`;
  }
}

export const storageService = new StorageService();
storageService.init();
