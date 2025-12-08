/**
 * useDevicePreferences Hook
 * 
 * 디바이스 설정 저장/불러오기 훅
 * - 별표 버튼 클릭 시 마지막 설정 저장
 * - 앱 시작 시 저장된 설정 불러오기
 * - localStorage 사용 (나중에 DB 연동 가능)
 */

import { useState, useEffect, useCallback } from "react";

export interface DevicePreferences {
  volume?: number; // 0-100
  brightness?: number; // 0-100
  color?: string; // HEX color
  scentType?: string;
  scentLevel?: number; // 1-10
  savedAt?: string; // ISO timestamp
}

const STORAGE_KEY = "device_preferences";

/**
 * 디바이스 설정 저장/불러오기 훅
 */
export function useDevicePreferences() {
  const [preferences, setPreferences] = useState<DevicePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // DB에서 설정 불러오기 (localStorage는 폴백)
  const loadPreferences = useCallback(async () => {
    try {
      // 먼저 DB에서 불러오기 시도
      try {
        const response = await fetch("/api/device/preferences");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.preferences) {
            setPreferences(result.preferences);
            // localStorage에도 동기화
            localStorage.setItem(STORAGE_KEY, JSON.stringify(result.preferences));
            return result.preferences;
          }
        }
      } catch (apiError) {
        console.warn("[useDevicePreferences] API load failed, trying localStorage:", apiError);
      }

      // DB 실패 시 localStorage에서 불러오기
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DevicePreferences;
        setPreferences(parsed);
        return parsed;
      }
    } catch (error) {
      console.error("[useDevicePreferences] Failed to load preferences:", error);
    }
    return null;
  }, []);

  // DB에 설정 저장 (localStorage는 백업용)
  const savePreferences = useCallback(
    async (newPreferences: DevicePreferences) => {
      try {
        const preferencesToSave: DevicePreferences = {
          ...newPreferences,
          savedAt: new Date().toISOString(),
        };
        
        // localStorage 백업 (오프라인 대비)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencesToSave));

        // DB에 저장 (API 호출)
        try {
          const response = await fetch("/api/device/preferences", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newPreferences),
          });
          
          if (!response.ok) {
            throw new Error("API save failed");
          }
          
          const result = await response.json();
          if (result.success) {
            setPreferences(preferencesToSave);
            return true;
          }
        } catch (apiError) {
          console.warn("[useDevicePreferences] API save failed, using localStorage only:", apiError);
          // API 실패 시에도 localStorage는 저장되었으므로 성공으로 처리
          setPreferences(preferencesToSave);
          return true;
        }

        return true;
      } catch (error) {
        console.error("[useDevicePreferences] Failed to save preferences:", error);
        return false;
      }
    },
    []
  );

  // 설정 업데이트 (기존 설정에 병합)
  const updatePreferences = useCallback(
    async (updates: Partial<DevicePreferences>) => {
      const current = preferences || loadPreferences();
      const merged = {
        ...current,
        ...updates,
      };
      return await savePreferences(merged);
    },
    [preferences, loadPreferences, savePreferences]
  );

  // 초기 로드
  useEffect(() => {
    setIsLoading(true);
    loadPreferences().finally(() => {
      setIsLoading(false);
    });
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    savePreferences,
    updatePreferences,
    loadPreferences,
  };
}

