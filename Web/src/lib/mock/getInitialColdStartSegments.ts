/**
 * 초기 콜드스타트용 완벽한 캐롤 세그먼트 3개 생성
 * 
 * DB에서 실제 캐롤 음악을 가져와서 완벽한 초기 세그먼트 생성
 */

import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import { hexToRgb } from "@/lib/utils";
import { getMusicTracksByGenre } from "@/lib/music/getMusicTrackByID";
import { SCENT_DEFINITIONS } from "@/types/mood";

/**
 * 새로운 JSON 구조에서 캐롤 장르 음악 가져오기 (musicID 60-69)
 */
async function getCarolSongs() {
  try {
    // 새로운 JSON 구조에서 Carol 장르 트랙 가져오기 (musicID 60-69)
    const { getMusicTracksByGenre } = await import("@/lib/music/getMusicTrackByID");
    const carolTracks = await getMusicTracksByGenre("Carol");
    
    if (carolTracks.length === 0) {
      console.warn("[getInitialColdStartSegments] Carol tracks not found");
      return [];
    }

    // 처음 3개만 선택 (musicID 60, 61, 62)
    return carolTracks.slice(0, 3);
  } catch (error) {
    console.error("[getCarolSongs] 에러:", error);
    return [];
  }
}

/**
 * 완벽한 캐롤 초기 세그먼트 3개 생성
 */
export async function getInitialColdStartSegments(): Promise<MoodStreamSegment[]> {
  const now = Date.now();
  const carolSongs = await getCarolSongs();

  if (carolSongs.length === 0) {
    console.warn("[getInitialColdStartSegments] 캐롤 음악이 없어 기본 세그먼트 반환");
    return getFallbackSegments(now);
  }

  // 3곡을 3세그먼트로 나누기 (각 세그먼트당 1곡)
  const segments: MoodStreamSegment[] = [];

  for (let segIndex = 0; segIndex < 3; segIndex++) {
    const track = carolSongs[segIndex];
    
    if (!track) break;

    // 새로운 JSON 구조에서 직접 정보 사용
    const duration = track.duration * 1000; // 초 → 밀리초
    
    const musicTrack = {
      title: track.title,
      artist: track.artist,
      duration, // 실제 MP3 길이
      startOffset: 0, // 단일 노래이므로 0
      fadeIn: 750,
      fadeOut: 750,
      fileUrl: track.mp3Url, // JSON에서 직접 가져오기
      albumImageUrl: track.imageUrl, // JSON에서 직접 가져오기
    };

    // 캐롤 분위기에 맞는 색상, 아이콘, 향 (크리스마스 느낌)
    const carolConfigs = [
      {
        color: "#DC143C", // 크리스마스 레드 (더 진한 레드)
        iconKeys: ["snowflake", "star", "gift", "bell", "candle", "tree"],
        moodAlias: "Christmas Red",
        scent: {
          type: "Woody" as const,
          name: "Wood", // SCENT_DEFINITIONS.Woody[0]의 name
        },
      },
      {
        color: "#228B22", // 크리스마스 그린
        iconKeys: ["tree", "bell", "candle", "snowflake", "star", "gift"],
        moodAlias: "Christmas Green",
        scent: {
          type: "Spicy" as const,
          name: "Cinnamon Stick",
        },
      },
      {
        color: "#FFD700", // 골드
        iconKeys: ["star", "sparkles", "gift", "bell", "snowflake", "tree"],
        moodAlias: "Christmas Gold",
        scent: {
          type: "Floral" as const,
          name: SCENT_DEFINITIONS.Floral[0].name,
        },
      },
    ];
    const config = carolConfigs[segIndex % carolConfigs.length];

    // 이전 세그먼트의 종료 시점 계산
    const prevEndTime = segIndex > 0 
      ? segments[segIndex - 1].timestamp + segments[segIndex - 1].duration
      : now;

    segments.push({
      timestamp: prevEndTime,
      duration: duration,
      mood: {
        id: `carol-segment-${segIndex}`,
        name: config.moodAlias,
        color: config.color,
        music: {
          genre: "Carol",
          title: musicTrack.title,
        },
        scent: config.scent,
        lighting: {
          color: config.color,
          rgb: hexToRgb(config.color),
        },
      },
      musicTracks: [musicTrack],
      backgroundIcon: {
        name: "FaStar", // 첫 번째 아이콘을 기본으로
        category: "abstract",
      },
      backgroundIcons: config.iconKeys, // 크리스마스 아이콘들
      backgroundWind: {
        direction: 180 + (segIndex * 30), // 각 세그먼트마다 약간씩 다른 방향
        speed: 3 + segIndex, // 3, 4, 5
      },
      animationSpeed: 4 + segIndex, // 4, 5, 6
      iconOpacity: 0.7 + (segIndex * 0.1), // 0.7, 0.8, 0.9
    });
  }

  return segments;
}

