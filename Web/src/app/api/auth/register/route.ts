// src/app/api/auth/register/route.ts
/**
 * [파일 역할]
 * - 회원가입 API 엔드포인트
 * - 이메일/비밀번호 기반 신규 사용자 계정 생성
 * - 입력 검증 및 이메일 중복 체크 수행
 *
 * [사용되는 위치]
 * - 회원가입 페이지에서 호출
 * - POST /api/auth/register
 *
 * [주의사항]
 * - 비밀번호는 해시 처리하여 저장
 * - 이메일 중복 체크 필수
 * - 만 12세 이상만 가입 가능
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import {
  isValidEmail,
  isValidDate,
  isValidGender,
  calculateAge,
  validateRequiredFields,
  normalizePhoneNumber,
  isValidPhoneNumber,
} from "@/lib/utils/validation";

/**
 * POST /api/auth/register
 *
 * 회원가입 처리
 *
 * 요청 필드:
 * - familyName (required): 사용자 성
 * - name (required): 사용자 이름
 * - birthDate (required): 생년월일 (YYYY-MM-DD)
 * - gender (required): 성별 ("male" | "female")
 * - email (required): 이메일 주소
 * - password (required for credentials): 비밀번호 (최소 6자, 일반 가입만)
 * - phone (optional): 전화번호 (하이픈 포함 가능, 자동 정규화됨)
 * - provider (optional): 소셜 로그인 제공자 ("google" | "kakao" | "naver")
 * - profileImageUrl (optional): 프로필 이미지 URL
 *
 * 특수 기능:
 * - 소셜 가입 + 전화번호 제공 시: 기존 계정과 자동 연결 (전화번호 기준)
 *
 * 응답:
 * - 성공: { success: true, user: { id, email, familyName, name } }
 * - 계정 연결: { success: true, linked: true, user: { ... } }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { familyName, name, birthDate, gender, email, password, phone, provider, profileImageUrl } = body;

    const isSocialSignup = !!provider; // 소셜 가입 여부

    // 1. 필수 필드 검증
    const requiredFields = ["familyName", "name", "birthDate", "gender", "email"];
    if (!isSocialSignup) {
      requiredFields.push("password"); // 일반 가입이면 비밀번호 필수
    }

    const validation = validateRequiredFields(body, requiredFields);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: `필수 필드가 누락되었습니다: ${validation.missingFields?.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 2. 이메일 형식 검증
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "INVALID_EMAIL", message: "유효하지 않은 이메일 형식입니다." },
        { status: 400 }
      );
    }

    // 3. 전화번호 정규화 및 검증 (제공된 경우)
    let normalizedPhone = "";
    if (phone) {
      normalizedPhone = normalizePhoneNumber(phone);
      if (!isValidPhoneNumber(normalizedPhone)) {
        return NextResponse.json(
          {
            error: "INVALID_PHONE",
            message: "유효하지 않은 전화번호 형식입니다.",
          },
          { status: 400 }
        );
      }
    }

    // 4. 날짜 형식 검증
    if (!isValidDate(birthDate)) {
      return NextResponse.json(
        {
          error: "INVALID_DATE",
          message: "유효하지 않은 날짜 형식입니다. (YYYY-MM-DD)",
        },
        { status: 400 }
      );
    }

    // 5. 만 나이 검증 (최소 12세 이상)
    const age = calculateAge(birthDate);
    if (age < 12) {
      return NextResponse.json(
        {
          error: "AGE_RESTRICTION",
          message: "만 12세 이상만 가입할 수 있습니다.",
        },
        { status: 400 }
      );
    }

    // 6. 성별 검증
    if (!isValidGender(gender)) {
      return NextResponse.json(
        {
          error: "INVALID_GENDER",
          message: "유효하지 않은 성별입니다. (male | female)",
        },
        { status: 400 }
      );
    }

    // 7. 비밀번호 강도 검증 (일반 가입만)
    if (!isSocialSignup) {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          {
            error: "WEAK_PASSWORD",
            message: passwordValidation.message,
          },
          { status: 400 }
        );
      }
    }

    // 8. 소셜 가입 + 전화번호가 있는 경우: 기존 계정과 연결 시도
    if (isSocialSignup && normalizedPhone) {
      const existingUserByPhone = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existingUserByPhone) {
        // 기존 계정에 소셜 로그인 provider 정보 추가 (계정 연결)
        const updatedUser = await prisma.user.update({
          where: { id: existingUserByPhone.id },
          data: {
            provider,
            ...(profileImageUrl && { profileImageUrl }),
          },
        });

        console.log(
          `[POST /api/auth/register] Account linked via phone number: ${normalizedPhone} (${provider})`
        );

        return NextResponse.json({
          success: true,
          linked: true, // 계정 연결 플래그
          user: {
            id: String(updatedUser.id),
            email: updatedUser.email,
            familyName: updatedUser.familyName,
            name: updatedUser.givenName,  // [필드명 매핑] DB: givenName → API: name
          },
        });
      }
    }

    // 9. 이메일 중복 체크 및 프로필 미완성 계정 업데이트
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // 9-1. 기존 계정이 프로필 미완성 상태 (소셜 로그인 임시 계정)인지 확인
      const isIncompleteProfile =
        !existingUser.givenName ||
        !existingUser.familyName ||
        !existingUser.birthDate ||
        !existingUser.gender;

      if (isIncompleteProfile) {
        // 프로필 미완성 계정 → 부족한 정보만 업데이트
        console.log(
          `[POST /api/auth/register] Updating incomplete profile for user: ${existingUser.email}`
        );
        console.log(`[POST /api/auth/register] Missing fields:`, {
          givenName: !existingUser.givenName,
          familyName: !existingUser.familyName,
          birthDate: !existingUser.birthDate,
          gender: !existingUser.gender,
        });

        const updateData: Record<string, unknown> = {};

        // 부족한 정보만 업데이트
        if (!existingUser.givenName) {
          updateData.givenName = name;
        }
        if (!existingUser.familyName) {
          updateData.familyName = familyName;
        }
        if (!existingUser.birthDate) {
          updateData.birthDate = new Date(birthDate);
        }
        if (!existingUser.gender) {
          updateData.gender = gender.toLowerCase();
        }

        // 전화번호, provider, 프로필 이미지는 제공된 경우 업데이트
        if (normalizedPhone) {
          updateData.phone = normalizedPhone;
        }
        if (provider) {
          updateData.provider = provider;
        }
        if (profileImageUrl) {
          updateData.profileImageUrl = profileImageUrl;
        }

        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });

        return NextResponse.json({
          success: true,
          updated: true, // 업데이트 플래그
          user: {
            id: String(updatedUser.id),
            email: updatedUser.email,
            familyName: updatedUser.familyName,
            name: updatedUser.givenName,
          },
        });
      }

      // 9-2. 프로필이 이미 완성된 계정 → 에러
      return NextResponse.json(
        {
          error: "EMAIL_ALREADY_EXISTS",
          message: "이미 사용 중인 이메일입니다.",
        },
        { status: 400 }
      );
    }

    // 10. 전화번호 중복 체크 (제공된 경우)
    if (normalizedPhone) {
      const existingUserByPhone = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existingUserByPhone) {
        return NextResponse.json(
          {
            error: "PHONE_ALREADY_EXISTS",
            message: "이미 사용 중인 전화번호입니다.",
          },
          { status: 400 }
        );
      }
    }

    // 11. 비밀번호 해싱 (일반 가입만)
    let hashedPassword;
    if (!isSocialSignup) {
      hashedPassword = await hashPassword(password);
    }

    // 12. 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        ...(hashedPassword && { password: hashedPassword }),
        ...(normalizedPhone && { phone: normalizedPhone }),
        familyName,
        givenName: name,
        birthDate: new Date(birthDate),
        gender: gender.toLowerCase(),
        hasSurvey: false, // 초기값: 설문 미완료
        ...(provider && { provider }),
        ...(profileImageUrl && { profileImageUrl }),
      },
    });

    // 13. 성공 응답 (비밀번호 제외)
    return NextResponse.json({
      success: true,
      user: {
        id: String(user.id),
        email: user.email,
        familyName: user.familyName,
        name: user.givenName,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/register] 회원가입 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "회원가입 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
