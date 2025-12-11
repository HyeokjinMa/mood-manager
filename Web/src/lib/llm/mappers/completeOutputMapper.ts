/**
 * CompleteSegmentOutput → MoodStreamSegment 매핑
 * 
 * Phase 3: 새로운 CompleteSegmentOutput 구조를 MoodStreamSegment로 변환
 */

import type { CompleteSegmentOutput } from "@/types/llm";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import type { MusicTrack } from "@/hooks/useMoodStream/types";
import { mapMusicIDToTrack } from "@/lib/music/mapMusicIDToTrack";
import { mapIconCategory } from "../validateResponse";
import { SCENT_DEFINITIONS } from "@/types/mood";
import type { ScentType } from "@/types/mood";
import { hexToRgb } from "@/lib/utils/color";

/**
 * CompleteSegmentOutput를 MoodStreamSegment로 변환
 * 
 * @param completeOutput - 검증된 CompleteSegmentOutput
 * @param timestamp - 세그먼트 시작 시간 (밀리초)
 * @returns MoodStreamSegment
 */
export async function mapCompleteOutputToMoodStreamSegment(
  completeOutput: CompleteSegmentOutput,
  timestamp: number
): Promise<MoodStreamSegment> {
  // musicID로 음악 트랙 매핑 (LLM 응답의 fadeIn/fadeOut 전달)
  const musicTracks = await mapMusicIDToTrack(
    completeOutput.music.musicID,
    completeOutput.music.fadeIn,
    completeOutput.music.fadeOut
  );
  
  if (musicTracks.length === 0) {
    throw new Error(`No music track found for musicID: ${completeOutput.music.musicID}`);
  }
  
  const primaryTrack = musicTracks[0];
  
  // genre 정보 가져오기
  const { getMusicTrackByID } = await import("@/lib/music/getMusicTrackByID");
  const trackData = await getMusicTrackByID(completeOutput.music.musicID);
  const genre = trackData?.genre || "Unknown";
  
  // 첫 번째 아이콘을 backgroundIcon으로 매핑
  const primaryIcon = completeOutput.background.icons[0] || "leaf_gentle";
  const mappedIcon = mapIconCategory(primaryIcon);
  
  return {
    timestamp,
    duration: primaryTrack.duration, // 실제 MP3 길이
    mood: {
      id: `mood-${timestamp}`, // 임시 ID
      name: completeOutput.moodAlias,
      color: completeOutput.moodColor,
      music: {
        genre: genre,
        title: primaryTrack.title,
      },
      scent: {
        type: completeOutput.scent.type,
        name: completeOutput.scent.name || (() => {
          // scent.name이 없으면 SCENT_DEFINITIONS에서 기본값 선택
          const scentType = completeOutput.scent.type as ScentType;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const definitions = (SCENT_DEFINITIONS as Record<string, any>)[scentType] as Array<{ name: string }> | undefined;
          return definitions && definitions.length > 0 ? definitions[0].name : "Default";
        })(),
      },
      lighting: {
        color: completeOutput.moodColor,
        // lighting.rgb가 없으면 moodColor에서 변환 (스키마에서 rgb 제거됨)
        rgb: completeOutput.lighting.rgb || hexToRgb(completeOutput.moodColor),
      },
    },
    musicTracks: musicTracks.map(track => ({
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      startOffset: 0,
      fadeIn: completeOutput.music.fadeIn,
      fadeOut: completeOutput.music.fadeOut,
      fileUrl: track.fileUrl,
      albumImageUrl: track.albumImageUrl,
    })),
    backgroundIcon: {
      name: mappedIcon.name,
      category: mappedIcon.category,
    },
    backgroundIcons: completeOutput.background.icons,
    backgroundWind: completeOutput.background.wind,
    animationSpeed: completeOutput.background.animation.speed,
    iconOpacity: completeOutput.background.animation.iconOpacity,
  };
}

/**
 * 여러 CompleteSegmentOutput을 MoodStreamSegment 배열로 변환
 * 
 * @param completeOutputs - 검증된 CompleteSegmentOutput 배열
 * @param startTimestamp - 첫 번째 세그먼트 시작 시간 (밀리초)
 * @returns MoodStreamSegment 배열
 */
export async function mapCompleteOutputsToMoodStreamSegments(
  completeOutputs: CompleteSegmentOutput[],
  startTimestamp: number = Date.now()
): Promise<MoodStreamSegment[]> {
  const segments: MoodStreamSegment[] = [];
  let currentTimestamp = startTimestamp;
  
  for (const output of completeOutputs) {
    const segment = await mapCompleteOutputToMoodStreamSegment(output, currentTimestamp);
    segments.push(segment);
    
    // 다음 세그먼트 시작 시간 = 현재 세그먼트 시작 시간 + 현재 세그먼트 길이
    currentTimestamp += segment.duration;
  }
  
  return segments;
}

/**
 * CompleteSegmentOutput에서 출력 디바이스 제어 데이터 생성
 * 
 * @param completeOutput - 검증된 CompleteSegmentOutput
 * @param musicTrack - 매핑된 음악 트랙 (선택적)
 * @returns 출력 디바이스 제어 데이터
 */
export function generateDeviceOutputFromCompleteOutput(
  completeOutput: CompleteSegmentOutput,
  musicTrack?: MusicTrack
): {
  lighting: { color: string; brightness: number; temperature: number };
  scent: { scentType: string; scentLevel: number; scentInterval: number };
  speaker: { volume: number; nowPlaying: string };
} {
  return {
    lighting: {
      color: completeOutput.moodColor,
      brightness: completeOutput.lighting.brightness,
      temperature: completeOutput.lighting.temperature,
    },
    scent: {
      scentType: completeOutput.scent.type,
      scentLevel: completeOutput.scent.level,
      scentInterval: completeOutput.scent.interval,
    },
    speaker: {
      volume: completeOutput.music.volume ?? 70, // 기본값 70 사용
      nowPlaying: musicTrack?.title || "Unknown",
    },
  };
}

