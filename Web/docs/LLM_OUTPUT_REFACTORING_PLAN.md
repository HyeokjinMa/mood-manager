# LLM 출력 구조 리팩토링 계획

## 📋 현재 흐름 분석

### 현재 데이터 흐름
```
Firestore (생체 데이터) 
  ↓
ML 서버 (오디오 이벤트 분류)
  ↓
전처리 (preprocessing)
  ↓
Markov 체인 (감정 예측) → Python 서버
  ↓
선호도 가중치 조합
  ↓
LLM (완전한 출력 구조 생성) ← 모든 정보를 한 번에 생성
  ↓
음악 매핑 (musicID → MusicTrack) ← 단순 매핑만
  ↓
최종 Mood JSON
  ↓
출력 디바이스 (Manager)
  ├─ 조명 제어 (RGB, brightness, temperature)
  ├─ 향 제어 (type, name, level)
  ├─ 음악 제어 (fileUrl, volume, fade)
  └─ 배경 효과 (icons, wind, animation)
```

### 현재 LLM 출력 구조
```typescript
{
  moodAlias: string;
  musicSelection: number; // musicID (10-69)
  moodColor: string;
  lighting: { brightness: number; temperature?: number };
  backgroundIcon: { name: string; category: string };
  iconKeys?: string[];
  backgroundWind: { direction: number; speed: number };
  animationSpeed: number;
  iconOpacity: number;
  // ... 기타 필드
}
```

## 🎯 목표: 완전한 출력 구조 정의

### 최종 출력 디바이스 구조 (Manager)

**실제 Device 타입 구조:**
```typescript
Device {
  type: "manager" | "light" | "scent" | "speaker";
  output: {
    brightness?: number;      // 조명 밝기 (0-100)
    color?: string;            // 조명 색상 (RGB or HEX)
    temperature?: number;      // 조명 색온도 (2000-6500K)
    scentType?: string;       // 향 타입 (preset)
    scentLevel?: number;      // 향 강도 (레거시)
    scentInterval?: number;   // 향 분사 주기 (5, 10, 15, 20, 25, 30분)
    volume?: number;          // 스피커 볼륨 (0-100)
    nowPlaying?: string;      // 현재 재생 중인 음악 정보
  };
}
```

**LLM이 생성해야 할 출력:**
1. **조명 (Lighting Device)**
   - `color`: HEX 색상 (예: "#6B8E9F")
   - `brightness`: 밝기 (0-100)
   - `temperature`: 색온도 (2000-6500K)

2. **향 (Scent Device)**
   - `scentType`: 향 타입 (예: "Floral", "Woody", "Spicy")
   - `scentLevel`: 향 강도 (1-10, 레거시)
   - `scentInterval`: 향 분사 주기 (5, 10, 15, 20, 25, 30분)

3. **음악 (Speaker Device)**
   - `musicID`: 음악 ID (10-69) → 매핑하여 실제 MP3 파일 URL
   - `volume`: 볼륨 (0-100)
   - `fadeIn/Out`: 페이드 인/아웃 시간 (ms)

4. **배경 효과 (UI/Visual Effects)**
   - `icons`: 아이콘 키 배열 (1-4개)
   - `wind`: 풍향 (0-360도), 풍속 (0-10)
   - `animation`: 애니메이션 속도 (0-10), 아이콘 투명도 (0-1)

## 📐 새로운 LLM 출력 구조 설계

### Phase 1: 완전한 출력 구조 정의

#### 1.1 최종 출력 타입 정의