/**
 * Fallback: DB 조회 실패 시 기본 세그먼트 반환
 */
function getFallbackSegments(now: number): MoodStreamSegment[] {
  const fallbackTracks = [
    {
      title: "All I want for christmas",
      artist: "Mariah Carey",
      fileUrl: "/musics/Carol/All I want for christmas(Mariah Carey).mp3",
      albumImageUrl: "/musics_img/Carol/All I want for christmas.png",
    },
    {
      title: "Last Christmas",
      artist: "Wham!",
      fileUrl: "/musics/Carol/Last Christmas(Wham!).mp3",
      albumImageUrl: "/musics_img/Carol/Last Christmas.png",
    },
    {
      title: "Jingle bell rock",
      artist: "Bobby Helms",
      fileUrl: "/musics/Carol/Jingle bell rock(Bobby Helms).mp3",
      albumImageUrl: "/musics_img/Carol/Jingle bell rock.png",
    },
  ];

  const segments: MoodStreamSegment[] = [];

  for (let segIndex = 0; segIndex < 3; segIndex++) {
    const track = fallbackTracks[segIndex];
    if (!track) break;

    // 실제 MP3 길이는 DB에 없으므로 기본값 180초 (3분) 사용
    // 실제로는 DB에서 가져온 duration을 사용해야 함
    const duration = 180 * 1000; // 3분 (밀리초)

    const musicTrack = {
      title: track.title,
      artist: track.artist,
      duration, // 실제 MP3 길이
      startOffset: 0, // 단일 노래이므로 0
      fadeIn: 750,
      fadeOut: 750,
      fileUrl: track.fileUrl,
      albumImageUrl: track.albumImageUrl,
    };

    // 캐롤 분위기에 맞는 색상, 아이콘, 향 (크리스마스 느낌)
    const carolConfigs = [
      {
        color: "#DC143C", // 크리스마스 레드 (더 진한 레드)
        iconKeys: ["snowflake", "star", "gift", "bell", "candle", "tree"],
        moodAlias: "Christmas Red",
        scent: {
          type: "Woody" as const,
          name: "Wood", // SCENT_DEFINITIONS.Woody[0]의 name
        },
      },
      {
        color: "#228B22", // 크리스마스 그린
        iconKeys: ["tree", "bell", "candle", "snowflake", "star", "gift"],
        moodAlias: "Christmas Green",
        scent: {
          type: "Spicy" as const,
          name: "Cinnamon Stick",
        },
      },
      {
        color: "#FFD700", // 골드
        iconKeys: ["star", "sparkles", "gift", "bell", "snowflake", "tree"],
        moodAlias: "Christmas Gold",
        scent: {
          type: "Floral" as const,
          name: SCENT_DEFINITIONS.Floral[0].name,
        },
      },
    ];
    const config = carolConfigs[segIndex % carolConfigs.length];

    // 이전 세그먼트의 종료 시점 계산
    const prevEndTime = segIndex > 0 
      ? segments[segIndex - 1].timestamp + segments[segIndex - 1].duration
      : now;

    segments.push({
      timestamp: prevEndTime,
      duration: duration,
      mood: {
        id: `carol-segment-${segIndex}`,
        name: config.moodAlias,
        color: config.color,
        music: {
          genre: "Carol",
          title: musicTrack.title,
        },
        scent: config.scent,
        lighting: {
          color: config.color,
          rgb: hexToRgb(config.color),
        },
      },
      musicTracks: [musicTrack],
      backgroundIcon: {
        name: "FaStar",
        category: "abstract",
      },
      backgroundIcons: config.iconKeys,
      backgroundWind: {
        direction: 180 + (segIndex * 30),
        speed: 3 + segIndex,
      },
      animationSpeed: 4 + segIndex,
      iconOpacity: 0.7 + (segIndex * 0.1),
    });
  }

  return segments;
}



