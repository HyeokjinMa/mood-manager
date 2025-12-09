import { useState, useEffect } from "react";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import { useMoodStreamContext } from "@/context/MoodStreamContext";
import { convertSegmentMoodToMood } from "@/app/(main)/home/components/MoodDashboard/utils/moodStreamConverter";

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
 */
export function useDevices(currentMood: Mood | null) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // moodStream과 현재 세그먼트 인덱스를 Context에서 직접 가져오기
  const { moodStream, currentSegmentIndex } = useMoodStreamContext();

  // 초기 로드: DB에서 디바이스 목록 가져오기
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch("/api/devices", {
          method: "GET",
          credentials: "include",
        });

        // 401 에러 시 로그인 페이지로 리다이렉트
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch devices");
        }

        const data = await response.json();

        // devices가 배열이면 설정, 아니면 빈 배열
        if (Array.isArray(data.devices)) {
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
          setDevices(sortedDevices);
        } else {
          setDevices([]);
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
        // 에러 발생 시 빈 배열 유지
        setDevices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // 현재 세그먼트 정보를 디바이스에 동기화
  // 핵심: moodStream의 현재 세그먼트를 단일 소스로 사용하여 모든 디바이스에 일관되게 반영
  // 세그먼트가 변경될 때마다 자동으로 디바이스 정보 업데이트
  // 중요: moodStream이 로드되기 전에는 디바이스를 업데이트하지 않음 (더미데이터 방지)
  useEffect(() => {
    // moodStream이 없으면 업데이트하지 않음 (초기 3세그먼트가 로드될 때까지 대기)
    // 이렇게 하면 DB에서 가져온 더미데이터가 먼저 보이지 않음
    if (!moodStream || !moodStream.segments || moodStream.segments.length === 0) {
      return;
    }
    
    // 현재 세그먼트 가져오기
    const currentSegment = moodStream.segments[currentSegmentIndex];
    if (!currentSegment?.mood) {
      return;
    }
    
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
              // 사용자가 변경한 값은 보존
              brightness: d.output.brightness ?? 50,
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
              brightness: d.output.brightness ?? 50,
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
  }, [currentMood, moodStream, currentSegmentIndex, setDevices]); // 현재 세그먼트 변경 시 자동 업데이트

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
          } : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create device");
      }

      const data = await response.json();

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
