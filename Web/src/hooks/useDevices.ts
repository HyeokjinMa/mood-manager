import { useState, useEffect } from "react";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";

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
          setDevices(data.devices);
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

  // 무드 변경 시 디바이스 업데이트 (로컬 상태만 업데이트)
  // TODO: 백엔드 무드 API 구현 후 실제 API 호출로 변경
  useEffect(() => {
    if (!currentMood) return; // currentMood가 null이면 업데이트하지 않음
    
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === "manager") {
          return {
            ...d,
            output: {
              ...d.output,
              color: currentMood.color,
              scentType: currentMood.scent.name,
              nowPlaying: currentMood.song.title,
            },
          };
        }
        if (d.type === "light") {
          return {
            ...d,
            output: {
              ...d.output,
              color: currentMood.color,
            },
          };
        }
        return d;
      })
    );
  }, [currentMood]);

  // 디바이스 추가 (DB에 저장)
  const addDevice = async (type: Device["type"], name?: string) => {
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
