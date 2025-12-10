/**
 * useDeviceHandlers
 */

import type { Device } from "@/types/device";

interface UseDeviceHandlersProps {
  device: Device;
  setDevices: (fn: (prev: Device[]) => Device[]) => void;
}

/**
 * 디바이스 액션 핸들러 생성 함수
 * 모든 디바이스 관련 액션(삭제, 전원 토글, 이름 변경, 컨트롤 업데이트)을 관리
 *
 * DB 연동 버전 (실제 API 호출)
 * Mock Mode일 때는 API 호출 건너뛰고 로컬 상태만 업데이트
 *
 * 주의: 이 함수는 훅이 아니므로 반복문 내부에서도 사용 가능합니다.
 */
export function createDeviceHandlers({
  device,
  setDevices,
}: UseDeviceHandlersProps) {

  // 디바이스 삭제 (DB 연동)
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/devices/${device.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        // Mock Mode일 가능성 체크 (401/403 에러는 무시하고 로컬 삭제)
        if (response.status === 401 || response.status === 403) {
          // Mock Mode: 로컬 상태만 업데이트
          setDevices((prev) => prev.filter((d) => d.id !== device.id));
          return;
        }
        const error = await response.json();
        throw new Error(error.message || "Failed to delete device");
      }

      // 삭제 성공 시 로컬 상태 업데이트
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
    } catch (error) {
      console.error("Error deleting device:", error);
      // 네트워크 에러나 기타 에러 시 Mock Mode로 간주하고 로컬 삭제
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
    }
  };

  // 디바이스 전원 토글 (DB 연동, Mock Mode 처리)
  const handleTogglePower = async () => {
    // 낙관적 업데이트 (UI 즉시 반영)
    const previousPower = device.power;
    const newPower = !previousPower;
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, power: newPower } : d))
    );

    // light 타입 디바이스인 경우 /api/light_power에도 신호 전송
    if (device.type === "light" || device.type === "manager") {
      try {
        await fetch("/api/light_power", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ power: newPower ? "on" : "off" }),
        }).catch((error) => {
          console.error("[Light Power] Failed to update light power:", error);
          // 에러가 발생해도 계속 진행 (비동기 처리)
        });
      } catch (error) {
        console.error("[Light Power] Error updating light power:", error);
        // 에러가 발생해도 계속 진행 (비동기 처리)
      }
    }

    try {
      const response = await fetch(`/api/devices/${device.id}/power`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ power: newPower }),
      });

      if (!response.ok) {
        // Mock Mode일 가능성 체크 (401/403/500 에러는 Mock Mode로 간주)
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Failed to toggle power";
        
        // Mock Mode 에러 패턴 체크: DB 연결 실패, 인증 실패 등
        if (
          response.status === 500 ||
          response.status === 401 ||
          response.status === 403 ||
          errorMessage.includes("필수 입력") ||
          errorMessage.includes("데이터베이스") ||
          errorMessage.includes("database")
        ) {
          // Mock Mode: 로컬 상태만 업데이트 (이미 낙관적 업데이트로 변경됨)
          console.log("[Mock Mode] Power toggle: 로컬 상태만 업데이트");
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // 백엔드에서 받은 실제 디바이스 상태로 업데이트
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? data.device : d))
      );
    } catch (error) {
      console.error("Error toggling power:", error);
      // Mock Mode: 네트워크 에러나 기타 에러 시 로컬 상태 유지 (이미 변경됨)
      // 롤백하지 않고 그대로 유지 (Mock Mode로 간주)
      console.log("[Mock Mode] Power toggle: 에러 무시하고 로컬 상태 유지");
    }
  };

  // 디바이스 이름 변경 (DB 연동)
  const handleUpdateName = async (newName: string) => {
    // 낙관적 업데이트
    const previousName = device.name;
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, name: newName } : d))
    );

    try {
      const response = await fetch(`/api/devices/${device.id}/name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update device name");
      }

      const data = await response.json();
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? data.device : d))
      );
    } catch (error) {
      console.error("Error updating device name:", error);
      // 에러 발생 시 롤백
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, name: previousName } : d))
      );
      alert("디바이스 이름 변경에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 조명 컬러 변경 (로컬 상태만 업데이트)
  // TODO: 백엔드 API로 교체 필요 (현재 API 스펙에 없음)
  const handleUpdateLightColor = (color: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === device.id
          ? {
              ...d,
              output: { ...d.output, color },
            }
          : d
      )
    );
  };

  // 조명 밝기 변경 (로컬 상태만 업데이트)
  // TODO: 백엔드 API로 교체 필요 (현재 API 스펙에 없음)
  const handleUpdateLightBrightness = (brightness: number) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === device.id
          ? {
              ...d,
              output: { ...d.output, brightness },
            }
          : d
      )
    );
  };

  // 향 분사량 변경 (로컬 상태만 업데이트)
  // TODO: 백엔드 API로 교체 필요 (현재 API 스펙에 scent-level이 있지만 레거시)
  // 센트 분사 주기 API(/api/devices/:deviceId/scent-interval)는 구현되어 있음
  const handleUpdateScentLevel = (level: number) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === device.id
          ? {
              ...d,
              output: { ...d.output, scentLevel: level },
            }
          : d
      )
    );
  };

  return {
    handleDelete,
    handleTogglePower,
    handleUpdateName,
    handleUpdateLightColor,
    handleUpdateLightBrightness,
    handleUpdateScentLevel,
  };
}
