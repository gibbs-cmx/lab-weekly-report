/**
 * 주간보고 입력 규칙 — 서버 검증과 프론트 입력 가이드에서 공통 사용.
 * NestJS/Prisma import 금지 (순수 함수).
 */

/** 제출 시 참여율 합계가 정확히 이 값이어야 한다 */
export const REQUIRED_TOTAL_RATE = 100;
export const MIN_ITEM_RATE = 1;
export const MAX_ITEM_RATE = 100;
export const MAX_TEXT_LENGTH = 4000;

export interface ReportItemInput {
  projectId: number;
  participationRate: number;
  doneText: string;
  planText?: string;
}

export interface ReportValidationOptions {
  /** true 면 제출 기준(합계 100%, 내용 필수)으로 검증 */
  forSubmit: boolean;
}

export function sumParticipation(items: Pick<ReportItemInput, "participationRate">[]): number {
  return items.reduce((acc, it) => acc + (Number(it.participationRate) || 0), 0);
}

/**
 * 항목 검증. 오류 메시지 목록을 반환 (빈 배열이면 통과).
 * - 임시저장: 항목별 형식 + 중복 프로젝트 + 합계 100% 초과만 체크
 * - 제출: 위 + 항목 1개 이상, 합계 정확히 100%, "한 일" 필수
 */
export function validateReportItems(
  items: ReportItemInput[],
  { forSubmit }: ReportValidationOptions,
): string[] {
  const errors: string[] = [];

  if (forSubmit && items.length === 0) {
    errors.push("프로젝트를 1개 이상 입력해주세요");
  }

  const seen = new Set<number>();
  items.forEach((it, idx) => {
    const no = idx + 1;
    if (seen.has(it.projectId)) {
      errors.push(`${no}번째 항목: 같은 프로젝트가 중복되었습니다`);
    }
    seen.add(it.projectId);

    const rate = it.participationRate;
    if (!Number.isInteger(rate) || rate < MIN_ITEM_RATE || rate > MAX_ITEM_RATE) {
      errors.push(
        `${no}번째 항목: 참여율은 ${MIN_ITEM_RATE}~${MAX_ITEM_RATE} 사이 정수여야 합니다`,
      );
    }
    if (forSubmit && !it.doneText?.trim()) {
      errors.push(`${no}번째 항목: 수행 내용을 입력해주세요`);
    }
    if (
      (it.doneText?.length ?? 0) > MAX_TEXT_LENGTH ||
      (it.planText?.length ?? 0) > MAX_TEXT_LENGTH
    ) {
      errors.push(`${no}번째 항목: 내용은 ${MAX_TEXT_LENGTH}자 이내로 입력해주세요`);
    }
  });

  const total = sumParticipation(items);
  if (total > REQUIRED_TOTAL_RATE) {
    errors.push(`참여율 합계(${total}%)가 ${REQUIRED_TOTAL_RATE}%를 초과합니다`);
  } else if (forSubmit && items.length > 0 && total !== REQUIRED_TOTAL_RATE) {
    errors.push(`참여율 합계가 ${REQUIRED_TOTAL_RATE}%여야 제출할 수 있습니다 (현재 ${total}%)`);
  }

  return errors;
}
