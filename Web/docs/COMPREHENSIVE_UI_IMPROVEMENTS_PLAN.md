# 종합 UI 개선 및 버그 수정 계획

## 개요
사용자 경험 향상 및 발견된 문제 해결을 위한 통합 계획:
1. **향 통일 문제 해결**: LLM 응답의 향 정보가 제대로 반영되지 않는 문제
2. **흰색 과다 처리**: 흰색이 80% 이상인 컬러 자동 조정
3. **아이콘 다양성 개선**: 겨울 중심 아이콘셋 문제 해결
4. **앨범/향 정보 모달**: 사용자 정보 제공
5. **디바이스 카드 음량 조절**: 통합 음량 제어
6. **설정 저장 기능**: 별표 버튼으로 설정 저장

---

## Phase 0: 버그 수정 및 데이터 흐름 개선

### 0.1 향 통일 문제 진단 및 해결

#### 문제 분석
- **현상**: 모든 향이 "Rose"로 표시됨
- **원인 추정**:
  1. LLM 응답에 `scent.name`이 없거나 잘못된 경우
  2. `moodStreamConverter.ts`에서 fallback이 잘못 적용됨
  3. 초기 세그먼트의 하드코딩된 "Rose"가 유지됨
  4. `useDeviceSync`에서 fallback이 "Floral"이지만 실제로는 "Rose"가 표시됨

#### 진단 단계
**파일**: `Web/src/lib/llm/validateResponse.ts`, `Web/src/app/(main)/home/components/MoodDashboard/utils/moodStreamConverter.ts`

**확인 사항**:
1. LLM 응답 로그에서 `scent.type`과 `scent.name` 확인
2. `completeOutputMapper.ts`에서 `completeOutput.scent.name`이 제대로 전달되는지 확인
3. `moodStreamConverter.ts`에서 fallback 로직 확인
4. `useDeviceSync.ts`에서 `currentMood?.scent.name`이 null인 경우 확인

#### 해결 방안
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/utils/moodStreamConverter.ts`

**변경 사항**:
```typescript
// scent.name이 없을 때 SCENT_DEFINITIONS에서 적절한 기본값 선택
const getDefaultScentName = (scentType: ScentType): string => {
  const definitions = SCENT_DEFINITIONS[scentType];
  if (definitions && definitions.length > 0) {
    return definitions[0].name; // 첫 번째 향 이름 사용
  }
  return "Default";
};

// scent 변환 로직 개선
scent: {
  type: scentType,
  name: segmentMood.scent?.name || getDefaultScentName(scentType),
  color: safeFallback.scent.color,
},
```

**파일**: `Web/src/hooks/useDeviceSync.ts`

**변경 사항**:
- `currentMood?.scent.name || "Floral"` → `currentMood?.scent.name || currentMood?.scent.type || "Floral"`
- fallback을 향 타입으로 변경하여 더 정확한 표시

**파일**: `Web/src/lib/llm/validators/completeOutputValidator.ts`

**확인 사항**:
- `scent.name`이 SCENT_DEFINITIONS에 존재하는지 검증
- 존재하지 않으면 해당 타입의 첫 번째 향으로 자동 매핑

**예상 작업 시간**: 45-60분

---

### 0.2 흰색 과다 처리 로직 추가

#### 문제 분석
- **현상**: 흰색이 80% 이상인 컬러가 너무 밝게 표시됨
- **요구사항**: 흰색 비율이 80% 이상이면 20% 정도 제거

#### 해결 방안
**파일**: `Web/src/lib/utils.ts`

**새 함수 추가**:
```typescript
/**
 * 흰색 비율이 80% 이상인 컬러를 자동으로 조정
 * 흰색 비율을 20% 정도 감소시켜 더 진한 색상으로 만듦
 * 
 * @param color - HEX 컬러 문자열 (#RRGGBB)
 * @param whiteThreshold - 흰색 비율 임계값 (기본값: 0.8)
 * @param reductionAmount - 흰색 감소량 (기본값: 0.2)
 * @returns 조정된 HEX 컬러 문자열
 */
