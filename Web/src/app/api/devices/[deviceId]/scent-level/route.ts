import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth"; // TODO: 백엔드 API 연동 시 사용

/**
 * PUT /api/devices/:deviceId/scent-level
 * 
 * 센트 레벨 변경 API
 * 
 * TODO: 백엔드 서버로 요청을 프록시하거나 직접 호출하도록 구현
 * 
 * 구현 내용:
 * 1. NextAuth 세션 확인 (인증 필수)
 * 2. URL 파라미터에서 deviceId 추출
 * 3. 요청 본문에서 level (1-10) 추출
 * 4. 유효성 검사 (level이 1-10 범위인지 확인)
 * 5. 백엔드 서버로 PUT 요청 전달
 *    - URL: ${BACKEND_URL}/api/devices/${deviceId}/scent-level
 *    - Body: { level: number }
 *    - Headers: 세션 정보 포함
 * 6. 백엔드 응답을 그대로 반환
 *    - 응답: { device: Device }
 * 7. 권한 확인 (본인의 디바이스인지 확인 - 백엔드에서 처리)
 * 8. 디바이스 타입 확인 (manager 또는 scent 타입만 가능 - 백엔드에서 검증)
 * 
 * 참고:
 * - 인증이 필요한 엔드포인트
 * - Manager 또는 Scent 타입 디바이스에만 적용 가능
 * - 센트 레벨은 1-10 범위
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  // [MOCK] 목업 모드: 목업 디바이스 반환
  // TODO: 백엔드 API 연동 시 아래 주석 해제하고 목업 코드 제거
  //
  // const session = await getServerSession();
  //
  // if (!session) {
  //   return NextResponse.json(
  //     { error: "UNAUTHORIZED", message: "Authentication required" },
  //     { status: 401 }
  //   );
  // }
  //
  // const { deviceId } = await params;
  // const body = await request.json();
  // const { level } = body;
  //
  // if (level < 1 || level > 10) {
  //   return NextResponse.json(
  //     { error: "INVALID_INPUT", message: "Level must be between 1 and 10" },
  //     { status: 400 }
  //   );
  // }
  //
  // const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  // const response = await fetch(`${backendUrl}/api/devices/${deviceId}/scent-level`, {
  //   method: "PUT",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Cookie": request.headers.get("cookie") || "",
  //   },
  //   body: JSON.stringify({ level }),
  // });
  //
  // if (!response.ok) {
  //   const error = await response.json();
  //   return NextResponse.json(error, { status: response.status });
  // }
  //
  // const data = await response.json();
  // return NextResponse.json(data);

  // 목업 응답: 센트 레벨 변경된 디바이스 반환
  const { deviceId } = await params;
  const body = await request.json();
  const { level } = body;
  
  return NextResponse.json({
    device: {
      id: deviceId,
      type: "manager",
      name: "Mood Manager",
      battery: 100,
      power: true,
      output: {
        scentLevel: level,
      },
    },
  });
}

