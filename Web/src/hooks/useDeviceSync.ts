// src/hooks/useDeviceSync.ts
/**
 * 디바이스 동기화 훅
 * 
 * LLM 배경 파라미터와 무드 변경을 디바이스에 반영
 */

import { useEffect } from "react";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";

interface UseDeviceSyncProps {
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  backgroundParams: BackgroundParams | null;
  currentMood: Mood;
}

/**
 * LLM 결과 및 무드 변경을 디바이스에 반영하는 훅
 */
export function useDeviceSync({
  setDevices,
  backgroundParams,
  currentMood,
}: UseDeviceSyncProps) {
  useEffect(() => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === "manager") {
          // Manager: 무드 색상, 향, 음악, 브라이트니스, 색온도 반영
          const moodColor = backgroundParams?.moodColor || currentMood.color;
          const brightness = backgroundParams?.lighting.brightness || d.output.brightness || 80;
          const temperature = backgroundParams?.lighting.temperature; // LLM 생성 색온도
          
          return {
            ...d,
            output: {
              ...d.output,
              color: moodColor,
              brightness: brightness,
              temperature: temperature, // 조명 디바이스 색온도 (목업이지만 유의미한 연결)
              scentType: currentMood.scent.name,
              nowPlaying: currentMood.song.title,
            },
          };
        }
        if (d.type === "light") {
          // Light: 브라이트니스, 색온도 반영 (컬러 변경 제거)
          const brightness = backgroundParams?.lighting.brightness || d.output.brightness || 70;
          const temperature = backgroundParams?.lighting.temperature; // LLM 생성 색온도
          
          return {
            ...d,
            output: {
              ...d.output,
              brightness: brightness,
              temperature: temperature, // 조명 디바이스 색온도 (목업이지만 유의미한 연결)
              // color는 변경하지 않음 (기존 색상 유지)
            },
          };
        }
        if (d.type === "scent") {
          // Scent: 향 타입 및 레벨 반영
          return {
            ...d,
            output: {
              ...d.output,
              scentType: currentMood.scent.name,
              scentLevel: d.output.scentLevel || 7,
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
              nowPlaying: currentMood.song.title,
              volume: d.output.volume || 60,
            },
          };
        }
        return d;
      })
    );
  }, [backgroundParams, currentMood, setDevices]);
}