export function reduceWhiteTint(
  color: string,
  whiteThreshold: number = 0.8,
  reductionAmount: number = 0.2
): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const [r, g, b] = rgb;
  
  // RGB 값을 0-1 범위로 정규화
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;
  
  // 흰색 비율 계산 (RGB 값이 모두 높을수록 흰색에 가까움)
  // 평균값으로 흰색 비율 추정
  const whiteRatio = (normalizedR + normalizedG + normalizedB) / 3;
  
  // 흰색 비율이 임계값 이상이면 조정
  if (whiteRatio >= whiteThreshold) {
    // 흰색 비율을 reductionAmount만큼 감소
    const targetWhiteRatio = whiteRatio - reductionAmount;
    const ratio = targetWhiteRatio / whiteRatio;
    
    // RGB 값을 비율에 맞게 조정
    const adjustedR = Math.round(normalizedR * ratio * 255);
    const adjustedG = Math.round(normalizedG * ratio * 255);
    const adjustedB = Math.round(normalizedB * ratio * 255);
    
    return rgbToHex(adjustedR, adjustedG, adjustedB);
  }
  
  return color;
}
```

**적용 위치**:
1. `Web/src/app/(main)/home/components/Device/DeviceCardSmall.tsx` - `blendWithWhite` 호출 전
2. `Web/src/app/(main)/home/components/Device/DeviceCardExpanded.tsx` - 배경색 설정 시
3. `Web/src/lib/llm/mappers/completeOutputMapper.ts` - `moodColor` 변환 시 (선택적)

**예상 작업 시간**: 30-40분

---

### 0.3 아이콘 다양성 개선

#### 문제 분석
- **현상**: 새로 생성된 세그먼트의 아이콘이 겨울 중심(snowflake, star, tree 등)으로 한정됨
- **원인 추정**:
  1. LLM 프롬프트에서 아이콘 다양성을 요구하지 않음
  2. 아이콘 카탈로그가 제한적
  3. 아이콘 선택 로직이 겨울 관련 아이콘에 편향됨

#### 해결 방안

##### 0.3.1 프롬프트 개선
**파일**: `Web/src/lib/llm/optimizePromptForPython.ts`

**변경 사항**:
- 아이콘 다양성 요구사항 추가
- 계절/시간대/분위기에 맞는 다양한 아이콘 선택 요구
- 겨울 관련 아이콘만 사용하지 않도록 명시

**프롬프트 예시**:
```
아이콘 선택 시 주의사항:
- 계절, 시간대, 분위기에 맞는 다양한 아이콘을 선택하세요
- 겨울 관련 아이콘(snowflake, star, tree)만 반복 사용하지 마세요
- 자연 요소(leaf, flower, cloud, sun, moon), 추상 요소(circle, dot, line), 생활 요소(cup, book, heart) 등을 다양하게 활용하세요
- 10개 세그먼트에서 최대한 다양한 아이콘 조합을 사용하세요
```

##### 0.3.2 아이콘 검증 로직 개선
**파일**: `Web/src/lib/llm/validateResponse.ts`

**변경 사항**:
- 연속된 세그먼트에서 같은 아이콘셋 사용 시 경고
- 아이콘 다양성 점수 계산 및 로깅
- (선택적) 아이콘 다양성이 낮으면 자동으로 다른 아이콘으로 교체

**로직 예시**:
```typescript
// 10개 세그먼트의 아이콘 다양성 검증
const iconDiversityCheck = (segments: CompleteSegmentOutput[]) => {
  const iconSets = segments.map(s => s.background.icons.join(','));
  const uniqueIconSets = new Set(iconSets);
  const diversityScore = uniqueIconSets.size / segments.length;
  
  if (diversityScore < 0.5) {
    console.warn(`⚠️  [Icon Diversity] 낮은 아이콘 다양성: ${diversityScore.toFixed(2)}`);
  }
  
  return diversityScore;
};
```

##### 0.3.3 아이콘 카탈로그 확장 확인
**파일**: `Web/src/lib/llm/validateResponse.ts` (iconCatalog 확인)

**확인 사항**:
- iconCatalog에 다양한 아이콘 카테고리가 있는지 확인
- 부족한 카테고리가 있으면 추가 제안

**예상 작업 시간**: 45-60분

---

## Phase 1: 정보 모달 (앨범/향)

### 1.1 앨범 정보 모달
- 앨범 클릭 시 모달 표시
- `description`이 있으면 표시, 없으면 숨김
- 현재 재생 중인 노래 정보(`currentTrack`) 활용

**예상 작업 시간**: 30-40분

### 1.2 향 정보 모달
- 향 클릭 시 모달 표시
- 향 카테고리별 설명 표시

**예상 작업 시간**: 30-40분

**Phase 1 총 예상 시간**: 1-1.5시간

---

## Phase 2: 디바이스 카드 음량 조절

### 2.1 `useMusicTrackPlayer` 훅 확장
- `volume` 상태 추가
- `setVolume` 함수 추가
- localStorage 저장/불러오기

### 2.2 `DeviceCardExpanded`에 음량 슬라이더 추가
- Speaker/Manager 디바이스에 슬라이더 추가
- 모든 디바이스 연동

### 2.3 `useDeviceSync`에 음량 반영
- `volume` prop 추가
- 디바이스 동기화

**예상 작업 시간**: 1-1.5시간

---

## Phase 3: 설정 저장 기능

### 3.1 API 엔드포인트 확장
- `/api/moods/preference`에 `devicePreferences` 추가

### 3.2 별표 버튼 UI 추가
- `DeviceCardExpanded`에 별표 버튼 추가
- 저장/갱신 로직

### 3.3 설정 저장/불러오기
- `useDevicePreferences` 훅 생성
- 자동 갱신 로직

**예상 작업 시간**: 1.5-2시간

---

## 전체 구현 순서 (최적화된 페이즈 분배)

### 우선순위 0: 버그 수정 (즉시 처리)
1. ✅ **Phase 0.1**: 향 통일 문제 해결 (45-60분)
2. ✅ **Phase 0.2**: 흰색 과다 처리 (30-40분)
3. ✅ **Phase 0.3**: 아이콘 다양성 개선 (45-60분)

**Phase 0 총 예상 시간**: 2-2.5시간

### 우선순위 1: 정보 제공 (사용자 경험 향상)
4. ✅ **Phase 1.1**: 앨범 정보 모달 (30-40분)
5. ✅ **Phase 1.2**: 향 정보 모달 (30-40분)

**Phase 1 총 예상 시간**: 1-1.5시간

### 우선순위 2: 핵심 기능
6. ✅ **Phase 2**: 디바이스 카드 음량 조절 (1-1.5시간)

### 우선순위 3: 고급 기능
7. ✅ **Phase 3**: 설정 저장 기능 (1.5-2시간)

---

## 전체 예상 작업 시간

- **Phase 0 (버그 수정)**: 2-2.5시간
- **Phase 1 (정보 모달)**: 1-1.5시간
- **Phase 2 (음량 조절)**: 1-1.5시간
- **Phase 3 (설정 저장)**: 1.5-2시간

**총 예상 시간**: 6-7.5시간

---

## 기술적 상세 사항

### 향 통일 문제 해결 상세

#### 데이터 흐름 추적
```
LLM 응답 → validateResponse → completeOutputMapper → moodStreamConverter → useDeviceSync
```

각 단계에서 `scent.type`과 `scent.name`이 제대로 전달되는지 확인 필요.

#### 검증 포인트
1. LLM 응답 로그에서 `scent` 객체 확인
2. `completeOutputMapper.ts`에서 `completeOutput.scent.name` 확인
3. `moodStreamConverter.ts`에서 `segmentMood.scent?.name` 확인
4. `useDeviceSync.ts`에서 `currentMood?.scent.name` 확인

### 흰색 과다 처리 알고리즘

#### RGB → 흰색 비율 계산
```typescript
// 방법 1: 평균값 기반
const whiteRatio = (r + g + b) / (3 * 255);

