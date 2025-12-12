# LLM JSON 스키마

#### 필드별 상세 설명 (표 형식)

| 필드 경로 | 타입 | 범위/형식 | 필수 | 설명 | 예시 |
|----------|------|----------|------|------|------|
| `segments` | `array` | 10개 | ✅ | 세그먼트 배열 (고정 10개) | `[{...}, {...}, ...]` |
| `segments[].moodAlias` | `string` | 2-4단어 영어 | ✅ | 무드 별칭 | `"Calm Winter Rain"` |
| `segments[].moodColor` | `string` | HEX 6자리 | ✅ | 무드 색상 | `"#6B8E9F"` |
| `segments[].lighting.rgb` | `array[number]` | `[0-255, 0-255, 0-255]` | ✅ | RGB 값 | `[107, 142, 159]` |
| `segments[].lighting.brightness` | `number` | 0-100 | ✅ | 밝기 | `50` |
| `segments[].lighting.temperature` | `number` | 2000-6500 | ✅ | 색온도 (K) | `4000` |
| `segments[].scent.type` | `string` | enum (12개) | ✅ | 향 타입 | `"Marine"` |
| `segments[].scent.name` | `string` | 1자 이상 | ✅ | 향 이름 | `"Wave"` |
| `segments[].scent.level` | `number` | 1-10 | ✅ | 향 강도 | `5` |
| `segments[].scent.interval` | `number` | enum (6개) | ✅ | 분사 주기 (분) | `15` (5,10,15,20,25,30 중) |
| `segments[].music.musicID` | `number` | 10-69 | ✅ | 음악 ID | `25` |
| `segments[].music.volume` | `number` | 0-100 | ✅ | 볼륨 | `70` |
| `segments[].music.fadeIn` | `number` | 0-5000 | ✅ | 페이드인 (ms) | `750` |
| `segments[].music.fadeOut` | `number` | 0-5000 | ✅ | 페이드아웃 (ms) | `750` |
| `segments[].background.icons` | `array[string]` | 1-4개 | ✅ | 아이콘 키 배열 | `["FaCloudRain", "FaLeaf"]` |
| `segments[].background.wind.direction` | `number` | 0-360 | ✅ | 풍향 (도) | `180` |
| `segments[].background.wind.speed` | `number` | 0-10 | ✅ | 풍속 | `3` |
| `segments[].background.animation.speed` | `number` | 0-10 | ✅ | 애니메이션 속도 | `4` |
| `segments[].background.animation.iconOpacity` | `number` | 0-1 | ✅ | 아이콘 투명도 | `0.7` |

#### Scent Type Enum 값

| 값 | 설명 |
|----|------|
| `"Musk"` | 머스크 |
| `"Aromatic"` | 아로마틱 |
| `"Woody"` | 우디 |
| `"Citrus"` | 시트러스 |
| `"Honey"` | 허니 |
| `"Green"` | 그린 |
| `"Dry"` | 드라이 |
| `"Leathery"` | 레더리 |
| `"Marine"` | 마린 |
| `"Spicy"` | 스파이시 |
| `"Floral"` | 플로럴 |
| `"Powdery"` | 파우더리 |

### 1. LLM이 반환하는 실제 구조 (completeOutputSchema.json)

```json
{
  "segments": [
    {
      "moodAlias": "Calm Winter Rain",
      "moodColor": "#6B8E9F",
      "lighting": {
        "rgb": [107, 142, 159],
        "brightness": 50,
        "temperature": 4000
      },
      "scent": {
        "type": "Marine",
        "name": "Wave",
        "level": 5,
        "interval": 15
      },
      "music": {
        "musicID": 25,
        "volume": 70,
        "fadeIn": 750,
        "fadeOut": 750
      },
      "background": {
        "icons": ["FaCloudRain"],
        "wind": {
          "direction": 180,
          "speed": 3
        },
        "animation": {
          "speed": 4,
          "iconOpacity": 0.7
        }
      }
    }
    // ... 9개 더 (총 10개)
  ]
}
```

### JSON 스키마 사용처

| 필드 경로 | 타입 | 필수 | 설명 | LLM 스키마와의 차이 |
|----------|------|------|------|-------------------|
| `segments` | `array` | ✅ | 세그먼트 배열 (10개) | 동일 |
| `segments[].moodAlias` | `string` | ✅ | 무드 별칭 | 동일 |
| `segments[].moodColor` | `string` | ✅ | 무드 색상 (HEX) | 동일 |
| `segments[].lighting.brightness` | `number` | ✅ | 밝기 (0-100) | 동일 |
| `segments[].lighting.temperature` | `number` | ✅ | 색온도 (2000-6500) | 동일 |
| `segments[].backgroundIcon.name` | `string` | ✅ | 첫 번째 아이콘 이름 | LLM: `background.icons[0]` |
| `segments[].backgroundIcon.category` | `string` | ✅ | 아이콘 카테고리 | LLM: 변환 시 추가됨 |
| `segments[].backgroundIcons` | `array[string]` | ✅ | 아이콘 키 배열 (1-4개) | LLM: `background.icons` |
| `segments[].backgroundWind.direction` | `number` | ✅ | 풍향 (0-360) | 동일 |
| `segments[].backgroundWind.speed` | `number` | ✅ | 풍속 (0-10) | 동일 |
| `segments[].animationSpeed` | `number` | ✅ | 애니메이션 속도 (0-10) | LLM: `background.animation.speed` |
| `segments[].iconOpacity` | `number` | ✅ | 아이콘 투명도 (0-1) | LLM: `background.animation.iconOpacity` |
| `segments[].scent.type` | `string` | ✅ | 향 타입 | 동일 |
| `segments[].scent.name` | `string` | ✅ | 향 이름 | 동일 |
| `segments[].musicSelection` | `number` | ✅ | 음악 ID (10-69) | LLM: `music.musicID` |
| `segments[].musicTracks` | `array` | ✅ | 매핑된 음악 트랙 정보 | LLM 응답 후 추가됨 |
| `segments[].musicTracks[].title` | `string` | ✅ | 음악 제목 | musicID로 매핑됨 |
| `segments[].musicTracks[].fadeIn` | `number` | ✅ | 페이드인 (ms) | LLM: `music.fadeIn` |
| `segments[].musicTracks[].fadeOut` | `number` | ✅ | 페이드아웃 (ms) | LLM: `music.fadeOut` |
| `segments[].duration` | `number` | ✅ | 세그먼트 길이 (ms) | LLM 응답 후 추가됨 |


## 변환 과정

1. **LLM 응답** → `CompleteStreamOutput` (`{ segments: CompleteSegmentOutput[] }`)
2. **검증** → `validateCompleteSegmentOutput()`로 각 세그먼트 검증
3. **변환** → `convertToBackgroundParamsResponse()`로 `BackgroundParamsResponse`로 변환
4. **API 응답** → `{ segments: BackgroundParamsResponse[] }` 반환
