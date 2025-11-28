// src/lib/utils/validation.ts
/**
 * [파일 역할]
 * - API 요청 데이터 검증 유틸리티 함수 제공
 * - 이메일, 날짜, 디바이스 타입 등 공통 검증 로직
 *
 * [사용되는 위치]
 * - 모든 API Route Handler에서 요청 검증 시 사용
 * - 회원가입, 디바이스 생성, 무드 변경 등
 *
 * [주의사항]
 * - 클라이언트 검증과 별개로 서버 사이드에서도 반드시 검증 필요
 * - 보안 취약점 방지를 위해 모든 입력값 검증
 */

/**
 * 이메일 형식을 검증합니다.
 *
 * @param email - 검증할 이메일 주소
 * @returns 유효 여부 (true/false)
 *
 * @example
 * if (!isValidEmail("test@example.com")) {
 *   return NextResponse.json({ error: "Invalid email" }, { status: 400 });
 * }
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 날짜 형식을 검증합니다 (YYYY-MM-DD).
 *
 * @param date - 검증할 날짜 문자열
 * @returns 유효 여부 (true/false)
 *
 * @example
 * if (!isValidDate("1990-01-01")) {
 *   return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
 * }
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  // 실제 유효한 날짜인지 확인
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * 만 나이를 계산합니다.
 *
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @returns 만 나이
 *
 * @example
 * const age = calculateAge("1990-01-01");
 * if (age < 12) {
 *   return NextResponse.json({ error: "Must be 12 or older" }, { status: 400 });
 * }
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 디바이스 타입이 유효한지 검증합니다.
 *
 * @param type - 검증할 디바이스 타입
 * @returns 유효 여부 (true/false)
 *
 * @example
 * if (!isValidDeviceType("manager")) {
 *   return NextResponse.json({ error: "Invalid device type" }, { status: 400 });
 * }
 */
export function isValidDeviceType(type: string): boolean {
  const validTypes = ["manager", "light", "scent", "speaker"];
  return validTypes.includes(type);
}

/**
 * 성별이 유효한지 검증합니다.
 *
 * @param gender - 검증할 성별
 * @returns 유효 여부 (true/false)
 *
 * @example
 * if (!isValidGender("male")) {
 *   return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
 * }
 */
export function isValidGender(gender: string): boolean {
  const validGenders = ["male", "female"];
  return validGenders.includes(gender.toLowerCase());
}

/**
 * 센트 분사 주기가 유효한지 검증합니다.
 *
 * @param interval - 검증할 분사 주기 (분 단위)
 * @returns 유효 여부 (true/false)
 *
 * @example
 * if (!isValidScentInterval(30)) {
 *   return NextResponse.json({ error: "Invalid scent interval" }, { status: 400 });
 * }
 */
export function isValidScentInterval(interval: number): boolean {
  const validIntervals = [5, 10, 15, 20, 25, 30];
  return validIntervals.includes(interval);
}

/**
 * 필수 필드가 모두 존재하는지 검증합니다.
 *
 * @param body - 검증할 객체
 * @param requiredFields - 필수 필드명 배열
 * @returns 검증 결과 { valid: boolean, missingFields?: string[] }
 *
 * @example
 * const result = validateRequiredFields(body, ["email", "password"]);
 * if (!result.valid) {
 *   return NextResponse.json(
 *     { error: `Missing fields: ${result.missingFields?.join(", ")}` },
 *     { status: 400 }
 *   );
 * }
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missingFields?: string[] } {
  const missingFields = requiredFields.filter(
    (field) => !body[field] || body[field] === ""
  );

  if (missingFields.length > 0) {
    return { valid: false, missingFields };
  }

  return { valid: true };
}

/**
 * 문자열 길이를 검증합니다.
 *
 * @param value - 검증할 문자열
 * @param min - 최소 길이
 * @param max - 최대 길이
 * @returns 유효 여부 (true/false)
 *
 * @example
 * if (!isValidLength(deviceName, 1, 50)) {
 *   return NextResponse.json(
 *     { error: "Device name must be 1-50 characters" },
 *     { status: 400 }
 *   );
 * }
 */
export function isValidLength(
  value: string,
  min: number,
  max: number
): boolean {
  return value.length >= min && value.length <= max;
}

/**
 * 전화번호를 정규화합니다.
 * - 하이픈(-), 공백, 괄호 제거
 * - +82 국가코드를 0으로 변환
 * - 숫자만 남김
 *
 * @param phone - 정규화할 전화번호
 * @returns 정규화된 전화번호 (예: "01012345678")
 *
 * @example
 * normalizePhoneNumber("+82 10-1234-5678") // "01012345678"
 * normalizePhoneNumber("010-1234-5678")    // "01012345678"
 * normalizePhoneNumber("010 1234 5678")    // "01012345678"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";

  // 1. 공백, 하이픈, 괄호 제거
  let normalized = phone.replace(/[\s\-()]/g, "");

  // 2. +82 국가코드 처리 (한국)
  if (normalized.startsWith("+82")) {
    normalized = "0" + normalized.substring(3);
  } else if (normalized.startsWith("82")) {
    normalized = "0" + normalized.substring(2);
  }

  // 3. 숫자만 남김
  normalized = normalized.replace(/\D/g, "");

  return normalized;
}

/**
 * 한국 전화번호 형식이 유효한지 검증합니다.
 * - 010, 011, 016, 017, 018, 019로 시작
 * - 총 10자리 또는 11자리 숫자
 *
 * @param phone - 검증할 전화번호 (정규화된 형식)
 * @returns 유효 여부 (true/false)
 *
 * @example
 * if (!isValidPhoneNumber("01012345678")) {
 *   return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
 * }
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;

  // 정규화
  const normalized = normalizePhoneNumber(phone);

  // 한국 휴대폰 번호 형식: 010, 011, 016, 017, 018, 019로 시작, 10~11자리
  const phoneRegex = /^01[0|1|6|7|8|9]\d{7,8}$/;
  return phoneRegex.test(normalized);
}
