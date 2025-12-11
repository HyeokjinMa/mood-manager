/**
 * useDeviceState
 * 
 * 디바이스 상태 변경 로직을 통합 관리하는 훅
 * 
 * 주요 기능:
 * - 볼륨: 즉각 반영 (오디오 플레이어)
 * - 색상/밝기: route.ts 전송 (라즈베리파이 풀링)
 * - 센트 레벨: 디바이스 output에 저장
 * - currentMood 업데이트
 */

import { useState, useCallback } from "react";
import type { Mood } from "@/types/mood";
import { hexToRgb } from "@/lib/utils/color";

interface DeviceControlChanges {
  color?: string;
  brightness?: number;
  scentLevel?: number;
  volume?: number;
  power?: boolean;
}

interface UseDeviceStateProps {
  currentMood: Mood | null;
  setCurrentMood: (mood: Mood) => void;
  initialVolume?: number;
}

interface UseDeviceStateReturn {
  volume: number;
  setVolume: (volume: number) => void;
  handleDeviceControlChange: (changes: DeviceControlChanges) => void;
}

/**
 * 디바이스 상태 관리 훅
 * 
 * @param currentMood - 현재 무드 상태
 * @param setCurrentMood - 무드 상태 업데이트 함수
 * @param initialVolume - 초기 볼륨 값 (기본값: 70)
 * @returns 디바이스 상태 및 핸들러
 */
