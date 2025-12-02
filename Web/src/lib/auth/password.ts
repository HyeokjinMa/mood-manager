// src/lib/auth/password.ts
/**
 * [파일 역할]
 * - 비밀번호 해싱 및 검증 유틸리티 함수 제공
 * - bcrypt를 사용하여 안전한 비밀번호 저장 및 검증
 *
 * [사용되는 위치]
 * - 회원가입 API: 비밀번호 해싱
 * - 로그인 API: 비밀번호 검증
 * - 비밀번호 재설정 API: 비밀번호 해싱
 *
 * [주의사항]
 * - bcrypt 패키지가 설치되어 있어야 함 (npm install bcrypt @types/bcrypt)
 * - saltRounds는 보안과 성능의 균형을 고려하여 10~12 권장
 */

import bcrypt from "bcrypt";

// Salt Rounds (해싱 복잡도, 높을수록 안전하지만 느림)
const SALT_ROUNDS = 10;

/**
 * 비밀번호를 해싱합니다.
 *
 * @param password - 평문 비밀번호
 * @returns 해싱된 비밀번호
 *
 * @example
 * const hashedPassword = await hashPassword("myPassword123");
 * // 결과: $2b$10$... (60자 해시값)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error("[hashPassword] Password hashing failed:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * 평문 비밀번호와 해시된 비밀번호를 비교합니다.
 *
 * @param password - 평문 비밀번호
 * @param hashedPassword - 해시된 비밀번호 (DB에 저장된 값)
 * @returns 일치 여부 (true/false)
 *
 * @example
 * const isValid = await verifyPassword("myPassword123", hashedPasswordFromDB);
 * if (isValid) {
 *   // 로그인 성공
 * }
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("[verifyPassword] Password verification failed:", error);
    return false;
  }
}

/**
 * 비밀번호 강도를 검증합니다.
 *
 * @param password - 검증할 비밀번호
 * @returns 검증 결과 { valid: boolean, message?: string }
 *
 * 규칙:
 * - 최소 6자 이상
 * - (선택) 영문, 숫자 포함 권장
 *
 * @example
 * const result = validatePasswordStrength("abc123");
 * if (!result.valid) {
 *   console.log(result.message); // "비밀번호는 최소 6자 이상이어야 합니다."
 * }
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  // 최소 길이 검증
  if (password.length < 6) {
    return {
      valid: false,
      message: "Password must be at least 6 characters long",
    };
  }

  // 추가 검증 규칙 (필요시 활성화)
  // const hasLetter = /[a-zA-Z]/.test(password);
  // const hasNumber = /[0-9]/.test(password);
  // if (!hasLetter || !hasNumber) {
  //   return {
  //     valid: false,
  //     message: "비밀번호는 영문과 숫자를 포함해야 합니다.",
  //   };
  // }

  return { valid: true };
}
