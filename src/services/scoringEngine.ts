import { RatingLevel, BonusItem, DeductionItem, CriteriaScore } from '../types';

/**
 * THANG BẬC XẾP LOẠI (Mục 4)
 * A+ : 95 – 100
 * A  : 90 – 94.5
 * B  : 80 – 89.5
 * C  : 65 – 79.5
 * D  : < 65
 */
export const RATING_THRESHOLDS = {
  A_PLUS_MIN: 95.0,
  A_MIN: 90.0,
  B_MIN: 80.0,
  C_MIN: 65.0
};

export const RATING_RANKS: Record<RatingLevel, number> = {
  A_PLUS: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1
};

export interface ControlledConditionInput {
  isControlled?: boolean;
  controlledMaxRating?: RatingLevel;
  controlledReason?: string;
  controlledMarkedBy?: string;
}

export interface ScoreCalculationResult {
  baseScore: number;
  bonusPoints: number;
  deductionPoints: number;
  finalScore: number;
  calculatedRating: RatingLevel;
  finalRating: RatingLevel;
  isControlled: boolean;
  controlledMaxRating?: RatingLevel;
  controlledReason?: string;
  controlledWarning?: string;
}

export const BONUS_CATEGORIES = [
  {
    code: 'CAP_TRUONG',
    label: 'Thành tích cấp trường',
    minPoints: 0.5,
    maxPoints: 2.0,
    description: 'Chiến sĩ thi đua cấp cơ sở, giáo viên dạy giỏi cấp trường, khen thưởng đột xuất của trường'
  },
  {
    code: 'CAP_XA',
    label: 'Thành tích cấp xã/phường hoặc tương đương',
    minPoints: 1.0,
    maxPoints: 4.0,
    description: 'Giấy khen của UBND cấp xã/phường, các đoàn thể địa phương'
  },
  {
    code: 'CAP_TINH',
    label: 'Thành tích cấp thành phố/tỉnh',
    minPoints: 2.0,
    maxPoints: 8.0,
    description: 'Bằng khen cấp huyện/thị/tỉnh, giáo viên dạy giỏi cấp huyện/tỉnh, bồi dưỡng học sinh giỏi đạt giải'
  },
  {
    code: 'SANG_KIEN',
    label: 'Sáng kiến/giải pháp được áp dụng',
    minPoints: 0.5,
    maxPoints: 1.0,
    description: 'Sáng kiến kinh nghiệm, mô hình chuyển đổi số được hội đồng khoa học công nhận'
  },
  {
    code: 'NHIEM_VU_KHO',
    label: 'Nhiệm vụ khó/phát sinh/liên cơ sở hoàn thành nổi bật',
    minPoints: 0.5,
    maxPoints: 4.0,
    description: 'Công tác kiêm nhiệm đột xuất, hỗ trợ liên trường, tổ chức sự kiện chuyên môn cấp cụm'
  }
] as const;

/**
 * 1. CÔNG THỨC TÍNH ĐIỂM
 * Điểm cơ bản = Tổng điểm các tiêu chí (thang 100đ).
 * Điểm cuối = Điểm cơ bản + Điểm cộng - Điểm trừ (tối đa 100đ, tối thiểu 0đ).
 */
export function calculateBaseScore(
  scores: Record<string, CriteriaScore>,
  field: 'selfScore' | 'teamScore' | 'bghScore' = 'teamScore'
): number {
  let sum = 0;
  for (const key in scores) {
    const s = scores[key];
    const val = Number(s[field]) || 0;
    sum += val;
  }
  return Math.min(100, Math.round(sum * 10) / 10);
}

export function calculateFinalScore(
  baseScore: number,
  bonusPoints: number = 0,
  deductionPoints: number = 0
): number {
  const rawFinal = baseScore + bonusPoints - deductionPoints;
  const clamped = Math.max(0, Math.min(100, rawFinal));
  return Math.round(clamped * 10) / 10;
}

/**
 * 4. XẾP LOẠI THI ĐUA
 * A+ : 95 – 100
 * A  : 90 – 94.5
 * B  : 80 – 89.5
 * C  : 65 – 79.5
 * D  : < 65
 */
export function determineBaseRating(score: number): RatingLevel {
  const rounded = Math.round(score * 10) / 10;
  if (rounded >= RATING_THRESHOLDS.A_PLUS_MIN) return 'A_PLUS';
  if (rounded >= RATING_THRESHOLDS.A_MIN) return 'A';
  if (rounded >= RATING_THRESHOLDS.B_MIN) return 'B';
  if (rounded >= RATING_THRESHOLDS.C_MIN) return 'C';
  return 'D';
}

/**
 * 5. ĐIỀU KIỆN KHỐNG CHẾ
 * Phải có cơ chế đánh dấu: CONTROLLED
 * Nếu có trường hợp khống chế:
 * Không cho hệ thống tự động xếp mức cao hơn mức được phép.
 * Hiển thị: “Bị khống chế theo điều kiện thi đua.”
 */
export function applyControlledCondition(
  calculatedRating: RatingLevel,
  condition?: ControlledConditionInput
): {
  finalRating: RatingLevel;
  isControlled: boolean;
  controlledWarning?: string;
} {
  if (!condition || !condition.isControlled || !condition.controlledMaxRating) {
    return {
      finalRating: calculatedRating,
      isControlled: false
    };
  }

  const calculatedRank = RATING_RANKS[calculatedRating];
  const maxAllowedRank = RATING_RANKS[condition.controlledMaxRating];

  if (calculatedRank > maxAllowedRank) {
    const reasonText = condition.controlledReason ? `: ${condition.controlledReason}` : '';
    return {
      finalRating: condition.controlledMaxRating,
      isControlled: true,
      controlledWarning: `Bị khống chế theo điều kiện thi đua (Mức tối đa: ${condition.controlledMaxRating}${reasonText})`
    };
  }

  return {
    finalRating: calculatedRating,
    isControlled: true,
    controlledWarning: condition.controlledReason
      ? `Đã áp dụng điều kiện khống chế (${condition.controlledReason})`
      : undefined
  };
}

