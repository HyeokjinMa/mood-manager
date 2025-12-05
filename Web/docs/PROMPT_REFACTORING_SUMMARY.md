# 프롬프트 엔지니어링 재정립 요약

## 문제점

1. **응답 잘림**: max_tokens 4000이 부족하여 JSON이 중간에 잘림
   - 에러 위치: position 10758 (line 1848)
   - 증상: "icons": ["candle_warm", "snow" 에서 끝남

2. **프롬프트 과다**: 불필요한 반복과 장황한 설명으로 토큰 낭비
   - 기존 프롬프트: ~400줄
   - 시스템 메시지: ~20줄

3. **토큰 효율성**: 프롬프트가 길어서 응답에 할당되는 토큰 부족

## 해결 방법

### 1. 프롬프트 대폭 간소화

**이전** (~400줄):
```
================================================================================
🚨 CRITICAL: YOU MUST USE THE NEW OUTPUT STRUCTURE BELOW 🚨
================================================================================
...
[ICON CATEGORY]
- icon1: description
- icon2: description
...
[REQUIREMENTS - CRITICAL]
1. MUSIC SELECTION (MANDATORY - ABSOLUTE REQUIREMENT - HIGHEST PRIORITY):
   🚨🚨🚨 YOU MUST SELECT FROM THE MUSIC LIST ABOVE. DO NOT INVENT NAMES. 🚨🚨🚨
   ...
```

**변경 후** (~20줄):
```
10개 세그먼트 생성

컨텍스트: ${moodName}, ${musicGenre}, ${scentType}, ${timeOfDay}시, ${season}

감정예측: ${pythonResponseJson}

음악(ID선택): 10:desc1 | 11:desc2 | ...

아이콘: icon1, icon2, icon3, ...

출력구조(JSON Schema 강제):
{
  "moodAlias": "2-4단어",
  "moodColor": "#HEX",
  "lighting": {"rgb": [r,g,b], "brightness": 0-100, "temperature": 2000-6500},
  ...
}

규칙: 10개 고유세그먼트, 각기 다른 musicID, 색상 너무 밝지 않게
```

### 2. 시스템 메시지 간소화

**이전** (~20줄):
```
You are a mood generation system that creates COMPLETE output for ALL output devices.

🚨🚨🚨 CRITICAL: You MUST use the EXACT structure defined in the JSON schema.
The schema will ENFORCE the structure - you cannot deviate from it.

REQUIRED STRUCTURE (enforced by schema):
- Each segment MUST have: moodAlias, moodColor, lighting, scent, music, background
...
```

**변경 후** (~5줄):
```
Generate 10 mood segments. JSON Schema enforces structure.

Required: segments[].{moodAlias, moodColor, lighting{rgb[], brightness, temperature}, scent{type, name, level, interval}, music{musicID:10-69, volume, fadeIn, fadeOut}, background{icons[], wind{}, animation{}}}

Use music.musicID (not musicSelection). Use background.icons (not backgroundIcons).
```

### 3. 음악 목록 포맷 간소화

**이전**:
```
🎵 AVAILABLE MUSIC TRACKS - SELECT BY MUSIC ID (10-69)
================================================================================
...
━━━ BALAD GENRE (10 tracks, Music ID: 10-19) ━━━
  [Music ID: 10] description1
  [Music ID: 11] description2
...
```

**변경 후**:
```
10:desc1 | 11:desc2 | 12:desc3 | ...
```

### 4. max_tokens 증가

- **이전**: 4000
- **변경 후**: 8000
- **이유**: JSON Schema + 10개 세그먼트 = 많은 토큰 필요

## 예상 효과

1. **토큰 절약**: 프롬프트 길이 ~90% 감소
2. **응답 완성도 향상**: max_tokens 8000으로 증가하여 완전한 JSON 생성 가능
3. **구조 준수**: JSON Schema가 구조를 강제하므로 프롬프트 간소화해도 안전

## 다음 테스트

1. 서버 재시작
2. 스트림 생성 테스트
3. 확인 사항:
   - ✅ JSON이 완전히 생성되는지 (잘림 없음)
   - ✅ 새로운 구조 사용 여부
   - ✅ 모든 필드 포함 여부