```typescript
/**
 * LLM이 생성하는 완전한 세그먼트 출력
 * 모든 출력 디바이스 제어 정보 포함
 */
export interface CompleteSegmentOutput {
  // 기본 정보
  moodAlias: string; // 무드 별칭 (예: "겨울비의 평온")
  moodColor: string; // HEX 색상 (예: "#6B8E9F")
  
  // 조명 제어
  lighting: {
    rgb: [number, number, number]; // RGB 값 (0-255)
    brightness: number; // 밝기 (0-100)
    temperature: number; // 색온도 (2000-6500K)
  };
  
  // 향 제어
  scent: {
    type: ScentType; // "Floral", "Woody", "Spicy" 등
    name: string; // "Rose", "Pine" 등 (DB 저장용)
    level: number; // 향 강도 (1-10, 레거시)
    interval: number; // 향 분사 주기 (5, 10, 15, 20, 25, 30분)
  };
  
  // 음악 제어
  music: {
    musicID: number; // 10-69 (매핑용)
    volume: number; // 볼륨 (0-100, 기본값: 70)
    fadeIn: number; // 페이드 인 시간 (ms, 기본값: 750)
    fadeOut: number; // 페이드 아웃 시간 (ms, 기본값: 750)
  };
  
  // 배경 효과 제어
  background: {
    icons: string[]; // 아이콘 키 배열 (1-4개)
    wind: {
      direction: number; // 풍향 (0-360도)
      speed: number; // 풍속 (0-10)
    };
    animation: {
      speed: number; // 애니메이션 속도 (0-10)
      iconOpacity: number; // 아이콘 투명도 (0-1)
    };
  };
}
```

#### 1.2 LLM 프롬프트 구조 개선

**현재 문제점:**
- 출력 구조가 분산되어 있음
- 어떤 필드가 어떤 디바이스에 사용되는지 불명확
- 일부 필드가 누락될 수 있음

**개선 방향:**
- LLM이 한 번에 완전한 출력 구조를 생성하도록 명확히 지시
- 각 필드의 용도와 범위를 명확히 정의
- 출력 디바이스별로 그룹화하여 프롬프트 작성

### Phase 2: LLM 프롬프트 리팩토링

#### 2.1 프롬프트 구조

```
[CONTEXT]
- 사용자 상태 (전처리 데이터)
- Markov 예측 결과
- 사용자 선호도 가중치
- 사용 가능한 음악 목록 (musicID + description)

[TASK]
Generate a COMPLETE segment output that controls ALL output devices:
1. Lighting Device: RGB color, brightness, temperature
2. Scent Device: Scent type, name, intensity level
3. Music Device: Music ID (10-69), volume, fade settings
4. Background Effects: Icons, wind direction/speed, animation settings

[OUTPUT FORMAT]
{
  "segments": [
    {
      "moodAlias": "...",
      "moodColor": "#HEX",
      "lighting": { "rgb": [r, g, b], "brightness": 0-100, "temperature": 2000-6500 },
      "scent": { "type": "Floral|Woody|Spicy|...", "name": "...", "level": 1-10, "interval": 5|10|15|20|25|30 },
      "music": { "musicID": 10-69, "volume": 0-100, "fadeIn": 750, "fadeOut": 750 },
      "background": {
        "icons": ["icon_key_1", "icon_key_2", ...],
        "wind": { "direction": 0-360, "speed": 0-10 },
        "animation": { "speed": 0-10, "iconOpacity": 0-1 }
      }
    }
  ]
}
```

#### 2.2 필드별 상세 지침

**조명 (Lighting):**
- `rgb`: [0-255, 0-255, 0-255] - 실제 RGB 값
- `brightness`: 0-100 - 밝기 (너무 밝지 않게, 30-80 권장)
- `temperature`: 2000-6500K - 색온도 (따뜻함/차가움)

**향 (Scent):**
- `type`: ScentType enum 값 ("Floral", "Woody", "Spicy" 등)
- `name`: 해당 타입의 구체적인 향 이름 ("Rose", "Pine" 등)
- `level`: 1-10 - 향 강도 (기본값: 5, 레거시)
- `interval`: 5, 10, 15, 20, 25, 30 - 향 분사 주기 (분 단위, 기본값: 15)

**음악 (Music):**
- `musicID`: 10-69 - 선택한 음악 ID
- `volume`: 0-100 - 볼륨 (기본값: 70)
- `fadeIn/Out`: 페이드 시간 (기본값: 750ms)

**배경 효과 (Background):**
- `icons`: 1-4개 아이콘 키
- `wind.direction`: 0-360도
- `wind.speed`: 0-10
- `animation.speed`: 0-10
- `animation.iconOpacity`: 0-1

### Phase 3: 검증 및 매핑 로직

#### 3.1 검증 함수 개선

```typescript
function validateCompleteSegmentOutput(raw: any): CompleteSegmentOutput {
  // 각 필드 검증 및 기본값 설정
  // 범위 체크 (rgb: 0-255, brightness: 0-100 등)
  // 타입 체크 (ScentType enum 등)
}
```

