import { User, Role, normalizeRole } from '../types';
import { storageService } from './storageService';
import { databaseService } from './databaseService';

const AUTH_STORAGE_KEY = 'nda_auth_session_v3';

export interface AuthSession {
  user: User;
  token: string;
  loginTime: string;
}

// 10 Tài khoản mẫu kiểm thử chuẩn hóa
export const DEMO_ACCOUNTS: {
  roleLabel: string;
  role: Role;
  name: string;
  email: string;
  position: string;
  department: string;
  badgeColor: string;
}[] = [
  {
    roleLabel: 'Admin Hệ thống',
    role: 'ADMIN',
    name: 'Quản trị viên Hệ thống',
    email: 'admin@nguyendinhanh.edu.vn',
    position: 'Chuyên viên CNTT & Thư ký TĐKT',
    department: 'Phòng Quản trị & CNTT',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    roleLabel: 'Ban Giám hiệu (Hiệu trưởng)',
    role: 'BGH',
    name: 'Trần Đình Trọng',
    email: 'hieutruong@nguyendinhanh.edu.vn',
    position: 'Hiệu trưởng - Chủ tịch HĐ TĐKT',
    department: 'Ban Giám hiệu',
    badgeColor: 'bg-red-100 text-red-800 border-red-200'
  },
  {
    roleLabel: 'Tổ trưởng (Khoa học tự nhiên)',
    role: 'TO_TRUONG',
    name: 'Lê Thị Mai',
    email: 'maile@nguyendinhanh.edu.vn',
    position: 'Tổ trưởng chuyên môn',
    department: 'Tổ khoa học tự nhiên',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    roleLabel: 'Tổ trưởng (Khoa học xã hội)',
    role: 'TO_TRUONG',
    name: 'Hoàng Thị Bích Ngọc',
    email: 'ngochtb@nguyendinhanh.edu.vn',
    position: 'Tổ trưởng chuyên môn',
    department: 'Tổ khoa học xã hội',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    roleLabel: 'Tổ phó (Khoa học tự nhiên)',
    role: 'TO_PHO',
    name: 'Vũ Hoàng Long',
    email: 'longvh@nguyendinhanh.edu.vn',
    position: 'Tổ phó chuyên môn',
    department: 'Tổ khoa học tự nhiên',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200'
  },
  {
    roleLabel: 'Giáo viên (Khoa học tự nhiên)',
    role: 'GIAO_VIEN',
    name: 'Nguyễn Văn An',
    email: 'annv@nguyendinhanh.edu.vn',
    position: 'Giáo viên - GVCN Lớp 8A1',
    department: 'Tổ khoa học tự nhiên',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    roleLabel: 'Tổ trưởng (Tổ 4-5)',
    role: 'TO_TRUONG',
    name: 'Ngô Thị Thúy Loan',
    email: 'loanntt@nguyendinhanh.edu.vn',
    position: 'Tổ trưởng chuyên môn',
    department: 'Tổ 4-5',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    roleLabel: 'Giáo viên (Tổ 4-5)',
    role: 'GIAO_VIEN',
    name: 'Trần Thị Thu Hà',
    email: 'hath@nguyendinhanh.edu.vn',
    position: 'Giáo viên - GVCN Lớp 5A1',
    department: 'Tổ 4-5',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    roleLabel: 'Giáo viên (Khoa học xã hội)',
    role: 'GIAO_VIEN',
    name: 'Bùi Quang Hải',
    email: 'haibq@nguyendinhanh.edu.vn',
    position: 'Giáo viên - Bí thư Chi đoàn',
    department: 'Tổ khoa học xã hội',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    roleLabel: 'Giáo viên (Tiếng Anh - GDTC)',
    role: 'GIAO_VIEN',
    name: 'Đặng Tuấn Anh',
    email: 'anhdt@nguyendinhanh.edu.vn',
    position: 'Giáo viên Âm nhạc, Mỹ thuật',
    department: 'Tổ Tiếng Anh - Giáo dục thể chất',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    roleLabel: 'Giáo viên (Tổ 1-2-3)',
    role: 'GIAO_VIEN',
    name: 'Lê Hoài Thương',
    email: 'thuonglh@nguyendinhanh.edu.vn',
    position: 'Giáo viên chủ nhiệm lớp 2A1',
    department: 'Tổ 1-2-3',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    roleLabel: 'Hội đồng Thi đua - Khen thưởng (Phó HT)',
    role: 'HOI_DONG_TDKT',
    name: 'Phạm Minh Trang',
    email: 'hoidong.tdkt@nguyendinhanh.edu.vn',
    position: 'Phó Hiệu trưởng - Phó Chủ tịch HĐ TĐKT',
    department: 'Hội đồng Thi đua - Khen thưởng',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  }
];

class AuthService {
  private currentSession: AuthSession | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        this.currentSession = JSON.parse(raw);
      } else {
        // Default login: Thầy Nguyễn Văn An (Giáo viên) for instant interactive experience
        const defaultUser = storageService.getUsers().find((u) => u.email === 'annv@nguyendinhanh.edu.vn') || storageService.getUsers()[0];
        if (defaultUser) {
          this.currentSession = {
            user: defaultUser,
            token: `demo-token-${Date.now()}`,
            loginTime: new Date().toISOString()
          };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentSession));
        }
      }
    } catch {
      this.currentSession = null;
    }
  }

  public getSession(): AuthSession | null {
    return this.currentSession;
  }

  public getCurrentUser(): User {
    if (this.currentSession?.user) {
      return this.currentSession.user;
    }
    return storageService.getCurrentUser();
  }

  public isAuthenticated(): boolean {
    return Boolean(this.currentSession?.user);
  }

  public async signIn(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const users = storageService.getUsers();
    const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!foundUser) {
      return {
        success: false,
        error: 'Email không tồn tại trong hệ thống Trường TH&THCS Nguyễn Đình Anh.'
      };
    }

    if (foundUser.status === 'LOCKED') {
      return {
        success: false,
        error: 'Tài khoản này đang bị tạm khóa bởi Quản trị viên hệ thống. Vui lòng liên hệ để được mở khóa.'
      };
    }

    // Password verification: accept '123456' or any non-empty password in prototype
    if (password && password.length < 4) {
      return {
        success: false,
        error: 'Mật khẩu phải có tối thiểu 4 ký tự.'
      };
    }

    // Update lastLogin
    storageService.updateUser(foundUser.id, { lastLogin: new Date().toISOString() });
    const refreshedUser = storageService.getUserById(foundUser.id) || foundUser;

    const session: AuthSession = {
      user: refreshedUser,
      token: `token-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      loginTime: new Date().toISOString()
    };

    this.currentSession = session;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    storageService.setCurrentUser(foundUser.id);

    return {
      success: true,
      user: foundUser
    };
  }

  public signOut(): void {
    this.currentSession = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  public async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const found = storageService.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return {
        success: false,
        message: 'Email không tồn tại trong hệ thống.'
      };
    }
    return {
      success: true,
      message: `Đã gửi liên kết khôi phục mật khẩu tới ${cleanEmail}. Vui lòng kiểm tra hòm thư công vụ.`
    };
  }
}

export const authService = new AuthService();
