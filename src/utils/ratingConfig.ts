import { RatingLevel } from '../types';

export interface RatingThresholdConfig {
  aPlusMin: number; // Mặc định: 95.0
  aMin: number;     // Mặc định: 90.0
  bMin: number;     // Mặc định: 80.0
  cMin: number;     // Mặc định: 65.0
}

export const DEFAULT_RATING_THRESHOLDS: RatingThresholdConfig = {
  aPlusMin: 95.0,
  aMin: 90.0,
  bMin: 80.0,
  cMin: 65.0
};

/**
 * Tính mức xếp loại thi đua dựa trên ngưỡng cấu hình hệ thống (Mục 6)
 * A+ = 95–100
 * A = 90–94,5
 * B = 80–89,5
 * C = 65–79,5
 * D = <65
 */
export function calculateRatingWithConfig(
  score: number,
  thresholds: RatingThresholdConfig = DEFAULT_RATING_THRESHOLDS
): RatingLevel {
  const s = Math.round(score * 10) / 10;
  if (s >= thresholds.aPlusMin) return 'A_PLUS';
  if (s >= thresholds.aMin) return 'A';
  if (s >= thresholds.bMin) return 'B';
  if (s >= thresholds.cMin) return 'C';
  return 'D';
}

export interface RatingTierInfo {
  code: RatingLevel;
  label: string;
  shortLabel: string;
  rangeText: string;
  color: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export function getRatingTierInfo(
  rating: RatingLevel,
  thresholds: RatingThresholdConfig = DEFAULT_RATING_THRESHOLDS
): RatingTierInfo {
  switch (rating) {
    case 'A_PLUS':
      return {
        code: 'A_PLUS',
        label: 'A+ (Xuất sắc nổi bật)',
        shortLabel: 'A+',
        rangeText: `${thresholds.aPlusMin} – 100 điểm`,
        color: 'emerald',
        badgeBg: 'bg-emerald-100',
        textColor: 'text-emerald-800',
        borderColor: 'border-emerald-300',
        description: 'Hoàn thành xuất sắc vượt trội nhiệm vụ, có sáng kiến hoặc minh chứng nổi bật cấp trường/ngành'
      };
    case 'A':
      return {
        code: 'A',
        label: 'A (Hoàn thành xuất sắc)',
        shortLabel: 'A',
        rangeText: `${thresholds.aMin} – ${thresholds.aPlusMin - 0.5} điểm`,
        color: 'blue',
        badgeBg: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300',
        description: 'Hoàn thành xuất sắc toàn diện các nhóm tiêu chuẩn chuyên môn và đạo đức nhà giáo'
      };
    case 'B':
      return {
        code: 'B',
        label: 'B (Hoàn thành tốt)',
        shortLabel: 'B',
        rangeText: `${thresholds.bMin} – ${thresholds.aMin - 0.5} điểm`,
        color: 'indigo',
        badgeBg: 'bg-indigo-100',
        textColor: 'text-indigo-800',
        borderColor: 'border-indigo-300',
        description: 'Hoàn thành tốt các chỉ tiêu giảng dạy và công tác được giao'
      };
    case 'C':
      return {
        code: 'C',
        label: 'C (Hoàn thành nhiệm vụ)',
        shortLabel: 'C',
        rangeText: `${thresholds.cMin} – ${thresholds.bMin - 0.5} điểm`,
        color: 'amber',
        badgeBg: 'bg-amber-100',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-300',
        description: 'Hoàn thành nhiệm vụ ở mức cơ bản, cần cải tiến thêm một số tiêu chí'
      };
    case 'D':
    default:
      return {
        code: 'D',
        label: 'D (Chưa hoàn thành)',
        shortLabel: 'D',
        rangeText: `< ${thresholds.cMin} điểm`,
        color: 'rose',
        badgeBg: 'bg-rose-100',
        textColor: 'text-rose-800',
        borderColor: 'border-rose-300',
        description: 'Chưa đạt chuẩn thi đua tối thiểu hoặc có vi phạm kỷ luật'
      };
  }
}
