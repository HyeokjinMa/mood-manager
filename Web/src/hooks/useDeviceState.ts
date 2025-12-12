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

import { useState, useCallback, useRef } from "react";
import type { Mood } from "@/types/mood";
import type { Device } from "@/types/device";
import { hexToRgb } from "@/lib/utils/color";

interface DeviceControlChanges {
  color?: string;
  brightness?: number;
  scentLevel?: number;
  volume?: number;
  power?: boolean;
  deviceId?: string; // ✅ Phase 2: 디바이스 ID 추가
}

interface UseDeviceStateProps {
  currentMood: Mood | null;
  setCurrentMood: (mood: Mood) => void;
  initialVolume?: number;
  // ✅ Fix: devices와 setDevices 추가 (HomePage로부터 받음)
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
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
  devices, // ✅ Fix: props로 받음
  setDevices, // ✅ Fix: props로 받음
}: UseDeviceStateProps): UseDeviceStateReturn {
  // 음량 상태 관리 (0-100 범위, 오디오 플레이어에 즉시 반영)
  const [volume, setVolume] = useState<number>(initialVolume);

  // ✅ Phase 2: DB 업데이트 디바운스를 위한 타이머 저장소
  const dbUpdateTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // ✅ Phase 3: 라즈베리파이 API 디바운스를 위한 타이머 저장소
  const raspberryApiTimeout = useRef<NodeJS.Timeout | null>(null);
  // ✅ Phase 4: 재시도 로직을 위한 추적 (디바이스별)
  const retryCounts = useRef<Map<string, number>>(new Map());
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1초

  // ✅ Phase 4: DB 업데이트 재시도 함수
  const retryDbUpdate = useCallback((deviceId: string, updateData: {
    color?: string;
    brightness?: number;
    scentLevel?: number;
    volume?: number;
  }, attempt: number = 1): Promise<void> => {
    return fetch(`/api/devices/${deviceId}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log(`[useDeviceState] ✅ DB 업데이트 완료: ${deviceId} (시도 ${attempt})`, result);
        retryCounts.current.delete(deviceId);
        return Promise.resolve();
      })
      .catch((error) => {
        if (attempt < MAX_RETRIES) {
          console.warn(`[useDeviceState] ⚠️ DB 업데이트 실패 (시도 ${attempt}/${MAX_RETRIES}): ${deviceId}`, error);
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(retryDbUpdate(deviceId, updateData, attempt + 1));
            }, RETRY_DELAY * attempt); // 지수 백오프
          });
        } else {
          console.error(`[useDeviceState] ❌ DB 업데이트 최종 실패: ${deviceId} (${attempt}회 시도)`, error);
          retryCounts.current.delete(deviceId);
          throw error;
        }
      });
  }, []);

  // ✅ Phase 2, 4: DB 업데이트 디바운스 함수 (재시도 로직 포함)
  const debouncedDbUpdate = useCallback((deviceId: string, updateData: {
    color?: string;
    brightness?: number;
    scentLevel?: number;
    volume?: number;
  }) => {
    // 이전 타이머 취소
    const existingTimeout = dbUpdateTimeouts.current.get(deviceId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 새 타이머 설정 (500ms 디바운스)
    const timeoutId = setTimeout(() => {
      console.log(`[useDeviceState] 📤 DB 업데이트 시작: ${deviceId}`, updateData);
      retryDbUpdate(deviceId, updateData).catch((error) => {
        // 최종 실패 시 에러는 이미 로깅됨
      });
      
      dbUpdateTimeouts.current.delete(deviceId);
    }, 500);

    dbUpdateTimeouts.current.set(deviceId, timeoutId);
  }, [retryDbUpdate]);

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
          `[useDeviceState] ℹ️ 센트 레벨 변경: ${changes.scentLevel}`
        );
      }

      // ✅ Fix: 프론트엔드 devices 상태 즉시 업데이트 (UI 동기화)
      if (changes.deviceId) {
        setDevices(prevDevices => {
          return prevDevices.map(device => {
            if (device.id === changes.deviceId) {
              const updatedDevice = {
                ...device,
                output: {
                  ...device.output,
                  ...(changes.color && { color: changes.color }),
                  ...(changes.brightness !== undefined && { brightness: changes.brightness }),
                  ...(changes.scentLevel !== undefined && { scentLevel: changes.scentLevel }),
                  ...(changes.volume !== undefined && { volume: changes.volume }),
                },
              };
              console.log(`[useDeviceState] ✅ 디바이스 ${device.id} 상태 즉시 업데이트:`, {
                color: updatedDevice.output.color,
                brightness: updatedDevice.output.brightness,
                scentLevel: updatedDevice.output.scentLevel,
                volume: updatedDevice.output.volume,
              });
              return updatedDevice;
            }
            return device;
          });
        });
      }

      // ✅ Phase 2: DB 저장 API 호출 (디바운스 적용)
      if (changes.deviceId) {
        const updateData: {
          color?: string;
          brightness?: number;
          scentLevel?: number;
          volume?: number;
        } = {};

        // 변경된 값만 포함
        if (changes.color) updateData.color = changes.color;
        if (changes.brightness !== undefined) {
          updateData.brightness = changes.brightness;
          console.log(`[useDeviceState] ✅ brightness 포함: ${changes.brightness}%`);
        }
        if (changes.scentLevel !== undefined) updateData.scentLevel = changes.scentLevel;
        if (changes.volume !== undefined) updateData.volume = changes.volume;

        // 값이 하나라도 있으면 DB 업데이트
        if (Object.keys(updateData).length > 0) {
          console.log(`[useDeviceState] 📤 DB 업데이트 데이터:`, updateData);
          debouncedDbUpdate(changes.deviceId, updateData);
        } else {
          console.warn(`[useDeviceState] ⚠️ DB 업데이트 데이터가 비어있음. changes:`, changes);
        }
      }

      // ✅ Phase 3: Light/Manager 타입 디바이스의 색상/밝기 변경 시 route.ts 업데이트 (디바운스 적용)
      // brightness 변경 시 직접 light_info API 호출 (색상과 동일하게)
      if (changes.color || changes.brightness !== undefined) {
        console.log("[useDeviceState] 🔆 색상/밝기 변경 감지:", { color: changes.color, brightness: changes.brightness });
        
        // ✅ Phase 3: 라즈베리파이 API 디바운스 (300ms) - 실시간 반영이 중요하므로 DB보다 짧게
        if (raspberryApiTimeout.current) {
          clearTimeout(raspberryApiTimeout.current);
        }

        raspberryApiTimeout.current = setTimeout(() => {
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
              // ✅ Phase 4: 에러 로깅 개선
              console.error("[useDeviceState] ❌ Failed to update search_light status:", error);
              // 라즈베리파이 API는 실패해도 재시도하지 않음 (라즈베리파이가 자체적으로 재시도)
            });

          // ✅ Fix: power 체크 제거 - off 상태면 UI에서 조정 불가능하므로 항상 값 전달
          // 라즈베리파이가 off면 값을 사용하지 않으므로 제어할 필요 없음
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
          // ✅ power 체크 없이 항상 전달 (off 상태면 라즈베리파이가 무시)
          console.log(
            "[useDeviceState] 📡 POST /api/light_info 업데이트 요청 시작:",
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
              // ✅ Phase 4: 에러 로깅 개선
              console.error(
                "[useDeviceState] ❌ /api/light_info 업데이트 에러:",
                error
              );
              // 라즈베리파이 API는 실패해도 재시도하지 않음 (라즈베리파이가 자체적으로 재시도)
            });
        }, 300); // ✅ Phase 3: 300ms 디바운스 (DB보다 짧게, 실시간 반영 중요)
      }

      console.log("=".repeat(80) + "\n");
    },
    [currentMood, setCurrentMood, volume, debouncedDbUpdate, retryDbUpdate, setDevices, devices] // ✅ Fix: setDevices, devices 의존성 추가
  );

  return {
    volume,
    setVolume,
    handleDeviceControlChange,
  };
}

