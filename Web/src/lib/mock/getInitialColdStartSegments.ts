/**
 * 초기 콜드스타트용 완벽한 캐롤 세그먼트 3개 (완전 하드코딩)
 * 
 * DB 조회 없이 완전히 하드코딩된 3개 세그먼트를 반환합니다.
 * 누가 와도 언제나 똑같은 3개가 재생됩니다.
 * 모든 값이 미리 정해져 있습니다: 무드알리아스, 아이콘, 풍향, 풍속, 노래 등
 */

import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import { hexToRgb } from "@/lib/utils";

/**
 * 완전히 하드코딩된 캐롤 초기 세그먼트 3개 반환
 * DB 조회 없이 즉시 반환 (동기 함수)
 */
export function getInitialColdStartSegments(): MoodStreamSegment[] {
  const now = Date.now();

  // 완전히 하드코딩된 3개 세그먼트 정의 (실제 musicTracks.json 값 사용)
  // musicID 60, 61, 62 사용 (첫 3개 캐롤 음악)
  const hardcodedSegments: Array<{
    moodAlias: string;
    color: string;
    iconKeys: string[];
    scentType: "Woody" | "Spicy" | "Floral";
    scentName: string;
    musicTitle: string;
    musicArtist: string;
    musicFileUrl: string;
    musicAlbumImageUrl: string;
    musicDuration: number; // 밀리초 (실제 duration 값 사용)
    windDirection: number;
    windSpeed: number;
    animationSpeed: number;
    iconOpacity: number;
    brightness: number;
  }> = [
    {
      // musicID 60: "All I want for christmas" - Mariah Carey
      moodAlias: "Festive Christmas Vibes",
      color: "#DC143C", // 크리스마스 레드
      iconKeys: ["snowflake", "star", "gift", "bell", "candle", "tree"],
      scentType: "Woody",
      scentName: "Wood", // SCENT_DEFINITIONS.Woody[0].name
      musicTitle: "All I want for christmas",
      musicArtist: "Mariah Carey",
      musicFileUrl: "/album/Carol/Carol_01.mp3", // 실제 파일 경로
      musicAlbumImageUrl: "/album/Carol/All I want for christmas.png", // 실제 이미지 경로
      musicDuration: 242000, // 실제 duration: 242초 (musicTracks.json)
      windDirection: 180,
      windSpeed: 3,
      animationSpeed: 4,
      iconOpacity: 0.7,
      brightness: 100,
    },
    {
      // musicID 61: "Because it's Christmas" - Sung Sikyung and others
      moodAlias: "Cozy Green Retreat",
      color: "#228B22", // 크리스마스 그린
      iconKeys: ["tree", "bell", "candle", "snowflake", "star", "gift"],
      scentType: "Spicy",
      scentName: "Cinnamon Stick", // SCENT_DEFINITIONS.Spicy[1].name
      musicTitle: "Because it's Christmas",
      musicArtist: "Sung Sikyung and others",
      musicFileUrl: "/album/Carol/Carol_02.mp3", // 실제 파일 경로
      musicAlbumImageUrl: "/album/Carol/Because it's Christmas.png", // 실제 이미지 경로
      musicDuration: 226000, // 실제 duration: 226초 (musicTracks.json)
      windDirection: 210,
      windSpeed: 4,
      animationSpeed: 5,
      iconOpacity: 0.8,
      brightness: 50,
    },
    {
      // musicID 62: "Jingle bell rock" - Bobby Helms
      moodAlias: "Golden Holiday Cheer",
      color: "#FFD700", // 골드
      iconKeys: ["star", "sparkles", "gift", "bell", "snowflake", "tree"],
      scentType: "Floral",
      scentName: "Rose", // SCENT_DEFINITIONS.Floral[0].name
      musicTitle: "Jingle bell rock",
      musicArtist: "Bobby Helms",
      musicFileUrl: "/album/Carol/Carol_03.mp3", // 실제 파일 경로
      musicAlbumImageUrl: "/album/Carol/Jingle bell rock.png", // 실제 이미지 경로
      musicDuration: 130000, // 실제 duration: 130초 (musicTracks.json)
      windDirection: 240,
      windSpeed: 5,
      animationSpeed: 6,
      iconOpacity: 0.9,
      brightness: 50,
    },
  ];

  const segments: MoodStreamSegment[] = [];

  for (let segIndex = 0; segIndex < 3; segIndex++) {
    const config = hardcodedSegments[segIndex];
    
    // 이전 세그먼트의 종료 시점 계산
    const prevEndTime = segIndex > 0 
      ? segments[segIndex - 1].timestamp + segments[segIndex - 1].duration
      : now;

    const musicTrack = {
      title: config.musicTitle,
      artist: config.musicArtist,
      duration: config.musicDuration,
      startOffset: 0,
      fadeIn: 750,
      fadeOut: 750,
      fileUrl: config.musicFileUrl,
      albumImageUrl: config.musicAlbumImageUrl,
    };

    segments.push({
      timestamp: prevEndTime,
      duration: config.musicDuration,
      mood: {
        id: `carol-segment-${segIndex}`,
        name: config.moodAlias,
        color: config.color,
        music: {
          genre: "Carol",
          title: config.musicTitle,
        },
        scent: {
          type: config.scentType,
          name: config.scentName,
        },
        lighting: {
          color: config.color,
          rgb: hexToRgb(config.color),
        },
      },
      musicTracks: [musicTrack],
      // backgroundParams 통합 (모든 값 하드코딩)
      backgroundParams: {
        moodAlias: config.moodAlias,
        musicSelection: config.musicTitle,
        moodColor: config.color,
        lighting: {
          brightness: config.brightness,
          temperature: 4000, // 기본 색온도
        },
        backgroundIcon: {
          name: "FaStar", // 첫 번째 아이콘을 기본으로
          category: "abstract",
        },
        iconKeys: config.iconKeys,
        backgroundWind: {
          direction: config.windDirection,
          speed: config.windSpeed,
        },
        animationSpeed: config.animationSpeed,
        iconOpacity: config.iconOpacity,
        source: "initial", // 초기 세그먼트임을 표시
      } as BackgroundParams,
      // 하위 호환성을 위해 기존 필드도 유지
      backgroundIcon: {
        name: "FaStar",
        category: "abstract",
      },
      backgroundIcons: config.iconKeys,
      backgroundWind: {
        direction: config.windDirection,
        speed: config.windSpeed,
      },
      animationSpeed: config.animationSpeed,
      iconOpacity: config.iconOpacity,
    });
  }

  console.log("[getInitialColdStartSegments] ✅ 완전히 하드코딩된 초기 3세그먼트 반환 (DB 조회 없음)");
  return segments;
}



