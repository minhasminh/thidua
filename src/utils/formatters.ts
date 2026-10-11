export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  return dateTimeStr;
}

/**
 * Format timestamp chuẩn DD/MM/YYYY HH:mm:ss (Mục 7)
 * Ví dụ: 03/10/2026 20:35:42
 */
export function formatExactTimestamp(dateInput?: string | Date | number): string {
  if (!dateInput) return getAuthoritativeTimestamp();
  
  // If already matches DD/MM/YYYY HH:mm:ss
  if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(dateInput)) {
    return dateInput;
  }

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return typeof dateInput === 'string' ? dateInput : getAuthoritativeTimestamp();
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return getAuthoritativeTimestamp();
  }
}

/**
 * Lấy dấu thời gian chuẩn xác hệ thống (Mục 7)
 */
export function getAuthoritativeTimestamp(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function formatScore(score: number): string {
  if (typeof score !== 'number' || isNaN(score)) return '0';
  return (Math.round(score * 10) / 10).toString();
}

export function getStatusLabel(status: string): { label: string; color: string; bg: string; border: string } {
  switch (status) {
    case 'SUBMITTED':
    case 'TEAM_REVIEW':
      return {
        label: 'Chờ duyệt',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
      };
    case 'TEAM_APPROVED':
      return {
        label: 'Tổ đã duyệt',
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200'
      };
    case 'BGH_APPROVED':
    case 'LOCKED':
      return {
        label: 'Đã duyệt',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200'
      };
    case 'REVISION_REQUIRED':
      return {
        label: 'Cần bổ sung',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200'
      };
    case 'REJECTED':
      return {
        label: 'Từ chối',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200'
      };
    default:
      return {
        label: 'Bản nháp',
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-200'
      };
  }
}
