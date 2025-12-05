import { useState } from "react";
import type { Mood } from "@/types/mood";
import type { Device } from "@/types/device";

/**
 * 무드 관리 커스텀 훅
 * 
 * [MOCK] 목업 모드로 동작
 * TODO: 백엔드 API로 교체 필요
 */
export function useMood(initialMood: Mood | null, setDevices: React.Dispatch<React.SetStateAction<Device[]>>) {
  const [currentMood, setCurrentMood] = useState<Mood | null>(initialMood);

  // [MOCK] 센트 변경 (로컬 상태만 업데이트)
  // TODO: 백엔드 API로 교체 필요
  // API 명세:
  // PUT /api/moods/current/scent
  // - 인증: NextAuth session (쿠키 기반)
  // - 요청: { moodId: string } (같은 무드명의 다른 센트 버전)
  // - 응답: { mood: Mood, updatedDevices: Device[] }
  // - 설명: 센트 변경으로 인한 무드 업데이트 및 관련 디바이스 상태 업데이트
  const handleScentChange = (newMood: Mood) => {
    setCurrentMood(newMood);
    setDevices((prev) =>
      prev.map((d) =>
        d.type === "manager"
          ? {
              ...d,
              output: {
                ...d.output,
                color: newMood.color,
                scentType: newMood.scent.name,
                nowPlaying: newMood.song.title,
              },
            }
          : d
      )
    );
    // const updateScent = async () => {
    //   try {
    //     const response = await fetch("/api/moods/current/scent", {
    //       method: "PUT",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       credentials: "include",
    //       body: JSON.stringify({ moodId: newMood.id }),
    //     });
    //     if (!response.ok) throw new Error("Failed to update scent");
    //     const data = await response.json();
    //     setCurrentMood(data.mood);
    //     setDevices(data.updatedDevices);
    //   } catch (error) {
    //     console.error("Error updating scent:", error);
    //   }
    // };
    // updateScent();
  };

  // [MOCK] 노래 변경 (로컬 상태만 업데이트)
  // TODO: 백엔드 API로 교체 필요
  // API 명세:
  // PUT /api/moods/current/song
  // - 인증: NextAuth session (쿠키 기반)
  // - 요청: { moodId: string } (같은 무드명의 다른 노래 버전)
  // - 응답: { mood: Mood, updatedDevices: Device[] }
  // - 설명: 노래 변경으로 인한 무드 업데이트 및 관련 디바이스 상태 업데이트
  const handleSongChange = (newMood: Mood) => {
    setCurrentMood(newMood);
    setDevices((prev) =>
      prev.map((d) =>
        d.type === "manager"
          ? {
              ...d,
              output: {
                ...d.output,
                color: newMood.color,
                scentType: newMood.scent.name,
                nowPlaying: newMood.song.title,
              },
            }
          : d
      )
    );
    // const updateSong = async () => {
    //   try {
    //     const response = await fetch("/api/moods/current/song", {
    //       method: "PUT",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       credentials: "include",
    //       body: JSON.stringify({ moodId: newMood.id }),
    //     });
    //     if (!response.ok) throw new Error("Failed to update song");
    //     const data = await response.json();
    //     setCurrentMood(data.mood);
    //     setDevices(data.updatedDevices);
    //   } catch (error) {
    //     console.error("Error updating song:", error);
    //   }
    // };
    // updateSong();
  };

  return {
    currentMood,
    setCurrentMood,
    handleScentChange,
    handleSongChange,
  };
}

