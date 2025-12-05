// src/lib/mock/mockData.ts
/**
 * 목업 데이터 및 테스트 사용자 처리
 * 
 * DB 연결 실패 시 또는 테스트 사용자일 경우 기본값 반환
 * UI FLOW 확인을 위해 목업 데이터 제공
 */

import type { Device } from "@/types/device";
import { MOODS } from "@/types/mood";
import { hexToRgb } from "@/lib/utils";

/**
 * 테스트 사용자 ID (DB에 없을 경우 사용)
 */
export const TEST_USER_ID = "testUser";

/**
 * DB 연결 실패 여부 확인
 */
export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL !== "";
}

/**
 * 테스트 사용자 여부 확인
 */
export function isTestUser(userId: string): boolean {
  return userId === TEST_USER_ID || !userId || userId.startsWith("test");
}

/**
 * 목업 디바이스 목록 반환
 */
export function getMockDevices(): Device[] {
  const defaultMood = MOODS[0];
  
  return [
    {
      id: "mock-manager-1",
      type: "manager",
      name: "Mood Manager",
      battery: 100,
      power: true,
      output: {
        brightness: 80,
        color: defaultMood.color,
        temperature: 4000,
        scentType: defaultMood.scent.name,
        scentLevel: 7,
        scentInterval: 30,
        volume: 65,
        nowPlaying: defaultMood.song.title,
      },
    },
    {
      id: "mock-light-1",
      type: "light",
      name: "Smart Light 1",
      battery: 85,
      power: true,
      output: {
        brightness: 70,
        color: defaultMood.color,
        temperature: 4000,
      },
    },
    {
      id: "mock-light-2",
      type: "light",
      name: "Smart Light 2",
      battery: 80,
      power: true,
      output: {
        brightness: 65,
        color: defaultMood.color,
        temperature: 4000,
      },
    },
    {
      id: "mock-scent-1",
      type: "scent",
      name: "Smart Diffuser 1",
      battery: 90,
      power: true,
      output: {
        scentType: defaultMood.scent.name,
        scentLevel: 5,
        scentInterval: 30,
      },
    },
    {
      id: "mock-speaker-1",
      type: "speaker",
      name: "Smart Speaker 1",
      battery: 75,
      power: true,
      output: {
        volume: 60,
        nowPlaying: defaultMood.song.title,
      },
    },
  ];
}

/**
 * 목업 무드스트림 반환 (10세그 구조)
 * 
 * 10개 세그먼트, 각 세그먼트는 3곡의 자연스러운 흐름
 * 다양성을 위해 무드를 랜덤하게 선택하되, 전체 스트림에서 다양한 무드가 나타나도록 함
 */