export function useDeviceState({
  currentMood,
  setCurrentMood,
  initialVolume = 70,
}: UseDeviceStateProps): UseDeviceStateReturn {
  // 음량 상태 관리 (0-100 범위, 오디오 플레이어에 즉시 반영)
  const [volume, setVolume] = useState<number>(initialVolume);

  /**
   * 디바이스 컨트롤 변경 핸들러
   * 
   * 변경 타입별 처리:
   * - volume: 즉각 반영 (오디오 플레이어)
   * - color/brightness: route.ts 전송 (라즈베리파이 풀링)
   * - scentLevel: 디바이스 output에 저장 (디바이스 업데이트 API에서 처리)
   */
  const handleDeviceControlChange = useCallback(
    (changes: DeviceControlChanges) => {
      // 변경된 값 로그 출력
      console.log("\n" + "=".repeat(80));
      console.log("[useDeviceState] 📱 디바이스 컨트롤 변경 감지");
      console.log("=".repeat(80));
      console.log("변경사항:", JSON.stringify(changes, null, 2));

      if (changes.color) {
        const prevColor = currentMood?.color || "N/A";
        console.log(`  🎨 색상 변경: ${prevColor} → ${changes.color}`);
      }
      if (changes.brightness !== undefined) {
        console.log(`  💡 밝기 변경: ${changes.brightness}%`);
      }
      if (changes.scentLevel !== undefined) {
        console.log(`  🌸 센트 레벨 변경: ${changes.scentLevel}`);
      }
      if (changes.volume !== undefined) {
        console.log(`  🔊 볼륨 변경: ${volume}% → ${changes.volume}%`);
      }

      // currentMood 업데이트 (모든 컴포넌트에 즉시 반영)
      if (currentMood) {
        const updatedMood = { ...currentMood };
        let moodUpdated = false;

        // 색상 변경
        if (changes.color && changes.color !== currentMood.color) {
          updatedMood.color = changes.color;
          moodUpdated = true;
          console.log(
            `[useDeviceState] ✅ currentMood.color 업데이트: ${currentMood.color} → ${changes.color}`
          );
        }

        if (moodUpdated) {
          setCurrentMood(updatedMood);
          console.log(
            "[useDeviceState] ✅ currentMood 업데이트 완료 (모든 컴포넌트에 반영됨)"
          );
        }
      }

      // 볼륨 변경 시 오디오 플레이어에 즉시 반영
      if (changes.volume !== undefined && changes.volume !== volume) {
        const prevVolume = volume;
        setVolume(changes.volume);
        console.log(
          `[useDeviceState] ✅ 볼륨 업데이트: ${prevVolume}% → ${changes.volume}% (오디오 플레이어에 즉시 반영)`
        );
      }

      if (changes.scentLevel !== undefined) {
        console.log(
          `[useDeviceState] ℹ️ 센트 레벨 변경: ${changes.scentLevel} (디바이스 output 업데이트 필요)`
        );
        // 센트 레벨은 디바이스 output에 저장되어야 함
        // 디바이스 업데이트는 상위 컴포넌트(HomeContent)에서 처리
      }

      // Light/Manager 타입 디바이스의 색상/밝기 변경 시 route.ts 업데이트
      // brightness 변경 시 직접 light_info API 호출 (색상과 동일하게)
      if (changes.color || changes.brightness !== undefined) {
        console.log("[useDeviceState] 🔆 색상/밝기 변경 감지:", { color: changes.color, brightness: changes.brightness });
        
        // search_light 상태를 "search"로 변경 (라즈베리파이 풀링 활성화)
        console.log("[useDeviceState] 📡 POST /api/search_light 호출 시작");
        fetch("/api/search_light", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: "search" }),
        })
          .then((response) => {
            console.log("[useDeviceState] 📡 POST /api/search_light 응답:", response.status);
            if (response.ok) {
              return response.json();
            }
            throw new Error(`Search light failed: ${response.status}`);
          })
          .then((data) => {
            console.log("[useDeviceState] ✅ POST /api/search_light 성공:", data);
          })
          .catch((error) => {
            console.error("[useDeviceState] ❌ Failed to update search_light status:", error);
          });

        // light_power 상태 확인 후 light_info 업데이트
        fetch("/api/light_power", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })
          .then((response) => {
            if (!response.ok) {
              console.log("[useDeviceState] light_power 상태 확인 실패, light_info 전달 건너뜀");
              return null;
            }
            return response.json();
          })
          .then((powerData) => {
            // power가 "on"이 아니면 전달하지 않음
            if (!powerData || powerData.power !== "on") {
              console.log("[useDeviceState] light_power가 off 상태, light_info 전달 건너뜀");
              return;
            }

            const requestBody: {
              r?: number;
              g?: number;
              b?: number;
              brightness?: number;
            } = {};

            // 색상 변경 시 RGB 변환
            if (changes.color) {
              const rgb = hexToRgb(changes.color);
              requestBody.r = rgb[0];
              requestBody.g = rgb[1];
              requestBody.b = rgb[2];
              console.log(
                `[useDeviceState] 🔄 RGB 변환: ${changes.color} → r:${rgb[0]}, g:${rgb[1]}, b:${rgb[2]}`
              );
            }

            // 밝기 변경 시 (0-100 → 0-255 변환)
            if (changes.brightness !== undefined) {
              requestBody.brightness = Math.round((changes.brightness / 100) * 255);
              console.log(
                `[useDeviceState] 🔄 밝기 변환: ${changes.brightness}% → ${requestBody.brightness} (0-255)`
              );
            }

            // API 호출: 전구 정보 업데이트 (메모리에 저장)
            console.log(
              "[useDeviceState] 📡 POST /api/light_info 업데이트 요청 시작 (power: on):",
              requestBody
            );
            fetch("/api/light_info", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(requestBody),
            })
              .then((response) => {
                console.log("[useDeviceState] 📡 POST /api/light_info 응답:", response.status);
                if (response.ok) {
                  return response.json();
                }
                throw new Error(`Light info failed: ${response.status}`);
              })
              .then((data) => {
                console.log("[useDeviceState] ✅ POST /api/light_info 업데이트 성공:", data);
              })
              .catch((error) => {
                console.error(
                  "[useDeviceState] ❌ /api/light_info 업데이트 에러:",
                  error
                );
              });
          })
          .catch((error) => {
            console.error("[useDeviceState] light_power 상태 확인 에러:", error);
          });
      }

      console.log("=".repeat(80) + "\n");
    },
    [currentMood, setCurrentMood, volume]
  );

  return {
    volume,
    setVolume,
    handleDeviceControlChange,
  };
}

