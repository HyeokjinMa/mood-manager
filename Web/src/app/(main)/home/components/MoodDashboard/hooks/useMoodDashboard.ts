// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts
// ======================================================

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Mood } from "@/types/mood";
import { MOODS } from "@/types/mood";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import { saveMood, deleteSavedMood, getSavedMoods, type SavedMood } from "@/lib/mock/savedMoodsStorage";
import { ADMIN_EMAIL } from "@/lib/auth/mockMode";

interface UseMoodDashboardProps {
  mood: Mood;
  onMoodChange: (mood: Mood) => void;
  onScentChange: (mood: Mood) => void;
  onSongChange: (mood: Mood) => void;
  currentSegment?: MoodStreamSegment | null;
}

/**
 * 무드 대시보드 상태 및 핸들러 관리 훅
 */
export function useMoodDashboard({
  mood,
  onMoodChange,
  onScentChange,
  onSongChange,
  currentSegment,
}: UseMoodDashboardProps) {
  const { data: session } = useSession();
  const isAdminMode = session?.user?.email === ADMIN_EMAIL;
  
  const [isLoading, setIsLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [progress] = useState(20);
  const [isSaved, setIsSaved] = useState(false); // 초기값: false (별표가 눌리지 않은 상태)
  const [moodDuration] = useState(30);
  const [preferenceCount, setPreferenceCount] = useState(0); // 현재 무드의 선호도 카운트 (0-3)
  const [maxReached, setMaxReached] = useState(false); // 최대 3번 도달 여부

  // 무드 저장 상태 확인 (현재는 항상 새 무드에서는 저장되지 않은 상태에서 시작)
  // 추후 실제 DB 연동 시, 이 로직을 다시 활성화할 수 있음.
  useEffect(() => {
    setIsSaved(false);
  }, [mood.id]);

  // 초기 로딩 시뮬레이션 (실제로는 API 호출 시 사용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 무드 변경 시 선호도 카운트 조회
  useEffect(() => {
    const fetchPreferenceCount = async () => {
      try {
        const response = await fetch("/api/moods/preference");
        if (response.ok) {
          const data = await response.json();
          const moodCount = data.moodPreferences?.[mood.id] || 0;
          setPreferenceCount(moodCount);
          setMaxReached(moodCount >= 3);
        }
      } catch (error) {
        console.error("Error fetching preference count:", error);
      }
    };
    fetchPreferenceCount();
  }, [mood.id]);

  // 선호도 클릭 핸들러 (더블클릭 시 호출)
  const handlePreferenceClick = async () => {
    if (maxReached || preferenceCount >= 3) {
      return;
    }

    try {
      // 현재 세그먼트에서 음악 장르 가져오기 (없으면 기본값)
      const musicGenre = currentSegment?.mood?.music?.genre || "newage";
      const scentType = mood.scent.type;

      const response = await fetch("/api/moods/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodId: mood.id,
          moodName: mood.name,
          musicGenre,
          scentType,
          moodColor: mood.color,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.maxReached) {
          setMaxReached(true);
          setPreferenceCount(3);
        }
        throw new Error(errorData.error || "Failed to update preference");
      }

      const data = await response.json();
      setPreferenceCount(data.currentCount);
      setMaxReached(data.maxReached);
    } catch (error) {
      console.error("Error updating preference:", error);
    }
  };

  // 현재 무드의 같은 이름을 가진 다른 무드들 찾기
  const getMoodsWithSameName = (moodName: string) => {
    return MOODS.filter((m) => m.name === moodName);
  };

  // 향 변경 (스프레이 아이콘 클릭)
  // - 1순위: 현재 세그먼트를 기반으로 LLM에 요청 (mode: "scent")
  // - 2순위: 실패 시 기존 목업 로직(MOODS 기반 순환) 사용
  const handleScentClick = async () => {
    // 1) LLM 기반 향/아이콘 재추천 (현재 세그먼트 기반)
    if (currentSegment) {
      try {
        const response = await fetch("/api/ai/background-params", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "scent",
            segment: currentSegment,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const nextScentType = data.scentType || mood.scent.type;

          // 기존 무드에 향 타입만 업데이트 (색상/이름은 그대로 유지)
          const updatedMood: Mood = {
            ...mood,
            scent: {
              ...mood.scent,
              type: nextScentType,
            },
          };

          onScentChange(updatedMood);
          return;
        }
      } catch (error) {
        console.error("Error updating scent via LLM:", error);
        // 아래 목업 로직으로 fallback
      }
    }

    // 2) [MOCK] 기존 로컬 무드 배열을 이용한 향 변경 (fallback)
    const sameNameMoods = getMoodsWithSameName(mood.name);
    
    // 같은 이름의 무드가 없거나 1개만 있으면 다른 무드로 변경하지 않음
    if (sameNameMoods.length <= 1) {
      console.warn("No alternative moods with same name found");
      return;
    }
    
    const currentIndex = sameNameMoods.findIndex((m) => m.id === mood.id);
    
    // 현재 무드를 찾지 못한 경우 첫 번째 무드 선택
    if (currentIndex === -1) {
      const nextMood = sameNameMoods[0];
      onScentChange(nextMood);
      return;
    }
    
    // 다음 인덱스 계산 (순환)
    const nextIndex = (currentIndex + 1) % sameNameMoods.length;
    const nextMood = sameNameMoods[nextIndex];
    
    // 다음 무드가 현재 무드와 다른 향을 가지고 있는지 확인
    if (nextMood.scent.name !== mood.scent.name || nextMood.scent.type !== mood.scent.type) {
      onScentChange(nextMood);
    } else {
      // 같은 향이면 그 다음 무드로 건너뛰기
      const skipIndex = (nextIndex + 1) % sameNameMoods.length;
      const skipMood = sameNameMoods[skipIndex];
      if (skipMood.scent.name !== mood.scent.name || skipMood.scent.type !== mood.scent.type) {
        onScentChange(skipMood);
      }
    }
  };

  // [MOCK] 음악 변경 (이전/다음 버튼)
  // TODO: 백엔드 API로 교체 필요
  // API 명세:
  // PUT /api/moods/current/song
  // - 인증: NextAuth session (쿠키 기반)
  // - 요청: { moodId: string } (같은 무드명의 다른 노래 버전)
  // - 응답: { mood: Mood, updatedDevices: Device[] }
  // - 설명: 노래 변경으로 인한 무드 업데이트 및 관련 디바이스 상태 업데이트
  // - 동작: 음악이 변경하면서 무드 듀레이션 내에서의 변경 (지속 시간 유지)
  const handlePreviousSong = () => {
    const sameNameMoods = getMoodsWithSameName(mood.name);
    const currentIndex = sameNameMoods.findIndex((m) => m.id === mood.id);
    const prevIndex = currentIndex === 0 ? sameNameMoods.length - 1 : currentIndex - 1;
    const prevMood = sameNameMoods[prevIndex];
    onSongChange(prevMood);
  };

  const handleNextSong = () => {
    const sameNameMoods = getMoodsWithSameName(mood.name);
    const currentIndex = sameNameMoods.findIndex((m) => m.id === mood.id);
    const nextIndex = (currentIndex + 1) % sameNameMoods.length;
    const nextMood = sameNameMoods[nextIndex];
    onSongChange(nextMood);
  };

  // [MOCK] 무드 새로고침 (새로고침 버튼)
  // TODO: 백엔드 API로 교체 필요
  // API 명세:
  // PUT /api/moods/current/refresh
  // - 인증: NextAuth session (쿠키 기반)
  // - 요청: { direction?: "prev" | "next" } (선택적: 이전/다음 무드 패턴으로 이동)
  // - 응답: { mood: Mood, updatedDevices: Device[], duration: number }
  // - 설명: 무드 듀레이션을 포함한 전체 변경. 무드 패턴 이동 (동일 클러스터 또는 이전/다음 패턴)
  // - 동작: 같은 무드 패턴 내에서 다른 조합(음악/향/조명) 선택 또는 무드 패턴 이동 (-1이면 0으로, 0이면 +1로)
  const handleRefreshClick = () => {
    // [MOCK] 목업 모드: 같은 이름의 무드 중 랜덤 선택 (무드 클러스터 내에서 변경)
    const sameNameMoods = getMoodsWithSameName(mood.name);
    if (sameNameMoods.length > 1) {
      // 같은 이름의 무드가 여러 개 있으면 그 중 랜덤 선택
      const filteredMoods = sameNameMoods.filter((m) => m.id !== mood.id);
      const randomMood = filteredMoods[Math.floor(Math.random() * filteredMoods.length)];
      onMoodChange(randomMood);
    } else {
      // 같은 이름의 무드가 1개만 있으면 전체 무드 중 랜덤 선택
      const allMoods = MOODS;
      const randomMood = allMoods[Math.floor(Math.random() * allMoods.length)];
      onMoodChange(randomMood);
    }
    
    // const refreshMood = async () => {
    //   try {
    //     const response = await fetch("/api/moods/current/refresh", {
    //       method: "PUT",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       credentials: "include",
    //       body: JSON.stringify({ extendDuration: false }), // false: 무드 변경, true: 지속 시간만 연장
    //     });
    //     if (!response.ok) throw new Error("Failed to refresh mood");
    //     const data = await response.json();
    //     onMoodChange(data.mood);
    //     if (data.duration) {
    //       setMoodDuration(data.duration); // 백엔드에서 계산된 지속 시간 업데이트
    //     }
    //   } catch (error) {
    //     console.error("Error refreshing mood:", error);
    //   }
    // };
    // refreshMood();
  };

  // 앨범 클릭: 같은 장르 내 다른 음악 + 풍향/풍속 재추천 (현재 세그먼트 한정)
  // - 1순위: LLM에 mode: "music"으로 요청
  // - 2순위: 실패 시 기존 목업 로직(랜덤 무드) 사용
  const handleAlbumClick = async () => {
    if (currentSegment) {
      try {
        const response = await fetch("/api/ai/background-params", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "music",
            segment: currentSegment,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const nextTitle: string = data.musicSelection || mood.song.title;

          const updatedMood: Mood = {
            ...mood,
            song: {
              ...mood.song,
              title: nextTitle,
            },
          };

          onSongChange(updatedMood);
          return;
        }
      } catch (error) {
        console.error("Error updating music via LLM:", error);
        // 아래 목업 로직으로 fallback
      }
    }

    // [MOCK] fallback: 랜덤 무드 선택
    const allMoods = MOODS;
    const randomMood = allMoods[Math.floor(Math.random() * allMoods.length)];
    onMoodChange(randomMood);
  };

  // 무드 저장/삭제 핸들러
  const handleSaveToggle = async () => {
    if (isSaved) {
      // 저장 취소 (무드셋에서 제거)
      try {
        if (isAdminMode) {
          // 관리자 모드: localStorage에서 삭제
          const savedMoods = getSavedMoods();
          const savedMood = savedMoods.find((saved) => saved.moodId === mood.id);
          if (savedMood) {
            deleteSavedMood(savedMood.id);
            setIsSaved(false);
          }
        } else {
          // 일반 모드: API 호출
          const response = await fetch("/api/moods/saved", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json() as { savedMoods?: Array<{ id: string; moodId: string }> };
            const savedMood = data.savedMoods?.find(
              (saved) => saved.moodId === mood.id
            );
            if (savedMood) {
              const deleteResponse = await fetch(
                `/api/moods/saved/${savedMood.id}`,
                { method: "DELETE", credentials: "include" }
              );
              if (deleteResponse.ok) {
                setIsSaved(false);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error removing saved mood:", error);
      }
    } else {
      // 무드 저장
      try {
        const musicGenre = currentSegment?.mood?.music?.genre || "newage";
        const savedMoodData: SavedMood = {
          id: `saved-${Date.now()}`,
          moodId: mood.id,
          moodName: mood.name,
          moodColor: mood.color,
          music: {
            genre: musicGenre,
            title: mood.song.title,
          },
          scent: {
            type: mood.scent.type,
            name: mood.scent.name,
          },
          preferenceCount,
          savedAt: Date.now(),
        };

        if (isAdminMode) {
          // 관리자 모드: localStorage에 저장하고 API 호출 스킵
          saveMood(savedMoodData);
          setIsSaved(true);
          return; // API 호출하지 않음 (목업 모드 최적화)
        }

        // 일반 모드: API 호출
        const response = await fetch("/api/moods/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            moodId: savedMoodData.moodId,
            moodName: savedMoodData.moodName,
            moodColor: savedMoodData.moodColor,
            music: savedMoodData.music,
            scent: savedMoodData.scent,
            preferenceCount: savedMoodData.preferenceCount,
          }),
        });
        if (response.ok) {
          setIsSaved(true);
        }
      } catch (error) {
        console.error("Error saving mood:", error);
      }
    }
  };

  return {
    isLoading,
    playing,
    setPlaying,
    progress,
    isSaved,
    setIsSaved: handleSaveToggle, // 저장/삭제 핸들러로 교체
    moodDuration,
    handleScentClick,
    handlePreviousSong,
    handleNextSong,
    handleRefreshClick,
    handleAlbumClick,
    handlePreferenceClick,
    preferenceCount,
    maxReached,
  };
}

