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
import { seedAll } from "@/lib/db/seedFragrancesAndGenres";

/**
 * 기본 Preset 컴포넌트 생성
 * 각 사용자마다 고유한 컴포넌트를 생성
 */
async function createDefaultPresetComponents() {
  // Fragrance & Genre 시드 데이터 확인/생성 (없으면 생성)
  // 주의: 매 사용자마다 호출되지만 중복 체크로 인해 비효율은 최소화됨
  await seedAll();
  
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
      temperature: 4000, // 색온도 추가
      rgb: [255, 217, 102], // RGB 배열 추가
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
        temperature: defaultLight.temperature ?? 4000, // 색온도 추가
        scentType: defaultFragrance.name,
        scentLevel: 7,
        scentInterval: 30,
        volume: 65,
        nowPlaying: defaultSound.name,
        currentPresetId: defaultPreset.id,
      },
    });

    // 4. 모든 Fragrance와 Genre에 초기 가중치 +1 부여
    await initializeUserPreferences(userId);

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

/**
 * 사용자의 모든 Fragrance와 Genre에 초기 가중치 +1 부여
 */
async function initializeUserPreferences(userId: string) {
  try {
    // 모든 Fragrance 조회
    const allFragrances = await prisma.fragrance.findMany();
    
    // 모든 Genre 조회
    const allGenres = await prisma.genre.findMany();

    // 각 Fragrance에 대해 ScentPreference 생성 (weight = 1)
    // 이미 존재하는 경우 스킵 (중복 생성 방지)
    for (const fragrance of allFragrances) {
      const existing = await prisma.scentPreference.findUnique({
        where: {
          userId_scentId: {
            userId,
            scentId: fragrance.id,
          },
        },
      });

      if (!existing) {
        await prisma.scentPreference.create({
          data: {
            userId,
            scentId: fragrance.id,
            weight: 1, // 초기 가중치
          },
        });
      }
    }

    // 각 Genre에 대해 GenrePreference 생성 (weight = 1)
    // 이미 존재하는 경우 스킵 (중복 생성 방지)
    for (const genre of allGenres) {
      const existing = await prisma.genrePreference.findUnique({
        where: {
          userId_genreId: {
            userId,
            genreId: genre.id,
          },
        },
      });

      if (!existing) {
        await prisma.genrePreference.create({
          data: {
            userId,
            genreId: genre.id,
            weight: 1, // 초기 가중치
          },
        });
      }
    }

    console.log(`[initializeUserPreferences] 초기 가중치 부여 완료 (userId: ${userId})`);
  } catch (error) {
    console.error("[initializeUserPreferences] 초기 가중치 부여 실패:", error);
    // 초기 가중치 부여 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