#### 3.2 매핑 로직

```typescript
// musicID → MusicTrack 매핑 (이미 구현됨)
const musicTrack = await mapMusicIDToTrack(segment.music.musicID);

// 최종 MoodStreamSegment 생성
const moodSegment: MoodStreamSegment = {
  timestamp: ...,
  duration: musicTrack.duration,
  mood: {
    id: ...,
    name: segment.moodAlias,
    color: segment.moodColor,
    music: {
      genre: musicTrack.genre,
      title: musicTrack.title,
    },
    scent: {
      type: segment.scent.type,
      name: segment.scent.name,
    },
    lighting: {
      color: segment.moodColor,
      rgb: segment.lighting.rgb,
    },
  },
  musicTracks: [musicTrack],
  backgroundIcon: { name: segment.background.icons[0], category: ... },
  backgroundIcons: segment.background.icons,
  backgroundWind: segment.background.wind,
  animationSpeed: segment.background.animation.speed,
  iconOpacity: segment.background.animation.iconOpacity,
};
```

## 🚀 구현 계획 (Phase별)

### Phase 1: 타입 정의 및 구조 설계 ✅ (완료)

**작업:**
1. ✅ `CompleteSegmentOutput` 타입 정의 (`src/lib/llm/types/completeOutput.ts`)
2. ✅ `MoodStreamSegment` 타입과의 매핑 관계 정의 (`src/lib/llm/types/mapping.ts`)
3. ✅ 출력 디바이스별 필드 그룹화 문서화
4. ✅ 불필요한 필드 제거 (iconCount, iconSize, particleEffect, gradientColors, transitionDuration)

**파일:**
- ✅ `src/lib/llm/types/completeOutput.ts` (신규 생성)
- ✅ `src/lib/llm/types/mapping.ts` (신규 생성)
- ✅ `src/hooks/useMoodStream/types.ts` (업데이트 - import 추가)
- ✅ `src/lib/llm/validateResponse.ts` (정리 - 불필요한 필드 제거)

### Phase 2: LLM 프롬프트 개선 ✅ (완료)

**작업:**
1. ✅ 프롬프트 템플릿 재작성 (CompleteSegmentOutput 구조)
2. ✅ 각 필드별 상세 지침 추가 (lighting, scent, music, background)
3. ✅ 출력 구조 예시 추가
4. ✅ 검증 규칙 명시
5. ✅ 프롬프트 강화 (새로운 구조 강제, 올바른/잘못된 예시 추가)
6. ✅ 시스템 메시지 강화 (구조 요구사항 명확화)
7. ✅ LLM 파라미터 조정 (temperature: 0.2, max_tokens: 4000)

**파일:**
- ✅ `src/lib/llm/optimizePromptForPython.ts` (대폭 수정 완료)
- ✅ `src/app/api/ai/background-params/handlers/streamHandler.ts` (시스템 메시지 강화)
- ✅ `src/lib/music/getAvailableMusicForLLM.ts` (이미 완료)

### Phase 3: 검증 로직 구현 ✅ (완료)

**작업:**
1. ✅ `validateCompleteSegmentOutput` 함수 구현 (`completeOutputValidator.ts`)
2. ✅ 각 필드별 범위/타입 검증
3. ✅ 기본값 설정 로직
4. ✅ 에러 처리 및 Fallback
5. ✅ CompleteSegmentOutput → MoodStreamSegment 매핑 함수 구현 (`completeOutputMapper.ts`)
6. ✅ 출력 디바이스 제어 데이터 생성 함수 구현
7. ✅ 검증 로직 로깅 개선

**파일:**
- ✅ `src/lib/llm/validateResponse.ts` (구조 감지 및 로깅 개선)
- ✅ `src/lib/llm/validators/completeOutputValidator.ts` (신규 생성)
- ✅ `src/lib/llm/mappers/completeOutputMapper.ts` (신규 생성)

### Phase 4: 매핑 로직 구현 (1일) - 다음 단계

**작업:**
1. `CompleteSegmentOutput` → `MoodStreamSegment` 변환 함수
2. musicID → MusicTrack 매핑 (이미 완료)
3. 출력 디바이스 제어 데이터 생성

