# RAG 접근 방식 제안

## 현재 문제점

1. **프롬프트 길이**: 음악 목록(60개) + 아이콘 카탈로그(30개) + 감정 예측 JSON + 선호도 가중치 = 매우 긴 프롬프트
2. **응답 잘림**: max_tokens 4000이 부족하여 JSON이 중간에 잘림
3. **토큰 효율성**: 프롬프트가 길어서 응답에 할당되는 토큰 부족

## 사용자 제안: RAG 방식

### RAG의 개념
- **제0원칙 설정**: 모델이 가장 먼저 참고할 핵심 지침 제공
- **참고 자료 제공**: 프롬프트에 직접 포함하지 않고 별도로 제공
- **프롬프트 간소화**: 핵심 지침만 포함하여 토큰 절약

### OpenAI API에서의 RAG 구현 방법

#### 방법 1: Function Calling (도구 사용)
```typescript
tools: [
  {
    type: "function",
    function: {
      name: "get_available_music",
      description: "Get list of available music tracks with IDs and descriptions",
      parameters: {
        type: "object",
        properties: {
          genre: { type: "string", enum: ["Balad", "Pop", "Classic", "Jazz", "Hiphop", "Carol"] }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_icon_catalog",
      description: "Get list of available icons with keys and descriptions",
      parameters: { type: "object", properties: {} }
    }
  }
]
```

**장점**:
- 프롬프트에서 음악/아이콘 목록 제거 가능
- LLM이 필요할 때만 함수 호출
- 토큰 절약

**단점**:
- LLM이 함수를 호출하지 않을 수 있음
- 여러 번 호출해야 할 수 있음 (10개 세그먼트)
- 구현 복잡도 증가

#### 방법 2: Context Window 최적화 (현재 접근)
- 음악/아이콘 목록은 유지 (LLM이 선택을 위해 필요)
- 불필요한 반복 설명만 제거
- max_tokens 증가 (4000 → 8000)

**장점**:
- 구현 간단
- LLM이 모든 정보를 한 번에 볼 수 있음
- 선택 정확도 향상

**단점**:
- 프롬프트가 여전히 길 수 있음
- 토큰 비용 증가

#### 방법 3: 하이브리드 접근
- 음악/아이콘 목록은 프롬프트에 포함 (필수 정보)
- 불필요한 반복 설명만 제거
- 시스템 메시지 간소화
- max_tokens 증가

## 권장 접근 방식

### 단기 (즉시 적용)
1. ✅ 음악/아이콘 목록 복원 (LLM이 선택을 위해 필요)
2. ✅ 불필요한 반복 설명 제거
3. ✅ 시스템 메시지 간소화
4. ✅ max_tokens 8000으로 증가

### 중기 (향후 개선)
1. Function Calling 도입 검토
   - `get_available_music(genre?: string)` 함수
   - `get_icon_catalog()` 함수
   - LLM이 필요할 때만 호출

2. 프롬프트 최적화
   - 음악 목록: 장르별로 그룹화하여 제공
   - 아이콘 카탈로그: 카테고리별로 그룹화

### 장기 (향후 개선)
1. 벡터 임베딩 기반 RAG
   - 음악/아이콘을 벡터로 변환
   - 유사도 검색으로 관련 항목만 제공
   - 프롬프트 길이 대폭 감소

## 결론

**현재는 하이브리드 접근 방식이 가장 현실적입니다:**
- 음악/아이콘 목록은 유지 (선택 정확도)
- 불필요한 반복 설명만 제거 (토큰 절약)
- max_tokens 증가 (응답 완성도)

**향후 Function Calling 도입을 검토할 수 있습니다:**
- LLM이 필요할 때만 데이터 조회
- 프롬프트 길이 대폭 감소
- 하지만 구현 복잡도와 안정성 고려 필요