// 방법 2: 최대값 기반 (더 정확)
const maxComponent = Math.max(r, g, b);
const whiteRatio = maxComponent / 255;

// 방법 3: 밝기 기반
const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
const whiteRatio = brightness;
```

**추천**: 방법 2 (최대값 기반) - 가장 직관적이고 효과적

#### 조정 공식
```typescript
// 흰색 비율이 0.8 이상이면 0.2 감소
if (whiteRatio >= 0.8) {
  const targetRatio = whiteRatio - 0.2;
  const scale = targetRatio / whiteRatio;
  
  // RGB 각 성분을 scale만큼 곱함
  const adjustedR = Math.round(r * scale);
  const adjustedG = Math.round(g * scale);
  const adjustedB = Math.round(b * scale);
}
```

### 아이콘 다양성 개선 전략

#### 프롬프트 개선 포인트
1. **계절 다양성**: 봄(flower, leaf), 여름(sun, cloud), 가을(leaf, tree), 겨울(snowflake, star)
2. **시간대 다양성**: 아침(sun, cloud), 낮(sun, leaf), 저녁(moon, star), 밤(moon, star)
3. **분위기 다양성**: 차분(leaf, circle), 활기(sun, flower), 로맨틱(heart, star), 집중(book, dot)
4. **추상 요소**: circle, dot, line, wave, sparkle
5. **생활 요소**: cup, book, heart, gift, candle

#### 아이콘 검증 로직
```typescript
// 10개 세그먼트의 아이콘 조합 분석
const analyzeIconDiversity = (segments: CompleteSegmentOutput[]) => {
  const allIcons = segments.flatMap(s => s.background.icons);
  const uniqueIcons = new Set(allIcons);
  const iconFrequency = new Map<string, number>();
  
  allIcons.forEach(icon => {
    iconFrequency.set(icon, (iconFrequency.get(icon) || 0) + 1);
  });
  
  // 중복도가 높은 아이콘 식별
  const overusedIcons = Array.from(iconFrequency.entries())
    .filter(([_, count]) => count > 3)
    .map(([icon, _]) => icon);
  
  if (overusedIcons.length > 0) {
    console.warn(`⚠️  [Icon Diversity] 과다 사용된 아이콘: ${overusedIcons.join(', ')}`);
  }
  
  return {
    uniqueCount: uniqueIcons.size,
    totalCount: allIcons.length,
    diversityScore: uniqueIcons.size / allIcons.length,
    overusedIcons,
  };
};
```

---

## 참고사항

- 모든 변경사항은 기존 기능에 영향을 주지 않도록 주의
- 테스트 시 LLM 응답 로그를 확인하여 데이터 흐름 검증
- 흰색 조정은 시각적으로 자연스럽게 적용
- 아이콘 다양성은 사용자 경험에 직접적인 영향을 미치므로 신중하게 처리

