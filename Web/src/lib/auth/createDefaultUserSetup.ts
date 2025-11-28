// src/lib/auth/createDefaultUserSetup.ts
/**
 * 신규 사용자 기본 설정 생성
 * 
 * 사용자 생성 시 자동으로:
 * 1. 기본 Preset 컴포넌트 생성 (Fragrance, Light, Sound)
 * 2. 기본 Preset 생성
 * 3. 기본 Manager 디바이스 생성
 */

import { prisma } from "@/lib/prisma";

/**
 * 기본 Preset 컴포넌트 생성
 * 각 사용자마다 고유한 컴포넌트를 생성
 */
async function createDefaultPresetComponents() {
  // 기본 Fragrance 생성
  const defaultFragrance = await prisma.fragrance.create({
    data: {
      name: "Lavender",
      description: "차분하고 평온한 라벤더 향",
      color: "#E6E6FA",
      intensityLevel: 5,
      operatingMin: 30,
      componentsJson: {
        type: "floral",
        intensity: 5,
      },
    },
  });

  // 기본 Light 생성
  const defaultLight = await prisma.light.create({
    data: {
      name: "Warm White",
      color: "#FFD966",
      brightness: 80,
    },
  });

  // 기본 Sound 생성
  const defaultSound = await prisma.sound.create({
    data: {
      name: "Calm Breeze",
      fileUrl: "/sounds/calm-breeze.mp3",
      duration: 180,
      componentsJson: {
        genre: "newage",
        mood: "calm",
      },
    },
  });

  return { defaultFragrance, defaultLight, defaultSound };
}

/**
 * 신규 사용자 기본 설정 생성
 */
export async function createDefaultUserSetup(userId: string) {
  try {
    // 1. 기본 Preset 컴포넌트 생성
    const { defaultFragrance, defaultLight, defaultSound } = await createDefaultPresetComponents();

    // 2. 기본 Preset 생성
    const defaultPreset = await prisma.preset.create({
      data: {
        userId,
        fragranceId: defaultFragrance.id,
        lightId: defaultLight.id,
        soundId: defaultSound.id,
        name: "Calm Breeze",
        cluster: "0", // 중립
        isDefault: true,
      },
    });

    // 3. 기본 Manager 디바이스 생성
    const managerDevice = await prisma.device.create({
      data: {
        userId,
        name: "Mood Manager",
        type: "manager",
        status: "active",
        battery: 100,
        power: true,
        brightness: 80,
        color: defaultLight.color,
        scentType: defaultFragrance.name,
        scentLevel: 7,
        scentInterval: 30,
        volume: 65,
        nowPlaying: defaultSound.name,
        currentPresetId: defaultPreset.id,
      },
    });

    console.log("[createDefaultUserSetup] 기본 설정 생성 완료:", {
      userId,
      presetId: defaultPreset.id,
      deviceId: managerDevice.id,
    });

    return {
      preset: defaultPreset,
      device: managerDevice,
    };
  } catch (error) {
    console.error("[createDefaultUserSetup] 기본 설정 생성 실패:", error);
    throw error;
  }
}

