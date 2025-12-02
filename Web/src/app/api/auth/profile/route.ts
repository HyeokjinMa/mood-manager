// src/app/api/auth/profile/route.ts
/**
 * [파일 역할]
 * - 사용자 프로필 정보 조회 및 업데이트 API
 * - GET: 프로필 정보 조회
 * - PUT: 프로필 정보 업데이트 (이름, 성, 프로필 사진)
 *
 * [사용되는 위치]
 * - 마이페이지에서 프로필 조회/수정 시 사용
 * - GET /api/auth/profile
 * - PUT /api/auth/profile
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - 본인의 프로필 정보만 조회/수정 가능
 * - 프로필 사진은 최대 5MB, 이미지 파일만 허용
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/profile
 *
 * 프로필 정보 조회
 *
 * 응답:
 * - 성공: { profile: UserProfile }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function GET() {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[GET /api/auth/profile] Mock mode: Admin account");
      return NextResponse.json({
        profile: {
          email: session.user.email || "admin@moodmanager.com",
          name: "Admin",
          familyName: "User",
          birthDate: "1990-01-01",
          gender: "Male",
          phone: null,
          createdAt: new Date().toISOString().split("T")[0],
          profileImageUrl: null,
        },
      });
    }

    // 3. 사용자 프로필 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        givenName: true,
        familyName: true,
        birthDate: true,
        gender: true,
        phone: true,
        profileImageUrl: true,
        createdAt: true,
        provider: true,
        providerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "User not found" },
        { status: 404 }
      );
    }

    // 4. 프로필 데이터 포맷팅
    // [필드명 매핑 규칙] DB: givenName → API 응답: name
    const profile = {
      email: user.email,
      name: user.givenName || "",        // DB의 givenName → API의 name
      familyName: user.familyName || "",  // DB와 API 동일
      birthDate: user.birthDate
        ? user.birthDate.toISOString().split("T")[0]
        : null,
      gender:
        user.gender === "male"
          ? "Male"
          : user.gender === "female"
            ? "Female"
            : null,
      phone: user.phone || null,
      createdAt: user.createdAt.toISOString().split("T")[0],
      profileImageUrl: user.profileImageUrl || null,
      provider: user.provider || null,
      providerId: user.providerId || null,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[GET /api/auth/profile] Failed to fetch profile:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/profile
 *
 * 프로필 정보 업데이트
 *
 * 요청 (FormData):
 * - name (required): 사용자 이름
 * - familyName (required): 사용자 성
 * - birthDate (optional): 생년월일 (YYYY-MM-DD)
 * - gender (optional): 성별 (male | female)
 * - phone (optional): 전화번호
 * - profileImage (optional): 프로필 사진 파일 (최대 5MB)
 *
 * 응답:
 * - 성공: { profile: UserProfile }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 *
 * 참고:
 * - 프로필 사진은 클라우드 스토리지(AWS S3, Cloudinary 등)에 업로드하고 URL만 DB에 저장
 * - 현재는 Base64로 변환하여 저장 (목업)
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[PUT /api/auth/profile] Mock mode: Admin account");
      // 목업 모드에서는 요청한 데이터를 그대로 반환
      const formData = await request.formData();
      const name = (formData.get("name") as string) || "Admin";
      const familyName = (formData.get("familyName") as string) || "User";
      const birthDateStr = formData.get("birthDate") as string | null;
      const gender = formData.get("gender") as string | null;
      const phone = formData.get("phone") as string | null;
      const profileImage = formData.get("profileImage") as File | null;
      
      let profileImageUrl: string | null = null;
      if (profileImage && profileImage.size > 0) {
        const arrayBuffer = await profileImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        profileImageUrl = `data:${profileImage.type};base64,${base64}`;
      }
      
      return NextResponse.json({
        profile: {
          email: session.user.email || "admin@moodmanager.com",
          name,
          familyName,
          birthDate: birthDateStr || "1990-01-01",
          gender: gender || "Male",
          phone,
          createdAt: new Date().toISOString().split("T")[0],
          profileImageUrl,
          provider: null,
          providerId: null,
        },
      });
    }

    // 3. FormData 파싱
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const familyName = formData.get("familyName") as string;
    const birthDateStr = formData.get("birthDate") as string | null;
    const gender = formData.get("gender") as string | null;
    const phone = formData.get("phone") as string | null;
    const profileImage = formData.get("profileImage") as File | null;

    // 4. 필수 필드 검증
    if (!name || !familyName) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Name and family name are required",
        },
        { status: 400 }
      );
    }

    // 4-1. 생년월일 검증 (제공된 경우)
    let birthDate: Date | undefined = undefined;
    if (birthDateStr) {
      birthDate = new Date(birthDateStr);
      if (isNaN(birthDate.getTime())) {
        return NextResponse.json(
          {
            error: "INVALID_INPUT",
            message: "Invalid birth date format",
          },
          { status: 400 }
        );
      }
    }

    // 4-2. 성별 검증 (제공된 경우)
    if (gender && gender !== "male" && gender !== "female") {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Gender must be 'male' or 'female'",
        },
        { status: 400 }
      );
    }

    // 4. 프로필 사진 처리
    let profileImageUrl: string | null = null;
    if (profileImage && profileImage.size > 0) {
      // 이미지 파일 타입 검증
      if (!profileImage.type.startsWith("image/")) {
        return NextResponse.json(
          {
            error: "INVALID_INPUT",
            message: "Profile image must be an image file",
          },
          { status: 400 }
        );
      }

      // 이미지 파일 크기 검증 (최대 5MB)
      if (profileImage.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: "INVALID_INPUT",
            message: "Profile image must be less than 5MB",
          },
          { status: 400 }
        );
      }

      // 목업: Base64로 변환하여 저장 (실제로는 클라우드 스토리지에 업로드)
      const arrayBuffer = await profileImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      profileImageUrl = `data:${profileImage.type};base64,${base64}`;
    }

    // 5. 사용자 프로필 업데이트
    const updateData: Record<string, unknown> = {
      givenName: name.trim(),
      familyName: familyName.trim(),
    };

    if (birthDate !== undefined) {
      updateData.birthDate = birthDate;
    }
    if (gender) {
      updateData.gender = gender.toLowerCase();
    }
    if (phone !== null) {
      updateData.phone = phone.trim() || null; // 빈 문자열이면 null로 저장
    }
    if (profileImageUrl) {
      updateData.profileImageUrl = profileImageUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        email: true,
        givenName: true,
        familyName: true,
        birthDate: true,
        gender: true,
        phone: true,
        profileImageUrl: true,
        createdAt: true,
        provider: true,
        providerId: true,
      },
    });

    // 6. 프로필 데이터 포맷팅
    const profile = {
      email: updatedUser.email,
      name: updatedUser.givenName || "",
      familyName: updatedUser.familyName || "",
      birthDate: updatedUser.birthDate
        ? updatedUser.birthDate.toISOString().split("T")[0]
        : null,
      gender:
        updatedUser.gender === "male"
          ? "Male"
          : updatedUser.gender === "female"
            ? "Female"
            : null,
      phone: updatedUser.phone || null,
      createdAt: updatedUser.createdAt.toISOString().split("T")[0],
      profileImageUrl: updatedUser.profileImageUrl || null,
      provider: updatedUser.provider || null,
      providerId: updatedUser.providerId || null,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[PUT /api/auth/profile] Failed to update profile:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