export function getMockMoodStream() {
  const now = Date.now();
  
  // 다양성을 위해 무드 인덱스를 랜덤하게 선택 (하지만 전체 스트림에서 다양한 무드가 나타나도록)
  // 시간 기반 시드로 매번 다른 스트림 생성
  const timeSeed = Math.floor(now / (1000 * 60 * 10)); // 10분마다 변경
  const baseIndex = timeSeed % MOODS.length;
  
  // 현재 무드는 baseIndex를 사용하되, 스트림은 다양한 무드를 포함
  const currentMood = MOODS[baseIndex];
  
  // 10개 세그먼트 생성 (각 세그먼트는 3곡)
  const moodStream = Array.from({ length: 10 }, (_, segmentIndex) => {
    // 순환하면서 약간의 랜덤 오프셋 추가 (다양성 확보)
    const moodIndex = (baseIndex + segmentIndex + Math.floor(Math.random() * 3)) % MOODS.length;
    const mood = MOODS[moodIndex];
    
    // 각 세그먼트에 3곡 생성
    // 실제 노래 길이는 MOODS의 song.duration 사용 (초 단위)
    const trackDurations = [
      (mood.song.duration || 180) * 1000, // 밀리초 변환
      ((mood.song.duration || 180) + Math.floor(Math.random() * 40 - 20)) * 1000, // 약간의 변동
      ((mood.song.duration || 180) + Math.floor(Math.random() * 40 - 20)) * 1000,
    ];
    
    // 세그먼트 시작 시간 계산 (이전 세그먼트들의 총 길이)
    let segmentStartTime = now;
    for (let i = 0; i < segmentIndex; i++) {
      // 이전 세그먼트들의 총 길이 합산 (대략 10분씩)
      segmentStartTime += 10 * 60 * 1000; // 대략 10분
    }
    
    // 각 트랙의 시작 오프셋 계산
    let currentOffset = 0;
    const musicTracks = trackDurations.map((duration, trackIndex) => {
      const track = {
        title: `${mood.song.title} ${trackIndex === 0 ? '' : `Part ${trackIndex + 1}`}`,
        artist: "Mood Manager",
        duration: duration,
        startOffset: currentOffset,
        fadeIn: 750, // 0.75초 페이드인
        fadeOut: 750, // 0.75초 페이드아웃
        fileUrl: `/music/newage/${mood.song.title}(Mood Manager)_newage.mp3`, // Mock 파일 URL
      };
      currentOffset += duration;
      return track;
    });
    
    // 세그먼트 총 길이 (3곡의 실제 총 길이)
    const segmentDuration = currentOffset;
    
    return {
      timestamp: segmentStartTime,
      duration: segmentDuration,
      mood: {
        id: mood.id,
        name: mood.name,
        color: mood.color,
        music: {
          genre: "newage",
          title: musicTracks[0].title, // 첫 번째 노래 제목 (하위 호환성)
        },
        scent: {
          type: mood.scent.type,
          name: mood.scent.name,
        },
        lighting: {
          color: mood.color,
          rgb: hexToRgb(mood.color),
        },
      },
      musicTracks: musicTracks, // 3개 노래
    };
  });

  return {
    streamId: `mock-stream-${Date.now()}`,
    currentMood: {
      id: currentMood.id,
      name: currentMood.name,
      color: currentMood.color,
      music: {
        genre: "newage",
        title: currentMood.song.title,
      },
      scent: {
        type: currentMood.scent.type,
        name: currentMood.scent.name,
      },
      lighting: {
        color: currentMood.color,
        rgb: hexToRgb(currentMood.color),
      },
    },
    segments: moodStream,
    createdAt: now,
    userDataCount: 0, // 테스트 사용자는 데이터 없음
  };
}

/**
 * 초기 콜드스타트용 1개 세그먼트 즉시 반환 (동기 버전 - 하위 호환성)
 * 
 * @deprecated getInitialColdStartSegments()를 사용하세요
 */
export function getInitialColdStartSegment() {
  const now = Date.now();
  
  // Fallback: 기본 캐롤 세그먼트 1개 반환
  const fallbackTrack = {
    title: "All I want for christmas",
    artist: "Mariah Carey",
    fileUrl: "/musics/Carol/All I want for christmas(Mariah Carey).mp3",
    albumImageUrl: "/musics_img/Carol/All I want for christmas.png",
  };

  const duration = 180 * 1000; // 3분
  const musicTracks = [{
    title: fallbackTrack.title,
    artist: fallbackTrack.artist,
    duration,
    startOffset: 0,
    fadeIn: 750,
    fadeOut: 750,
    fileUrl: fallbackTrack.fileUrl,
    albumImageUrl: fallbackTrack.albumImageUrl,
  }];
  
  return {
    timestamp: now,
    duration,
    mood: {
      id: "carol-segment-0",
      name: "Christmas Joy",
      color: "#C41E3A", // 크리스마스 레드
      music: {
        genre: "Carol",
        title: musicTracks[0].title,
      },
      scent: {
        type: "Woody",
        name: "Pine",
      },
      lighting: {
        color: "#C41E3A",
        rgb: hexToRgb("#C41E3A"),
      },
    },
    musicTracks,
  };
}

/**
 * 목업 전처리 데이터 반환
 */
export function getMockPreprocessingData() {
  return {
    average_stress_index: 45,
    recent_stress_index: 50,
    latest_sleep_score: 75,
    latest_sleep_duration: 420,
    weather: {
      temperature: 20,
      humidity: 60,
      rainType: 0,
      sky: 1,
    },
    emotionEvents: {
      laughter: [Date.now() - 3600000, Date.now() - 1800000],
      sigh: [Date.now() - 7200000],
      anger: [],
      sadness: [],
      neutral: [],
    },
  };
}

