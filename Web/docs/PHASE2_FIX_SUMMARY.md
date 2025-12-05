# Phase 2 수정 사항 요약

## 문제점
LLM이 여전히 기존 `BackgroundParamsResponse` 구조로 응답하고 있었음:
- `musicSelection` 사용 (새로운 구조: `music.musicID`)
- `backgroundIcons` 사용 (새로운 구조: `background.icons`)
- `lighting.rgb` 누락
- `scent` 객체 누락
- `music` 객체 누락
- `background` 객체 누락

## 해결 방법

### 1. 프롬프트 강화 (`optimizePromptForPython.ts`)

#### 변경 사항:
- 프롬프트 시작 부분에 경고 추가: "🚨 CRITICAL: YOU MUST USE THE NEW OUTPUT STRUCTURE"
- "OUTPUT FORMAT" 섹션 제목에 "(MANDATORY)" 추가
- 올바른 예시와 잘못된 예시 명확히 구분
- 각 필드에 주석으로 "REQUIRED" 표시
- "CRITICAL RULES" 섹션에 구조 요구사항 추가
- "FINAL REMINDERS" 섹션 강화

#### 주요 추가 내용:
```typescript
🚨 CRITICAL: YOU MUST USE THE NEW OUTPUT STRUCTURE BELOW 🚨
⚠️  CRITICAL: You MUST use this EXACT structure. DO NOT use old structure.
✅ CORRECT EXAMPLE OUTPUT - USE THIS STRUCTURE
❌ WRONG EXAMPLE - DO NOT USE THIS STRUCTURE
🚨 YOUR RESPONSE WILL BE REJECTED IF YOU USE OLD STRUCTURE 🚨
```

### 2. 시스템 메시지 강화 (`streamHandler.ts`)

#### 변경 사항:
- 시스템 메시지에 구조 요구사항 명확히 명시
- 각 필드별 REQUIRED 표시
- FORBIDDEN 필드 명시 (musicSelection, backgroundIcons 등)
- 경고 메시지 추가: "If you use the old structure, your response will be REJECTED"

#### 주요 추가 내용:
```typescript
🚨 CRITICAL STRUCTURE REQUIREMENT 🚨
1. "lighting": { "rgb": [r, g, b], ... }  // REQUIRED
2. "scent": { "type": "...", ... }       // REQUIRED
3. "music": { "musicID": 10-69, ... }    // REQUIRED
4. "background": { "icons": [...], ... } // REQUIRED

❌ FORBIDDEN (DO NOT USE):
- "musicSelection" → Use "music.musicID" instead
- "backgroundIcons" → Use "background.icons" instead
...
```

### 3. LLM 파라미터 조정

#### 변경 사항:
- `temperature`: 0.3 → 0.2 (더 일관된 구조 준수)
- `max_tokens`: 3000 → 4000 (새로운 구조가 더 길어서)

## 예상 결과

다음 LLM 호출 시:
1. ✅ 새로운 `CompleteSegmentOutput` 구조 사용
2. ✅ `lighting.rgb` 포함
3. ✅ `scent` 객체 포함
4. ✅ `music` 객체 포함 (musicID, volume, fadeIn, fadeOut)
5. ✅ `background` 객체 포함 (icons, wind, animation)

## 테스트 방법

1. 개발 서버 재시작
2. 스트림 생성 트리거
3. 서버 로그에서 확인:
   - `Structure detection: ✅ NEW (CompleteSegmentOutput)`
   - `lighting.rgb: EXISTS`
   - `scent.type: ...`
   - `music.musicID: ...`
   - `background.icons: EXISTS`

## 다음 단계

Phase 3 (검증 로직 구현) 진행:
- 새로운 구조 검증 로직 완성
- CompleteSegmentOutput → MoodStreamSegment 매핑
- 출력 디바이스 제어 데이터 생성

