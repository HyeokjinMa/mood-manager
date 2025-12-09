// src/hooks/useDeviceSync.ts
/**
 * 디바이스 동기화 훅
 * 
 * LLM 배경 파라미터와 무드 변경을 디바이스에 반영
 */

import { useEffect, useRef } from "react";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";

interface UseDeviceSyncProps {
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  backgroundParams: BackgroundParams | null;
  currentMood: Mood | null;
  volume?: number; // 0-100 범위
}

/**
 * LLM 결과 및 무드 변경을 디바이스에 반영하는 훅
 */
export function useDeviceSync({
  setDevices,
  backgroundParams,
  currentMood,
  volume,
}: UseDeviceSyncProps) {
  // 무한 루프 방지: 이전 값 추적
  const prevMoodIdRef = useRef<string | null>(null);
  const prevBackgroundParamsRef = useRef<BackgroundParams | null>(null);
  const prevVolumeRef = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    // currentMood가 없으면 동기화하지 않음 (초기 더미 데이터 유지)
    // backgroundParams는 LLM 생성 세그먼트에만 있으므로, 초기 세그먼트는 currentMood만으로 동기화
    if (!currentMood) {
      return;
    }
    
    // 실제로 변경이 없으면 업데이트하지 않음 (무한 루프 방지)
    const moodId = currentMood.id;
    const backgroundParamsId = backgroundParams?.moodColor || null;
    const currentVolume = volume;
    
    if (
      prevMoodIdRef.current === moodId &&
      prevBackgroundParamsRef.current === backgroundParams &&
      prevVolumeRef.current === currentVolume
    ) {
      return; // 변경사항 없음
    }
    
    // 이전 값 업데이트
    prevMoodIdRef.current = moodId;
    prevBackgroundParamsRef.current = backgroundParams;
    prevVolumeRef.current = currentVolume;
    
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === "manager") {
          // Manager: 무드 색상, 향, 음악, 브라이트니스, 색온도 반영
          const moodColor = backgroundParams?.moodColor || currentMood.color || "#E6F3FF";
          const brightness = backgroundParams?.lighting?.brightness || d.output.brightness || 50;
          const temperature = backgroundParams?.lighting?.temperature; // LLM 생성 색온도
          
          return {
            ...d,
            output: {
              ...d.output,
              color: moodColor,
              brightness: brightness,
              temperature: temperature, // 조명 디바이스 색온도 (목업이지만 유의미한 연결)
              scentType: currentMood.scent.name || currentMood.scent.type || "Floral",
              nowPlaying: currentMood.song.title || "Unknown",
            },
          };
        }
        if (d.type === "light") {
          // Light: 브라이트니스, 색온도 반영 (manager와 동일한 brightness 사용)
          const brightness = backgroundParams?.lighting?.brightness || d.output.brightness || 50;
          const temperature = backgroundParams?.lighting?.temperature; // LLM 생성 색온도
          
          return {
            ...d,
            output: {
              ...d.output,
              color: currentMood.color, // 초기 세그먼트에서도 컬러 반영
              brightness: brightness,
              temperature: temperature, // 조명 디바이스 색온도 (목업이지만 유의미한 연결)
            },
          };
        }
        if (d.type === "scent") {
          // Scent: 향 타입 및 레벨 반영
          return {
            ...d,
            output: {
              ...d.output,
              scentType: currentMood.scent.name || currentMood.scent.type || "Floral",
              scentLevel: d.output.scentLevel || 5,
              scentInterval: d.output.scentInterval || 30,
            },
          };
        }
        if (d.type === "speaker") {
          // Speaker: 음악 제목 및 볼륨 반영
          return {
            ...d,
            output: {
              ...d.output,
              nowPlaying: currentMood.song.title || "Unknown",
              volume: volume !== undefined ? volume : (d.output.volume || 70),
            },
          };
        }
        return d;
      })
    );
  }, [backgroundParams, currentMood, volume, setDevices]);
}

