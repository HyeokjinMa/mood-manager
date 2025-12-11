# 🔧 최종 개선 계획서

## 📋 개요

사용자 요청사항에 따른 개선 계획입니다.

**작성일**: 2025-01-XX  
**요청사항**:
1. 세그먼트 병합: 초기 3개 + LLM 앞 7개 = 총 10개
2. 음악/이미지 경로 수정: `/album/` 형식으로 변경
3. 프롬프트 엔지니어링 개선: 60개 음악 내에서만 선택하도록 강화

---

## ✅ 완료된 수정사항

### 1. 세그먼트 병합 전략 수정 ✅

**변경 내용**:
- `keepLlmCount`: 4 → 7
- `llmCount`: 7 → 10 (LLM이 10개 생성)

**결과**:
- 초기 3개 + LLM 앞 7개 = 총 10개 세그먼트
- 마지막 3개(인덱스 7, 8, 9) 버림

**파일**: `src/hooks/useMoodStreamManager.ts`

---

### 2. 음악/이미지 경로 수정 ✅

**변경 내용**:

#### 2.1 초기 세그먼트 경로
- 수정 전: `/musics/Carol/Carol_1.mp3` → 수정 후: `/album/Carol/Carol_01.mp3`
- 수정 전: `/musics_img/Carol/Carol_1.png` → 수정 후: `/album/Carol/All I want for christmas.png`

**파일**: `src/lib/mock/getInitialColdStartSegments.ts`

#### 2.2 이미지 파일 찾기 함수
- 수정 전: `public/musics_img/{genre}/` → 수정 후: `public/album/{genre}/`
- 반환 경로: `/musics_img/` → `/album/`

**파일**: 
- `src/lib/music/findImageFile.ts`
- `src/lib/music/getMusicTrackByID.ts`

---

## ✅ 프롬프트 엔지니어링 개선 완료

### 개선 내용

#### 1. 프롬프트 경고 메시지 강화 ✅

**추가된 내용**:
```
⚠️ CRITICAL: You MUST select music IDs ONLY from 10 to 69.
⚠️ This is the ONLY valid range. Music IDs 1-9 and 70+ are NOT available.
📊 Total available tracks: 60 (Music IDs: 10 to 69)
```

#### 2. 선택 규칙 강화 ✅

**개선된 RULE 1**:
```
⚠️ CRITICAL: Music IDs MUST be between 10 and 69 (inclusive)
⚠️ Music IDs 1-9 and 70+ are INVALID and will cause errors
❌ WRONG format: Do NOT return track titles, descriptions, or numbers outside 10-69
```

**개선된 RULE 2**:
```
- You have 60 tracks available, so you have plenty of options
```

**개선된 RULE 3**:
```
Invalid examples: 5 (too low), 75 (too high), "Song Title" (not a number)
```

#### 3. 장르별 범위 명시 개선 ✅

**개선**: 각 장르별 musicID 범위를 더 명확하게 표시
- 예: `━━━ BALAD GENRE (10 tracks, Music ID: 10-19) ━━━`

#### 4. 최종 경고 메시지 강화 ✅

```
⚠️ REMEMBER: RETURN THE MUSIC ID NUMBER (10-69) ONLY, NOT THE DESCRIPTION.
⚠️ ONLY 60 TRACKS ARE AVAILABLE (Music IDs 10-69). USE ONLY THESE.
```

### 구현 완료

**파일**: `src/lib/music/getAvailableMusicForLLM.ts`

**변경 내용**:
1. 프롬프트 시작 부분에 경고 메시지 추가
2. 선택 규칙에 범위 위반 예시 추가
3. 장르별 musicID 범위 명시 개선
4. 최종 경고 메시지 강화

---

## 🔍 추가 확인 필요

### 1. DB의 Sound 테이블 확인

**확인 필요**:
- `sound.fileUrl` 값이 `/album/` 형식인지 확인
- `sound.albumImageUrl` 값이 올바른지 확인

**확인 방법**:
```sql
SELECT id, name, "fileUrl", "albumImageUrl" 
FROM "Sound" 
WHERE "genreId" IN (SELECT id FROM "Genre" WHERE name = 'Carol')
LIMIT 5;
```

### 2. 파일명 규칙 확인

**확인 필요**:
- 음악 파일: `Carol_01.mp3`, `Carol_02.mp3` 형식인지
- 이미지 파일: 노래 제목과 정확히 일치하는지

**확인 방법**:
```bash
ls /Users/tema/Desktop/mood-manager/Web/public/album/Carol/
```

---

## 📊 수정 파일 목록

### ✅ 완료
1. `src/hooks/useMoodStreamManager.ts` - 병합 전략 수정
2. `src/lib/mock/getInitialColdStartSegments.ts` - 초기 세그먼트 경로 수정
3. `src/lib/music/findImageFile.ts` - 이미지 경로 수정
4. `src/lib/music/getMusicTrackByID.ts` - 이미지 경로 수정

### ✅ 완료된 추가 개선
1. `src/lib/music/getAvailableMusicForLLM.ts` - 프롬프트 강화 ✅

---

## 🧪 테스트 필요

1. **초기 세그먼트 음악/이미지 로드**
   - 음악 파일이 정상 재생되는지
   - 이미지가 정상 표시되는지

2. **LLM 생성 세그먼트 음악/이미지**
   - DB에서 가져온 경로가 올바른지
   - 이미지 매핑이 정상 작동하는지

3. **세그먼트 병합**
   - 초기 3개 + LLM 7개 = 총 10개 확인
   - 마지막 3개가 버려지는지 확인

4. **프롬프트 엔지니어링**
   - LLM이 10-69 범위 내에서만 선택하는지
   - 범위 밖 musicID가 나오는지 확인

---

---

## ✅ 최종 완료 상태

### 수정 완료 항목

1. ✅ **세그먼트 병합 전략**: 초기 3개 + LLM 7개 = 총 10개
2. ✅ **음악/이미지 경로**: `/album/` 형식으로 변경
3. ✅ **프롬프트 엔지니어링**: 60개 음악 범위 강제 강화

### 빌드 상태

✅ **빌드 성공**: 모든 수정사항 반영 완료

---

## 🧪 테스트 체크리스트

### 필수 테스트
- [ ] 초기 세그먼트 음악 파일 재생 확인 (`/album/Carol/Carol_01.mp3`)
- [ ] 초기 세그먼트 이미지 표시 확인 (`/album/Carol/All I want for christmas.png`)
- [ ] LLM 생성 세그먼트 음악/이미지 로드 확인
- [ ] 세그먼트 병합 확인 (초기 3개 + LLM 7개 = 총 10개)
- [ ] LLM이 musicID 10-69 범위 내에서만 선택하는지 확인

### 선택적 테스트
- [ ] 범위 밖 musicID가 생성되는 경우 에러 처리 확인
- [ ] 파일이 없을 때 fallback 처리 확인

---

**작성일**: 2025-01-XX  
**상태**: ✅ 모든 수정 완료, 빌드 성공