/**
 * Tổng hợp toàn bộ Engine tính điểm
 */
export function evaluateTeacherScore(
  baseScore: number,
  bonusPoints: number = 0,
  deductionPoints: number = 0,
  controlledConfig?: ControlledConditionInput
): ScoreCalculationResult {
  const finalScore = calculateFinalScore(baseScore, bonusPoints, deductionPoints);
  const calculatedRating = determineBaseRating(finalScore);
  const controlledResult = applyControlledCondition(calculatedRating, controlledConfig);

  return {
    baseScore,
    bonusPoints,
    deductionPoints,
    finalScore,
    calculatedRating,
    finalRating: controlledResult.finalRating,
    isControlled: controlledResult.isControlled,
    controlledMaxRating: controlledConfig?.controlledMaxRating,
    controlledReason: controlledConfig?.controlledReason,
    controlledWarning: controlledResult.controlledWarning
  };
}

/**
 * 3. CHÊNH LỆCH ĐIỂM
 * Tự động phát hiện: ABS(Điểm tự chấm - Điểm tổ) >= 5
 */
export function checkDiscrepancy(
  selfScore: number,
  teamScore: number,
  threshold: number = 5.0
): {
  hasDiscrepancy: boolean;
  diff: number;
  warningText?: string;
} {
  const diff = Math.round(Math.abs(selfScore - teamScore) * 10) / 10;
  const hasDiscrepancy = selfScore > 0 && teamScore > 0 && diff >= threshold;

  return {
    hasDiscrepancy,
    diff,
    warningText: hasDiscrepancy
      ? 'Chênh lệch từ 05 điểm trở lên – cần nêu rõ lý do và căn cứ.'
      : undefined
  };
}

/**
 * 6. VALIDATION MINH CHỨNG ĐIỂM CỘNG
 * Điểm cộng phải có minh chứng.
 * Không có minh chứng → không cho duyệt.
 */
export function hasBonusEvidence(item: Partial<BonusItem>): boolean {
  const hasName = Boolean(item.evidenceName && item.evidenceName.trim().length > 0);
  const hasUrl = Boolean(item.evidenceUrl && item.evidenceUrl.trim().length > 0);
  return hasName || hasUrl;
}

export function validateBonusApproval(item: BonusItem): {
  allowed: boolean;
  error?: string;
} {
  if (!hasBonusEvidence(item)) {
    return {
      allowed: false,
      error: 'Quy định bắt buộc (Mục 6): Điểm cộng phải có minh chứng. Không có minh chứng không được duyệt!'
    };
  }
  return { allowed: true };
}

/**
 * 7. VALIDATION CHỐNG CỘNG TRÙNG
 * Tạo validation chống cộng trùng cùng một thành tích cho cùng một giáo viên.
 */
export function checkDuplicateBonus(
  newBonus: {
    id?: string;
    teacherId: string;
    category?: string;
    title: string;
    points?: number;
  },
  existingList: BonusItem[]
): {
  isDuplicate: boolean;
  message?: string;
} {
  const normalizedNewTitle = newBonus.title.trim().toLowerCase();

  const duplicate = existingList.find((b) => {
    // Bỏ qua chính nó khi chỉnh sửa
    if (newBonus.id && b.id === newBonus.id) return false;
    if (b.teacherId !== newBonus.teacherId) return false;

    const normalizedExistingTitle = b.title.trim().toLowerCase();

    // 1. Trùng chính xác tiêu đề
    if (normalizedExistingTitle === normalizedNewTitle) return true;

    // 2. Trùng cùng nhóm danh mục và tiêu đề chứa nhau
    if (
      newBonus.category &&
      b.category === newBonus.category &&
      (normalizedExistingTitle.includes(normalizedNewTitle) || normalizedNewTitle.includes(normalizedExistingTitle))
    ) {
      return true;
    }

    return false;
  });

  if (duplicate) {
    return {
      isDuplicate: true,
      message: `Quy định chống cộng trùng (Mục 7): Thành tích "${duplicate.title}" đã được ghi nhận (${duplicate.points}đ). Không thể cộng trùng!`
    };
  }

  return { isDuplicate: false };
}

/**
 * Validation điểm trừ hợp lệ (Mục 3)
 */
export function validateDeduction(item: Partial<DeductionItem>): {
  valid: boolean;
  error?: string;
} {
  if (!item.reason || !item.reason.trim()) {
    return { valid: false, error: 'Mục 3: Bắt buộc phải có lý do / nội dung điểm trừ!' };
  }
  if (typeof item.points !== 'number' || item.points <= 0) {
    return { valid: false, error: 'Mục 3: Số điểm trừ phải lớn hơn 0!' };
  }
  if (!item.date) {
    return { valid: false, error: 'Mục 3: Bắt buộc phải có ngày lập biên bản vi phạm!' };
  }
  if (!item.verifiedBy || !item.verifiedBy.trim()) {
    return { valid: false, error: 'Mục 3: Bắt buộc phải có thông tin Người xác nhận biên bản!' };
  }
  return { valid: true };
}
