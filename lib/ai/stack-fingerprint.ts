// 커밋 수를 버킷으로 변환 — 소량 커밋 변동에 AI 재호출 방지
function commitBucket(count: number): string {
  if (count >= 500) return "XXL"
  if (count >= 100) return "XL"
  if (count >= 30)  return "L"
  if (count >= 10)  return "M"
  return "S"
}

/**
 * 사용자의 언어 스택을 안정적인 문자열 핑거프린트로 변환한다.
 * 커밋 수가 같은 버킷 안에서 변동되는 동안은 동일한 핑거프린트를 반환하므로
 * AI 호출 없이 캐시를 재사용할 수 있다.
 *
 * 예: { Python: 90, JavaScript: 28, TypeScript: 3 }
 *   → "javascript:M|python:XL|typescript:S"
 */
export function buildStackFingerprint(
  commitsByLanguage: Record<string, number>
): string {
  return Object.entries(commitsByLanguage)
    .filter(([, count]) => count > 0)
    .map(([lang, count]) => `${lang.toLowerCase()}:${commitBucket(count)}`)
    .sort()               // 순서 안정화
    .join("|")
}

/**
 * 두 핑거프린트가 의미 있게 달라졌는지 판단한다.
 * 새 언어가 추가되거나 기존 언어가 다른 버킷으로 이동한 경우에만 true.
 */
export function isStackChanged(prev: string, next: string): boolean {
  return prev !== next
}
