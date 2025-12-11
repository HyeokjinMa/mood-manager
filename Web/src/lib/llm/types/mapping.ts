/**
 * CompleteSegmentOutput와 기존 타입 간의 매핑 관계 정의
 * 
 * Phase 1: 타입 정의 및 매핑 관계 문서화
 */

import type { CompleteSegmentOutput } from "@/types/llm";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import type { BackgroundParamsResponse } from "@/types/llm";
import type { OutputMapping } from "@/types/llm";

// 하위 호환성을 위해 re-export
export type { OutputMapping } from "@/types/llm";

/**
 * CompleteSegmentOutput → MoodStreamSegment 매핑 관계
 * 
 * LLM이 생성한 완전한 출력을 MoodStreamSegment로 변환하는 방법을 정의합니다.
 * 
 * @deprecated 이 인터페이스는 문서화 목적으로만 사용됩니다.
 * 실제 매핑은 OutputMapping 타입을 사용하세요.
 */
export interface OutputMappingDoc {
  /**
   * CompleteSegmentOutput의 각 필드가 MoodStreamSegment의 어느 필드로 매핑되는지 정의
   */
  fieldMapping: {
    // 기본 정보
    moodAlias: "mood.name";
    moodColor: "mood.color";
    
    // 조명
    "lighting.rgb": "mood.lighting.rgb";
    "lighting.brightness": "Device.output.brightness";
    "lighting.temperature": "Device.output.temperature";
    
    // 향
    "scent.type": "mood.scent.type";
    "scent.name": "mood.scent.name";
    "scent.level": "Device.output.scentLevel";
    "scent.interval": "Device.output.scentInterval";
    
    // 음악
    "music.musicID": "musicTracks[0] (매핑 후)";
    "music.volume": "Device.output.volume";
    "music.fadeIn": "musicTracks[0].fadeIn";
    "music.fadeOut": "musicTracks[0].fadeOut";
    
    // 배경 효과
    "background.icons": "backgroundIcons";
    "background.icons[0]": "backgroundIcon";
    "background.wind": "backgroundWind";
    "background.animation.speed": "animationSpeed";
    "background.animation.iconOpacity": "iconOpacity";
  };
}

/**
 * CompleteSegmentOutput → BackgroundParamsResponse 변환 (하위 호환성)
 * 
 * @deprecated Phase 1 리팩토링 중. 점진적으로 제거 예정.
 */
export function convertToBackgroundParamsResponse(
  output: CompleteSegmentOutput
): BackgroundParamsResponse {
  return {
    moodAlias: output.moodAlias,
    musicSelection: output.music.musicID,
    moodColor: output.moodColor,
    lighting: {
      brightness: output.lighting.brightness,
      temperature: output.lighting.temperature,
    },
    backgroundIcon: {
      name: "", // 매핑 필요
      category: "", // 매핑 필요
    },
    iconKeys: output.background.icons,
    backgroundWind: output.background.wind,
    animationSpeed: output.background.animation.speed,
    iconOpacity: output.background.animation.iconOpacity,
  };
}