**파일:**
- `src/lib/llm/mappers/completeOutputMapper.ts` (신규)
- `src/app/api/ai/background-params/handlers/streamHandler.ts` (수정)

### Phase 5: 로깅 및 디버깅 (0.5일)

**작업:**
1. LLM 원본 응답 로깅 (이미 완료)
2. 검증된 응답 로깅 (이미 완료)
3. 최종 출력 로깅 (이미 완료)
4. 출력 디바이스별 데이터 분리 로깅

**파일:**
- `src/app/api/ai/background-params/handlers/streamHandler.ts` (로깅 추가)

### Phase 6: 테스트 및 검증 (1일)

**작업:**
1. 각 Phase별 단위 테스트
2. 통합 테스트 (전체 흐름)
3. 출력 디바이스 시뮬레이션
4. 에러 케이스 처리 검증

## 📊 우선순위 및 일정

### 우선순위 1 (즉시)
- Phase 1: 타입 정의
- Phase 2: LLM 프롬프트 개선

### 우선순위 2 (다음)
- Phase 3: 검증 로직
- Phase 4: 매핑 로직

### 우선순위 3 (마무리)
- Phase 5: 로깅 개선
- Phase 6: 테스트

## 🔍 주요 개선 사항

### 1. 명확한 출력 구조
- 모든 출력 디바이스 제어 정보를 한 곳에 정의
- 필드별 용도와 범위 명확화

### 2. LLM 프롬프트 강화
- 완전한 출력 구조 요구
- 각 필드별 상세 지침 제공
- 예시 및 검증 규칙 포함

### 3. 타입 안정성
- TypeScript 타입으로 모든 출력 구조 정의
- 컴파일 타임 검증

### 4. 검증 및 Fallback
- 각 필드별 범위/타입 검증
- 기본값 자동 설정
- 에러 처리 강화

## 📝 다음 단계

### ✅ Phase 1 완료
1. ✅ **타입 정의 파일 생성** (`completeOutput.ts`, `mapping.ts`)
2. ✅ **불필요한 필드 제거** (iconCount, iconSize, particleEffect, gradientColors, transitionDuration)
3. ✅ **매핑 관계 문서화**

### 🔄 Phase 2 진행 예정
1. **LLM 프롬프트 재작성** (완전한 출력 구조 요구)
2. **검증 로직 구현** (각 필드별 검증)
3. **매핑 로직 구현** (CompleteSegmentOutput → MoodStreamSegment)
4. **로깅 개선** (출력 디바이스별 분리)

## 🔄 출력 디바이스 매핑

### LLM 출력 → Device.output 매핑

```typescript
// LLM 출력
const llmOutput: CompleteSegmentOutput = {
  lighting: { rgb: [107, 142, 159], brightness: 60, temperature: 4000 },
  scent: { type: "Floral", name: "Rose", level: 5, interval: 15 },
  music: { musicID: 15, volume: 70, fadeIn: 750, fadeOut: 750 },
  // ...
};

// Device.output로 변환
const deviceOutput: Device["output"] = {
  // 조명
  color: hexFromRgb(llmOutput.lighting.rgb), // "#6B8E9F"
  brightness: llmOutput.lighting.brightness,   // 60
  temperature: llmOutput.lighting.temperature, // 4000
  
  // 향
  scentType: llmOutput.scent.type,            // "Floral"
  scentLevel: llmOutput.scent.level,           // 5
  scentInterval: llmOutput.scent.interval,    // 15
  
  // 음악
  volume: llmOutput.music.volume,              // 70
  nowPlaying: musicTrack.title,                // 매핑된 음악 제목
};
```

### 출력 디바이스별 사용 필드

| 디바이스 타입 | 사용 필드 | LLM 출력 소스 |
|------------|---------|------------|
| `light` | `brightness`, `color`, `temperature` | `lighting` |
| `scent` | `scentType`, `scentLevel`, `scentInterval` | `scent` |
| `speaker` | `volume`, `nowPlaying` | `music` (musicID 매핑 후) |
| `manager` | 모든 필드 | 전체 LLM 출력 |

## 🎯 최종 목표

LLM이 한 번의 호출로 모든 출력 디바이스 제어에 필요한 완전한 정보를 생성하고, 각 필드가 명확히 정의되어 타입 안전하게 처리되도록 하는 것.

