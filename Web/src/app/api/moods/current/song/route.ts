// src/app/api/moods/current/song/route.ts
/**
 * [파일 역할]
 * - 노래 변경 (무드 업데이트) API
 *
 * [사용되는 위치]
 * - 프론트엔드에서 노래만 변경할 때 호출
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - 노래 변경으로 인한 무드 업데이트
 * - 관련 디바이스(Manager, Speaker) 상태 자동 업데이트
 * - 같은 무드명의 다른 노래 버전으로 변경
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { validateRequiredFields } from "@/lib/utils/validation";
import { parseFragranceComponents } from "@/types/preset";

export async function PUT(request: NextRequest) {
  // 1. 세션 검증
  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const session = sessionOrError;

  try {
    // 2. 요청 본문 검증
    const body = await request.json();
    const validation = validateRequiredFields(body, ["moodId"]);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "moodId is required" },
        { status: 400 }
      );
    }

    const { moodId } = body;

    // 3. Preset 존재 여부 확인
    const preset = await prisma.preset.findUnique({
      where: { id: moodId },
      include: {
        fragrance: true,
        light: true,
        sound: true,
      },
    });

    if (!preset) {
      return NextResponse.json(
        { error: "MOOD_NOT_FOUND", message: "Mood not found" },
        { status: 404 }
      );
    }

    // 4. Preset 소유자 확인
    if (preset.userId !== session.user.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "You do not own this mood" },
        { status: 403 }
      );
    }

    // 5. 노래 변경이 필요한 디바이스만 업데이트 (Manager, Speaker)
    const devices = await prisma.device.findMany({
      where: {
        userId: session.user.id,
        power: true,
        type: {
          in: ["manager", "speaker"],
        },
      },
    });

    const updatedDevices = await Promise.all(
      devices.map(async (device) => {
        return await prisma.device.update({
          where: { id: device.id },
          data: {
            currentPresetId: preset.id,
            nowPlaying: preset.sound.name,
          },
        });
      })
    );

    // 6. Preset 업데이트 (updatedType = 'song')
    await prisma.preset.update({
      where: { id: preset.id },
      data: {
        updatedType: "song",
        updatedAt: new Date(),
      },
    });

    // 7. Fragrance componentsJson에서 type 추출
    const fragranceComponents = parseFragranceComponents(preset.fragrance.componentsJson);
    const scentType = fragranceComponents.type;

    // 8. 응답 포맷팅
    return NextResponse.json({
      mood: {
        id: preset.id,
        name: preset.name,
        color: preset.fragrance.color || preset.light.color,
        song: {
          title: preset.sound.name,
          duration: preset.sound.duration || 180,
        },
        scent: {
          type: scentType.toLowerCase(),  // 타입: "musk", "citrus" 등
          name: preset.fragrance.name,    // 이름: "Cloud", "Wave" 등
          color: preset.fragrance.color || preset.light.color,
        },
      },
      updatedDevices: updatedDevices.map((device) => ({
        id: device.id,
        type: device.type,
        name: device.name,
        battery: device.battery || 100,
        power: device.power || true,
        output: {
          ...(device.type === "manager" || device.type === "light"
            ? {
                brightness: device.brightness || preset.light.brightness,
                color: device.color || preset.light.color,
              }
            : {}),
          ...(device.type === "manager" || device.type === "scent"
            ? {
                scentType: preset.fragrance.name,
                scentLevel: device.scentLevel || 7,
                ...(device.scentInterval ? { scentInterval: device.scentInterval } : {}),
              }
            : {}),
          ...(device.type === "manager" || device.type === "speaker"
            ? {
                volume: device.volume || 65,
                nowPlaying: preset.sound.name,
              }
            : {}),
        },
      })),
    });
  } catch (error) {
    console.error("[PUT /api/moods/current/song] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to update song" },
      { status: 500 }
    );
  }
}

