# 작업 체크리스트

## 📋 사용자가 할 일 (파일 추가 전)

### 1. 마크다운 데이터 작성
- **작업**: 60개 노래에 대한 JSON 데이터 작성
- **형식**:
  ```json
  {
    "title": "A glass of soju",
    "mp3": "Balad/Balad_1.mp3",           // ✅ 숫자 형식 (수정 필요)
    "png": "Balad/A-glass-of-soju.png",   // ✅ 하이픈 형식 (그대로 사용)
    "artist": "Lim Changjung",
    "description": "A heartfelt ballad capturing the pain of love poured out like a glass of soju.",
    "duration": 291
  }
  ```
- **주의사항**:
  - `mp3` 필드: `{Genre}/{Genre}_{Number}.mp3` 형식 (예: `Balad/Balad_1.mp3`)
  - `png` 필드: `{Genre}/{Title-with-hyphens}.png` 형식 (예: `Balad/A-glass-of-soju.png`)
  - `title` 필드: 이미지 파일명과 일치 (확장자 제외, 공백 포함)
  - `duration`: 실제 MP3 파일 길이 (초 단위)

### 2. 파일 확인
- [ ] 모든 MP3 파일이 `{Genre}_{Number}.mp3` 형식인지 확인
- [ ] 모든 이미지 파일이 `{Title}.png` 형식인지 확인 (공백 포함)

---

## 🔄 다음 태스크 (페이즈별)

### Phase 1: 음악 메타데이터 업데이트 (우선순위 높음)

#### 1.1 마크다운 데이터 수신 및 검증
- [ ] 마크다운 데이터 파일 수신
- [ ] JSON 형식 검증
- [ ] 필수 필드 확인 (title, mp3, png, artist, description, duration)

#### 1.2 musicTracks.json 생성
- [ ] `scripts/generate-music-tracks-from-markdown.ts` 실행
- [ ] 생성된 JSON 검증
- [ ] 실제 파일과 매핑 확인
- [ ] `src/lib/music/musicTracks.json` 업데이트

#### 1.3 음악 매핑 테스트
- [ ] LLM 응답에서 musicID 매핑 테스트
- [ ] 실제 MP3 파일 재생 확인
- [ ] 이미지 파일 표시 확인
- [ ] duration 반영 확인

**예상 소요 시간**: 1-2시간

---

### Phase 2: 세그먼트-디바이스 출력 개선 (우선순위 중간)

#### 2.1 세그먼트 변경 시 디바이스 출력 로직 개선
- [ ] 세그먼트 변경 시 모든 출력 디바이스에 한번에 데이터 전송 함수 생성
- [ ] `useDeviceSync` 개선 또는 새로운 훅 생성
- [ ] 조명, 향, 음악이 동시에 업데이트되는지 확인

#### 2.2 디바이스 출력 데이터 구조 명시화
- [ ] 디바이스 출력 프로토콜 문서화
- [ ] 세그먼트 → 디바이스 출력 매핑 함수 생성
- [ ] 타입 정의 정리

**예상 소요 시간**: 2-3시간

---

### Phase 3: 테스트 및 검증 (우선순위 중간)

#### 3.1 통합 테스트
- [ ] 전체 플로우 테스트 (전처리 → 마르코프 → LLM → 세그먼트 생성)
- [ ] 세그먼트 변경 시 디바이스 출력 테스트
- [ ] 음악 재생 및 이미지 표시 테스트

#### 3.2 에러 처리 개선
- [ ] 파일 매핑 실패 시 에러 처리
- [ ] LLM 응답 검증 강화
- [ ] 디바이스 출력 실패 시 폴백 로직

**예상 소요 시간**: 2-3시간

---

### Phase 4: 문서화 및 정리 (우선순위 낮음)

#### 4.1 코드 문서화
- [ ] 세그먼트 변경 플로우 문서화
- [ ] 디바이스 출력 프로토콜 문서화
- [ ] 음악 매핑 로직 문서화

#### 4.2 타입 정의 정리
- [ ] `CompleteSegmentOutput` → `MoodStreamSegment` 매핑 검증
- [ ] 디바이스 출력 데이터 구조 타입 정의
- [ ] 불필요한 타입 제거

**예상 소요 시간**: 1-2시간

---

### Phase 5: 향후 계획 (우선순위 낮음)

#### 5.1 웹-앱 실시간 동기화
- [ ] WebSocket 또는 SSE 구현
- [ ] 같은 사용자 ID의 모든 세션에 상태 전파
- [ ] 세그먼트 변경 시 브로드캐스트

#### 5.2 성능 최적화
- [ ] LLM 응답 캐싱
- [ ] 디바이스 출력 최적화
- [ ] 이미지 로딩 최적화

**예상 소요 시간**: 미정

---

## 📊 현재 진행 상황

### ✅ 완료된 작업
- [x] LLM 응답 구조 (`CompleteSegmentOutput`) 정의
- [x] 음악 매핑 구조 (`musicID` 기반) 정의
- [x] 세그먼트 저장 구조 (`MoodStream.segments` 배열)
- [x] 현재 세그먼트 추적 (`currentSegmentIndex`)
- [x] 기본 디바이스 동기화 (`useDeviceSync`)
- [x] 아이콘/풍향 FE 전용 확인
- [x] 마크다운 변환 스크립트 작성

### ⏳ 대기 중인 작업
- [ ] 마크다운 데이터 작성 (사용자)
- [ ] musicTracks.json 생성
- [ ] 음악 매핑 테스트

### 🔄 진행 예정 작업
- [ ] 세그먼트 변경 시 디바이스 출력 로직 개선
- [ ] 통합 테스트
- [ ] 문서화

---

## 🎯 다음 단계

1. **사용자**: 마크다운 데이터 작성 (60개 JSON)
2. **개발자**: 마크다운 데이터 수신 후 `musicTracks.json` 생성
3. **개발자**: 음악 매핑 테스트
4. **개발자**: 세그먼트-디바이스 출력 개선

---

## 📝 참고 문서

- `docs/FILE_RENAMING_GUIDE.json` - 파일 리네이밍 가이드
- `docs/OUTPUT_DEVICE_ARCHITECTURE.md` - 출력 디바이스 아키텍처
- `docs/LLM_OUTPUT_REFACTORING_PLAN.md` - LLM 출력 리팩토링 계획
- `docs/CURRENT_SYSTEM_STATUS.md` - 현재 시스템 상태

