# 🔍 플로우 및 이슈 점검

## 📋 현재 플로우 확인

### 1. 초기 세그먼트 로드 ✅

**확인됨**:
- `getInitialColdStartSegments()` 호출 → 3개 세그먼트 반환
- `useMoodStreamManager` 초기 상태에 설정
- `currentSegmentData` fallback으로 사용됨

**로그 확인**:
- 초기 세그먼트 로드 완료 확인됨

---

### 2. LLM 세그먼트 생성 ✅

**확인됨**:
- `POST /api/moods/current/generate` 호출
- LLM이 10개 세그먼트 생성 (로그 확인)
- 마르코프 서버 403 에러 → fallback 모드 사용

**로그 확인**:
```
✅ [LLM Response] 10 segments, NEW structure
Segment 0-9: 각각 musicID, scent, icons 포함
```

---

### 3. 세그먼트 병합 ⚠️

**현재 상태**:
- 초기 3개 + LLM 10개 생성됨
- 병합 로직이 실행되는지 확인 필요

**예상 결과**:
- 초기 3개 + LLM 앞 4개 = 총 7개

**확인 필요**:
- 병합 로직 실행 로그 확인
- `hasInitialSegments` 조건 충족 여부
- `segmentCount >= 4` 조건 충족 여부

---

### 4. 음악 파일 경로 문제 ❌

**문제 발견**:

#### 4.1 초기 세그먼트 경로
```typescript
// getInitialColdStartSegments.ts
musicFileUrl: "/musics/Carol/Carol_1.mp3"
musicAlbumImageUrl: "/musics_img/Carol/Carol_1.png"
```

**실제 상태**:
- `public/musics/` 폴더 없음
- `public/musics_img/` 폴더 없음
- → 404 에러 발생

#### 4.2 LLM 생성 세그먼트 경로
```typescript
// streamHandler.ts에서 매핑
// musicID → getMusicTrackByID() → DB에서 Sound 조회
// sound.fileUrl, sound.albumImageUrl 사용
```

**확인 필요**:
- DB의 `Sound` 테이블에서 `fileUrl`과 `albumImageUrl` 값 확인
- 실제 파일 경로와 일치하는지 확인

---

### 5. 음악 재생 문제 ⚠️

**문제**:
- 노래가 바로 안 나옴
- Audio error 발생

**확인 필요**:
- `useMusicTrackPlayer`에서 `playing` prop 변경 시 재생 시작 여부
- 세그먼트 변경 시 자동 재생 여부
- Audio element의 src 설정 여부

---

## 🔍 발견된 문제점

### 문제 1: 음악/이미지 파일 경로 404

**원인**:
1. 초기 세그먼트: 하드코딩된 경로 `/musics/Carol/Carol_1.mp3` 사용
2. 실제 파일: `public/musics/` 폴더에 없음

**해결 방안**:
- Option 1: 파일을 `public/musics/`, `public/musics_img/`에 추가
- Option 2: 초기 세그먼트도 DB에서 가져오기
- Option 3: 음악 파일을 CDN이나 외부 스토리지에 저장

---

### 문제 2: MusicPlayer Audio Error

**원인**:
- 파일이 없어서 Audio element가 에러 발생
- 404 에러로 인한 로드 실패

**해결 방안**:
- 파일 경로 문제 해결 필요
- 에러 처리 개선 (파일 없을 때 fallback)

---

### 문제 3: 음악 자동 재생 안 됨

**확인 필요**:
- `useMusicTrackPlayer`의 `playing` prop이 `true`가 되는 시점
- 세그먼트 변경 시 자동 재생 로직 확인

---

### 문제 4: 이미지 표시 안 됨

**원인**:
- `albumImageUrl`이 `undefined`이거나 잘못된 경로
- 파일 경로 404

**해결 방안**:
- 파일 경로 문제 해결
- fallback 이미지 추가

---

## 📝 플로우 확인 결과

### ✅ 정상 작동 중

1. **초기 세그먼트 로드**: ✅
2. **LLM 세그먼트 생성**: ✅ (10개 생성)
3. **디바이스 목록 조회**: ✅
4. **전처리 데이터 수집**: ✅

### ⚠️ 확인 필요

1. **세그먼트 병합**: 로그로 확인 필요
2. **음악 자동 재생**: 로직 확인 필요

### ❌ 문제 발견

1. **음악 파일 404**: `/musics/Carol/Carol_1.mp3` 없음
2. **이미지 파일 404**: `/musics_img/Carol/Carol_1.png` 없음
3. **MusicPlayer 에러**: 파일 없음으로 인한 에러

---

## 🔧 해결 방안

### 즉시 해결 (Short-term)

1. **파일 경로 확인**
   - `public/musics/`, `public/musics_img/` 폴더 존재 여부 확인
   - 없으면 생성 또는 DB 경로 사용

2. **에러 처리 개선**
   - 파일 없을 때 fallback 처리
   - 에러 메시지 개선

3. **로그 추가**
   - 병합 로직 실행 여부 로그
   - 음악 재생 시작 시점 로그

### 장기 해결 (Long-term)

1. **파일 관리 개선**
   - 모든 음악/이미지를 DB에 저장
   - CDN 또는 외부 스토리지 사용

2. **초기 세그먼트 개선**
   - 하드코딩 제거
   - DB 또는 설정 파일에서 가져오기

---

**작성일**: 2025-01-XX  
**상태**: 문제 분석 완료, 해결 방안 제시
