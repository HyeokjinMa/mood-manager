import { useState, useEffect } from "react";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import { convertSegmentMoodToMood } from "@/app/(main)/home/components/MoodDashboard/utils/moodStreamConverter";
import { hexToRgb } from "@/lib/utils/color";

// 정렬 우선순위 정의
const PRIORITY: Record<Device["type"], number> = {
  manager: 1,
  light: 2,
  speaker: 3,
  scent: 4,
};

// 타입별 기본 output 설정 (향후 사용 예정)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getDefaultOutput(_type: Device["type"]): Device["output"] {
  // 향후 사용 예정
  return {};
}

/**
 * 디바이스 관리 커스텀 훅
 *
 * DB 연동 버전 (실제 API 호출)
 * Phase 6: Context 접근 제거, segments와 currentSegmentIndex를 props로 받기
 */
export function useDevices(
  currentMood: Mood | null,
  segments: MoodStreamSegment[] = [],
  currentSegmentIndex: number = 0,
  currentBrightness?: number // 현재 세그먼트의 brightness (0-100 범위)
) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true); // DB에서 디바이스 정보를 가져오는 중인지 여부

  // 초기 로드: DB에서 디바이스 목록 가져오기
  useEffect(() => {
    const fetchDevices = async () => {
      const startTime = Date.now();
      console.log("[useDevices] 🔄 디바이스 정보 로드 시작");
      
      try {
        const response = await fetch("/api/devices", {
          method: "GET",
          credentials: "include",
        });

        const fetchTime = Date.now() - startTime;
        console.log(`[useDevices] 📥 API 응답 수신 (${fetchTime}ms):`, {
          status: response.status,
          ok: response.ok,
        });

        // 401 에러 시 로그인 페이지로 리다이렉트
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const parseTime = Date.now() - startTime;
        console.log(`[useDevices] ✅ 디바이스 데이터 파싱 완료 (${parseTime}ms):`, {
          devicesCount: Array.isArray(data.devices) ? data.devices.length : 0,
        });

        // devices가 배열이면 설정, 아니면 빈 배열
        if (Array.isArray(data.devices) && data.devices.length > 0) {
          // 우선순위 + ID 순 정렬
          const sortedDevices = data.devices.sort((a: Device, b: Device) => {
            if (PRIORITY[a.type] !== PRIORITY[b.type])
              return PRIORITY[a.type] - PRIORITY[b.type];

            // ID가 숫자 형태면 숫자로 비교, 아니면 문자열로 비교
            const aId = Number(a.id);
            const bId = Number(b.id);
            if (!isNaN(aId) && !isNaN(bId)) {
              return aId - bId;
            }
            return a.id.localeCompare(b.id);
          });
          
          // ✅ Phase 3-2: Device 로드 직후 segments prop이 있으면 즉시 초기 세그먼트 값으로 업데이트
          if (segments && segments.length > 0) {
            const currentSegment = segments[currentSegmentIndex] || segments[0];
            if (currentSegment?.mood) {
              const segmentBrightness = currentBrightness ?? currentSegment.backgroundParams?.lighting?.brightness ?? 50;
              const moodFromSegment = convertSegmentMoodToMood(
                currentSegment.mood,
                currentMood,
                currentSegment
              );
              const moodToUse = currentMood || moodFromSegment;
              
              const updatedDevices = sortedDevices.map((d: Device) => {
                if (d.type === "manager") {
                  return {
                    ...d,
                    output: {
                      ...d.output,
                      color: moodToUse.color,
                      brightness: segmentBrightness,
                      scentType: moodToUse.scent.name,
                      nowPlaying: moodToUse.song.title,
                      scentLevel: d.output.scentLevel ?? 5,
                    },
                  };
                }
                if (d.type === "light") {
                  return {
                    ...d,
                    output: {
                      ...d.output,
                      color: moodToUse.color,
                      brightness: segmentBrightness,
                    },
                  };
                }
                if (d.type === "scent") {
                  return {
                    ...d,
                    output: {
                      ...d.output,
                      scentType: moodToUse.scent.name,
                      scentLevel: d.output.scentLevel ?? 5,
                    },
                  };
                }
                if (d.type === "speaker") {
                  return {
                    ...d,
                    output: {
                      ...d.output,
                      nowPlaying: moodToUse.song.title,
                    },
                  };
                }
                return d;
              });
              
              setDevices(updatedDevices);
              const totalTime = Date.now() - startTime;
              console.log(`[useDevices] ✅ 디바이스 정보 로드 완료 (초기 세그먼트 적용) (총 ${totalTime}ms):`, {
                devicesCount: updatedDevices.length,
              });
              setIsLoading(false);
              return;
            }
          }
          
          // segments가 없으면 정렬된 디바이스만 설정 (다음 useEffect에서 업데이트됨)
          setDevices(sortedDevices);
          const totalTime = Date.now() - startTime;
          console.log(`[useDevices] ✅ 디바이스 정보 로드 완료 (총 ${totalTime}ms):`, {
            devicesCount: sortedDevices.length,
          });
        } else {
          setDevices([]);
          if (!Array.isArray(data.devices)) {
            console.warn("[useDevices] ⚠️ devices가 배열이 아님:", data);
          }
        }
      } catch (error) {
        const errorTime = Date.now() - startTime;
        console.error(`[useDevices] ❌ 디바이스 정보 로드 실패 (${errorTime}ms):`, error);
        // 에러 발생 시 빈 배열 유지
        setDevices([]);
      } finally {
        setIsLoading(false);
        const totalTime = Date.now() - startTime;
        console.log(`[useDevices] 🔚 isLoading = false (총 ${totalTime}ms)`);
      }
    };

    fetchDevices();
  }, [segments, currentSegmentIndex, currentMood, currentBrightness]); // ✅ segments prop을 의존성에 추가

  // Phase 6: 현재 세그먼트 정보를 디바이스에 동기화
  // 핵심: segments 배열의 현재 세그먼트를 단일 소스로 사용하여 모든 디바이스에 일관되게 반영
  // 세그먼트가 변경될 때마다 자동으로 디바이스 정보 업데이트
  // 중요: segments가 로드되기 전에는 디바이스를 업데이트하지 않음 (더미데이터 방지)
  useEffect(() => {
    // segments가 없으면 업데이트하지 않음 (초기 3세그먼트가 로드될 때까지 대기)
    // 이렇게 하면 DB에서 가져온 더미데이터가 먼저 보이지 않음
    if (!segments || segments.length === 0) {
      return;
    }
    
    // 현재 세그먼트 가져오기
    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment?.mood) {
      return;
    }
    
    // 현재 세그먼트의 brightness 가져오기 (currentBrightness prop 또는 backgroundParams에서)
    const segmentBrightness = currentBrightness ?? currentSegment.backgroundParams?.lighting?.brightness ?? 50;
    
    // convertSegmentMoodToMood를 사용하여 안전하게 변환
    // 이 함수는 musicTracks에서 실제 노래 제목과 duration을 가져오고,
    // scent.name도 제대로 처리함
    const moodFromSegment = convertSegmentMoodToMood(
      currentSegment.mood,
      currentMood,
      currentSegment
    );
    
    // currentMood가 있으면 우선 사용 (사용자가 변경한 값, 예: 색상 변경)
    const moodToUse = currentMood || moodFromSegment;
    
    // 디바이스 업데이트: 현재 세그먼트 정보를 모든 디바이스에 반영
    // 사용자가 수동으로 변경한 값(brightness, scentLevel, volume)은 보존
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === "manager") {
          return {
            ...d,
            output: {
              ...d.output,
              // 현재 세그먼트 정보 반영
              color: moodToUse.color,
              scentType: moodToUse.scent.name,
              nowPlaying: moodToUse.song.title,
              // ✅ Phase 2-2: brightness는 사용자가 변경한 값이 있으면 유지, 없으면 세그먼트 값 사용
              brightness: d.output.brightness ?? segmentBrightness,
              // scentLevel은 사용자가 변경한 값 보존
              scentLevel: d.output.scentLevel ?? 5,
            },
          };
        }
        if (d.type === "light") {
          return {
            ...d,
            output: {
              ...d.output,
              color: moodToUse.color,
              // ✅ Phase 2-2: brightness는 사용자가 변경한 값이 있으면 유지, 없으면 세그먼트 값 사용
              brightness: d.output.brightness ?? segmentBrightness,
            },
          };
        }
        if (d.type === "scent") {
          return {
            ...d,
            output: {
              ...d.output,
              scentType: moodToUse.scent.name,
              scentLevel: d.output.scentLevel ?? 5,
            },
          };
        }
        if (d.type === "speaker") {
          return {
            ...d,
            output: {
              ...d.output,
              nowPlaying: moodToUse.song.title,
            },
          };
        }
        return d;
      })
    );
  }, [currentMood, segments, currentSegmentIndex, currentBrightness, setDevices]); // Phase 6: 현재 세그먼트 변경 시 자동 업데이트

  // 디바이스 추가 (DB에 저장)
  const addDevice = async (type: Device["type"], name?: string, currentMood?: Mood | null) => {
    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type,
          name: name?.trim() || undefined, // 빈 문자열이면 undefined로 전달 (백엔드에서 자동 생성)
          currentMood: currentMood ? {
            color: currentMood.color,
            scentType: currentMood.scent.type,
            scentName: currentMood.scent.name,
            songTitle: currentMood.song.title,
            brightness: 'brightness' in currentMood ? (currentMood as Mood & { brightness: number }).brightness : undefined,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create device");
      }

      const data = await response.json();

      // light 타입 디바이스 추가 시 search_light API의 status를 "search"로 변경하고 전원 켜기
      if (type === "light" || type === "manager") {
        console.log("[Add Device] 🔍 Light/Manager 디바이스 추가 감지 - search 상태로 변경 및 전원 켜기");
        
        // currentMood에서 초기 색상 가져오기
        const initialColor = currentMood?.color || "#FFD700";
        const rgb = hexToRgb(initialColor);
        const initialBrightness = currentMood && 'brightness' in currentMood 
          ? (currentMood as Mood & { brightness?: number }).brightness || 50
          : 50;
        
        try {
          // 1. search_light API: status를 "search"로 변경
          // 클라이언트에서 호출하므로 API 키는 선택적 (개발 환경에서는 완화)
          const searchResponse = await fetch("/api/search_light", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ status: "search" }),
          });
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log("[Add Device] ✅ search_light 상태 변경 성공:", searchData);
          } else {
            const errorData = await searchResponse.json().catch(() => ({}));
            console.error("[Add Device] ❌ search_light 상태 변경 실패:", searchResponse.status, errorData);
          }
        } catch (error) {
          console.error("[Add Device] ❌ search_light API 호출 에러:", error);
        }
        
        // 2. light_info API에 초기 RGB 값 전달
        try {
          const lightInfoResponse = await fetch("/api/light_info", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              r: rgb[0],
              g: rgb[1],
              b: rgb[2],
              brightness: Math.round((initialBrightness / 100) * 255), // 0-100 → 0-255 변환
            }),
          });
          
          if (lightInfoResponse.ok) {
            const lightInfoData = await lightInfoResponse.json();
            console.log("[Add Device] ✅ light_info 초기 RGB 값 설정 성공:", lightInfoData);
          } else {
            const errorData = await lightInfoResponse.json().catch(() => ({}));
            console.error("[Add Device] ❌ light_info 초기 RGB 값 설정 실패:", lightInfoResponse.status, errorData);
          }
        } catch (error) {
          console.error("[Add Device] ❌ light_info API 호출 에러:", error);
        }
        
        try {
          // 3. light_power API: 전원을 "on"으로 설정
          // 클라이언트에서 호출하므로 API 키는 선택적 (개발 환경에서는 완화)
          const powerResponse = await fetch("/api/light_power", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ power: "on" }),
          });
          
          if (powerResponse.ok) {
            const powerData = await powerResponse.json();
            console.log("[Add Device] ✅ light_power 전원 켜기 성공:", powerData);
          } else {
            const errorData = await powerResponse.json().catch(() => ({}));
            console.error("[Add Device] ❌ light_power 전원 켜기 실패:", powerResponse.status, errorData);
          }
        } catch (error) {
          console.error("[Add Device] ❌ light_power API 호출 에러:", error);
        }
      }

      // 새로 생성된 디바이스를 목록에 추가
      setDevices((prev) => {
        const updated = [...prev, data.device];
        // 우선순위 + ID 순 정렬
        return updated.sort((a: Device, b: Device) => {
          if (PRIORITY[a.type] !== PRIORITY[b.type])
            return PRIORITY[a.type] - PRIORITY[b.type];

          // ID가 숫자 형태면 숫자로 비교, 아니면 문자열로 비교
          const aId = Number(a.id);
          const bId = Number(b.id);
          if (!isNaN(aId) && !isNaN(bId)) {
            return aId - bId;
          }
          return a.id.localeCompare(b.id);
        });
      });
    } catch (error) {
      console.error("Error creating device:", error);
      // 에러 발생 시 사용자에게 알림
      alert("디바이스 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return {
    devices,
    setDevices,
    addDevice,
    isLoading,
  };
}
