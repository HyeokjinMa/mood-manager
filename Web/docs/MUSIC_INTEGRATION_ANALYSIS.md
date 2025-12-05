# 음악 통합 분석 및 구현 계획

## 현재 상태 분석

### ✅ 구현된 부분
1. **LLM 음악 선택**: `musicSelection` 문자열 반환 (예: "upbeat", "romantic")
2. **음악 트랙 구조**: `MusicTrack[]` 타입 정의 완료
3. **진행 상태 추적**: `useMusicTrackPlayer` 훅으로 진행 시간 계산
4. **UI 컴포넌트**: MusicControls, AlbumSection 등 UI 완성

### ❌ 미구현 부분 (핵심 문제)

#### 1. LLM → DB 매핑 누락
- **문제**: LLM이 반환하는 `musicSelection` 문자열이 DB의 `Sound` 레코드와 매핑되지 않음
- **현재**: `musicSelection`이 그대로 표시만 됨
- **필요**: `musicSelection` → DB Sound 레코드 조회 → `musicTracks` 배열 생성

#### 2. 실제 음악 재생 미구현
- **문제**: `musicPlayer.ts`가 TODO 상태, 실제 HTML5 Audio 재생 없음
- **현재**: 시뮬레이션만 존재
- **필요**: 실제 MP3 파일 재생, 페이드인/아웃, 크로스페이드

#### 3. 세그먼트 전환 로직 없음
- **문제**: 노래가 끝나도 자동으로 다음 세그먼트로 전환되지 않음
- **현재**: `onSegmentEnd` 콜백만 정의됨
- **필요**: 
  - 노래 종료 감지 → 0.75초 페이드아웃 → 0.75초 딜레이 → 다음 세그먼트 0.75초 페이드인
  - 세그먼트 전환 시 색상/아이콘도 함께 전환

#### 4. Progress Bar 인터랙션 없음
- **문제**: Progress Bar 클릭으로 위치 조정 불가
- **필요**: 클릭 위치에 따라 재생 위치 변경

## 구현 계획

### Phase 1: LLM → DB 매핑 구현

**파일**: `src/lib/music/mapMusicSelectionToTracks.ts`

```typescript
/**
 * LLM의 musicSelection을 DB Sound 레코드로 매핑
 * 
 * 1. musicSelection 문자열 파싱 (장르, 무드 키워드 추출)
 * 2. DB에서 Sound 레코드 조회 (장르, componentsJson.mood 매칭)
 * 3. 3개 노래 선택 (다양성 고려)
 * 4. MusicTrack[] 배열 생성
 */
```

**로직**:
1. `musicSelection`에서 장르 키워드 추출 (예: "upbeat pop" → "Pop")
2. `componentsJson.mood` 필드로 무드 매칭 (예: "energetic", "calm")
3. DB에서 Sound 조회: `WHERE genre.name = 'Pop' AND componentsJson->>'mood' = 'energetic'`
4. 3개 랜덤 선택 (또는 사용자 선호도 기반)
5. 각 Sound의 `fileUrl`, `duration` 사용하여 `MusicTrack[]` 생성

### Phase 2: 실제 음악 재생 구현

**파일**: `src/lib/audio/musicPlayer.ts` (완성)

```typescript
export class MusicPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private nextAudioElement: HTMLAudioElement | null = null;
  
  // 실제 MP3 파일 재생
  async play(src: string, fadeInDuration = 750): Promise<void>
  
  // 페이드아웃 후 정지
  async stop(fadeOutDuration = 750): Promise<void>
  
  // 크로스페이드 (현재 트랙 페이드아웃 + 다음 트랙 페이드인)
  async crossfade(currentSrc: string, nextSrc: string): Promise<void>
  
  // 재생 위치 설정
  seekTo(time: number): void
  
  // 재생 위치 조회
  getCurrentTime(): number
}
```

### Phase 3: 세그먼트 전환 로직 구현

**파일**: `src/hooks/useMusicTrackPlayer.ts` (수정)

**추가 기능**:
1. **노래 종료 감지**: `audioElement.ended` 이벤트 리스너
2. **자동 세그먼트 전환**: 
   - 현재 노래 종료 → 0.75초 페이드아웃
   - 0.75초 딜레이
   - 다음 세그먼트 첫 노래 0.75초 페이드인
3. **세그먼트 전환 시**: 색상/아이콘도 함께 전환 (MoodDashboard에서 처리)

### Phase 4: Progress Bar 인터랙션

**파일**: `src/app/(main)/home/components/MoodDashboard/components/MusicControls.tsx` (수정)

**추가 기능**:
- Progress Bar 클릭 시 `onSeek` 콜백 호출
- `useMusicTrackPlayer`에서 `seekTo` 메서드 제공

## 잠재적 문제점 및 해결 방안

### 1. DB Sound 레코드 부족
- **문제**: 특정 장르/무드 조합에 Sound 레코드가 없을 수 있음
- **해결**: 
  - Fallback 로직: 장르만 매칭 → 무드 무시
  - 기본 Sound 레코드 사용
  - 콘솔 경고 로그

### 2. 음악 파일 경로 문제
- **문제**: `fileUrl`이 실제 파일 경로와 일치하지 않을 수 있음
- **해결**: 
  - 파일 존재 여부 확인
  - 404 에러 처리
  - 기본 음악 파일 사용

### 3. 모바일 브라우저 제한
- **문제**: 모바일 브라우저에서 자동 재생 제한
- **해결**: 
  - 사용자 인터랙션 후 재생 시작
  - 재생 버튼 클릭 필수

### 4. 세그먼트 전환 타이밍
- **문제**: 페이드아웃/인 중에 사용자가 조작할 경우
- **해결**: 
  - 전환 중 플래그 설정
  - 전환 중에는 조작 무시

### 5. 메모리 누수
- **문제**: Audio 엘리먼트가 계속 생성되면 메모리 누수
- **해결**: 
  - 이전 Audio 엘리먼트 정리
  - `dispose()` 메서드 호출

## 구현 순서

1. ✅ **LLM → DB 매핑 로직 구현** (최우선)
2. ✅ **실제 HTML5 Audio 재생 구현**
3. ✅ **세그먼트 전환 로직 구현**
4. ✅ **Progress Bar 인터랙션 추가**
5. ✅ **로컬 테스트 (PC)**
6. ✅ **모바일 테스트**
7. ✅ **에러 처리 및 Fallback 로직 강화**

## 테스트 체크리스트

### PC 테스트
- [ ] LLM 응답 → DB Sound 매핑 정상 작동
- [ ] 음악 파일 재생 정상 작동
- [ ] 페이드인/아웃 정상 작동
- [ ] 세그먼트 자동 전환 정상 작동
- [ ] Progress Bar 클릭으로 위치 조정 정상 작동
- [ ] 다음 노래 클릭 시 세그먼트 전환 정상 작동

### Mobile 테스트
- [ ] 모바일 브라우저에서 음악 재생 정상 작동
- [ ] 자동 재생 제한 우회 (사용자 인터랙션 후 재생)
- [ ] 세그먼트 전환 정상 작동
- [ ] Progress Bar 터치 조작 정상 작동

## 예상 소요 시간

- Phase 1 (LLM → DB 매핑): 2-3시간
- Phase 2 (실제 재생): 3-4시간
- Phase 3 (세그먼트 전환): 2-3시간
- Phase 4 (Progress Bar): 1-2시간
- 테스트 및 버그 수정: 2-3시간

**총 예상 시간**: 10-15시간

