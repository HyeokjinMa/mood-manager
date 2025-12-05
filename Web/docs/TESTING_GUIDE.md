# LLM 프롬프트 테스트 가이드

## Phase 2 테스트 방법

### 1. 프롬프트 생성 테스트

프롬프트가 올바르게 생성되는지 확인:

```bash
cd Web
npx tsx scripts/test-llm-prompt.ts
```

**확인 사항:**
- ✅ CompleteSegmentOutput 구조 포함 (`lighting.rgb`, `scent`, `music`, `background`)
- ✅ 필드별 상세 지침 포함
- ✅ 출력 구조 예시 포함
- ✅ 검증 규칙 명시

### 2. 실제 LLM 응답 테스트

#### 방법 1: 개발 서버에서 API 호출

1. 개발 서버 실행:
```bash
cd Web
npm run dev
```

2. 브라우저에서 `/home` 페이지 접속
3. 스트림 생성 트리거 (자동 또는 수동)
4. 서버 콘솔에서 로그 확인:
   - `📋 [LLM 원본 응답]` - LLM이 반환한 원본 JSON
   - `✅ [검증된 LLM 응답]` - 검증 후 응답
   - `🎵 [최종 Mood JSON]` - 음악 매핑 완료 후 최종 JSON

#### 방법 2: API 엔드포인트 직접 호출

```bash
# POST /api/moods/current/generate
curl -X POST http://localhost:3000/api/moods/current/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"segmentCount": 7}'
```

### 3. 검증 체크리스트

LLM 응답이 올바른지 확인:

#### ✅ CompleteSegmentOutput 구조 확인

```json
{
  "segments": [
    {
      "moodAlias": "string",
      "moodColor": "#HEX",
      "lighting": {
        "rgb": [0-255, 0-255, 0-255],
        "brightness": 0-100,
        "temperature": 2000-6500
      },
      "scent": {
        "type": "Floral|Woody|Spicy|...",
        "name": "string",
        "level": 1-10,
        "interval": 5|10|15|20|25|30
      },
      "music": {
        "musicID": 10-69,
        "volume": 0-100,
        "fadeIn": 750,
        "fadeOut": 750
      },
      "background": {
        "icons": ["icon_key_1", ...],
        "wind": {
          "direction": 0-360,
          "speed": 0-10
        },
        "animation": {
          "speed": 0-10,
          "iconOpacity": 0-1
        }
      }
    }
  ]
}
```

#### ✅ 필드 검증

- [ ] `lighting.rgb`: 배열 [0-255, 0-255, 0-255]
- [ ] `lighting.brightness`: 0-100 범위
- [ ] `lighting.temperature`: 2000-6500 범위
- [ ] `scent.type`: 유효한 ScentType 값
- [ ] `scent.name`: 문자열
- [ ] `scent.level`: 1-10 범위
- [ ] `scent.interval`: 5, 10, 15, 20, 25, 30 중 하나
- [ ] `music.musicID`: 10-69 범위의 숫자
- [ ] `music.volume`: 0-100 범위
- [ ] `music.fadeIn`: 숫자 (기본값: 750)
- [ ] `music.fadeOut`: 숫자 (기본값: 750)
- [ ] `background.icons`: 1-4개 아이콘 키 배열
- [ ] `background.wind.direction`: 0-360 범위
- [ ] `background.wind.speed`: 0-10 범위
- [ ] `background.animation.speed`: 0-10 범위
- [ ] `background.animation.iconOpacity`: 0-1 범위

#### ✅ 세그먼트 고유성 확인

- [ ] 10개 세그먼트 모두 다른 `music.musicID`
- [ ] 10개 세그먼트 모두 다른 `moodColor`
- [ ] 10개 세그먼트 모두 다른 `moodAlias`
- [ ] 전체 세그먼트에서 8-12개 이상의 서로 다른 아이콘 키 사용

### 4. 문제 해결

#### 문제: LLM이 새로운 구조를 반환하지 않음

**원인:** 검증 로직이 여전히 `BackgroundParamsResponse` 구조를 기대함

**해결:** Phase 3 (검증 로직 구현) 진행 필요

#### 문제: 일부 필드가 누락됨

**원인:** 프롬프트가 충분히 명확하지 않음

**해결:** 프롬프트의 "COMPLETE OUTPUT" 섹션 강화

#### 문제: musicID가 문자열로 반환됨

**원인:** LLM이 숫자 대신 문자열 반환

**해결:** 검증 로직에서 숫자로 변환 처리 (이미 구현됨)

### 5. 다음 단계

Phase 2 테스트 완료 후:
1. ✅ 프롬프트 생성 확인
2. ✅ 실제 LLM 응답 확인
3. ⏭️ Phase 3: 검증 로직 구현 (새로운 구조 처리)

